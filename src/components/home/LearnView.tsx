import { ArrowRight } from "lucide-react";
import { COURSES } from "@/lib/home/data";

export function LearnView() {
  return (
    <div className="h-full overflow-y-auto pb-6">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#2A1550] to-[#120B22] px-4 py-6">
        <span className="inline-block rounded-full bg-elevated px-3 py-1.5 text-sm text-foreground">
          Comienza gratis
        </span>
        <div className="mt-4 flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold leading-tight text-foreground">
            Cursos oficiales de desarrollo de juegos
          </h1>
          <button
            type="button"
            className="flex shrink-0 items-center gap-2 rounded-md border border-separator px-3 py-2 text-sm font-semibold text-foreground"
          >
            Ver todo <ArrowRight className="size-4" />
          </button>
        </div>
        <p className="mt-3 text-base text-foreground/90">
          Inicia en la industria en auge de los juegos casuales. Mejora tus habilidades y conviértete
          en un profesional.
        </p>
      </section>

      <div className="grid gap-4 p-4 sm:grid-cols-2">
        {COURSES.map((c) => (
          <article key={c.id} className="overflow-hidden rounded-xl border border-separator bg-toolbar">
            <div
              className={`flex h-40 items-center justify-center bg-gradient-to-br ${c.gradient}`}
              aria-hidden
            >
              <span className="text-2xl font-black tracking-widest text-foreground/90">
                {c.title.split(" ")[0]?.toUpperCase()}
              </span>
            </div>
            <div className="space-y-3 p-4">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="size-2.5 rounded-full bg-[#6BAFFF]" /> Desarrollo de Juegos
              </p>
              <div className="flex items-center gap-3">
                <div className="h-1.5 flex-1 rounded-full bg-elevated">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(c.progress / c.total) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground">
                  {c.progress}/{c.total}
                </span>
              </div>
              <h2 className="text-lg font-bold text-foreground">{c.title}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{c.description}</p>
              <div className="flex items-center justify-between pt-1">
                <span className="rounded-full border border-[#45D9A1] px-3 py-1.5 text-sm text-foreground">
                  {c.level}
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {c.credits === 0 ? "Gratis" : `${c.credits} créditos`}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
