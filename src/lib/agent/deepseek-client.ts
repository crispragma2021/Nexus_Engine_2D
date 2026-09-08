import type { GDProject } from "../editor/types.ts";
import type { AgentPlan } from "./operations.ts";
import { planFromModel, type LlmProviderConfig } from "./model.ts";

/**
 * Cliente DeepSeek unificado sobre `model.ts`.
 *
 * Históricamente este módulo duplicaba el gateway LLM (SYSTEM_PROMPT propio,
 * fetch manual sin timeout, parseo sin strip de fences). Desde la unificación,
 * `requestAgentPlan` delega en `planFromModel`: un único punto de verdad para
 * construir el contexto/mensajes, timeout duro (AbortController), validación
 * del endpoint (HTTPS/localhost), strip de fences markdown y re-registro de ids
 * del plan. Esta capa solo aporta el endpoint y el modelo por defecto de
 * DeepSeek, manteniendo la API pública que usan scripts/agent-cli.mjs.
 */
/** Base del proveedor DeepSeek, usada como endpoint por defecto en la UI. */
export const DEEPSEEK_BASE_URL = "https://api.deepseek.com";
/** Endpoint chat-completions completo (OpenAI-compatible). */
export const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
export const DEFAULT_DEEPSEEK_MODEL = "deepseek-chat";
/** Timeout generoso por defecto para el planificador remoto de DeepSeek. */
const DEEPSEEK_TIMEOUT_MS = 60_000;

export interface GeneratePlanOptions {
  prompt: string;
  project: GDProject;
  apiKey?: string;
  model?: string;
  /** Escena activa; se deduce del proyecto si no se indica. */
  activeSceneName?: string;
}

export async function requestAgentPlan({
  prompt,
  project,
  apiKey = process.env["DEEPSEEK_API_KEY"],
  model = DEFAULT_DEEPSEEK_MODEL,
  activeSceneName,
}: GeneratePlanOptions): Promise<{ plan: AgentPlan | null; error?: string }> {
  if (!apiKey) {
    return { plan: null, error: "DEEPSEEK_API_KEY no configurada." };
  }

  const provider: LlmProviderConfig = {
    endpoint: DEEPSEEK_API_URL,
    model,
    token: apiKey,
    timeoutMs: DEEPSEEK_TIMEOUT_MS,
  };
  const sceneName = activeSceneName ?? project.firstLayoutName ?? project.scenes[0]?.name ?? "";
  const result = await planFromModel({
    instruction: prompt,
    project,
    activeSceneName: sceneName,
    provider,
  });

  if (result.plan) return { plan: result.plan };
  return { plan: null, error: result.reason ?? "No se pudo generar un plan con DeepSeek." };
}
