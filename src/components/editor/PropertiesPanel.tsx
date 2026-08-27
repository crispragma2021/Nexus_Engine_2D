import * as React from "react";
import { Eye, EyeOff, Plus, Trash2, Lock, Unlock } from "lucide-react";
import { useEditor } from "@/lib/editor/store";
import { cn } from "@/lib/utils";

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="flex items-center gap-2 px-3 py-1 text-[11px]">
      <span className="w-16 shrink-0 text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-6 w-full rounded border border-separator bg-window px-1.5 text-[11px] text-foreground outline-none focus:border-link"
      />
    </label>
  );
}

const TABS = ["properties", "instances", "layers"] as const;

export function PropertiesPanel() {
  const { project, ui, dispatch } = useEditor();
  const selected = project.instances.find((i) => i.id === ui.selectedInstanceIds[0]);
  const obj = selected && project.objects.find((o) => o.id === selected.objectId);

  return (
    <aside className="flex w-64 shrink-0 flex-col border-l border-separator bg-toolbar">
      <div className="flex h-8 shrink-0 border-b border-separator">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => dispatch({ type: "ui", patch: { rightTab: t } })}
            className={cn(
              "flex-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground",
              ui.rightTab === t && "border-b-2 border-primary text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {ui.rightTab === "properties" &&
          (selected && obj ? (
            <div className="space-y-0.5">
              <div className="px-3 pb-2 text-[11px] font-semibold text-foreground">
                {obj.name}
                <span className="ml-1 font-normal text-muted-foreground">({obj.type})</span>
              </div>
              <Field
                label="X"
                type="number"
                value={selected.x}
                onChange={(v) =>
                  dispatch({ type: "updateInstance", id: selected.id, patch: { x: Number(v) || 0 } })
                }
              />
              <Field
                label="Y"
                type="number"
                value={selected.y}
                onChange={(v) =>
                  dispatch({ type: "updateInstance", id: selected.id, patch: { y: Number(v) || 0 } })
                }
              />
              <Field
                label="Width"
                type="number"
                value={selected.width}
                onChange={(v) =>
                  dispatch({
                    type: "updateInstance",
                    id: selected.id,
                    patch: { width: Number(v) || 0, customSize: true },
                  })
                }
              />
              <Field
                label="Height"
                type="number"
                value={selected.height}
                onChange={(v) =>
                  dispatch({
                    type: "updateInstance",
                    id: selected.id,
                    patch: { height: Number(v) || 0, customSize: true },
                  })
                }
              />
              <Field
                label="Angle"
                type="number"
                value={selected.angle}
                onChange={(v) =>
                  dispatch({
                    type: "updateInstance",
                    id: selected.id,
                    patch: { angle: Number(v) || 0 },
                  })
                }
              />
              <Field
                label="Z order"
                type="number"
                value={selected.zOrder}
                onChange={(v) =>
                  dispatch({
                    type: "updateInstance",
                    id: selected.id,
                    patch: { zOrder: Number(v) || 0 },
                  })
                }
              />
              <label className="flex items-center gap-2 px-3 py-1 text-[11px]">
                <span className="w-16 shrink-0 text-muted-foreground">Layer</span>
                <select
                  value={selected.layer}
                  onChange={(e) =>
                    dispatch({
                      type: "updateInstance",
                      id: selected.id,
                      patch: { layer: e.target.value },
                    })
                  }
                  className="h-6 w-full rounded border border-separator bg-window px-1 text-[11px] text-foreground outline-none focus:border-link"
                >
                  {project.layers.map((l) => (
                    <option key={l.name} value={l.name}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() =>
                  dispatch({
                    type: "updateInstance",
                    id: selected.id,
                    patch: { locked: !selected.locked },
                  })
                }
                className="mx-3 mt-2 flex items-center gap-1.5 rounded px-2 py-1 text-[11px] text-muted-foreground hover:bg-elevated hover:text-foreground"
              >
                {selected.locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                {selected.locked ? "Unlock instance" : "Lock instance"}
              </button>

              <div className="mt-3 border-t border-separator px-3 pt-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Instance variables
              </div>
              {obj.variables.length === 0 ? (
                <p className="px-3 py-1 text-[11px] text-muted-foreground">No variables.</p>
              ) : (
                obj.variables.map((v) => (
                  <div key={v.name} className="flex items-center gap-2 px-3 py-0.5 text-[11px]">
                    <span className="w-16 truncate text-link">{v.name}</span>
                    <span className="text-foreground">{v.value}</span>
                  </div>
                ))
              )}

              <button
                type="button"
                onClick={() => dispatch({ type: "deleteInstance", id: selected.id })}
                className="mx-3 mt-3 flex items-center gap-1.5 rounded px-2 py-1 text-[11px] text-destructive hover:bg-elevated"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete instance
              </button>
            </div>
          ) : (
            <p className="px-3 text-[11px] leading-relaxed text-muted-foreground">
              Click on an instance in the scene to display its properties.
            </p>
          ))}

        {ui.rightTab === "instances" && (
          <ul className="text-[11px]">
            {project.instances.map((i) => {
              const o = project.objects.find((x) => x.id === i.objectId);
              const sel = ui.selectedInstanceIds.includes(i.id);
              return (
                <li key={i.id}>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "selectInstance", id: i.id })}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-1 text-left hover:bg-elevated",
                      sel && "bg-selection text-foreground",
                    )}
                  >
                    <span className="flex-1 truncate">{o?.name ?? "?"}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {Math.round(i.x)};{Math.round(i.y)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {ui.rightTab === "layers" && (
          <div className="text-[11px]">
            {[...project.layers].reverse().map((l) => (
              <div
                key={l.name}
                className="flex items-center gap-2 px-3 py-1 hover:bg-elevated"
              >
                <button
                  type="button"
                  title="Toggle visibility"
                  onClick={() => dispatch({ type: "toggleLayer", name: l.name })}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {l.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
                <span className={cn("flex-1 truncate", !l.visible && "text-muted-foreground")}>
                  {l.name}
                </span>
                <span className="text-muted-foreground">
                  {project.instances.filter((i) => i.layer === l.name).length}
                </span>
              </div>
            ))}
            <button
              type="button"
              onClick={() => dispatch({ type: "addLayer" })}
              className="mx-3 mt-2 flex items-center gap-1.5 rounded px-2 py-1 text-link hover:bg-elevated"
            >
              <Plus className="h-3.5 w-3.5" /> Add a layer
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
