// LLM gateway — the remote-model side of the agent (block 3). The model
// receives the instruction + a compact context of the project and MUST reply
// with JSON: { summary, sceneName?, operations: [{ type, payload }] } where
// every operation is one of the Game Tool Registry tools.
//
// Trust boundary (brief): the model never mutates React state, free JSON or
// files. Its output is just a candidate AgentPlan; it still has to pass
// validatePlan (real ids, supported tools, bounded size) before the session
// pipeline even shows it. Hallucinated ids or invented capabilities die here.
//
// Credentials (brief: server/daemon only, never persisted or logged):
//   - the provider endpoint + optional token are passed per request by the
//     user in the agent panel, exactly like the sprite-generation flow:
//     never stored, never written to the audit log, and never included in
//     error reasons or diagnostics;
//   - only https endpoints (or localhost for local dev) are accepted;
//   - every request is bounded by a hard timeout;
//   - there is no shell, no file access and no automatic publishing: the
//     gateway only speaks one HTTP verb (POST) to a chat-completions
//     endpoint and returns a candidate plan.
//
// Importable under plain Node (tests): explicit .ts extensions.

import type { GDProject, GDScene } from "../editor/types.ts";
import { createOperation, createPlan, type AgentPlan } from "./operations.ts";
import { validatePlan } from "./validator.ts";
import { TOOL_REGISTRY } from "./tools.ts";

export const DEFAULT_MODEL_TIMEOUT_MS = 30_000;
export const MAX_MODEL_TIMEOUT_MS = 120_000;
/** Hard cap for the context sent to the model (bounded autonomy). */
const MAX_CONTEXT_CHARS = 8_000;

export interface LlmProviderConfig {
  /** Base URL of an OpenAI-compatible chat-completions endpoint. */
  endpoint: string;
  /** Model name as expected by the endpoint (e.g. "gpt-4o-mini"). */
  model?: string;
  /** Bearer token; optional for endpoints that do not require auth. */
  token?: string;
  timeoutMs?: number;
}

export interface LlmPlanRequest {
  instruction: string;
  project: GDProject;
  activeSceneName: string;
  provider: LlmProviderConfig;
}

export interface LlmPlanResult {
  plan: AgentPlan | null;
  /** Friendly Spanish reason when the model produced no usable plan. */
  reason?: string;
  /** Token usage when the endpoint reports it (display only). */
  usage?: { promptTokens?: number; completionTokens?: number };
}

/* ------------------------------------------------------------------------
 * Context + prompt builders (pure, exported for tests)
 * ---------------------------------------------------------------------- */

/**
 * Compact JSON context of the project: scene/object/instance names and
 * coordinates, variable names, resources by name. Deliberately excludes
 * resource payloads (data URLs) and anything that is not needed to plan.
 */
export function buildModelContext(project: GDProject, activeSceneName: string): string {
  const scenes = project.scenes.map((scene: GDScene) => ({
    name: scene.name,
    active: scene.name === activeSceneName,
    objects: scene.objects.map((object) => ({
      id: object.id,
      name: object.name,
      type: object.type,
      ...(object.text !== undefined ? { text: object.text.slice(0, 80) } : {}),
      behaviors: object.behaviors.map((behavior) => behavior.type),
    })),
    instances: scene.instances.slice(0, 40).map((instance) => {
      const object = scene.objects.find((candidate) => candidate.id === instance.objectId);
      return {
        id: instance.id,
        name: object?.name ?? instance.objectId,
        x: instance.x,
        y: instance.y,
        width: instance.width,
        height: instance.height,
      };
    }),
    variables: scene.variables.map((variable) => variable.name),
  }));
  const context = {
    project: project.name,
    window: {
      width: project.gameSettings.windowWidth,
      height: project.gameSettings.windowHeight,
    },
    scenes,
    resources: project.resources.slice(0, 50).map((resource) => resource.name),
    globalVariables: project.globalVariables.map((variable) => variable.name),
  };
  let json = JSON.stringify(context);
  if (json.length > MAX_CONTEXT_CHARS) {
    json = `${json.slice(0, MAX_CONTEXT_CHARS)}…`;
  }
  return json;
}

/**
 * Catalog of the tools the model may use: only the supported tools. The
 * prompt is generated from the registry so it cannot advertise capabilities
 * the runtime does not have.
 */
export function buildToolCatalog(): string {
  const supported = Object.values(TOOL_REGISTRY).filter((tool) => tool.supported);
  return supported
    .map((tool) => {
      const doc = PAYLOAD_DOCS[tool.name];
      return `- ${tool.name}: ${tool.description}${doc ? ` Payload: ${doc}` : ""}`;
    })
    .join("\n");
}

