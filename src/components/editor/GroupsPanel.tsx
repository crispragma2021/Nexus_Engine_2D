import * as React from "react";
import { Search, Plus, Group, ChevronDown, ChevronRight } from "lucide-react";

interface SectionProps {
  title: string;
  onAdd?: () => void;
  addLabel?: string;
  children: React.ReactNode;
}

function Section({ title, onAdd, addLabel, children }: SectionProps) {
  const [open, setOpen] = React.useState(true);
  return (
    <div className="border-b border-separator/60">
      <div className="flex items-center gap-1 px-2 py-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1 text-[15px] font-bold text-foreground"
        >
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          {title}
        </button>
        {onAdd ? (
          <button
            type="button"
            aria-label={addLabel ?? `Añadir a ${title}`}
            onClick={onAdd}
            className="ml-auto rounded p-1.5 text-foreground hover:bg-elevated"
          >
            <Plus className="h-5 w-5" />
          </button>
        ) : null}
      </div>
      {open ? <div className="pb-2 pl-7 pr-2">{children}</div> : null}
    </div>
  );
}

export function GroupsPanel() {
  const [query, setQuery] = React.useState("");
  const [groups, setGroups] = React.useState<string[]>(["Enemigos", "Coleccionables"]);

  const list = groups.filter((g) => g.toLowerCase().includes(query.toLowerCase()));

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-separator bg-toolbar">
      <div className="px-3 pb-1 pt-2 text-[15px] font-bold text-foreground md:text-[11px] md:font-semibold md:uppercase md:tracking-wide md:text-muted-foreground">
        Grupos de objetos
      </div>
      <div className="p-2">
        <div className="flex items-center gap-2 rounded bg-elevated px-3 py-2.5 md:py-1.5">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar grupos de objetos"
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-muted-foreground md:text-[12.5px]"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <Section title="Grupos globales">
          <p className="text-[14px] text-muted-foreground md:text-[12.5px]">
            Todavía no hay ningún grupo global.
          </p>
        </Section>
        <Section
          title="Grupos de Escenas"
          addLabel="Añadir un grupo"
          onAdd={() => setGroups((g) => [...g, `Grupo ${g.length + 1}`])}
        >
          {list.length === 0 ? (
            <p className="text-[14px] text-muted-foreground md:text-[12.5px]">
              Empezar añadiendo un nuevo grupo.
            </p>
          ) : (
            list.map((g) => (
              <div
                key={g}
                className="flex items-center gap-2 rounded px-1 py-2 text-[14px] text-foreground hover:bg-elevated md:py-1.5 md:text-[12.5px]"
              >
                <Group className="h-4 w-4 text-link" /> {g}
              </div>
            ))
          )}
        </Section>
      </div>
    </aside>
  );
}
