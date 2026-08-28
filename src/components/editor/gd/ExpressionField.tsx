// Expression editor, the compact version of GDevelop's `InstructionEditor/ExpressionEditor`:
// a text field with a `abc ⇄ Σ` switch, because every instruction parameter in
// GDevelop accepts either a literal string or an expression.

import * as React from "react";
import { FunctionSquare, Type } from "lucide-react";
import { cn } from "@/lib/utils";

export type ParamKind =
  | "number"
  | "expression"
  | "string"
  | "yesno"
  | "choices"
  | "behavior"
  | "animation"
  | "sound"
  | "image"
  | "color"
  | "object"
  | "varobj"
  | "varscene"
  | "varglobal"
  | "textObject"
  | "layer"
  | "scene"
  | "key"
  | "button"
  | "operator"
  | "modop"
  | "modOperator"
  | "relation";

const EXPRESSION_KINDS: ParamKind[] = [
  "number",
  "expression",
  "string",
  "behavior",
  "animation",
  "sound",
  "image",
  "varobj",
  "textObject",
  "layer",
  "scene",
  "key",
  "relation",
];

export function ExpressionField({
  value,
  onChange,
  kind = "string",
  choices,
  choiceLabels,
  placeholder,
  autoFocus,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  kind?: ParamKind | undefined;
  choices?: readonly string[] | undefined;
  choiceLabels?: Record<string, string> | undefined;
  placeholder?: string | undefined;
  autoFocus?: boolean | undefined;
  error?: boolean | undefined;
}) {
  const canBeExpression = EXPRESSION_KINDS.includes(kind);
  // Anything that already looks like code is edited as an expression.
  const looksLikeExpression = /[()+*/"]|\b(Variable|Random|TimeDelta)\b/.test(value);
  const [expression, setExpression] = React.useState(
    canBeExpression && (kind !== "string" || looksLikeExpression),
  );

  React.useEffect(() => {
    if (kind === "number") setExpression(true);
  }, [kind]);

  if (choices && choices.length > 0) {
    return (
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "h-7 min-w-0 flex-1 rounded border border-separator bg-transparent px-1 text-[12.5px] text-foreground outline-none hover:bg-[#1D1D26] focus:border-[var(--brand-light)]",
          error && "border-[#FE6C46]",
        )}
      >
        {choices.map((choice) => (
          <option key={choice} value={choice} className="bg-[#25252E]">
            {choiceLabels?.[choice] ?? choice}
          </option>
        ))}
      </select>
    );
  }

  if (kind === "yesno") {
    return (
      <div className="flex h-7 items-center gap-1">
        {(["yes", "no"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cn(
              "h-6 rounded px-2 text-[12px]",
              value === option
                ? "bg-[var(--brand)] text-[#F6F2FF]"
                : "text-text-secondary hover:bg-[#1D1D26]",
            )}
          >
            {option === "yes" ? "Sí" : "No"}
          </button>
        ))}
      </div>
    );
  }

  if (kind === "color") {
    const toHex = (raw: string) => {
      const [r = "0", g = "0", b = "0"] = raw.split(";");
      const n = (v: string) => Math.max(0, Math.min(255, Number(v) || 0));
      return `#${[n(r), n(g), n(b)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
    };
    return (
      <span className="flex min-w-0 flex-1 items-center gap-1">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="255;255;255"
          className={cn(
            "h-7 min-w-0 flex-1 rounded border border-separator bg-transparent px-1 text-[12.5px] tabular-nums text-foreground outline-none focus:border-[var(--brand-light)]",
            error && "border-[#FE6C46]",
          )}
        />
        <input
          type="color"
          value={toHex(value)}
          onChange={(event) => {
            const clean = event.target.value.replace("#", "");
            onChange([0, 2, 4].map((i) => parseInt(clean.slice(i, i + 2), 16)).join(";"));
          }}
          aria-label="Color"
          className="h-7 w-9 shrink-0 cursor-pointer rounded border border-separator bg-[#1D1D26] p-0.5"
        />
      </span>
    );
  }

  return (
    <span className="flex min-w-0 flex-1 items-stretch gap-1">
      <input
        autoFocus={autoFocus}
        value={value}
        placeholder={placeholder ?? (expression ? "Expresión" : "Texto")}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "h-7 min-w-0 flex-1 rounded border bg-[#1D1D26] px-1.5 font-mono text-[12.5px] text-foreground outline-none",
          expression ? "border-[#3E4452]" : "border-separator",
          "focus:border-[var(--brand-light)]",
          error && "border-[#FE6C46] bg-[rgba(254,108,70,0.15)]",
        )}
      />
      {canBeExpression ? (
        <button
          type="button"
          title={expression ? "Editar como texto" : "Editar como expresión"}
          aria-label={expression ? "Editar como texto" : "Editar como expresión"}
          onClick={() => setExpression((e) => !e)}
          className={cn(
            "grid h-7 w-7 shrink-0 place-items-center rounded border border-separator text-text-secondary hover:bg-[#1D1D26] hover:text-foreground",
            expression && "border-[var(--brand)] text-[var(--brand-light)]",
          )}
        >
          {expression ? (
            <FunctionSquare className="h-3.5 w-3.5" />
          ) : (
            <Type className="h-3.5 w-3.5" />
          )}
        </button>
      ) : null}
    </span>
  );
}
