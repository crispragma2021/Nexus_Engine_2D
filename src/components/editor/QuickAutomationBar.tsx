import * as React from "react";
import {
  Bot,
  Cpu,
  Loader2,
  Paperclip,
  Send,
  Sparkles,
  X,
  FileText,
  Image as ImageIcon,
  Music,
} from "lucide-react";
import { toast } from "sonner";
import { useEditor } from "@/lib/editor/store";
import { compileIntentToEvents } from "@/lib/editor/ai-logic";
import { eventsToAgentPlan } from "@/lib/agent/planner";
import {
  planWithAssistant,
  probeNexusAssistant,
  type AssistantSource,
} from "@/lib/agent/nexus-client";
import { TOOL_REGISTRY } from "@/lib/agent/tools";
import type { AgentPlan } from "@/lib/agent/operations";
import { useAgentCommit } from "./hooks/use-agent-commit";
import { uid } from "@/lib/editor/ids";
import { serializeSfxrMetadata, sfxrToDataUrl, SFXR_PRESETS } from "@/lib/audio/sfxr";
import type { GDInstance, GDObjectDef, GDResource } from "@/lib/editor/types";
import { cn } from "@/lib/utils";

interface AttachedFile {
  name: string;
  type: "doc" | "image" | "audio";
  content?: string;
  file: File;
}

