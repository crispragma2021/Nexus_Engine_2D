import { EditorProvider, useEditor } from "@/lib/editor/store";
import { TopToolbar } from "./TopToolbar";
import { ProjectManagerDrawer } from "./ProjectManagerDrawer";
import { ObjectsPanel } from "./ObjectsPanel";
import { SceneCanvas } from "./SceneCanvas";
import { PropertiesPanel } from "./PropertiesPanel";
import { EventsEditor } from "./EventsEditor";
import { MobileBottomBar } from "./MobileBottomBar";
import { cn } from "@/lib/utils";

function Tabs() {
  const { ui, dispatch } = useEditor();
  return (
    <div className="flex h-10 shrink-0 items-end gap-0.5 border-b border-separator bg-toolbar px-2 md:h-8">
      {(["scene", "events"] as const).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => dispatch({ type: "ui", patch: { tab: t } })}
          className={cn(
            "rounded-t px-4 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors",
            ui.tab === t
              ? "bg-window text-foreground shadow-[inset_0_2px_0_var(--primary)]"
              : "text-muted-foreground hover:bg-elevated hover:text-foreground",
          )}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

function Body() {
  const { ui } = useEditor();
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-window">
      <TopToolbar />
      <Tabs />
      <div className="flex min-h-0 flex-1">
        {ui.tab === "scene" ? (
          <>
            {ui.showLeftPanel && (
              <div className="hidden md:contents">
                <ObjectsPanel />
              </div>
            )}
            <SceneCanvas />
            {ui.showRightPanel && (
              <div className="hidden md:contents">
                <PropertiesPanel />
              </div>
            )}
          </>
        ) : (
          <>
            {ui.showLeftPanel && (
              <div className="hidden md:contents">
                <ObjectsPanel />
              </div>
            )}
            <EventsEditor />
          </>
        )}
      </div>
      <MobileBottomBar />
      <ProjectManagerDrawer />
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
