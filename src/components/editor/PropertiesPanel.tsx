import * as React from "react";
import {
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Lock,
  Unlock,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Film,
  Search,
  Copy,
  ClipboardPaste,
  Undo2,
  Redo2,
  ExternalLink,
  RotateCw,
  Layers as LayersIcon,
  ArrowDown,
  Circle,
  CircleDot,
} from "lucide-react";
import { useEditor } from "@/lib/editor/store";
import type { GDSceneVariableType } from "@/lib/editor/types";
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
    <label className="flex items-center gap-2 px-3 py-1 text-[12px]">
      <span className="w-20 shrink-0 text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-full rounded border border-separator bg-window px-2 text-[12px] text-foreground outline-none focus:border-link"
      />
    </label>
  );
}

function Section({
  title,
  children,
  right,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="border-b border-separator py-2">
      <div className="flex items-center gap-2 px-3">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-separator text-muted-foreground hover:text-foreground"
        >
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <span className="flex-1 text-[13px] font-semibold text-foreground">{title}</span>
        {right}
      </div>
      {open ? <div className="mt-2">{children}</div> : null}
    </div>
  );
}

/** Scene-level properties + scene variables (shown when no instance is selected). */
function SceneProperties({ showSceneRow }: { showSceneRow: boolean }) {
  const { project, dispatch } = useEditor();
  const [showMore, setShowMore] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const variables = (project.sceneVariables ?? []).filter((v) =>
    v.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div>
      {showSceneRow ? (
        <div className="flex items-center gap-2 border-b border-separator px-3 py-3 text-[13px] text-foreground">
          <Film className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1 truncate">{project.name || "Escena sin título"}</span>
          <HelpCircle className="h-4 w-4 text-muted-foreground" />
        </div>
      ) : null}

      <Section title="Propiedades">
        <label className="flex items-center gap-2 px-3 py-1 text-[12px]">
          <span className="w-28 shrink-0 text-muted-foreground">Color de fondo</span>
          <input
            value={project.backgroundColor ?? "247;249;255"}
            onChange={(e) => dispatch({ type: "setBackgroundColor", value: e.target.value })}
            className="h-9 w-full rounded border border-separator bg-window px-2 text-[12px] text-foreground outline-none focus:border-link"
          />
          <span
            className="h-7 w-9 shrink-0 rounded border border-separator"
            style={{ backgroundColor: `rgb(${(project.backgroundColor ?? "247;249;255").replace(/;/g, ",")})` }}
          />
        </label>
        <button
          type="button"
          onClick={() => setShowMore((s) => !s)}
          className="mx-3 mt-2 flex h-10 w-[calc(100%-1.5rem)] items-center justify-center gap-2 rounded-md border border-separator text-[13px] font-semibold text-link"
        >
          {showMore ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          {showMore ? "Mostrar menos" : "Mostrar más"}
        </button>
        {showMore ? (
          <div className="mt-1">
            <Field label="Ancho" type="number" value={project.windowWidth} onChange={() => {}} />
            <Field label="Alto" type="number" value={project.windowHeight} onChange={() => {}} />
          </div>
        ) : null}
      </Section>

      <Section
        title="Variables de la escena"
        right={
          <div className="flex items-center gap-3 text-muted-foreground">
            <ExternalLink className="h-4 w-4" />
            <button
              type="button"
              aria-label="Añadir variable"
              onClick={() => dispatch({ type: "addSceneVariable" })}
              className="hover:text-foreground"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        }
      >
        <div className="flex items-center gap-3 px-3 pb-2 text-muted-foreground">
          <Copy className="h-4 w-4 opacity-50" />
          <ClipboardPaste className="h-4 w-4 opacity-50" />
          <Trash2 className="h-4 w-4 opacity-50" />
          <Undo2 className="h-4 w-4 opacity-50" />
          <Redo2 className="h-4 w-4 opacity-50" />
          <div className="flex flex-1 items-center gap-1.5 rounded-md bg-window px-2 py-2">
            <Search className="h-4 w-4" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar variables"
              className="w-full bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {variables.length === 0 ? (
          <p className="px-3 py-6 text-center text-[13px] text-muted-foreground">
            No hay <span className="text-link underline">variables</span> en esta escena.
          </p>
        ) : (
          <ul>
            {variables.map((v) => (
              <li key={v.id} className="border-t border-separator px-3 py-2">
                <input
                  value={v.name}
                  onChange={(e) =>
                    dispatch({ type: "updateSceneVariable", id: v.id, patch: { name: e.target.value } })
                  }
                  className="w-full border-b border-separator bg-transparent pb-1 text-[14px] text-foreground outline-none focus:border-link"
                />
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-[10px] text-muted-foreground">123</span>
                  <select
                    value={v.type}
                    onChange={(e) =>
                      dispatch({
                        type: "updateSceneVariable",
                        id: v.id,
                        patch: { type: e.target.value as GDSceneVariableType },
                      })
                    }
                    className="border-b border-separator bg-transparent pb-1 text-[13px] text-foreground outline-none"
                  >
                    <option value="number">Número</option>
                    <option value="string">Texto</option>
                    <option value="boolean">Booleano</option>
                  </select>
                  <input
                    value={v.value}
                    onChange={(e) =>
                      dispatch({ type: "updateSceneVariable", id: v.id, patch: { value: e.target.value } })
                    }
                    className="flex-1 border-b border-separator bg-transparent pb-1 text-[13px] text-foreground outline-none focus:border-link"
                  />
                  <button
                    type="button"
                    aria-label="Eliminar variable"
                    onClick={() => dispatch({ type: "deleteSceneVariable", id: v.id })}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

const TABS: { key: "properties" | "instances" | "layers"; label: string }[] = [
  { key: "properties", label: "Propiedades" },
  { key: "instances", label: "Instancias" },
  { key: "layers", label: "Capas" },
];

export function PropertiesPanel() {
  const { project, ui, dispatch } = useEditor();
  const selected = project.instances.find((i) => i.id === ui.selectedInstanceIds[0]);
  const obj = selected && project.objects.find((o) => o.id === selected.objectId);
  const [instanceQuery, setInstanceQuery] = React.useState("");
  const activeLayer = project.activeLayer ?? project.layers[0]?.name;

  const instances = project.instances.filter((i) => {
    const o = project.objects.find((x) => x.id === i.objectId);
    return (o?.name ?? "").toLowerCase().includes(instanceQuery.toLowerCase());
  });

  return (
    <aside className="flex w-64 shrink-0 flex-col border-l border-separator bg-toolbar">
      <div className="flex h-9 shrink-0 border-b border-separator">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => dispatch({ type: "ui", patch: { rightTab: t.key } })}
            className={cn(
              "flex-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground",
              ui.rightTab === t.key && "border-b-2 border-primary text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pb-6">
        {ui.rightTab === "properties" &&
          (selected && obj ? (
            <div className="space-y-0.5 py-2">
              <div className="px-3 pb-2 text-[12px] font-semibold text-foreground">
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
                label="Ancho"
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
                label="Alto"
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
                label="Ángulo"
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
                label="Orden Z"
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
              <label className="flex items-center gap-2 px-3 py-1 text-[12px]">
                <span className="w-20 shrink-0 text-muted-foreground">Capa</span>
                <select
                  value={selected.layer}
                  onChange={(e) =>
                    dispatch({
                      type: "updateInstance",
                      id: selected.id,
                      patch: { layer: e.target.value },
                    })
                  }
                  className="h-8 w-full rounded border border-separator bg-window px-1 text-[12px] text-foreground outline-none focus:border-link"
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
                className="mx-3 mt-2 flex items-center gap-1.5 rounded px-2 py-2 text-[12px] text-muted-foreground hover:bg-elevated hover:text-foreground"
              >
                {selected.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                {selected.locked ? "Desbloquear instancia" : "Bloquear instancia"}
              </button>

              <div className="mt-3 border-t border-separator px-3 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Variables de la instancia
              </div>
              {obj.variables.length === 0 ? (
                <p className="px-3 py-1 text-[12px] text-muted-foreground">No hay variables.</p>
              ) : (
                obj.variables.map((v) => (
                  <div key={v.name} className="flex items-center gap-2 px-3 py-0.5 text-[12px]">
                    <span className="w-20 truncate text-link">{v.name}</span>
                    <span className="text-foreground">{v.value}</span>
                  </div>
                ))
              )}

              <button
                type="button"
                onClick={() => dispatch({ type: "deleteInstance", id: selected.id })}
                className="mx-3 mt-3 flex items-center gap-1.5 rounded px-2 py-2 text-[12px] text-destructive hover:bg-elevated"
              >
                <Trash2 className="h-4 w-4" /> Eliminar instancia
              </button>
            </div>
          ) : (
            <SceneProperties showSceneRow />
          ))}

        {ui.rightTab === "instances" && (
          <div>
            <div className="p-3">
              <div className="flex items-center gap-2 rounded-md bg-window px-2 py-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  value={instanceQuery}
                  onChange={(e) => setInstanceQuery(e.target.value)}
                  placeholder="Buscar instancias"
                  className="w-full bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 border-b border-separator px-3 pb-2 text-[12px] text-muted-foreground">
              <span className="flex-1">Nombre del objeto</span>
              <span className="w-8 text-center">X</span>
              <span className="w-8 text-center">Y</span>
              <span className="w-8 text-center">Z</span>
              <RotateCw className="h-4 w-4" />
              <LayersIcon className="h-4 w-4" />
              <ArrowDown className="h-4 w-4" />
            </div>
            <ul className="text-[12px]">
              {instances.map((i) => {
                const o = project.objects.find((x) => x.id === i.objectId);
                const sel = ui.selectedInstanceIds.includes(i.id);
                return (
                  <li key={i.id}>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "selectInstance", id: i.id })}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-elevated",
                        sel && "bg-selection text-foreground",
                      )}
                    >
                      <span className="flex-1 truncate">{o?.name ?? "?"}</span>
                      <span className="w-8 text-center tabular-nums text-muted-foreground">
                        {Math.round(i.x)}
                      </span>
                      <span className="w-8 text-center tabular-nums text-muted-foreground">
                        {Math.round(i.y)}
                      </span>
                      <span className="w-8 text-center tabular-nums text-muted-foreground">
                        {i.zOrder}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {ui.rightTab === "layers" && (
          <div className="text-[14px]">
            <div className="flex justify-end px-3 py-2">
              <button
                type="button"
                aria-label="Añadir capa"
                onClick={() => dispatch({ type: "addLayer" })}
                className="text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-6 w-6" />
              </button>
            </div>
            {[...project.layers].reverse().map((l) => (
              <div key={l.name} className="flex items-center gap-5 px-4 py-3 hover:bg-elevated">
                <span className={cn("flex-1 truncate", !l.visible && "text-muted-foreground")}>
                  {l.name}
                </span>
                <button
                  type="button"
                  aria-label={`Activar capa ${l.name}`}
                  onClick={() => dispatch({ type: "setActiveLayer", name: l.name })}
                  className={cn(
                    "text-muted-foreground hover:text-foreground",
                    activeLayer === l.name && "text-link",
                  )}
                >
                  {activeLayer === l.name ? (
                    <CircleDot className="h-5 w-5" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </button>
                <button
                  type="button"
                  aria-label={`Visibilidad de ${l.name}`}
                  onClick={() => dispatch({ type: "toggleLayer", name: l.name })}
                  className="text-link hover:text-link-hover"
                >
                  {l.visible ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                </button>
                <button
                  type="button"
                  aria-label={`Bloquear ${l.name}`}
                  onClick={() => dispatch({ type: "toggleLayerLock", name: l.name })}
                  className="text-link hover:text-link-hover"
                >
                  {l.locked ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
                </button>
              </div>
            ))}
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="flex-1">Color de fondo</span>
              <label
                className="h-8 w-16 shrink-0 cursor-pointer rounded border border-separator"
                style={{
                  backgroundColor: `rgb(${(project.backgroundColor ?? "247;249;255").replace(/;/g, ",")})`,
                }}
              >
                <input
                  type="color"
                  className="sr-only"
                  onChange={(e) => {
                    const hex = e.target.value;
                    const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(";");
                    dispatch({ type: "setBackgroundColor", value: rgb });
                  }}
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
