// Nexus AI gateway — la mitad servidor del asistente (AGENT_ARCHITECTURE.md §1).
//
// `/api/agent` (POST) es un proxy chat-completions compatible OpenAI delante de
// Gemini: el cliente (QuickAutomationBar → `nexus-client.ts` → `model.ts`) envía
// los mensajes construidos por `buildModelMessages`, este módulo inyecta
// `GEMINI_API_KEY` en el servidor y reenvía la petición a
// https://generativelanguage.googleapis.com/v1beta/openai/chat/completions,
// devolviendo siempre una completion con forma OpenAI.
//
// Frontera de confianza:
//   - la clave vive SOLO en el entorno del servidor: cualquier credencial que
//     mande el cliente se descarta (la petición upstream se reconstruye desde
//     cero) y la clave nunca se registra, se incluye en un error ni se devuelve;
//   - el modelo está restringido a una lista blanca (`gemini-*-flash`);
//   - la carga útil está acotada (mensajes, caracteres, temperature, tokens);
//   - la llamada upstream tiene timeout duro (AbortController);
//   - sin shell, sin sistema de archivos y sin publicación: un verbo (POST) a un
//     único endpoint HTTPS, y la respuesta sigue siendo solo un plan CANDIDATO —
//     el cliente lo valida (`validatePlan`) antes de tocar el proyecto.
//
// Importable bajo Node plano (tests): extensiones .ts explícitas, sin React ni
// imports de TanStack. Los adaptadores (`api/agent.ts`, el middleware de Vite y
// `scripts/run_nexus_server.mjs`) son capas finas sobre este módulo.

/** Ruta pública del gateway, en el mismo origen que la aplicación. */
export const NEXUS_AGENT_ROUTE = "/api/agent";

/** Endpoint OpenAI-compatible de Gemini (AGENT_ARCHITECTURE.md §1). */
export const GEMINI_CHAT_COMPLETIONS_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

/** Variable de entorno con la clave del gateway (inyección server-side). */
export const GEMINI_API_KEY_VAR = "GEMINI_API_KEY";
/** Alternativa aceptada (proveedores que exponen la clave como Google AI). */
export const GOOGLE_API_KEY_VAR = "GOOGLE_API_KEY";
/** Variable opcional para ajustar el timeout del gateway. */
export const GATEWAY_TIMEOUT_VAR = "NEXUS_AGENT_TIMEOUT_MS";

/** Modelos permitidos; el primero es el predeterminado. */
export const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-1.5-flash"] as const;
export type GeminiModel = (typeof GEMINI_MODELS)[number];
export const DEFAULT_GEMINI_MODEL: GeminiModel = "gemini-2.5-flash";

/** Nombre del proveedor, para diagnósticos sin secretos. */
export const GATEWAY_PROVIDER = "gemini";

/** Timeout por defecto de la llamada upstream. */
export const GATEWAY_TIMEOUT_MS = 45_000;
export const MIN_GATEWAY_TIMEOUT_MS = 5_000;
export const MAX_GATEWAY_TIMEOUT_MS = 120_000;

/** Límites de la petición entrante (autonomía acotada). */
export const MAX_GATEWAY_MESSAGES = 24;
export const MAX_MESSAGE_CHARS = 12_000;
export const MAX_GATEWAY_CHARS = 32_000;
export const MAX_COMPLETION_TOKENS = 2_000;
/** Detalle de error upstream reenviado al cliente (nunca incluye la clave). */
export const MAX_UPSTREAM_DETAIL_CHARS = 300;

/** Roles aceptados en el proxy (el cliente solo usa system/user). */
export type GatewayRole = "system" | "user" | "assistant";

export interface GatewayMessage {
  role: GatewayRole;
  content: string;
}

/** Petición ya saneada: lo único que se reenvía a Gemini. */
export interface GatewayRequest {
  model: GeminiModel;
  messages: GatewayMessage[];
  temperature: number;
  maxTokens: number;
}

