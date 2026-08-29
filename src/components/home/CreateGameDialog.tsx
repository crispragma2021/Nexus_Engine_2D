import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Plus,
  Search,
  SendHorizonal,
  ArrowRight,
  Coins,
  ChevronLeft,
  ChevronDown,
  RefreshCw,
  X,
  Check,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { TEMPLATES } from "@/lib/home/data";
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

const STORAGE_OPTIONS = ["Nube de Gdevelop", "No guardes este proyecto ahora"];

export function CreateGameDialog({ open, onOpenChange }: Props) {
  const [query, setQuery] = useState("");
  const [prompt, setPrompt] = useState("");
  const [step, setStep] = useState<"pick" | "config">("pick");
  const [resolution, setResolution] = useState<ResolutionId>("landscape");
  const [customW, setCustomW] = useState("800");
  const [customH, setCustomH] = useState("600");
  const [projectName, setProjectName] = useState(randomName);
  const [storage, setStorage] = useState(STORAGE_OPTIONS[1]);
  const [storageOpen, setStorageOpen] = useState(false);
  const [pixelArt, setPixelArt] = useState(false);
  const navigate = useNavigate();

  const list = TEMPLATES.filter((t) => t.title.toLowerCase().includes(query.toLowerCase()));

  const openEditor = () => {
    onOpenChange(false);
    setStep("pick");
    void navigate({ to: "/editor" });
  };

  const goConfig = () => setStep("config");

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
                <span className="block text-lg text-foreground">{storage}</span>
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
                    key={opt}
                    type="button"
                    onClick={() => {
                      setStorage(opt);
                      setStorageOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 px-6 py-5 text-left text-xl text-[#1D1D26]",
                      i > 0 && "border-t border-black/10",
                    )}
                  >
                    <span className="flex-1">{opt}</span>
                    <span
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full border-2",
                        storage === opt ? "border-[#0B62D6]" : "border-[#1D1D26]",
                      )}
                    >
                      {storage === opt && <Check className="size-3.5 stroke-[3] text-[#0B62D6]" />}
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
          <div className="rounded-lg border border-[#FF8569]/60 bg-elevated p-3">
            <p className="mb-2 text-sm font-semibold text-foreground">¿Qué te gustaría crear?</p>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={2}
              placeholder="Comienza una plataforma simple con un jugador que puede moverse y saltar"
              className="w-full resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={goConfig}
                aria-label="Generar juego"
                className="rounded-md bg-[#32323B] p-2 text-muted-foreground active:bg-primary active:text-primary-foreground"
              >
                <SendHorizonal className="size-5" />
              </button>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-foreground">
              Continúa con la inteligencia humana
            </h3>
            <button
              type="button"
              className="flex shrink-0 items-center gap-2 rounded-md border border-separator px-3 py-2 text-sm font-semibold text-foreground"
            >
              Ver todo <ArrowRight className="size-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={goConfig}
            className="mt-3 flex h-36 w-48 flex-col items-center justify-center gap-2 rounded-lg border border-separator text-foreground active:bg-elevated"
          >
            <Plus className="size-7" />
            <span className="text-base">Proyecto vacío</span>
          </button>

          <h3 className="mt-8 text-lg font-bold text-foreground">Mezcla un juego existente</h3>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar ejemplos"
              className="h-11 w-full rounded-md bg-elevated pl-11 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            {list.map((t) => (
              <button key={t.id} type="button" onClick={goConfig} className="text-left">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <Coins className="size-4 text-[#FFBC57]" />
                  {t.credits}
                </span>
                <span
                  className={`mt-2 block h-28 rounded-lg bg-gradient-to-br ${t.gradient}`}
                  aria-hidden
                />
                <span className="mt-2 block text-sm text-foreground">{t.title}</span>
              </button>
            ))}
            {list.length === 0 && (
              <p className="col-span-2 py-8 text-center text-sm text-muted-foreground">
                No hay ejemplos que coincidan.
              </p>
            )}
          </div>
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
