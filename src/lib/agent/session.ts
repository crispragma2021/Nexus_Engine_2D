// Agent session — memory, autonomy modes, snapshot handling and the
// plan → approval → atomic transaction → diagnostics pipeline (brief step 7).
//
// The session is pure state + pure transitions (no React), so it is testable
// under plain Node and reusable by any host surface (AgentPanel, the
// QuickAutomationBar, the in-situ prompt). Design rules from the brief:
//   - Supervised is the default autonomy mode: every plan is shown and the
//     user approves it before anything touches the project.
//   - Snapshot is the default restore mode: the session remembers the project
//     at its start and every applied plan keeps full before/after snapshots.
//   - The agent never publishes: preview is a host action, not a project
//     operation, and there is no automatic publishing of any kind.
//   - Everything the agent does (or refuses to do) is recorded in the audit
//     log so the user can inspect the session's memory.
//
// Importable under plain Node (tests/conformance): explicit .ts extensions.

import type { GDProject } from "../editor/types.ts";
import { applyPlan, rollbackAppliedPlan, type AgentPlan, type PlanResult } from "./operations.ts";
import { validatePlan } from "./validator.ts";

export const SESSION_VERSION = 1 as const;

/** Autonomy modes (brief: Supervised default). */
export type AutonomyMode = "Supervised" | "SemiAutonomous" | "Autonomous";
export const AUTONOMY_MODES: readonly AutonomyMode[] = [
  "Supervised",
  "SemiAutonomous",
  "Autonomous",
];

/** Restore strategy (brief: snapshot default). */
export type SnapshotMode = "snapshot" | "branch";
export const SNAPSHOT_MODES: readonly SnapshotMode[] = ["snapshot", "branch"];

export const DEFAULT_AUTONOMY_MODE: AutonomyMode = "Supervised";
export const DEFAULT_SNAPSHOT_MODE: SnapshotMode = "snapshot";

/** Audit log cap: the session memory is bounded, never unbounded. */
export const MAX_AUDIT_ENTRIES = 100;
/** Kept before/after snapshots: enough for "undo last plan" chains without
 *  holding the whole project history twice. */
export const MAX_APPLIED_PLANS = 10;

export type AgentAuditKind =
  "session-start" | "applied" | "rejected" | "cancelled" | "undone" | "restored" | "mode";

export interface AgentAuditEntry {
  /** ISO timestamp. */
  at: string;
  kind: AgentAuditKind;
  /** Human-readable Spanish line for the panel. */
  label: string;
  planId?: string;
}

export interface AgentSessionState {
  version: typeof SESSION_VERSION;
  mode: AutonomyMode;
  snapshotMode: SnapshotMode;
  /** The project at the start of the session (snapshot restore target). */
  baseline: GDProject;
  /** Applied plans with full before/after snapshots; most recent last. */
  applied: PlanResult[];
  /** Bounded session memory, most recent last. */
  audit: AgentAuditEntry[];
}

const now = () => new Date().toISOString();

export function makeAuditEntry(
  kind: AgentAuditKind,
  label: string,
  planId?: string,
  at: string = now(),
): AgentAuditEntry {
  return planId === undefined ? { at, kind, label } : { at, kind, label, planId };
}

function pushAudit(session: AgentSessionState, entry: AgentAuditEntry): AgentSessionState {
  const audit = [...session.audit, entry];
  if (audit.length > MAX_AUDIT_ENTRIES) audit.splice(0, audit.length - MAX_AUDIT_ENTRIES);
  return { ...session, audit };
}

export function createAgentSession(project: GDProject, at: string = now()): AgentSessionState {
  return {
    version: SESSION_VERSION,
    mode: DEFAULT_AUTONOMY_MODE,
    snapshotMode: DEFAULT_SNAPSHOT_MODE,
    baseline: project,
    applied: [],
    audit: [
      makeAuditEntry(
        "session-start",
        `Sesión iniciada en «${project.name}» (modo ${DEFAULT_AUTONOMY_MODE}, snapshots).`,
        undefined,
        at,
      ),
    ],
  };
}

/** Runtime guard for persisted/hydrated session state. */
export function isAgentSessionState(value: unknown): value is AgentSessionState {
  if (typeof value !== "object" || value === null) return false;
  const session = value as Partial<AgentSessionState>;
  return (
    session.version === SESSION_VERSION &&
    (session.mode === "Supervised" ||
      session.mode === "SemiAutonomous" ||
      session.mode === "Autonomous") &&
    (session.snapshotMode === "snapshot" || session.snapshotMode === "branch") &&
    typeof session.baseline === "object" &&
    session.baseline !== null &&
    Array.isArray(session.applied) &&
    Array.isArray(session.audit)
  );
}

export function setAgentMode(
  session: AgentSessionState,
  mode: AutonomyMode,
  at: string = now(),
): AgentSessionState {
  if (session.mode === mode) return session;
  return pushAudit(
    { ...session, mode },
    makeAuditEntry("mode", `Modo de autonomía cambiado a ${mode}.`, undefined, at),
  );
}