/** Respuesta HTTP del gateway (el adaptador la convierte en `Response`). */
export interface GatewayResponse {
  status: number;
  body: unknown;
  headers: Record<string, string>;
}

/** Entorno del servidor; `process.env` cumple esta forma. */
export type GatewayEnv = Record<string, string | undefined>;

/** Dependencias inyectables: nada de red ni de entorno implícito en los tests. */
export interface GatewayDeps {
  env?: GatewayEnv;
  fetchImpl?: typeof fetch;
  now?: () => number;
}

/* ------------------------------------------------------------------------
 * Utilidades puras
 * ---------------------------------------------------------------------- */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Cabeceras de toda respuesta del gateway: sin caché y sin secretos. */
export function gatewayHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Nexus-Gateway": GATEWAY_PROVIDER,
  };
}

/** Lectura defensiva del entorno del servidor (también usable en el cliente). */
export function readServerEnv(): GatewayEnv {
  const candidate = (globalThis as { process?: { env?: GatewayEnv } }).process;
  return candidate?.env ?? {};
}

/**
 * Resuelve la clave del gateway desde el entorno del servidor. Devuelve `null`
 * cuando no hay clave utilizable; el valor nunca se registra ni se devuelve.
 */
export function readGeminiApiKey(env: GatewayEnv = readServerEnv()): string | null {
  const raw = env[GEMINI_API_KEY_VAR] ?? env[GOOGLE_API_KEY_VAR] ?? "";
  const key = raw.trim();
  return key.length > 0 ? key : null;
}

/** Restringe el modelo pedido a la lista blanca (desconocido → predeterminado). */
export function resolveGeminiModel(requested: unknown): GeminiModel {
  if (typeof requested !== "string") return DEFAULT_GEMINI_MODEL;
  const normalized = requested.trim().toLowerCase();
  const match = GEMINI_MODELS.find((model) => model === normalized);
  return match ?? DEFAULT_GEMINI_MODEL;
}

/** Acota un número opcional al rango permitido (fuera de rango → límite). */
export function clampNumber(raw: unknown, fallback: number, min: number, max: number): number {
  const value = typeof raw === "number" && Number.isFinite(raw) ? raw : fallback;
  return Math.min(max, Math.max(min, value));
}

/**
 * Elimina cualquier aparición de un secreto y acota el texto. Se aplica al
 * detalle de error upstream antes de devolverlo al cliente.
 */
export function scrubSecret(text: unknown, secret: string | null): string {
  if (typeof text !== "string") return "";
  const bounded = text.slice(0, MAX_UPSTREAM_DETAIL_CHARS);
  const withoutSecret = secret ? bounded.split(secret).join("[redactado]") : bounded;
  return withoutSecret.replace(/\s+/g, " ").trim();
}

/** Timeout efectivo del gateway (variable de entorno opcional, siempre acotado). */
export function resolveGatewayTimeoutMs(env: GatewayEnv = readServerEnv()): number {
  const raw = env[GATEWAY_TIMEOUT_VAR];
  const parsed = typeof raw === "string" && raw.trim() ? Number(raw.trim()) : NaN;
  return clampNumber(parsed, GATEWAY_TIMEOUT_MS, MIN_GATEWAY_TIMEOUT_MS, MAX_GATEWAY_TIMEOUT_MS);
}

/* ------------------------------------------------------------------------
 * Saneado de la petición entrante
 * ---------------------------------------------------------------------- */

export type SanitizeResult =
  { ok: true; request: GatewayRequest } | { ok: false; status: number; error: string };

function invalid(status: number, error: string): SanitizeResult {
  return { ok: false, status, error };
}

/**
 * Convierte el cuerpo recibido en una `GatewayRequest` acotada. Acepta la forma
 * OpenAI (`messages`) y la forma breve de Nexus (`instruction`). Todo campo no
 * reconocido se descarta: en particular, cualquier credencial enviada por el
 * cliente jamás llega a Gemini ni a la respuesta.
 */
