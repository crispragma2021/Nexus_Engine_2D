// Object groups — the second section of GDevelop's left column: scene groups and
// global groups, with the member objects toggled from the object list.

import * as React from "react";
import { Check, Plus, SquareStack, Trash2 } from "lucide-react";
import { useEditor } from "@/lib/editor/store";
import { S } from "@/lib/editor/i18n";
import { cn } from "@/lib/utils";

export function GroupsPanel() {
  const { scene, ui, dispatch } = useEditor();
  const [open, setOpen] = React.useState(true);
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const groups = scene.groups ?? [];

  return (
    <div className="shrink-0 border-t border-separator bg-toolbar">
      <div className="flex items-center gap-1 px-2 py-1.5">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="flex min-w-0 flex-1 items-center gap-1 rounded px-1 py-0.5 text-left text-[11px] font-semibold uppercase tracking-wide text-text-secondary hover:bg-list-hover hover:text-foreground"
        >
          <span className="text-[10px]">{open ? "▾" : "▸"}</span>
          <span className="truncate">{S.objectGroups}</span>
          <span className="ml-1 rounded bg-elevated px-1 text-[10px] tabular-nums">
            {groups.length}
          </span>
        </button>
        <button
          type="button"
          aria-label={S.objectGroups}
          title={S.objectGroups}
          onClick={() => dispatch({ type: "addObjectGroup" })}
          className="grid h-6 w-6 place-items-center rounded text-text-secondary hover:bg-elevated hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {open ? (
        <div className="pb-2">
          {groups.length === 0 ? (
            <p className="px-3 py-1 text-[12px] text-text-placeholder">
              Aún no hay grupos de objetos.
            </p>
          ) : null}
          {groups.map((group) => {
            const isExpanded = expanded === group.name;
            return (
              <div key={group.name}>
                <div
                  className={cn(
                    "group mx-1 flex items-center gap-1.5 rounded px-1.5 py-[5px] text-[12.5px] hover:bg-list-hover",
                    ui.selectedGroupName === group.name && "bg-selection",
                  )}
                  onClick={() => dispatch({ type: "ui", patch: { selectedGroupName: group.name } })}
                >
                  <SquareStack className="h-4 w-4 shrink-0 text-[#A483FF]" />
                  <input
                    value={group.name}
                    aria-label={S.name}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) =>
                      dispatch({
                        type: "updateObjectGroup",
                        name: group.name,
                        patch: { name: event.target.value },
                      })
                    }
                    className="h-5 min-w-0 flex-1 rounded border border-transparent bg-transparent px-0.5 outline-none hover:border-separator focus:border-[var(--brand-light)]"
                  />
                  <button
                    type="button"
                    aria-label="Objetos del grupo"
                    onClick={(event) => {
                      event.stopPropagation();
                      setExpanded(isExpanded ? null : group.name);
                    }}
                    className="shrink-0 text-[10px] text-text-secondary hover:text-foreground"
                  >
                    {group.objects.length} {isExpanded ? "▴" : "▾"}
                  </button>
                  <button
                    type="button"
                    aria-label={S.delete}
                    onClick={(event) => {
                      event.stopPropagation();
                      dispatch({ type: "deleteObjectGroup", name: group.name });
                    }}
                    className="shrink-0 text-text-secondary opacity-0 hover:text-destructive group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {isExpanded ? (
                  <div className="mb-1 ml-6 border-l border-separator pl-2">
                    {scene.objects.map((object) => {
                      const member = group.objects.includes(object.name);
                      return (
                        <button
                          key={object.id}
                          type="button"
                          onClick={() =>
                            dispatch({
                              type: "updateObjectGroup",
                              name: group.name,
                              patch: {
                                objects: member
                                  ? group.objects.filter((name) => name !== object.name)
                                  : [...group.objects, object.name],
                              },
                            })
                          }
                          className={cn(
                            "flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left text-[12px] hover:bg-list-hover",
                            member ? "text-foreground" : "text-text-placeholder",
                          )}
                        >
                          <span className="grid h-3.5 w-3.5 shrink-0 place-items-center rounded-[2px] border border-separator">
                            {member ? <Check className="h-2.5 w-2.5 text-success" /> : null}
                          </span>
                          <span className="min-w-0 flex-1 truncate">{object.name}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
