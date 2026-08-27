import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus, Search, SendHorizonal, ArrowRight, Coins } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { TEMPLATES } from "@/lib/home/data";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateGameDialog({ open, onOpenChange }: Props) {
  const [query, setQuery] = useState("");
  const [prompt, setPrompt] = useState("");
  const navigate = useNavigate();

  const list = TEMPLATES.filter((t) => t.title.toLowerCase().includes(query.toLowerCase()));

  const openEditor = () => {
    onOpenChange(false);
    void navigate({ to: "/editor" });
  };

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
                onClick={openEditor}
                aria-label="Generar juego"
                className="rounded-md bg-[#32323B] p-2 text-muted-foreground active:bg-primary active:text-primary-foreground"
              >
                <SendHorizonal className="size-5" />
              </button>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-foreground">Continúa con la inteligencia humana</h3>
            <button
              type="button"
              className="flex shrink-0 items-center gap-2 rounded-md border border-separator px-3 py-2 text-sm font-semibold text-foreground"
            >
              Ver todo <ArrowRight className="size-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={openEditor}
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
              <button
                key={t.id}
                type="button"
                onClick={openEditor}
                className="text-left"
              >
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