/** Short payload documentation per supported tool (prompt material). */
const PAYLOAD_DOCS: Record<string, string> = {
  create_scene: "{ name: string }",
  duplicate_scene: "{ sceneName: string, newName?: string }",
  update_scene: '{ sceneName: string, backgroundColor?: "R;G;B" }',
  create_object:
    '{ sceneName, name, type: "Sprite"|"TextObject::Text"|"SpriteObject::SpriteSheet"|..., text? (para texto), asset? (recurso existente) }',
  update_object:
    "{ sceneName, objectId, patch: { name?|text?|textColor?|textSize?|bold?|italic? } }",
  delete_object: "{ sceneName, objectId }",
  create_instance: "{ sceneName, objectId, x, y, width?, height? }",
  move_instance: "{ sceneName, instanceId, x, y }",
  resize_instance: "{ sceneName, instanceId, width, height }",
  assign_sprite: '{ sceneName, objectId, resource: nombre de recurso existente o "" }',
  create_animation: "{ sceneName, objectId, name, resource? }",
  add_behavior:
    "{ sceneName, objectId, name?, type (uno de los comportamientos soportados), properties? }",
  remove_behavior: "{ sceneName, objectId, behaviorName }",
  create_variable:
    '{ sceneName, name, type: "number"|"string"|"boolean", value?, scope?: "scene"|"global" }',
  create_event:
    "{ sceneName, conditions?: [{typeId, parameters, inverted?}], actions?: [{typeId, parameters, inverted?}] }",
  update_event: "{ sceneName, eventId, conditions?, actions?, disabled? }",
  add_collision: '{ sceneName, objectA, objectB, deleteTarget?: "A"|"B"|"none" }',
};

export interface ChatMessage {
  role: "system" | "user";
  content: string;
}

