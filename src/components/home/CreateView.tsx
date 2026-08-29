import { Coins, Plus, RefreshCw } from "lucide-react";
import { TEMPLATES } from "@/lib/home/data";
import { ProjectsSection } from "./ProjectsSection";

interface Props {
  onCreateGame: () => void;
}

export function CreateView({ onCreateGame }: Props) {
  return (
    <div className="h-full overflow-y-auto p-4 pb-8">
      <section className="rounded-lg border border-separator bg-toolbar p-4">
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

      <ProjectsSection />

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

      <h3 className="mt-5 text-xl font-bold text-foreground">Ideas para tu próximo juego 2D</h3>
      <div className="mt-3 grid grid-cols-2 gap-4">
        {TEMPLATES.map((t) => (
          <button key={t.id} type="button" onClick={onCreateGame} className="text-left">
            <span className={`block h-28 rounded-lg bg-gradient-to-br ${t.gradient}`} aria-hidden />
            <span className="mt-2 block text-sm text-foreground">{t.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
