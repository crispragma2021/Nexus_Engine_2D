import * as React from "react";
import { useRouterState, useNavigate } from "@tanstack/react-router";
import { Menu, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useEditor } from "@/lib/editor/store";
import { toast } from "sonner";

export function MainMenu() {
  const [open, setOpen] = React.useState(false);
  const [showRecents, setShowRecents] = React.useState(false);
  const { project, dispatch } = useEditor();
  const navigate = useNavigate();
  const routerState = useRouterState();

  const isEditor = routerState.location.pathname.startsWith("/editor");
  const projectName = project?.name || "Proyecto";

  const closeMenu = () => {
    setOpen(false);
    setShowRecents(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-8 w-8 items-center justify-center rounded text-[#d1d1d6] hover:bg-[#32323B] hover:text-white transition-colors"
        title="Menú principal"
        aria-label="Menú principal"
      >
        <Menu className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-[1px]"
            onClick={closeMenu}
          />

          <div className="relative z-10 flex h-full w-[290px] max-w-[85vw] flex-col bg-[#1D1D26] text-[#E0E0E6] shadow-2xl border-r border-[#2C2C38]">
            {/* Encabezado contextual */}
            <div className="flex h-12 items-center justify-between border-b border-[#2C2C38] px-3.5">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <Menu className="h-4 w-4 shrink-0 text-[#A0A0AB]" />
                <span className="truncate text-[14px] font-semibold tracking-tight text-white">
                  {isEditor ? projectName : "Menú"}
                </span>
              </div>
              <button
                type="button"
                onClick={closeMenu}
                className="flex h-7 w-7 items-center justify-center rounded text-[#A0A0AB] hover:bg-[#2A2A38] hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Opciones */}
            <div className="flex-1 overflow-y-auto py-2 text-[13px]">
              {/* < Atrás solo se muestra dentro del editor */}
              {isEditor && (
                <button
                  type="button"
                  onClick={() => {
                    closeMenu();
                    navigate({ to: "/" });
                  }}
                  className="flex w-full items-center gap-1.5 px-4 py-2.5 font-medium text-white hover:bg-[#2A2A38] transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Atrás</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  navigate({ to: "/" });
                }}
                className="flex w-full items-center px-4 py-2 text-[#D2D2D9] hover:bg-[#2A2A38] hover:text-white"
              >
                Crear un juego
              </button>

              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  toast.info("Abrir proyecto...");
                }}
                className="flex w-full items-center px-4 py-2 text-[#D2D2D9] hover:bg-[#2A2A38] hover:text-white"
              >
                Abrir...
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowRecents(!showRecents)}
                  className="flex w-full items-center justify-between px-4 py-2 text-[#D2D2D9] hover:bg-[#2A2A38] hover:text-white"
                >
                  <span>Abrir recientes</span>
                  <ChevronRight className="h-4 w-4 text-[#8E8E9A]" />
                </button>
                {showRecents && (
                  <div className="bg-[#181820] py-1 border-y border-[#2C2C38]">
                    <div className="px-6 py-1.5 text-[12px] text-[#8E8E9A] italic">
                      {isEditor ? `${projectName} (actual)` : "Sin recientes"}
                    </div>
                  </div>
                )}
              </div>

              {/* Opciones activas solo en el editor */}
              <button
                type="button"
                disabled={!isEditor}
                onClick={() => {
                  closeMenu();
                  dispatch({ type: "markSaved" });
                  toast.success("Proyecto guardado");
                }}
                className={`flex w-full items-center px-4 py-2 ${
                  isEditor ? "text-[#D2D2D9] hover:bg-[#2A2A38] hover:text-white" : "text-[#555562] cursor-not-allowed"
                }`}
              >
                Guardar
              </button>

              <button
                type="button"
                disabled={!isEditor}
                onClick={() => {
                  closeMenu();
                  dispatch({ type: "markSaved" });
                  toast.success("Copia guardada");
                }}
                className={`flex w-full items-center px-4 py-2 ${
                  isEditor ? "text-[#D2D2D9] hover:bg-[#2A2A38] hover:text-white" : "text-[#555562] cursor-not-allowed"
                }`}
              >
                Guardar como...
              </button>

              <button
                type="button"
                disabled={!isEditor}
                onClick={() => {
                  closeMenu();
                  toast.info("Historial de versiones");
                }}
                className={`flex w-full items-center px-4 py-2 ${
                  isEditor ? "text-[#D2D2D9] hover:bg-[#2A2A38] hover:text-white" : "text-[#555562] cursor-not-allowed"
                }`}
              >
                Mostrar historial de versiones
              </button>

              <div className="my-1.5 border-t border-[#2C2C38]" />

              <button
                type="button"
                disabled={!isEditor}
                onClick={() => {
                  closeMenu();
                  toast.info("Invitar colaboradores");
                }}
                className={`flex w-full items-center px-4 py-2 ${
                  isEditor ? "text-[#D2D2D9] hover:bg-[#2A2A38] hover:text-white" : "text-[#555562] cursor-not-allowed"
                }`}
              >
                Invitar colaboradores
              </button>

              <button
                type="button"
                disabled={!isEditor}
                onClick={() => {
                  closeMenu();
                  toast.info("Opciones de exportación");
                }}
                className={`flex w-full items-center px-4 py-2 ${
                  isEditor ? "text-[#D2D2D9] hover:bg-[#2A2A38] hover:text-white" : "text-[#555562] cursor-not-allowed"
                }`}
              >
                Exportar (web, iOS, Android)...
              </button>

              <div className="my-1.5 border-t border-[#2C2C38]" />

              <button
                type="button"
                disabled={!isEditor}
                onClick={() => {
                  closeMenu();
                  navigate({ to: "/" });
                }}
                className={`flex w-full items-center px-4 py-2 ${
                  isEditor ? "text-[#D2D2D9] hover:bg-[#2A2A38] hover:text-white" : "text-[#555562] cursor-not-allowed"
                }`}
              >
                Cerrar proyecto
              </button>

              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  if (isEditor) {
                    dispatch({ type: "openDialog", dialog: { name: "projectProperties" } });
                  } else {
                    toast.info("Preferencias generales");
                  }
                }}
                className="flex w-full items-center px-4 py-2 text-[#D2D2D9] hover:bg-[#2A2A38] hover:text-white"
              >
                Preferencias
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
