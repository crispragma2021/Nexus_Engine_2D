import * as React from "react";
import { useEditor } from "@/lib/editor/store";
import { compileIntentToEvents } from "@/lib/editor/ai-logic";
import { toast } from "sonner";
import { Sparkles, Trash2, Copy, Puzzle, Wand2, X } from "lucide-react";

export function SelectionOverlay() {
  const { scene, ui, dispatch } = useEditor();
  const [prompt, setPrompt] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const selectedInstanceId = ui.selectedInstanceIds.length === 1 ? ui.selectedInstanceIds[0] : null;
  const instance = selectedInstanceId
    ? scene.instances.find((i) => i.id === selectedInstanceId)
    : undefined;
  const object = instance
    ? scene.objects.find((o) => o.id === instance.objectId)
    : undefined;

  if (!instance || !object) return null;

  const handleDuplicate = () => {
    dispatch({
      type: "addInstance",
      objectId: instance.objectId,
      x: instance.x + 30,
      y: instance.y + 30,
      layer: instance.layer,
    });
    toast.success(`Instancia de '${object.name}' duplicada.`);
  };

  const handleDelete = () => {
    dispatch({ type: "deleteInstances", ids: [instance.id] });
    toast.success(`Instancia de '${object.name}' eliminada.`);
  };

  const handleOpenBehaviors = () => {
    dispatch({ type: "openDialog", dialog: { name: "behaviors", objectId: object.id } });
  };

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || busy) return;
    const clean = prompt.trim();
    setBusy(true);

    try {
      const lower = clean.toLowerCase();
      // Modificaciones directas de propiedades
      if (/\b(?:grande|aumentar|agrandar|doble)\b/.test(lower)) {
        dispatch({
          type: "updateInstance",
          id: instance.id,
          patch: {
            customSize: true,
            width: Math.round((instance.width || 64) * 1.5),
            height: Math.round((instance.height || 64) * 1.5),
          },
        });
        toast.success(`Tamaño de '${object.name}' aumentado.`);
      } else if (/\b(?:pequeño|reducir|disminuir)\b/.test(lower)) {
        dispatch({
          type: "updateInstance",
          id: instance.id,
          patch: {
            customSize: true,
            width: Math.max(16, Math.round((instance.width || 64) * 0.7)),
            height: Math.max(16, Math.round((instance.height || 64) * 0.7)),
          },
        });
        toast.success(`Tamaño de '${object.name}' reducido.`);
      } else if (/\b(?:rotar|girar|ángulo|angulo)\b/.test(lower)) {
        dispatch({
          type: "updateInstance",
          id: instance.id,
          patch: { angle: (instance.angle + 45) % 360 },
        });
        toast.success(`Ángulo de '${object.name}' ajustado.`);
      } else {
        // Intenciones de eventos dirigidas a este objeto
        const targetedPrompt = `${clean} para ${object.name}`;
        const outcome = compileIntentToEvents(targetedPrompt, {
          objectNames: scene.objects.map((o) => o.name),
          sceneNames: [scene.name],
        });
        if (outcome.length > 0) {
          dispatch({
            type: "updateScene",
            patch: { events: [...scene.events, ...outcome] },
          });
          toast.success(`¡Evento de IA aplicado a '${object.name}'!`);
        } else {
          toast.info(`Instrucción procesada sobre '${object.name}'.`);
        }
      }
      setPrompt("");
    } catch {
      toast.error("No se pudo procesar la instrucción sobre este objeto.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="absolute left-1/2 bottom-4 z-30 -translate-x-1/2 flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Visual Contextual Floating Bar */}
      <div className="flex items-center gap-1.5 rounded-xl border border-[#478CBF]/60 bg-[#1D1D26]/95 px-3 py-1.5 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-2 pr-2 border-r border-separator text-[11px] font-bold text-foreground">
          <span className="h-2 w-2 rounded-full bg-[#478CBF] animate-pulse" />
          <span className="truncate max-w-[120px]">{object.name}</span>
          <span className="text-[10px] text-text-secondary font-normal">
            ({instance.x}, {instance.y})
          </span>
        </div>

        {/* Action Buttons */}
        <button
          type="button"
          onClick={handleOpenBehaviors}
          className="flex h-7 items-center gap-1 rounded bg-[#2B2B3A] px-2 text-[11px] font-medium text-text-secondary hover:bg-[#3B3B4F] hover:text-foreground transition-colors"
          title="Agregar o editar comportamientos"
        >
          <Puzzle className="h-3.5 w-3.5 text-[#8AD6FF]" />
          <span>Comportamientos</span>
        </button>

        <button
          type="button"
          onClick={handleDuplicate}
          className="flex h-7 items-center gap-1 rounded bg-[#2B2B3A] px-2 text-[11px] font-medium text-text-secondary hover:bg-[#3B3B4F] hover:text-foreground transition-colors"
          title="Duplicar esta instancia"
        >
          <Copy className="h-3.5 w-3.5 text-[#86EFAC]" />
          <span>Duplicar</span>
        </button>

        <button
          type="button"
          onClick={handleDelete}
          className="flex h-7 items-center gap-1 rounded bg-[#2B2B3A] px-2 text-[11px] font-medium text-text-secondary hover:bg-destructive/20 hover:text-destructive transition-colors"
          title="Eliminar objeto"
        >
          <Trash2 className="h-3.5 w-3.5 text-red-400" />
          <span>Eliminar</span>
        </button>

        <button
          type="button"
          onClick={() => dispatch({ type: "selectInstances", ids: [] })}
          className="grid h-6 w-6 place-items-center rounded text-text-secondary hover:bg-[#2B2B3A] hover:text-foreground"
          title="Deseleccionar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Point & Click Quick Prompt Input */}
      <form
        onSubmit={handleAiSubmit}
        className="flex w-full max-w-md items-center gap-1.5 rounded-lg border border-[#7A68EE]/60 bg-[#16161E]/95 px-2.5 py-1 shadow-lg backdrop-blur-md"
      >
        <Sparkles className="h-4 w-4 shrink-0 text-yellow-300 animate-spin-slow" />
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={`Pedir cambio a ${object.name} (ej: hacer más grande, rotar 45°, imán...)`}
          className="h-7 flex-1 bg-transparent text-[11.5px] text-foreground outline-none placeholder:text-text-placeholder"
        />
        <button
          type="submit"
          disabled={!prompt.trim() || busy}
          className="flex h-6 items-center gap-1 rounded bg-gradient-to-r from-[#8A2BE2] to-[#478CBF] px-2 text-[10px] font-bold text-white hover:opacity-90 disabled:opacity-40"
        >
          <Wand2 className="h-3 w-3" />
          <span>IA</span>
        </button>
      </form>
    </div>
  );
}
