// Effects list, the port of GDevelop's `EffectsList`: rows with the effect name,
// enable/disable + remove buttons, up/down reordering, and the parameter editor
// with its min/max slider. Used inline (properties panel) and as a dialog
// (object / instance / layer effects).

import * as React from "react";
import { ChevronDown, ChevronUp, Plus, RotateCcw, Trash2 } from "lucide-react";
import { EFFECTS, effectByTypeId } from "@/lib/editor/catalog";
import type { GDEffect } from "@/lib/editor/types";
import { S } from "@/lib/editor/i18n";
import { cn } from "@/lib/utils";
import { GdButton, GdDialog } from "./kit";
import { ExpressionField } from "./ExpressionField";

export interface EffectsApi {
  effects: GDEffect[];
  add: (effect: GDEffect) => void;
  update: (index: number, patch: Partial<GDEffect>) => void;
  remove: (index: number) => void;
  move: (index: number, direction: -1 | 1) => void;
}

const asNumber = (value: string | undefined, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export function EffectsList({
  api,
  compact,
  showAddButton = true,
}: {
  api: EffectsApi;
  compact?: boolean;
  showAddButton?: boolean;
}) {
  const [picking, setPicking] = React.useState(false);
  const [open, setOpen] = React.useState<number | null>(api.effects.length === 1 ? 0 : null);

  return (
    <div className={cn(compact ? "" : "px-2")}>
      {api.effects.length === 0 ? (
        <p className="px-2 py-2 text-[12.5px] text-text-secondary">Sin efectos en este objeto.</p>
      ) : null}

      {api.effects.map((effect, index) => {
        const definition = effectByTypeId(effect.type);
        const disabled = effect.parameters["disabled"] === "yes";
        const expanded = open === index;
        return (
          <div
            key={`${effect.type}-${index}`}
            className="my-1 overflow-hidden rounded border border-[#32323B] bg-[#25252E]"
          >
            <div className="flex items-center gap-1 px-2 py-1.5">
              <button
                type="button"
                aria-label={expanded ? "Contraer" : "Expandir"}
                onClick={() => setOpen(expanded ? null : index)}
                className="grid h-5 w-5 place-items-center rounded text-text-secondary hover:bg-[#32323B] hover:text-foreground"
              >
                {expanded ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronUp className="h-3.5 w-3.5" />
                )}
              </button>
              <EffectGlyph type={effect.type} />
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-[13px]",
                  disabled && "line-through opacity-60",
                )}
              >
                {effect.name || definition?.name || effect.type}
              </span>
              <button
                type="button"
                aria-label={disabled ? S.enable : S.disable}
                title={disabled ? S.enable : S.disable}
                onClick={() =>
                  api.update(index, {
                    parameters: { ...effect.parameters, disabled: disabled ? "no" : "yes" },
                  })
                }
                className={cn(
                  "h-6 rounded px-1.5 text-[11px]",
                  disabled
                    ? "text-[#FFBC57] hover:bg-[#32323B]"
                    : "text-[#0ECD7A] hover:bg-[#32323B]",
                )}
              >
                {disabled ? S.enable : S.visible}
              </button>
              <button
                type="button"
                aria-label="Subir"
                onClick={() => api.move(index, -1)}
                className="grid h-6 w-6 place-items-center rounded text-text-secondary hover:bg-[#32323B] hover:text-foreground"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="Bajar"
                onClick={() => api.move(index, 1)}
                className="grid h-6 w-6 place-items-center rounded text-text-secondary hover:bg-[#32323B] hover:text-foreground"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label={S.delete}
                onClick={() => api.remove(index)}
                className="grid h-6 w-6 place-items-center rounded text-text-secondary hover:bg-[#32323B] hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {expanded ? (
              <div className="border-t border-[#32323B] px-2 py-1.5">
                {definition && definition.parameters.length > 0 ? (
                  definition.parameters.map((parameter) => {
                    const value = effect.parameters[parameter.key] ?? parameter.value;
                    const isNumeric = /^[-\d.]*\d$/.test(String(value).trim());
                    return (
                      <label key={parameter.key} className="flex items-center gap-2 py-1">
                        <span
                          className="w-40 shrink-0 truncate text-[12px] text-text-secondary"
                          title={parameter.label}
                        >
                          {parameter.label}
                        </span>
                        <ExpressionField
                          value={String(value)}
                          kind={isNumeric ? "number" : "string"}
                          onChange={(next) =>
                            api.update(index, {
                              parameters: { ...effect.parameters, [parameter.key]: next },
                            })
                          }
                        />
                        {isNumeric ? (
                          <input
                            type="range"
                            min={0}
                            max={255}
                            value={asNumber(String(value), 0)}
                            onChange={(event) =>
                              api.update(index, {
                                parameters: {
                                  ...effect.parameters,
                                  [parameter.key]: event.target.value,
                                },
                              })
                            }
                            className="h-1 w-24 shrink-0 accent-[var(--brand)]"
                            aria-label={`${parameter.label} (slider)`}
                          />
                        ) : null}
                        <button
                          type="button"
                          title="Restablecer"
                          aria-label="Restablecer"
                          onClick={() =>
                            api.update(index, {
                              parameters: {
                                ...effect.parameters,
                                [parameter.key]: parameter.value,
                              },
                            })
                          }
                          className="grid h-6 w-6 shrink-0 place-items-center rounded text-text-secondary hover:bg-[#32323B] hover:text-foreground"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </button>
                      </label>
                    );
                  })
                ) : (
                  <p className="py-1 text-[12px] text-text-placeholder">
                    Este efecto no tiene parámetros configurables.
                  </p>
                )}
              </div>
            ) : null}
          </div>
        );
      })}

      {showAddButton ? (
        <GdButton
          variant="raised"
          className="my-2 w-full"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => setPicking(true)}
        >
          {S.addEffects}
        </GdButton>
      ) : null}

      <EffectPickerDialog open={picking} onClose={() => setPicking(false)} api={api} />
    </div>
  );
}

