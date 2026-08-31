// Deterministic instruction planner — turns a short Spanish instruction into
// an AgentPlan over the Game Tool Registry (brief: plan → approval → atomic
// transaction → preview → diagnostics).
//
// This is the in-editor planner for block 2. It is the deterministic
// interpreter the remote LLM gateway will extend in block 3; whatever the plan
// comes from, it still has to pass validatePlan before the session applies it.
// The planner is honest: if it cannot build a safe plan it returns a reason
// instead of guessing, and it only references tools that exist and are
// supported (never invented capabilities).
//
// Importable under plain Node (tests): explicit .ts extensions.

import type { GDEvent, GDProject, GDScene } from "../editor/types.ts";
import {
  createOperation,
  createPlan,
  type AgentPlan,
  type ProjectOperation,
} from "./operations.ts";
import {
  BEHAVIOR_DEFAULT_PROPERTIES,
  isCreatableObjectType,
  isSupportedBehavior,
} from "./capabilities.ts";
import { hasDisallowedControlCharacters } from "./schemas.ts";
import { compileIntentToEvents } from "../editor/ai-logic.ts";
import { newNameGenerator } from "../editor/ids.ts";

export const MAX_PLANNER_PROMPT_LENGTH = 600;

export interface PlannerContext {
  project: GDProject;
  activeSceneName: string;
  /** Canvas cursor in scene coordinates; default position for insertions. */
  cursorPosition?: { x: number; y: number } | null;
}

export interface PlanProposal {
  plan: AgentPlan | null;
  /** Friendly Spanish explanation when the planner could not build a plan. */
  reason?: string;
}

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

/** Words skipped before a name ("el objeto X") — includes category words. */
const SKIP_WORDS = new Set([
  "el",
  "la",
  "los",
  "las",
  "un",
  "una",
  "uno",
  "objeto",
  "instancia",
  "escena",
  "variable",
  "comportamiento",
  "con",
  "de",
  "del",
  "que",
  "se",
  "por",
  "nuevo",
  "nueva",
]);

/** Words that stop a name ("... a X", "... en X", "... y ..."). */
const STOP_WORDS = new Set([
  "a",
  "al",
  "en",
  "de",
  "del",
  "como",
  "tipo",
  "y",
  "con",
  "llamada",
  "llamado",
  "nombre",
  "global",
  "booleana",
  "booleano",
  "numerica",
  "que",
  "diga",
]);

/** Splits the substring after the first anchor match into tokens and walks
 *  them: skip leading filler words, then collect up to three name tokens
 *  until a stop word or the end. */
function extractName(text: string, anchor: RegExp): string | null {
  const start = anchor.exec(text);
  if (!start) return null;
  const rest = text.slice(start.index + start[0].length);
  const tokens = rest
    .split(/[\s.,;]+/)
    .map((token) => token.trim())
    .filter(Boolean);
  const name: string[] = [];
  let skipping = true;
  for (const raw of tokens) {
    const token = raw.toLowerCase();
    if (!/^[\p{L}\p{N} _-]+$/u.test(raw)) break;
    if (skipping) {
      if (SKIP_WORDS.has(token)) continue;
      if (STOP_WORDS.has(token)) return null;
      skipping = false;
    } else if (STOP_WORDS.has(token)) {
      break;
    }
    name.push(raw);
    if (name.length === 3) break;
  }
  return name.length > 0 ? name.join(" ") : null;
}

/** The object referenced after the last "a X" / "de X" of the prompt. */
function objectAtTail(text: string): string | null {
  const tail = text.match(
    /(?:a|de)\s+([a-z0-9áéíóúñ_-]{2,40}(?:\s[a-z0-9áéíóúñ_-]{2,40})?)\s*[.,]?\s*$/i,
  );
  return tail?.[1]?.trim() ?? null;
}

const firstInstanceByName = (scene: GDScene | null, objectName: string | null) => {
  if (!scene || !objectName) return null;
  const object = scene.objects.find((candidate) => candidate.name === objectName);
  if (!object) return null;
  return scene.instances.find((instance) => instance.objectId === object.id) ?? null;
};

const objectNameOfInstance = (scene: GDScene | null, instanceId: string): string => {
  if (!scene) return "";
  const instance = scene.instances.find((candidate) => candidate.id === instanceId);
  return instance
    ? (scene.objects.find((object) => object.id === instance.objectId)?.name ?? "")
    : "";
};

