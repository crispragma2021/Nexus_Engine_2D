// Instruction editor — GDevelop's `InstructionEditorDialog`: categories sidebar,
// the searchable list of conditions/actions with their description, and the
// sentence preview whose parameters are edited inline (each parameter type gets
// its own picker: objects, layers, scenes, behaviors, animations, resources,
// variables, keys, operators, expressions…).

import * as React from "react";
import { AlertTriangle, ChevronRight, Search } from "lucide-react";
import { useEditor } from "@/lib/editor/store";
import {
  INSTRUCTION_CATEGORIES,
  MODOPS,
  OPERATORS,
  instructionById,
  searchInstructions,
  sentenceParts,
  type InstructionDef,
} from "@/lib/editor/instructions";
import { newInstruction } from "@/lib/editor/events";
import type { GDEvent, GDInstruction, GDProject, GDScene } from "@/lib/editor/types";
import { S } from "@/lib/editor/i18n";
import { cn } from "@/lib/utils";
import { GdButton, GdDialog } from "./gd/kit";
import { CATEGORY_ICON, CatalogIcon } from "./gd/icons";
import { ExpressionField, type ParamKind } from "./gd/ExpressionField";
import { KEYS, MOUSE_BUTTONS } from "@/lib/editor/catalog";

const PARAM_TO_EXPRESSION: Record<string, ParamKind> = {
  number: "number",
  expression: "number",
  string: "string",
  yesno: "yesno",
  choices: "choices",
  key: "key",
  button: "choices",
  operator: "choices",
  modop: "choices",
  color: "color",
  sound: "sound",
  animation: "animation",
  behavior: "behavior",
  object: "object",
  textObject: "textObject",
  varobj: "varobj",
  varscene: "varobj",
  varglobal: "varglobal",
  layer: "layer",
  scene: "scene",
};

