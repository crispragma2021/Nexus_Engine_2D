// Deterministic tests for the LLM gateway (block 3): context/prompt builders,
// response parsing (the trust boundary between model output and the plan
// pipeline), and endpoint safety. No network access is used: only the pure
// functions are exercised here.

import test from "node:test";
import assert from "node:assert/strict";

import {
  buildModelContext,
  buildModelMessages,
  buildToolCatalog,
  parseModelPlan,
  planFromModel,
  type LlmProviderConfig,
} from "../src/lib/agent/model.ts";
import { TOOL_REGISTRY } from "../src/lib/agent/tools.ts";
import { validatePlan } from "../src/lib/agent/validator.ts";
import type { GDProject } from "../src/lib/editor/types.ts";

// ---------------------------------------------------------------------------
// Fixture (compact; same shape as the other agent suites)
// ---------------------------------------------------------------------------

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
          {
            id: "obj_moneda",
            name: "Moneda",
            type: "Sprite",
            asset: "player.png",
            animations: [],
            behaviors: [],
            effects: [],
            variables: [],
          },
        ],
        instances: [
          {
            id: "inst_jugador",
            objectId: "obj_jugador",
            x: 10,
            y: 20,
            angle: 0,
            customSize: false,
            width: 64,
            height: 64,
            zOrder: 0,
            layer: "Base layer",
            locked: false,
            hiddenAtStart: false,
            variables: [],
            effects: [],
          },
        ],
        events: [],
        variables: [{ name: "puntos", type: "number", value: "0", children: [] }],
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
    resources: [
      {
        name: "player.png",
        kind: "image",
        file: "player.png",
        url: "data:image/png;base64,SECRETO_LONGO_QUE_NUNCA_DEBE_APARECER",
      },
    ],
    globalVariables: [],
    extensions: [],
    externalEvents: [],
    externalLayouts: [],
  };
}

const PROVIDER: LlmProviderConfig = {
  endpoint: "https://example.invalid/v1/chat/completions",
  model: "test-model",
  token: "token-super-secreto",
};

// ---------------------------------------------------------------------------
// Context + prompt builders
// ---------------------------------------------------------------------------

test("buildModelContext incluye nombres de escena, objetos e instancias", () => {
  const context = buildModelContext(fixtureProject(), "Nivel 1");
  assert.ok(context.includes("Nivel 1"));
  assert.ok(context.includes("Jugador"));
  assert.ok(context.includes("Moneda"));
  assert.ok(context.includes("inst_jugador"));
  assert.ok(context.includes("puntos"));
});

test("buildModelContext nunca expone el contenido de los recursos (data URLs)", () => {
  const context = buildModelContext(fixtureProject(), "Nivel 1");
  assert.ok(!context.includes("SECRETO_LONGO_QUE_NUNCA_DEBE_APARECER"));
  assert.ok(context.includes("player.png")); // solo el nombre
});

test("buildModelMessages: el system prompt solo anuncia herramientas soportadas", () => {
  const messages = buildModelMessages("hola", fixtureProject(), "Nivel 1");
  assert.equal(messages.length, 2);
  assert.equal(messages[0]!.role, "system");
  const system = messages[0]!.content;
  const supported = Object.values(TOOL_REGISTRY).filter((tool) => tool.supported);
  for (const tool of supported) {
    assert.ok(system.includes(tool.name), `falta la herramienta soportada ${tool.name}`);
  }
  const unsupported = Object.values(TOOL_REGISTRY).filter((tool) => !tool.supported);
  for (const tool of unsupported) {
    assert.ok(!system.includes(tool.name), `anuncia una herramienta no soportada: ${tool.name}`);
  }
});

test("buildModelMessages: el mensaje de usuario lleva la instrucción y el contexto", () => {
  const messages = buildModelMessages("mueve Jugador a 100,100", fixtureProject(), "Nivel 1");
  assert.ok(messages[1]!.content.includes("mueve Jugador a 100,100"));
  assert.ok(messages[1]!.content.includes("Nivel 1"));
});

test("buildToolCatalog: una línea por herramienta soportada con payload", () => {
  const catalog = buildToolCatalog();
  assert.ok(catalog.includes("create_instance"));
  assert.ok(catalog.includes("Payload:"));
});

// ---------------------------------------------------------------------------
// parseModelPlan: la frontera de confianza
// ---------------------------------------------------------------------------

