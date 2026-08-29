import { uid } from "./ids";
import type { GDEvent, GDInstance, GDObjectDef, GDScene } from "./types";

export const MAX_INLINE_AI_PROMPT_LENGTH = 600;

const MAX_COMMANDS = 12;
const MAX_COORDINATE = 1_000_000;
const MAX_DIMENSION = 100_000;

export class AiPromptValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiPromptValidationError";
  }
}

type InstancePatch = Partial<
  Pick<GDInstance, "x" | "y" | "angle" | "width" | "height" | "locked" | "hiddenAtStart">
>;

type ObjectPatch = Partial<
  Pick<GDObjectDef, "name" | "text" | "textColor" | "textSize" | "bold" | "italic">
>;

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export type AiEditorCommand =
  | { kind: "updateInstances"; ids: string[]; patch: InstancePatch }
  | { kind: "translateInstances"; ids: string[]; dx: number; dy: number }
  | { kind: "scaleInstances"; ids: string[]; factor: number }
  | { kind: "duplicateInstances"; ids: string[] }
  | { kind: "deleteInstances"; ids: string[] }
  | { kind: "updateObjects"; ids: string[]; patch: ObjectPatch }
  | { kind: "tintObjects"; ids: string[]; color: RgbColor }
  | { kind: "updateScene"; patch: { backgroundColor: string } }
  | { kind: "addInstance"; objectId: string; x: number; y: number }
  | {
      kind: "addText";
      name: string;
      text: string;
      x: number;
      y: number;
      textColor: string;
      textSize: number;
    };

export interface AiEditPlan {
  commands: AiEditorCommand[];
  summary: string;
}

export interface AiEditContext {
  scene: GDScene;
  selectedInstanceIds: readonly string[];
  selectedObjectIds: readonly string[];
  cursorPosition: { x: number; y: number } | null;
}

export interface AppliedAiEdit {
  scene: GDScene;
  selectedInstanceIds?: string[];
}

interface ResolvedTargets {
  instanceIds: string[];
  objectIds: string[];
}

const NAMED_COLORS: Record<string, RgbColor> = {
  negro: { r: 0, g: 0, b: 0 },
  black: { r: 0, g: 0, b: 0 },
  blanco: { r: 255, g: 255, b: 255 },
  white: { r: 255, g: 255, b: 255 },
  rojo: { r: 239, g: 68, b: 68 },
  red: { r: 239, g: 68, b: 68 },
  verde: { r: 34, g: 197, b: 94 },
  green: { r: 34, g: 197, b: 94 },
  azul: { r: 59, g: 130, b: 246 },
  blue: { r: 59, g: 130, b: 246 },
  amarillo: { r: 250, g: 204, b: 21 },
  yellow: { r: 250, g: 204, b: 21 },
  naranja: { r: 249, g: 115, b: 22 },
  orange: { r: 249, g: 115, b: 22 },
  morado: { r: 112, g: 70, b: 236 },
  purpura: { r: 112, g: 70, b: 236 },
  violeta: { r: 139, g: 92, b: 246 },
  purple: { r: 112, g: 70, b: 236 },
  rosa: { r: 236, g: 72, b: 153 },
  pink: { r: 236, g: 72, b: 153 },
  gris: { r: 107, g: 114, b: 128 },
  gray: { r: 107, g: 114, b: 128 },
  cyan: { r: 6, g: 182, b: 212 },
  turquesa: { r: 20, g: 184, b: 166 },
};

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const unique = (values: readonly string[]) => [...new Set(values)];
const numberOf = (value: string) => Number(value.replace(",", "."));
const instancesLabel = (count: number) => `${count} ${count === 1 ? "instancia" : "instancias"}`;
const objectsLabel = (count: number) => `${count} ${count === 1 ? "objeto" : "objetos"}`;

export function validateAiPrompt(input: unknown): string {
  if (typeof input !== "string") {
    throw new AiPromptValidationError("La instrucción debe ser texto.");
  }

  const prompt = input.trim().replace(/\s+/g, " ");
  if (prompt.length < 2) {
    throw new AiPromptValidationError("Escribe una instrucción un poco más específica.");
  }
  if (prompt.length > MAX_INLINE_AI_PROMPT_LENGTH) {
    throw new AiPromptValidationError(
      `La instrucción no puede superar ${MAX_INLINE_AI_PROMPT_LENGTH} caracteres.`,
    );
  }
  if (hasDisallowedControlCharacters(prompt)) {
    throw new AiPromptValidationError("La instrucción contiene caracteres no válidos.");
  }
  return prompt;
}

