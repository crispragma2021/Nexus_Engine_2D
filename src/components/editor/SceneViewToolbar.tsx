import { Grid3x3, Magnet, Maximize, ZoomIn, ZoomOut } from "lucide-react";
import { useEditor } from "@/lib/editor/store";
import { S } from "@/lib/editor/i18n";
import { clampCanvasZoom } from "@/lib/editor/canvas-gestures";
import { cn } from "@/lib/utils";

const ZOOM_BUTTON_FACTOR = 2 ** (2 / 16);

export interface SceneViewToolbarProps {
  onFit: () => void;
}

export function SceneViewToolbar({ onFit }: SceneViewToolbarProps) {
  const { ui, dispatch, scene } = useEditor();

  const zoomOut = () =>
    dispatch({ type: "ui", patch: { zoom: clampCanvasZoom(ui.zoom / ZOOM_BUTTON_FACTOR) } });
  const zoomIn = () =>
    dispatch({ type: "ui", patch: { zoom: clampCanvasZoom(ui.zoom * ZOOM_BUTTON_FACTOR) } });
  const resetView = () => dispatch({ type: "ui", patch: { zoom: 1, pan: { x: 0, y: 0 } } });

  return (
    <div
      data-scene-view-toolbar="floating"
      className="pointer-events-auto absolute left-2 top-2 z-10 hidden items-center gap-0.5 rounded-md border border-separator bg-toolbar/90 p-0.5 shadow-lg backdrop-blur sm:flex"
    >
      <button
        type="button"
        title={S.toggleGrid}
        aria-label={S.toggleGrid}
        data-grid-toggle
        onClick={() => dispatch({ type: "updateGrid", patch: { show: !scene.grid.show } })}
        className={cn(
          "grid h-7 w-7 place-items-center rounded text-muted-foreground hover:bg-elevated hover:text-foreground",
          scene.grid.show && "text-[#8AD6FF]",
        )}
      >
        <Grid3x3 className="h-4 w-4" />
      </button>

      <button
        type="button"
        title={S.snapToGrid}
        aria-label={S.snapToGrid}
        data-snap-toggle
        onClick={() => dispatch({ type: "updateGrid", patch: { snap: !scene.grid.snap } })}
        className={cn(
          "grid h-7 w-7 place-items-center rounded text-muted-foreground hover:bg-elevated hover:text-foreground",
          scene.grid.snap && "text-[#8AD6FF]",
        )}
      >
        <Magnet className="h-4 w-4" />
      </button>

      <div className="mx-0.5 h-4 w-px bg-separator" />

      <button
        type="button"
        title={S.zoomOut}
        aria-label={S.zoomOut}
        data-zoom-out
        onClick={zoomOut}
        className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:bg-elevated hover:text-foreground"
      >
        <ZoomOut className="h-4 w-4" />
      </button>

      <button
        type="button"
        title={`${S.zoomReset} (100%)`}
        aria-label={S.zoomReset}
        data-zoom-reset
        onClick={resetView}
        className="h-7 w-12 shrink-0 rounded px-1 text-center text-[11.5px] tabular-nums text-muted-foreground hover:bg-elevated hover:text-foreground"
      >
        {Math.round(ui.zoom * 100)}%
      </button>

      <button
        type="button"
        title={S.zoomIn}
        aria-label={S.zoomIn}
        data-zoom-in
        onClick={zoomIn}
        className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:bg-elevated hover:text-foreground"
      >
        <ZoomIn className="h-4 w-4" />
      </button>

      <div className="mx-0.5 h-4 w-px bg-separator" />

      <button
        type="button"
        title={S.zoomToFit}
        aria-label={S.zoomToFit}
        data-fit-view
        onClick={onFit}
        className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:bg-elevated hover:text-foreground"
      >
        <Maximize className="h-4 w-4" />
      </button>
    </div>
  );
}