test("parseModelPlan: JSON limpio con ids existentes → plan válido", () => {
  const project = fixtureProject();
  const raw = JSON.stringify({
    summary: "Muevo al jugador",
    sceneName: "Nivel 1",
    operations: [
      {
        type: "move_instance",
        payload: { sceneName: "Nivel 1", instanceId: "inst_jugador", x: 100, y: 100 },
      },
    ],
  });
  const { plan, reason } = parseModelPlan(raw, project);
  assert.equal(reason, undefined);
  assert.ok(plan);
  assert.equal(plan!.operations.length, 1);
  assert.equal(plan!.operations[0]!.type, "move_instance");
  assert.ok(typeof plan!.operations[0]!.id === "string" && plan!.operations[0]!.id.length > 0);
  assert.equal(validatePlan(plan!, project).ok, true);
});

test("parseModelPlan: tolera bloques de código ```json```", () => {
  const project = fixtureProject();
  const raw =
    "```json\n" +
    JSON.stringify({
      summary: "Crea escena",
      operations: [{ type: "create_scene", payload: { name: "Nivel 2" } }],
    }) +
    "\n```";
  const { plan, reason } = parseModelPlan(raw, project);
  assert.equal(reason, undefined);
  assert.ok(plan);
});

test("parseModelPlan: herramienta inexistente → razón honesta, sin plan", () => {
  const project = fixtureProject();
  const raw = JSON.stringify({
    summary: "mágica",
    operations: [{ type: "launch_rocket", payload: { fuel: 10 } }],
  });
  const { plan, reason } = parseModelPlan(raw, project);
  assert.equal(plan, null);
  assert.ok(reason?.includes("launch_rocket"));
});

test("parseModelPlan: id alucinado (no existe en el proyecto) → rechazado", () => {
  const project = fixtureProject();
  const raw = JSON.stringify({
    summary: "instancia fantasma",
    operations: [
      {
        type: "create_instance",
        payload: { sceneName: "Nivel 1", objectId: "obj_fantasma", x: 0, y: 0 },
      },
    ],
  });
  const { plan, reason } = parseModelPlan(raw, project);
  assert.equal(plan, null);
  assert.match(reason ?? "", /validación/);
});

test("parseModelPlan: rechazo explícito del modelo ({error})", () => {
  const project = fixtureProject();
  const raw = JSON.stringify({ error: "No puedo generar sprites." });
  const { plan, reason } = parseModelPlan(raw, project);
  assert.equal(plan, null);
  assert.equal(reason, "No puedo generar sprites.");
});

test("parseModelPlan: sin operaciones → razón", () => {
  const project = fixtureProject();
  assert.equal(parseModelPlan(JSON.stringify({ summary: "nada" }), project).plan, null);
  assert.equal(parseModelPlan(JSON.stringify({ operations: [] }), project).plan, null);
});

test("parseModelPlan: basura no-JSON → razón", () => {
  const project = fixtureProject();
  const { plan, reason } = parseModelPlan("¡Hola! No sé JSON.", project);
  assert.equal(plan, null);
  assert.ok(reason);
});

test("parseModelPlan: los ids del modelo se ignoran (se reasignan de cero)", () => {
  const project = fixtureProject();
  const raw = JSON.stringify({
    summary: "id inyectado",
    operations: [{ id: "op_inyectado_1", type: "create_scene", payload: { name: "Nivel 3" } }],
  });
  const { plan, reason } = parseModelPlan(raw, project);
  assert.equal(reason, undefined);
  assert.ok(plan);
  assert.notEqual(plan!.operations[0]!.id, "op_inyectado_1");
  assert.ok(plan!.operations[0]!.id.startsWith("op_"));
});

test("planFromModel: rechaza endpoints no-https remotos sin hacer red", async () => {
  const result = await planFromModel({
    instruction: "crea una escena",
    project: fixtureProject(),
    activeSceneName: "Nivel 1",
    provider: { endpoint: "http://192.168.0.10/v1/chat/completions" },
  });
  assert.equal(result.plan, null);
  assert.match(result.reason ?? "", /HTTPS/);
});

test("planFromModel: rechaza URLs inválidas sin hacer red", async () => {
  const result = await planFromModel({
    instruction: "crea una escena",
    project: fixtureProject(),
    activeSceneName: "Nivel 1",
    provider: { endpoint: "no es una url" },
  });
  assert.equal(result.plan, null);
  assert.ok(result.reason);
});

test("planFromModel: la razón de error nunca contiene el token", async () => {
  const result = await planFromModel({
    instruction: "crea una escena",
    project: fixtureProject(),
    activeSceneName: "Nivel 1",
    provider: { endpoint: "not-a-url", ...PROVIDER },
  });
  assert.equal(result.plan, null);
  assert.ok(!result.reason?.includes("token-super-secreto"));
});
