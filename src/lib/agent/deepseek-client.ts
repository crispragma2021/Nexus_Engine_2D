import type { GDProject } from "../editor/types.ts";
import type { AgentPlan } from "./operations.ts";
import { validatePlan } from "./validator.ts";
import { TOOL_NAMES } from "./tools.ts";

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

const SYSTEM_PROMPT = `Eres el asistente de arquitectura y edición para Nexus Engine 2D.
Tu objetivo es transformar las instrucciones del usuario en un plan estructurado (AgentPlan) con mutaciones seguras sobre el proyecto.

Herramientas disponibles:
${TOOL_NAMES.join(", ")}

Responde ÚNICAMENTE un objeto JSON válido con la siguiente estructura:
{
  "id": "plan_<identificador_unico>",
  "summary": "Resumen conciso en español de las acciones tomadas",
  "operations": [
    {
      "id": "op_1",
      "version": 1,
      "type": "nombre_de_la_herramienta",
      "payload": { ...parámetros de la herramienta... }
    }
  ]
}`;

export interface GeneratePlanOptions {
  prompt: string;
  project: GDProject;
  apiKey?: string;
  model?: string;
}

export async function requestAgentPlan({
  prompt,
  project,
  apiKey = process.env["DEEPSEEK_API_KEY"],
  model = "deepseek-chat",
}: GeneratePlanOptions): Promise<{ plan: AgentPlan | null; error?: string }> {
  if (!apiKey) {
    return { plan: null, error: "DEEPSEEK_API_KEY no configurada." };
  }

  const projectContext = {
    name: project.name,
    scenes: project.scenes.map((s) => ({
      name: s.name,
      objectsCount: s.objects.length,
      instancesCount: s.instances.length,
      objects: s.objects.map((o) => ({ id: o.id, name: o.name, type: o.type })),
    })),
  };

  const body = {
    model,
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Estado actual del proyecto:\n${JSON.stringify(projectContext, null, 2)}\n\nInstrucción: ${prompt}`,
      },
    ],
  };

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      return { plan: null, error: `Error HTTP ${response.status}: ${errText}` };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return { plan: null, error: "Respuesta vacía del modelo." };
    }

    const plan = JSON.parse(content) as AgentPlan;
    const validation = validatePlan(plan, project);

    if (!validation.ok) {
      const issues = validation.errors.map((e) => e.message).join("; ");
      return { plan: null, error: `Plan rechazado por el validador: ${issues}` };
    }

    return { plan };
  } catch (err: unknown) {
    return { plan: null, error: `Fallo de conexión o parseo: ${String(err)}` };
  }
}
