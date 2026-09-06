import * as React from "react";
import { X, Globe, Laptop, Smartphone, ChevronRight, Share2, Users } from "lucide-react";
import { toast } from "sonner";

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  initialTab?: "publish" | "invite";
}

export function ShareDialog({ open, onClose, initialTab = "publish" }: ShareDialogProps) {
  const [tab, setTab] = React.useState<"publish" | "invite">(initialTab);

  React.useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Fondo oscuro backdrop */}
      <div className="fixed inset-0 bg-black/75 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative z-10 flex h-[90vh] max-h-[640px] w-full max-w-[420px] flex-col rounded-xl border border-[#2E2E3C] bg-[#1E1E28] text-white shadow-2xl">
        {/* Encabezado */}
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-[#2C2C3A] px-4">
          <h2 className="text-base font-semibold text-white">Comparte</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-[#9E9EAA] hover:bg-[#2B2B3A] hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Pestañas: Publicar | Invitar */}
        <div className="p-3 pb-2 shrink-0">
          <div className="grid grid-cols-2 rounded-lg bg-[#14141C] p-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => setTab("publish")}
              className={`rounded-md py-2 transition-colors ${
                tab === "publish" ? "bg-[#2F2F3E] text-white shadow-xs font-semibold" : "text-[#8E8E9E] hover:text-white"
              }`}
            >
              Publicar
            </button>
            <button
              type="button"
              onClick={() => setTab("invite")}
              className={`rounded-md py-2 transition-colors ${
                tab === "invite" ? "bg-[#2F2F3E] text-white shadow-xs font-semibold" : "text-[#8E8E9E] hover:text-white"
              }`}
            >
              Invitar
            </button>
          </div>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
          {tab === "publish" ? (
            <>
              <div className="text-center">
                <h3 className="text-sm font-semibold text-white">Exporta tu juego</h3>
              </div>

              <div className="space-y-2.5">
                {/* gd.games */}
                <button
                  type="button"
                  onClick={() => toast.success("Generando enlace compartible en gd.games...")}
                  className="w-full text-left rounded-lg border border-[#2E2E3C] bg-[#242432] p-3 hover:bg-[#2B2B3C] transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-xs">G</span>
                      <span className="text-sm font-medium text-white">gd.games</span>
                      <span className="rounded bg-[#18392B] px-1.5 py-0.5 text-[10px] font-medium text-[#4ADE80] border border-[#22583F]">
                        El más fácil
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#8E8E9E] group-hover:text-white" />
                  </div>
                  <p className="mt-1.5 text-xs text-[#9E9EAA]">Genera un enlace compartible a tu juego.</p>
                </button>

                {/* Navegador */}
                <button
                  type="button"
                  onClick={() => toast.info("Generando paquete HTML5 / Web...")}
                  className="w-full text-left rounded-lg border border-[#2E2E3C] bg-[#242432] p-3 hover:bg-[#2B2B3C] transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-[#9E9EAA]" />
                      <span className="text-sm font-medium text-white">Navegador</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#8E8E9E] group-hover:text-white" />
                  </div>
                  <p className="mt-1.5 text-xs text-[#9E9EAA]">Portales de juego (Itch.io, Poki, CrazyGames...)</p>
                </button>

                {/* Escritorio */}
                <button
                  type="button"
                  onClick={() => toast.info("Exportación ejecutable para Escritorio")}
                  className="w-full text-left rounded-lg border border-[#2E2E3C] bg-[#242432] p-3 hover:bg-[#2B2B3C] transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Laptop className="h-4 w-4 text-[#9E9EAA]" />
                      <span className="text-sm font-medium text-white">Escritorio</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#8E8E9E] group-hover:text-white" />
                  </div>
                  <p className="mt-1.5 text-xs text-[#9E9EAA]">Windows, MacOS, Linux (Steam, MS Store...)</p>
                </button>

                {/* Android */}
                <button
                  type="button"
                  onClick={() => toast.info("Generando bundle Android (APK / AAB)")}
                  className="w-full text-left rounded-lg border border-[#2E2E3C] bg-[#242432] p-3 hover:bg-[#2B2B3C] transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-[#9E9EAA]" />
                      <span className="text-sm font-medium text-white">Android</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#8E8E9E] group-hover:text-white" />
                  </div>
                  <p className="mt-1.5 text-xs text-[#9E9EAA]">Google Play (u otras tiendas)</p>
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-3 py-2 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#2A2A38]">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h4 className="text-sm font-semibold text-white">Invitar colaboradores</h4>
              <p className="text-xs text-[#9E9EAA]">
                Comparte este proyecto para trabajar en tiempo real en la nube con tu equipo.
              </p>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  toast.success("Enlace de colaboración copiado");
                }}
                className="w-full rounded-md bg-primary py-2.5 text-xs font-semibold text-white hover:bg-primary/90 transition-colors"
              >
                Copiar enlace de colaboración
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex h-12 shrink-0 items-center justify-between border-t border-[#2C2C3A] px-4">
          <button
            type="button"
            onClick={() => toast.info("Historial de exportaciones")}
            className="text-xs font-medium text-[#C8C8D4] hover:text-white transition-colors"
          >
            Exportaciones
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-[#2B2B38] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#383848] transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
