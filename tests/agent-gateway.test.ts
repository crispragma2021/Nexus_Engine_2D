// Tests del gateway Nexus AI (`/api/agent` → Gemini) y de su adaptador Node.
//
// Todo es determinista y sin red real: `fetch` se inyecta como doble. Se cubre
// la frontera de confianza descrita en AGENT_ARCHITECTURE.md §1: la clave vive
// solo en el entorno del servidor, el modelo está en lista blanca, la carga útil
// está acotada, hay timeout duro y ningún camino devuelve el secreto.

import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_GEMINI_MODEL,
  GEMINI_CHAT_COMPLETIONS_URL,
  GEMINI_MODELS,
  MAX_GATEWAY_MESSAGES,
  MAX_MESSAGE_CHARS,
  NEXUS_AGENT_ROUTE,
  buildGeminiRequest,
  clampNumber,
  extractUpstreamContent,
  gatewayError,
  handleAgentGet,
  handleAgentPost,
  handleAgentRequest,
  readGeminiApiKey,
  resolveGeminiModel,
  resolveGatewayTimeoutMs,
  sanitizeGatewayRequest,
  scrubSecret,
  toGatewayCompletion,
  type GatewayRequest,
} from "../src/lib/agent/gemini-gateway.ts";
import {
  MAX_NODE_BODY_BYTES,
  gatewayPathOf,
  handleGatewayNodeRequest,
  isGatewayRequest,
  readJsonBody,
  writeGatewayResponse,
  type GatewayNodeRequest,
} from "../src/lib/agent/gateway-node.ts";

const API_KEY = "AIzaSyPRUEBA-GEMINI-CLAVE-DEL-SERVIDOR";
const ENV = { GEMINI_API_KEY: API_KEY };

/* ------------------------------------------------------------------------
 * Dobles mínimos
 * ---------------------------------------------------------------------- */

interface StubResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
}

interface FetchCall {
  url: string;
  init: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    signal?: AbortSignal;
  };
}

function jsonResponse(status: number, body: unknown): StubResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

/** Doble de fetch que registra las llamadas y responde lo que se le indique. */
function stubFetch(responder: (call: FetchCall) => StubResponse | Promise<StubResponse>): {
  fetchImpl: typeof fetch;
  calls: FetchCall[];
} {
  const calls: FetchCall[] = [];
  const fetchImpl = (async (url: unknown, init?: unknown) => {
    const call: FetchCall = {
      url: String(url),
      init: (init ?? {}) as FetchCall["init"],
    };
    calls.push(call);
    return responder(call);
  }) as unknown as typeof fetch;
  return { fetchImpl, calls };
}

function completionResponse(content: string, status = 200): StubResponse {
  return jsonResponse(status, {
    id: "gemini-1",
    choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }],
    usage: { prompt_tokens: 12, completion_tokens: 34, total_tokens: 46 },
  });
}

function fakeRequest(method: string, url: string, body?: unknown): GatewayNodeRequest {
  const payload = body === undefined ? "" : JSON.stringify(body);
  return {
    method,
    url,
    [Symbol.asyncIterator]: () =>
      (async function* () {
        if (payload) yield payload;
      })(),
  };
}

function fakeResponse() {
  const headers: Record<string, string> = {};
  let body = "";
  return {
    statusCode: 0 as number | undefined,
    setHeader(name: string, value: string | number | readonly string[]) {
      headers[name] = String(value);
      return this;
    },
    end(chunk?: unknown) {
      body = typeof chunk === "string" ? chunk : "";
      return this;
    },
    headers,
    body: () => body,
    json: () => JSON.parse(body) as unknown,
  };
}

/* ------------------------------------------------------------------------
 * Credenciales: solo servidor, nunca en la respuesta
 * ---------------------------------------------------------------------- */

test("readGeminiApiKey: lee la clave del servidor, la recorta y admite el alias de Google", () => {
  assert.equal(readGeminiApiKey({ GEMINI_API_KEY: `  ${API_KEY}  ` }), API_KEY);
  assert.equal(readGeminiApiKey({ GOOGLE_API_KEY: API_KEY }), API_KEY);
  // GEMINI_API_KEY tiene prioridad sobre el alias.
  assert.equal(readGeminiApiKey({ GEMINI_API_KEY: API_KEY, GOOGLE_API_KEY: "otra" }), API_KEY);
});

