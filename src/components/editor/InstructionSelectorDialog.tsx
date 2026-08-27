import * as React from "react";
import { Search, X } from "lucide-react";
import {
  INSTRUCTIONS,
  INSTRUCTION_CATEGORIES,
  type InstructionDef,
} from "@/lib/editor/instructions";
import { uid } from "@/lib/editor/data";
import { useEditor } from "@/lib/editor/store";
import { cn } from "@/lib/utils";

export function InstructionSelectorDialog({
  eventId,
  slot,
  onClose,
}: {
  eventId: string;
  slot: "conditions" | "actions";
  onClose: () => void;
}) {
  const { dispatch } = useEditor();
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<string>("All");
  const [picked, setPicked] = React.useState<InstructionDef | null>(null);
  const [params, setParams] = React.useState<Record<string, string>>({});

  const kind = slot === "conditions" ? "condition" : "action";
  const list = INSTRUCTIONS.filter(
    (i) =>
      i.kind === kind &&
      (category === "All" || i.category === category) &&
      (i.name.toLowerCase().includes(query.toLowerCase()) ||
        i.description.toLowerCase().includes(query.toLowerCase())),
  );

  const choose = (def: InstructionDef) => {
    setPicked(def);
    setParams(Object.fromEntries(def.parameters.map((p) => [p.name, p.defaultValue])));
  };

  const add = () => {
    if (!picked) return;
    dispatch({
      type: "addInstruction",
      eventId,
      slot,
      instruction: { id: uid("in"), typeId: picked.id, inverted: false, parameters: params },
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex h-[560px] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-separator bg-toolbar shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-separator px-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-foreground">
            {slot === "conditions" ? "Choose a condition" : "Choose an action"}
          </h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1">
          <div className="flex w-40 shrink-0 flex-col overflow-y-auto border-r border-separator py-1">
            {INSTRUCTION_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={cn(
                  "px-3 py-1 text-left text-[11px] text-muted-foreground hover:bg-elevated hover:text-foreground",
                  category === c && "bg-selection text-foreground",
                )}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center gap-2 border-b border-separator px-3 py-2">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="w-full bg-transparent text-[12px] text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
            <ul className="flex-1 overflow-y-auto py-1">
              {list.map((def) => (
                <li key={def.id}>
                  <button
                    type="button"
                    onClick={() => choose(def)}
                    className={cn(
                      "w-full px-3 py-1.5 text-left hover:bg-elevated",
                      picked?.id === def.id && "bg-selection",
                    )}
                  >
                    <div className="text-[12px] text-foreground">{def.name}</div>
                    <div className="truncate text-[11px] text-muted-foreground">
                      {def.description}
                    </div>
                  </button>
                </li>
              ))}
              {list.length === 0 && (
                <li className="px-3 py-2 text-[11px] text-muted-foreground">No results.</li>
              )}
            </ul>
          </div>

          <div className="flex w-64 shrink-0 flex-col overflow-y-auto border-l border-separator p-3">
            {picked ? (
              <>
                <div className="text-[12px] font-semibold text-foreground">{picked.name}</div>
                <p className="mb-2 text-[11px] text-muted-foreground">{picked.description}</p>
                {picked.parameters.map((p) => (
                  <label key={p.name} className="mb-2 block text-[11px]">
                    <span className="mb-1 block text-muted-foreground">{p.label}</span>
                    <input
                      value={params[p.name] ?? ""}
                      onChange={(e) => setParams((s) => ({ ...s, [p.name]: e.target.value }))}
                      className="h-6 w-full rounded border border-separator bg-window px-1.5 text-[11px] text-foreground outline-none focus:border-link"
                    />
                  </label>
                ))}
              </>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Select an item in the list to configure its parameters.
              </p>
            )}
          </div>
        </div>

        <div className="flex h-11 shrink-0 items-center justify-end gap-2 border-t border-separator px-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded px-3 py-1 text-[11px] uppercase tracking-wide text-muted-foreground hover:bg-elevated hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!picked}
            onClick={add}
            className="rounded bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground disabled:opacity-40"
          >
            Ok
          </button>
        </div>
      </div>
    </div>
  );
}
