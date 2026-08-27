import * as React from "react";
import { Search, Plus, Image as ImageIcon, Type, LayoutGrid, Trash2, Group } from "lucide-react";
import { useEditor } from "@/lib/editor/store";
import { cn } from "@/lib/utils";
import { NewObjectDialog } from "./NewObjectDialog";

function objectIcon(type: string) {
  if (type === "Text") return Type;
  if (type === "Tiled Sprite") return LayoutGrid;
  return ImageIcon;
}

export function ObjectsPanel() {
  const { project, ui, dispatch } = useEditor();
  const [query, setQuery] = React.useState("");
  const [dialog, setDialog] = React.useState(false);

  const list = project.objects.filter((o) =>
    o.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-separator bg-toolbar">
      <div className="flex h-8 items-center border-b border-separator px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Objects
      </div>
      <div className="p-2">
        <div className="flex items-center gap-2 rounded bg-elevated px-2 py-1.5">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search objects"
            className="w-full bg-transparent text-[12.5px] outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-1">
        {list.map((o) => {
          const Icon = objectIcon(o.type);
          const selected = ui.selectedObjectId === o.id;
          return (
            <div
              key={o.id}
              role="button"
              tabIndex={0}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("text/objectId", o.id)}
              onClick={() => dispatch({ type: "ui", patch: { selectedObjectId: o.id } })}
              onKeyDown={(e) =>
                e.key === "Enter" && dispatch({ type: "ui", patch: { selectedObjectId: o.id } })
              }
              className={cn(
                "group flex cursor-grab items-center gap-2 rounded px-2 py-1.5 text-[12.5px] hover:bg-elevated",
                selected && "bg-selection",
              )}
            >
              {o.asset ? (
                <img
                  src={o.asset}
                  alt=""
                  className="h-5 w-5 shrink-0 object-contain [image-rendering:pixelated]"
                />
              ) : (
                <Icon className="h-4 w-4 shrink-0 text-link" />
              )}
              <span className="truncate">{o.name}</span>
              <span className="ml-auto hidden shrink-0 text-[10px] text-muted-foreground group-hover:inline">
                {o.type}
              </span>
              <button
                type="button"
                aria-label={`Delete ${o.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch({ type: "deleteObject", id: o.id });
                }}
                className="hidden shrink-0 text-muted-foreground hover:text-destructive group-hover:block"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}

        <div className="mt-3 border-t border-separator pt-2">
          <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Object groups
          </div>
          <div className="flex items-center gap-2 rounded px-2 py-1.5 text-[12.5px] text-muted-foreground hover:bg-elevated">
            <Group className="h-4 w-4 text-link" /> Enemies
          </div>
          <div className="flex items-center gap-2 rounded px-2 py-1.5 text-[12.5px] text-muted-foreground hover:bg-elevated">
            <Group className="h-4 w-4 text-link" /> Collectibles
          </div>
        </div>
      </div>

      <div className="border-t border-separator p-2">
        <button
          type="button"
          onClick={() => setDialog(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded bg-primary px-2 py-1.5 text-[12px] font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" /> Add a new object
        </button>
      </div>

      <NewObjectDialog open={dialog} onClose={() => setDialog(false)} />
    </aside>
  );
}
