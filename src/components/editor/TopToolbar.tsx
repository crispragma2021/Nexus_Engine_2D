import {
  Menu,
  Undo2,
  Redo2,
  Grid3x3,
  Magnet,
  Eye,
  ZoomIn,
  ZoomOut,
  Play,
  PanelLeft,
  PanelRight,
  Save,
  Smartphone,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useEditor } from "@/lib/editor/store";
import { saveProjectEverywhere } from "@/lib/projects/save";
import { PreviewDialog } from "./PreviewDialog";
import { AskAiDialog } from "./AskAiDialog";
import { cn } from "@/lib/utils";

function TButton({
  title,
  active,
  disabled,
  onClick,
  children,
}: {
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded transition-colors md:h-7 md:w-7",
        "text-muted-foreground hover:bg-elevated hover:text-foreground",
        active && "bg-elevated text-link",
        disabled && "opacity-35 hover:bg-transparent",
      )}
    >
      {children}
    </button>
  );
}

const Sep = () => <div className="mx-1 h-5 w-px bg-separator" />;

export function TopToolbar() {
  const { ui, dispatch, canUndo, canRedo, project } = useEditor();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    setSaving(true);
    try {
      const result = await saveProjectEverywhere(project);
      if (result.drive) toast.success("Guardado en el dispositivo y en Google Drive");
      else if (result.driveError) toast.warning(`Guardado local. Drive: ${result.driveError}`);
      else toast.success("Guardado en este dispositivo");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-12 shrink-0 items-center gap-1 overflow-x-auto border-b border-separator bg-toolbar px-2 md:h-11 md:overflow-visible [&::-webkit-scrollbar]:h-0">
      <TButton
        title="Open the project manager"
        onClick={() => dispatch({ type: "ui", patch: { projectManagerOpen: true } })}
      >
        <Menu className="h-4 w-4" />
      </TButton>

      <div className="ml-1 hidden items-center gap-1 truncate text-xs text-muted-foreground md:flex">
        <span className="truncate font-medium text-foreground">{project.name}</span>
        <span className="text-separator">/</span>
        <span className="truncate">Level 1</span>
      </div>

      <Sep />
      <TButton title="Guardar proyecto" disabled={saving} onClick={() => void onSave()}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      </TButton>
      <TButton title="Undo" disabled={!canUndo} onClick={() => dispatch({ type: "undo" })}>
        <Undo2 className="h-4 w-4" />
      </TButton>
      <TButton title="Redo" disabled={!canRedo} onClick={() => dispatch({ type: "redo" })}>
        <Redo2 className="h-4 w-4" />
      </TButton>

      {ui.tab === "scene" && (
        <>
          <Sep />
          <TButton
            title="Toggle grid"
            active={ui.grid}
            onClick={() => dispatch({ type: "ui", patch: { grid: !ui.grid } })}
          >
            <Grid3x3 className="h-4 w-4" />
          </TButton>
          <TButton
            title="Snap to grid"
            active={ui.snap}
            onClick={() => dispatch({ type: "ui", patch: { snap: !ui.snap } })}
          >
            <Magnet className="h-4 w-4" />
          </TButton>
          <TButton title="Show collision masks">
            <Eye className="h-4 w-4" />
          </TButton>
          <Sep />
          <TButton
            title="Zoom out"
            onClick={() =>
              dispatch({ type: "ui", patch: { zoom: Math.max(0.25, +(ui.zoom - 0.1).toFixed(2)) } })
            }
          >
            <ZoomOut className="h-4 w-4" />
          </TButton>
          <button
            type="button"
            onClick={() => dispatch({ type: "ui", patch: { zoom: 1 } })}
            className="w-12 rounded px-1 py-0.5 text-center text-[11px] tabular-nums text-muted-foreground hover:bg-elevated hover:text-foreground"
            title="Reset zoom"
          >
            {Math.round(ui.zoom * 100)}%
          </button>
          <TButton
            title="Zoom in"
            onClick={() =>
              dispatch({ type: "ui", patch: { zoom: Math.min(3, +(ui.zoom + 0.1).toFixed(2)) } })
            }
          >
            <ZoomIn className="h-4 w-4" />
          </TButton>
        </>
      )}

      <div className="hidden flex-1 md:block" />

      <div className="hidden md:contents">
        <TButton
          title="Toggle left panel"
          active={ui.showLeftPanel}
          onClick={() => dispatch({ type: "ui", patch: { showLeftPanel: !ui.showLeftPanel } })}
        >
          <PanelLeft className="h-4 w-4" />
        </TButton>
        <TButton
          title="Toggle right panel"
          active={ui.showRightPanel}
          onClick={() => dispatch({ type: "ui", patch: { showRightPanel: !ui.showRightPanel } })}
        >
          <PanelRight className="h-4 w-4" />
        </TButton>
      </div>
      <Sep />
      <TButton title="Preview on device">
        <Smartphone className="h-4 w-4" />
      </TButton>
      <button
        type="button"
        onClick={() => setPreviewOpen(true)}
        className="sticky right-0 ml-1 flex h-9 shrink-0 items-center gap-1.5 rounded bg-success px-3 shadow-[-8px_0_8px_-6px_var(--toolbar)] md:static md:shadow-none text-[11px] font-semibold uppercase tracking-wide text-window transition-opacity hover:opacity-90 md:h-7"
      >
        <Play className="h-3.5 w-3.5 fill-current" />
        Preview
      </button>
      <button
        type="button"
        onClick={() => setAskOpen(true)}
        className="ml-1 flex h-9 shrink-0 items-center gap-1.5 rounded px-2 text-[11px] font-bold text-foreground hover:bg-elevated md:h-7"
      >
        <span
          className="size-5 rounded-md bg-gradient-to-br from-[#FFBC57] via-[#FF8569] to-[#7046EC]"
          aria-hidden
        />
        Ask AI
      </button>
      <PreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} />
      <AskAiDialog open={askOpen} onOpenChange={setAskOpen} />
    </div>
  );
}