test("readGeminiApiKey: sin clave utilizable devuelve null (asistente deshabilitado)", () => {
  assert.equal(readGeminiApiKey({}), null);
  assert.equal(readGeminiApiKey({ GEMINI_API_KEY: "" }), null);
  assert.equal(readGeminiApiKey({ GEMINI_API_KEY: "   " }), null);
  assert.equal(readGeminiApiKey({ VITE_GEMINI_API_KEY: API_KEY }), null);
});

test("handleAgentPost: sin clave en el servidor responde 503 y no hace red", async () => {
  const { fetchImpl, calls } = stubFetch(() => completionResponse("{}"));
  const result = await handleAgentPost({ instruction: "crea una escena" }, { env: {}, fetchImpl });

  assert.equal(result.status, 503);
  assert.equal(calls.length, 0);
  const body = result.body as { error: { message: string; type: string } };
  assert.equal(body.error.type, "configuration_error");
  assert.match(body.error.message, /GEMINI_API_KEY/);
});

test("handleAgentPost: ninguna respuesta del gateway contiene la clave del servidor", async () => {
  const { fetchImpl } = stubFetch(() => completionResponse('{"summary":"ok","operations":[]}'));
  const bodies: string[] = [];

  bodies.push(
    JSON.stringify((await handleAgentPost({ instruction: "hola" }, { env: ENV, fetchImpl })).body),
  );
  bodies.push(JSON.stringify((await handleAgentPost(null, { env: ENV, fetchImpl })).body));
  bodies.push(
    JSON.stringify((await handleAgentPost({ messages: [] }, { env: ENV, fetchImpl })).body),
  );
  bodies.push(JSON.stringify(handleAgentGet({ env: ENV }).body));

  for (const body of bodies) {
    assert.ok(!body.includes(API_KEY), `la clave se filtró en: ${body}`);
  }
});

test("handleAgentPost: descarta credenciales enviadas por el cliente", async () => {
  const { fetchImpl, calls } = stubFetch(() => completionResponse("hola"));
  await handleAgentPost(
    {
      instruction: "crea una escena",
      api_key: "clave-del-cliente",
      apiKey: "clave-del-cliente",
      token: "clave-del-cliente",
      authorization: "Bearer clave-del-cliente",
    },
    { env: ENV, fetchImpl },
  );

  const call = calls[0];
  assert.ok(call);
  assert.equal(call.init.headers?.["Authorization"], `Bearer ${API_KEY}`);
  assert.ok(!call.init.body?.includes("clave-del-cliente"));
  // La clave del servidor viaja solo en la cabecera, nunca en el cuerpo.
  assert.ok(!call.init.body?.includes(API_KEY));
});

/* ------------------------------------------------------------------------
 * Modelo en lista blanca y saneado de la petición
 * ---------------------------------------------------------------------- */

test("resolveGeminiModel: restringe a la lista blanca y cae al predeterminado", () => {
  assert.equal(resolveGeminiModel("gemini-1.5-flash"), "gemini-1.5-flash");
  assert.equal(resolveGeminiModel("  GEMINI-2.5-FLASH "), "gemini-2.5-flash");
  assert.equal(resolveGeminiModel("gemini-9-ultra"), DEFAULT_GEMINI_MODEL);
  assert.equal(resolveGeminiModel("gpt-4o"), DEFAULT_GEMINI_MODEL);
  assert.equal(resolveGeminiModel(undefined), DEFAULT_GEMINI_MODEL);
  assert.equal(resolveGeminiModel(42), DEFAULT_GEMINI_MODEL);
  assert.ok(GEMINI_MODELS.includes(DEFAULT_GEMINI_MODEL));
});

