import * as React from "react";
import { useEditor } from "@/lib/editor/store";
import { cn } from "@/lib/utils";

const GRID = 32;

export function SceneCanvas() {
  const { project, ui, dispatch } = useEditor();
  const ref = React.useRef<HTMLDivElement>(null);
  const drag = React.useRef<{ id: string; dx: number; dy: number } | null>(null);

  const toScene = (clientX: number, clientY: number) => {
    const rect = ref.current!.getBoundingClientRect();
    return { x: (clientX - rect.left) / ui.zoom, y: (clientY - rect.top) / ui.zoom };
  };

  const onPointerDown = (e: React.PointerEvent, id: string, x: number, y: number) => {
    e.stopPropagation();
    dispatch({ type: "selectInstance", id, additive: e.shiftKey });
    const p = toScene(e.clientX, e.clientY);
    drag.current = { id, dx: p.x - x, dy: p.y - y };
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const p = toScene(e.clientX, e.clientY);
    let x = Math.round(p.x - d.dx);
    let y = Math.round(p.y - d.dy);
    if (ui.snap) {
      x = Math.round(x / GRID) * GRID;
      y = Math.round(y / GRID) * GRID;
    }
    dispatch({ type: "moveInstance", id: d.id, x, y });
  };

  const endDrag = () => {
    drag.current = null;
  };

  const visibleLayers = new Set(project.layers.filter((l) => l.visible).map((l) => l.name));
  const instances = [...project.instances]
    .filter((i) => visibleLayers.has(i.layer))
    .sort((a, b) => a.zOrder - b.zOrder);

  return (
    <div
      className="relative flex-1 overflow-auto bg-window no-select"
      onPointerDown={() => dispatch({ type: "selectInstance", id: null })}
    >
      <div className="min-h-full min-w-full p-10">
        <div
          ref={ref}
          className="relative origin-top-left shadow-[0_0_0_1px_var(--separator)]"
          style={{
            width: project.windowWidth,
            height: project.windowHeight,
            transform: `scale(${ui.zoom})`,
            backgroundColor: "var(--window)",
            backgroundImage: ui.grid
              ? `linear-gradient(to right, color-mix(in oklab, var(--separator) 45%, transparent) 1px, transparent 1px),
                 linear-gradient(to bottom, color-mix(in oklab, var(--separator) 45%, transparent) 1px, transparent 1px)`
              : undefined,
            backgroundSize: `${GRID}px ${GRID}px`,
          }}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {/* scene origin */}
          <div className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-link/70" />

          {instances.map((inst) => {
            const obj = project.objects.find((o) => o.id === inst.objectId);
            if (!obj) return null;
            const selected = ui.selectedInstanceIds.includes(inst.id);
            return (
              <div
                key={inst.id}
                onPointerDown={(e) => onPointerDown(e, inst.id, inst.x, inst.y)}
                className={cn("absolute cursor-move", selected && "outline outline-1 outline-link")}
                style={{
                  left: inst.x,
                  top: inst.y,
                  width: inst.width,
                  height: inst.height,
                  transform: `rotate(${inst.angle}deg)`,
                  zIndex: inst.zOrder,
                }}
                title={obj.name}
              >
                {obj.type === "Text" ? (
                  <span
                    className="block whitespace-nowrap font-semibold"
                    style={{ color: obj.textColor ?? "#FAFAFA", fontSize: obj.textSize ?? 24 }}
                  >
                    {obj.text}
                  </span>
                ) : (
                  <img
                    src={obj.asset}
                    alt={obj.name}
                    draggable={false}
                    className="h-full w-full"
                    style={{
                      imageRendering: "pixelated",
                      objectFit: obj.type === "Tiled Sprite" ? "fill" : "contain",
                    }}
                  />
                )}
                {selected && (
                  <>
                    {[
                      "left-0 top-0",
                      "right-0 top-0",
                      "left-0 bottom-0",
                      "right-0 bottom-0",
                    ].map((pos) => (
                      <span
                        key={pos}
                        className={cn(
                          "absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 border border-window bg-link",
                          pos,
                        )}
                        style={{ margin: 0 }}
                      />
                    ))}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
