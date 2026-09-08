// Adaptador Node del gateway Nexus AI (`/api/agent`).
//
// `gemini-gateway.ts` contiene toda la lógica (pura y testeada); este módulo la
// expone sobre `http.IncomingMessage` / `http.ServerResponse` para las dos
// superficies Node del repositorio:
//   - el middleware de desarrollo en `vite.config.ts` (`npm run dev`);
//   - el servidor propio `scripts/run_nexus_server.mjs` (self-hosting).
//
// Las interfaces son estructurales a propósito: así los tests pueden ejercer el
// adaptador con dobles mínimos, sin levantar un servidor real.
//
// Importable bajo Node plano (tests): extensiones .ts explícitas, sin React.

import {
  handleAgentRequest,
  NEXUS_AGENT_ROUTE,
  MAX_GATEWAY_CHARS,
  type GatewayDeps,
  type GatewayResponse,
} from "./gemini-gateway.ts";

/** Límite defensivo del cuerpo entrante (4× el límite lógico de la petición). */
export const MAX_NODE_BODY_BYTES = MAX_GATEWAY_CHARS * 4;

/** Petición Node mínima (la cumple `http.IncomingMessage`). */
export interface GatewayNodeRequest {
  method?: string | undefined;
  url?: string | undefined;
  [Symbol.asyncIterator](): AsyncIterator<unknown>;
}

/** Respuesta Node mínima (la cumple `http.ServerResponse`). */
export interface GatewayNodeResponse {
  statusCode?: number | undefined;
  setHeader(name: string, value: string | number | readonly string[]): unknown;
  end(chunk?: unknown): unknown;
}

/**
 * Ruta de una URL de petición Node (puede ser relativa, con query o con hash).
 * Devuelve `""` cuando no se puede resolver.
 */
export function gatewayPathOf(url: unknown): string {
  if (typeof url !== "string" || url.trim().length === 0) return "";
  try {
    const parsed = new URL(url.trim(), "http://nexus.local");
    const pathname = parsed.pathname.replace(/\/+$/, "");
    return pathname.length > 0 ? pathname : "/";
  } catch {
    return "";
  }
}

/** True cuando la petición apunta exactamente al gateway del asistente. */
export function isGatewayRequest(url: unknown): boolean {
  return gatewayPathOf(url) === NEXUS_AGENT_ROUTE;
}

/**
 * Lee y parsea el cuerpo JSON de una petición Node. Devuelve `null` si el
 * cuerpo está vacío, no es JSON o supera el límite defensivo: en todos los
 * casos el gateway responde 400 sin exponer detalles internos.
 */
export async function readJsonBody(req: GatewayNodeRequest): Promise<unknown> {
  const chunks: string[] = [];
  let size = 0;
  try {
    for await (const chunk of req) {
      const text = typeof chunk === "string" ? chunk : Buffer.from(chunk as ArrayBuffer).toString();
      size += text.length;
      if (size > MAX_NODE_BODY_BYTES) return null;
      chunks.push(text);
    }
  } catch {
    return null;
  }
  const raw = chunks.join("").trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

/** Escribe una `GatewayResponse` en una respuesta Node. */
export function writeGatewayResponse(res: GatewayNodeResponse, result: GatewayResponse): void {
  res.statusCode = result.status;
  for (const [name, value] of Object.entries(result.headers)) {
    res.setHeader(name, value);
  }
  res.end(JSON.stringify(result.body));
}

/**
 * Atiende la petición si es del gateway y devuelve si la manejó. Cuando
 * devuelve `false` el servidor debe seguir su flujo habitual (assets, SSR):
 * el adaptador nunca intercepta otra ruta.
 */
export async function handleGatewayNodeRequest(
  req: GatewayNodeRequest,
  res: GatewayNodeResponse,
  deps: GatewayDeps = {},
): Promise<boolean> {
  if (!isGatewayRequest(req.url)) return false;
  const body = req.method?.toUpperCase() === "POST" ? await readJsonBody(req) : null;
  const result = await handleAgentRequest(req.method ?? "GET", body, deps);
  writeGatewayResponse(res, result);
  return true;
}
