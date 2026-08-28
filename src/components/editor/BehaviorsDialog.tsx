// Behaviors editor — GDevelop's `BehaviorsEditor`: the list of the behaviors
// installed on the object (with their property tables inline) and a picker that
// lists every behavior provided by the installed extensions.

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { useEditor } from "@/lib/editor/store";
import { BEHAVIORS, behaviorByTypeId } from "@/lib/editor/catalog";
import { newNameGenerator } from "@/lib/editor/ids";
import type { GDObjectBehavior } from "@/lib/editor/types";
import { S } from "@/lib/editor/i18n";
import { cn } from "@/lib/utils";
import { GdButton, GdDialog, SearchBar } from "./gd/kit";
import { BEHAVIOR_ICON, CatalogIcon } from "./gd/icons";

export function BehaviorsDialog() {
  const { scene, dispatch, ui } = useEditor();
  const objectId = ui.dialog?.name === "behaviors" ? ui.dialog.objectId : null;
  const object = objectId ? scene.objects.find((o) => o.id === objectId) : undefined;
  const [picking, setPicking] = React.useState(false);

  const close = () => dispatch({ type: "closeDialog" });
  if (!object || !objectId) return null;

  return (
    <>
      <GdDialog
        open
        onClose={close}
        title={`${S.behaviors} — ${object.name}`}
        width="max-w-3xl"
        helpPath="https://gdevelop.io/docs/getting-started/assets/behavior"
        footer={
          <>
            <GdButton
              variant="raised"
              primary
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setPicking(true)}
            >
              {S.addABehavior}
            </GdButton>
            <GdButton variant="raised" onClick={close}>
              {S.ok}
            </GdButton>
          </>
        }
      >
        <div className="p-2">
          {object.behaviors.length === 0 ? (
            <p className="px-1 py-2 text-[12.5px] text-text-secondary">{S.addYourFirstBehavior}</p>
          ) : null}
          {object.behaviors.map((behavior) => (
            <BehaviorCard
              key={behavior.name}
              objectId={objectId}
              behavior={behavior}
              onRemove={() =>
                dispatch({ type: "deleteBehavior", objectId, behaviorName: behavior.name })
              }
            />
          ))}
        </div>
      </GdDialog>

      <BehaviorTypePicker
        open={picking}
        onClose={() => setPicking(false)}
        onPick={(typeId) => {
          const definition = behaviorByTypeId(typeId);
          if (!definition) return;
          const properties: Record<string, string> = {};
          for (const property of definition.properties) properties[property.key] = property.value;
          dispatch({
            type: "addBehavior",
            objectId,
            behavior: {
              name: newNameGenerator(
                behaviorShortKey(definition.name),
                object.behaviors.map((b) => b.name),
              ),
              type: definition.typeId,
              properties,
            },
          });
          setPicking(false);
        }}
        installed={object.behaviors.map((behavior) => behavior.type)}
      />
    </>
  );
}

const behaviorShortKey = (name: string) =>
  name
    .replace(/[^\p{L}\p{N}]/gu, "")
    .slice(0, 18)
    .replace(/^./, (first) => first.toUpperCase());

