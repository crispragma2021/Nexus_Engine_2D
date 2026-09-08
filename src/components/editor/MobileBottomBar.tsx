import * as React from "react";
import { Box, Boxes, Layers, ListTree, PenLine } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { useEditor } from "@/lib/editor/store";
import { S } from "@/lib/editor/i18n";
import { cn } from "@/lib/utils";
import { GroupsPanel } from "./GroupsPanel";
import { InstancesPanel } from "./InstancesPanel";
import { LayersPanel } from "./LayersPanel";
import { ObjectsPanel } from "./ObjectsPanel";
import { PropertiesPanel } from "./PropertiesPanel";

type SheetKey = "objects" | "groups" | "properties" | "instances" | "layers";

const ITEMS: { key: SheetKey; label: string; icon: React.ElementType }[] = [
  { key: "objects", label: S.objects, icon: Box },
  { key: "groups", label: S.objectGroups, icon: Boxes },
  { key: "properties", label: S.properties, icon: PenLine },
  { key: "instances", label: S.instances, icon: ListTree },
  { key: "layers", label: S.layers, icon: Layers },
];

const MIN_VH = 25;
const MAX_VH = 90;
const DEFAULT_VH = 65;
const STORAGE_KEY = "nexus-engine:mobile-panel-height";
const LEGACY_STORAGE_KEY = "gdevelop:panel-height";

function clampVh(value: number) {
  return Math.min(MAX_VH, Math.max(MIN_VH, Math.round(value)));
}

function readStoredHeight(): number {
  if (typeof window === "undefined") return DEFAULT_VH;
  const raw =
    window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) return DEFAULT_VH;
  const value = Number(raw);
  return Number.isFinite(value) ? clampVh(value) : DEFAULT_VH;
}

export function MobileBottomBar() {
  const { ui, dispatch } = useEditor();
  const assistantOpen = ui.quickAutomationOpen;
  const [open, setOpen] = React.useState<SheetKey | null>(null);
  const [heightVh, setHeightVh] = React.useState<number>(DEFAULT_VH);
  const [dragging, setDragging] = React.useState(false);
  const dragState = React.useRef<{ startY: number; startVh: number } | null>(null);
  const heightRef = React.useRef(heightVh);
  heightRef.current = heightVh;

  React.useEffect(() => {
    setHeightVh(readStoredHeight());
  }, []);

  const onMove = React.useCallback((event: PointerEvent) => {
    const start = dragState.current;
    if (!start) return;
    event.preventDefault();
    const startHeightPx = (start.startVh / 100) * window.innerHeight;
    const nextHeightPx = startHeightPx - (event.clientY - start.startY);
    setHeightVh(clampVh((nextHeightPx / window.innerHeight) * 100));
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

  React.useEffect(
    () => () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
    },
    [endDrag, onMove],
  );

  const onHandlePointerDown = (event: React.PointerEvent) => {
    event.preventDefault();
    setDragging(true);
    dragState.current = { startY: event.clientY, startVh: heightRef.current };
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
  };

  const resetHeight = () => {
    setHeightVh(DEFAULT_VH);
    window.localStorage.setItem(STORAGE_KEY, String(DEFAULT_VH));
  };

  const select = (key: SheetKey) => {
    if (key === "properties" || key === "instances" || key === "layers") {
      dispatch({
        type: "ui",
        patch: {
          rightTab: key,
          ...(key === "properties" ? { showPropertiesPanel: true } : {}),
          ...(key === "instances" ? { showInstancesPanel: true } : {}),
          ...(key === "layers" ? { showLayersPanel: true } : {}),
        },
      });
    }
    setOpen((current) => (current === key ? null : key));
  };

  const closePanel = React.useCallback(() => setOpen(null), []);
  const title = ITEMS.find((item) => item.key === open)?.label ?? S.properties;

  // El asistente (QuickAutomationBar) es un drawer inferior a pantalla completa:
  // mientras esté abierto ocultamos el dock permanente y cerramos cualquier panel
  // para que no asome ningún fragmento detrás del área inferior (safe-area incluida).
  React.useEffect(() => {
    if (assistantOpen) setOpen(null);
  }, [assistantOpen]);

  return (
    <>
      {assistantOpen ? null : (
        <nav
          aria-label="Herramientas del editor de escena"
          data-editor-mobile-dock="permanent"
          className="fixed inset-x-0 bottom-0 z-40 flex h-[var(--mobile-editor-dock-height)] items-stretch border-t border-separator bg-toolbar pb-[env(safe-area-inset-bottom)] md:hidden"
        >
          {ITEMS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              aria-label={label}
              aria-controls="mobile-editor-drawer"
              aria-expanded={open === key}
              aria-pressed={open === key}
              onClick={() => select(key)}
              className={cn(
                "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 text-[8px] font-medium uppercase tracking-tight transition-colors",
                open === key
                  ? "bg-[#32323B] text-link"
                  : "text-muted-foreground active:bg-elevated",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "absolute inset-x-2 top-0 h-0.5 rounded-full bg-transparent",
                  open === key && "bg-[#8AD6FF]",
                )}
              />
              <Icon className="h-5 w-5 shrink-0" />
              <span className="w-full truncate">{label}</span>
            </button>
          ))}
        </nav>
      )}

      <Sheet
        open={open !== null && !assistantOpen}
        modal={false}
        onOpenChange={(value) => !value && closePanel()}
      >
        <SheetContent
          id="mobile-editor-drawer"
          side="bottom"
          hideCloseButton
          overlayClassName="bottom-[var(--mobile-editor-dock-height)] z-20 bg-black/55 md:hidden"
          className={cn(
            "bottom-[var(--mobile-editor-dock-height)] z-30 flex max-h-[calc(100dvh-var(--mobile-editor-dock-height)-2rem)] flex-col gap-0 border-separator bg-toolbar p-0 text-foreground md:hidden",
            dragging && "transition-none data-[state=open]:animate-none",
          )}
          style={{
            height: `min(${heightVh}dvh, calc(100dvh - var(--mobile-editor-dock-height) - 2rem))`,
          }}
        >
          <SheetTitle className="sr-only">{title}</SheetTitle>
          <SheetDescription className="sr-only">
            Panel superpuesto del editor. Arrastra el control superior para cambiar su altura.
          </SheetDescription>

          <div
            role="separator"
            aria-orientation="horizontal"
            aria-label="Cambiar la altura del panel"
            onPointerDown={onHandlePointerDown}
            onDoubleClick={resetHeight}
            className={cn(
              "flex h-9 shrink-0 cursor-grab touch-none select-none items-center justify-center border-b border-separator",
              dragging && "cursor-grabbing",
            )}
          >
            <span className="h-1.5 w-10 rounded-full bg-muted-foreground/50" />
          </div>

          <div className="flex min-h-0 flex-1 overflow-hidden [&>div]:min-h-0 [&>div]:w-full [&>section]:h-full [&>section]:w-full [&>section]:border-0">
            {open === "objects" ? <ObjectsPanel onClose={closePanel} /> : null}
            {open === "groups" ? <GroupsPanel standalone onClose={closePanel} /> : null}
            {open === "properties" ? <PropertiesPanel /> : null}
            {open === "instances" ? <InstancesPanel onClose={closePanel} /> : null}
            {open === "layers" ? <LayersPanel onClose={closePanel} /> : null}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
