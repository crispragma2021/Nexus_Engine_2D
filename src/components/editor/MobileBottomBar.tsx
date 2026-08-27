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

export function MobileBottomBar() {
  const { dispatch } = useEditor();
  const [open, setOpen] = React.useState<SheetKey | null>(null);

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
          className="h-[65vh] border-separator bg-toolbar p-0 text-foreground"
        >
          <SheetHeader className="border-b border-separator px-4 py-2 text-left">
            <SheetTitle className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
              {ITEMS.find((i) => i.key === open)?.label ?? ""}
            </SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-hidden [&>aside]:h-full [&>aside]:w-full [&>aside]:border-0">
            {open === "objects" || open === "groups" ? <ObjectsPanel /> : null}
            {isRight ? <PropertiesPanel /> : null}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