function BehaviorCard({
  objectId,
  behavior,
  onRemove,
}: {
  objectId: string;
  behavior: GDObjectBehavior;
  onRemove: () => void;
}) {
  const { dispatch } = useEditor();
  const definition = behaviorByTypeId(behavior.type);
  const [open, setOpen] = React.useState(true);
  return (
    <div className="mb-2 overflow-hidden rounded border border-[#32323B] bg-[#25252E]">
      <div className="flex items-center gap-2 px-2 py-1.5">
        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? "Contraer" : "Expandir"}
          onClick={() => setOpen((value) => !value)}
          className="grid h-5 w-5 place-items-center rounded text-[11px] text-text-secondary hover:bg-list-hover"
        >
          {open ? "▾" : "▸"}
        </button>
        <CatalogIcon
          name={BEHAVIOR_ICON[behavior.type] ?? "puzzle"}
          className="h-4 w-4 shrink-0 text-[#8AD6FF]"
        />
        <input
          value={behavior.name}
          aria-label={S.name}
          onChange={(event) =>
            dispatch({
              type: "updateBehavior",
              objectId,
              behaviorName: behavior.name,
              patch: { name: event.target.value },
            })
          }
          className="h-7 w-40 rounded border border-transparent bg-transparent px-1 text-[13px] font-semibold outline-none hover:border-separator focus:border-[var(--brand-light)] focus:bg-[#1D1D26]"
        />
        <span className="min-w-0 flex-1 truncate text-[11px] text-text-secondary">
          {definition?.name ?? behavior.type}
        </span>
        <button
          type="button"
          aria-label={S.delete}
          onClick={onRemove}
          className="grid h-6 w-6 shrink-0 place-items-center rounded text-text-secondary hover:bg-list-hover hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {open ? (
        <div className="border-t border-[#32323B] px-2 py-1">
          {definition?.description ? (
            <p className="py-1 text-[11.5px] leading-snug text-text-secondary">
              {definition.description}
            </p>
          ) : null}
          {(definition?.properties ?? []).map((property) => {
            const current = behavior.properties[property.key] ?? property.value;
            return (
              <label key={property.key} className="flex items-center gap-2 py-1">
                <span
                  className="w-44 shrink-0 truncate text-[12px] text-text-secondary"
                  title={property.label}
                >
                  {property.label}
                </span>
                {property.type === "yesno" ? (
                  <span className="flex gap-1">
                    {["yes", "no"].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() =>
                          dispatch({
                            type: "updateBehavior",
                            objectId,
                            behaviorName: behavior.name,
                            patch: {
                              properties: { ...behavior.properties, [property.key]: option },
                            },
                          })
                        }
                        className={cn(
                          "h-6 rounded px-2 text-[12px]",
                          current === option
                            ? "bg-[var(--brand)] text-[#F6F2FF]"
                            : "text-text-secondary hover:bg-list-hover",
                        )}
                      >
                        {option === "yes" ? S.yes : S.no}
                      </button>
                    ))}
                  </span>
                ) : property.type === "choices" ? (
                  <select
                    value={current}
                    onChange={(event) =>
                      dispatch({
                        type: "updateBehavior",
                        objectId,
                        behaviorName: behavior.name,
                        patch: {
                          properties: {
                            ...behavior.properties,
                            [property.key]: event.target.value,
                          },
                        },
                      })
                    }
                    className="h-7 min-w-0 flex-1 rounded border border-separator bg-[#1D1D26] px-1 text-[12.5px] outline-none focus:border-[var(--brand-light)]"
                  >
                    {(property.choices ?? []).map((choice) => (
                      <option key={choice} value={choice}>
                        {choice}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={current}
                    type="text"
                    inputMode={property.type === "number" ? "decimal" : "text"}
                    onChange={(event) =>
                      dispatch({
                        type: "updateBehavior",
                        objectId,
                        behaviorName: behavior.name,
                        patch: {
                          properties: {
                            ...behavior.properties,
                            [property.key]: event.target.value,
                          },
                        },
                      })
                    }
                    className={cn(
                      "h-7 min-w-0 flex-1 rounded border border-separator bg-[#1D1D26] px-1.5 text-[12.5px] text-foreground outline-none focus:border-[var(--brand-light)]",
                      property.type === "number" && "tabular-nums",
                    )}
                  />
                )}
              </label>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function BehaviorTypePicker({
  open,
  onClose,
  onPick,
  installed,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (typeId: string) => void;
  installed: string[];
}) {
  const [query, setQuery] = React.useState("");
  const results = BEHAVIORS.filter(
    (behavior) =>
      !query ||
      behavior.name.toLowerCase().includes(query.toLowerCase()) ||
      behavior.description.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <GdDialog
      open={open}
      onClose={onClose}
      title={S.addABehavior}
      width="max-w-2xl"
      footer={<GdButton onClick={onClose}>{S.cancel}</GdButton>}
    >
      <div className="p-2">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Buscar un comportamiento"
          autoFocus
        />
        <div className="mt-2 max-h-[50vh] overflow-y-auto">
          {results.map((behavior) => {
            const already = installed.includes(behavior.typeId);
            return (
              <button
                key={behavior.typeId}
                type="button"
                disabled={already}
                onClick={() => onPick(behavior.typeId)}
                className={cn(
                  "flex w-full items-center gap-2 rounded px-2 py-2 text-left hover:bg-list-hover disabled:opacity-50 disabled:hover:bg-transparent",
                  already && "cursor-not-allowed",
                )}
              >
                <CatalogIcon
                  name={BEHAVIOR_ICON[behavior.typeId] ?? "puzzle"}
                  className="h-5 w-5 shrink-0 text-[#C9B6FC]"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] text-foreground">
                    {behavior.name}
                  </span>
                  <span className="block truncate text-[11.5px] text-text-secondary">
                    {behavior.description}
                  </span>
                </span>
                {already ? (
                  <span className="shrink-0 text-[11px] text-text-secondary">
                    {S.alreadyInstalled}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </GdDialog>
  );
}