test("sanitizeGatewayRequest: acepta la forma OpenAI y la forma breve de Nexus", () => {
  const openai = sanitizeGatewayRequest({
    model: "gemini-1.5-flash",
    messages: [
      { role: "system", content: "Eres el agente." },
      { role: "user", content: "Crea una escena" },
    ],
    temperature: 0.4,
    max_tokens: 900,
  });
  assert.equal(openai.ok, true);
  if (openai.ok) {
    assert.equal(openai.request.model, "gemini-1.5-flash");
    assert.equal(openai.request.messages.length, 2);
    assert.equal(openai.request.temperature, 0.4);
    assert.equal(openai.request.maxTokens, 900);
  }

  const brief = sanitizeGatewayRequest({ instruction: "  Crea una escena  " });
  assert.equal(brief.ok, true);
  if (brief.ok) {
    assert.deepEqual(brief.request.messages, [{ role: "user", content: "Crea una escena" }]);
    assert.equal(brief.request.model, DEFAULT_GEMINI_MODEL);
    assert.equal(brief.request.temperature, 0.2);
    assert.equal(brief.request.maxTokens, 2_000);
  }
});

test("sanitizeGatewayRequest: rechaza cuerpos inválidos con 400", () => {
  for (const body of [null, "texto", 42, [], { messages: "no-lista" }]) {
    const result = sanitizeGatewayRequest(body);
    assert.equal(result.ok, false, `se esperaba rechazo para ${JSON.stringify(body)}`);
    if (!result.ok) assert.equal(result.status, 400);
  }
});

test("sanitizeGatewayRequest: rechaza mensajes vacíos, roles raros y contenido no textual", () => {
  const cases: unknown[] = [
    { messages: [] },
    { messages: [{ role: "root", content: "hola" }] },
    { messages: [{ role: "user", content: "" }] },
    { messages: [{ role: "user", content: "   " }] },
    { messages: [{ role: "user" }] },
    { messages: [{ content: "sin rol" }] },
    { messages: ["texto"] },
    {},
  ];
  for (const body of cases) {
    const result = sanitizeGatewayRequest(body);
    assert.equal(result.ok, false, `se esperaba rechazo para ${JSON.stringify(body)}`);
    if (!result.ok) assert.equal(result.status, 400);
  }
});

test("sanitizeGatewayRequest: acota mensajes y caracteres con 413", () => {
  const tooMany = sanitizeGatewayRequest({
    messages: Array.from({ length: MAX_GATEWAY_MESSAGES + 1 }, () => ({
      role: "user",
      content: "hola",
    })),
  });
  assert.equal(tooMany.ok, false);
  if (!tooMany.ok) assert.equal(tooMany.status, 413);

  const tooLong = sanitizeGatewayRequest({
    messages: [{ role: "user", content: "a".repeat(MAX_MESSAGE_CHARS + 1) }],
  });
  assert.equal(tooLong.ok, false);
  if (!tooLong.ok) assert.equal(tooLong.status, 413);

  const tooLongInstruction = sanitizeGatewayRequest({
    instruction: "a".repeat(MAX_MESSAGE_CHARS + 1),
  });
  assert.equal(tooLongInstruction.ok, false);
  if (!tooLongInstruction.ok) assert.equal(tooLongInstruction.status, 413);
});

test("sanitizeGatewayRequest: recorta temperature y max_tokens fuera de rango", () => {
  const hot = sanitizeGatewayRequest({ instruction: "hola", temperature: 9, max_tokens: 999_999 });
  assert.equal(hot.ok, true);
  if (hot.ok) {
    assert.equal(hot.request.temperature, 1);
    assert.equal(hot.request.maxTokens, 2_000);
  }

  const cold = sanitizeGatewayRequest({
    instruction: "hola",
    temperature: -3,
    max_completion_tokens: 0,
  });
  assert.equal(cold.ok, true);
  if (cold.ok) {
    assert.equal(cold.request.temperature, 0);
    assert.equal(cold.request.maxTokens, 1);
  }
});

test("clampNumber: usa el valor por defecto ante entradas no numéricas", () => {
  assert.equal(clampNumber(undefined, 5, 0, 10), 5);
  assert.equal(clampNumber("7", 5, 0, 10), 5);
  assert.equal(clampNumber(Number.NaN, 5, 0, 10), 5);
  assert.equal(clampNumber(50, 5, 0, 10), 10);
  assert.equal(clampNumber(-50, 5, 0, 10), 0);
});