/**
 * Turns a short in-situ instruction into a small, allow-listed edit plan. The
 * deterministic interpreter is also the safe fallback for a future remote AI:
 * regardless of where commands come from, validateAiEditPlan is the trust
 * boundary before anything reaches the editor store.
 */
export function createAiEditPlan(input: unknown, context: AiEditContext): AiEditPlan {
  const prompt = validateAiPrompt(input);
  const normalized = normalize(prompt);
  const targets = resolveTargets(normalized, context);
  const commands: AiEditorCommand[] = [];
  const changes: string[] = [];
  const needsInstances = () => requireInstances(targets.instanceIds);
  const needsObjects = () => requireObjects(targets.objectIds);
  const createText =
    /\b(?:crea|crear|anade|anadir|agrega|agregar|inserta|insertar)\b[^.]*\btexto\b/.test(
      normalized,
    );

  if (createText) {
    const text = extractCreatedText(prompt) ?? "Nuevo texto";
    const color = parseColor(prompt) ?? NAMED_COLORS["blanco"]!;
    const textSize = extractTextSize(normalized) ?? 24;
    const position = context.cursorPosition ?? { x: 0, y: 0 };
    commands.push({
      kind: "addText",
      name: "TextoIA",
      text,
      x: position.x,
      y: position.y,
      textColor: rgbToHex(color),
      textSize,
    });
    changes.push("creé un texto en la posición del cursor");
  }

  if (/\b(?:duplica|duplicar|clona|clonar|copia otra)\b/.test(normalized)) {
    const ids = needsInstances();
    commands.push({ kind: "duplicateInstances", ids });
    changes.push(`dupliqué ${instancesLabel(ids.length)}`);
  }

  const deletesSelection =
    /^(?:elimina|eliminar|borra|borrar|quita|quitar)(?:lo|la|los|las)?$/.test(normalized) ||
    /\b(?:elimina|eliminar|borra|borrar|quita|quitar)\b[^.]*\b(?:instancia|instancias|objeto|objetos|seleccion|seleccionado|seleccionados)\b/.test(
      normalized,
    );
  if (deletesSelection) {
    const ids = needsInstances();
    commands.push({ kind: "deleteInstances", ids });
    changes.push(`eliminé ${instancesLabel(ids.length)}`);
  }

  const visibility = visibilityFrom(normalized);
  if (visibility !== null) {
    const ids = needsInstances();
    commands.push({ kind: "updateInstances", ids, patch: { hiddenAtStart: !visibility } });
    changes.push(`${visibility ? "mostré" : "oculté"} ${instancesLabel(ids.length)}`);
  }

  const locked = lockFrom(normalized);
  if (locked !== null) {
    const ids = needsInstances();
    commands.push({ kind: "updateInstances", ids, patch: { locked } });
    changes.push(`${locked ? "bloqueé" : "desbloqueé"} ${instancesLabel(ids.length)}`);
  }

  const absolutePosition = extractAbsolutePosition(normalized);
  if (absolutePosition) {
    const ids = needsInstances();
    commands.push({ kind: "updateInstances", ids, patch: absolutePosition });
    changes.push(
      `coloqué ${instancesLabel(ids.length)} en ${absolutePosition.x}, ${absolutePosition.y}`,
    );
  } else {
    const movement = extractRelativeMovement(normalized, context.scene);
    if (movement) {
      const ids = needsInstances();
      commands.push({ kind: "translateInstances", ids, ...movement });
      changes.push(`moví ${instancesLabel(ids.length)}`);
    }
  }

  const dimensions = extractDimensions(normalized);
  if (dimensions) {
    const ids = needsInstances();
    commands.push({ kind: "updateInstances", ids, patch: dimensions });
    changes.push(`ajusté el tamaño de ${instancesLabel(ids.length)}`);
  } else {
    const factor = extractScale(normalized);
    if (factor !== null) {
      const ids = needsInstances();
      commands.push({ kind: "scaleInstances", ids, factor });
      changes.push(`escalé ${instancesLabel(ids.length)}`);
    }
  }

  const angle = extractAngle(normalized);
  if (angle !== null) {
    const ids = needsInstances();
    commands.push({ kind: "updateInstances", ids, patch: { angle } });
    changes.push(`giré ${instancesLabel(ids.length)} a ${angle}°`);
  }

  const renamedTo = extractNewName(prompt);
  if (renamedTo) {
    const ids = needsObjects();
    if (ids.length !== 1) {
      throw new AiPromptValidationError("Selecciona un único objeto antes de renombrarlo.");
    }
    commands.push({ kind: "updateObjects", ids, patch: { name: renamedTo } });
    changes.push(`renombré el objeto como ${renamedTo}`);
  }

  const updatesText =
    !createText && /\b(?:texto|contenido|diga|escriba)\b/.test(normalized)
      ? extractUpdatedText(prompt)
      : null;
  if (updatesText) {
    const ids = textObjectIds(needsObjects(), context.scene);
    commands.push({ kind: "updateObjects", ids, patch: { text: updatesText } });
    changes.push(`actualicé el contenido de ${objectsLabel(ids.length)}`);
  }

  const textSize = !createText ? extractTextSize(normalized) : null;
  if (textSize !== null) {
    const ids = textObjectIds(needsObjects(), context.scene);
    commands.push({ kind: "updateObjects", ids, patch: { textSize } });
    changes.push(`cambié el tamaño del texto de ${objectsLabel(ids.length)}`);
  }

  if (!createText && /\bnegrita\b/.test(normalized)) {
    const ids = textObjectIds(needsObjects(), context.scene);
    const bold = !/\b(?:sin|quita|quitar|elimina|eliminar)\s+(?:la\s+)?negrita\b/.test(normalized);
    commands.push({ kind: "updateObjects", ids, patch: { bold } });
    changes.push(`${bold ? "activé" : "quité"} la negrita`);
  }

  const color = parseColor(prompt);
  const changesBackground = /\b(?:fondo|background)\b/.test(normalized);
  if (color && changesBackground) {
    commands.push({ kind: "updateScene", patch: { backgroundColor: rgbToGDevelop(color) } });
    changes.push("cambié el fondo de la escena");
  } else if (color && !createText && /\b(?:color|tinte|tono)\b/.test(normalized)) {
    const ids = needsObjects();
    const textIds = ids.filter((id) =>
      isTextObject(context.scene.objects.find((o) => o.id === id)),
    );
    const graphicIds = ids.filter((id) => !textIds.includes(id));
    if (textIds.length > 0) {
      commands.push({ kind: "updateObjects", ids: textIds, patch: { textColor: rgbToHex(color) } });
    }
    if (graphicIds.length > 0) {
      commands.push({ kind: "tintObjects", ids: graphicIds, color });
    }
    changes.push(`cambié el color de ${objectsLabel(ids.length)}`);
  }

  if (!createText && isCreateInstancePrompt(normalized)) {
    const object =
      explicitlyMentionedObject(normalized, context.scene) ??
      (targets.objectIds.length === 1
        ? context.scene.objects.find((item) => item.id === targets.objectIds[0])
        : undefined);
    if (!object) {
      throw new AiPromptValidationError(
        "Indica el nombre de un objeto existente para añadirlo a la escena.",
      );
    }
    const position = context.cursorPosition ?? { x: 0, y: 0 };
    commands.push({ kind: "addInstance", objectId: object.id, x: position.x, y: position.y });
    changes.push(`añadí una instancia de ${object.name}`);
  }

  if (commands.length === 0) {
    throw new AiPromptValidationError(
      "No pude convertir esa instrucción en un cambio seguro. Prueba «mueve 32 px a la derecha», «tamaño 120x80», «oculta» o «fondo azul».",
    );
  }

  const plan: AiEditPlan = {
    commands,
    summary: `Listo: ${changes.join("; ")}.`,
  };
  return validateAiEditPlan(plan, context.scene);
}