export function sanitizeGatewayRequest(body: unknown): SanitizeResult {
  if (!isRecord(body)) {
    return invalid(400, "El cuerpo de la solicitud debe ser un objeto JSON.");
  }

  const messages: GatewayMessage[] = [];
  const rawMessages = body["messages"];
  const rawInstruction = body["instruction"];

  if (Array.isArray(rawMessages)) {
    if (rawMessages.length === 0) return invalid(400, "La lista de mensajes está vacía.");
    if (rawMessages.length > MAX_GATEWAY_MESSAGES) {
      return invalid(413, `Demasiados mensajes (máximo ${MAX_GATEWAY_MESSAGES}).`);
    }
    let total = 0;
    for (const item of rawMessages) {
      if (!isRecord(item))
        return invalid(400, "Cada mensaje debe ser un objeto { role, content }.");
      const role = item["role"];
      const content = item["content"];
      if (role !== "system" && role !== "user" && role !== "assistant") {
        return invalid(400, "Rol de mensaje no permitido (system, user o assistant).");
      }
      if (typeof content !== "string" || content.trim().length === 0) {
        return invalid(400, "El contenido de cada mensaje debe ser texto no vacío.");
      }
      if (content.length > MAX_MESSAGE_CHARS) {
        return invalid(413, `Mensaje demasiado largo (máximo ${MAX_MESSAGE_CHARS} caracteres).`);
      }
      total += content.length;
      if (total > MAX_GATEWAY_CHARS) {
        return invalid(413, `La solicitud supera el límite de ${MAX_GATEWAY_CHARS} caracteres.`);
      }
      messages.push({ role, content });
    }
  } else if (typeof rawInstruction === "string" && rawInstruction.trim().length > 0) {
    const instruction = rawInstruction.trim();
    if (instruction.length > MAX_MESSAGE_CHARS) {
      return invalid(413, `Instrucción demasiado larga (máximo ${MAX_MESSAGE_CHARS} caracteres).`);
    }
    messages.push({ role: "user", content: instruction });
  } else {
    return invalid(400, "La solicitud necesita `messages` (forma OpenAI) o `instruction`.");
  }

  const request: GatewayRequest = {
    model: resolveGeminiModel(body["model"]),
    messages,
    temperature: clampNumber(body["temperature"], 0.2, 0, 1),
    maxTokens: clampNumber(
      body["max_tokens"] ?? body["max_completion_tokens"],
      MAX_COMPLETION_TOKENS,
      1,
      MAX_COMPLETION_TOKENS,
    ),
  };
  return { ok: true, request };
}

/* ------------------------------------------------------------------------
 * Petición upstream y normalización de la respuesta
 * ---------------------------------------------------------------------- */

export interface GeminiUpstreamRequest {
  url: string;
  init: {
    method: "POST";
    headers: Record<string, string>;
    body: string;
    signal?: AbortSignal;
  };
}

/**
 * Construye la llamada a Gemini. La clave solo viaja en la cabecera
 * Authorization de esta petición y el cuerpo se reconstruye desde la petición
 * saneada (sin campos del cliente).
 */
export function buildGeminiRequest(
  request: GatewayRequest,
  apiKey: string,
  signal?: AbortSignal,
): GeminiUpstreamRequest {
  return {
    url: GEMINI_CHAT_COMPLETIONS_URL,
    init: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature,
        max_tokens: request.maxTokens,
      }),
      ...(signal ? { signal } : {}),
    },
  };
}

export interface GatewayUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface GatewayChoice {
  index: number;
  message: { role: "assistant"; content: string };
  finish_reason: string;
}

/** Completion con forma OpenAI: el contrato público de `/api/agent`. */
export interface GatewayCompletion {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: GatewayChoice[];
  usage?: GatewayUsage;
}

function toNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Extrae el texto del modelo aceptando la forma OpenAI y la nativa de Gemini. */
export function extractUpstreamContent(data: unknown): string | null {
  if (typeof data === "string") return data.trim() ? data : null;
  if (!isRecord(data)) return null;

  const choices = data["choices"];
  if (Array.isArray(choices) && choices.length > 0 && isRecord(choices[0])) {
    const message = choices[0]["message"];
    if (isRecord(message) && typeof message["content"] === "string") return message["content"];
    if (typeof choices[0]["text"] === "string") return choices[0]["text"];
  }

  const candidates = data["candidates"];
  if (Array.isArray(candidates) && candidates.length > 0 && isRecord(candidates[0])) {
    const content = candidates[0]["content"];
    if (isRecord(content) && Array.isArray(content["parts"])) {
      const text = content["parts"]
        .filter(isRecord)
        .map((part) => part["text"])
        .filter((part): part is string => typeof part === "string")
        .join("");
      if (text.trim()) return text;
    }
  }

  return null;
}

function extractUpstreamUsage(data: unknown): GatewayUsage | undefined {
  if (!isRecord(data)) return undefined;

  const usage = data["usage"];
  if (isRecord(usage)) {
    const prompt = toNumber(usage["prompt_tokens"]);
    const completion = toNumber(usage["completion_tokens"]);
    if (prompt !== null || completion !== null) {
      const promptTokens = prompt ?? 0;
      const completionTokens = completion ?? 0;
      return {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: toNumber(usage["total_tokens"]) ?? promptTokens + completionTokens,
      };
    }
  }

  const metadata = data["usageMetadata"];
  if (isRecord(metadata)) {
    const prompt = toNumber(metadata["promptTokenCount"]) ?? 0;
    const completion = toNumber(metadata["candidatesTokenCount"]) ?? 0;
    if (prompt > 0 || completion > 0) {
      return {
        prompt_tokens: prompt,
        completion_tokens: completion,
        total_tokens: toNumber(metadata["totalTokenCount"]) ?? prompt + completion,
      };
    }
  }

  return undefined;
}

function extractFinishReason(data: unknown): string {
  if (!isRecord(data)) return "stop";
  const choices = data["choices"];
  if (Array.isArray(choices) && choices.length > 0 && isRecord(choices[0])) {
    const reason = choices[0]["finish_reason"];
    if (typeof reason === "string" && reason.trim()) return reason;
  }
  const candidates = data["candidates"];
  if (Array.isArray(candidates) && candidates.length > 0 && isRecord(candidates[0])) {
    const reason = candidates[0]["finishReason"];
    if (typeof reason === "string" && reason.trim()) return reason.toLowerCase();
  }
  return "stop";
}

/**
 * Normaliza la respuesta de Gemini al contrato OpenAI de `/api/agent`.
 * Devuelve `null` cuando no hay contenido utilizable.
 */
export function toGatewayCompletion(
  data: unknown,
  request: GatewayRequest,
  created: number,
): GatewayCompletion | null {
  const content = extractUpstreamContent(data);
  if (content === null) return null;

  const id =
    isRecord(data) && typeof data["id"] === "string" && data["id"].trim()
      ? data["id"]
      : `nexus-${created}`;
  const completion: GatewayCompletion = {
    id,
    object: "chat.completion",
    created,
    model: request.model,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content },
        finish_reason: extractFinishReason(data),
      },
    ],
  };
  const usage = extractUpstreamUsage(data);
  return usage ? { ...completion, usage } : completion;
}

/* ------------------------------------------------------------------------
 * Handlers del gateway (los adaptadores solo traducen a Response/res)
 * ---------------------------------------------------------------------- */

/** Error del gateway con forma OpenAI (`{ error: { message, type } }`). */
export function gatewayError(
  status: number,
  message: string,
  type: string = "gateway_error",
): GatewayResponse {
  return { status, body: { error: { message, type } }, headers: gatewayHeaders() };
}

