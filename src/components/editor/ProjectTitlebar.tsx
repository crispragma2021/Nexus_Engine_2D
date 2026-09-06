// Top row: closable document tabs + project identity, matching GDevelop's
// `MainFrame/TabsTitlebar.js` (28-32px row, active tab #494952, closable tabs,
// a "+" menu with the scenes and project tabs).

import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { MainMenu } from "./MainMenu";
import { ArrowLeft, Ellipsis, GripVertical, HelpCircle, Plus, Save, Settings, X } from "lucide-react";
import { useEditor } from "@/lib/editor/store";
import { S } from "@/lib/editor/i18n";
import { BRAND } from "@/lib/editor/brand";
import { saveProjectEverywhere } from "@/lib/projects/save";
import { cn } from "@/lib/utils";
import { GdMenu, type MenuEntry } from "./gd/kit";
import { NexusMark } from "@/components/brand/NexusLogo";

export function ProjectTitlebar() {
  const navigate = useNavigate();
  const { ui, dispatch, project, activeSceneName, dirty } = useEditor();
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    setSaving(true);
    try {
      const result = await saveProjectEverywhere(project);
      dispatch({ type: "markSaved" });
      if (result.local) window.alert?.("Guardado en este dispositivo");
    } catch (error) {
      window.alert?.(error instanceof Error ? error.message : "No se pudo guardar el proyecto.");
    } finally {
      setSaving(false);
    }
  };

  const plusEntries: MenuEntry[] = [
    ...project.scenes.map((scene) => ({
      id: `scene:${scene.name}`,
      label: scene.name,
      checked: scene.name === activeSceneName,
      onSelect: () =>
        dispatch({
          type: "openTab",
          tab: { kind: "scene", label: scene.name, sceneName: scene.name },
        }),
    })),
    { id: "sep-scenes", label: "", separatorBefore: true },
    {
      id: "add-scene",
      label: S.addANewScene,
      icon: <Plus className="h-3.5 w-3.5" />,
      onSelect: () => dispatch({ type: "addScene" }),
    },
    {
      id: "resources",
      label: S.resources,
      onSelect: () => dispatch({ type: "openDialog", dialog: { name: "resources" } }),
    },
    {
      id: "global-variables",
      label: S.globalVariables,
      onSelect: () =>
        dispatch({ type: "openDialog", dialog: { name: "variables", scope: "global" } }),
    },
    {
      id: "game-settings",
      label: S.gameSettings,
      onSelect: () => dispatch({ type: "openDialog", dialog: { name: "projectProperties" } }),
    },
    {
      id: "home",
      label: S.home,
      onSelect: () => dispatch({ type: "openTab", tab: { kind: "home", label: S.home } }),
    },
  ];

  return (
    <div className="flex h-8 shrink-0 items-stretch gap-0 overflow-hidden bg-toolbar pl-1 text-foreground">
      <MainMenu />
      <button
        type="button"
        data-editor-home-button
        aria-label={`${S.home} — Volver al Dashboard`}
        title={`${S.home} — Volver al Dashboard`}
        onClick={() => navigate({ to: "/" })}
        className="mr-1 flex shrink-0 items-center gap-1 rounded px-1.5 text-muted-foreground hover:bg-elevated hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden md:inline">{S.home}</span>
      </button>

      <button
        type="button"
        aria-label={S.projectManager}
        title={S.projectManager}
        onClick={() => dispatch({ type: "ui", patch: { projectManagerOpen: true } })}
        className="mr-1 flex w-9 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-elevated hover:text-foreground"
      >
        <Ellipsis className="h-4 w-4" />
      </button>

      <div className="flex min-w-0 flex-1 items-stretch gap-px overflow-x-auto [&::-webkit-scrollbar]:h-0">
        {ui.openedTabs.map((tab) => {
          const active = tab.id === ui.activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => dispatch({ type: "setActiveTab", id: tab.id })}
              className={cn(
                "group flex shrink-0 cursor-pointer items-center gap-1 rounded-t px-1 text-[12px] md:text-[12px]",
                active
                  ? "bg-tab text-[#f6f2ff]"
                  : "text-tab-inactive hover:bg-[#3c3c46] hover:text-foreground",
              )}
              style={{
                borderTop: active ? "1px solid #7f7f85" : "1px solid transparent",
                borderLeft: active ? "1px solid #7f7f85" : "1px solid transparent",
                borderRight: active ? "1px solid #7f7f85" : "1px solid transparent",
              }}
              title={tab.label}
            >
              <GripVertical className="ml-0.5 h-3 w-3 shrink-0 opacity-30" />
              {tab.kind === "home" ? <NexusMark className="h-4 w-4 rounded-sm" /> : null}
              <span className="max-w-40 truncate px-1 py-1.5">{tab.label}</span>
              {tab.kind !== "home" || project.scenes.length > 1 ? (
                <button
                  type="button"
                  aria-label="Cerrar pestaña"
                  onClick={(event) => {
                    event.stopPropagation();
                    dispatch({ type: "closeTab", id: tab.id });
                  }}
                  className={cn(
                    "grid h-5 w-5 place-items-center rounded-sm text-[#c9c9cd] opacity-0 hover:bg-[#25252e] group-hover:opacity-100",
                    active && "opacity-70",
                  )}
                >
                  <X className="h-3 w-3" />
                </button>
              ) : null}
            </div>
          );
        })}

        <button
          type="button"
          aria-label="Añadir pestaña"
          title="Añadir pestaña"
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            setMenu({ x: rect.left, y: rect.bottom + 2 });
          }}
          className="my-1 flex h-6 w-6 shrink-0 items-center justify-center self-start rounded text-muted-foreground hover:bg-elevated hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-1 px-1">
        <button
          type="button"
          onClick={() => void onSave()}
          title={S.save}
          aria-label={S.save}
          className="flex h-6 items-center gap-1 rounded px-1.5 text-[11px] text-muted-foreground hover:bg-elevated hover:text-foreground"
        >
          <Save className={cn("h-3.5 w-3.5", saving && "animate-pulse")} />
          <span className="hidden lg:inline">
            {dirty ? (
              <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#FFBC57] align-middle" />
            ) : null}
            {dirty ? "Sin guardar" : "Guardado"}
          </span>
        </button>
        <button
          type="button"
          title={S.gameSettings}
          aria-label={S.gameSettings}
          onClick={() => dispatch({ type: "openDialog", dialog: { name: "projectProperties" } })}
          className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:bg-elevated hover:text-foreground"
        >
          <Settings className="h-3.5 w-3.5" />
        </button>
        <a
          href="https://gdevelop.io"
          target="_blank"
          rel="noreferrer"
          title={`${BRAND.name} — ${BRAND.tagline}`}
          className="ml-1 hidden h-6 items-center gap-1 rounded px-1 text-[11px] text-muted-foreground hover:bg-elevated hover:text-foreground md:flex"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          {BRAND.name}
        </a>
      </div>

      {menu ? <GdMenu entries={plusEntries} anchor={menu} onClose={() => setMenu(null)} /> : null}
    </div>
  );
}
