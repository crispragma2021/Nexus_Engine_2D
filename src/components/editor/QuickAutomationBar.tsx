import * as React from "react";
import {
  AudioLines,
  BoxSelect,
  Braces,
  Image as ImageIcon,
  MousePointer2,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useEditor } from "@/lib/editor/store";
import { compileIntentToEvents } from "@/lib/editor/ai-logic";
import { eventsToAgentPlan } from "@/lib/agent/planner";
import { TOOL_REGISTRY } from "@/lib/agent/tools";
import type { AgentPlan } from "@/lib/agent/operations";
import { useAgentCommit } from "./hooks/use-agent-commit";
import { uid } from "@/lib/editor/ids";
import {
  playSfxr,
  serializeSfxrMetadata,
  sfxrToDataUrl,
  SFXR_PRESETS,
  type SfxrPresetName,
} from "@/lib/audio/sfxr";
import { generateImageAsset, type ImageGenerationProvider } from "@/lib/assets/hf-pipeline";
import type { GDInstance, GDObjectDef, GDResource } from "@/lib/editor/types";
import { cn } from "@/lib/utils";

type AutomationMode = "event" | "sfx" | "sprite" | "selection";
type ProviderName = "huggingface" | "cloudflare";

const MODES: {
  id: AutomationMode;
  label: string;
  icon: typeof Braces;
  description: string;
}[] = [
  {
    id: "event",
    label: "Evento",
    icon: Braces,
    description: "Crea condiciones y acciones visuales estándar.",
  },
  {
    id: "sfx",
    label: "SFX",
    icon: AudioLines,
    description: "Genera un WAV procedural que podrás seguir editando.",
  },
  {
    id: "sprite",
    label: "Sprite",
    icon: ImageIcon,
    description: "Genera PNG, objeto, instancia y máscara editable.",
  },
  {
    id: "selection",
    label: "Selección",
    icon: BoxSelect,
    description: "Continúa con la edición Zero-UI sobre el lienzo.",
  },
];

