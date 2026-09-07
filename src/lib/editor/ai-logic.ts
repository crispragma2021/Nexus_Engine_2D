// Hybrid text-to-events compiler. It never creates a parallel automation graph:
// output is the same GDEvent/GDInstruction structure consumed by EventsEditor,
// the project serializer and GameRuntime.

import type { GDEvent, GDInstruction } from "./types.ts";

export interface AiLogicContext {
  objectNames: readonly string[];
  sceneNames?: readonly string[];
  audioResources?: readonly string[];
  activeLayer?: string;
}

export class AiLogicValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiLogicValidationError";
  }
}

interface InstructionSchema {
  slot: "condition" | "action";
  required: readonly string[];
  allowed: readonly string[];
}

const SCHEMA: Readonly<Record<string, InstructionSchema>> = {
  SceneJustBegins: { slot: "condition", required: [], allowed: [] },
  KeyPressed: { slot: "condition", required: ["key"], allowed: ["key"] },
  Collision: {
    slot: "condition",
    required: ["object", "object2"],
    allowed: ["object", "object2", "ignoreTouchingEdges"],
  },
  SourisBouton: { slot: "condition", required: ["button"], allowed: ["button"] },
  SourisSurObjet: {
    slot: "condition",
    required: ["object"],
    allowed: ["object", "considerAsTrigger"],
  },
  TimerRepeated: {
    slot: "condition",
    required: ["timer", "seconds"],
    allowed: ["timer", "seconds"],
  },
  CompareSceneVar: {
    slot: "condition",
    required: ["variable", "operator", "value"],
    allowed: ["variable", "operator", "value"],
  },
  ChangeX: {
    slot: "action",
    required: ["object", "op", "value"],
    allowed: ["object", "op", "value"],
  },
  ChangeY: {
    slot: "action",
    required: ["object", "op", "value"],
    allowed: ["object", "op", "value"],
  },
  Delete: { slot: "action", required: ["object"], allowed: ["object"] },
  Create: {
    slot: "action",
    required: ["object", "x", "y", "layer"],
    allowed: ["object", "x", "y", "layer"],
  },
  ChangeScene: { slot: "action", required: ["scene"], allowed: ["scene"] },
  PlaySound: {
    slot: "action",
    required: ["file", "volume", "loop"],
    allowed: ["file", "volume", "loop"],
  },
  ModVarScene: {
    slot: "action",
    required: ["variable", "op", "value"],
    allowed: ["variable", "op", "value"],
  },
  "TXT::SetText": {
    slot: "action",
    required: ["object", "text"],
    allowed: ["object", "text"],
  },
};

const KEY_ALIASES: Readonly<Record<string, string>> = {
  espacio: "Space",
  space: "Space",
  enter: "Return",
  retorno: "Return",
  izquierda: "Left",
  left: "Left",
  derecha: "Right",
  right: "Right",
  arriba: "Up",
  up: "Up",
  abajo: "Down",
  down: "Down",
  escape: "Escape",
  esc: "Escape",
};

let generatedId = 0;

export function compileIntentToEvents(input: unknown, context: AiLogicContext): GDEvent[] {
  if (typeof input !== "string") throw new AiLogicValidationError("La intención debe ser texto.");
  const prompt = input.trim().replace(/\s+/g, " ");
  if (prompt.length < 4)
    throw new AiLogicValidationError("Describe la automatización con más detalle.");
  if (prompt.length > 600) throw new AiLogicValidationError("La intención supera 600 caracteres.");
  if (hasDisallowedControlCharacters(prompt)) {
    throw new AiLogicValidationError("La intención contiene caracteres no válidos.");
  }

  const normalized = normalize(prompt);
  const conditions = compileConditions(normalized, context);
  const actions = compileActions(prompt, normalized, context);
  const event: GDEvent = {
    id: nextId("ev_ai"),
    kind: "standard",
    conditions,
    actions,
    subEvents: [],
    collapsed: false,
  };
  return validateGeneratedEvents([event], context);
}

