// Editor shell — the layout of GDevelop's `MainFrame`: titlebar with closable
// tabs, the 40px toolbar, then [left column | workspace | right column]. The
// workspace switches between the scene editor and the events sheet of the active
// scene, exactly like GDevelop's per-scene "Escena / Eventos" tabs.

import { Layers, List, SlidersHorizontal } from "lucide-react";
import { EditorProvider, useEditor } from "@/lib/editor/store";
import { S } from "@/lib/editor/i18n";
import { cn } from "@/lib/utils";
import { ProjectTitlebar } from "./ProjectTitlebar";
import { TopToolbar } from "./TopToolbar";
import { ObjectsPanel } from "./ObjectsPanel";
import { LayersPanel } from "./LayersPanel";
import { InstancesPanel } from "./InstancesPanel";
import { GroupsPanel } from "./GroupsPanel";
import { SceneCanvas } from "./SceneCanvas";
import { PropertiesPanel } from "./PropertiesPanel";
import { EventsEditor } from "./EventsEditor";
import { HomeTab } from "./HomeTab";
import { MobileBottomBar } from "./MobileBottomBar";
import { NewObjectDialog } from "./NewObjectDialog";
import { ObjectEditorDialog } from "./ObjectEditorDialog";
import { BehaviorsDialog } from "./BehaviorsDialog";
import { EffectsListDialog } from "./EffectsListDialog";
import { ScenePropertiesDialog } from "./ScenePropertiesDialog";
import { ProjectPropertiesDialog, VariablesDialog } from "./ProjectPropertiesDialog";
import { InstructionSelectorDialog } from "./InstructionSelectorDialog";
import { PreviewDialog } from "./PreviewDialog";
import { ProjectManagerDrawer } from "./ProjectManagerDrawer";
import { InlineAiPrompt } from "./InlineAiPrompt";
import { QuickAutomationBar } from "./QuickAutomationBar";
import { useEditorShortcuts } from "./hooks/use-editor-shortcuts";
import * as React from "react";
import { toast } from "sonner";

/** Escena / Eventos switcher of the active scene tab. */
function SceneSubTabs() {
  const { ui, dispatch, scene, activeTabKind } = useEditor();
  if (activeTabKind !== "scene") return null;
  return (
    <div className="flex h-8 shrink-0 items-end gap-px border-b border-separator bg-[#32323B] px-2">
      {(
        [
          { id: "scene", label: S.sceneTab },
          { id: "events", label: S.eventsTab },
        ] as const
      ).map((entry) => (
        <button
          key={entry.id}
          type="button"
          onClick={() => dispatch({ type: "ui", patch: { tab: entry.id } })}
          className={cn(
            "flex h-7 items-center gap-1.5 rounded-t px-3 text-[11.5px] font-medium",
            ui.tab === entry.id
              ? "bg-window text-foreground"
              : "text-[#c9c9cd] hover:bg-[#3c3c46] hover:text-foreground",
          )}
        >
          {entry.label}
          {entry.id === "events" && scene.events.length > 0 ? (
            <span className="rounded bg-[rgba(0,0,0,0.3)] px-1 text-[10px] tabular-nums text-text-secondary">
              {scene.events.length}
            </span>
          ) : null}
        </button>
      ))}
      <div className="ml-auto flex items-center gap-1 pb-1 text-[11px] text-text-secondary">
        {scene.objects.length} {S.objects.toLowerCase()} · {scene.instances.length}{" "}
        {S.instances.toLowerCase()}
      </div>
    </div>
  );
}

