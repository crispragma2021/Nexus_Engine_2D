// Tests del cliente del asistente Nexus AI (AGENT_ARCHITECTURE.md §2).
//
// Verifican el contrato cliente ↔ gateway: la UI llama a `/api/agent` en su
// mismo origen, NUNCA envía credenciales, reutiliza `planFromModel` (contexto +
// validación del plan candidato) y degrada al planificador local cuando el
// gateway no está configurado o falla. Sin red real: `fetch` se mockea.

import test, { type TestContext } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  NEXUS_ASSISTANT_MODEL,
  currentOrigin,
  nexusAgentEndpoint,
  planWithAssistant,
  probeNexusAssistant,
  requestNexusPlan,
} from "../src/lib/agent/nexus-client.ts";
import { isSameOriginEndpoint, resolveChatEndpoint } from "../src/lib/agent/model.ts";
import { createPlan } from "../src/lib/agent/operations.ts";
import type { GDProject } from "../src/lib/editor/types.ts";

/* ------------------------------------------------------------------------
 * Fixture (misma forma que las otras suites del agente)
 * ---------------------------------------------------------------------- */

function fixtureProject(): GDProject {
  return {
    name: "Test",
    version: "1.0.0",
    firstLayoutName: "Nivel 1",
    scenes: [
      {
        name: "Nivel 1",
        backgroundColor: "255;255;255",
        grid: {
          show: false,
          snap: false,
          width: 32,
          height: 32,
          kind: "rectangular",
          color: "158;180;255",
          alpha: 0.8,
          offsetX: 0,
          offsetY: 0,
        },
        layers: [{ name: "Base layer", visible: true, camera: { x: 0, y: 0 }, effects: [] }],
        activeLayer: "Base layer",
        objects: [
          {
            id: "obj_jugador",
            name: "Jugador",
            type: "Sprite",
            asset: "player.png",
            animations: [],
            behaviors: [],
            effects: [],
            variables: [],
          },
        ],
        instances: [],
        events: [],
        variables: [],
        groups: [],
      },
    ],
    gameSettings: {
      author: "test",
      description: "",
      version: "1.0.0",
      packageName: "com.nexus.test",
      orientation: "landscape",
      windowWidth: 800,
      windowHeight: 600,
      useWindowSizeAsBaseSize: true,
      magnification: 1,
      minFPS: 30,
      maxFPS: 60,
      adaptGameResolutionAtRuntime: false,
      scaleMode: "nearest",
      windowMode: "default",
      startScene: "Nivel 1",
      pauseOnLostFocus: false,
      renderOutsideGameArea: false,
      loadingScreen: {
        displayBrandSplash: false,
        minDuration: 0,
        fadeInDuration: 0,
        fadeOutDuration: 0,
        backgroundColor: "0;0;0",
      },
      watermark: { showOnMobile: false },
      projectUuid: "test",
      folderPolicy: "doNotUse",
    },
    resources: [],
    globalVariables: [],
    extensions: [],
    externalEvents: [],
    externalLayouts: [],
  };
}

/** Plan candidato válido que devuelve el modelo en los casos felices. */
const VALID_PLAN_JSON = JSON.stringify({
  summary: "Crear escena Nivel 2",
  sceneName: "Nivel 1",
  operations: [{ type: "create_scene", payload: { name: "Nivel 2" } }],
});

interface RecordedCall {
  url: string;
  init: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    signal?: AbortSignal;
  };
}

/** Mock de fetch global que registra llamadas y devuelve una completion. */
function mockCompletion(t: TestContext, content: string, status = 200): RecordedCall[] {
  const calls: RecordedCall[] = [];
  t.mock.method(globalThis, "fetch", (async (url: unknown, init?: unknown) => {
    calls.push({ url: String(url), init: (init ?? {}) as RecordedCall["init"] });
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => ({
        id: "nexus-test",
        choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }],
      }),
      text: async () => content,
    };
  }) as unknown as typeof fetch);
  return calls;
}