export function validateGeneratedEvents(
  input: readonly GDEvent[],
  context: AiLogicContext,
): GDEvent[] {
  if (!Array.isArray(input) || input.length === 0 || input.length > 20) {
    throw new AiLogicValidationError("La automatización debe generar entre 1 y 20 eventos.");
  }
  const ids = new Set<string>();
  let instructionCount = 0;

  const validateEvent = (event: GDEvent, depth: number): GDEvent => {
    if (!event || typeof event !== "object" || event.kind !== "standard") {
      throw new AiLogicValidationError("La IA solo puede insertar eventos visuales estándar.");
    }
    if (depth > 8)
      throw new AiLogicValidationError("La jerarquía de eventos es demasiado profunda.");
    validateId(event.id, ids, "evento");
    if (
      !Array.isArray(event.conditions) ||
      !Array.isArray(event.actions) ||
      !Array.isArray(event.subEvents)
    ) {
      throw new AiLogicValidationError("La estructura del evento no es válida.");
    }
    if (event.actions.length === 0) {
      throw new AiLogicValidationError("Un evento automatizado debe contener al menos una acción.");
    }

    const validateInstruction = (
      instruction: GDInstruction,
      expectedSlot: "condition" | "action",
    ): GDInstruction => {
      instructionCount += 1;
      if (instructionCount > 100) {
        throw new AiLogicValidationError("La automatización contiene demasiadas instrucciones.");
      }
      validateId(instruction.id, ids, "instrucción");
      const schema = SCHEMA[instruction.typeId];
      if (!schema || schema.slot !== expectedSlot) {
        throw new AiLogicValidationError(`Instrucción no permitida: ${instruction.typeId}.`);
      }
      if (!instruction.parameters || typeof instruction.parameters !== "object") {
        throw new AiLogicValidationError(`Parámetros inválidos en ${instruction.typeId}.`);
      }
      const keys = Object.keys(instruction.parameters);
      if (keys.some((key) => !schema.allowed.includes(key))) {
        throw new AiLogicValidationError(`Parámetro no permitido en ${instruction.typeId}.`);
      }
      for (const required of schema.required) {
        if (!String(instruction.parameters[required] ?? "").trim()) {
          throw new AiLogicValidationError(
            `Falta el parámetro ${required} en ${instruction.typeId}.`,
          );
        }
      }
      validateReferences(instruction, context);
      return {
        ...instruction,
        inverted: instruction.inverted === true,
        parameters: { ...instruction.parameters },
      };
    };

    return {
      ...event,
      conditions: event.conditions.map((instruction) =>
        validateInstruction(instruction, "condition"),
      ),
      actions: event.actions.map((instruction) => validateInstruction(instruction, "action")),
      subEvents: event.subEvents.map((child) => validateEvent(child, depth + 1)),
      collapsed: event.collapsed === true,
    };
  };

  return input.map((event) => validateEvent(event, 0));
}

export function supportedAiLogicInstructions(): string[] {
  return Object.keys(SCHEMA);
}

/** Referencias del proyecto contra las que se validan las instrucciones. */
export interface InstructionRefs {
  /** Nombres de objetos existentes en la escena destino. */
  objectNames: readonly string[];
  sceneNames?: readonly string[];
  audioResources?: readonly string[];
}

/**
 * Contrato paramétrico compartido entre el compilador determinista y el
 * agente (tools.ts). Para instrucciones con entrada en el SCHEMA valida slot
 * (condición/acción) y claves required/allowed; además, para cualquier
 * instrucción que traiga referencias (object/object2/scene/file) comprueba que
 * apunten a objetos/escenas/audios que existen en el proyecto.
 *
 * Devuelve un mensaje de error en español o null si la instrucción es válida.
 */