const parseCoordinatePair = (value: string): { x: number; y: number } | null => {
  const match = value.match(/(-?\d+(?:[.,]\d+)?)\s*[;,]\s*(-?\d+(?:[.,]\d+)?)/);
  if (!match?.[1] || !match[2]) return null;
  const x = Number(match[1].replace(",", "."));
  const y = Number(match[2].replace(",", "."));
  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
};

/**
 * Converts already-compiled GDEvents (e.g. the deterministic compiler of
 * QuickAutomationBar) into a plan of create_event operations, so every AI
 * surface funnels through the same trust boundary (validatePlan → applyPlan).
 * create_event handles flat events; subEvents are not expressible in this
 * tool and are dropped (the in-editor compilers emit flat events).
 */
export function eventsToAgentPlan(
  events: readonly GDEvent[],
  sceneName: string,
  summary?: string,
): AgentPlan {
  const operations = events.map((event) =>
    createOperation("create_event", {
      sceneName,
      conditions: event.conditions.map((instruction) => ({
        typeId: instruction.typeId,
        parameters: { ...instruction.parameters },
        inverted: instruction.inverted,
      })),
      actions: event.actions.map((instruction) => ({
        typeId: instruction.typeId,
        parameters: { ...instruction.parameters },
        inverted: instruction.inverted,
      })),
    }),
  );
  return createPlan(
    summary ??
      (events.length === 1
        ? "Crear evento automatizado"
        : `Crear ${events.length} eventos automatizados`),
    operations,
    sceneName,
  );
}