export function validateAiEditPlan(plan: AiEditPlan, scene: GDScene): AiEditPlan {
  if (!plan || !Array.isArray(plan.commands) || plan.commands.length === 0) {
    throw new AiPromptValidationError("La IA no propuso ningún cambio.");
  }
  if (plan.commands.length > MAX_COMMANDS) {
    throw new AiPromptValidationError("La IA propuso demasiados cambios a la vez.");
  }
  if (typeof plan.summary !== "string" || plan.summary.length > 500) {
    throw new AiPromptValidationError("El resumen de la IA no es válido.");
  }

  const instanceIds = new Set(scene.instances.map((instance) => instance.id));
  const objectIds = new Set(scene.objects.map((object) => object.id));

  for (const command of plan.commands) {
    switch (command.kind) {
      case "updateInstances":
        validateIds(command.ids, instanceIds, "instancia");
        validateInstancePatch(command.patch);
        break;
      case "translateInstances":
        validateIds(command.ids, instanceIds, "instancia");
        validateCoordinate(command.dx, "desplazamiento X");
        validateCoordinate(command.dy, "desplazamiento Y");
        break;
      case "scaleInstances":
        validateIds(command.ids, instanceIds, "instancia");
        if (!Number.isFinite(command.factor) || command.factor < 0.05 || command.factor > 20) {
          throw new AiPromptValidationError("La escala propuesta está fuera del rango permitido.");
        }
        break;
      case "duplicateInstances":
      case "deleteInstances":
        validateIds(command.ids, instanceIds, "instancia");
        break;
      case "updateObjects":
        validateIds(command.ids, objectIds, "objeto");
        validateObjectPatch(command.patch, command.ids, scene);
        break;
      case "tintObjects":
        validateIds(command.ids, objectIds, "objeto");
        validateColor(command.color);
        break;
      case "updateScene":
        if (!isGDevelopColor(command.patch.backgroundColor)) {
          throw new AiPromptValidationError("El color de fondo propuesto no es válido.");
        }
        break;
      case "addInstance":
        validateIds([command.objectId], objectIds, "objeto");
        validateCoordinate(command.x, "posición X");
        validateCoordinate(command.y, "posición Y");
        break;
      case "addText":
        validateSafeText(command.name, "nombre", 80);
        validateSafeText(command.text, "texto", 2_000);
        validateCoordinate(command.x, "posición X");
        validateCoordinate(command.y, "posición Y");
        if (!/^#[0-9a-f]{6}$/i.test(command.textColor)) {
          throw new AiPromptValidationError("El color del texto propuesto no es válido.");
        }
        validateDimension(command.textSize, "tamaño del texto");
        break;
      default:
        assertNever(command);
    }
  }

  return plan;
}