export function QuickAutomationBar() {
  const { project, scene, ui, dispatch } = useEditor();
  const { needsApproval, commit, audit } = useAgentCommit();
  const [mode, setMode] = React.useState<AutomationMode>("event");
  const [prompt, setPrompt] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  /** Event plan waiting for approval (Supervised mode) inside the bar. */
  const [pendingPlan, setPendingPlan] = React.useState<AgentPlan | null>(null);
  const [providerName, setProviderName] = React.useState<ProviderName>("huggingface");
  const [token, setToken] = React.useState("");
  const [model, setModel] = React.useState("");
  const [accountId, setAccountId] = React.useState("");
  const [endpoint, setEndpoint] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const open = ui.quickAutomationOpen;

  const close = React.useCallback(() => {
    setToken("");
    if (pendingPlan) {
      audit(
        "cancelled",
        `Plan de evento descartado al cerrar: ${pendingPlan.summary}`,
        pendingPlan.id,
      );
    }
    setPendingPlan(null);
    dispatch({ type: "ui", patch: { quickAutomationOpen: false } });
  }, [dispatch, pendingPlan, audit]);

  const approvePending = () => {
    if (!pendingPlan) return;
    const result = commit(pendingPlan);
    setPendingPlan(null);
    if (result.ok) {
      toast.success("Evento añadido a la hoja visual. Puedes editarlo, moverlo o borrarlo.");
      setPrompt("");
      close();
    } else {
      toast.error(result.error ?? "El plan no se pudo aplicar.");
    }
  };

  const cancelPending = () => {
    if (pendingPlan) {
      audit("cancelled", `Plan de evento descartado: ${pendingPlan.summary}`, pendingPlan.id);
    }
    setPendingPlan(null);
  };

  React.useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [open, mode]);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, open]);

  const addSfx = (preset: SfxrPresetName) => {
    const parameters = { ...SFXR_PRESETS[preset] };
    const name = uniqueName(
      `${preset}.wav`,
      project.resources.map((resource) => resource.name),
    );
    const resource: GDResource = {
      name,
      kind: "audio",
      file: name,
      url: sfxrToDataUrl(parameters),
      metadata: serializeSfxrMetadata(parameters, preset),
      editorMetadata: {
        source: "procedural",
        generation: {
          provider: "procedural",
          model: "sfxr",
          generatedAt: new Date().toISOString(),
        },
        sfx: { ...parameters },
      },
      alwaysLoaded: true,
    };
    dispatch({ type: "addResource", resource });
    try {
      playSfxr(parameters);
    } catch {
      // The WAV remains usable if this browser does not expose Web Audio.
    }
    toast.success(`${name} añadido. Ábrelo en Recursos para editar todos sus parámetros.`);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;

    if (mode === "selection") {
      const desired = ui.cursorClientPosition ?? {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      };
      dispatch({ type: "ui", patch: { quickAutomationOpen: false } });
      dispatch({
        type: "openInlineAi",
        x: Math.max(152, Math.min(window.innerWidth - 152, desired.x)),
        y: Math.max(80, Math.min(window.innerHeight - 8, desired.y)),
      });
      return;
    }

    if (mode === "sfx") {
      const guessed = (Object.keys(SFXR_PRESETS) as SfxrPresetName[]).find((preset) =>
        prompt.toLowerCase().includes(preset),
      );
      if (!guessed) {
        toast.error("Elige jump, coin, laser, explosion o hit.");
        return;
      }
      addSfx(guessed);
      setPrompt("");
      return;
    }

    if (!prompt.trim()) return;
    setBusy(true);
    try {
      if (mode === "event") {
        // The compiled events go through the agent pipeline like everything
        // else: plan → approval gated by the session's autonomy mode →
        // atomic, undoable transaction (never a direct store dispatch).
        const events = compileIntentToEvents(prompt, {
          objectNames: scene.objects.map((object) => object.name),
          sceneNames: project.scenes.map((entry) => entry.name),
          audioResources: project.resources
            .filter((resource) => resource.kind === "audio")
            .map((resource) => resource.name),
          activeLayer: scene.activeLayer,
        });
        const plan = eventsToAgentPlan(events, scene.name, prompt.slice(0, 80));
        if (pendingPlan) {
          audit("cancelled", `Plan de evento reemplazado: ${pendingPlan.summary}`, pendingPlan.id);
        }
        if (needsApproval(plan)) {
          setPendingPlan(plan);
          return;
        }
        const result = commit(plan);
        if (result.ok) {
          toast.success("Evento añadido a la hoja visual. Puedes editarlo, moverlo o borrarlo.");
          setPrompt("");
          close();
        } else {
          toast.error(result.error ?? "El plan no se pudo aplicar.");
        }
        return;
      } else {
        const provider = imageProvider(providerName, token, model, accountId, endpoint);
        const generated = await generateImageAsset(provider, {
          prompt,
          width: 512,
          height: 512,
          removeBackground: true,
        });
        const fileBase = slug(prompt.split(/\s+/).slice(0, 4).join("-")) || "sprite-ia";
        const resourceName = uniqueName(
          `${fileBase}.png`,
          project.resources.map((resource) => resource.name),
        );
        const objectName = uniqueName(
          pascalCase(fileBase) || "SpriteIA",
          scene.objects.map((object) => object.name),
        );
        const objectId = uid("obj");
        const displayWidth = Math.min(256, generated.width);
        const displayHeight = Math.max(
          1,
          Math.round((generated.height / generated.width) * displayWidth),
        );
        const object: GDObjectDef = {
          id: objectId,
          name: objectName,
          type: "Sprite",
          asset: resourceName,
          animations: [
            {
              name: "Default",
              loops: false,
              timeBetweenFrames: 100,
              haveCustomHitBoxes: true,
              images: [
                {
                  image: resourceName,
                  originX: 0,
                  originY: 0,
                  centerX: generated.width / 2,
                  centerY: generated.height / 2,
                  opacity: 255,
                  hitBox: generated.hitBox,
                },
              ],
              points: [],
            },
          ],
          behaviors: [],
          effects: [],
          variables: [],
        };
        const cursor = ui.cursorPosition ?? {
          x: project.gameSettings.windowWidth / 2,
          y: project.gameSettings.windowHeight / 2,
        };
        const instance: GDInstance = {
          id: uid("inst"),
          objectId,
          x: Math.round(cursor.x - displayWidth / 2),
          y: Math.round(cursor.y - displayHeight / 2),
          angle: 0,
          customSize: true,
          width: displayWidth,
          height: displayHeight,
          zOrder: Math.max(0, ...scene.instances.map((entry) => entry.zOrder)) + 1,
          layer: scene.activeLayer,
          locked: false,
          hiddenAtStart: false,
          variables: [],
          effects: [],
        };
        const resource: GDResource = {
          name: resourceName,
          kind: "image",
          file: resourceName,
          url: generated.dataUrl,
          size: generated.blob.size / 1024,
          alwaysLoaded: true,
          editorMetadata: {
            source: "generated",
            generation: generated.metadata,
          },
        };
        dispatch({ type: "addGeneratedAssetBundle", resource, object, instance });
        dispatch({ type: "ui", patch: { tab: "scene", quickAutomationOpen: false } });
        toast.success(
          `${objectName} añadido. Sprite y máscara están disponibles en el editor de objetos.`,
        );
        setPrompt("");
        setToken("");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo completar la automatización.",
      );
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => dispatch({ type: "ui", patch: { quickAutomationOpen: true } })}
        className="fixed right-3 bottom-[calc(var(--mobile-editor-dock-height)+0.75rem)] z-[25] hidden md:flex h-10 w-10 items-center justify-center rounded-full border border-separator bg-[#1D1D26]/90 text-text-secondary shadow-lg backdrop-blur hover:border-[#6868E8] hover:text-foreground md:right-auto md:bottom-4 md:left-1/2 md:h-auto md:w-auto md:-translate-x-1/2 md:gap-1 md:px-2.5 md:py-1 md:text-[10.5px]"
        title="Automatización rápida (Ctrl/Cmd+K)"
      >
        <Sparkles className="h-4 w-4 text-[#A996FF] md:h-3 md:w-3" />
        <span className="hidden md:inline">Automatizar</span>
        <kbd className="ml-1 hidden rounded bg-[#101017] px-1 text-[9px] md:inline">Ctrl/⌘ K</kbd>
      </button>
    );
  }

  const activeMode = MODES.find((entry) => entry.id === mode)!;
  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Automatización rápida"
      data-ai-overlay="drawer"
      className="fixed inset-x-0 bottom-0 z-[60] w-full md:inset-x-auto md:bottom-4 md:left-1/2 md:w-[min(720px,calc(100vw-1rem))] md:-translate-x-1/2"
    >
      <form
        onSubmit={submit}
        className="max-h-[calc(100dvh-1rem)] overflow-y-auto rounded-t-xl border border-[#494952] bg-[#17171F]/95 shadow-2xl backdrop-blur-xl md:max-h-[calc(100dvh-2rem)] md:rounded-xl"
      >
        <div className="flex items-center gap-1 border-b border-separator px-2 py-1.5">
          <Sparkles className="mr-1 h-4 w-4 text-[#A996FF]" />
          {MODES.map((entry) => (
            <button
              key={entry.id}
              type="button"
              aria-label={entry.label}
              title={entry.label}
              onClick={() => {
                setMode(entry.id);
                setPendingPlan(null);
              }}
              className={cn(
                "flex items-center gap-1 rounded px-2 py-1 text-[11px] text-text-secondary hover:bg-elevated hover:text-foreground",
                mode === entry.id && "bg-[#494952] text-[#F6F2FF]",
              )}
            >
              <entry.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{entry.label}</span>
            </button>
          ))}
          <span className="ml-auto hidden text-[10px] text-text-placeholder sm:inline">
            Todo se guarda como datos estándar · Deshacer disponible
          </span>
          <button
            type="button"
            onClick={close}
            className="grid h-6 w-6 place-items-center rounded text-text-secondary hover:bg-elevated hover:text-foreground"
            aria-label="Cerrar automatización rápida"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="p-2">
          <p className="mb-1.5 text-[10.5px] text-text-secondary">{activeMode.description}</p>

          {mode === "sfx" ? (
            <div className="mb-2 flex flex-wrap gap-1">
              {(Object.keys(SFXR_PRESETS) as SfxrPresetName[]).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => addSfx(preset)}
                  className="rounded bg-elevated px-3 py-1.5 text-[11.5px] capitalize text-foreground hover:bg-selection"
                >
                  {preset}
                </button>
              ))}
            </div>
          ) : null}

          {mode === "sprite" ? (
            <div className="mb-2 grid gap-1.5 sm:grid-cols-2">
              <label className="text-[10.5px] text-text-secondary">
                Proveedor
                <select
                  value={providerName}
                  onChange={(event) => setProviderName(event.target.value as ProviderName)}
                  className="mt-0.5 h-7 w-full rounded border border-separator bg-[#25252E] px-1 text-[11.5px] text-foreground"
                >
                  <option value="huggingface">Hugging Face</option>
                  <option value="cloudflare">Cloudflare Workers AI</option>
                </select>
              </label>
              <label className="text-[10.5px] text-text-secondary">
                Token (solo se usa en esta solicitud)
                <input
                  type="password"
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  autoComplete="off"
                  className="mt-0.5 h-7 w-full rounded border border-separator bg-[#25252E] px-2 text-[11.5px] text-foreground outline-none focus:border-[#6868E8]"
                />
              </label>
              <label className="text-[10.5px] text-text-secondary">
                Modelo (opcional)
                <input
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                  placeholder={
                    providerName === "huggingface"
                      ? "stabilityai/stable-diffusion-3-medium-diffusers"
                      : "@cf/black-forest-labs/flux-1-schnell"
                  }
                  className="mt-0.5 h-7 w-full rounded border border-separator bg-[#25252E] px-2 text-[11.5px] text-foreground outline-none focus:border-[#6868E8]"
                />
              </label>
              <label className="text-[10.5px] text-text-secondary">
                {providerName === "cloudflare"
                  ? "Account ID o URL del Worker"
                  : "Endpoint HF opcional"}
                <input
                  value={providerName === "cloudflare" ? accountId || endpoint : endpoint}
                  onChange={(event) => {
                    if (providerName === "cloudflare" && !event.target.value.startsWith("http")) {
                      setAccountId(event.target.value);
                      setEndpoint("");
                    } else {
                      setEndpoint(event.target.value);
                      if (providerName === "cloudflare") setAccountId("");
                    }
                  }}
                  placeholder={
                    providerName === "cloudflare" ? "account-id o https://worker…" : "https://…"
                  }
                  className="mt-0.5 h-7 w-full rounded border border-separator bg-[#25252E] px-2 text-[11.5px] text-foreground outline-none focus:border-[#6868E8]"
                />
              </label>
            </div>
          ) : null}

          {mode === "selection" ? (
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded bg-[#494952] px-3 py-2 text-[12px] text-foreground hover:bg-[#565662]"
            >
              <MousePointer2 className="h-4 w-4" />
              Abrir edición in-situ en la selección o el cursor
            </button>
          ) : (
            <>
              {mode === "event" && pendingPlan ? (
                <div className="mb-2 rounded-lg border border-[#6868E8]/60 bg-[#101017] p-2">
                  <p className="text-[11px] font-medium text-[#CFC8FF]">{pendingPlan.summary}</p>
                  <ul className="mb-1.5 mt-1 space-y-0.5">
                    {pendingPlan.operations.map((operation, index) => (
                      <li
                        key={`${operation.type}-${index}`}
                        className="text-[10.5px] text-text-secondary"
                      >
                        • {TOOL_REGISTRY[operation.type]?.label ?? operation.type}
                        <span className="ml-1 text-text-placeholder">
                          {JSON.stringify(operation.payload).slice(0, 80)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mb-1.5 text-[10px] text-text-secondary">
                    Modo supervisado: revisa el plan. Se aplica como transacción atómica con
                    deshacer disponible.
                  </p>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={approvePending}
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
              <div className="flex items-center gap-1 rounded-lg border border-separator bg-[#101017] p-1 focus-within:border-[#6868E8]">
                <input
                  ref={inputRef}
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  maxLength={600}
                  disabled={busy}
                  placeholder={placeholderFor(mode)}
                  className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-[12.5px] text-foreground outline-none placeholder:text-text-placeholder disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!prompt.trim() || busy || (mode === "sprite" && !token.trim())}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded bg-primary text-primary-foreground hover:bg-[#5C36D6] disabled:bg-elevated disabled:text-text-placeholder"
                  aria-label="Ejecutar automatización"
                >
                  {busy ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </form>
    </div>
  );
}

function imageProvider(
  name: ProviderName,
  token: string,
  model: string,
  accountId: string,
  endpoint: string,
): ImageGenerationProvider {
  if (name === "huggingface") {
    return {
      provider: "huggingface",
      token,
      ...(model.trim() ? { model: model.trim() } : {}),
      ...(endpoint.trim() ? { endpoint: endpoint.trim() } : {}),
    };
  }
  return {
    provider: "cloudflare",
    token,
    ...(model.trim() ? { model: model.trim() } : {}),
    ...(accountId.trim() ? { accountId: accountId.trim() } : {}),
    ...(endpoint.trim() ? { endpoint: endpoint.trim() } : {}),
  };
}

function placeholderFor(mode: Exclude<AutomationMode, "selection">): string {
  switch (mode) {
    case "event":
      return "Ej.: Cuando Jugador colisiona con Moneda, elimina Moneda";
    case "sfx":
      return "Escribe jump, coin, laser, explosion o hit";
    case "sprite":
      return "Ej.: robot jardinero pixel art, vista lateral";
  }
}

function uniqueName(base: string, taken: readonly string[]): string {
  if (!taken.includes(base)) return base;
  const dot = base.lastIndexOf(".");
  const stem = dot > 0 ? base.slice(0, dot) : base;
  const extension = dot > 0 ? base.slice(dot) : "";
  let index = 2;
  while (taken.includes(`${stem}-${index}${extension}`)) index += 1;
  return `${stem}-${index}${extension}`;
}

function slug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function pascalCase(value: string): string {
  return value
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join("")
    .slice(0, 40);
}