test("resolveGatewayTimeoutMs: honra la variable de entorno dentro de los límites", () => {
  assert.equal(resolveGatewayTimeoutMs({}), 45_000);
  assert.equal(resolveGatewayTimeoutMs({ NEXUS_AGENT_TIMEOUT_MS: "20000" }), 20_000);
  assert.equal(resolveGatewayTimeoutMs({ NEXUS_AGENT_TIMEOUT_MS: "1" }), 5_000);
  assert.equal(resolveGatewayTimeoutMs({ NEXUS_AGENT_TIMEOUT_MS: "999999" }), 120_000);
  assert.equal(resolveGatewayTimeoutMs({ NEXUS_AGENT_TIMEOUT_MS: "abc" }), 45_000);
});

test("scrubSecret: redacta el secreto, acota el texto y normaliza espacios", () => {
  assert.equal(
    scrubSecret(`fallo con ${API_KEY} en Gemini`, API_KEY),
    "fallo con [redactado] en Gemini",
  );
  assert.equal(scrubSecret("a".repeat(400), API_KEY).length, 300);
  assert.equal(scrubSecret("  mucho   espacio \n", null), "mucho espacio");
  assert.equal(scrubSecret(undefined, API_KEY), "");
});

/* ------------------------------------------------------------------------
 * Petición upstream
 * ---------------------------------------------------------------------- */

const REQUEST: GatewayRequest = {
  model: DEFAULT_GEMINI_MODEL,
  messages: [
    { role: "system", content: "Eres el agente." },
    { role: "user", content: "Crea una escena" },
  ],
  temperature: 0.2,
  maxTokens: 2_000,
};

test("buildGeminiRequest: apunta al endpoint OpenAI de Gemini con la clave en la cabecera", () => {
  const upstream = buildGeminiRequest(REQUEST, API_KEY);
  assert.equal(upstream.url, GEMINI_CHAT_COMPLETIONS_URL);
  assert.equal(upstream.init.method, "POST");
  assert.equal(upstream.init.headers["Authorization"], `Bearer ${API_KEY}`);
  assert.equal(upstream.init.headers["Content-Type"], "application/json");

  const body = JSON.parse(upstream.init.body) as Record<string, unknown>;
  assert.equal(body["model"], DEFAULT_GEMINI_MODEL);
  assert.deepEqual(body["messages"], REQUEST.messages);
  assert.equal(body["temperature"], 0.2);
  assert.equal(body["max_tokens"], 2_000);
  assert.ok(!upstream.init.signal);
});

test("buildGeminiRequest: propaga la señal de aborto del timeout", () => {
  const controller = new AbortController();
  const upstream = buildGeminiRequest(REQUEST, API_KEY, controller.signal);
  assert.equal(upstream.init.signal, controller.signal);
});

test("handleAgentPost: reenvía a Gemini y devuelve una completion OpenAI", async () => {
  const plan = JSON.stringify({
    summary: "Crear escena Nivel 2",
    operations: [{ type: "create_scene", payload: { name: "Nivel 2" } }],
  });
  const { fetchImpl, calls } = stubFetch(() => completionResponse(plan));
  const result = await handleAgentPost(
    { model: "gemini-1.5-flash", messages: REQUEST.messages },
    { env: ENV, fetchImpl, now: () => 1_700_000_000_000 },
  );

  assert.equal(result.status, 200);
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.url, GEMINI_CHAT_COMPLETIONS_URL);
  assert.equal(calls[0]?.init.headers?.["Authorization"], `Bearer ${API_KEY}`);

  const completion = result.body as {
    object: string;
    model: string;
    created: number;
    choices: { message: { role: string; content: string }; finish_reason: string }[];
    usage: { total_tokens: number };
  };
  assert.equal(completion.object, "chat.completion");
  assert.equal(completion.model, "gemini-1.5-flash");
  assert.equal(completion.created, 1_700_000_000);
  assert.equal(completion.choices[0]?.message.role, "assistant");
  assert.equal(completion.choices[0]?.message.content, plan);
  assert.equal(completion.choices[0]?.finish_reason, "stop");
  assert.equal(completion.usage.total_tokens, 46);
  assert.equal(result.headers["Cache-Control"], "no-store");
});