export function planFromInstruction(prompt: unknown, context: PlannerContext): PlanProposal {
  if (typeof prompt !== "string") {
    return { plan: null, reason: "Escribe una instrucción de texto para el agente." };
  }
  const text = prompt.trim().replace(/\s+/g, " ");
  if (text.length < 4) {
    return { plan: null, reason: "Describe lo que quieres con un poco más de detalle." };
  }
  if (text.length > MAX_PLANNER_PROMPT_LENGTH) {
    return {
      plan: null,
      reason: `La instrucción no puede superar ${MAX_PLANNER_PROMPT_LENGTH} caracteres.`,
    };
  }
  if (hasDisallowedControlCharacters(text)) {
    return { plan: null, reason: "La instrucción contiene caracteres no válidos." };
  }

  const normalized = normalize(text);
  const { project } = context;
  const operations: ProjectOperation[] = [];
  const summaryParts: string[] = [];
  let targetSceneName = context.activeSceneName;
  let createdSceneName: string | null = null;

  // "when X happens, do Y" phrasing: an event intent. These must go to the
  // event compiler, not to the single-instance move/resize branches.
  const hasEventTrigger =
    /\b(?:al presionar|al pulsar|presiona|pulsar|tecla|cuando|al comenzar|inicio de la escena|clic|click|cada\s+\d+\s+segundos)\b/.test(
      normalized,
    );

  /* ------------------------------------------------------------- scenes */
  const wantsNewScene =
    /(?:crea|crear|anade|anadir|agrega|agregar|genera|generar)\b[^.]*?\bescena\b/.test(
      normalized,
    ) && !normalized.match(/(?:duplica|duplicar|clona|clonar)\b/);
  if (wantsNewScene) {
    const name =
      extractName(text, /escena/) ??
      newNameGenerator(
        "Nueva escena",
        project.scenes.map((scene) => scene.name),
      );
    operations.push(createOperation("create_scene", { name }));
    summaryParts.push(`Crear escena «${name}»`);
    createdSceneName = name;
  }

  const wantsDuplicate = /(?:duplica|duplicar|clona|clonar)\b[^.]*?\bescena\b/.test(normalized);
  if (wantsDuplicate && !wantsNewScene) {
    const name = extractName(text, /escena/);
    if (!name) {
      return { plan: null, reason: "Indica qué escena quieres duplicar." };
    }
    const asMatch = normalized.match(/(?:como|nombre)\s+([a-z0-9 _-]{2,40})/);
    operations.push(
      createOperation("duplicate_scene", {
        sceneName: name,
        ...(asMatch?.[1] ? { newName: asMatch[1].trim() } : {}),
      }),
    );
    summaryParts.push(`Duplicar escena «${name}»`);
  }

  const explicitScene = normalized.match(/\ben\s+la\s+escena\s+([a-z0-9 _-]{2,40})/);
  if (explicitScene) {
    const name = explicitScene[1]!.trim();
    const found = project.scenes.find((scene) => scene.name.toLowerCase() === name);
    if (found) {
      targetSceneName = found.name;
    } else if (createdSceneName && name.toLowerCase() === createdSceneName.toLowerCase()) {
      targetSceneName = createdSceneName;
    } else {
      return { plan: null, reason: `No existe la escena «${name}».` };
    }
  } else if (createdSceneName) {
    // A single-verb prompt about the new scene, or a compound prompt
    // ("crea la escena X y añade una variable…"): the rest happens there.
    if (operations.length === 1 || normalized.includes(createdSceneName.toLowerCase())) {
      targetSceneName = createdSceneName;
    }
  }

  const activeScene =
    project.scenes.find((candidate) => candidate.name === context.activeSceneName) ??
    project.scenes[0] ??
    null;
  // When the target is a scene created in this same plan, lookups run against
  // the active scene (the created scene is still empty at planning time).
  const lookupScene = targetSceneName === createdSceneName ? activeScene : activeScene;

  const objectByName = (name: string | null) =>
    lookupScene ? (lookupScene.objects.find((object) => object.name === name) ?? null) : null;

  /* ------------------------------------------------------------ objects */
  const wantsObject =
    /(?:crea|crear|anade|anadir|agrega|agregar|genera|generar)\b[^.]*?\b(objeto|texto)\b/.test(
      normalized,
    );
  if (wantsObject && !wantsNewScene) {
    const name = extractName(text, /objeto|texto/);
    if (!name) {
      return { plan: null, reason: "Indica el nombre del objeto que quieres crear." };
    }
    let type = "Sprite";
    if (/\btexto\b/.test(normalized)) type = "TextObject::Text";
    else if (/\bspritesheet\b|\bhoja de sprites\b/.test(normalized))
      type = "SpriteObject::SpriteSheet";
    if (!isCreatableObjectType(type)) {
      return { plan: null, reason: `El tipo de objeto «${type}» no está disponible en el editor.` };
    }
    const payload: Record<string, unknown> = { sceneName: targetSceneName, name, type };
    if (type === "TextObject::Text") {
      const quoted = text.match(/["“]([^"”]+)["”]/u);
      payload["text"] = quoted?.[1] ?? "Texto";
    }
    operations.push(createOperation("create_object", payload));
    summaryParts.push(
      `Crear objeto «${name}» (${type === "TextObject::Text" ? "texto" : "sprite"})`,
    );
  }

  const wantsRename = /\brenombra\b|\bcambia el nombre\b/.test(normalized);
  if (wantsRename && !wantsObject) {
    const from = extractName(text, /renombra|cambia el nombre/);
    const to = text
      .match(/(?:\ba|\bcomo)\s+(?:["“])?([^"”.,;]{2,60}?)(?:["”])?(?:\s*[.,;]|$)/i)?.[1]
      ?.trim();
    const object = objectByName(from);
    if (!object) {
      return {
        plan: null,
        reason: from
          ? `No existe el objeto «${from}».`
          : "Indica qué objeto renombrar y su nuevo nombre.",
      };
    }
    if (!to || to === object.name) {
      return { plan: null, reason: "Indica el nuevo nombre después de «a»." };
    }
    operations.push(
      createOperation("update_object", {
        sceneName: targetSceneName,
        objectId: object.id,
        patch: { name: to },
      }),
    );
    summaryParts.push(`Renombrar «${object.name}» a «${to}»`);
  }

  const wantsDeleteObject = /\b(?:elimina|eliminar|borra|borrar|quita|quitar)\b/.test(normalized);
  if (wantsDeleteObject && !wantsRename && !wantsObject) {
    const name = extractName(text, /elimina|eliminar|borra|borrar|quita|quitar/);
    const object = objectByName(name);
    if (!object) {
      return {
        plan: null,
        reason: name ? `No existe el objeto «${name}».` : "Indica qué objeto quieres eliminar.",
      };
    }
    operations.push(
      createOperation("delete_object", { sceneName: targetSceneName, objectId: object.id }),
    );
    summaryParts.push(`Eliminar objeto «${object.name}»`);
  }

  /* ----------------------------------------------------------- instances */
  const wantsInstance =
    /\binstancia\b/.test(normalized) &&
    /(?:crea|crear|pon|poner|anade|anadir|agrega|agregar|coloca|colocar)\b/.test(normalized);
  if (wantsInstance) {
    const name = extractName(text, /instancia/);
    const object = objectByName(name);
    if (!object) {
      return {
        plan: null,
        reason: name
          ? `No existe el objeto «${name}» del que crear una instancia.`
          : "Indica el objeto del que quieres una instancia («añade una instancia de Moneda»).",
      };
    }
    const pairMatch = normalized.match(
      /\ben\s*\(?\s*(-?\d+(?:[.,]\d+)?)[,;]\s*(-?\d+(?:[.,]\d+)?)/,
    );
    const pair = pairMatch
      ? { x: Number(pairMatch[1]!.replace(",", ".")), y: Number(pairMatch[2]!.replace(",", ".")) }
      : (context.cursorPosition ?? null);
    const center = {
      x: Math.round(project.gameSettings.windowWidth / 2),
      y: Math.round(project.gameSettings.windowHeight / 2),
    };
    operations.push(
      createOperation("create_instance", {
        sceneName: targetSceneName,
        objectId: object.id,
        x: pair ? Math.round(pair.x) : center.x,
        y: pair ? Math.round(pair.y) : center.y,
      }),
    );
    summaryParts.push(`Añadir instancia de «${object.name}»`);
  }

  const wantsMove = /\b(?:mueve|mover|desplaza|desplazar)\b/.test(normalized);
  if (wantsMove && !wantsInstance && !hasEventTrigger) {
    const name = extractName(text, /mueve|mover|desplaza|desplazar/);
    const instance = firstInstanceByName(lookupScene, name);
    if (!instance) {
      return {
        plan: null,
        reason: name
          ? `No hay ninguna instancia de «${name}» en la escena.`
          : "Indica qué instancia quieres mover («mueve Moneda a 200,100»).",
      };
    }
    let x: number | null = null;
    let y: number | null = null;
    const absolute = normalized.match(/\ba\s*\(?\s*(-?\d+(?:[.,]\d+)?)[,;]\s*(-?\d+(?:[.,]\d+)?)/);
    if (absolute?.[1] && absolute[2]) {
      x = Number(absolute[1].replace(",", "."));
      y = Number(absolute[2].replace(",", "."));
    } else {
      const relative = normalized.match(
        /(-?\d+(?:[.,]\d+)?)\s*(?:px|pixeles?)?\s+(?:a la |hacia )?(derecha|izquierda|arriba|abajo)|\b(derecha|izquierda|arriba|abajo)\s+(?:en |por )?(-?\d+(?:[.,]\d+)?)\s*(?:px|pixeles?)?/,
      );
      if (relative) {
        const axis = relative[2] ?? relative[3];
        const amount =
          Math.abs(Number((relative[1] ?? relative[4] ?? "0").replace(",", "."))) || 32;
        if (axis === "derecha") x = instance.x + amount;
        else if (axis === "izquierda") x = instance.x - amount;
        else if (axis === "arriba") y = instance.y - amount;
        else if (axis === "abajo") y = instance.y + amount;
      }
    }
    if (x === null || y === null) {
      return { plan: null, reason: "Indica a dónde moverla: «a 200,100» o «32 a la derecha»." };
    }
    operations.push(
      createOperation("move_instance", {
        sceneName: targetSceneName,
        instanceId: instance.id,
        x: Math.round(x),
        y: Math.round(y),
      }),
    );
    summaryParts.push(`Mover instancia de «${objectNameOfInstance(lookupScene, instance.id)}»`);
  }

  const wantsResize =
    /(\d+)\s*[x×]\s*(\d+)/.test(normalized) &&
    /(?:tamano|tamaño|haz|hacer|redimensiona|redimensionar|dimension)\b/.test(normalized);
  if (wantsResize && !wantsMove && !wantsInstance) {
    const sizeMatch = normalized.match(/(\d+)\s*[x×]\s*(\d+)/)!;
    const name = extractName(text, /haz|hacer|redimensiona|redimensionar|tamano|de/);
    const instance = firstInstanceByName(lookupScene, name);
    if (!instance) {
      return {
        plan: null,
        reason: name
          ? `No hay ninguna instancia de «${name}» en la escena.`
          : "Indica qué instancia quieres redimensionar («haz Moneda de tamaño 48x48»).",
      };
    }
    operations.push(
      createOperation("resize_instance", {
        sceneName: targetSceneName,
        instanceId: instance.id,
        width: Number(sizeMatch[1]),
        height: Number(sizeMatch[2]),
      }),
    );
    summaryParts.push(`Redimensionar instancia a ${sizeMatch[1]}×${sizeMatch[2]}`);
  }

  /* ----------------------------------------------------------- behaviors */
  const wantsAddBehavior =
    /(?:anade|anadir|agrega|agregar|pon|poner|dale|dar)\b[^.]*?\bcomportamiento\b/.test(normalized);
  const wantsRemoveBehavior =
    /(?:quita|quitar|elimina|eliminar|retira|retirar)\b[^.]*?\bcomportamiento\b/.test(normalized);
  const BEHAVIOR_ALIASES: ReadonlyArray<[RegExp, string]> = [
    [/platformer|jugador|personaje|player/, "PlatformBehavior::PlatformerObjectBehavior"],
    [/plataforma|platform/, "PlatformBehavior::PlatformBehavior"],
    [/ancla|anchor/, "AnchorBehavior::AnchorBehavior"],
    [/destello|flash/, "Flash::Flash"],
    [/vida|salud|health/, "Health::Health"],
    [/tween/, "Tween::TweenBehavior"],
    [/arrastrable|drag/, "DraggableBehavior::Draggable"],
  ];
  if (wantsAddBehavior || wantsRemoveBehavior) {
    // Match the alias against the descriptor between "comportamiento" and the
    // target object ("a X" / "de X" at the tail), never against the object
    // name itself ("…plataforma a Jugador" must not match /jugador/).
    const behaviorAt = normalized.indexOf("comportamiento");
    let behaviorSegment =
      behaviorAt >= 0 ? normalized.slice(behaviorAt + "comportamiento".length) : normalized;
    const tailRef = behaviorSegment.match(/(?:\s+a\s+|\s+de\s+)[a-z0-9 _-]+\s*$/);
    if (tailRef?.index !== undefined) behaviorSegment = behaviorSegment.slice(0, tailRef.index);
    const alias = BEHAVIOR_ALIASES.find(([pattern]) => pattern.test(behaviorSegment));
    const type = alias?.[1];
    const objectName = objectAtTail(text);
    const object = objectByName(objectName);
    if (!type || !object) {
      return {
        plan: null,
        reason:
          "Indica el comportamiento (plataforma, platformer, ancla, flash, vida, tween o arrastrable) y el objeto («añade el comportamiento plataforma a Jugador»).",
      };
    }
    if (wantsAddBehavior) {
      if (!isSupportedBehavior(type)) {
        return {
          plan: null,
          reason: `El comportamiento «${type}» no está soportado por el runtime.`,
        };
      }
      if (object.behaviors.some((behavior) => behavior.type === type)) {
        return { plan: null, reason: `«${object.name}» ya tiene ese comportamiento.` };
      }
      const defaults = BEHAVIOR_DEFAULT_PROPERTIES[type];
      operations.push(
        createOperation("add_behavior", {
          sceneName: targetSceneName,
          objectId: object.id,
          ...(defaults ? { properties: { ...defaults } } : {}),
          type,
        }),
      );
      summaryParts.push(`Añadir comportamiento a «${object.name}»`);
    } else {
      const behavior = object.behaviors.find((candidate) => candidate.type === type);
      if (!behavior) {
        return { plan: null, reason: `«${object.name}» no tiene ese comportamiento.` };
      }
      operations.push(
        createOperation("remove_behavior", {
          sceneName: targetSceneName,
          objectId: object.id,
          behaviorName: behavior.name,
        }),
      );
      summaryParts.push(`Quitar comportamiento de «${object.name}»`);
    }
  }

  /* ----------------------------------------------------------- variables */
  const wantsVariable =
    /(?:crea|crear|anade|anadir|agrega|agregar)\b[^.]*?\bvariable\b/.test(normalized) ||
    /\bvariables?\s+[a-z0-9_]{2,40}\b/.test(normalized);
  if (wantsVariable) {
    const variableText = text.replace(
      /\bglobal\b|\bbooleana\b|\bbooleano\b|\bnumérica\b|\bnumerica\b/gi,
      " ",
    );
    const name = extractName(variableText, /variable/);
    if (!name) {
      return { plan: null, reason: "Indica el nombre de la variable (por ejemplo «puntos»)." };
    }
    let type: "number" | "string" | "boolean" = "number";
    if (/\b(texto|cadena|string|literal)\b/.test(normalized)) type = "string";
    else if (/\b(boolean|booleana|booleano|flag|bandera)\b/.test(normalized)) type = "boolean";
    const scope = /\bglobal\b/.test(normalized) ? "global" : undefined;
    const valueMatch = normalized.match(/(?:con valor|valor)\s+(-?\d+(?:[.,]\d+)?)/);
    operations.push(
      createOperation("create_variable", {
        sceneName: targetSceneName,
        name,
        type,
        ...(valueMatch?.[1] ? { value: valueMatch[1].replace(",", ".") } : {}),
        ...(scope ? { scope } : {}),
      }),
    );
    summaryParts.push(`Crear variable «${name}»`);
  }

  /* ----------------------------------------------------------- collisions */
  const collisionAt = normalized.search(
    /\b(colisiona|colisione|choca|choque|toca|toque)\b[^.]*?\bcon\b/,
  );
  if (collisionAt >= 0 && !wantsAddBehavior && !wantsRemoveBehavior) {
    const mentions = lookupScene
      ? lookupScene.objects
          .map((object) => ({ object, index: normalized.indexOf(normalize(object.name)) }))
          .filter((entry) => entry.index >= 0)
          .sort((a, b) => a.index - b.index)
      : [];
    const picked: string[] = [];
    for (const { object } of mentions) {
      const name = object.name;
      const shadows = picked.some(
        (chosen) => chosen !== name && (chosen.includes(name) || name.includes(chosen)),
      );
      if (!shadows && !picked.includes(name)) picked.push(name);
      if (picked.length === 2) break;
    }
    if (picked.length < 2) {
      return {
        plan: null,
        reason:
          "Indica los dos objetos de la colisión («cuando Jugador colisiona con Moneda, destruye Moneda»).",
      };
    }
    const a = picked[0];
    const b = picked[1];
    if (!a || !b) {
      return {
        plan: null,
        reason:
          "Indica los dos objetos de la colisión («cuando Jugador colisiona con Moneda, destruye Moneda»).",
      };
    }
    let deleteTarget: "A" | "B" | "none" = "none";
    const destroyAt = normalized.search(/\b(destruye|destruir|elimina|eliminar|borra)\b/);
    if (destroyAt >= 0) {
      const after = normalized
        .slice(destroyAt)
        .match(/\b(?:destruye|destruir|elimina|eliminar|borra)\s+([a-z0-9 _-]+)/);
      const mentioned = after?.[1]?.toLowerCase();
      if (mentioned) {
        if (a.toLowerCase().includes(mentioned) || mentioned.includes(a.toLowerCase()))
          deleteTarget = "A";
        else if (b.toLowerCase().includes(mentioned) || mentioned.includes(b.toLowerCase()))
          deleteTarget = "B";
      }
    }
    operations.push(
      createOperation("add_collision", {
        sceneName: targetSceneName,
        objectA: a,
        objectB: b,
        ...(deleteTarget !== "none" ? { deleteTarget } : {}),
      }),
    );
    summaryParts.push(
      `Colisión «${a}» ↔ «${b}»${deleteTarget !== "none" ? ` (destruye ${deleteTarget === "A" ? a : b})` : ""}`,
    );
  }

  /* --------------------------------------------------- events (fallback) */
  if (
    operations.length === 0 &&
    lookupScene &&
    /\b(colisiona|al presionar|tecla|cuando|al comenzar|inicio de la escena|cada\s+\d+\s+segundos|clic|click|reproduce|mover|crea|elimina)\b/.test(
      normalized,
    )
  ) {
    try {
      const events = compileIntentToEvents(text, {
        objectNames: lookupScene.objects.map((object) => object.name),
        sceneNames: project.scenes.map((entry) => entry.name),
        audioResources: project.resources
          .filter((resource) => resource.kind === "audio")
          .map((resource) => resource.name),
        activeLayer: lookupScene.activeLayer,
      });
      const eventPlan = eventsToAgentPlan(events, targetSceneName);
      operations.push(...eventPlan.operations);
      summaryParts.push(eventPlan.summary);
    } catch (error) {
      return {
        plan: null,
        reason: error instanceof Error ? error.message : "No pude interpretar la automatización.",
      };
    }
  }

  if (operations.length === 0) {
    return {
      plan: null,
      reason:
        "No pude convertir esa instrucción en un plan seguro. Prueba «crea la escena Nivel 2», «añade una instancia de Moneda en 200,100», «añade el comportamiento plataforma a Jugador», «crea la variable puntos» o «cuando Jugador colisiona con Moneda, destruye Moneda». Para automatizaciones complejas usa la barra de automatización (Ctrl/⌘K).",
    };
  }

  const plan: AgentPlan = createPlan(
    summaryParts.join(" · "),
    operations,
    targetSceneName !== context.activeSceneName ? targetSceneName : undefined,
  );
  return { plan };
}
