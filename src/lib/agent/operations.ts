// ProjectOperation contract — versioned, validated, reversible operations over
// the GDProject document (brief: "CONTRATO DE OPERACIONES").
//
// Design rules:
//   - The AI model never mutates React state, free JSON or files: it produces
//     an AgentPlan (a list of ProjectOperations) that passes the validator.
//   - Operations are pure project→project transformations (see tools.ts).
//   - applyPlan is atomic: if any operation fails, the original project is
//     returned untouched and every diagnostic is reported.
//   - Reversibility: projects are small JSON documents, so each operation
//     records full before/after snapshots (OperationRecord). The editor store
//     already uses the same strategy for its undo stack.
//
// This module is importable under plain Node (tests/conformance): relative
// imports carry explicit .ts extensions.

import type { GDProject } from "../editor/types.ts";
import { uid } from "../editor/ids.ts";
import { TOOL_REGISTRY, toolByName } from "./tools.ts";

export const OPERATION_VERSION = 1 as const;

/** A single, addressable unit of change over the project document. */
export interface ProjectOperation<TType extends string = string, TPayload = unknown> {
  id: string;
  version: typeof OPERATION_VERSION;
  /** Game tool registry name, e.g. "create_instance". */
  type: TType;
  payload: TPayload;
}

export type DiagnosticSeverity = "info" | "warning" | "error";

export interface AgentDiagnostic {
  code:
    | "unknown-tool"
    | "tool-unsupported"
    | "invalid-payload"
    | "invalid-operation"
    | "empty-plan"
    | "tool-failed";
  severity: DiagnosticSeverity;
  message: string;
  operationId?: string;
  path?: string;
}

export type EntityKind =
  "scene" | "object" | "instance" | "variable" | "event" | "animation" | "behavior" | "asset";

export interface EntityRef {
  kind: EntityKind;
  id: string;
  name: string;
}

export interface OperationOutcome {
  /** Resulting project; identical to the input when the operation failed. */
  project: GDProject;
  diagnostics: AgentDiagnostic[];
  created: EntityRef[];
  modified: EntityRef[];
  deleted: EntityRef[];
}

/**
 * A registered tool in the Game Tool Registry (tools.ts). Method syntax keeps
 * the run/validate parameters bivariant so each tool can narrow its payload
 * type while staying assignable to the plain ToolDefinition.
 */
export interface ToolDefinition<TPayload = unknown> {
  name: string;
  label: string;
  description: string;
  /** whether applying this tool changes the project */
  mutates: boolean;
  supported: boolean;
  /** honest reason shown when supported is false (never fake capabilities) */
  unsupportedReason?: string;
  /** Returns a friendly Spanish error message, or null when the payload is valid. */
  validate(payload: unknown, project: GDProject): string | null;
  /** Pure transformation; must not throw and must not mutate its input. */
  run(project: GDProject, payload: TPayload, operation: ProjectOperation): OperationOutcome;
}

export interface AgentPlan {
  id: string;
  summary: string;
  /** Target scene; defaults to the active scene when omitted. */
  sceneName?: string;
  operations: ProjectOperation[];
}

/** One applied operation with its full before/after state (rollback material). */
export interface OperationRecord {
  operation: ProjectOperation;
  before: GDProject;
  after: GDProject;
  diagnostics: AgentDiagnostic[];
  created: EntityRef[];
  modified: EntityRef[];
  deleted: EntityRef[];
}

export interface PlanResult {
  plan: AgentPlan;
  /** false → nothing was applied; `project` is the original input. */
  ok: boolean;
  project: GDProject;
  records: OperationRecord[];
  diagnostics: AgentDiagnostic[];
}

export function createOperation<TType extends string>(
  type: TType,
  payload: unknown,
  id: string = uid("op"),
): ProjectOperation<TType> {
  return { id, version: OPERATION_VERSION, type, payload };
}

export function createPlan(
  summary: string,
  operations: ProjectOperation[],
  sceneName?: string,
): AgentPlan {
  const plan: AgentPlan = { id: uid("plan"), summary, operations };
  if (sceneName !== undefined) plan.sceneName = sceneName;
  return plan;
}

const failed = (project: GDProject, diagnostic: AgentDiagnostic): OperationOutcome => ({
  project,
  diagnostics: [diagnostic],
  created: [],
  modified: [],
  deleted: [],
});

/**
 * Executes one operation: registry lookup → capability/payload validation →
 * pure transformation. Never throws; failures come back as diagnostics with
 * the project left untouched.
 */
