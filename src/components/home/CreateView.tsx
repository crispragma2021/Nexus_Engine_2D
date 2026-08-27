import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Coins, Plus, RefreshCw, SendHorizonal, X } from "lucide-react";
import { TEMPLATES } from "@/lib/home/data";

interface Props {
  onCreateGame: () => void;
}

export function CreateView({ onCreateGame }: Props) {
  const [askOpen, setAskOpen] = useState(true);
  const [prompt, setPrompt] = useState("");
  const navigate = useNavigate();

  return (
    <div className="h-full overflow-y-auto p-4 pb-8">
      {askOpen && (
        <section className="rounded-lg border border-[#FF8569]/60 bg-toolbar p-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="size-7 rounded-md bg-gradient-to-br from-[#7046EC] to-[#FF8569]" aria-hidden />
            <h2 className="flex-1 text-lg font-bold text-foreground">¿Qué te gustaría crear?</h2>
            <button
              type="button"
              onClick={() => setAskOpen(false)}
              aria-label="Cerrar sugerencia"
              className="p-1 text-muted-foreground"
            >
              <X className="size-5" />
            </button>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={2}
            placeholder="Comienza un juego de preguntas y respuestas con una pregunta y 4 respuestas"
            className="w-full resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onCreateGame}
              aria-label="Enviar idea"
              className="rounded-md bg-elevated p-2 text-muted-foreground"
            >
              <SendHorizonal className="size-5" />
            </button>
          </div>
        </section>
      )}

      <section className="mt-5 rounded-lg border border-separator bg-toolbar p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Cartera</h2>
          <span className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Coins className="size-5 text-[#FFBC57]" /> 0
          </span>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Coins className="size-9 shrink-0 text-[#FFBC57]" />
          <p className="flex-1 text-base text-foreground">Comparte tu juego y gana créditos.</p>
          <button
            type="button"
            className="flex shrink-0 items-center gap-2 rounded-md border border-separator px-3 py-2 text-sm font-semibold text-foreground"
          >
            <Coins className="size-4 text-[#FFBC57]" /> Gana 80
          </button>
        </div>
      </section>

      <div className="mt-7 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-3 text-2xl font-bold text-foreground">
          Juegos
          <RefreshCw className="size-5 text-muted-foreground" />
        </h2>
        <button
          type="button"
          onClick={onCreateGame}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-base font-semibold text-primary-foreground"
        >
          <Plus className="size-5" /> Crear
        </button>
      </div>

      <h3 className="mt-5 text-xl font-bold text-foreground">Mezcla un juego en 2 minutos</h3>
      <div className="mt-3 grid grid-cols-2 gap-4">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => void navigate({ to: "/editor" })}
            className="text-left"
          >
            <span className={`block h-28 rounded-lg bg-gradient-to-br ${t.gradient}`} aria-hidden />
            <span className="mt-2 block text-sm text-foreground">{t.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