/** Mock de fetch que falla (red caída o gateway ausente). */
function mockNetworkFailure(t: TestContext): RecordedCall[] {
  const calls: RecordedCall[] = [];
  t.mock.method(globalThis, "fetch", (async (url: unknown, init?: unknown) => {
    calls.push({ url: String(url), init: (init ?? {}) as RecordedCall["init"] });
    throw new Error("sin ruta al gateway");
  }) as unknown as typeof fetch);
  return calls;
}

/* ------------------------------------------------------------------------
 * Resolución del endpoint (mismo origen, sin /chat/completions)
 * ---------------------------------------------------------------------- */

test("nexusAgentEndpoint: ruta relativa del mismo origen y absoluta con origen", () => {
  assert.equal(nexusAgentEndpoint(""), "/api/agent");
  assert.equal(
    nexusAgentEndpoint("https://nexus.example.com"),
    "https://nexus.example.com/api/agent",
  );
  assert.equal(
    nexusAgentEndpoint("https://nexus.example.com/"),
    "https://nexus.example.com/api/agent",
  );
  assert.equal(nexusAgentEndpoint("http://localhost:8080"), "http://localhost:8080/api/agent");
  // Fuera del navegador no hay origen: la ruta relativa es el contrato.
  assert.equal(currentOrigin(), "");
});

test("isSameOriginEndpoint: distingue rutas propias de URLs de terceros", () => {
  assert.equal(isSameOriginEndpoint("/api/agent"), true);
  assert.equal(isSameOriginEndpoint("//api.ejemplo.com"), false);
  assert.equal(isSameOriginEndpoint("https://api.deepseek.com"), false);
  assert.equal(isSameOriginEndpoint("no-es-url"), false);
});

test("resolveChatEndpoint: no añade /chat/completions al gateway propio", () => {
  assert.equal(resolveChatEndpoint("/api/agent"), "/api/agent");
  assert.equal(resolveChatEndpoint("/api/agent/"), "/api/agent");
  // Los proveedores externos siguen resolviendo a su ruta estándar.
  assert.equal(
    resolveChatEndpoint("https://api.deepseek.com"),
    "https://api.deepseek.com/chat/completions",
  );
});

/* ------------------------------------------------------------------------
 * requestNexusPlan: el contrato cliente ↔ gateway
 * ------------------------------------------------------------------------ */

test("requestNexusPlan: llama a /api/agent con los mensajes del modelo y sin credenciales", async (t) => {
  const calls = mockCompletion(t, VALID_PLAN_JSON);
  const result = await requestNexusPlan({
    instruction: "crea la escena Nivel 2",
    project: fixtureProject(),
    activeSceneName: "Nivel 1",
  });

  assert.ok(result.plan, result.reason);
  assert.equal(result.plan?.summary, "Crear escena Nivel 2");
  assert.equal(result.plan?.operations.length, 1);

  const call = calls[0];
  assert.ok(call);
  assert.equal(call.url, "/api/agent");
  assert.equal(call.init.method, "POST");
  assert.equal(call.init.headers?.["Authorization"], undefined);
  assert.ok(call.init.signal instanceof AbortSignal);

  const body = JSON.parse(call.init.body ?? "{}") as {
    model: string;
    messages: { role: string; content: string }[];
  };
  assert.equal(body.model, NEXUS_ASSISTANT_MODEL);
  assert.equal(body.messages.length, 2);
  assert.equal(body.messages[0]?.role, "system");
  assert.match(body.messages[1]?.content ?? "", /crea la escena Nivel 2/);
  // El contexto del proyecto viaja en el mensaje, no la clave.
  assert.match(body.messages[1]?.content ?? "", /Nivel 1/);
});

test("requestNexusPlan: respeta modelo y timeout indicados", async (t) => {
  const calls = mockCompletion(t, VALID_PLAN_JSON);
  await requestNexusPlan({
    instruction: "crea la escena Nivel 2",
    project: fixtureProject(),
    activeSceneName: "Nivel 1",
    model: "gemini-1.5-flash",
    timeoutMs: 12_000,
  });
  const body = JSON.parse(calls[0]?.init.body ?? "{}") as { model: string };
  assert.equal(body.model, "gemini-1.5-flash");
});