function EffectGlyph({ type }: { type: string }) {
  const definition = effectByTypeId(type);
  return (
    <span
      title={definition?.supported === false ? S.unsupportedEffect : undefined}
      className={cn(
        "h-3.5 w-3.5 shrink-0 rounded-sm",
        definition && !definition.supported ? "bg-[#FE6C46]" : "bg-[#A483FF]",
      )}
      aria-hidden
    />
  );
}

function EffectPickerDialog({
  open,
  onClose,
  api,
}: {
  open: boolean;
  onClose: () => void;
  api: EffectsApi;
}) {
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<string | null>(null);
  const filtered = EFFECTS.filter(
    (effect) =>
      !query ||
      effect.name.toLowerCase().includes(query.toLowerCase()) ||
      effect.typeId.toLowerCase().includes(query.toLowerCase()),
  );
  const current = filtered.find((effect) => effect.typeId === selected) ?? null;

  return (
    <GdDialog
      open={open}
      onClose={onClose}
      title={S.addEffects}
      width="max-w-2xl"
      footer={
        <>
          <GdButton onClick={onClose}>{S.cancel}</GdButton>
          <GdButton
            variant="raised"
            primary
            disabled={!current}
            onClick={() => {
              if (!current) return;
              const parameters: Record<string, string> = {};
              for (const parameter of current.parameters) {
                parameters[parameter.key] = parameter.value;
              }
              api.add({ type: current.typeId, name: current.name, parameters });
              setSelected(null);
              setQuery("");
              onClose();
            }}
          >
            {S.add}
          </GdButton>
        </>
      }
    >
      <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_240px]">
        <div className="border-b border-separator p-2 md:border-b-0 md:border-r">
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={S.searchExtensions}
            className="mb-2 h-8 w-full rounded bg-[#1D1D26] px-2 text-[12.5px] outline-none"
          />
          <div className="max-h-[45vh] overflow-y-auto">
            {filtered.map((effect) => (
              <button
                key={effect.typeId}
                type="button"
                onClick={() => setSelected(effect.typeId)}
                className={cn(
                  "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12.5px] hover:bg-list-hover",
                  selected === effect.typeId && "bg-selection",
                )}
              >
                <EffectGlyph type={effect.typeId} />
                <span className="min-w-0 flex-1 truncate">{effect.name}</span>
                {!effect.supported ? (
                  <span
                    title={S.unsupportedEffect}
                    className="shrink-0 rounded bg-[rgba(254,108,70,0.4)] px-1 text-[10px] text-[#FFB4A2]"
                  >
                    alpha
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
        <div className="p-3">
          {current ? (
            <>
              <h3 className="text-[13px] font-semibold">{current.name}</h3>
              <p className="mt-1 text-[11px] text-text-secondary">{current.typeId}</p>
              <p className="mt-2 text-[12px] leading-snug text-muted-foreground">
                {current.description}
              </p>
              <p className="mt-3 text-[11px] text-text-secondary">
                {current.parameters.length} parámetro(s)
              </p>
            </>
          ) : (
            <p className="text-[12px] text-text-placeholder">
              Selecciona un efecto de la lista para ver su descripción.
            </p>
          )}
        </div>
      </div>
    </GdDialog>
  );
}