/** Applies one previously validated plan and returns a complete, immutable scene. */
export function applyAiEditPlan(scene: GDScene, plan: AiEditPlan): AppliedAiEdit {
  validateAiEditPlan(plan, scene);
  let next = scene;
  let selection: string[] | undefined;

  for (const command of plan.commands) {
    switch (command.kind) {
      case "updateInstances":
        next = {
          ...next,
          instances: next.instances.map((instance) =>
            command.ids.includes(instance.id)
              ? {
                  ...instance,
                  ...command.patch,
                  ...(command.patch.width !== undefined || command.patch.height !== undefined
                    ? { customSize: true }
                    : {}),
                }
              : instance,
          ),
        };
        break;
      case "translateInstances":
        next = {
          ...next,
          instances: next.instances.map((instance) =>
            command.ids.includes(instance.id)
              ? {
                  ...instance,
                  x: clampCoordinate(instance.x + command.dx),
                  y: clampCoordinate(instance.y + command.dy),
                }
              : instance,
          ),
        };
        break;
      case "scaleInstances":
        next = {
          ...next,
          instances: next.instances.map((instance) =>
            command.ids.includes(instance.id)
              ? {
                  ...instance,
                  width: Math.min(
                    MAX_DIMENSION,
                    Math.max(1, Math.round(instance.width * command.factor)),
                  ),
                  height: Math.min(
                    MAX_DIMENSION,
                    Math.max(1, Math.round(instance.height * command.factor)),
                  ),
                  customSize: true,
                }
              : instance,
          ),
        };
        break;
      case "duplicateInstances": {
        const copies = next.instances
          .filter((instance) => command.ids.includes(instance.id))
          .map((instance) => ({
            ...instance,
            id: uid("inst"),
            x: clampCoordinate(instance.x + 20),
            y: clampCoordinate(instance.y + 20),
            locked: false,
          }));
        next = { ...next, instances: [...next.instances, ...copies] };
        selection = copies.map((instance) => instance.id);
        break;
      }
      case "deleteInstances":
        next = {
          ...next,
          instances: next.instances.filter((instance) => !command.ids.includes(instance.id)),
        };
        selection = [];
        break;
      case "updateObjects":
        next = applyObjectPatch(next, command.ids, command.patch);
        break;
      case "tintObjects":
        next = {
          ...next,
          objects: next.objects.map((object) => {
            if (!command.ids.includes(object.id)) return object;
            const tint = {
              type: "Tint",
              name: "Tinte IA",
              parameters: {
                r: String(command.color.r),
                g: String(command.color.g),
                b: String(command.color.b),
              },
            };
            const tintIndex = object.effects.findIndex((effect) => effect.type === "Tint");
            return {
              ...object,
              effects:
                tintIndex === -1
                  ? [...object.effects, tint]
                  : object.effects.map((effect, index) => (index === tintIndex ? tint : effect)),
            };
          }),
        };
        break;
      case "updateScene":
        next = { ...next, ...command.patch };
        break;
      case "addInstance": {
        const object = next.objects.find((item) => item.id === command.objectId)!;
        const instance = makeInstance(next, object, command.x, command.y);
        next = { ...next, instances: [...next.instances, instance] };
        selection = [instance.id];
        break;
      }
      case "addText": {
        const objectId = uid("obj");
        const instanceId = uid("inst");
        const name = uniqueObjectName(command.name, next.objects);
        const object: GDObjectDef = {
          id: objectId,
          name,
          type: "TextObject::Text",
          text: command.text,
          textColor: command.textColor,
          textSize: command.textSize,
          fontFamily: "Arial",
          bold: false,
          italic: false,
          alignment: "left",
          wrapping: false,
          behaviors: [],
          effects: [],
          variables: [],
        };
        const instance: GDInstance = {
          id: instanceId,
          objectId,
          x: command.x,
          y: command.y,
          angle: 0,
          customSize: true,
          width: Math.max(160, Math.min(800, command.text.length * command.textSize * 0.6)),
          height: Math.max(32, command.textSize * 1.5),
          zOrder: next.instances.reduce((max, item) => Math.max(max, item.zOrder), 0) + 1,
          layer: next.activeLayer || next.layers[0]?.name || "Base layer",
          locked: false,
          hiddenAtStart: false,
          variables: [],
          effects: [],
        };
        next = {
          ...next,
          objects: [...next.objects, object],
          instances: [...next.instances, instance],
        };
        selection = [instanceId];
        break;
      }
      default:
        assertNever(command);
    }
  }

  return {
    scene: next,
    ...(selection !== undefined ? { selectedInstanceIds: selection } : {}),
  };
}