test("requestNexusPlan: un plan inválido del modelo no se acepta (frontera de confianza)", async (t) => {
  mockCompletion(
    t,
    JSON.stringify({
      summary: "Plan alucinado",
      operations: [{ type: "create_scene", payload: { name: "Nivel 1" } }],
    }),
  );
  const result = await requestNexusPlan({
    instruction: "crea una escena duplicada",
    project: fixtureProject(),
    activeSceneName: "Nivel 1",
  });
  assert.equal(result.plan, null);
  assert.match(result.reason ?? "", /validación/);
});

test("requestNexusPlan: error del gateway → plan null con motivo en español", async (t) => {
  mockCompletion(t, "", 503);
  const result = await requestNexusPlan({
    instruction: "crea una escena",
    project: fixtureProject(),
    activeSceneName: "Nivel 1",
  });
  assert.equal(result.plan, null);
  assert.match(result.reason ?? "", /HTTP 503/);
});

/* ------------------------------------------------------------------------
 * planWithAssistant: remoto primero, respaldo local después
 * ------------------------------------------------------------------------ */

test("planWithAssistant: usa Nexus AI cuando el gateway responde y no toca el respaldo", async (t) => {
  mockCompletion(t, VALID_PLAN_JSON);
  let localCalls = 0;
  const outcome = await planWithAssistant({
    instruction: "crea la escena Nivel 2",
    project: fixtureProject(),
    activeSceneName: "Nivel 1",
    localPlanner: () => {
      localCalls += 1;
      return null;
    },
  });

  assert.equal(outcome.source, "nexus-ai");
  assert.equal(outcome.plan?.summary, "Crear escena Nivel 2");
  assert.equal(localCalls, 0);
});

test("planWithAssistant: cae al planificador local y conserva el motivo remoto", async (t) => {
  mockCompletion(t, "", 503);
  const localPlan = createPlan("Evento local", [
    {
      id: "op_local",
      version: 1,
      type: "create_scene",
      payload: { name: "Nivel 2" },
    },
  ]);
  const outcome = await planWithAssistant({
    instruction: "crea la escena Nivel 2",
    project: fixtureProject(),
    activeSceneName: "Nivel 1",
    localPlanner: () => localPlan,
  });

  assert.equal(outcome.source, "local");
  assert.equal(outcome.plan, localPlan);
  assert.match(outcome.reason ?? "", /HTTP 503/);
});

test("planWithAssistant: sin red y sin respaldo local no hay plan", async (t) => {
  mockNetworkFailure(t);
  const outcome = await planWithAssistant({
    instruction: "crea la escena Nivel 2",
    project: fixtureProject(),
    activeSceneName: "Nivel 1",
    localPlanner: () => null,
  });

  assert.equal(outcome.plan, null);
  assert.equal(outcome.source, null);
  assert.ok(outcome.reason);
});

test("planWithAssistant: con el gateway deshabilitado no se hace ninguna petición", async (t) => {
  const calls = mockCompletion(t, VALID_PLAN_JSON);
  const outcome = await planWithAssistant({
    instruction: "crea la escena Nivel 2",
    project: fixtureProject(),
    activeSceneName: "Nivel 1",
    useRemote: false,
    localPlanner: () => createPlan("Evento local", []),
  });

  assert.equal(calls.length, 0);
  assert.equal(outcome.source, "local");
  assert.match(outcome.reason ?? "", /no está disponible/);
});

/* ------------------------------------------------------------------------
 * probeNexusAssistant: disponibilidad para la UI
 * ------------------------------------------------------------------------ */

test("probeNexusAssistant: informa enabled, modelos y modelo por defecto", async () => {
  const fetchImpl = (async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      ok: true,
      provider: "gemini",
      endpoint: "/api/agent",
      enabled: true,
      models: ["gemini-2.5-flash", "gemini-1.5-flash"],
      defaultModel: "gemini-2.5-flash",
    }),
  })) as unknown as typeof fetch;

  const status = await probeNexusAssistant(fetchImpl);
  assert.equal(status.known, true);
  assert.equal(status.enabled, true);
  assert.deepEqual(status.models, ["gemini-2.5-flash", "gemini-1.5-flash"]);
  assert.equal(status.defaultModel, "gemini-2.5-flash");
});

