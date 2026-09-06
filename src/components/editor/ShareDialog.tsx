import * as React from "react";
import { X, Globe, Laptop, Smartphone, ChevronRight, Share2, Users } from "lucide-react";
import { toast } from "sonner";
import { useEditor } from "@/lib/editor/store";
import { exportGameToZip } from "@/lib/editor/exportWeb";

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  initialTab?: "publish" | "invite";
}

export function ShareDialog({ open, onClose, initialTab = "publish" }: ShareDialogProps) {
  const { project } = useEditor();
  const [tab, setTab] = React.useState<"publish" | "invite">(initialTab);
  const [exporting, setExporting] = React.useState(false);

  React.useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const downloadZip = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const blob = await exportGameToZip(project);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${project.name || "nexus-game"}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("Paquete web exportado (ZIP)");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo exportar el juego.");
    } finally {
      setExporting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="flex flex-col w-full max-w-lg rounded-xl border border-[#323242] bg-[#1E1E28] text-[#E0E0E6] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh]">
        {/* Header */}
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-[#2C2C3A] px-4">
          <span className="font-semibold text-sm text-white">Comparte tu juego</span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[#8E8E9E] hover:bg-[#2C2C3A] hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-1 border-b border-[#2C2C3A] bg-[#181820] p-1.5 text-xs">
          <button
            type="button"
            onClick={() => setTab("publish")}
            className={`rounded-md py-2 transition-colors ${
              tab === "publish"
                ? "bg-[#2F2F3E] text-white shadow-xs font-semibold"
                : "text-[#8E8E9E] hover:text-white"
            }`}
          >
            Publicar
          </button>
          <button
            type="button"
            onClick={() => setTab("invite")}
            className={`rounded-md py-2 transition-colors ${
              tab === "invite"
                ? "bg-[#2F2F3E] text-white shadow-xs font-semibold"
                : "text-[#8E8E9E] hover:text-white"
            }`}
          >
            Invitar
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {tab === "publish" ? (
            <>
              {/* gd.games */}
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  toast.success("Enlace compartible listo");
                }}
                className="w-full text-left rounded-lg border border-[#2E2E3C] bg-[#242432] p-3 hover:bg-[#2B2B3C] transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-xs">
                      G
                    </span>
                    <span className="text-sm font-medium text-white">gd.games</span>
                    <span className="rounded bg-[#18392B] px-1.5 py-0.5 text-[10px] font-medium text-[#4ADE80] border border-[#22583F]">
                      El más fácil
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#8E8E9E] group-hover:text-white" />
                </div>
                <p className="mt-1.5 text-xs text-[#9E9EAA]">
                  Genera un enlace compartible a tu juego.
                </p>
              </button>

              {/* Navegador */}
              <button
                type="button"
                onClick={downloadZip}
                disabled={exporting}
                className="w-full text-left rounded-lg border border-[#2E2E3C] bg-[#242432] p-3 hover:bg-[#2B2B3C] transition-colors group disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-[#8E8E9E]" />
                    <span className="text-sm font-medium text-white">Navegador</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#8E8E9E] group-hover:text-white" />
                </div>
                <p className="mt-1.5 text-xs text-[#9E9EAA]">
                  Portales de juego (Itch.io, Poki, CrazyGames...)
                </p>
              </button>

              {/* Escritorio */}
              <button
                type="button"
                onClick={() => toast.info("Exportación de escritorio próximamente.")}
                className="w-full text-left rounded-lg border border-[#2E2E3C] bg-[#242432] p-3 hover:bg-[#2B2B3C] transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Laptop className="h-4 w-4 text-[#8E8E9E]" />
                    <span className="text-sm font-medium text-white">Escritorio</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#8E8E9E] group-hover:text-white" />
                </div>
                <p className="mt-1.5 text-xs text-[#9E9EAA]">
                  Windows, MacOS, Linux (Steam, MS Store...)
                </p>
              </button>

              {/* Android */}
              <button
                type="button"
                onClick={() => toast.info("Empaquetado Android disponible pronto.")}
                className="w-full text-left rounded-lg border border-[#2E2E3C] bg-[#242432] p-3 hover:bg-[#2B2B3C] transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-[#8E8E9E]" />
                    <span className="text-sm font-medium text-white">Android</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#8E8E9E] group-hover:text-white" />
                </div>
                <p className="mt-1.5 text-xs text-[#9E9EAA]">
                  Móviles y tabletas (Google Play Store...)
                </p>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2A2A38] text-[#8E8E9E]">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">Trabaja en equipo</h3>
                <p className="text-xs text-[#8E8E9E] max-w-xs mt-1">
                  Invita a colaboradores para editar escenas, scripts y recursos de forma compartida.
                </p>
              </div>
              <button
                type="button"
                onClick={() => toast.info("Gestión de equipos disponible en próxima actualización.")}
                className="rounded-md bg-[#7046EC] px-4 py-2 text-xs font-semibold text-white hover:bg-[#5E34D9] transition-colors"
              >
                Crear enlace de invitación
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex h-12 shrink-0 items-center justify-between border-t border-[#2C2C3A] px-4">
          <button
            type="button"
            onClick={downloadZip}
            disabled={exporting}
            className="text-xs font-medium text-[#C8C8D4] hover:text-white transition-colors disabled:opacity-50"
          >
            {exporting ? "Exportando..." : "Exportar como ZIP"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-[#2F2F3E] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#3B3B4E] transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
