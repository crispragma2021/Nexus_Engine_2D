import { useState } from "react";
import { ChevronLeft, ChevronDown, Home, Search, SlidersHorizontal, Coins } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { ASSET_PACKS, type AssetPack } from "@/lib/home/data";
import { cn } from "@/lib/utils";

type FilterKey = "kind" | "view" | "objectType";

const GROUPS: Array<{ key: FilterKey; title: string; options: string[] }> = [
  { key: "kind", title: "Tipo de paquete", options: ["Gratuito", "Premium", "Propio"] },
  {
    key: "view",
    title: "Área de visualización",
    options: ["Arriba-abajo", "Vista lateral", "Isométrico"],
  },
  {
    key: "objectType",
    title: "Tipo de objetos",
    options: ["Sprite", "Sprite en mosaico", "Panel de sprite", "Mapa de baldosas"],
  },
];

export function StoreView() {
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Record<FilterKey, string[]>>({
    kind: [],
    view: [],
    objectType: [],
  });
  const [pixelSize, setPixelSize] = useState([1, 16]);

  const toggle = (key: FilterKey, option: string) =>
    setSelected((s) => ({
      ...s,
      [key]: s[key].includes(option) ? s[key].filter((o) => o !== option) : [...s[key], option],
    }));

  const matches = (p: AssetPack) =>
    p.title.toLowerCase().includes(query.toLowerCase()) &&
    (selected.kind.length === 0 || selected.kind.includes(p.kind)) &&
    (selected.view.length === 0 || selected.view.includes(p.view)) &&
    (selected.objectType.length === 0 || selected.objectType.includes(p.objectType));

  const packs = ASSET_PACKS.filter(matches);
  const activeCount = Object.values(selected).flat().length;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-separator px-3 py-3">
        <button type="button" aria-label="Atrás" className="p-2 text-muted-foreground">
          <ChevronLeft className="size-5" />
        </button>
        <button type="button" aria-label="Inicio de la tienda" className="p-2 text-foreground">
          <Home className="size-5" />
        </button>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en la tienda"
            className="h-11 w-full rounded-md bg-elevated pl-11 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          aria-label="Filtros de objetos"
          className="relative p-2 text-foreground"
        >
          <SlidersHorizontal className="size-5" />
          {activeCount > 0 && (
            <span className="absolute right-0 top-0 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {packs.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No hay paquetes con esos filtros.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {packs.map((p) => (
              <article key={p.id} className="overflow-hidden rounded-lg border border-separator">
                <div className={`h-28 bg-gradient-to-br ${p.gradient}`} aria-hidden />
                <div className="space-y-1 p-3">
                  <h3 className="text-sm font-semibold text-foreground">{p.title}</h3>
                  <p className="text-xs text-muted-foreground">{p.author}</p>
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <Coins className="size-4 text-[#FFBC57]" />
                    {p.credits === 0 ? "Gratis" : p.credits}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="right" className="w-[85vw] max-w-md border-separator bg-window p-0">
          <SheetTitle className="sr-only">Filtros de objetos</SheetTitle>
          <div className="flex items-center gap-3 border-b border-separator px-4 py-4">
            <SlidersHorizontal className="size-5 text-foreground" />
            <span className="text-sm font-semibold uppercase tracking-wide text-foreground">
              Filtros de objetos
            </span>
          </div>
          <div className="h-[calc(100%-3.75rem)] space-y-4 overflow-y-auto p-4">
            {GROUPS.map((g) => (
              <section key={g.key} className="rounded-lg border border-separator bg-toolbar p-3">
                <button
                  type="button"
                  onClick={() => setCollapsed((c) => ({ ...c, [g.key]: !c[g.key] }))}
                  className="flex w-full items-center gap-2 py-1 text-left"
                >
                  <ChevronDown
                    className={cn(
                      "size-5 text-muted-foreground transition-transform",
                      collapsed[g.key] && "-rotate-90",
                    )}
                  />
                  <span className="text-base font-semibold text-foreground">{g.title}</span>
                </button>
                {!collapsed[g.key] && (
                  <ul className="mt-2 space-y-3 pl-2">
                    {g.options.map((o) => (
                      <li key={o} className="flex items-center gap-3">
                        <Checkbox
                          id={`${g.key}-${o}`}
                          checked={selected[g.key].includes(o)}
                          onCheckedChange={() => toggle(g.key, o)}
                          className="size-5"
                        />
                        <label htmlFor={`${g.key}-${o}`} className="text-base text-foreground">
                          {o}
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

            <section className="rounded-lg border border-separator bg-toolbar p-3">
              <p className="py-1 pl-7 text-base font-semibold text-foreground">Tamaño del píxel</p>
              <div className="px-4 py-6">
                <Slider value={pixelSize} onValueChange={setPixelSize} min={1} max={16} step={1} />
                <p className="mt-3 text-center text-sm text-muted-foreground">
                  {pixelSize[0]} – {pixelSize[1]} px
                </p>
              </div>
            </section>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