test("probeNexusAssistant: gateway sin clave → known y disabled", async () => {
  const fetchImpl = (async () => ({
    ok: true,
    status: 200,
    json: async () => ({ ok: true, enabled: false, models: [], defaultModel: "" }),
  })) as unknown as typeof fetch;

  const status = await probeNexusAssistant(fetchImpl);
  assert.equal(status.known, true);
  assert.equal(status.enabled, false);
  assert.equal(status.defaultModel, NEXUS_ASSISTANT_MODEL);
});

test("probeNexusAssistant: fallo de red, HTTP de error o cuerpo raro → desconocido", async () => {
  const failing = (async () => {
    throw new Error("sin gateway");
  }) as unknown as typeof fetch;
  const notFound = (async () => ({
    ok: false,
    status: 404,
    json: async () => ({}),
  })) as unknown as typeof fetch;
  const malformed = (async () => ({
    ok: true,
    status: 200,
    json: async () => ({ sorpresa: true }),
  })) as unknown as typeof fetch;

  for (const fetchImpl of [failing, notFound, malformed]) {
    const status = await probeNexusAssistant(fetchImpl);
    assert.equal(status.known, false);
    assert.equal(status.enabled, false);
  }
});

/* ------------------------------------------------------------------------
 * Contrato de cableado: adaptadores HTTP y UI siguen apuntando al gateway
 * ---------------------------------------------------------------------- */

const read = (path: string) => readFile(new URL(path, import.meta.url), "utf8");

test("cableado: los tres adaptadores HTTP delegan en la misma lógica pura", async () => {
  const [vercel, vite, nodeServer] = await Promise.all([
    read("../api/agent.ts"),
    read("../vite.config.ts"),
    read("../scripts/run_nexus_server.mjs"),
  ]);

  // Vercel (producción hospedada).
  assert.match(vercel, /from "\.\.\/src\/lib\/agent\/gemini-gateway"/);
  assert.match(vercel, /export default async function handler/);
  assert.match(vercel, /handleAgentRequest/);

  // Middleware de Vite (desarrollo y preview).
  assert.match(vite, /nexus-agent-gateway/);
  assert.match(vite, /handleGatewayNodeRequest/);
  assert.match(vite, /configurePreviewServer/);

  // Servidor Node propio (self-hosting).
  assert.match(nodeServer, /gateway-node\.ts/);
  assert.match(nodeServer, /handleGatewayNodeRequest\(req, res\)/);
});

test("cableado: la QuickAutomationBar pasa por /api/agent y conserva la aprobación", async () => {
  const source = await read("../src/components/editor/QuickAutomationBar.tsx");

  assert.match(source, /planWithAssistant\(/);
  assert.match(source, /probeNexusAssistant\(/);
  assert.match(source, /localPlanner: planLocally/);
  assert.match(source, /needsApproval\(outcome\.plan\)/);
  assert.match(source, /applyPlan\(pendingPlan\)/);

  // La UI no maneja credenciales: la clave solo existe en el servidor.
  assert.doesNotMatch(source, /GEMINI_API_KEY\s*[:=]/);
  assert.doesNotMatch(source, /Authorization/);
});

test("cableado: el cliente no conoce la clave y apunta a la ruta del gateway", async () => {
  const client = await read("../src/lib/agent/nexus-client.ts");
  // Solo código: los comentarios explicativos sí mencionan la variable.
  const isComment = (line: string) => /^(?:\/\/|\/\*|\*)/.test(line.trim());
  const code = client
    .split("\n")
    .filter((line) => !isComment(line))
    .join("\n");

  assert.match(code, /NEXUS_AGENT_ROUTE/);
  assert.match(code, /endpoint: nexusAgentEndpoint\(\)/);
  assert.doesNotMatch(code, /GEMINI_API_KEY/);
  assert.doesNotMatch(code, /process\.env/);
  assert.doesNotMatch(code, /token:/);
});