export function QuickAutomationBar() {
  const { project, scene, ui, dispatch } = useEditor();
  const { needsApproval, commit, audit } = useAgentCommit();
  const [prompt, setPrompt] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [pendingPlan, setPendingPlan] = React.useState<AgentPlan | null>(null);
  const [attachments, setAttachments] = React.useState<AttachedFile[]>([]);
  const [showAttachMenu, setShowAttachMenu] = React.useState(false);
  /** Origen del plan en aprobación: el gateway Nexus AI o el respaldo local. */
  const [source, setSource] = React.useState<AssistantSource | null>(null);
  /** `false` solo cuando el servidor confirmó que no tiene GEMINI_API_KEY. */
  const [assistantEnabled, setAssistantEnabled] = React.useState<boolean | null>(null);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [fileFilter, setFileFilter] = React.useState<string>("*/*");

  const open = ui.quickAutomationOpen;

  // Sondeo único de disponibilidad del gateway (`GET /api/agent`): si el
  // servidor no tiene clave, la instrucción va directa al planificador local y
  // se evita un viaje fallido por cada envío. Un fallo de red no cambia nada.
  React.useEffect(() => {
    if (!open || assistantEnabled !== null) return;
    let active = true;
    void probeNexusAssistant().then((status) => {
      if (active && status.known) setAssistantEnabled(status.enabled);
    });
    return () => {
      active = false;
    };
  }, [open, assistantEnabled]);

  /** Respaldo determinista sin red: el compilador de eventos de siempre. */
  const planLocally = React.useCallback(
    (instruction: string): AgentPlan | null => {
      const objectNames = (scene.objects || []).map((object) => object.name);
      const generated = compileIntentToEvents(instruction, { objectNames });
      return generated.length === 0 ? null : eventsToAgentPlan(generated, scene.name);
    },
    [scene],
  );

  /** Ejecuta el plan aprobado por la sesión (validación + transacción atómica). */
  const applyPlan = React.useCallback(
    (plan: AgentPlan) => {
      const result = commit(plan);
      if (result.ok) {
        toast.success(result.lines[0] ?? "Plan aplicado");
        setPrompt("");
        setAttachments([]);
        setPendingPlan(null);
        setSource(null);
        return;
      }
      toast.error(result.error ?? "El plan no se pudo aplicar.");
    },
    [commit],
  );

  /** Descarta el plan en aprobación y lo registra en la auditoría de la sesión. */
  const cancelPending = React.useCallback(() => {
    if (pendingPlan) {
      audit("cancelled", `Plan descartado: ${pendingPlan.summary}`, pendingPlan.id);
    }
    setPendingPlan(null);
    setSource(null);
  }, [audit, pendingPlan]);

  const close = React.useCallback(() => {
    setPrompt("");
    setAttachments([]);
    setShowAttachMenu(false);
    if (pendingPlan) {
      audit(
        "cancelled",
        `Plan de evento descartado al cerrar: ${pendingPlan.summary}`,
        pendingPlan.id,
      );
    }
    setPendingPlan(null);
    setSource(null);
    dispatch({ type: "ui", patch: { quickAutomationOpen: false } });
  }, [audit, dispatch, pendingPlan]);

  const handleTriggerFileSelect = (accept: string) => {
    setFileFilter(accept);
    setShowAttachMenu(false);
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 50);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    for (const file of files) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      let type: "doc" | "image" | "audio" = "doc";

      if (["png", "jpg", "jpeg", "webp"].includes(ext)) {
        type = "image";
      } else if (["mp3", "wav", "ogg"].includes(ext)) {
        type = "audio";
      }

      let content = "";
      if (type === "doc" && (ext === "txt" || ext === "md")) {
        content = await file.text();
      }

      setAttachments((prev) => [...prev, { name: file.name, type, content, file }]);
      toast.success(`Adjuntado: ${file.name}`);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt && attachments.length === 0) return;

    setBusy(true);
    try {
      let combinedPrompt = cleanPrompt;
      const docTexts = attachments
        .filter((a) => a.content)
        .map((a) => `[Documento: ${a.name}]\n${a.content}`)
        .join("\n\n");

      if (docTexts) {
        combinedPrompt = `${docTexts}\n\nInstrucción: ${cleanPrompt}`;
      }

      // Flujo de AGENT_ARCHITECTURE.md §2: instrucción → POST /api/agent (Gemini
      // vía gateway servidor) → validación del plan candidato → aprobación →
      // commit. Si el gateway no está configurado o falla, entra el planificador
      // local determinista y el asistente sigue siendo útil sin red.
      const outcome = await planWithAssistant({
        instruction: combinedPrompt,
        project,
        activeSceneName: scene.name,
        localPlanner: planLocally,
        useRemote: assistantEnabled !== false,
      });

      if (!outcome.plan) {
        toast.info(
          outcome.reason ?? "Describe los cambios para la escena, personajes o narrativa.",
        );
        return;
      }

      setSource(outcome.source);
      if (outcome.source === "local" && assistantEnabled !== false) {
        toast.info("Nexus AI no pudo generar el plan: se usó el planificador local.");
      }

      // La sesión decide si hace falta aprobación (Supervised siempre aprueba).
      if (needsApproval(outcome.plan)) {
        setPendingPlan(outcome.plan);
        return;
      }
      applyPlan(outcome.plan);
    } catch {
      toast.error("Error al procesar la instrucción del asistente.");
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => dispatch({ type: "ui", patch: { quickAutomationOpen: true } })}
        className="fixed right-3 bottom-[calc(var(--mobile-editor-dock-height)+0.75rem)] z-[25] flex h-11 w-11 items-center justify-center rounded-full border border-separator bg-[#1D1D26]/95 text-text-secondary shadow-xl backdrop-blur transition-transform active:scale-95 md:right-auto md:bottom-4 md:left-1/2 md:h-auto md:w-auto md:-translate-x-1/2 md:gap-2 md:px-3 md:py-1.5 md:text-xs"
        title="Asistente de automatización (Robot)"
      >
        <Bot className="h-5 w-5 text-[#A996FF] md:h-4 md:w-4" />
        <span className="hidden md:inline font-medium">Asistente Agente</span>
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Asistente de automatización"
      data-ai-overlay="drawer"
      className="fixed inset-x-0 bottom-0 z-[60] w-full bg-[#14141B] pb-[env(safe-area-inset-bottom)] md:inset-x-auto md:bottom-4 md:left-1/2 md:w-[min(720px,calc(100vw-1rem))] md:-translate-x-1/2 md:bg-transparent md:pb-0"
    >
      <form
        onSubmit={submit}
        className="max-h-[calc(100dvh-1rem)] overflow-visible rounded-t-2xl border border-[#3A3A48] bg-[#14141B]/95 p-3 shadow-2xl backdrop-blur-xl md:rounded-2xl"
      >
        <div className="mb-2 flex items-center justify-between border-b border-[#2A2A38] pb-2">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-[#A996FF]" />
            <span className="text-xs font-semibold text-foreground tracking-wide">
              Nexus AI Agent
            </span>
          </div>
          <button
            type="button"
            onClick={close}
            className="grid h-6 w-6 place-items-center rounded-full text-text-secondary hover:bg-elevated hover:text-foreground"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Chips de archivos adjuntos (única zona con scroll propio) */}
        {attachments.length > 0 && (
          <div className="mb-2 flex max-h-[22vh] flex-wrap gap-1.5 overflow-y-auto overscroll-contain pr-0.5">
            {attachments.map((att, idx) => (
              <span
                key={idx}
                className="flex items-center gap-1 rounded-md bg-[#252533] px-2 py-1 text-[11px] text-text-secondary border border-separator"
              >
                {att.type === "image" && <ImageIcon className="h-3 w-3 text-sky-400" />}
                {att.type === "audio" && <Music className="h-3 w-3 text-amber-400" />}
                {att.type === "doc" && <FileText className="h-3 w-3 text-emerald-400" />}
                <span className="max-w-[120px] truncate">{att.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(idx)}
                  className="ml-0.5 text-text-secondary hover:text-red-400"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Plan candidato en espera de aprobación (Supervised es el modo por defecto) */}
        {pendingPlan ? (
          <div className="mb-2 rounded-xl border border-[#6868E8]/60 bg-[#17171F] p-2">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1 text-[10.5px] font-medium text-[#CFC8FF]">
                {source === "nexus-ai" ? (
                  <Sparkles className="h-3 w-3" />
                ) : (
                  <Cpu className="h-3 w-3" />
                )}
                {source === "nexus-ai" ? "Nexus AI · /api/agent" : "Planificador local"}
              </span>
              <span className="text-[10.5px] text-text-placeholder">
                {pendingPlan.operations.length}{" "}
                {pendingPlan.operations.length === 1 ? "operación" : "operaciones"}
              </span>
            </div>
            <p className="mb-1 text-[11px] font-medium text-foreground">{pendingPlan.summary}</p>
            <ul className="mb-1.5 max-h-[18vh] space-y-0.5 overflow-y-auto overscroll-contain">
              {pendingPlan.operations.slice(0, 12).map((operation, index) => (
                <li
                  key={`${operation.type}-${index}`}
                  className="text-[10.5px] text-text-secondary"
                >
                  • {TOOL_REGISTRY[operation.type]?.label ?? operation.type}
                </li>
              ))}
            </ul>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => applyPlan(pendingPlan)}
                className="rounded bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground hover:bg-[#5C36D6]"
              >
                Aplicar
              </button>
              <button
                type="button"
                onClick={cancelPending}
                className="rounded border border-separator px-2.5 py-1 text-[11px] text-foreground hover:bg-elevated"
              >
                Descartar
              </button>
            </div>
          </div>
        ) : null}

        {/* El gateway sin configurar se avisa una sola vez, sin bloquear nada */}
        {assistantEnabled === false ? (
          <p className="mb-1.5 text-[10px] text-text-placeholder">
            Nexus AI no está configurado en el servidor (GEMINI_API_KEY): se usará el planificador
            local.
          </p>
        ) : null}

        {/* Input con estética limpia estilo Gemini */}
        <div className="relative flex items-center gap-1.5 rounded-xl border border-[#3E3E52] bg-[#1B1B24] px-2 py-1.5 focus-within:border-[#7A68EE]">
          {/* Botón de adjuntar */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAttachMenu((prev) => !prev)}
              className="grid h-8 w-8 place-items-center rounded-lg text-text-secondary hover:bg-[#2B2B3A] hover:text-foreground active:scale-95"
              title="Adjuntar archivo o documento"
            >
              <Paperclip className="h-4 w-4" />
            </button>

            {/* Menú emergente de tipos de archivo */}
            {showAttachMenu && (
              <div className="absolute bottom-full mb-2 left-0 z-50 flex w-48 flex-col gap-1 rounded-xl border border-separator bg-[#1A1A24] p-1.5 shadow-xl">
                <button
                  type="button"
                  onClick={() => handleTriggerFileSelect(".txt,.md,.docx,.xlsx,.pdf")}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-text-secondary hover:bg-elevated hover:text-foreground"
                >
                  <FileText className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Documento / Guion</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTriggerFileSelect(".png,.jpg,.jpeg,.webp")}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-text-secondary hover:bg-elevated hover:text-foreground"
                >
                  <ImageIcon className="h-3.5 w-3.5 text-sky-400" />
                  <span>Imagen / Sprite</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTriggerFileSelect(".mp3,.wav,.ogg")}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-text-secondary hover:bg-elevated hover:text-foreground"
                >
                  <Music className="h-3.5 w-3.5 text-amber-400" />
                  <span>Audio / Música</span>
                </button>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={fileFilter}
            className="hidden"
            onChange={handleFileChange}
          />

          <input
            ref={inputRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Pregunta a Nexus AI o describe las acciones de la escena..."
            className="flex-1 bg-transparent text-xs text-foreground placeholder:text-text-placeholder focus:outline-none"
          />

          <button
            type="submit"
            disabled={busy || (!prompt.trim() && attachments.length === 0)}
            aria-label={busy ? "Consultando a Nexus AI" : "Enviar instrucción al asistente"}
            className={cn(
              "grid h-8 w-8 place-items-center rounded-lg bg-[#6868E8] text-white transition-opacity active:scale-95",
              (busy || (!prompt.trim() && attachments.length === 0)) && "opacity-40",
            )}
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