test("handleAgentPost: no llama a Gemini cuando la petición es inválida", async () => {
  const { fetchImpl, calls } = stubFetch(() => completionResponse("x"));
  const result = await handleAgentPost(
    { messages: [{ role: "user", content: "" }] },
    { env: ENV, fetchImpl },
  );
  assert.equal(result.status, 400);
  assert.equal(calls.length, 0);
});

/* ------------------------------------------------------------------------
 * Normalización de respuestas del proveedor
 * ---------------------------------------------------------------------- */

test("extractUpstreamContent: acepta forma OpenAI, nativa de Gemini y texto plano", () => {
  assert.equal(extractUpstreamContent({ choices: [{ message: { content: "hola" } }] }), "hola");
  assert.equal(extractUpstreamContent({ choices: [{ text: "legado" }] }), "legado");
  assert.equal(
    extractUpstreamContent({
      candidates: [{ content: { parts: [{ text: "a" }, { text: "b" }] } }],
    }),
    "ab",
  );
  assert.equal(extractUpstreamContent("directo"), "directo");
  assert.equal(extractUpstreamContent({}), null);
  assert.equal(extractUpstreamContent(null), null);
  assert.equal(extractUpstreamContent({ choices: [{ message: { content: 5 } }] }), null);
});

test("toGatewayCompletion: normaliza id, uso y finish_reason; null sin contenido", () => {
  const completion = toGatewayCompletion(
    {
      id: "gemini-xyz",
      candidates: [{ content: { parts: [{ text: "plan" }] }, finishReason: "MAX_TOKENS" }],
      usageMetadata: { promptTokenCount: 3, candidatesTokenCount: 4, totalTokenCount: 7 },
    },
    REQUEST,
    1_700_000_000,
  );
  assert.ok(completion);
  assert.equal(completion.id, "gemini-xyz");
  assert.equal(completion.model, DEFAULT_GEMINI_MODEL);
  assert.equal(completion.choices[0]?.message.content, "plan");
  assert.equal(completion.choices[0]?.finish_reason, "max_tokens");
  assert.deepEqual(completion.usage, { prompt_tokens: 3, completion_tokens: 4, total_tokens: 7 });

  const withoutId = toGatewayCompletion("texto", REQUEST, 1_700_000_000);
  assert.equal(withoutId?.id, "nexus-1700000000");
  assert.equal(withoutId?.usage, undefined);

  assert.equal(toGatewayCompletion({ choices: [] }, REQUEST, 0), null);
});

/* ------------------------------------------------------------------------
 * Errores upstream y timeout
 * ---------------------------------------------------------------------- */

test("handleAgentPost: traduce errores del proveedor (429 se conserva, el resto 502)", async () => {
  const limited = stubFetch(() => jsonResponse(429, { error: { message: "cuota agotada" } }));
  const limitedResult = await handleAgentPost(
    { instruction: "hola" },
    { env: ENV, fetchImpl: limited.fetchImpl },
  );
  assert.equal(limitedResult.status, 429);
  assert.match(JSON.stringify(limitedResult.body), /cuota agotada/);

  const broken = stubFetch(() => jsonResponse(500, { error: { message: "fallo interno" } }));
  const brokenResult = await handleAgentPost(
    { instruction: "hola" },
    { env: ENV, fetchImpl: broken.fetchImpl },
  );
  assert.equal(brokenResult.status, 502);
  assert.match(JSON.stringify(brokenResult.body), /HTTP 500/);
});

test("handleAgentPost: el detalle upstream nunca revela la clave del servidor", async () => {
  const { fetchImpl } = stubFetch(() =>
    jsonResponse(400, { error: { message: `API key not valid: ${API_KEY}` } }),
  );
  const result = await handleAgentPost({ instruction: "hola" }, { env: ENV, fetchImpl });
  assert.equal(result.status, 502);
  const text = JSON.stringify(result.body);
  assert.ok(!text.includes(API_KEY));
  assert.match(text, /\[redactado\]/);
});