function resolveTargets(normalizedPrompt: string, context: AiEditContext): ResolvedTargets {
  const selectedInstances = unique(context.selectedInstanceIds).filter((id) =>
    context.scene.instances.some((instance) => instance.id === id),
  );
  const objectIdsFromInstances = selectedInstances
    .map((id) => context.scene.instances.find((instance) => instance.id === id)?.objectId)
    .filter((id): id is string => Boolean(id));
  const selectedObjects = unique(context.selectedObjectIds).filter((id) =>
    context.scene.objects.some((object) => object.id === id),
  );
  const mentionedObjects = context.scene.objects.filter((object) =>
    normalizedPrompt.includes(normalize(object.name)),
  );
  const objectIds = unique(
    selectedInstances.length > 0
      ? objectIdsFromInstances
      : selectedObjects.length > 0
        ? selectedObjects
        : mentionedObjects.map((object) => object.id),
  );
  const instanceIds =
    selectedInstances.length > 0
      ? selectedInstances
      : context.scene.instances
          .filter((instance) => objectIds.includes(instance.objectId))
          .map((instance) => instance.id);
  return { instanceIds, objectIds };
}

function requireInstances(ids: string[]) {
  if (ids.length === 0) {
    throw new AiPromptValidationError("Selecciona una instancia en el Canvas para modificarla.");
  }
  return ids;
}

function requireObjects(ids: string[]) {
  if (ids.length === 0) {
    throw new AiPromptValidationError("Selecciona un objeto o una instancia para modificarlo.");
  }
  return ids;
}

function textObjectIds(ids: string[], scene: GDScene) {
  const textIds = ids.filter((id) =>
    isTextObject(scene.objects.find((object) => object.id === id)),
  );
  if (textIds.length === 0) {
    throw new AiPromptValidationError("La selección no contiene ningún objeto de texto.");
  }
  return textIds;
}

function isTextObject(object: GDObjectDef | undefined) {
  return Boolean(
    object &&
    (object.type === "Text" ||
      object.type === "TextObject::Text" ||
      object.type === "BBTextObject::BBText" ||
      object.type === "BitmapTextObject::BitmapText"),
  );
}

function extractAbsolutePosition(value: string): { x: number; y: number } | null {
  const byAxes = value.match(
    /\b(?:muev\w*|mov\w*|coloc\w*|posicion\w*)\b[^.]*?\bx\s*[:=]?\s*(-?\d+(?:[.,]\d+)?)[^.]*?\by\s*[:=]?\s*(-?\d+(?:[.,]\d+)?)/,
  );
  const byPair = value.match(
    /\b(?:muev\w*|mov\w*|coloc\w*|posicion\w*)\b[^.]*?\b(?:a|en)\s*\(?\s*(-?\d+(?:[.,]\d+)?)\s*[,;]\s*(-?\d+(?:[.,]\d+)?)\s*\)?/,
  );
  const match = byAxes ?? byPair;
  return match?.[1] && match[2] ? { x: numberOf(match[1]), y: numberOf(match[2]) } : null;
}

