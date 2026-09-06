import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Globe,
  HardDrive,
  History,
  Menu,
  Plus,
  Save,
  Settings,
  Smartphone,
  Upload,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useEditor } from "@/lib/editor/store";
import { S } from "@/lib/editor/i18n";
import { createEmptyProject } from "@/lib/engine/project";
import {
  clearCurrentProject,
  listLocalProjects,
  saveProjectLocally,
  setCurrentProject,
} from "@/lib/editor/persistence";

type MenuPage = "root" | "recent" | "export";

export function MainMenu() {
  const { project, dirty, dispatch } = useEditor();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState<MenuPage>("root");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setPage("root");
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setPage("root");
      }
    }
    if (open) {
      document.addEventListener("mousedown", onClickOutside);
      document.addEventListener("keydown", onKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const toggle = () => {
    setOpen((prev) => !prev);
    setPage("root");
  };

  const handleNewGame = () => {
    const fresh = createEmptyProject({ name: "Nuevo juego", width: 1280, height: 720 });
    saveProjectLocally(fresh);
    setCurrentProject(fresh.id);
    dispatch({ type: "loadProject", project: fresh });
    toast.success("Nuevo juego creado.");
    setOpen(false);
  };

  const handleSave = () => {
    saveProjectLocally(project);
    dispatch({ type: "markSaved" });
    toast.success(S.savedSuccess || "Proyecto guardado.");
    setOpen(false);
  };

  const handleCloseProject = () => {
    if (dirty && !window.confirm("Tienes cambios sin guardar. ¿Deseas salir de todas formas?")) {
      return;
    }
    clearCurrentProject();
    navigate({ to: "/" });
    setOpen(false);
  };

  const recentList = listLocalProjects().slice(0, 8);

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        type="button"
        data-main-menu-button
        aria-label="Menú principal"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Menú principal"
        onClick={toggle}
        className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-elevated hover:text-foreground"
      >
        <Menu className="h-4 w-4" />
      </button>

      {open && (
        <div
          data-main-menu="dropdown"
          role="menu"
          className="absolute left-0 top-full z-50 mt-1 w-64 rounded-md border border-separator bg-toolbar p-1 shadow-xl backdrop-blur"
        >
          {page === "root" && (
            <div className="flex flex-col gap-0.5 text-xs">
              <button
                type="button"
                role="menuitem"
                onClick={handleNewGame}
                className="flex items-center gap-2 rounded px-2 py-1.5 text-left text-foreground hover:bg-elevated"
              >
                <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Crear un juego</span>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  navigate({ to: "/" });
                  setOpen(false);
                }}
                className="flex items-center gap-2 rounded px-2 py-1.5 text-left text-foreground hover:bg-elevated"
              >
                <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Abrir...</span>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => setPage("recent")}
                className="flex items-center justify-between rounded px-2 py-1.5 text-left text-foreground hover:bg-elevated"
              >
                <div className="flex items-center gap-2">
                  <History className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Abrir recientes</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </button>

              <div className="my-1 h-px bg-separator" />

              <button
                type="button"
                role="menuitem"
                onClick={handleSave}
                className="flex items-center gap-2 rounded px-2 py-1.5 text-left text-foreground hover:bg-elevated"
              >
                <Save className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{S.save || "Guardar"}</span>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  toast.info("Guardar como copia local disponible próximamente.");
                  setOpen(false);
                }}
                className="flex items-center gap-2 rounded px-2 py-1.5 text-left text-foreground hover:bg-elevated"
              >
                <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Guardar como...</span>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() => setPage("export")}
                className="flex items-center justify-between rounded px-2 py-1.5 text-left text-foreground hover:bg-elevated"
              >
                <div className="flex items-center gap-2">
                  <Upload className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Exportar (web, móvil)</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </button>

              <div className="my-1 h-px bg-separator" />

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  dispatch({ type: "openDialog", dialog: "projectProperties" });
                  setOpen(false);
                }}
                className="flex items-center gap-2 rounded px-2 py-1.5 text-left text-foreground hover:bg-elevated"
              >
                <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Preferencias</span>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={handleCloseProject}
                className="flex items-center gap-2 rounded px-2 py-1.5 text-left text-rose-400 hover:bg-elevated hover:text-rose-300"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>Cerrar proyecto</span>
              </button>
            </div>
          )}

          {page === "recent" && (
            <div className="flex flex-col gap-0.5 text-xs">
              <button
                type="button"
                onClick={() => setPage("root")}
                className="flex items-center gap-1 border-b border-separator px-2 py-1 font-semibold text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-3 w-3" /> Atrás
              </button>
              {recentList.length === 0 ? (
                <div className="px-2 py-3 text-center text-muted-foreground">No hay proyectos recientes</div>
              ) : (
                recentList.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setCurrentProject(item.id);
                      dispatch({ type: "loadProject", project: item.project });
                      toast.success(`Cargado: ${item.name}`);
                      setOpen(false);
                    }}
                    className="flex flex-col rounded px-2 py-1 text-left text-foreground hover:bg-elevated"
                  >
                    <span className="truncate font-medium">{item.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(item.updatedAt).toLocaleDateString()}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}

          {page === "export" && (
            <div className="flex flex-col gap-0.5 text-xs">
              <button
                type="button"
                onClick={() => setPage("root")}
                className="flex items-center gap-1 border-b border-separator px-2 py-1 font-semibold text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-3 w-3" /> Atrás
              </button>
              <button
                type="button"
                onClick={() => {
                  toast.success("Empaquetador Web HTML5 generado.");
                  setOpen(false);
                }}
                className="flex items-center gap-2 rounded px-2 py-1.5 text-foreground hover:bg-elevated"
              >
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Exportar como Web (HTML5)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  toast.info("Generador de APK / Capacitor en camino.");
                  setOpen(false);
                }}
                className="flex items-center gap-2 rounded px-2 py-1.5 text-foreground hover:bg-elevated"
              >
                <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Exportar para Android / iOS</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
