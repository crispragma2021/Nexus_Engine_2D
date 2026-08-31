// Shared agent pipeline for every AI surface (AgentPanel, QuickAutomationBar):
// plan → approve/cancel (gated by the session's autonomy mode) → atomic
// transaction in the store → preview (host action) → diagnostics (audit log).
// The LLM never touches React state: only validated AgentPlans reach the
// store, and the store applies them as one undoable transaction.

import * as React from "react";
import { useEditor } from "@/lib/editor/store";
import {
  evaluateAndApplyPlan,
  makeAuditEntry,
  restoreAgentBaseline,
  undoLastAgentPlan,
} from "@/lib/agent/session";
import { summarizePlan, type AgentPlan } from "@/lib/agent/operations";
import { planRequiresApproval } from "@/lib/agent/session";
import { planFromInstruction } from "@/lib/agent/planner";

export interface AgentCommitResult {
  ok: boolean;
  /** Human-readable result lines (summarizePlan) for the UI. */
  lines: string[];
  /** First error message when the transaction was rejected/aborted. */
  error?: string;
}

export function useAgentCommit() {
  const { project, agent, activeSceneName, dispatch } = useEditor();

  /** Builds a plan from a free-text instruction (deterministic planner). */
  const planFromPrompt = React.useCallback(
    (prompt: string) => planFromInstruction(prompt, { project, activeSceneName }),
    [project, activeSceneName],
  );

  const needsApproval = React.useCallback(
    (plan: AgentPlan) => planRequiresApproval(plan, agent.mode),
    [agent.mode],
  );

  /**
   * Runs the full pipeline for one plan: validate → dry-run → atomic apply.
   * Always dispatches the resulting session state (applied or rejected); a
   * rejected plan leaves the project untouched and records the diagnostics.
   */
  const commit = React.useCallback(
    (plan: AgentPlan): AgentCommitResult => {
      const outcome = evaluateAndApplyPlan(agent, project, plan);
      dispatch({
        type: "applyAgentPlan",
        project: outcome.result.ok ? outcome.result.project : project,
        agent: outcome.session,
        ...(outcome.result.ok && plan.sceneName ? { sceneName: plan.sceneName } : {}),
      });
      const lines = summarizePlan(outcome.result);
      const error = outcome.result.ok
        ? undefined
        : outcome.result.diagnostics
            .filter((diagnostic) => diagnostic.severity === "error")
            .map((diagnostic) => diagnostic.message)
            .join(" · ") || "El plan no se pudo aplicar.";
      return { ok: outcome.result.ok, lines, ...(error ? { error } : {}) };
    },
    [agent, project, dispatch],
  );

  /** Undoes the most recent applied plan using its recorded snapshot. */
  const undoPlan = React.useCallback((): boolean => {
    const outcome = undoLastAgentPlan(agent);
    if (!outcome.project) return false;
    dispatch({ type: "applyAgentPlan", project: outcome.project, agent: outcome.session });
    return true;
  }, [agent, dispatch]);

  /** Restores the project to the session start (snapshot mode). */
  const restoreBaseline = React.useCallback((): boolean => {
    const outcome = restoreAgentBaseline(agent);
    if (!outcome.project) return false;
    dispatch({ type: "applyAgentPlan", project: outcome.project, agent: outcome.session });
    return true;
  }, [agent, dispatch]);

  /** Appends a standalone audit entry (e.g. a user-cancelled plan). */
  const audit = React.useCallback(
    (kind: Parameters<typeof makeAuditEntry>[0], label: string, planId?: string) => {
      dispatch({ type: "agentAudit", entry: makeAuditEntry(kind, label, planId) });
    },
    [dispatch],
  );

  return { planFromPrompt, needsApproval, commit, undoPlan, restoreBaseline, audit };
}