/** System + user messages for the chat-completions call. */
export function buildModelMessages(
  instruction: string,
  project: GDProject,
  activeSceneName: string,
): ChatMessage[] {
  const system = [
    "Eres el agente de un editor de juegos. Recibes una instrucción en español y un contexto JSON del proyecto.",
    "SOLO puedes responder con JSON válido, sin markdown ni texto extra, con esta forma:",
    '{ "summary": "resumen breve en español", "sceneName": "opcional, escena destino", "operations": [ { "type": "nombre_de_herramienta", "payload": { ... } } ] }',
    "",
    "Reglas:",
    "- Usa ÚNICAMENTE estas herramientas (no inventes otras):",
    buildToolCatalog(),
    "- Usa solo ids y nombres que existan en el contexto (objectId, instanceId, sceneName, nombres de objetos).",
    "- Máximo 50 operaciones; prefiere pocas y precisas.",
    "- No puedes generar sprites, importar archivos, ejecutar juegos ni publicar nada.",
    '- Si no puedes completar la instrucción con estas herramientas, responde { "error": "explicación breve en español" }.',
  ].join("\n");

  const user = [
    `Instrucción: ${instruction}`,
    "",
    "Contexto del proyecto (la escena activa está marcada):",
    buildModelContext(project, activeSceneName),
  ].join("\n");

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

/* ------------------------------------------------------------------------
 * Response parsing (pure, exported for tests) — the model's output is a
 * candidate plan, nothing more.
 * ---------------------------------------------------------------------- */

function stripCodeFences(value: string): string {
  const trimmed = value.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced?.[1] ?? trimmed;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Parses the raw model output into a candidate AgentPlan validated against
 * the project. Never throws: failures come back as a reason in Spanish.
 * Model-supplied ids are ignored; operations are re-registered with fresh
 * ids so a malicious/corrupt id can never collide.
 */
export function parseModelPlan(raw: unknown, project: GDProject): LlmPlanResult {
  let candidate: unknown = raw;

  if (typeof raw === "string") {
    try {
      candidate = JSON.parse(stripCodeFences(raw));
    } catch {
      return {
        plan: null,
        reason:
          "El modelo no devolvió JSON válido. Prueba a reformular la instrucción o usa el planificador local.",
      };
    }
  }

  if (!isRecord(candidate)) {
    return { plan: null, reason: "La respuesta del modelo no tiene la forma esperada." };
  }

  // Explicit refusal from the model.
  if (typeof candidate["error"] === "string" && candidate["error"].trim()) {
    return { plan: null, reason: candidate["error"].trim().slice(0, 300) };
  }

  if (!Array.isArray(candidate["operations"]) || candidate["operations"].length === 0) {
    return { plan: null, reason: "El modelo no propuso ninguna operación válida." };
  }

  const summary =
    typeof candidate["summary"] === "string" && candidate["summary"].trim()
      ? candidate["summary"].trim().slice(0, 500)
      : "Plan propuesto por el modelo de IA";
  const sceneName =
    typeof candidate["sceneName"] === "string" && candidate["sceneName"].trim()
      ? candidate["sceneName"].trim()
      : undefined;

  const operations = [];
  for (const item of candidate["operations"] as unknown[]) {
    if (!isRecord(item))
      return { plan: null, reason: "El modelo devolvió operaciones en forma no válida." };
    const type = item["type"];
    const payload = item["payload"];
    if (typeof type !== "string" || !isRecord(payload)) {
      return { plan: null, reason: "El modelo devolvió operaciones en forma no válida." };
    }
    operations.push(createOperation(type, payload));
  }

  const plan = createPlan(summary, operations, sceneName);
  const validation = validatePlan(plan, project);
  if (!validation.ok) {
    const first = validation.errors[0];
    return {
      plan: null,
      reason: first
        ? `El plan del modelo no pasó la validación: ${first.message}`
        : "El plan del modelo no pasó la validación.",
    };
  }
  return { plan };
}

/* ------------------------------------------------------------------------
 * HTTP orchestration
 * ---------------------------------------------------------------------- */

function safeEndpoint(url: string): { url?: string; reason?: string } {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { reason: "El endpoint del modelo no es una URL válida." };
  }
  const isLocal = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  if (parsed.protocol !== "https:" && !isLocal) {
    return { reason: "El endpoint debe ser HTTPS (o localhost en desarrollo)." };
  }
  return { url: parsed.toString() };
}

/**
 * Calls the chat-completions endpoint and returns the candidate plan.
 * The token is sent only in the Authorization header of this single request
 * and never appears in returned reasons, logs or the audit trail.
 */
export async function planFromModel(request: LlmPlanRequest): Promise<LlmPlanResult> {
  const { url, reason } = safeEndpoint(request.provider.endpoint.trim());
  if (!url) return { plan: null, reason: reason ?? "El endpoint del modelo no es válido." };

  const timeoutMs = Math.min(
    MAX_MODEL_TIMEOUT_MS,
    Math.max(1_000, request.provider.timeoutMs ?? DEFAULT_MODEL_TIMEOUT_MS),
  );
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    const token = request.provider.token?.trim();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: request.provider.model?.trim() || undefined,
        messages: buildModelMessages(request.instruction, request.project, request.activeSceneName),
        temperature: 0.2,
        max_tokens: 2_000,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        plan: null,
        reason: `El proveedor de IA devolvió un error (HTTP ${response.status}). Revisa el endpoint, el modelo y las credenciales.`,
      };
    }

    const data: unknown = await response.json();
    const raw = extractModelContent(data);
    if (raw === null) {
      return {
        plan: null,
        reason: "La respuesta del proveedor no contiene el contenido del modelo.",
      };
    }
    const usage = extractUsage(data);
    const parsed = parseModelPlan(raw, request.project);
    return usage ? { ...parsed, usage } : parsed;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { plan: null, reason: "El proveedor de IA no respondió a tiempo (timeout)." };
    }
    return {
      plan: null,
      reason:
        "No se pudo conectar con el proveedor de IA (red o endpoint). El planificador local sigue disponible.",
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Accepts OpenAI-style responses, legacy `text` completions and raw JSON. */
function extractModelContent(data: unknown): string | null {
  if (typeof data === "string") return data;
  if (!isRecord(data)) return null;
  const choices = data["choices"];
  if (Array.isArray(choices) && choices.length > 0 && isRecord(choices[0])) {
    const message = choices[0]["message"];
    if (isRecord(message) && typeof message["content"] === "string") {
      return message["content"];
    }
    if (typeof choices[0]["text"] === "string") return choices[0]["text"];
  }
  // Some gateways return the JSON object directly.
  if (typeof data["summary"] === "string" || Array.isArray(data["operations"])) {
    return JSON.stringify(data);
  }
  return null;
}

function extractUsage(data: unknown): LlmPlanResult["usage"] {
  if (!isRecord(data) || !isRecord(data["usage"])) return undefined;
  const usage = data["usage"];
  const result: LlmPlanResult["usage"] = {};
  if (typeof usage["prompt_tokens"] === "number") result.promptTokens = usage["prompt_tokens"];
  if (typeof usage["completion_tokens"] === "number") {
    result.completionTokens = usage["completion_tokens"];
  }
  if (result.promptTokens === undefined && result.completionTokens === undefined) return undefined;
  return result;
}
