import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus, ChevronLeft, ChevronDown, RefreshCw, X, Check } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { createEmptyProject } from "@/lib/editor/scenes";
import { saveLocalProject, setCurrentProject } from "@/lib/projects/local";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ADJECTIVES = ["Balmy", "Cosmic", "Silent", "Brave", "Frozen", "Golden", "Wild", "Neon"];
const NOUNS = ["Blade", "Rocket", "Forest", "Runner", "Comet", "Panda", "Circuit", "Echo"];

function randomName() {
  const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const n = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${a} ${n}`;
}

type ResolutionId = "portrait" | "landscape" | "fullhd" | "custom";

const RESOLUTIONS: Array<{ id: ResolutionId; label: string; sub?: string; w: number; h: number }> =
  [
    { id: "portrait", label: "Retrato móvil", sub: "720x1280", w: 720, h: 1280 },
    { id: "landscape", label: "Paisaje de escritorio y móvil", sub: "1280x720", w: 1280, h: 720 },
    { id: "fullhd", label: "Escritorio Full HD", sub: "1920x1080", w: 1920, h: 1080 },
    { id: "custom", label: "Personalizar tamaño", w: 800, h: 600 },
  ];

type StorageMode = "device" | "session";

const STORAGE_OPTIONS: Array<{ id: StorageMode; label: string }> = [
  { id: "device", label: "En este dispositivo" },
  { id: "session", label: "Abrir sin añadir a Mis proyectos" },
];

export function CreateGameDialog({ open, onOpenChange }: Props) {
  const [step, setStep] = useState<"pick" | "config">("pick");
  const [resolution, setResolution] = useState<ResolutionId>("landscape");
  const [customW, setCustomW] = useState("800");
  const [customH, setCustomH] = useState("600");
  const [projectName, setProjectName] = useState(randomName);
  const [storage, setStorage] = useState<StorageMode>("device");
  const [storageOpen, setStorageOpen] = useState(false);
  const [pixelArt, setPixelArt] = useState(false);
  const [creationError, setCreationError] = useState("");
  const navigate = useNavigate();

  const storageLabel = STORAGE_OPTIONS.find((option) => option.id === storage)?.label ?? "";

  const openEditor = () => {
    const preset = RESOLUTIONS.find((entry) => entry.id === resolution) ?? RESOLUTIONS[1]!;
    const width = resolution === "custom" ? Number(customW) : preset.w;
    const height = resolution === "custom" ? Number(customH) : preset.h;
    const project = createEmptyProject({
      name: projectName,
      windowWidth: width,
      windowHeight: height,
      pixelArt,
    });

    try {
      if (storage === "device") {
        const saved = saveLocalProject({ name: project.name, project });
        setCurrentProject({ id: saved.id, project });
      } else {
        setCurrentProject({ id: null, project });
      }
    } catch (error) {
      setCreationError(error instanceof Error ? error.message : "No se pudo crear el proyecto.");
      return;
    }

    setCreationError("");
    onOpenChange(false);
    setStep("pick");
    setProjectName(randomName());
    void navigate({ to: "/editor" });
  };

  const goConfig = () => {
    setCreationError("");
    setStep("config");
  };

  if (step === "config") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex h-[92vh] max-w-2xl flex-col gap-0 border-separator bg-window p-0">
          <div className="flex items-start justify-between px-5 pb-3 pt-5">
            <DialogTitle className="text-2xl font-bold text-foreground">
              Crear un nuevo juego
            </DialogTitle>
            <button
              type="button"
              aria-label="Cerrar"
              onClick={() => onOpenChange(false)}
              className="p-1 text-foreground"
            >
              <X className="size-6" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">
            <button
              type="button"
              onClick={() => setStep("pick")}
              className="flex items-center gap-2 py-2 text-base font-semibold text-foreground"
            >
              <ChevronLeft className="size-5" /> Atrás
            </button>

            <div className="mt-3 grid grid-cols-2 gap-3">
              {RESOLUTIONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setResolution(r.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border p-4 text-center",
                    resolution === r.id
                      ? "border-[#C9B6FC] bg-elevated"
                      : "border-separator bg-transparent",
                  )}
                >
                  <span
                    className={cn(
                      "block rounded border-2 border-muted-foreground",
                      r.id === "portrait" && "h-12 w-8",
                      r.id !== "portrait" && "h-8 w-14",
                      r.id === "custom" && "border-dashed",
                    )}
                    aria-hidden
                  />
                  <span className="text-sm font-medium text-foreground">{r.label}</span>
                  {r.id === "custom" ? (
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      W
                      <input
                        value={customW}
                        onChange={(e) => setCustomW(e.target.value)}
                        inputMode="numeric"
                        className="w-12 border-b border-separator bg-transparent text-center text-sm text-foreground outline-none"
                      />
                      H
                      <input
                        value={customH}
                        onChange={(e) => setCustomH(e.target.value)}
                        inputMode="numeric"
                        className="w-12 border-b border-separator bg-transparent text-center text-sm text-foreground outline-none"
                      />
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">{r.sub}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-5 flex items-end gap-2 rounded-t-md border-b-2 border-foreground bg-elevated px-3 py-2">
              <div className="flex-1">
                <span className="block text-xs text-muted-foreground">Nombre del proyecto</span>
                <input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-transparent text-lg text-foreground outline-none"
                />
              </div>
              <button
                type="button"
                aria-label="Generar nombre"
                onClick={() => setProjectName(randomName())}
                className="p-1 text-foreground"
              >
                <RefreshCw className="size-5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setStorageOpen(true)}
              className="mt-3 flex w-full items-end gap-2 rounded-t-md border-b-2 border-foreground bg-elevated px-3 py-2 text-left"
            >
              <span className="flex-1">
                <span className="block text-xs text-muted-foreground">
                  Dónde almacenar este proyecto
                </span>
                <span className="block text-lg text-foreground">{storageLabel}</span>
              </span>
              <ChevronDown className="size-5 text-foreground" />
            </button>

            <label className="mt-4 flex items-center gap-3 text-base text-foreground">
              <input
                type="checkbox"
                checked={pixelArt}
                onChange={(e) => setPixelArt(e.target.checked)}
                className="size-6 accent-primary"
              />
              Optimizar para Pixel Art
            </label>
            {creationError ? (
              <p
                role="alert"
                className="mt-3 rounded border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive"
              >
                {creationError}
              </p>
            ) : null}
          </div>

          <div className="flex justify-end gap-3 border-t border-separator px-5 py-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-md border border-separator px-5 py-2.5 text-sm font-semibold text-foreground active:bg-elevated"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={openEditor}
              className="rounded-md bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
            >
              Crear nuevo juego
            </button>
          </div>

          {storageOpen && (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 p-6"
              onClick={() => setStorageOpen(false)}
            >
              <div
                className="w-full max-w-md overflow-hidden rounded-2xl bg-[#F5F5F7]"
                onClick={(e) => e.stopPropagation()}
              >
                {STORAGE_OPTIONS.map((opt, i) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setStorage(opt.id);
                      setStorageOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 px-6 py-5 text-left text-xl text-[#1D1D26]",
                      i > 0 && "border-t border-black/10",
                    )}
                  >
                    <span className="flex-1">{opt.label}</span>
                    <span
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full border-2",
                        storage === opt.id ? "border-[#0B62D6]" : "border-[#1D1D26]",
                      )}
                    >
                      {storage === opt.id && (
                        <Check className="size-3.5 stroke-[3] text-[#0B62D6]" />
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[92vh] max-w-2xl flex-col gap-0 border-separator bg-window p-0">
        <DialogTitle className="px-5 pb-3 pt-5 text-2xl font-bold text-foreground">
          Crear un nuevo juego
        </DialogTitle>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">
          <div className="rounded-lg border border-[#C9B6FC]/60 bg-elevated p-4">
            <p className="text-sm font-semibold text-foreground">Proyecto 2D desde cero</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Elige la resolución y crea una escena vacía. La asistencia de IA se activa después,
              directamente sobre el lienzo con Ctrl/Cmd + K.
            </p>
          </div>

          <button
            type="button"
            onClick={goConfig}
            className="mt-5 flex h-36 w-48 flex-col items-center justify-center gap-2 rounded-lg border border-separator text-foreground active:bg-elevated"
          >
            <Plus className="size-7" />
            <span className="text-base">Proyecto 2D vacío</span>
          </button>
        </div>

        <div className="flex justify-end border-t border-separator px-5 py-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-md border border-separator px-5 py-2.5 text-sm font-semibold text-foreground active:bg-elevated"
          >
            Cancelar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