export function applyOperation(project: GDProject, operation: ProjectOperation): OperationOutcome {
  if (
    !operation ||
    typeof operation !== "object" ||
    typeof operation.id !== "string" ||
    operation.id.length === 0 ||
    operation.version !== OPERATION_VERSION ||
    typeof operation.type !== "string" ||
    operation.payload === null ||
    typeof operation.payload !== "object"
  ) {
    return failed(project, {
      code: "invalid-operation",
      severity: "error",
      message: "La operación no respeta el contrato ProjectOperation.",
    });
  }

  const tool = toolByName(operation.type);
  if (!tool) {
    return failed(project, {
      code: "unknown-tool",
      severity: "error",
      message: `No existe la herramienta «${operation.type}».`,
      operationId: operation.id,
    });
  }
  if (!tool.supported) {
    return failed(project, {
      code: "tool-unsupported",
      severity: "error",
      message:
        (tool.unsupportedReason ?? `La herramienta «${tool.name}» aún no está disponible.`) +
        " El agente no inventa capacidades que el runtime no tiene.",
      operationId: operation.id,
    });
  }

  const payloadError = tool.validate(operation.payload, project);
  if (payloadError) {
    return failed(project, {
      code: "invalid-payload",
      severity: "error",
      message: payloadError,
      operationId: operation.id,
    });
  }

  try {
    const outcome = tool.run(project, operation.payload, operation);
    if (outcome.diagnostics.some((d) => d.severity === "error")) {
      return failed(project, { ...outcome.diagnostics[0]!, operationId: operation.id });
    }
    return outcome;
  } catch (error) {
    return failed(project, {
      code: "tool-failed",
      severity: "error",
      message: error instanceof Error ? error.message : "La herramienta falló de forma inesperada.",
      operationId: operation.id,
    });
  }
}

/**
 * Executes a whole plan as one transaction. Atomic: the first failed operation
 * aborts the plan and the original project is returned (no partial changes),
 * exactly like the editor's undoable store actions.
 */
export function applyPlan(project: GDProject, plan: AgentPlan): PlanResult {
  if (!Array.isArray(plan.operations) || plan.operations.length === 0) {
    return {
      plan,
      ok: false,
      project,
      records: [],
      diagnostics: [
        {
          code: "empty-plan",
          severity: "error",
          message: "El plan no contiene operaciones.",
        },
      ],
    };
  }

  const records: OperationRecord[] = [];
  const diagnostics: AgentDiagnostic[] = [];
  let current = project;

  for (const operation of plan.operations) {
    const before = current;
    const outcome = applyOperation(current, operation);
    diagnostics.push(...outcome.diagnostics);
    if (outcome.diagnostics.some((d) => d.severity === "error")) {
      // Atomic abort: nothing of this plan is kept.
      return { plan, ok: false, project, records, diagnostics };
    }
    records.push({
      operation,
      before,
      after: outcome.project,
      diagnostics: outcome.diagnostics,
      created: outcome.created,
      modified: outcome.modified,
      deleted: outcome.deleted,
    });
    current = outcome.project;
  }

  return { plan, ok: true, project: current, records, diagnostics };
}

/** The project state to restore when the user undoes a whole plan. */
export function rollbackAppliedPlan(result: PlanResult): GDProject {
  const first = result.records[0];
  return first ? first.before : result.project;
}

const ENTITY_LABEL: Record<EntityRef["kind"], string> = {
  scene: "Escena",
  object: "Objeto",
  instance: "Instancia",
  variable: "Variable",
  event: "Evento",
  animation: "Animación",
  behavior: "Comportamiento",
  asset: "Recurso",
};

/**
 * Human-readable diff of an applied plan, for the "show before applying" UI
 * (AgentPanel) and for chat replies.
 */
export function summarizePlan(result: PlanResult): string[] {
  const lines: string[] = [];
  if (result.plan.summary) lines.push(result.plan.summary);
  if (!result.ok) {
    lines.push(
      "Plan no aplicado (transacción abortada): el proyecto sigue intacto.",
      ...result.diagnostics.filter((d) => d.severity === "error").map((d) => `⚠ ${d.message}`),
    );
    return lines;
  }
  for (const record of result.records) {
    for (const entity of record.created) {
      lines.push(`${ENTITY_LABEL[entity.kind]} creada: «${entity.name}»`);
    }
    for (const entity of record.modified) {
      lines.push(`${ENTITY_LABEL[entity.kind]} modificada: «${entity.name}»`);
    }
    for (const entity of record.deleted) {
      lines.push(`${ENTITY_LABEL[entity.kind]} eliminada: «${entity.name}»`);
    }
  }
  const warnings = result.diagnostics.filter((d) => d.severity === "warning");
  for (const warning of warnings) lines.push(`⚠ ${warning.message}`);
  if (lines.length === 1) lines.push("Plan aplicado sin cambios visibles.");
  return lines;
}