/**
 * GET `/api/agent` — estado público del asistente para la UI: indica si el
 * gateway está configurado y qué modelos sirve. Nunca incluye la clave.
 */
export function handleAgentGet(deps: GatewayDeps = {}): GatewayResponse {
  const env = deps.env ?? readServerEnv();
  return {
    status: 200,
    body: {
      ok: true,
      provider: GATEWAY_PROVIDER,
      endpoint: NEXUS_AGENT_ROUTE,
      enabled: readGeminiApiKey(env) !== null,
      models: [...GEMINI_MODELS],
      defaultModel: DEFAULT_GEMINI_MODEL,
    },
    headers: gatewayHeaders(),
  };
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError");
}

async function readUpstreamDetail(response: Response, apiKey: string): Promise<string> {
  try {
    const text = await response.text();
    return scrubSecret(text, apiKey);
  } catch {
    return "";
  }
}

/**
 * POST `/api/agent` — proxy chat-completions hacia Gemini.
 *
 * Orden de comprobaciones: clave del servidor → saneado de la petición →
 * llamada upstream con timeout → normalización. Ningún camino devuelve la
 * clave ni hace otra cosa que un POST HTTPS al endpoint de Gemini.
 */
export async function handleAgentPost(
  body: unknown,
  deps: GatewayDeps = {},
): Promise<GatewayResponse> {
  const env = deps.env ?? readServerEnv();
  const apiKey = readGeminiApiKey(env);
  if (!apiKey) {
    return gatewayError(
      503,
      `El asistente Nexus AI no está configurado en el servidor (${GEMINI_API_KEY_VAR}).`,
      "configuration_error",
    );
  }

  const sanitized = sanitizeGatewayRequest(body);
  if (!sanitized.ok) {
    return gatewayError(sanitized.status, sanitized.error, "invalid_request_error");
  }

  const timeoutMs = resolveGatewayTimeoutMs(env);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const fetchImpl = deps.fetchImpl ?? fetch;
  const now = deps.now ?? (() => Date.now());

  try {
    const upstream = buildGeminiRequest(sanitized.request, apiKey, controller.signal);
    const response = await fetchImpl(upstream.url, upstream.init);

    if (!response.ok) {
      const detail = await readUpstreamDetail(response, apiKey);
      const status = response.status === 429 ? 429 : 502;
      const message = `El proveedor de IA devolvió un error (HTTP ${response.status}).${
        detail ? ` ${detail}` : ""
      }`;
      return gatewayError(status, message.trim(), "upstream_error");
    }

    const data: unknown = await response.json().catch(() => null);
    const completion = toGatewayCompletion(data, sanitized.request, Math.floor(now() / 1000));
    if (!completion) {
      return gatewayError(
        502,
        "La respuesta del proveedor no contiene contenido utilizable.",
        "upstream_error",
      );
    }
    return { status: 200, body: completion, headers: gatewayHeaders() };
  } catch (error) {
    if (isAbortError(error)) {
      return gatewayError(
        504,
        "El proveedor de IA no respondió a tiempo (timeout).",
        "timeout_error",
      );
    }
    return gatewayError(
      502,
      "No se pudo conectar con el proveedor de IA (red o endpoint).",
      "upstream_error",
    );
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Despacha una petición HTTP del gateway según el método. Los métodos distintos
 * de GET/POST responden 405 (el gateway solo lee su estado y proxyza POST).
 */
export async function handleAgentRequest(
  method: string,
  body: unknown,
  deps: GatewayDeps = {},
): Promise<GatewayResponse> {
  const verb = method.trim().toUpperCase();
  if (verb === "GET" || verb === "HEAD") return handleAgentGet(deps);
  if (verb === "POST") return handleAgentPost(body, deps);
  return gatewayError(
    405,
    "El gateway del asistente solo acepta GET (estado) y POST (chat completions).",
    "method_not_allowed",
  );
}
