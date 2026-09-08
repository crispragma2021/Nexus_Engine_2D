// Cliente del asistente Nexus AI (AGENT_ARCHITECTURE.md §2).
//
// La UI nunca habla con Gemini ni conoce ninguna clave: llama a `/api/agent` en
// su mismo origen y el gateway servidor (`gemini-gateway.ts`) inyecta
// `GEMINI_API_KEY`. Este módulo reutiliza `planFromModel`, de modo que el
// contexto del proyecto, el prompt, el timeout duro y el parseo del plan
// candidato son exactamente los mismos que con cualquier otro proveedor
// OpenAI-compatible.
//
// La respuesta del gateway sigue siendo solo un plan CANDIDATO: quien llama lo
// pasa por la sesión (validatePlan → aprobación → applyPlan) igual que con el
// planificador local.
//
// Importable bajo Node plano (tests): extensiones .ts explícitas, sin React.

import type { GDProject } from "../editor/types.ts";
import { planFromModel, type LlmPlanResult } from "./model.ts";
import type { AgentPlan } from "./operations.ts";
import {
  DEFAULT_GEMINI_MODEL,
  GEMINI_MODELS,
  NEXUS_AGENT_ROUTE,
  type GeminiModel,
} from "./gemini-gateway.ts";

/** Modelo con el que arranca el asistente. */
export const NEXUS_ASSISTANT_MODEL: GeminiModel = DEFAULT_GEMINI_MODEL;
/** Timeout del asistente (menor que el del gateway, que corta por su cuenta). */
export const NEXUS_ASSISTANT_TIMEOUT_MS = 60_000;
/** Timeout corto del sondeo de disponibilidad. */
export const NEXUS_PROBE_TIMEOUT_MS = 5_000;

/** Origen actual en el navegador; cadena vacía fuera de él (tests, scripts). */
export function currentOrigin(): string {
  const location = (globalThis as { location?: { origin?: unknown } }).location;
  return typeof location?.origin === "string" ? location.origin : "";
}

/**
 * URL del gateway del asistente. Sin origen conocido devuelve la ruta relativa
 * (`/api/agent`), que el navegador resuelve contra su propio origen: mismo
 * origen siempre, sin fugas a terceros.
 */
export function nexusAgentEndpoint(origin: string = currentOrigin()): string {
  const base = origin.trim().replace(/\/+$/, "");
  return `${base}${NEXUS_AGENT_ROUTE}`;
}

export interface NexusPlanOptions {
  instruction: string;
  project: GDProject;
  activeSceneName: string;
  model?: GeminiModel | string;
  timeoutMs?: number;
}

/**
 * Pide un plan candidato al gateway Nexus AI. No se envía ningún token: la
 * credencial se queda en el servidor.
 */
export async function requestNexusPlan(options: NexusPlanOptions): Promise<LlmPlanResult> {
  return planFromModel({
    instruction: options.instruction,
    project: options.project,
    activeSceneName: options.activeSceneName,
    provider: {
      endpoint: nexusAgentEndpoint(),
      model: options.model ?? NEXUS_ASSISTANT_MODEL,
      timeoutMs: options.timeoutMs ?? NEXUS_ASSISTANT_TIMEOUT_MS,
    },
  });
}

export interface NexusAssistantStatus {
  /** False cuando el estado no se pudo determinar (red, hosting estático). */
  known: boolean;
  /** True si el servidor tiene `GEMINI_API_KEY` configurada. */
  enabled: boolean;
  models: string[];
  defaultModel: string;
}

const UNKNOWN_STATUS: NexusAssistantStatus = {
  known: false,
  enabled: false,
  models: [...GEMINI_MODELS],
  defaultModel: DEFAULT_GEMINI_MODEL,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Sondea `GET /api/agent` para saber si el asistente remoto está configurado.
 * Nunca lanza: ante cualquier fallo devuelve `known: false` y la UI sigue con
 * el planificador local sin mostrar errores.
 */
export async function probeNexusAssistant(
  fetchImpl: typeof fetch = fetch,
): Promise<NexusAssistantStatus> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), NEXUS_PROBE_TIMEOUT_MS);
  try {
    const response = await fetchImpl(nexusAgentEndpoint(), {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) return UNKNOWN_STATUS;
    const data: unknown = await response.json().catch(() => null);
    if (!isRecord(data) || typeof data["enabled"] !== "boolean") return UNKNOWN_STATUS;
    const models = Array.isArray(data["models"])
      ? data["models"].filter((model): model is string => typeof model === "string")
      : [...GEMINI_MODELS];
    const defaultModel =
      typeof data["defaultModel"] === "string" && data["defaultModel"].trim()
        ? data["defaultModel"]
        : DEFAULT_GEMINI_MODEL;
    return { known: true, enabled: data["enabled"], models, defaultModel };
  } catch {
    return UNKNOWN_STATUS;
  } finally {
    clearTimeout(timer);
  }
}

/** De dónde salió el plan que se va a aprobar/ejecutar. */
export type AssistantSource = "nexus-ai" | "local";

export interface AssistantOutcome {
  plan: AgentPlan | null;
  /** `null` cuando ninguna vía produjo un plan. */
  source: AssistantSource | null;
  /** Motivo en español del fallo remoto (útil aunque haya respaldo local). */
  reason?: string;
}

export interface AssistantRequest extends NexusPlanOptions {
  /**
   * Respaldo determinista sin red (p. ej. el compilador de eventos de la
   * QuickAutomationBar). Devuelve `null` cuando no sabe resolver la instrucción.
   */
  localPlanner?: (instruction: string) => AgentPlan | null;
  /**
   * Permite saltar la llamada remota cuando se sabe que el gateway no está
   * configurado, evitando un viaje inútil en cada instrucción.
   */
  useRemote?: boolean;
}

/**
 * Flujo del asistente (AGENT_ARCHITECTURE.md §2): primero el modelo remoto vía
 * `/api/agent`; si no hay plan utilizable, el planificador local. El resultado
 * indica el origen para que la UI lo muestre en la aprobación.
 */
export async function planWithAssistant(request: AssistantRequest): Promise<AssistantOutcome> {
  const useRemote = request.useRemote ?? true;
  let remotePlan: AgentPlan | null = null;
  let remoteReason = "El asistente remoto no está disponible en este servidor.";

  if (useRemote) {
    // Una única llamada remota por instrucción: de ella salen el plan y el
    // motivo que se muestra si hace falta el respaldo local.
    const remote = await requestNexusPlan(request);
    remotePlan = remote.plan;
    remoteReason = remote.reason ?? remoteReason;
  }

  if (remotePlan) return { plan: remotePlan, source: "nexus-ai" };

  const localPlan = request.localPlanner ? request.localPlanner(request.instruction) : null;
  if (localPlan) {
    return { plan: localPlan, source: "local", ...(remoteReason ? { reason: remoteReason } : {}) };
  }

  return {
    plan: null,
    source: null,
    reason: remoteReason || "El asistente no pudo generar un plan con esta instrucción.",
  };
}