test("handleAgentPost: respuesta sin contenido utilizable → 502", async () => {
  const { fetchImpl } = stubFetch(() => jsonResponse(200, { choices: [] }));
  const result = await handleAgentPost({ instruction: "hola" }, { env: ENV, fetchImpl });
  assert.equal(result.status, 502);
  assert.match(JSON.stringify(result.body), /contenido utilizable/);
});

test("handleAgentPost: timeout del proveedor → 504", async () => {
  const { fetchImpl } = stubFetch(() => {
    const error = new Error("aborted");
    error.name = "AbortError";
    return Promise.reject(error);
  });
  const result = await handleAgentPost({ instruction: "hola" }, { env: ENV, fetchImpl });
  assert.equal(result.status, 504);
  assert.equal((result.body as { error: { type: string } }).error.type, "timeout_error");
});

test("handleAgentPost: fallo de red → 502 sin detalles internos", async () => {
  const { fetchImpl } = stubFetch(() => Promise.reject(new Error("ECONNRESET secreto")));
  const result = await handleAgentPost({ instruction: "hola" }, { env: ENV, fetchImpl });
  assert.equal(result.status, 502);
  assert.ok(!JSON.stringify(result.body).includes("ECONNRESET"));
});

/* ------------------------------------------------------------------------
 * Estado público y métodos
 * ---------------------------------------------------------------------- */

test("handleAgentGet: informa disponibilidad y modelos sin exponer la clave", () => {
  const enabled = handleAgentGet({ env: ENV }).body as {
    ok: boolean;
    enabled: boolean;
    provider: string;
    endpoint: string;
    models: string[];
    defaultModel: string;
  };
  assert.equal(enabled.ok, true);
  assert.equal(enabled.enabled, true);
  assert.equal(enabled.provider, "gemini");
  assert.equal(enabled.endpoint, NEXUS_AGENT_ROUTE);
  assert.deepEqual(enabled.models, [...GEMINI_MODELS]);
  assert.equal(enabled.defaultModel, DEFAULT_GEMINI_MODEL);

  const disabled = handleAgentGet({ env: {} }).body as { enabled: boolean };
  assert.equal(disabled.enabled, false);
  assert.ok(!JSON.stringify(handleAgentGet({ env: ENV }).body).includes(API_KEY));
});

test("handleAgentRequest: GET informa estado, POST proxyza y el resto 405", async () => {
  const { fetchImpl } = stubFetch(() => completionResponse("hola"));
  assert.equal((await handleAgentRequest("GET", null, { env: ENV, fetchImpl })).status, 200);
  assert.equal(
    (await handleAgentRequest("post", { instruction: "hola" }, { env: ENV, fetchImpl })).status,
    200,
  );
  for (const method of ["PUT", "DELETE", "PATCH"]) {
    const result = await handleAgentRequest(method, null, { env: ENV, fetchImpl });
    assert.equal(result.status, 405);
    assert.equal((result.body as { error: { type: string } }).error.type, "method_not_allowed");
  }
});

test("gatewayError: forma OpenAI y cabeceras sin caché", () => {
  const result = gatewayError(418, "mensaje", "teapot");
  assert.equal(result.status, 418);
  assert.deepEqual(result.body, { error: { message: "mensaje", type: "teapot" } });
  assert.equal(result.headers["Cache-Control"], "no-store");
  assert.equal(result.headers["Content-Type"], "application/json; charset=utf-8");
  assert.equal(gatewayError(500, "x").headers["X-Nexus-Gateway"], "gemini");
});

/* ------------------------------------------------------------------------
 * Adaptador Node (middleware de Vite y servidor propio)
 * ---------------------------------------------------------------------- */

test("gatewayPathOf: resuelve rutas relativas, absolutas, con query y con barra final", () => {
  assert.equal(gatewayPathOf("/api/agent"), "/api/agent");
  assert.equal(gatewayPathOf("/api/agent?model=x"), "/api/agent");
  assert.equal(gatewayPathOf("/api/agent/"), "/api/agent");
  assert.equal(gatewayPathOf("http://localhost:8080/api/agent"), "/api/agent");
  assert.equal(gatewayPathOf("/editor"), "/editor");
  assert.equal(gatewayPathOf("/"), "/");
  assert.equal(gatewayPathOf(undefined), "");
  assert.equal(gatewayPathOf(""), "");
});

