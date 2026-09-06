import * as React from "react";
import { useRouterState, useNavigate } from "@tanstack/react-router";
import {
  FilePlus2,
  FolderOpen,
  History,
  LogOut,
  Menu,
  Save,
  SaveAll,
  Settings,
  Share2,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useEditor } from "@/lib/editor/store";
import { toast } from "sonner";
import { saveProjectEverywhere } from "@/lib/projects/save";
import {
  clearCurrentProject,
  listLocalProjects,
  saveLocalProject,
  setCurrentProject,
  type LocalProject,
} from "@/lib/projects/local";
import { createEmptyProject } from "@/lib/editor/scenes";
import { cn } from "@/lib/utils";

export function MainMenu() {
  const [open, setOpen] = React.useState(false);
  const [showRecents, setShowRecents] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const { project, dispatch } = useEditor();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const isEditor = routerState.location.pathname.startsWith("/editor");
  const projectName = project?.name || "Proyecto";

  const recents = React.useMemo(() => {
    if (!open || !showRecents) return [];
    return listLocalProjects().slice(0, 8);
  }, [open, showRecents]);

  const closeMenu = () => {
    setOpen(false);
    setShowRecents(false);
  };

  const onSave = async () => {
    setSaving(true);
    try {
      await saveProjectEverywhere(project);
      dispatch({ type: "markSaved" });
      toast.success("Proyecto guardado en este dispositivo");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el proyecto.");
    } finally {
      setSaving(false);
    }
  };

  const onNewGame = () => {
    const next = createEmptyProject({
      name: "Nuevo juego",
      windowWidth: 1280,
      windowHeight: 720,
    });
    try {
      const saved = saveLocalProject({ name: next.name, project: next });
      setCurrentProject({ id: saved.id, project: next });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear el proyecto.");
      return;
    }
    dispatch({ type: "loadProject", project: next });
    toast.success(`Creado «${next.name}»`);
    closeMenu();
  };

  const openRecent = (entry: LocalProject) => {
    setCurrentProject({ id: entry.id, project: entry.project });
    dispatch({ type: "loadProject", project: entry.project });
    toast.success(`Abierto «${entry.name}»`);
    closeMenu();
  };

  const onCloseProject = () => {
    try {
      clearCurrentProject();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cerrar el proyecto.");
      return;
    }
    closeMenu();
    void navigate({ to: "/" });
  };

  const openShare = (tab: "publish" | "invite") => {
    dispatch({ type: "openDialog", dialog: { name: "share", tab } });
    closeMenu();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-[#d1d1d6] hover:bg-[#32323B] hover:text-white transition-colors"
        title="Menú principal"
        aria-label="Menú principal"
      >
        <Menu className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={closeMenu}
          />

          <div className="relative flex w-72 flex-col bg-[#1C1C24] text-white shadow-2xl border-r border-[#2C2C38] animate-in slide-in-from-left duration-200">
            <div className="flex h-12 items-center justify-between border-b border-[#2C2C38] px-4">
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  void navigate({ to: "/" });
                }}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#8E8E9A] hover:text-white transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Atrás</span>
              </button>
              <button
                type="button"
                onClick={closeMenu}
                className="rounded p-1 text-[#8E8E9A] hover:bg-[#2C2C38] hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-2 text-xs font-medium">
              <button
                type="button"
                onClick={onNewGame}
                className="flex w-full items-center gap-2.5 px-4 py-2 text-[#D2D2D9] hover:bg-[#2A2A38] hover:text-white"
              >
                <FilePlus2 className="h-4 w-4 text-[#8E8E9A]" />
                <span>Crear un juego</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  navigate({ to: "/" });
                }}
                className="flex w-full items-center gap-2.5 px-4 py-2 text-[#D2D2D9] hover:bg-[#2A2A38] hover:text-white"
              >
                <FolderOpen className="h-4 w-4 text-[#8E8E9A]" />
                <span>Abrir...</span>
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowRecents(!showRecents)}
                  className="flex w-full items-center justify-between gap-2.5 px-4 py-2 text-[#D2D2D9] hover:bg-[#2A2A38] hover:text-white"
                >
                  <span className="flex items-center gap-2.5">
                    <History className="h-4 w-4 text-[#8E8E9A]" />
                    <span>Abrir recientes</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-[#8E8E9A]" />
                </button>

                {showRecents && (
                  <div className="bg-[#181820] py-1 border-y border-[#2C2C38]">
                    {recents.length === 0 ? (
                      <div className="px-6 py-1.5 text-[12px] text-[#8E8E9A] italic">
                        Sin recientes
                      </div>
                    ) : (
                      recents.map((entry) => (
                        <button
                          key={entry.id}
                          type="button"
                          onClick={() => openRecent(entry)}
                          className="flex w-full items-center gap-1.5 px-6 py-1.5 text-left text-[12px] text-[#D2D2D9] hover:bg-[#2A2A38] hover:text-white"
                        >
                          <span className="min-w-0 flex-1 truncate">{entry.name}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="my-1.5 border-t border-[#2C2C38]" />

              <button
                type="button"
                disabled={!isEditor}
                onClick={onSave}
                className={`flex w-full items-center gap-2.5 px-4 py-2 ${
                  isEditor ? "text-[#D2D2D9] hover:bg-[#2A2A38] hover:text-white" : "text-[#555562] cursor-not-allowed"
                }`}
              >
                <Save className="h-4 w-4 text-[#8E8E9A]" />
                <span>{saving ? "Guardando..." : "Guardar"}</span>
              </button>

              <button
                type="button"
                disabled={!isEditor}
                onClick={() => {
                  closeMenu();
                  toast.info("Para guardar una copia, usa Exportar como ZIP.");
                }}
                className={`flex w-full items-center gap-2.5 px-4 py-2 ${
                  isEditor ? "text-[#D2D2D9] hover:bg-[#2A2A38] hover:text-white" : "text-[#555562] cursor-not-allowed"
                }`}
              >
                <SaveAll className="h-4 w-4 text-[#8E8E9A]" />
                <span>Guardar como...</span>
              </button>

              <button
                type="button"
                disabled={!isEditor}
                onClick={() => {
                  closeMenu();
                  toast.info("El historial de versiones estará disponible pronto.");
                }}
                className={`flex w-full items-center gap-2.5 px-4 py-2 ${
                  isEditor ? "text-[#D2D2D9] hover:bg-[#2A2A38] hover:text-white" : "text-[#555562] cursor-not-allowed"
                }`}
              >
                <History className="h-4 w-4 text-[#8E8E9A]" />
                <span>Mostrar historial de versiones</span>
              </button>

              <div className="my-1.5 border-t border-[#2C2C38]" />

              <button
                type="button"
                disabled={!isEditor}
                onClick={() => openShare("invite")}
                className={`flex w-full items-center gap-2.5 px-4 py-2 ${
                  isEditor ? "text-[#D2D2D9] hover:bg-[#2A2A38] hover:text-white" : "text-[#555562] cursor-not-allowed"
                }`}
              >
                <Share2 className="h-4 w-4 text-[#8E8E9A]" />
                <span>Invitar colaboradores</span>
              </button>

              <button
                type="button"
                disabled={!isEditor}
                onClick={() => openShare("publish")}
                className={`flex w-full items-center gap-2.5 px-4 py-2 ${
                  isEditor ? "text-[#D2D2D9] hover:bg-[#2A2A38] hover:text-white" : "text-[#555562] cursor-not-allowed"
                }`}
              >
                <Share2 className="h-4 w-4 text-[#8E8E9A]" />
                <span>Exportar (web, móvil)</span>
              </button>

              <div className="my-1.5 border-t border-[#2C2C38]" />

              <button
                type="button"
                disabled={!isEditor}
                onClick={onCloseProject}
                className={`flex w-full items-center gap-2.5 px-4 py-2 ${
                  isEditor ? "text-[#D2D2D9] hover:bg-[#2A2A38] hover:text-white" : "text-[#555562] cursor-not-allowed"
                }`}
              >
                <LogOut className="h-4 w-4 text-[#8E8E9A]" />
                <span>Cerrar proyecto</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  dispatch({ type: "openDialog", dialog: { name: "projectProperties" } });
                }}
                className="flex w-full items-center gap-2.5 px-4 py-2 text-[#D2D2D9] hover:bg-[#2A2A38] hover:text-white"
              >
                <Settings className="h-4 w-4 text-[#8E8E9A]" />
                <span>Preferencias</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