export function setAgentSnapshotMode(
  session: AgentSessionState,
  mode: SnapshotMode,
  at: string = now(),
): AgentSessionState {
  if (session.snapshotMode === mode) return session;
  return pushAudit(
    { ...session, snapshotMode: mode },
    makeAuditEntry("mode", `Modo de restauración cambiado a ${mode}.`, undefined, at),
  );
}

/**
 * Tool types that remove content from the project. Renames and rewrites are
 * not destructive: the data stays, just addressed differently.
 */
const DESTRUCTIVE_TOOL_TYPES: ReadonlySet<string> = new Set(["delete_object"]);

export function planIsDestructive(plan: AgentPlan): boolean {
  return plan.operations.some((operation) => DESTRUCTIVE_TOOL_TYPES.has(operation.type));
}

/**
 * Autonomy gating (brief): Supervised always shows the plan first;
 * SemiAutonomous applies safe plans directly and still asks for destructive
 * ones; Autonomous applies everything — but every case stays atomic,
 * audited and one-click undoable, and nothing is ever published.
 */
export function planRequiresApproval(plan: AgentPlan, mode: AutonomyMode): boolean {
  switch (mode) {
    case "Supervised":
      return true;
    case "SemiAutonomous":
      return planIsDestructive(plan);
    case "Autonomous":
      return false;
  }
}

export interface EvaluateOutcome {
  /** Session after the attempt (audit always updated, applied only on success). */
  session: AgentSessionState;
  result: PlanResult;
}

/**
 * The trust boundary of the whole pipeline: validate → dry-run → atomic apply.
 * Never throws. On any failure the session keeps the same project and records
 * the rejection with its diagnostics (the user sees exactly why).
 */
export function evaluateAndApplyPlan(
  session: AgentSessionState,
  project: GDProject,
  plan: AgentPlan,
  at: string = now(),
): EvaluateOutcome {
  const validation = validatePlan(plan, project);
  if (!validation.ok) {
    const first = validation.errors[0];
    const rejected: PlanResult = {
      plan,
      ok: false,
      project,
      records: [],
      diagnostics: validation.diagnostics,
    };
    return {
      session: pushAudit(
        session,
        makeAuditEntry(
          "rejected",
          `Plan rechazado: ${first ? first.message : "el plan no es válido."}`,
          plan.id,
          at,
        ),
      ),
      result: rejected,
    };
  }

  const result = applyPlan(project, plan);
  if (!result.ok) {
    const firstError = result.diagnostics.find((diagnostic) => diagnostic.severity === "error");
    return {
      session: pushAudit(
        session,
        makeAuditEntry(
          "rejected",
          `Transacción abortada (proyecto intacto): ${firstError ? firstError.message : "error desconocido."}`,
          plan.id,
          at,
        ),
      ),
      result,
    };
  }

  const applied = [...session.applied, result];
  if (applied.length > MAX_APPLIED_PLANS) applied.splice(0, applied.length - MAX_APPLIED_PLANS);
  const summary = result.records.flatMap((record) => [
    ...record.created,
    ...record.modified,
    ...record.deleted,
  ]).length;
  return {
    session: pushAudit(
      { ...session, applied },
      makeAuditEntry(
        "applied",
        `Plan aplicado (${result.records.length} operaciones, ${summary} entidades): ${plan.summary}`,
        plan.id,
        at,
      ),
    ),
    result,
  };
}

export interface RestoreOutcome {
  session: AgentSessionState;
  /** Project to load after the restore; null when there is nothing to restore. */
  project: GDProject | null;
}

/** Undo the most recent applied plan using its recorded before-snapshot. */
export function undoLastAgentPlan(session: AgentSessionState, at: string = now()): RestoreOutcome {
  const last = session.applied[session.applied.length - 1];
  if (!last) return { session, project: null };
  return {
    session: pushAudit(
      { ...session, applied: session.applied.slice(0, -1) },
      makeAuditEntry("undone", `Plan deshecho: ${last.plan.summary}`, last.plan.id, at),
    ),
    project: rollbackAppliedPlan(last),
  };
}

/** Restore the project to the session start (snapshot mode) and clear the
 *  applied stack, which is invalidated by a full rollback. */
export function restoreAgentBaseline(
  session: AgentSessionState,
  at: string = now(),
): RestoreOutcome {
  if (session.applied.length === 0) return { session, project: null };
  return {
    session: pushAudit(
      { ...session, applied: [] },
      makeAuditEntry("restored", "Proyecto restaurado al punto de partida de la sesión."),
    ),
    project: session.baseline,
  };
}

/**
 * Appends a standalone audit entry (e.g. the deterministic in-situ editor
 * surfacing an AI edit through its own pipeline). Does not create an applied
 * plan: that edit is undone with the editor's regular undo.
 */
export function withAuditEntry(
  session: AgentSessionState,
  entry: AgentAuditEntry,
): AgentSessionState {
  return pushAudit(session, entry);
}
