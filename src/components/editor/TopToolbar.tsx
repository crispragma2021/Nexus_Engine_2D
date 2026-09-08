// The 40px action bar (`UI/Toolbar.js`): left = actions of the active tab,
// right = scene picker + preview. Grid/snap/zoom live in the scene toolbar under
// the canvas (like GDevelop), while the object/event commands sit here.

import { useState } from "react";
import {
  Bot,
  ChevronDown,
  ClipboardCopy,
  ClipboardPaste,
  Clock,
  Copy,
  Eraser,
  Globe,
  Grid3x3,
  Magnet,
  PanelLeft,
  PanelRight,
  Play,
  Plus,
  Redo2,
  Scissors,
  Smartphone,
  SquareStack,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useEditor } from "@/lib/editor/store";
import { S } from "@/lib/editor/i18n";
import {
  clearClipboard,
  clipboardSummary,
  copyInstances,
  copyObjects,
  hasClipboard,
  pasteInto,
} from "@/lib/editor/clipboard";
import { cn } from "@/lib/utils";
import { clampCanvasZoom } from "@/lib/editor/canvas-gestures";
import { GdMenu, IconButton, type MenuEntry } from "./gd/kit";

const ZOOM_BUTTON_FACTOR = 2 ** (2 / 16);

const Sep = () => <div className="mx-1 h-5 w-px shrink-0 bg-separator" />;

export function TopToolbar() {
  const { ui, dispatch, scene, canUndo, canRedo } = useEditor();
  const [previewMenu, setPreviewMenu] = useState<{ x: number; y: number } | null>(null);

  const isEvents = ui.tab === "events";
  const tab = ui.openedTabs.find((t) => t.id === ui.activeTabId);
  const isProjectTab = !!tab && tab.kind !== "scene";

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
    <div className="flex h-10 shrink-0 items-center gap-0.5 border-b border-separator bg-toolbar px-2 text-[13px]">
      <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto [&::-webkit-scrollbar]:h-0">
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
                  copyInstances(
                    scene.instances.filter((i) => ui.selectedInstanceIds.includes(i.id)),
                  );
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
            <IconButton
              label={S.clearClipboard}
              disabled={!hasClipboard()}
              onClick={clearClipboard}
            >
              <Eraser className="h-4 w-4" />
            </IconButton>
          </>
        )}

        {!isEvents && !isProjectTab && (
          <>
            <div className="hidden md:contents">
              <Sep />
              <IconButton
                label={ui.showLeftPanel ? "Ocultar panel de objetos" : "Mostrar panel de objetos"}
                active={ui.showLeftPanel}
                onClick={() =>
                  dispatch({ type: "ui", patch: { showLeftPanel: !ui.showLeftPanel } })
                }
              >
                <PanelLeft className="h-4 w-4" />
              </IconButton>
              <IconButton
                label={ui.showRightPanel ? "Ocultar panel derecho" : "Mostrar panel derecho"}
                active={ui.showRightPanel}
                onClick={() =>
                  dispatch({ type: "ui", patch: { showRightPanel: !ui.showRightPanel } })
                }
              >
                <PanelRight className="h-4 w-4" />
              </IconButton>
            </div>
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
              onClick={() =>
                dispatch({
                  type: "ui",
                  patch: { zoom: clampCanvasZoom(ui.zoom / ZOOM_BUTTON_FACTOR) },
                })
              }
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
              onClick={() =>
                dispatch({
                  type: "ui",
                  patch: { zoom: clampCanvasZoom(ui.zoom * ZOOM_BUTTON_FACTOR) },
                })
              }
            >
              <ZoomIn className="h-4 w-4" />
            </IconButton>
          </>
        )}

        <div className="min-w-2 flex-1" />

        <IconButton
          label="Asistente Agente (Automatización IA)"
          active={ui.quickAutomationOpen}
          onClick={() =>
            dispatch({
              type: "ui",
              patch: { quickAutomationOpen: !ui.quickAutomationOpen, inlineAi: null },
            })
          }
        >
          <Bot className="h-4 w-4 text-[#A996FF]" />
        </IconButton>
        <Sep />

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
      </div>

      <div className="z-10 flex shrink-0 items-center bg-toolbar pl-1 shadow-[-8px_0_12px_rgba(37,37,46,0.95)]">
        <Sep />
        <button
          type="button"
          aria-label="Compartir"
          title={S.share}
          onClick={() =>
            dispatch({ type: "openDialog", dialog: { name: "share", tab: "publish" } })
          }
          className="flex h-8 shrink-0 items-center gap-1.5 rounded bg-[#7046EC] px-2 text-[12px] font-semibold text-white hover:opacity-90 sm:px-3"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{S.share}</span>
        </button>
        <IconButton
          label="Vista previa en dispositivo"
          className="hidden sm:flex"
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
            className="flex h-8 items-center gap-1.5 rounded-l bg-success px-2 text-[12px] font-semibold text-[#1D1D26] hover:opacity-90 sm:px-3"
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
