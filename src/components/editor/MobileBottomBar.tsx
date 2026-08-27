import * as React from "react";
import { Box, Boxes, PenLine, ListTree, Layers } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useEditor } from "@/lib/editor/store";
import { cn } from "@/lib/utils";
import { ObjectsPanel } from "./ObjectsPanel";
import { PropertiesPanel } from "./PropertiesPanel";

type SheetKey = "objects" | "groups" | "properties" | "instances" | "layers";

const ITEMS: { key: SheetKey; label: string; icon: React.ElementType }[] = [
  { key: "objects", label: "Objects", icon: Box },
  { key: "groups", label: "Groups", icon: Boxes },
  { key: "properties", label: "Edit", icon: PenLine },
  { key: "instances", label: "Instances", icon: ListTree },
  { key: "layers", label: "Layers", icon: Layers },
];

const MIN_VH = 25;
const MAX_VH = 90;
const DEFAULT_VH = 65;
const STORAGE_KEY = "gdevelop:panel-height";

function clampVh(v: number) {
  return Math.min(MAX_VH, Math.max(MIN_VH, Math.round(v)));
}

function readStoredHeight(): number {
  if (typeof window === "undefined") return DEFAULT_VH;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_VH;
  const n = Number(raw);
  return Number.isFinite(n) ? clampVh(n) : DEFAULT_VH;
}

export function MobileBottomBar() {
  const { dispatch } = useEditor();
  const [open, setOpen] = React.useState<SheetKey | null>(null);
  const [heightVh, setHeightVh] = React.useState<number>(DEFAULT_VH);
  const [dragging, setDragging] = React.useState(false);

  // Restore persisted height after hydration (avoids SSR mismatch).
  React.useEffect(() => {
    setHeightVh(readStoredHeight());
  }, []);

  // Pointer-drag resize of the bottom sheet via the top handle.
  // pointerdown is wired directly in JSX (ref-stale effects missed it); move/up
  // go to window so the drag tracks once the finger leaves the handle area.
  const dragState = React.useRef<{ startY: number; startVh: number } | null>(null);
  const heightRef = React.useRef(heightVh);
  heightRef.current = heightVh;

  const onMove = React.useCallback((e: PointerEvent) => {
    const s = dragState.current;
    if (!s) return;
    e.preventDefault();
    const startHeightPx = (s.startVh / 100) * window.innerHeight;
    const newHeightPx = startHeightPx - (e.clientY - s.startY);
    const vh = (newHeightPx / window.innerHeight) * 100;
    setHeightVh(clampVh(vh));
  }, []);

  const endDrag = React.useCallback(() => {
    if (!dragState.current) return;
    dragState.current = null;
    setDragging(false);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", endDrag);
    window.removeEventListener("pointercancel", endDrag);
    window.localStorage.setItem(STORAGE_KEY, String(clampVh(heightRef.current)));
  }, [onMove]);

  const onHandlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setDragging(true);
    dragState.current = { startY: e.clientY, startVh: heightRef.current };
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
  };

  const onHandleDouble = () => {
    setHeightVh(DEFAULT_VH);
    window.localStorage.setItem(STORAGE_KEY, String(DEFAULT_VH));
  };

  const handle = (key: SheetKey) => {
    if (key === "properties" || key === "instances" || key === "layers") {
      dispatch({ type: "ui", patch: { rightTab: key } });
    }
    setOpen((prev) => (prev === key ? null : key));
  };

  const isRight = open === "properties" || open === "instances" || open === "layers";

  return (
    <>
      <nav className="flex h-14 shrink-0 items-stretch border-t border-separator bg-toolbar pb-[env(safe-area-inset-bottom)] md:hidden">
        {ITEMS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            aria-label={label}
            aria-pressed={open === key}
            onClick={() => handle(key)}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 text-[9px] font-medium uppercase tracking-wide transition-colors",
              open === key ? "text-link" : "text-muted-foreground active:bg-elevated",
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        ))}
      </nav>

      <Sheet open={open !== null} onOpenChange={(v) => !v && setOpen(null)}>
        <SheetContent
          side="bottom"
          className={cn(
            "border-separator bg-toolbar p-0 text-foreground",
            // Kill the slide animation while actively dragging for smooth resizing.
            dragging && "transition-none data-[state=open]:animate-none",
          )}
          style={{ height: `${heightVh}vh` }}
        >
          {/* Resize handle: thin visually, but a 44px touch target. */}
          <div
            role="separator"
            aria-orientation="horizontal"
            aria-label="Drag to resize panel"
            onPointerDown={onHandlePointerDown}
            onDoubleClick={onHandleDouble}
            className={cn(
              "flex h-11 shrink-0 cursor-grab touch-none select-none items-center justify-center border-b border-separator",
              dragging && "cursor-grabbing",
            )}
          >
            <span className="h-1.5 w-10 rounded-full bg-muted-foreground/50" />
          </div>

          <SheetHeader className="sr-only">
            <SheetTitle>{ITEMS.find((i) => i.key === open)?.label ?? ""}</SheetTitle>
          </SheetHeader>
          <div className="h-full min-h-0 flex-1 overflow-hidden [&>aside]:h-full [&>aside]:w-full [&>aside]:border-0">
            {open === "objects" || open === "groups" ? <ObjectsPanel /> : null}
            {isRight ? <PropertiesPanel /> : null}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
