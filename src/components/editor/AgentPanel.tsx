// Agent panel — the conversational surface of the agent (brief step 7):
// free-text instruction → deterministic plan → approval (gated by the
// session's autonomy mode) → atomic transaction → preview (host action) →
// diagnostics and session memory (audit log). The LLM never mutates React
// state: only validated AgentPlans reach the store, as one undoable
// transaction, and nothing is ever published automatically.

import * as React from "react";
import { Bot, ChevronDown, Cpu, Play, RotateCcw, Send, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useEditor } from "@/lib/editor/store";
import { validatePlan } from "@/lib/agent/validator";
import {
  AUTONOMY_MODES,
  SNAPSHOT_MODES,
  type AutonomyMode,
  type SnapshotMode,
} from "@/lib/agent/session";
import { planFromModel } from "@/lib/agent/model";
import { DEEPSEEK_BASE_URL, DEFAULT_DEEPSEEK_MODEL } from "@/lib/agent/deepseek-client";
import { TOOL_REGISTRY } from "@/lib/agent/tools";
import type { AgentPlan } from "@/lib/agent/operations";
import { useAgentCommit } from "./hooks/use-agent-commit";
import { cn } from "@/lib/utils";

interface PanelOperation {
  type: string;
  label: string;
  payload: string;
}

interface PanelMessage {
  id: number;
  role: "user" | "agent";
  kind: "info" | "plan" | "applied" | "rejected";
  text?: string;
  lines?: string[];
  operations?: PanelOperation[];
  plan?: AgentPlan;
  /** true while a plan message still shows its approve/cancel buttons */
  pending?: boolean;
  /** The prompt to rerun with the local deterministic planner. */
  retryPrompt?: string;
}

let messageId = 0;
const nextMessageId = () => (messageId += 1);

const AUTONOMY_LABELS: Record<AutonomyMode, string> = {
  Supervised: "Supervisado",
  SemiAutonomous: "Semiautónomo",
  Autonomous: "Autónomo",
};

const AUTONOMY_HINTS: Record<AutonomyMode, string> = {
  Supervised: "Cada plan se muestra y lo apruebas antes de tocar el proyecto.",
  SemiAutonomous:
    "Aplica planes seguros directamente; los destructivos siguen pidiendo aprobación.",
  Autonomous:
    "Aplica todo al instante. Sigue siendo atómico, auditado y deshecho en un clic; nunca publica.",
};

