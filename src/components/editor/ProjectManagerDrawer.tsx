// Project manager drawer — GDevelop's project tree: settings, scenes (open,
// rename, duplicate, delete), external layouts, external events, extensions and
// resources, all wired to the store.

import * as React from "react";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  FileCode2,
  Image as ImageIcon,
  Layers as LayersIcon,
  MoreVertical,
  Pencil,
  Plus,
  Puzzle,
  Search,
  Settings,
  Trash2,
  Variable,
  X,
} from "lucide-react";
import { useEditor } from "@/lib/editor/store";
import { S } from "@/lib/editor/i18n";
import { resolveAsset } from "@/lib/editor/catalog";
import { cn } from "@/lib/utils";
import { GdMenu, type MenuEntry } from "./gd/kit";

interface SectionProps {
  icon: React.ReactNode;
  label: string;
  children?: React.ReactNode;
  defaultOpen?: boolean;
  leaf?: boolean;
  action?: React.ReactNode;
}

function Section({ icon, label, children, defaultOpen, leaf, action }: SectionProps) {
  const [open, setOpen] = React.useState(!!defaultOpen);
  return (
    <div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => !leaf && setOpen((o) => !o)}
          className="flex min-w-0 flex-1 items-center gap-1.5 rounded px-2 py-1.5 text-left text-[13px] text-foreground hover:bg-elevated"
        >
          {leaf ? (
            <span className="w-3.5" />
          ) : open ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          <span className="shrink-0 text-link">{icon}</span>
          <span className="truncate">{label}</span>
        </button>
        {action}
      </div>
      {open && children ? (
        <div className="ml-5 border-l border-separator pl-2">{children}</div>
      ) : null}
    </div>
  );
}