export function InstructionSelectorDialog() {
  const { ui, dispatch, scene, project } = useEditor();
  const dialog = ui.dialog?.name === "instruction" ? ui.dialog : null;
  const open = !!dialog;
  const kind = dialog?.slot === "conditions" ? "condition" : "action";
  const editing: GDInstruction | null = React.useMemo(() => {
    if (!dialog?.instructionId) return null;
    const event: GDEvent | undefined = findEventById(scene.events, dialog.eventId);
    return event?.[dialog.slot].find((i: GDInstruction) => i.id === dialog.instructionId) ?? null;
  }, [dialog, scene.events]);

  const [category, setCategory] = React.useState("all");
  const [query, setQuery] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [parameters, setParameters] = React.useState<Record<string, string>>({});
  const [inverted, setInverted] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setQuery("");
    setCategory("all");
    if (editing) {
      setSelectedId(editing.typeId);
      setParameters({ ...editing.parameters });
      setInverted(editing.inverted);
    } else {
      setSelectedId(null);
      setParameters({});
      setInverted(false);
    }
  }, [open, editing, dialog?.eventId, dialog?.slot]);

  const results = searchInstructions(kind, query, category);
  const def = (selectedId ? instructionById(selectedId) : undefined) ?? null;

  const close = () => dispatch({ type: "closeDialog" });

  const submit = () => {
    if (!dialog || !def) return;
    if (!editing) {
      dispatch({
        type: "addInstruction",
        eventId: dialog.eventId,
        slot: dialog.slot,
        instruction: {
          ...newInstruction(def.id, defaultsFor(def)),
          inverted: kind === "condition" ? inverted : false,
        },
      });
    } else {
      dispatch({
        type: "updateInstruction",
        eventId: dialog.eventId,
        slot: dialog.slot,
        instructionId: editing.id,
        patch: { typeId: def.id, parameters, ...(kind === "condition" ? { inverted } : {}) },
      });
    }
    close();
  };

  const objectNameForBehaviors =
    parameters["object"] ||
    def?.parameters.find((parameter) => parameter.type === "object")?.defaultValue ||
    scene.objects[0]?.name ||
    "";

  return (
    <GdDialog
      open={open}
      onClose={close}
      title={`${S.instructionEditor} — ${kind === "condition" ? S.condition : S.action}`}
      width="max-w-[min(1080px,96vw)]"
      helpPath={def?.helpPath}
      footer={
        <>
          {kind === "condition" ? (
            <label className="mr-auto flex items-center gap-2 text-[12.5px] text-text-secondary">
              <input
                type="checkbox"
                checked={inverted}
                onChange={(event) => setInverted(event.target.checked)}
                className="h-3.5 w-3.5 accent-[var(--brand)]"
              />
              {S.instructionIfNot}
            </label>
          ) : null}
          <GdButton onClick={close}>{S.cancel}</GdButton>
          <GdButton variant="raised" primary disabled={!def} onClick={submit}>
            {editing ? S.apply : S.add}
          </GdButton>
        </>
      }
    >
      <div className="grid h-[min(70vh,620px)] grid-cols-1 md:grid-cols-[150px_minmax(0,320px)_minmax(0,1fr)]">
        {/* categories */}
        <div className="hidden flex-col overflow-y-auto border-r border-separator bg-[#22242B] py-1 md:flex">
          {INSTRUCTION_CATEGORIES.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => setCategory(entry.id)}
              className={cn(
                "flex items-center gap-2 px-2.5 py-1.5 text-left text-[12.5px] text-text-secondary hover:bg-list-hover hover:text-foreground",
                category === entry.id && "bg-[#494952] text-[#F6F2FF]",
              )}
            >
              <CatalogIcon
                name={CATEGORY_ICON[entry.id] ?? "puzzle"}
                className="h-3.5 w-3.5 shrink-0 opacity-80"
              />
              <span className="min-w-0 flex-1 truncate">{entry.name}</span>
              {category === entry.id ? <ChevronRight className="h-3 w-3 opacity-60" /> : null}
            </button>
          ))}
        </div>

        {/* instruction list */}
        <div className="flex min-h-0 flex-col border-b border-separator md:border-b-0 md:border-r">
          <div className="flex items-center gap-2 border-b border-separator px-2 py-1.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-text-secondary" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={kind === "condition" ? S.addCondition : S.addAction}
              className="h-7 w-full min-w-0 bg-transparent text-[12.5px] outline-none placeholder:text-text-placeholder"
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {results.length === 0 ? (
              <p className="p-3 text-[12.5px] text-text-secondary">Sin resultados.</p>
            ) : null}
            {results.map((instruction) => (
              <button
                key={instruction.id}
                type="button"
                onClick={() => {
                  setSelectedId(instruction.id);
                  setParameters(defaultsFor(instruction));
                }}
                className={cn(
                  "flex w-full flex-col items-start gap-0.5 border-b border-separator/60 px-2.5 py-1.5 text-left hover:bg-list-hover",
                  selectedId === instruction.id && "bg-[#3D4D51]",
                )}
              >
                <span
                  className={cn(
                    "text-[12.5px] leading-tight",
                    selectedId === instruction.id ? "text-[#E5C07B]" : "text-foreground",
                  )}
                >
                  {instruction.name}
                </span>
                <span className="line-clamp-2 text-[11px] leading-tight text-text-secondary">
                  {instruction.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* editor */}
        <div className="flex min-h-0 flex-col">
          {!def ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
              <p className="text-[13px] font-semibold text-foreground">{S.chooseAndAddEvent}</p>
              <p className="max-w-xs text-[12px] text-text-secondary">
                Selecciona {kind === "condition" ? "una condición" : "una acción"} en la lista para
                editar sus parámetros.
              </p>
            </div>
          ) : (
            <>
              <div className="border-b border-separator p-3">
                <h3 className="text-[13px] font-semibold text-foreground">{def.name}</h3>
                <p className="mt-1 text-[12px] leading-snug text-text-secondary">
                  {def.description}
                </p>
                {def.unsupported ? (
                  <p className="mt-2 flex items-start gap-1.5 rounded bg-[var(--ev-warning)] px-2 py-1.5 text-[11.5px] text-[#FFBC57]">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Esta instrucción no está simulada por el motor de vista previa de Nexus Engine.
                  </p>
                ) : null}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-3">
                <div className="rounded border border-[#32323B] bg-[#25252E] p-3 text-[13px] leading-8 text-[var(--ev-row-text)]">
                  {sentenceParts(def).map((part, index) =>
                    "paramIndex" in part && part.paramIndex !== undefined ? (
                      <InlineParam
                        key={index}
                        def={def}
                        paramIndex={part.paramIndex}
                        value={parameters[def.parameters[part.paramIndex]?.name ?? ""] ?? ""}
                        onChange={(next) => {
                          const name =
                            def.parameters[part.paramIndex ?? 0]?.name ?? String(part.paramIndex);
                          setParameters((state) => ({ ...state, [name]: next }));
                        }}
                        scene={scene}
                        project={project}
                        objectName={objectNameForBehaviors}
                      />
                    ) : (
                      <span key={index}>{part.text}</span>
                    ),
                  )}
                </div>

                <div className="mt-3 overflow-hidden rounded border border-separator">
                  <div className="bg-[#25252E] px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#D6DEEC]">
                    Parámetros
                  </div>
                  <table className="w-full table-fixed text-[12px]">
                    <tbody>
                      {def.parameters.map((parameter, index) => (
                        <tr
                          key={parameter.name}
                          className={cn(index % 2 === 0 ? "bg-[#1D1D26]" : "bg-[#23232A]")}
                        >
                          <th className="w-40 truncate px-2 py-1 text-left font-normal text-text-secondary">
                            {parameter.label}
                          </th>
                          <td className="truncate px-2 py-1 text-left text-foreground">
                            {parameters[parameter.name] || (
                              <span className="text-text-placeholder">—</span>
                            )}
                          </td>
                          <td className="w-24 px-2 py-1 text-right text-[10px] uppercase text-text-placeholder">
                            {parameter.type}
                          </td>
                        </tr>
                      ))}
                      {def.parameters.length === 0 ? (
                        <tr>
                          <td className="px-2 py-1 text-text-secondary">Sin parámetros</td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </GdDialog>
  );
}

const defaultsFor = (def: InstructionDef): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const parameter of def.parameters) out[parameter.name] = parameter.defaultValue;
  return out;
};

function findEventById(events: GDEvent[], id: string): GDEvent | undefined {
  for (const event of events) {
    if (event.id === id) return event;
    const found = findEventById(event.subEvents, id);
    if (found) return found;
  }
  return undefined;
}

function InlineParam({
  def,
  paramIndex,
  value,
  onChange,
  scene,
  project,
  objectName,
}: {
  def: InstructionDef;
  paramIndex: number;
  value: string;
  onChange: (value: string) => void;
  scene: GDScene;
  project: GDProject;
  objectName: string;
}) {
  const parameter = def.parameters[paramIndex];
  if (!parameter) return null;
  const kind = PARAM_TO_EXPRESSION[parameter.type] ?? "string";

  const objectChoices = [
    ...scene.objects.map((object) => object.name),
    ...(scene.groups ?? []).map((group) => group.name),
  ];

  const choicesFor = (): readonly string[] | undefined => {
    switch (parameter.type) {
      case "object":
      case "textObject":
        return objectChoices;
      case "layer":
        return scene.layers.map((layer) => layer.name);
      case "scene":
        return project.scenes.map((entry) => entry.name);
      case "behavior": {
        const object = scene.objects.find((entry) => entry.name === objectName);
        return (object?.behaviors ?? []).map((behavior) => behavior.name);
      }
      case "animation": {
        const object = scene.objects.find((entry) => entry.name === objectName);
        return (object?.animations ?? []).map((animation) => animation.name);
      }
      case "key":
        return KEYS.map((entry) => entry.name);
      case "button":
        return MOUSE_BUTTONS.map((entry) => entry.name);
      case "operator":
        return OPERATORS;
      case "modop":
        return MODOPS.map((modop) => modop.value);
      case "sound":
        return project.resources.filter((r) => r.kind === "audio").map((r) => r.name);
      case "varobj":
        return [
          ...scene.variables.map((variable) => variable.name),
          ...(scene.objects.find((entry) => entry.name === objectName)?.variables ?? []).map(
            (variable) => variable.name,
          ),
        ];
      case "varglobal":
        return project.globalVariables.map((variable) => variable.name);
      case "choices":
        return parameter.choices ?? [];
      default:
        return parameter.choices;
    }
  };

  const labels: Record<string, string> | undefined =
    parameter.type === "modop"
      ? Object.fromEntries(MODOPS.map((modop) => [modop.value, modop.label]))
      : parameter.type === "key"
        ? Object.fromEntries(KEYS.map((entry) => [entry.name, entry.label]))
        : parameter.type === "button"
          ? Object.fromEntries(MOUSE_BUTTONS.map((entry) => [entry.name, entry.label]))
          : undefined;

  return (
    <span className="mx-1 inline-flex min-w-40 items-center gap-1 align-middle">
      <span className="shrink-0 text-[11px] text-text-secondary">{parameter.label}:</span>
      <ExpressionField
        value={value}
        kind={kind}
        choices={choicesFor()}
        choiceLabels={labels}
        onChange={onChange}
      />
    </span>
  );
}
