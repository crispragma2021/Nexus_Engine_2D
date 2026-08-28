// The 40px action bar (`UI/Toolbar.js`): left = actions of the active tab,
// right = scene picker + preview. Grid/snap/zoom live in the scene toolbar under
// the canvas (like GDevelop), while the object/event commands sit here.

import { useState } from "react";
import {
  ChevronDown,
  ClipboardCopy,
  ClipboardPaste,
  Clock,
  Copy,
  Eraser,
  Grid3x3,
  Magnet,
  Play,
  Plus,
  Redo2,
  Save,
  Scissors,
  Smartphone,
  SquareStack,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useEditor } from "@/lib/editor/store";
import { S } from "@/lib/editor/i18n";
import { saveProjectEverywhere } from "@/lib/projects/save";
import {
  clearClipboard,
  clipboardSummary,
  copyInstances,
  copyObjects,
  hasClipboard,
  pasteInto,
} from "@/lib/editor/clipboard";
import { cn } from "@/lib/utils";
import { GdMenu, IconButton, type MenuEntry } from "./gd/kit";

const Sep = () => <div className="mx-1 h-5 w-px shrink-0 bg-separator" />;

export function TopToolbar() {
  const { ui, dispatch, project, scene, canUndo, canRedo, dirty } = useEditor();
  const [previewMenu, setPreviewMenu] = useState<{ x: number; y: number } | null>(null);
  const [saving, setSaving] = useState(false);

  const isEvents = ui.tab === "events";
  const tab = ui.openedTabs.find((t) => t.id === ui.activeTabId);
  const isProjectTab = !!tab && tab.kind !== "scene";

  const onSave = async () => {
    setSaving(true);
    try {
      await saveProjectEverywhere(project);
      dispatch({ type: "markSaved" });
    } catch {
      /* ignore storage failures */
    } finally {
      setSaving(false);
    }
  };

  const onPaste = () => {
    if (!hasClipboard()) return;
    const { objects, instances } = pasteInto(scene);
    for (const object of objects) dispatch({ type: "addObject", object });
    if (instances.length > 0) dispatch({ type: "addInstances", instances });
    if (objects.length === 0 && instances.length === 0) {
      window.alert?.("El portapapeles está vacío");
    }
  };

  const previewEntries: MenuEntry[] = [
    {
      id: "preview",
      label: S.preview,
      icon: <Play className="h-3.5 w-3.5" />,
      onSelect: () =>
        dispatch({ type: "ui", patch: { previewOpen: true, previewWithDebugger: false } }),
    },
    {
      id: "debugger",
      label: S.previewWithDebugger,
      icon: <Clock className="h-3.5 w-3.5" />,
      onSelect: () =>
        dispatch({ type: "ui", patch: { previewOpen: true, previewWithDebugger: true } }),
    },
    {
      id: "new-window",
      label: S.previewInNewWindow,
      onSelect: () => dispatch({ type: "ui", patch: { previewOpen: true } }),
    },
    {
      id: "use-scene",
      label: S.useThisSceneForPreviews,
      separatorBefore: true,
      disabled: isProjectTab,
      onSelect: () => dispatch({ type: "updateGameSettings", patch: { startScene: scene.name } }),
    },
  ];

  return (
    <div className="flex h-10 shrink-0 items-center gap-0.5 overflow-x-auto border-b border-separator bg-toolbar px-2 text-[13px] [&::-webkit-scrollbar]:h-0">
      <button
        type="button"
        title={S.save}
        aria-label={S.save}
        onClick={() => void onSave()}
        className={cn(
          "flex h-8 shrink-0 items-center gap-1.5 rounded px-2 text-[12px] hover:bg-hover-bg",
          dirty ? "text-[#FFBC57]" : "text-muted-foreground",
        )}
      >
        <Save className={cn("h-4 w-4", saving && "animate-spin")} />
        <span className="hidden xl:inline">{dirty ? S.save : "Guardado"}</span>
      </button>

      <Sep />
      <IconButton
        label={`${S.undo} (Ctrl+Z)`}
        disabled={!canUndo}
        onClick={() => dispatch({ type: "undo" })}
      >
        <Undo2 className="h-4 w-4" />
      </IconButton>
      <IconButton
        label={`${S.redo} (Ctrl+Shift+Z)`}
        disabled={!canRedo}
        onClick={() => dispatch({ type: "redo" })}
      >
        <Redo2 className="h-4 w-4" />
      </IconButton>

      {!isEvents && (
        <>
          <Sep />
          <IconButton
            label={`${S.copy} (Ctrl+C)`}
            onClick={() => {
              const ids = ui.selectedInstanceIds.length
                ? ui.selectedInstanceIds
                : ui.selectedObjectIds;
              if (ui.selectedInstanceIds.length)
                copyInstances(scene.instances.filter((i) => ids.includes(i.id)));
              else copyObjects(scene.objects.filter((o) => ui.selectedObjectIds.includes(o.id)));
            }}
          >
            <Copy className="h-4 w-4" />
          </IconButton>
          <IconButton
            label={`${S.cut} (Ctrl+X)`}
            onClick={() => {
              if (ui.selectedInstanceIds.length) {
                copyInstances(scene.instances.filter((i) => ui.selectedInstanceIds.includes(i.id)));
                dispatch({ type: "deleteInstances", ids: ui.selectedInstanceIds });
              } else if (ui.selectedObjectIds.length) {
                copyObjects(scene.objects.filter((o) => ui.selectedObjectIds.includes(o.id)));
                for (const id of ui.selectedObjectIds) dispatch({ type: "deleteObject", id });
              }
            }}
          >
            <Scissors className="h-4 w-4" />
          </IconButton>
          <IconButton
            label={`${S.paste} (Ctrl+V)${hasClipboard() ? `: ${clipboardSummary()}` : ""}`}
            disabled={!hasClipboard()}
            onClick={onPaste}
          >
            <ClipboardPaste className="h-4 w-4" />
          </IconButton>
          <IconButton
            label={`${S.duplicate} (Ctrl+D)`}
            disabled={!ui.selectedInstanceIds.length && !ui.selectedObjectIds.length}
            onClick={() => {
              if (ui.selectedInstanceIds.length) {
                dispatch({ type: "duplicateInstances", ids: ui.selectedInstanceIds });
              } else {
                for (const id of ui.selectedObjectIds) dispatch({ type: "duplicateObject", id });
              }
            }}
          >
            <ClipboardCopy className="h-4 w-4" />
          </IconButton>
          <IconButton label={S.clearClipboard} disabled={!hasClipboard()} onClick={clearClipboard}>
            <Eraser className="h-4 w-4" />
          </IconButton>
        </>
      )}

      {!isEvents && !isProjectTab && (
        <>
          <Sep />
          <IconButton
            label={S.toggleGrid}
            active={scene.grid.show}
            onClick={() => dispatch({ type: "updateGrid", patch: { show: !scene.grid.show } })}
          >
            <Grid3x3 className="h-4 w-4" />
          </IconButton>
          <IconButton
            label={S.snapToGrid}
            active={scene.grid.snap}
            onClick={() => dispatch({ type: "updateGrid", patch: { snap: !scene.grid.snap } })}
          >
            <Magnet className="h-4 w-4" />
          </IconButton>
          <Sep />
          <IconButton
            label={S.zoomOut}
            onClick={() => dispatch({ type: "ui", patch: { zoom: Math.max(0.1, ui.zoom / 1.25) } })}
          >
            <ZoomOut className="h-4 w-4" />
          </IconButton>
          <button
            type="button"
            title={S.zoomReset}
            onClick={() => dispatch({ type: "ui", patch: { zoom: 1, pan: { x: 0, y: 0 } } })}
            className="h-8 w-14 shrink-0 rounded px-1 text-center text-[12px] tabular-nums text-muted-foreground hover:bg-hover-bg hover:text-foreground"
          >
            {Math.round(ui.zoom * 100)}%
          </button>
          <IconButton
            label={S.zoomIn}
            onClick={() => dispatch({ type: "ui", patch: { zoom: Math.min(8, ui.zoom * 1.25) } })}
          >
            <ZoomIn className="h-4 w-4" />
          </IconButton>
        </>
      )}

      <div className="min-w-2 flex-1" />

      {!isEvents && !isProjectTab && (
        <>
          <IconButton
            label={S.sceneProperties}
            onClick={() => dispatch({ type: "openDialog", dialog: { name: "sceneProperties" } })}
          >
            <SquareStack className="h-4 w-4" />
          </IconButton>
          <button
            type="button"
            onClick={() => dispatch({ type: "openDialog", dialog: { name: "newObject" } })}
            className="flex h-8 shrink-0 items-center gap-1.5 rounded bg-primary px-3 text-[12px] font-medium text-primary-foreground hover:bg-[#5C36D6]"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{S.addANewObject}</span>
          </button>
        </>
      )}
      {isEvents && (
        <button
          type="button"
          onClick={() => window.alert?.(S.firstEventHelp)}
          className="flex h-8 shrink-0 items-center gap-1 rounded px-2 text-[12px] text-link hover:bg-hover-bg"
        >
          {S.help}
        </button>
      )}

      <Sep />
      <IconButton
        label="Vista previa en dispositivo"
        onClick={() => dispatch({ type: "ui", patch: { previewOpen: true } })}
      >
        <Smartphone className="h-4 w-4" />
      </IconButton>
      <div className="flex shrink-0 items-center">
        <button
          type="button"
          onClick={() =>
            dispatch({ type: "ui", patch: { previewOpen: true, previewWithDebugger: false } })
          }
          className="flex h-8 items-center gap-1.5 rounded-l bg-success px-3 text-[12px] font-semibold text-[#1D1D26] hover:opacity-90"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span className="hidden sm:inline">{S.preview}</span>
        </button>
        <button
          type="button"
          aria-label={S.previewWithDebugger}
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            setPreviewMenu({ x: rect.right - 190, y: rect.bottom + 4 });
          }}
          className="flex h-8 items-center rounded-r bg-success/85 px-1 text-[#1D1D26] hover:bg-success"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {previewMenu ? (
        <GdMenu
          entries={previewEntries}
          anchor={previewMenu}
          onClose={() => setPreviewMenu(null)}
        />
      ) : null}
    </div>
  );
}
