// Plan/operation validator — the trust boundary between anything that "looks
// like an agent instruction" (model output, user shortcut, future remote AI)
// and the editor store.
//
// Mirrors the brief:
//   - the agent must validate every operation against the contract;
//   - it must consult the supported-capability matrix (capabilities.ts) and
//     report — not fake — what the runtime cannot do;
//   - the model never reaches React state, free JSON or files: only plans that
//     pass validatePlan may be applied (applyPlan in operations.ts).
//
// Importable under plain Node (tests/conformance): explicit .ts extensions.

import type { GDProject } from "../editor/types.ts";
import { TOOL_NAMES, toolByName } from "./tools.ts";
import { applyOperation, OPERATION_VERSION } from "./operations.ts";
import type { AgentDiagnostic, AgentPlan, ProjectOperation } from "./operations.ts";

export type AgentValidationErrorCode =
  "invalid-plan" | "invalid-operation" | "unknown-tool" | "tool-unsupported" | "invalid-payload";

export class AgentValidationError extends Error {
  readonly code: AgentValidationErrorCode;

  constructor(code: AgentValidationErrorCode, message: string) {
    super(message);
    this.name = "AgentValidationError";
    this.code = code;
  }
}

export interface ValidationResult {
  ok: boolean;
  errors: AgentValidationError[];
  diagnostics: AgentDiagnostic[];
}

const okResult = (): ValidationResult => ({ ok: true, errors: [], diagnostics: [] });

const toDiagnostic = (error: AgentValidationError): AgentDiagnostic => ({
  code:
    error.code === "invalid-plan" || error.code === "invalid-operation"
      ? "invalid-operation"
      : error.code,
  severity: "error",
  message: error.message,
});

/** Max operations per plan (brief: bounded autonomy, never unbounded). */
export const MAX_PLAN_OPERATIONS = 50;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Validates one operation: contract shape → tool exists → tool supported →
 * payload valid against the CURRENT project (real ids, names, capabilities).
 * This is the function that stops hallucinated ids and invented capabilities.
 */
export function validateOperation(operation: unknown, project: GDProject): ValidationResult {
  if (!isRecord(operation)) {
    const error = new AgentValidationError("invalid-operation", "La operación no es un objeto.");
    return { ok: false, errors: [error], diagnostics: [toDiagnostic(error)] };
  }

  const shape = operation as unknown as Partial<ProjectOperation>;
  if (
    typeof shape.id !== "string" ||
    shape.id.trim().length === 0 ||
    shape.version !== OPERATION_VERSION ||
    typeof shape.type !== "string" ||
    shape.type.trim().length === 0 ||
    !isRecord(shape.payload)
  ) {
    const error = new AgentValidationError(
      "invalid-operation",
      `La operación no respeta el contrato ProjectOperation (id, version=${OPERATION_VERSION}, type, payload).`,
    );
    return { ok: false, errors: [error], diagnostics: [toDiagnostic(error)] };
  }

  const typed = shape as ProjectOperation;
  const tool = toolByName(typed.type);
  if (!tool) {
    const error = new AgentValidationError(
      "unknown-tool",
      `No existe la herramienta «${typed.type}». Herramientas disponibles: ${TOOL_NAMES.join(", ")}.`,
    );
    return { ok: false, errors: [error], diagnostics: [toDiagnostic(error)] };
  }
  if (!tool.supported) {
    const error = new AgentValidationError(
      "tool-unsupported",
      tool.unsupportedReason ?? `La herramienta «${tool.name}» aún no está disponible.`,
    );
    return { ok: false, errors: [error], diagnostics: [toDiagnostic(error)] };
  }

  const payloadError = tool.validate(typed.payload, project);
  if (payloadError) {
    const error = new AgentValidationError("invalid-payload", payloadError);
    return { ok: false, errors: [error], diagnostics: [toDiagnostic(error)] };
  }

  return okResult();
}

/**
 * Validates a whole plan before it is shown to the user for approval:
 * shape, size bounds, and a sequential dry run — each operation is validated
 * against the state the previous operations of the plan produce (the model
 * may create "Nivel 2" and then add variables to it). A failing operation
 * does not stop the run, so one plan reports every error at once.
 */
export function validatePlan(plan: unknown, project: GDProject): ValidationResult {
  if (!isRecord(plan)) {
    const error = new AgentValidationError("invalid-plan", "El plan no es un objeto.");
    return { ok: false, errors: [error], diagnostics: [toDiagnostic(error)] };
  }
  const typed = plan as unknown as AgentPlan;
  const errors: AgentValidationError[] = [];

  if (typeof typed.id !== "string" || typed.id.trim().length === 0) {
    errors.push(new AgentValidationError("invalid-plan", "El plan necesita un id."));
  }
  if (typeof typed.summary !== "string" || typed.summary.length > 500) {
    errors.push(
      new AgentValidationError(
        "invalid-plan",
        "El plan necesita un resumen de texto (máximo 500 caracteres).",
      ),
    );
  }
  if (!Array.isArray(typed.operations)) {
    errors.push(
      new AgentValidationError("invalid-plan", "El plan necesita una lista de operaciones."),
    );
    return {
      ok: false,
      errors,
      diagnostics: errors.map(toDiagnostic),
    };
  }
  if (typed.operations.length === 0) {
    errors.push(new AgentValidationError("invalid-plan", "El plan no contiene operaciones."));
  }
  if (typed.operations.length > MAX_PLAN_OPERATIONS) {
    errors.push(
      new AgentValidationError(
        "invalid-plan",
        `El plan propone demasiadas operaciones a la vez (máximo ${MAX_PLAN_OPERATIONS}).`,
      ),
    );
  }

  // Sequential dry run: each operation is validated against the state the
  // previous operations of the plan have produced, so a plan can create
  // "Nivel 2" and then reference it. A failing operation does not stop the
  // run: we keep validating against the last good state to report all errors.
  const seenIds = new Set<string>();
  let working: GDProject = project;
  for (const operation of typed.operations) {
    const operationId = isRecord(operation) && typeof operation.id === "string" ? operation.id : "";
    if (operationId !== "" && seenIds.has(operationId)) {
      errors.push(
        new AgentValidationError(
          "invalid-operation",
          `Dos operaciones comparten el id «${operationId}».`,
        ),
      );
      continue;
    }
    if (operationId !== "") seenIds.add(operationId);
    const result = validateOperation(operation, working);
    errors.push(...result.errors);
    if (result.ok) {
      const outcome = applyOperation(working, operation as ProjectOperation);
      if (!outcome.diagnostics.some((d) => d.severity === "error")) {
        working = outcome.project;
      }
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors, diagnostics: errors.map(toDiagnostic) };
  }
  return okResult();
}