export function instructionContractError(
  typeId: string,
  expectedSlot: "condition" | "action",
  parameters: Readonly<Record<string, string>> | undefined,
  refs: InstructionRefs,
): string | null {
  const params = parameters ?? {};

  const schema = SCHEMA[typeId];
  if (schema) {
    if (schema.slot !== expectedSlot) {
      return `La instrucción «${typeId}» debe ir en ${schema.slot === "condition" ? "condiciones" : "acciones"}.`;
    }
    const disallowed = Object.keys(params).filter((key) => !schema.allowed.includes(key));
    if (disallowed.length > 0) {
      return `Parámetro no permitido en ${typeId}: ${disallowed[0]}.`;
    }
    for (const required of schema.required) {
      if (!String(params[required] ?? "").trim()) {
        return `Falta el parámetro ${required} en ${typeId}.`;
      }
    }
  }

  for (const key of ["object", "object2"] as const) {
    const value = params[key];
    if (value && !refs.objectNames.includes(value)) {
      return `El objeto «${value}» no existe en la escena.`;
    }
  }
  const scene = params["scene"];
  if (scene && refs.sceneNames && !refs.sceneNames.includes(scene)) {
    return `La escena «${scene}» no existe.`;
  }
  const file = params["file"];
  if (file && refs.audioResources && !refs.audioResources.includes(file)) {
    return `El audio «${file}» no existe en los recursos.`;
  }
  return null;
}

function compileConditions(normalized: string, context: AiLogicContext): GDInstruction[] {
  const every = normalized.match(/\bcada\s+(\d+(?:[.,]\d+)?)\s*(?:segundos?|s)\b/);
  if (every?.[1]) {
    const seconds = numeric(every[1]);
    if (!(seconds > 0 && seconds <= 86_400)) {
      throw new AiLogicValidationError("El intervalo debe estar entre 0 y 86400 segundos.");
    }
    return [
      instruction("TimerRepeated", {
        timer: `ia_${String(seconds).replace(".", "_")}`,
        seconds: String(seconds),
      }),
    ];
  }

  if (
    /\b(?:al|cuando)\s+(?:comenzar|iniciar|empiece|empieza|inicio)\b|\binicio de la escena\b/.test(
      normalized,
    )
  ) {
    return [instruction("SceneJustBegins")];
  }

  if (/\b(?:colisiona|colisione|choque|toca|toque)\b/.test(normalized)) {
    const objects = mentionedObjects(normalized, context.objectNames);
    if (objects.length < 2) {
      throw new AiLogicValidationError("Indica los dos objetos de la colisión.");
    }
    return [
      instruction("Collision", {
        object: objects[0]!,
        object2: objects[1]!,
        ignoreTouchingEdges: "no",
      }),
    ];
  }

  if (/\b(?:clic|click|toque|tocar|puntero)\b/.test(normalized)) {
    const object = mentionedObjects(normalized, context.objectNames)[0];
    if (!object) throw new AiLogicValidationError("Indica el objeto que debe recibir el clic.");
    return [
      instruction("SourisSurObjet", { object, considerAsTrigger: "yes" }),
      instruction("SourisBouton", { button: "Left" }),
    ];
  }

  if (/\b(?:tecla|presione|presionar|pulse|pulsar)\b/.test(normalized)) {
    return [instruction("KeyPressed", { key: keyFrom(normalized) })];
  }

  const variable = normalized.match(
    /\b(?:variable\s+)?([a-z_][a-z0-9_]*)\s+(?:sea|es|llegue a)\s+(mayor|menor|igual)(?:\s+que|\s+a)?\s*(-?\d+(?:[.,]\d+)?)/,
  );
  if (variable?.[1] && variable[2] && variable[3]) {
    return [
      instruction("CompareSceneVar", {
        variable: variable[1],
        operator: variable[2] === "mayor" ? ">" : variable[2] === "menor" ? "<" : "=",
        value: String(numeric(variable[3])),
      }),
    ];
  }

  throw new AiLogicValidationError(
    "No pude identificar cuándo debe ejecutarse. Usa «al comenzar», «al presionar», «cada N segundos», «al hacer clic» o una colisión.",
  );
}