function extractRelativeMovement(value: string, scene: GDScene): { dx: number; dy: number } | null {
  if (!/\b(?:muev\w*|mov\w*|desplaz\w*|sube|baja)\b/.test(value)) return null;
  const directionMatch = value.match(/\b(derecha|izquierda|arriba|abajo)\b/);
  const direction =
    directionMatch?.[1] ??
    (value.includes("sube") ? "arriba" : value.includes("baja") ? "abajo" : null);
  if (!direction) return null;

  const after = value.match(new RegExp(`(?:${direction})\\s*(?:en\\s*)?(-?\\d+(?:[.,]\\d+)?)`));
  const before = value.match(
    new RegExp(
      `(-?\\d+(?:[.,]\\d+)?)\\s*(?:px|pixeles?)?\\s*(?:a\\s+la\\s+|hacia\\s+)?${direction}`,
    ),
  );
  const amount =
    Math.abs(numberOf(after?.[1] ?? before?.[1] ?? "")) ||
    (direction === "derecha" || direction === "izquierda" ? scene.grid.width : scene.grid.height);
  if (direction === "derecha") return { dx: amount, dy: 0 };
  if (direction === "izquierda") return { dx: -amount, dy: 0 };
  if (direction === "arriba") return { dx: 0, dy: -amount };
  return { dx: 0, dy: amount };
}

function extractDimensions(value: string): { width: number; height: number } | null {
  const pair = value.match(
    /\b(?:tamano|redimension\w*|dimension\w*)\b[^.]*?(-?\d+(?:[.,]\d+)?)\s*[x×]\s*(-?\d+(?:[.,]\d+)?)/,
  );
  if (pair?.[1] && pair[2]) return { width: numberOf(pair[1]), height: numberOf(pair[2]) };
  const named = value.match(
    /\b(?:ancho|width)\s*[:=]?\s*(-?\d+(?:[.,]\d+)?)[^.]*?\b(?:alto|height)\s*[:=]?\s*(-?\d+(?:[.,]\d+)?)/,
  );
  return named?.[1] && named[2] ? { width: numberOf(named[1]), height: numberOf(named[2]) } : null;
}

function extractScale(value: string): number | null {
  const explicit = value.match(/\b(?:escala|escal\w*)\b[^.]*?(-?\d+(?:[.,]\d+)?)\s*%/);
  if (explicit?.[1]) return numberOf(explicit[1]) / 100;
  if (/\b(?:mas grande|agranda|aumenta el tamano)\b/.test(value)) return 1.25;
  if (/\b(?:mas pequeno|reduce el tamano|encoge)\b/.test(value)) return 0.8;
  return null;
}

function extractAngle(value: string): number | null {
  const match = value.match(
    /\b(?:gira\w*|rota\w*|angulo)\b[^.]*?(-?\d+(?:[.,]\d+)?)\s*(?:°|grados?)?/,
  );
  return match?.[1] ? numberOf(match[1]) : null;
}

function visibilityFrom(value: string): boolean | null {
  if (/\b(?:oculta\w*|esconde\w*|invisible)\b/.test(value)) return false;
  if (/\b(?:muestra\w*|visible|ensena\w*)\b/.test(value)) return true;
  return null;
}

function lockFrom(value: string): boolean | null {
  if (/\b(?:desbloquea\w*|desbloquead\w*)\b/.test(value)) return false;
  if (/\b(?:bloquea\w*|bloquead\w*)\b/.test(value)) return true;
  return null;
}

function extractNewName(prompt: string): string | null {
  const match = prompt.match(
    /\b(?:renombra(?:r)?|cambia(?:r)?\s+el\s+nombre|llama(?:r)?)(?:\s+[^,.;]+?)?\s+(?:a|como)\s+["“]?([^"”.,;]+)["”]?/iu,
  );
  return match?.[1]?.trim() || null;
}