export function ProjectManagerDrawer() {
  const { ui, project, dispatch, activeSceneName } = useEditor();
  const [query, setQuery] = React.useState("");
  const [menu, setMenu] = React.useState<{ x: number; y: number; scene: string } | null>(null);
  if (!ui.projectManagerOpen) return null;

  const close = () => dispatch({ type: "ui", patch: { projectManagerOpen: false } });
  const needle = query.trim().toLowerCase();
  const scenes = project.scenes.filter(
    (scene) => !needle || scene.name.toLowerCase().includes(needle),
  );
  const resources = project.resources.filter(
    (r) => !needle || r.name.toLowerCase().includes(needle),
  );

  const sceneEntries = (name: string): MenuEntry[] => [
    {
      id: "rename",
      label: S.renameScene,
      icon: <Pencil className="h-3.5 w-3.5" />,
      onSelect: () => {
        const next = window.prompt(S.renameScene, name);
        if (next && next !== name) dispatch({ type: "renameScene", from: name, to: next });
      },
    },
    {
      id: "duplicate",
      label: S.duplicateScene,
      onSelect: () => dispatch({ type: "duplicateScene", name }),
    },
    {
      id: "delete",
      label: S.removeScene,
      danger: true,
      icon: <Trash2 className="h-3.5 w-3.5" />,
      disabled: project.scenes.length <= 1,
      onSelect: () => {
        if (window.confirm(S.confirmRemoveScene)) dispatch({ type: "deleteScene", name });
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      <aside className="flex h-full w-[300px] flex-col border-r border-separator bg-toolbar shadow-2xl">
        <div className="flex h-11 shrink-0 items-center justify-between border-b border-separator px-3">
          <span className="truncate text-[13px] font-semibold">{S.projectManager}</span>
          <button
            type="button"
            aria-label={S.close}
            onClick={close}
            className="rounded p-1 text-muted-foreground hover:bg-elevated hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-separator p-2">
          <div className="flex items-center gap-2 rounded bg-search-bar px-2 py-1.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-text-secondary" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar en el proyecto"
              className="h-6 w-full min-w-0 bg-transparent text-[12.5px] outline-none placeholder:text-text-placeholder"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-1">
          <Section icon={<Settings className="h-4 w-4" />} label={S.gameSettings} leaf />
          <div className="-mt-1 mb-1 flex justify-end pr-1">
            <button
              type="button"
              onClick={() =>
                dispatch({ type: "openDialog", dialog: { name: "projectProperties" } })
              }
              className="rounded px-1.5 py-0.5 text-[11px] text-text-secondary hover:bg-elevated hover:text-foreground"
            >
              Abrir
            </button>
          </div>

          <Section
            icon={<LayersIcon className="h-4 w-4" />}
            label={S.scenes}
            defaultOpen
            action={
              <button
                type="button"
                aria-label={S.addANewScene}
                title={S.addANewScene}
                onClick={() => dispatch({ type: "addScene" })}
                className="mr-1 grid h-6 w-6 place-items-center rounded text-text-secondary hover:bg-elevated hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            }
          >
            {scenes.map((scene) => (
              <div
                key={scene.name}
                className={cn(
                  "group flex items-center gap-1 rounded px-2 py-1 text-[12.5px] hover:bg-elevated",
                  scene.name === activeSceneName && "bg-selection",
                )}
              >
                <button
                  type="button"
                  onClick={() =>
                    dispatch({
                      type: "openTab",
                      tab: { kind: "scene", label: scene.name, sceneName: scene.name },
                    })
                  }
                  className="min-w-0 flex-1 truncate text-left text-foreground"
                >
                  {scene.name}
                  {scene.name === project.firstLayoutName ? (
                    <span className="ml-1 text-[10px] text-success">★</span>
                  ) : null}
                </button>
                <button
                  type="button"
                  aria-label={`${S.options}: ${scene.name}`}
                  onClick={(event) => {
                    const rect = event.currentTarget.getBoundingClientRect();
                    setMenu({ x: rect.right - 170, y: rect.bottom + 2, scene: scene.name });
                  }}
                  className="shrink-0 rounded p-0.5 text-text-secondary opacity-0 hover:text-foreground group-hover:opacity-100"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </Section>

          <Section
            icon={<FileCode2 className="h-4 w-4" />}
            label={S.externalLayouts}
            action={
              <button
                type="button"
                aria-label={S.externalLayouts}
                onClick={() => dispatch({ type: "addExternalLayout" })}
                className="mr-1 grid h-6 w-6 place-items-center rounded text-text-secondary hover:bg-elevated hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            }
          >
            {project.externalLayouts.length === 0 ? (
              <p className="px-2 py-1 text-[12px] text-text-placeholder">Ninguno todavía.</p>
            ) : null}
            {project.externalLayouts.map((layout) => (
              <div key={layout.name} className="px-2 py-1 text-[12.5px] text-muted-foreground">
                {layout.name}
              </div>
            ))}
          </Section>

          <Section
            icon={<FileCode2 className="h-4 w-4" />}
            label={S.externalEvents}
            action={
              <button
                type="button"
                aria-label={S.externalEvents}
                onClick={() => dispatch({ type: "addExternalEvents" })}
                className="mr-1 grid h-6 w-6 place-items-center rounded text-text-secondary hover:bg-elevated hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            }
          >
            {project.externalEvents.length === 0 ? (
              <p className="px-2 py-1 text-[12px] text-text-placeholder">Ninguno todavía.</p>
            ) : null}
            {project.externalEvents.map((events) => (
              <div key={events.name} className="px-2 py-1 text-[12.5px] text-muted-foreground">
                {events.name}
              </div>
            ))}
          </Section>

          <Section
            icon={<Variable className="h-4 w-4" />}
            label={S.globalVariables}
            leaf
            action={
              <button
                type="button"
                aria-label={S.globalVariables}
                onClick={() =>
                  dispatch({ type: "openDialog", dialog: { name: "variables", scope: "global" } })
                }
                className="mr-1 grid h-6 w-6 place-items-center rounded text-text-secondary hover:bg-elevated hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            }
          />

          <Section icon={<Puzzle className="h-4 w-4" />} label={S.extensions} defaultOpen>
            {project.extensions.map((extension) => (
              <div
                key={extension.name}
                className="flex items-center gap-1 px-2 py-1 text-[12.5px] text-muted-foreground"
              >
                <span className="min-w-0 flex-1 truncate">{extension.name}</span>
                <span className="shrink-0 text-[10px]">v{extension.version ?? "1.0.0"}</span>
                <button
                  type="button"
                  aria-label={S.delete}
                  onClick={() => dispatch({ type: "uninstallExtension", name: extension.name })}
                  className="shrink-0 text-text-secondary hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                dispatch({ type: "openDialog", dialog: { name: "projectProperties" } })
              }
              className="flex items-center gap-1 px-2 py-1 text-[12.5px] text-link hover:text-link-hover"
            >
              <Plus className="h-3 w-3" /> {S.extensions}
            </button>
          </Section>

          <Section
            icon={<ImageIcon className="h-4 w-4" />}
            label={S.resources}
            defaultOpen
            action={
              <button
                type="button"
                aria-label={S.addANewResource}
                onClick={() => dispatch({ type: "openDialog", dialog: { name: "resources" } })}
                className="mr-1 grid h-6 w-6 place-items-center rounded text-text-secondary hover:bg-elevated hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            }
          >
            {resources.map((resource) => (
              <div
                key={resource.name}
                className="flex items-center gap-1.5 px-2 py-1 text-[12.5px] text-muted-foreground"
              >
                {resource.kind === "image" && resolveAsset(resource.file || resource.name) ? (
                  <img
                    src={resolveAsset(resource.file || resource.name)}
                    alt=""
                    className="h-4 w-4 shrink-0 bg-[#1D1D26] object-contain [image-rendering:pixelated]"
                  />
                ) : (
                  <ImageIcon className="h-3.5 w-3.5 shrink-0 text-link" />
                )}
                <span className="min-w-0 flex-1 truncate">{resource.name}</span>
              </div>
            ))}
            {resources.length === 0 ? (
              <p className="px-2 py-1 text-[12px] text-text-placeholder">{S.addANewResource}</p>
            ) : null}
          </Section>
        </div>

        <div className="flex shrink-0 items-center gap-1 border-t border-separator p-2 text-[11px] text-text-secondary">
          <Copy className="h-3.5 w-3.5" />
          {project.scenes.length} escenas · {project.resources.length} recursos ·{" "}
          {project.extensions.length} extensiones
        </div>
      </aside>
      <div className="flex-1 bg-black/50" onClick={close} />

      {menu ? (
        <GdMenu entries={sceneEntries(menu.scene)} anchor={menu} onClose={() => setMenu(null)} />
      ) : null}
    </div>
  );
}