test("isGatewayRequest: solo coincide con la ruta exacta del gateway", () => {
  assert.equal(isGatewayRequest("/api/agent"), true);
  assert.equal(isGatewayRequest("/api/agent/"), true);
  assert.equal(isGatewayRequest("/api/agentes"), false);
  assert.equal(isGatewayRequest("/editor"), false);
});

test("readJsonBody: parsea JSON, devuelve null ante vacío, inválido o excesivo", async () => {
  assert.deepEqual(await readJsonBody(fakeRequest("POST", "/api/agent", { a: 1 })), { a: 1 });
  assert.equal(await readJsonBody(fakeRequest("POST", "/api/agent")), null);
  assert.equal(await readJsonBody(fakeRequest("POST", "/api/agent", undefined)), null);

  const invalid: GatewayNodeRequest = {
    method: "POST",
    url: "/api/agent",
    [Symbol.asyncIterator]: () =>
      (async function* () {
        yield "{no-json";
      })(),
  };
  assert.equal(await readJsonBody(invalid), null);

  const huge: GatewayNodeRequest = {
    method: "POST",
    url: "/api/agent",
    [Symbol.asyncIterator]: () =>
      (async function* () {
        yield "a".repeat(MAX_NODE_BODY_BYTES + 1);
      })(),
  };
  assert.equal(await readJsonBody(huge), null);

  const boom: GatewayNodeRequest = {
    method: "POST",
    url: "/api/agent",
    [Symbol.asyncIterator]: () =>
      (async function* (): AsyncGenerator<string> {
        yield "empieza bien";
        throw new Error("socket cerrado a mitad de la subida");
      })(),
  };
  assert.equal(await readJsonBody(boom), null);
});

test("writeGatewayResponse: vuelca estado, cabeceras y cuerpo JSON", () => {
  const res = fakeResponse();
  writeGatewayResponse(res, {
    status: 201,
    body: { ok: true },
    headers: { "Cache-Control": "no-store" },
  });
  assert.equal(res.statusCode, 201);
  assert.equal(res.headers["Cache-Control"], "no-store");
  assert.deepEqual(res.json(), { ok: true });
});

test("handleGatewayNodeRequest: atiende /api/agent y deja pasar el resto", async () => {
  const editor = fakeResponse();
  const handled = await handleGatewayNodeRequest(fakeRequest("GET", "/editor"), editor, {
    env: ENV,
  });
  assert.equal(handled, false);
  assert.equal(editor.statusCode, 0);

  const status = fakeResponse();
  assert.equal(
    await handleGatewayNodeRequest(fakeRequest("GET", "/api/agent"), status, { env: ENV }),
    true,
  );
  assert.equal(status.statusCode, 200);
  assert.equal((status.json() as { enabled: boolean }).enabled, true);

  const post = fakeResponse();
  const { fetchImpl } = stubFetch(() => completionResponse("plan-candidato"));
  assert.equal(
    await handleGatewayNodeRequest(
      fakeRequest("POST", "/api/agent", { instruction: "crea una escena" }),
      post,
      { env: ENV, fetchImpl },
    ),
    true,
  );
  assert.equal(post.statusCode, 200);
  const completion = post.json() as { choices: { message: { content: string } }[] };
  assert.equal(completion.choices[0]?.message.content, "plan-candidato");
});

test("handleGatewayNodeRequest: POST con cuerpo inválido responde 400 sin red", async () => {
  const { fetchImpl, calls } = stubFetch(() => completionResponse("x"));
  const res = fakeResponse();
  await handleGatewayNodeRequest(fakeRequest("POST", "/api/agent", { messages: [] }), res, {
    env: ENV,
    fetchImpl,
  });
  assert.equal(res.statusCode, 400);
  assert.equal(calls.length, 0);
});

test("handleGatewayNodeRequest: método no permitido responde 405", async () => {
  const res = fakeResponse();
  await handleGatewayNodeRequest(fakeRequest("DELETE", "/api/agent"), res, { env: ENV });
  assert.equal(res.statusCode, 405);
});
