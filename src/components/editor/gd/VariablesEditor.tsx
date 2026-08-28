// Variables editor — the rows of GDevelop's `VariablesList` (scene, global, object
// and instance variables all share it). Each row has the type icon, the name, the
// value editor for its type, an expander for structures/arrays and a delete button.

import * as React from "react";
import {
  Braces,
  Hash,
  ListTree,
  TextQuote,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Plus,
} from "lucide-react";
import type { GDVariable, GDVariableType } from "@/lib/editor/types";
import { S } from "@/lib/editor/i18n";
import { cn } from "@/lib/utils";
import { GdButton } from "./kit";

const TYPES: GDVariableType[] = ["number", "string", "boolean", "structure", "array"];

export const VARIABLE_LABEL: Record<GDVariableType, string> = {
  number: "Número",
  string: "Cadena",
  boolean: "Booleano",
  structure: "Estructura",
  array: "Array",
};

function TypeIcon({ type }: { type: GDVariableType }) {
  const className = "h-3.5 w-3.5 shrink-0";
  switch (type) {
    case "number":
      return <Hash className={cn(className, "text-[#0ECD7A]")} />;
    case "string":
      return <TextQuote className={cn(className, "text-[#E0D01F]")} />;
    case "boolean":
      return <ToggleRight className={cn(className, "text-[#A483FF]")} />;
    case "structure":
      return <Braces className={cn(className, "text-[#8AD6FF]")} />;
    case "array":
      return <ListTree className={cn(className, "text-[#FF85ED]")} />;
  }
}

export interface VariablesApi {
  variables: GDVariable[];
  add: (path: string[]) => void;
  update: (path: string[], patch: Partial<GDVariable>) => void;
  remove: (path: string[]) => void;
}

export function VariablesEditor({
  api,
  emptyLabel,
  className,
}: {
  api: VariablesApi;
  emptyLabel?: string;
  className?: string;
}) {
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});

  const renderRows = (list: GDVariable[], path: string[]) =>
    list.map((variable) => {
      const rowPath = [...path, variable.name];
      const key = rowPath.join(".");
      const isOpen = expanded[key] ?? variable.children.length > 0;
      const isContainer = variable.type === "structure" || variable.type === "array";
      return (
        <React.Fragment key={key}>
          <div
            className="flex items-center gap-1 py-[3px] pr-2 text-[12.5px]"
            style={{ paddingLeft: 6 + path.length * 14 }}
          >
            {isContainer ? (
              <button
                type="button"
                aria-label={isOpen ? "Contraer" : "Expandir"}
                aria-expanded={isOpen}
                onClick={() => setExpanded((state) => ({ ...state, [key]: !isOpen }))}
                className="grid h-5 w-5 shrink-0 place-items-center rounded text-text-secondary hover:bg-list-hover hover:text-foreground"
              >
                <span className="text-[10px]">{isOpen ? "▾" : "▸"}</span>
              </button>
            ) : (
              <span className="h-5 w-5 shrink-0" />
            )}
            <TypeIcon type={variable.type} />
            <input
              value={variable.name}
              aria-label={S.name}
              onChange={(event) => api.update(rowPath, { name: event.target.value })}
              className="h-6 w-28 shrink-0 rounded border border-transparent bg-transparent px-1 text-[12.5px] text-foreground outline-none hover:border-separator focus:border-[var(--brand-light)] focus:bg-[#1D1D26]"
            />
            <select
              value={variable.type}
              aria-label={S.type}
              onChange={(event) =>
                api.update(rowPath, { type: event.target.value as GDVariableType })
              }
              className="h-6 w-24 shrink-0 rounded border border-separator bg-transparent px-1 text-[11.5px] text-text-secondary outline-none focus:border-[var(--brand-light)]"
            >
              {TYPES.map((type) => (
                <option key={type} value={type} className="bg-[#25252E]">
                  {VARIABLE_LABEL[type]}
                </option>
              ))}
            </select>
            {variable.type === "boolean" ? (
              <button
                type="button"
                aria-label={S.value}
                onClick={() =>
                  api.update(rowPath, { value: variable.value === "true" ? "false" : "true" })
                }
                className="flex h-6 items-center gap-1 rounded px-1 text-[12px] text-foreground hover:bg-list-hover"
              >
                {variable.value === "true" ? (
                  <ToggleRight className="h-4 w-4 text-[#0ECD7A]" />
                ) : (
                  <ToggleLeft className="h-4 w-4 text-text-secondary" />
                )}
                {variable.value === "true" ? S.yes : S.no}
              </button>
            ) : isContainer ? (
              <span className="text-[11px] text-text-placeholder">
                {variable.children.length} elemento(s)
              </span>
            ) : (
              <input
                value={variable.value}
                aria-label={S.value}
                type={variable.type === "number" ? "number" : "text"}
                onChange={(event) => api.update(rowPath, { value: event.target.value })}
                className="h-6 min-w-0 flex-1 rounded border border-separator bg-[#1D1D26] px-1 text-[12.5px] tabular-nums text-foreground outline-none focus:border-[var(--brand-light)]"
              />
            )}
            {isContainer ? (
              <button
                type="button"
                aria-label={S.addVariables}
                title={S.addVariables}
                onClick={() => api.add(rowPath)}
                className="grid h-6 w-6 shrink-0 place-items-center rounded text-text-secondary hover:bg-list-hover hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            ) : null}
            <button
              type="button"
              aria-label={`${S.delete}: ${variable.name}`}
              onClick={() => api.remove(rowPath)}
              className="grid h-6 w-6 shrink-0 place-items-center rounded text-text-secondary hover:bg-list-hover hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          {isContainer && isOpen ? renderRows(variable.children, rowPath) : null}
        </React.Fragment>
      );
    });

  return (
    <div className={cn("pb-1", className)}>
      {api.variables.length === 0 ? (
        <p className="px-3 py-1.5 text-[12.5px] text-text-secondary">
          {emptyLabel ?? S.addYourFirstVariable}
        </p>
      ) : (
        renderRows(api.variables, [])
      )}
      <div className="px-2 py-1">
        <GdButton
          variant="raised"
          primary
          size="small"
          icon={<Plus className="h-3.5 w-3.5" />}
          onClick={() => api.add([])}
        >
          {S.addVariables}
        </GdButton>
      </div>
    </div>
  );
}