function extractCreatedText(prompt: string): string | null {
  const quoted = prompt.match(/["“]([^"”]+)["”]/u);
  if (quoted?.[1]) return quoted[1].trim();
  const after = prompt.match(/\btexto\s+(?:que\s+diga|con\s+el\s+texto|con|:)?\s*(.+)$/iu);
  return after?.[1]?.replace(/\s+(?:de|con)\s+(?:color|tamaño|tamano)\b.*$/iu, "").trim() || null;
}

function extractUpdatedText(prompt: string): string | null {
  const quoted = prompt.match(/["“]([^"”]+)["”]/u);
  if (quoted?.[1]) return quoted[1].trim();
  const match = prompt.match(
    /\b(?:texto|contenido)\b(?:\s+actual)?\s*(?:a|por|:|que\s+diga)\s*(.+)$/iu,
  );
  return match?.[1]?.trim() || null;
}

function extractTextSize(value: string): number | null {
  const match = value.match(
    /\b(?:tamano\s+(?:de\s+)?(?:fuente|letra|texto)|fuente\s+de)\b[^.]*?(-?\d+(?:[.,]\d+)?)/,
  );
  return match?.[1] ? numberOf(match[1]) : null;
}

function parseColor(prompt: string): RgbColor | null {
  const hex = prompt.match(/#([0-9a-f]{6}|[0-9a-f]{3})\b/i)?.[1];
  if (hex) {
    const expanded = hex.length === 3 ? [...hex].map((digit) => `${digit}${digit}`).join("") : hex;
    return {
      r: Number.parseInt(expanded.slice(0, 2), 16),
      g: Number.parseInt(expanded.slice(2, 4), 16),
      b: Number.parseInt(expanded.slice(4, 6), 16),
    };
  }
  const rgb = prompt.match(/rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/i);
  if (rgb?.[1] && rgb[2] && rgb[3]) {
    const color = { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) };
    validateColor(color);
    return color;
  }
  const normalized = normalize(prompt);
  for (const [name, color] of Object.entries(NAMED_COLORS)) {
    if (new RegExp(`\\b${name}\\b`).test(normalized)) return color;
  }
  return null;
}

function isCreateInstancePrompt(value: string) {
  return (
    /\b(?:crea|crear|anade|anadir|agrega|agregar|inserta|insertar)\b/.test(value) &&
    (/\b(?:instancia|objeto|otro|otra|nuevo|nueva)\b/.test(value) ||
      !/\b(?:color|fondo|texto)\b/.test(value))
  );
}

function explicitlyMentionedObject(value: string, scene: GDScene) {
  return scene.objects
    .slice()
    .sort((a, b) => b.name.length - a.name.length)
    .find((object) => value.includes(normalize(object.name)));
}

function validateIds(ids: string[], allowed: Set<string>, label: string) {
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 500) {
    throw new AiPromptValidationError(`La selección de ${label}s no es válida.`);
  }
  if (ids.some((id) => typeof id !== "string" || !allowed.has(id))) {
    throw new AiPromptValidationError(`La IA intentó modificar una ${label} inexistente.`);
  }
}

function validateInstancePatch(patch: InstancePatch) {
  const allowed = new Set(["x", "y", "angle", "width", "height", "locked", "hiddenAtStart"]);
  const keys = Object.keys(patch);
  if (keys.length === 0 || keys.some((key) => !allowed.has(key))) {
    throw new AiPromptValidationError("La modificación de instancia no está permitida.");
  }
  if (patch.x !== undefined) validateCoordinate(patch.x, "posición X");
  if (patch.y !== undefined) validateCoordinate(patch.y, "posición Y");
  if (patch.angle !== undefined) validateCoordinate(patch.angle, "ángulo");
  if (patch.width !== undefined) validateDimension(patch.width, "ancho");
  if (patch.height !== undefined) validateDimension(patch.height, "alto");
  if (patch.locked !== undefined && typeof patch.locked !== "boolean") {
    throw new AiPromptValidationError("El estado de bloqueo no es válido.");
  }
  if (patch.hiddenAtStart !== undefined && typeof patch.hiddenAtStart !== "boolean") {
    throw new AiPromptValidationError("El estado de visibilidad no es válido.");
  }
}

function validateObjectPatch(patch: ObjectPatch, ids: string[], scene: GDScene) {
  const allowed = new Set(["name", "text", "textColor", "textSize", "bold", "italic"]);
  const keys = Object.keys(patch);
  if (keys.length === 0 || keys.some((key) => !allowed.has(key))) {
    throw new AiPromptValidationError("La modificación de objeto no está permitida.");
  }
  if (patch.name !== undefined) {
    if (ids.length !== 1)
      throw new AiPromptValidationError("Solo se puede renombrar un objeto a la vez.");
    validateSafeText(patch.name, "nombre", 80);
    if (scene.objects.some((object) => object.name === patch.name && !ids.includes(object.id))) {
      throw new AiPromptValidationError(`Ya existe un objeto llamado «${patch.name}».`);
    }
  }
  if (patch.text !== undefined) validateSafeText(patch.text, "texto", 2_000);
  if (patch.textColor !== undefined && !/^#[0-9a-f]{6}$/i.test(patch.textColor)) {
    throw new AiPromptValidationError("El color de texto no es válido.");
  }
  if (patch.textSize !== undefined) validateDimension(patch.textSize, "tamaño del texto");
  if (patch.bold !== undefined && typeof patch.bold !== "boolean") {
    throw new AiPromptValidationError("El estilo de negrita no es válido.");
  }
  if (patch.italic !== undefined && typeof patch.italic !== "boolean") {
    throw new AiPromptValidationError("El estilo de cursiva no es válido.");
  }
}

function validateSafeText(value: string, label: string, maxLength: number) {
  if (typeof value !== "string" || !value.trim() || value.length > maxLength) {
    throw new AiPromptValidationError(`El ${label} propuesto no es válido.`);
  }
  if (hasDisallowedControlCharacters(value)) {
    throw new AiPromptValidationError(`El ${label} propuesto contiene caracteres no válidos.`);
  }
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

function validateCoordinate(value: number, label: string) {
  if (!Number.isFinite(value) || Math.abs(value) > MAX_COORDINATE) {
    throw new AiPromptValidationError(`La ${label} propuesta está fuera del rango permitido.`);
  }
}

function clampCoordinate(value: number) {
  return Math.max(-MAX_COORDINATE, Math.min(MAX_COORDINATE, value));
}

function validateDimension(value: number, label: string) {
  if (!Number.isFinite(value) || value < 1 || value > MAX_DIMENSION) {
    throw new AiPromptValidationError(`El ${label} propuesto está fuera del rango permitido.`);
  }
}

function validateColor(color: RgbColor) {
  if (
    ![color.r, color.g, color.b].every(
      (component) => Number.isInteger(component) && component >= 0 && component <= 255,
    )
  ) {
    throw new AiPromptValidationError("El color propuesto no es válido.");
  }
}

function isGDevelopColor(value: string) {
  const parts = value.split(";");
  return (
    parts.length === 3 &&
    parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) >= 0 && Number(part) <= 255)
  );
}

