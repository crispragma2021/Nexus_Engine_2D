// Función serverless de Vercel: `/api/agent` (AGENT_ARCHITECTURE.md §1).
//
// Adaptador fino sobre la lógica pura de `src/lib/agent/gemini-gateway.ts`:
// Vercel ya deja el cuerpo JSON en `req.body`, así que aquí solo se traduce el
// resultado del gateway a una respuesta HTTP. `GEMINI_API_KEY` se configura en
// el proyecto de Vercel (entorno del servidor) y nunca llega al cliente.
//
// Se tipan las firmas de Vercel de forma estructural a propósito: el repo no
// depende de `@vercel/node` y las reglas prohíben añadir dependencias.

import { handleAgentRequest } from "../src/lib/agent/gemini-gateway";

interface VercelLikeRequest {
  method?: string;
  body?: unknown;
}

interface VercelLikeResponse {
  setHeader(name: string, value: string): unknown;
  status(code: number): VercelLikeResponse;
  json(body: unknown): void;
}

export default async function handler(
  req: VercelLikeRequest,
  res: VercelLikeResponse,
): Promise<void> {
  const result = await handleAgentRequest(req.method ?? "GET", req.body ?? null);
  for (const [name, value] of Object.entries(result.headers)) {
    res.setHeader(name, value);
  }
  res.status(result.status).json(result.body);
}
