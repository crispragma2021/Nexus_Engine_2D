import { ArrowRight, ThumbsUp, Shuffle, Coins } from "lucide-react";
import { RECOMMENDED, IN_DEVELOPMENT, TOP_GAMES, GENRES } from "@/lib/home/data";

export function PlayView() {
  return (
    <div className="h-full space-y-8 overflow-y-auto p-4 pb-8">
      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-foreground">Recomendados</h2>
          <button
            type="button"
            className="flex items-center gap-2 rounded-md border border-[#C9B6FC] px-3 py-2 text-sm font-semibold text-foreground"
          >
            Ver todo <ArrowRight className="size-4" />
          </button>
        </div>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
          {RECOMMENDED.map((g) => (
            <button key={g.id} type="button" className="w-64 shrink-0 text-left">
              <span
                className={`relative flex h-36 items-end rounded-lg bg-gradient-to-br p-3 ${g.gradient}`}
              >
                <span className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <ThumbsUp className="size-5" /> {g.rating}%
                </span>
              </span>
              <span className="mt-2 block text-sm text-foreground">{g.title}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-foreground">Juegos en desarrollo</h2>
        <p className="text-base text-muted-foreground">Envía comentarios, gana monedas</p>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
          {IN_DEVELOPMENT.map((g) => (
            <button key={g.id} type="button" className="w-56 shrink-0 text-left">
              <span
                className={`flex h-28 flex-col justify-between rounded-lg bg-gradient-to-br p-3 ${g.gradient}`}
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Coins className="size-4 text-[#FFBC57]" /> Gana créditos
                </span>
                <span className="text-base font-bold text-foreground">{g.title}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-foreground">¿Buscas algo?</h2>
        <div className="mt-4 flex gap-5 overflow-x-auto pb-2">
          {GENRES.map((g) => (
            <button key={g} type="button" className="w-20 shrink-0 text-center">
              <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                {g.slice(0, 1)}
              </span>
              <span className="mt-2 block text-sm text-foreground">{g}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-foreground">Top 5 de esta semana</h2>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
          {TOP_GAMES.map((g, i) => (
            <button key={g.id} type="button" className="w-56 shrink-0 text-left">
              <span
                className={`relative flex h-32 items-start rounded-lg bg-gradient-to-br p-3 ${g.gradient}`}
              >
                <span className="text-4xl font-black text-foreground">{i + 1}</span>
              </span>
              <span className="mt-2 block text-sm text-foreground">{g.title}</span>
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <ThumbsUp className="size-4" /> {g.rating}%
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-[#45D9A1] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-bold text-foreground">Encuentra tu próximo juego favorito</h3>
          <button
            type="button"
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            <Shuffle className="size-4" /> Juego aleatorio
          </button>
        </div>
      </section>
    </div>
  );
}