function rgbToHex(color: RgbColor) {
  return `#${[color.r, color.g, color.b]
    .map((component) => component.toString(16).padStart(2, "0"))
    .join("")}`;
}

function rgbToGDevelop(color: RgbColor) {
  return `${color.r};${color.g};${color.b}`;
}

function applyObjectPatch(scene: GDScene, ids: string[], patch: ObjectPatch): GDScene {
  const renamed =
    patch.name !== undefined && ids.length === 1
      ? scene.objects.find((object) => object.id === ids[0])
      : undefined;
  const objects = scene.objects.map((object) =>
    ids.includes(object.id) ? { ...object, ...patch } : object,
  );
  if (!renamed || !patch.name || renamed.name === patch.name) return { ...scene, objects };
  return {
    ...scene,
    objects,
    groups: scene.groups.map((group) => ({
      ...group,
      objects: group.objects.map((name) => (name === renamed.name ? patch.name! : name)),
    })),
    events: scene.events.map((event) => renameObjectInEvent(event, renamed.name, patch.name!)),
  };
}

function renameObjectInEvent(event: GDEvent, from: string, to: string): GDEvent {
  const renameParameters = (parameters: Record<string, string>) =>
    Object.fromEntries(
      Object.entries(parameters).map(([key, value]) => [key, value === from ? to : value]),
    );
  return {
    ...event,
    conditions: event.conditions.map((instruction) => ({
      ...instruction,
      parameters: renameParameters(instruction.parameters),
    })),
    actions: event.actions.map((instruction) => ({
      ...instruction,
      parameters: renameParameters(instruction.parameters),
    })),
    subEvents: event.subEvents.map((child) => renameObjectInEvent(child, from, to)),
  };
}

function makeInstance(scene: GDScene, object: GDObjectDef, x: number, y: number): GDInstance {
  const text = isTextObject(object);
  return {
    id: uid("inst"),
    objectId: object.id,
    x,
    y,
    angle: 0,
    customSize: false,
    width: text ? 160 : 64,
    height: text ? 32 : 64,
    zOrder: scene.instances.reduce((max, instance) => Math.max(max, instance.zOrder), 0) + 1,
    layer: scene.activeLayer || scene.layers[0]?.name || "Base layer",
    locked: false,
    hiddenAtStart: false,
    variables: [],
    effects: [],
  };
}

function uniqueObjectName(base: string, objects: GDObjectDef[]) {
  const names = new Set(objects.map((object) => object.name));
  if (!names.has(base)) return base;
  let suffix = 2;
  while (names.has(`${base}${suffix}`)) suffix += 1;
  return `${base}${suffix}`;
}

function assertNever(value: never): never {
  throw new AiPromptValidationError(`Comando de IA no permitido: ${String(value)}`);
}