function RightColumn() {
  const { ui, dispatch } = useEditor();
  const tabs = [
    { id: "properties", label: S.properties, icon: SlidersHorizontal },
    { id: "instances", label: S.instances, icon: List },
    { id: "layers", label: S.layers, icon: Layers },
  ] as const;

  return (
    <div className="hidden w-[318px] shrink-0 flex-col border-l border-separator bg-toolbar md:flex">
      <div className="flex h-8 shrink-0 items-center gap-px border-b border-separator bg-[#32323B] px-1">
        {tabs.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => dispatch({ type: "ui", patch: { rightTab: entry.id } })}
            className={cn(
              "flex h-7 flex-1 items-center justify-center gap-1 rounded px-1 text-[11px] font-medium",
              ui.rightTab === entry.id
                ? "bg-window text-foreground"
                : "text-[#c9c9cd] hover:bg-[#3c3c46] hover:text-foreground",
            )}
            title={entry.label}
          >
            <entry.icon className="h-3.5 w-3.5" />
            <span className="truncate">{entry.label}</span>
          </button>
        ))}
      </div>
      <PropertiesPanel />
      {ui.rightTab === "instances" && ui.showInstancesPanel ? <InstancesPanel /> : null}
      {ui.rightTab === "layers" && ui.showLayersPanel ? <LayersPanel /> : null}
    </div>
  );
}

function LeftColumn() {
  const { ui } = useEditor();
  return (
    <div className="hidden w-[236px] shrink-0 flex-col border-r border-separator bg-toolbar md:flex">
      <ObjectsPanel />
      {ui.showGroupsPanel ? <GroupsPanel /> : null}
    </div>
  );
}

function Workspace() {
  const { ui, dispatch, activeTabKind: kind } = useEditor();

  if (kind === "home") return <HomeTab />;
  if (kind === "gameSettings")
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 bg-window text-center">
        <p className="text-[13px] text-text-secondary">{S.gameSettings}</p>
        <button
          type="button"
          onClick={() => dispatch({ type: "openDialog", dialog: { name: "projectProperties" } })}
          className="rounded bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-foreground hover:bg-[#5C36D6]"
        >
          Abrir {S.gameSettings}
        </button>
      </div>
    );
  if (kind === "resources")
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 bg-window text-center">
        <p className="text-[13px] text-text-secondary">{S.resources}</p>
        <button
          type="button"
          onClick={() => dispatch({ type: "openDialog", dialog: { name: "resources" } })}
          className="rounded bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-foreground hover:bg-[#5C36D6]"
        >
          Abrir {S.resources}
        </button>
      </div>
    );

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <SceneSubTabs />
      <div className="flex min-h-0 flex-1">
        {ui.tab === "events" ? <EventsEditor /> : <SceneCanvas />}
      </div>
    </div>
  );
}

function InlineAiOverlay() {
  const { ui, dispatch, applyInlineAiPrompt } = useEditor();
  const session = ui.inlineAi;
  const close = React.useCallback(() => dispatch({ type: "closeInlineAi" }), [dispatch]);
  const apply = React.useCallback(
    async (prompt: string, targetName?: string) => {
      try {
        const summary = await applyInlineAiPrompt(prompt, targetName);
        toast.success(summary);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "No se pudo aplicar la edición con IA.",
        );
        throw error;
      }
    },
    [applyInlineAiPrompt],
  );

  if (!session) return null;
  return (
    <InlineAiPrompt
      x={session.x}
      y={session.y}
      {...(session.targetName ? { targetName: session.targetName } : {})}
      onApply={apply}
      onClose={close}
    />
  );
}

function Body() {
  const { ui } = useEditor();
  useEditorShortcuts();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-window text-foreground">
      <ProjectTitlebar />
      <TopToolbar />
      <main className="flex min-h-0 flex-1">
        {ui.showLeftPanel && ui.tab === "scene" ? <LeftColumn /> : <div />}
        <Workspace />
        {ui.showRightPanel ? <RightColumn /> : null}
      </main>
      <MobileBottomBar />
      <QuickAutomationBar />

      {/* dialogs */}
      <NewObjectDialog />
      <ObjectEditorDialog />
      <BehaviorsDialog />
      <EffectsListDialog />
      <ScenePropertiesDialog />
      <ProjectPropertiesDialog />
      <VariablesDialog />
      <InstructionSelectorDialog />
      <PreviewDialog />
      <ProjectManagerDrawer />
      <InlineAiOverlay />
    </div>
  );
}

export function EditorShell() {
  return (
    <EditorProvider>
      <Body />
    </EditorProvider>
  );
}