function compileActions(
  original: string,
  normalized: string,
  context: AiLogicContext,
): GDInstruction[] {
  const variableChange = normalized.match(
    /\b(?:suma|sumar|anade|anadir|incrementa|incrementar)\s+(-?\d+(?:[.,]\d+)?)\s+(?:a\s+)?(?:la\s+)?variable\s+([a-z_][a-z0-9_]*)/,
  );
  if (variableChange?.[1] && variableChange[2]) {
    return [
      instruction("ModVarScene", {
        variable: variableChange[2],
        op: "add",
        value: String(numeric(variableChange[1])),
      }),
    ];
  }

  const createMatch = normalized.match(/\b(?:crea|crear|genera|generar|anade|anadir)\b/);
  if (createMatch) {
    const object = objectAfter(normalized, createMatch.index ?? 0, context.objectNames);
    if (!object) throw new AiLogicValidationError("Indica qué objeto debe crearse.");
    const coordinates = normalized.match(
      /\b(?:en|posicion)\s*\(?\s*(-?\d+(?:[.,]\d+)?)\s*[,;]\s*(-?\d+(?:[.,]\d+)?)\s*\)?/,
    );
    return [
      instruction("Create", {
        object,
        x: coordinates?.[1] ? String(numeric(coordinates[1])) : "0",
        y: coordinates?.[2] ? String(numeric(coordinates[2])) : "0",
        layer: context.activeLayer ?? "Base layer",
      }),
    ];
  }

  const deleteMatch = normalized.match(/\b(?:elimina|eliminar|borra|borrar|destruye|destruir)\b/);
  if (deleteMatch) {
    const object = objectAfter(normalized, deleteMatch.index ?? 0, context.objectNames);
    if (!object) throw new AiLogicValidationError("Indica qué objeto debe eliminarse.");
    return [instruction("Delete", { object })];
  }

  const sceneMatch = normalized.match(/\b(?:cambia|cambiar|ve|ir)\s+(?:a\s+)?(?:la\s+)?escena\b/);
  if (sceneMatch) {
    const scene = namedReferenceAfter(normalized, sceneMatch.index ?? 0, context.sceneNames ?? []);
    if (!scene) throw new AiLogicValidationError("Indica una escena existente como destino.");
    return [instruction("ChangeScene", { scene })];
  }

  const soundMatch = normalized.match(
    /\b(?:reproduce|reproducir|toca|tocar)\s+(?:el\s+)?(?:sonido|audio)\b/,
  );
  if (soundMatch) {
    const known = namedReferenceAfter(
      normalized,
      soundMatch.index ?? 0,
      context.audioResources ?? [],
    );
    const quoted = original.match(/["“]([^"”]+)["”]/u)?.[1];
    const file = known ?? quoted;
    if (!file) throw new AiLogicValidationError("Indica un recurso de audio existente.");
    return [instruction("PlaySound", { file, volume: "100", loop: "no" })];
  }

  const moveMatch = normalized.match(/\b(?:mueve|mover|desplaza|desplazar)\b/);
  if (moveMatch) {
    const object = objectAfter(normalized, moveMatch.index ?? 0, context.objectNames);
    if (!object) throw new AiLogicValidationError("Indica qué objeto debe moverse.");
    const amountMatch = normalized.match(/(-?\d+(?:[.,]\d+)?)\s*(?:px|pixeles?)?\b/);
    const amount = Math.abs(amountMatch?.[1] ? numeric(amountMatch[1]) : 10);
    if (!Number.isFinite(amount) || amount > 1_000_000) {
      throw new AiLogicValidationError("La distancia indicada no es válida.");
    }
    if (/\b(?:izquierda|left)\b/.test(normalized)) {
      return [instruction("ChangeX", { object, op: "add", value: String(-amount) })];
    }
    if (/\b(?:derecha|right)\b/.test(normalized)) {
      return [instruction("ChangeX", { object, op: "add", value: String(amount) })];
    }
    if (/\b(?:arriba|up)\b/.test(normalized)) {
      return [instruction("ChangeY", { object, op: "add", value: String(-amount) })];
    }
    if (/\b(?:abajo|down)\b/.test(normalized)) {
      return [instruction("ChangeY", { object, op: "add", value: String(amount) })];
    }
    throw new AiLogicValidationError(
      "Indica si el movimiento es arriba, abajo, izquierda o derecha.",
    );
  }

  throw new AiLogicValidationError(
    "No pude identificar la acción. Prueba crear, mover, eliminar, reproducir audio o cambiar de escena.",
  );
}

function validateReferences(instruction: GDInstruction, context: AiLogicContext) {
  for (const key of ["object", "object2"] as const) {
    const value = instruction.parameters[key];
    if (value && !context.objectNames.includes(value)) {
      throw new AiLogicValidationError(`El objeto «${value}» no existe en la escena.`);
    }
  }
  const scene = instruction.parameters["scene"];
  if (scene && context.sceneNames && !context.sceneNames.includes(scene)) {
    throw new AiLogicValidationError(`La escena «${scene}» no existe.`);
  }
  const file = instruction.parameters["file"];
  if (file && context.audioResources && !context.audioResources.includes(file)) {
    throw new AiLogicValidationError(`El audio «${file}» no existe en los recursos.`);
  }
}

function validateId(id: unknown, ids: Set<string>, label: string) {
  if (typeof id !== "string" || !/^[A-Za-z0-9:_-]{2,120}$/.test(id) || ids.has(id)) {
    throw new AiLogicValidationError(`Identificador de ${label} inválido o duplicado.`);
  }
  ids.add(id);
}

function instruction(typeId: string, parameters: Record<string, string> = {}): GDInstruction {
  return { id: nextId("in_ai"), typeId, inverted: false, parameters };
}

function nextId(prefix: string): string {
  generatedId += 1;
  return `${prefix}_${Date.now().toString(36)}_${generatedId.toString(36)}`;
}

function keyFrom(value: string): string {
  for (const [alias, key] of Object.entries(KEY_ALIASES)) {
    if (new RegExp(`\\b${alias}\\b`).test(value)) return key;
  }
  const literal = value.match(/\b(?:tecla|presione|presionar|pulse|pulsar)\s+([a-z0-9])\b/)?.[1];
  if (literal) return literal.toUpperCase();
  throw new AiLogicValidationError("Indica la tecla que debe activarlo.");
}

function mentionedObjects(value: string, names: readonly string[]): string[] {
  return names
    .map((name) => ({ name, index: value.indexOf(normalize(name)) }))
    .filter((entry) => entry.index >= 0)
    .sort((a, b) => a.index - b.index)
    .map((entry) => entry.name)
    .filter((name, index, all) => all.indexOf(name) === index);
}

function objectAfter(value: string, index: number, names: readonly string[]): string | undefined {
  return namedReferenceAfter(value, index, names) ?? mentionedObjects(value, names)[0];
}

function namedReferenceAfter(
  value: string,
  index: number,
  names: readonly string[],
): string | undefined {
  const suffix = value.slice(index);
  return names
    .map((name) => ({ name, index: suffix.indexOf(normalize(name)) }))
    .filter((entry) => entry.index >= 0)
    .sort((a, b) => a.index - b.index)[0]?.name;
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function numeric(value: string): number {
  return Number(value.replace(",", "."));
}

function hasDisallowedControlCharacters(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code <= 8 || code === 11 || code === 12 || (code >= 14 && code <= 31) || code === 127) {
      return true;
    }
  }
  return false;
}
