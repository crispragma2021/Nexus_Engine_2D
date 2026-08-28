// "Inicio" — the landing tab GDevelop shows for a project: recent scenes, quick
// actions, and the Nexus Engine identity (brand colors from `--brand`).

import * as React from "react";
import {
  BookOpen,
  Grid2x2,
  Image as ImageIcon,
  Layers,
  Play,
  Plus,
  Puzzle,
  Settings,
  Sparkles,
  Variable,
} from "lucide-react";
import { useEditor } from "@/lib/editor/store";
import { BRAND } from "@/lib/editor/brand";
import { S } from "@/lib/editor/i18n";
import { cn } from "@/lib/utils";
import { GdButton } from "./gd/kit";

export function HomeTab() {
  const { project, dispatch, scene } = useEditor();
  const settings = project.gameSettings;

  const cards = [
    {
      id: "scenes",
      icon: <Layers className="h-4 w-4" />,
      label: S.scenes,
      value: project.scenes.length,
      onClick: () => dispatch({ type: "addScene" }),
      action: S.addANewScene,
    },
    {
      id: "objects",
      icon: <Grid2x2 className="h-4 w-4" />,
      label: S.objects,
      value: project.scenes.reduce((total, entry) => total + entry.objects.length, 0),
      onClick: () => dispatch({ type: "openDialog", dialog: { name: "newObject" } }),
      action: S.addANewObject,
    },
    {
      id: "resources",
      icon: <ImageIcon className="h-4 w-4" />,
      label: S.resources,
      value: project.resources.length,
      onClick: () => dispatch({ type: "openDialog", dialog: { name: "resources" } }),
      action: S.addANewResource,
    },
    {
      id: "variables",
      icon: <Variable className="h-4 w-4" />,
      label: S.globalVariables,
      value: project.globalVariables.length,
      onClick: () =>
        dispatch({ type: "openDialog", dialog: { name: "variables", scope: "global" } }),
      action: S.addVariables,
    },
    {
      id: "extensions",
      icon: <Puzzle className="h-4 w-4" />,
      label: S.extensions,
      value: project.extensions.length,
      onClick: () => dispatch({ type: "openDialog", dialog: { name: "projectProperties" } }),
      action: S.install,
    },
    {
      id: "settings",
      icon: <Settings className="h-4 w-4" />,
      label: S.gameSettings,
      value: `${settings.windowWidth}×${settings.windowHeight}`,
      onClick: () => dispatch({ type: "openDialog", dialog: { name: "projectProperties" } }),
      action: S.gameSettings,
    },
  ];

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-window">
      <div className="mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-10">
        <div className="flex items-start gap-3">
          <span
            className="grid h-12 w-12 shrink-0 place-items-center rounded-lg text-[20px] font-black text-white shadow-[0_8px_24px_rgba(112,70,236,0.35)]"
            style={{ background: "linear-gradient(140deg, var(--brand), var(--brand-dark))" }}
            aria-hidden
          >
            N
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-[20px] font-semibold text-foreground">{project.name}</h1>
            <p className="mt-0.5 text-[12.5px] text-text-secondary">
              {BRAND.name} · {BRAND.tagline}
            </p>
          </div>
          <div className="ml-auto flex shrink-0 gap-2">
            <GdButton
              variant="raised"
              primary
              icon={<Play className="h-4 w-4 fill-current" />}
              onClick={() => dispatch({ type: "ui", patch: { previewOpen: true } })}
            >
              {S.preview}
            </GdButton>
          </div>
        </div>

        {settings.description ? (
          <p className="mt-3 max-w-2xl text-[12.5px] leading-relaxed text-text-secondary">
            {settings.description}
          </p>
        ) : null}

        <h2 className="mt-6 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
          {S.scenes}
        </h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {project.scenes.map((entry) => (
            <button
              key={entry.name}
              type="button"
              onClick={() =>
                dispatch({
                  type: "openTab",
                  tab: { kind: "scene", label: entry.name, sceneName: entry.name },
                })
              }
              className={cn(
                "group rounded-lg border border-separator bg-toolbar p-3 text-left hover:border-[var(--brand)]",
                entry.name === scene.name && "border-[var(--brand)]",
              )}
            >
              <span className="flex items-center gap-2">
                <Layers className="h-4 w-4 shrink-0 text-[#C9B6FC]" />
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">
                  {entry.name}
                </span>
                {entry.name === project.firstLayoutName ? (
                  <span className="shrink-0 rounded bg-[rgba(14,205,122,0.15)] px-1 text-[10px] text-success">
                    inicio
                  </span>
                ) : null}
              </span>
              <span className="mt-2 flex gap-2 text-[11px] text-text-secondary">
                <span>{entry.objects.length} objetos</span>
                <span>{entry.instances.length} instancias</span>
                <span>{entry.events.length} eventos</span>
                <span>{entry.layers.length} capas</span>
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => dispatch({ type: "addScene" })}
            className="flex min-h-[68px] items-center justify-center gap-1.5 rounded-lg border border-dashed border-separator p-3 text-[12.5px] text-text-secondary hover:border-[var(--brand)] hover:text-foreground"
          >
            <Plus className="h-4 w-4" /> {S.addANewScene}
          </button>
        </div>

        <h2 className="mt-6 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
          Proyecto
        </h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.id}
              className="rounded-lg border border-separator bg-toolbar p-3 hover:border-[var(--brand)]"
            >
              <span className="flex items-center gap-2 text-[12px] text-text-secondary">
                {card.icon}
                <span className="min-w-0 flex-1 truncate">{card.label}</span>
                <span className="shrink-0 text-[15px] font-semibold tabular-nums text-foreground">
                  {card.value}
                </span>
              </span>
              <button
                type="button"
                onClick={card.onClick}
                className="mt-2 flex items-center gap-1 text-[11.5px] text-link hover:text-link-hover"
              >
                <Plus className="h-3 w-3" /> {card.action}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2 rounded-lg border border-separator bg-toolbar p-3 text-[12px] text-text-secondary">
          <Sparkles className="h-4 w-4 shrink-0 text-[#FFBC57]" />
          Consejo: selecciona un objeto en la lista de la izquierda y arrástralo hasta la escena
          para crear una instancia; luego abre la hoja de{" "}
          <span className="text-foreground">{S.eventsTab}</span> para añadirle comportamiento.
          <a
            href="https://gdevelop.io/docs"
            target="_blank"
            rel="noreferrer"
            className="ml-auto flex items-center gap-1 text-link hover:text-link-hover"
          >
            <BookOpen className="h-3.5 w-3.5" /> Documentación
          </a>
        </div>
      </div>
    </div>
  );
}