export function AgentPanel() {
  const { ui, project, agent, activeSceneName, dispatch } = useEditor();
  const { planFromPrompt, needsApproval, commit, undoPlan, restoreBaseline, audit } =
    useAgentCommit();
  const [draft, setDraft] = React.useState("");
  const [messages, setMessages] = React.useState<PanelMessage[]>([]);
  const [showAudit, setShowAudit] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  /** Optional remote model (OpenAI-compatible). Per-session only: the token
   *  is never persisted, only used in the outgoing request (same pattern as
   *  the sprite-generation flow). */
  const [showModelConfig, setShowModelConfig] = React.useState(false);
  const [endpoint, setEndpoint] = React.useState(DEEPSEEK_BASE_URL);
  const [modelName, setModelName] = React.useState(DEFAULT_DEEPSEEK_MODEL);
  const [token, setToken] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const open = ui.agentPanelOpen;

  React.useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        dispatch({ type: "ui", patch: { agentPanelOpen: false } });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, dispatch]);

  const close = React.useCallback(() => {
    setToken("");
    dispatch({ type: "ui", patch: { agentPanelOpen: false } });
  }, [dispatch]);

  const pushMessages = React.useCallback((entries: Omit<PanelMessage, "id">[]) => {
    setMessages((previous) => [
      ...previous,
      ...entries.map((entry) => ({ ...entry, id: nextMessageId() })),
    ]);
  }, []);

  const replaceMessage = React.useCallback((id: number, patch: Partial<PanelMessage>) => {
    setMessages((previous) =>
      previous.map((message) => (message.id === id ? { ...message, ...patch } : message)),
    );
  }, []);

  const dismissPending = React.useCallback(() => {
    const pending = messages.find((message) => message.pending && message.plan);
    if (pending?.plan) {
      audit("cancelled", `Plan descartado: ${pending.plan.summary}`, pending.plan.id);
    }
    setMessages((previous) =>
      previous.map((message) => (message.pending ? { ...message, pending: false } : message)),
    );
  }, [messages, audit]);

  const runPlan = React.useCallback(
    (plan: AgentPlan): { kind: "applied" | "rejected"; lines: string[]; text?: string } => {
      const result = commit(plan);
      if (result.ok) {
        toast.success("Plan aplicado. Puedes deshacerlo desde el panel del agente.");
        return { kind: "applied", lines: result.lines };
      }
      toast.error(result.error ?? "El plan no se pudo aplicar.");
      return {
        kind: "rejected",
        lines: result.lines,
        ...(result.error ? { text: result.error } : {}),
      };
    },
    [commit],
  );

  /** Shared approval flow for a candidate plan (local or model produced). */
  const presentPlan = React.useCallback(
    (plan: AgentPlan) => {
      dismissPending();
      const operations: PanelOperation[] = plan.operations.map((operation) => ({
        type: operation.type,
        label: TOOL_REGISTRY[operation.type]?.label ?? operation.type,
        payload: JSON.stringify(operation.payload).slice(0, 90),
      }));

      if (!needsApproval(plan)) {
        const outcome = runPlan(plan);
        pushMessages([
          {
            role: "agent",
            kind: outcome.kind,
            lines: outcome.lines,
            ...(outcome.text ? { text: outcome.text } : {}),
          },
        ]);
        return;
      }

      const validation = validatePlan(plan, project);
      if (!validation.ok) {
        pushMessages([
          {
            role: "agent",
            kind: "rejected",
            text: "El plan no pasó la validación; el proyecto no cambió:",
            lines: validation.errors.map((error) => error.message),
          },
        ]);
        return;
      }
      pushMessages([
        {
          role: "agent",
          kind: "plan",
          pending: true,
          plan,
          operations,
          text:
            agent.mode === "Supervised"
              ? "Revisa el plan antes de aplicarlo:"
              : "Plan con cambios destructivos — revísalo antes de aplicarlo:",
        },
      ]);
    },
    [dismissPending, needsApproval, runPlan, pushMessages, project, agent.mode],
  );

  /** Deterministic planner path (no remote model involved). */
  const runDeterministic = React.useCallback(
    (prompt: string) => {
      const proposal = planFromPrompt(prompt);
      if (!proposal.plan) {
        pushMessages([
          {
            role: "agent",
            kind: "info",
            text: proposal.reason ?? "No pude generar un plan seguro.",
          },
        ]);
        return;
      }
      presentPlan(proposal.plan);
    },
    [planFromPrompt, pushMessages, presentPlan],
  );

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const prompt = draft.trim();
    if (!prompt || busy) return;
    setDraft("");
    pushMessages([{ role: "user", kind: "info", text: prompt }]);

    if (!endpoint.trim().startsWith("http")) {
      runDeterministic(prompt);
      return;
    }

    // Remote model path: the model only proposes a candidate plan; the same
    // validation + approval gates apply before anything touches the project.
    setBusy(true);
    try {
      const result = await planFromModel({
        instruction: prompt,
        project,
        activeSceneName,
        provider: {
          endpoint: endpoint.trim(),
          ...(modelName.trim() ? { model: modelName.trim() } : {}),
          ...(token.trim() ? { token: token.trim() } : {}),
        },
      });
      if (result.plan) {
        presentPlan(result.plan);
      } else {
        pushMessages([
          {
            role: "agent",
            kind: "info",
            text: `El modelo de IA no pudo generar un plan: ${result.reason ?? "error desconocido."}`,
            retryPrompt: prompt,
          },
        ]);
      }
    } finally {
      setBusy(false);
    }
  };

  const retryLocal = (prompt: string) => {
    runDeterministic(prompt);
  };

  const approve = (message: PanelMessage) => {
    if (!message.plan) return;
    const outcome = runPlan(message.plan);
    replaceMessage(message.id, {
      pending: false,
      kind: outcome.kind,
      lines: outcome.lines,
      ...(outcome.text ? { text: outcome.text } : {}),
    });
  };

  const cancel = (message: PanelMessage) => {
    if (message.plan) {
      audit(
        "cancelled",
        `Plan descartado por el usuario: ${message.plan.summary}`,
        message.plan.id,
      );
    }
    replaceMessage(message.id, {
      pending: false,
      kind: "info",
      text: "Plan descartado. El proyecto no cambió.",
    });
  };

  if (!open) return null;

  const appliedCount = agent.applied.length;
  const recentAudit = agent.audit.slice(-12).reverse();

  return (
    <aside
      aria-label="Panel del agente"
      className="fixed inset-y-0 right-0 z-[45] flex w-full max-w-[400px] flex-col border-l border-separator bg-[#14141B] shadow-2xl"
    >
      {/* header */}
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-separator px-3">
        <Bot className="h-4 w-4 text-[#A996FF]" />
        <span className="text-[13px] font-medium text-foreground">Agente</span>
        <select
          value={agent.mode}
          onChange={(event) =>
            dispatch({ type: "agentSetMode", mode: event.target.value as AutonomyMode })
          }
          aria-label="Modo de autonomía"
          title={AUTONOMY_HINTS[agent.mode]}
          className="ml-auto h-6 rounded border border-separator bg-[#25252E] px-1 text-[10.5px] text-foreground outline-none focus:border-[#6868E8]"
        >
          {AUTONOMY_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {AUTONOMY_LABELS[mode]}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={close}
          aria-label="Cerrar panel del agente"
          className="grid h-6 w-6 place-items-center rounded text-text-secondary hover:bg-elevated hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* chat */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
        {messages.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-separator p-3 text-[11.5px] leading-relaxed text-text-secondary">
            <p className="mb-2 flex items-center gap-1.5 text-text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-[#A996FF]" />
              Pídele al agente cambios seguros sobre el proyecto:
            </p>
            <ul className="list-disc space-y-1 pl-4">
              <li>«Crea la escena Nivel 2 y añade la variable puntos»</li>
              <li>«Añade una instancia de Moneda en 200,100»</li>
              <li>«Añade el comportamiento plataforma a Jugador»</li>
              <li>«Crea la variable vidas booleana global»</li>
              <li>«Cuando Jugador colisiona con Moneda, destruye Moneda»</li>
            </ul>
            <p className="mt-2 text-[10.5px]">
              Todo pasa por validación y se aplica como transacción atómica con deshacer. Por
              defecto usa DeepSeek (<span className="text-text-foreground">deepseek-chat</span>); el
              modelo solo propone planes (nunca toca el proyecto directamente). El agente no publica
              nada automáticamente.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((message) => (
              <PanelMessageView
                key={message.id}
                message={message}
                onApprove={approve}
                onCancel={cancel}
                onPreview={() => dispatch({ type: "ui", patch: { previewOpen: true } })}
                onRetryLocal={retryLocal}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* diagnostics / session memory */}
      <div className="shrink-0 border-t border-separator">
        <button
          type="button"
          onClick={() => setShowAudit((value) => !value)}
          className="flex w-full items-center gap-1 px-3 py-1.5 text-[10.5px] text-text-secondary hover:bg-elevated hover:text-foreground"
        >
          <ChevronDown className={cn("h-3 w-3 transition-transform", !showAudit && "-rotate-90")} />
          Diagnósticos y memoria de la sesión ({agent.audit.length})
        </button>
        {showAudit ? (
          <div className="max-h-40 overflow-y-auto border-t border-separator px-3 py-1.5">
            <div className="mb-1.5 flex gap-1.5">
              <button
                type="button"
                onClick={() => {
                  if (undoPlan()) toast.success("Último plan deshecho.");
                }}
                disabled={appliedCount === 0}
                className="flex items-center gap-1 rounded border border-separator px-2 py-0.5 text-[10.5px] text-foreground hover:bg-elevated disabled:opacity-40"
              >
                <RotateCcw className="h-3 w-3" />
                Deshacer último plan
              </button>
              <button
                type="button"
                onClick={() => {
                  if (restoreBaseline()) toast.success("Proyecto restaurado al punto de partida.");
                }}
                disabled={appliedCount === 0}
                className="flex items-center gap-1 rounded border border-separator px-2 py-0.5 text-[10.5px] text-foreground hover:bg-elevated disabled:opacity-40"
              >
                <Trash2 className="h-3 w-3" />
                Restaurar punto de partida
              </button>
              <button
                type="button"
                onClick={() => dispatch({ type: "ui", patch: { previewOpen: true } })}
                className="flex items-center gap-1 rounded bg-primary px-2 py-0.5 text-[10.5px] font-medium text-primary-foreground hover:bg-[#5C36D6]"
              >
                <Play className="h-3 w-3" />
                Vista previa
              </button>
            </div>
            <select
              value={agent.snapshotMode}
              onChange={(event) =>
                dispatch({ type: "agentSetSnapshotMode", mode: event.target.value as SnapshotMode })
              }
              aria-label="Modo de restauración"
              title="Snapshot: punto de partida de la sesión. Branches de proyecto: en etapas posteriores."
              className="mb-1.5 h-6 rounded border border-separator bg-[#25252E] px-1 text-[10px] text-text-secondary outline-none"
            >
              {SNAPSHOT_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  Restauración:{" "}
                  {mode === "snapshot" ? "snapshot (por defecto)" : "branch (próximamente)"}
                </option>
              ))}
            </select>
            <ul className="space-y-1">
              {recentAudit.map((entry, index) => (
                <li
                  key={`${entry.at}-${index}`}
                  className="text-[10px] leading-snug text-text-secondary"
                >
                  <span className="tabular-nums text-text-placeholder">
                    {new Date(entry.at).toLocaleTimeString("es-PY", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>{" "}
                  {entry.label}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {/* optional remote model config */}
      <div className="shrink-0 border-t border-separator">
        <button
          type="button"
          onClick={() => setShowModelConfig((value) => !value)}
          className="flex w-full items-center gap-1 px-3 py-1.5 text-[10.5px] text-text-secondary hover:bg-elevated hover:text-foreground"
        >
          <Cpu className="h-3 w-3" />
          Modelo de IA
          <span
            className={cn(
              endpoint.trim().startsWith("http") ? "text-emerald-400" : "text-text-placeholder",
            )}
          >
            {endpoint.trim().startsWith("http")
              ? "· activo"
              : "· sin configurar (usará planificador local)"}
          </span>
        </button>
        {showModelConfig ? (
          <div className="space-y-1 border-t border-separator px-3 py-2">
            <p className="text-[9.5px] leading-snug text-text-placeholder">
              Configuración por defecto: DeepSeek (endpoint{" "}
              <span className="text-text-secondary">https://api.deepseek.com</span> y modelo{" "}
              <span className="text-text-secondary">deepseek-chat</span>). El token (API key) solo
              se usa en la solicitud y no se guarda. Sin endpoint, el agente usa el planificador
              determinista local.
            </p>
            <input
              value={endpoint}
              onChange={(event) => setEndpoint(event.target.value)}
              placeholder="https://…/v1/chat/completions"
              aria-label="Endpoint del modelo"
              className="h-7 w-full rounded border border-separator bg-[#25252E] px-2 text-[11px] text-foreground outline-none focus:border-[#6868E8]"
            />
            <div className="flex gap-1">
              <input
                value={modelName}
                onChange={(event) => setModelName(event.target.value)}
                placeholder="Modelo (opcional)"
                aria-label="Nombre del modelo"
                className="h-7 w-1/2 rounded border border-separator bg-[#25252E] px-2 text-[11px] text-foreground outline-none focus:border-[#6868E8]"
              />
              <input
                value={token}
                onChange={(event) => setToken(event.target.value)}
                type="password"
                placeholder="Token (opcional)"
                aria-label="Token del proveedor"
                autoComplete="off"
                className="h-7 w-1/2 rounded border border-separator bg-[#25252E] px-2 text-[11px] text-foreground outline-none focus:border-[#6868E8]"
              />
            </div>
          </div>
        ) : null}
      </div>

      {/* input */}
      <form
        onSubmit={(event) => {
          void onSubmit(event);
        }}
        className="flex shrink-0 items-center gap-1 border-t border-separator bg-[#101017] p-2"
      >
        <input
          ref={inputRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={600}
          disabled={busy}
          placeholder="Ej.: crea la escena Nivel 2 y añade la variable puntos"
          aria-label="Instrucción para el agente"
          className="min-w-0 flex-1 rounded-lg border border-separator bg-[#17171F] px-2 py-1.5 text-[12px] text-foreground outline-none placeholder:text-text-placeholder focus:border-[#6868E8] disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!draft.trim() || busy}
          aria-label={busy ? "Consultando el modelo de IA" : "Enviar instrucción al agente"}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground hover:bg-[#5C36D6] disabled:bg-elevated disabled:text-text-placeholder"
        >
          {busy ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
        </button>
      </form>
    </aside>
  );
}

function PanelMessageView({
  message,
  onApprove,
  onCancel,
  onPreview,
  onRetryLocal,
}: {
  message: PanelMessage;
  onApprove: (message: PanelMessage) => void;
  onCancel: (message: PanelMessage) => void;
  onPreview: () => void;
  onRetryLocal: (prompt: string) => void;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-lg rounded-br-none bg-[#2A2A36] px-2.5 py-1.5 text-[12px] text-foreground">
          {message.text}
        </p>
      </div>
    );
  }

  const tone =
    message.kind === "applied"
      ? "border-emerald-700/50"
      : message.kind === "rejected"
        ? "border-red-800/60"
        : message.kind === "plan"
          ? "border-[#6868E8]/60"
          : "border-separator";

  return (
    <div className="flex justify-start">
      <div
        className={cn(
          "max-w-[92%] rounded-lg rounded-bl-none border bg-[#17171F] px-2.5 py-1.5",
          tone,
        )}
      >
        {message.kind === "plan" && message.plan ? (
          <>
            <p className="mb-1 text-[11.5px] text-foreground">{message.text}</p>
            <p className="mb-1 text-[11px] font-medium text-[#CFC8FF]">{message.plan.summary}</p>
            {message.operations ? (
              <ul className="mb-1.5 space-y-0.5">
                {message.operations.map((operation, index) => (
                  <li
                    key={`${operation.type}-${index}`}
                    className="text-[10.5px] text-text-secondary"
                  >
                    • {operation.label}
                    <span className="ml-1 text-text-placeholder">{operation.payload}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            {message.pending ? (
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => onApprove(message)}
                  className="rounded bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground hover:bg-[#5C36D6]"
                >
                  Aplicar
                </button>
                <button
                  type="button"
                  onClick={() => onCancel(message)}
                  className="rounded border border-separator px-2.5 py-1 text-[11px] text-foreground hover:bg-elevated"
                >
                  Descartar
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <>
            {message.text ? <p className="text-[11.5px] text-foreground">{message.text}</p> : null}
            {message.lines ? (
              <ul className={cn("space-y-0.5", message.text && "mt-1")}>
                {message.lines.map((line, index) => (
                  <li key={index} className="text-[11px] text-text-secondary">
                    {line}
                  </li>
                ))}
              </ul>
            ) : null}
            {message.kind === "applied" ? (
              <button
                type="button"
                onClick={onPreview}
                className="mt-1.5 flex items-center gap-1 rounded border border-separator px-2 py-0.5 text-[10.5px] text-foreground hover:bg-elevated"
              >
                <Play className="h-3 w-3" />
                Vista previa del resultado
              </button>
            ) : null}
            {message.retryPrompt ? (
              <button
                type="button"
                onClick={() => onRetryLocal(message.retryPrompt!)}
                className="mt-1.5 flex items-center gap-1 rounded border border-separator px-2 py-0.5 text-[10.5px] text-foreground hover:bg-elevated"
              >
                <RotateCcw className="h-3 w-3" />
                Intentar con el planificador local
              </button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
