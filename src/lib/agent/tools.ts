// Game Tool Registry — the agent's only way to change the project.
//
// Every tool is a PURE transformation GDProject → GDProject (no React state,
// no files, no network). The AI model picks tools and payloads; the validator
// (validator.ts + capabilities.ts) is the trust boundary; applyPlan
// (operations.ts) executes the batch atomically with full snapshots for
// rollback.
//
// Tools listed in the brief but not implemented yet are REGISTERED with
// supported=false and an honest reason: the agent reports "aún no soportado"
// instead of faking the capability.
//
// Importable under plain Node (tests/conformance): relative imports carry
// explicit .ts extensions and this module never imports Vite-only assets.

import type {
  GDEvent,
  GDInstruction,
  GDInstance,
  GDObjectAnimation,
  GDObjectBehavior,
  GDObjectDef,
  GDProject,
  GDScene,
  GDVariable,
} from "../editor/types.ts";
import { uid } from "../editor/ids.ts";
import { newNameGenerator } from "../editor/ids.ts";
import { BASE_LAYER_NAME, makeScene, withScene } from "../editor/scenes.ts";
import { instructionContractError, type InstructionRefs } from "../editor/ai-logic.ts";
import {
  BEHAVIOR_DEFAULT_PROPERTIES,
  isCatalogOnlyBehavior,
  isCreatableObjectType,
  isSupportedBehavior,
  isSupportedInstruction,
  unsupportedBehaviorMessage,
  unsupportedInstructionMessage,
} from "./capabilities.ts";
import {
  inRange,
  isGDevelopColor,
  isHexColor,
  MAX_COORDINATE,
  MAX_DIMENSION,
  safeName,
  safeText,
} from "./schemas.ts";
import type {
  EntityRef,
  OperationOutcome,
  ProjectOperation,
  ToolDefinition,
} from "./operations.ts";

// ---------------------------------------------------------------------------
// Payload types (the contract the AI model must respect)
// ---------------------------------------------------------------------------

export interface CreateScenePayload {
  name: string;
}
export interface DuplicateScenePayload {
  sceneName: string;
  newName?: string;
}
export interface UpdateScenePayload {
  sceneName: string;
  backgroundColor?: string;
}
export interface CreateObjectPayload {
  sceneName: string;
  name: string;
  /** Object type id, e.g. "Sprite" or "TextObject::Text". */
  type: string;
  text?: string;
  /** Resource name for the first animation frame (sprite-like objects). */
  asset?: string;
}
export interface UpdateObjectPayload {
  sceneName: string;
  objectId: string;
  patch: {
    name?: string;
    text?: string;
    textColor?: string;
    textSize?: number;
    bold?: boolean;
    italic?: boolean;
  };
}
export interface DeleteObjectPayload {
  sceneName: string;
  objectId: string;
}
export interface CreateInstancePayload {
  sceneName: string;
  objectId: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
}
export interface MoveInstancePayload {
  sceneName: string;
  instanceId: string;
  x: number;
  y: number;
}
export interface ResizeInstancePayload {
  sceneName: string;
  instanceId: string;
  width: number;
  height: number;
}
export interface AssignSpritePayload {
  sceneName: string;
  objectId: string;
  /** Existing resource name (project.resources) or "" for a placeholder. */
  resource: string;
}
export interface CreateAnimationPayload {
  sceneName: string;
  objectId: string;
  name: string;
  resource?: string;
}
export interface AddBehaviorPayload {
  sceneName: string;
  objectId: string;
  /** Instance name inside the object; defaults to the behavior short name. */
  name?: string;
  /** Behavior type id, e.g. "PlatformBehavior::PlatformerObjectBehavior". */
  type: string;
  properties?: Record<string, string>;
}
export interface RemoveBehaviorPayload {
  sceneName: string;
  objectId: string;
  behaviorName: string;
}
export type VariableType = "number" | "string" | "boolean";
export interface CreateVariablePayload {
  sceneName: string;
  name: string;
  type: VariableType;
  value?: string;
  /** "scene" (default) or "global" (project-wide). */
  scope?: "scene" | "global";
}
export interface InstructionPayload {
  id?: string;
  /** Instruction typeId from the runtime capability matrix. */
  typeId: string;
  parameters?: Record<string, string>;
  inverted?: boolean;
}
export interface CreateEventPayload {
  sceneName: string;
  conditions?: InstructionPayload[];
  actions?: InstructionPayload[];
}
export interface UpdateEventPayload {
  sceneName: string;
  eventId: string;
  conditions?: InstructionPayload[];
  actions?: InstructionPayload[];
  disabled?: boolean;
}
export interface AddCollisionPayload {
  sceneName: string;
  /** Object names (GDevelop references objects by name in events). */
  objectA: string;
  objectB: string;
  /** Optional follow-up action: destroy one side on contact. */
  deleteTarget?: "A" | "B" | "none";
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const sceneOf = (project: GDProject, sceneName: string): GDScene | undefined =>
  project.scenes.find((scene) => scene.name === sceneName);

const requireScene = (project: GDProject, sceneName: unknown): GDScene | null => {
  if (typeof sceneName !== "string" || sceneName.trim().length === 0) {
    return null;
  }
  const scene = sceneOf(project, sceneName);
  return scene ?? null;
};

const sceneError = (sceneName: unknown): string | null =>
  typeof sceneName === "string" && sceneName.trim().length > 0 ? null : "Falta indicar la escena.";

const requireObject = (scene: GDScene, objectId: unknown): GDObjectDef | null => {
  if (typeof objectId !== "string") return null;
  return scene.objects.find((object) => object.id === objectId) ?? null;
};

const requireInstance = (scene: GDScene, instanceId: unknown): GDInstance | null => {
  if (typeof instanceId !== "string") return null;
  return scene.instances.find((instance) => instance.id === instanceId) ?? null;
};

const requireObjectName = (scene: GDScene, name: unknown): GDObjectDef | null => {
  if (typeof name !== "string" || name.trim().length === 0) return null;
  return scene.objects.find((object) => object.name === name) ?? null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const ok = (
  project: GDProject,
  changes: {
    created?: EntityRef[];
    modified?: EntityRef[];
    deleted?: EntityRef[];
    diagnostics?: OperationOutcome["diagnostics"];
  } = {},
): OperationOutcome => ({
  project,
  diagnostics: changes.diagnostics ?? [],
  created: changes.created ?? [],
  modified: changes.modified ?? [],
  deleted: changes.deleted ?? [],
});

const defaultVariableValue = (type: VariableType): string =>
  type === "boolean" ? "false" : type === "string" ? "" : "0";

const toInstruction = (payload: InstructionPayload): GDInstruction => ({
  id: payload.id ?? uid("inst"),
  typeId: payload.typeId,
  inverted: payload.inverted === true,
  parameters: payload.parameters ?? {},
});

const validateInstructions = (
  instructions: unknown,
  label: string,
  expectedSlot: "condition" | "action",
  scene: GDScene | null,
  project: GDProject,
): string | null => {
  if (instructions === undefined) return null;
  if (!Array.isArray(instructions) || instructions.length > 50) {
    return `${label}: lista de instrucciones no válida (máximo 50).`;
  }
    const refs: InstructionRefs = {
    objectNames: scene?.objects.map((object) => object.name) ?? [],
    sceneNames: project.scenes.map((entry) => entry.name),
    audioResources: project.resources
      .filter((resource) => resource.kind === "audio")
      .map((resource) => resource.name),
  };
  for (const item of instructions) {
    if (!isRecord(item) || typeof item["typeId"] !== "string") {
      return `${label}: cada instrucción necesita un typeId.`;
    }
    if (!isSupportedInstruction(item["typeId"])) {
      return unsupportedInstructionMessage(item["typeId"]);
    }
    if (item["parameters"] !== undefined && !isRecord(item["parameters"])) {
      return `${label}: los parámetros de «${item["typeId"]}» no son válidos.`;
    }
    const contractError = instructionContractError(
      item["typeId"],
      expectedSlot,
      (item["parameters"] ?? {}) as Record<string, string>,
      refs,
    );
    if (contractError) return `${label}: ${contractError}`;
  }
  return null;
};

const cloneEvent = (event: GDEvent): GDEvent => ({
  ...event,
  id: uid("event"),
  conditions: event.conditions.map((instruction) => ({ ...instruction, id: uid("inst") })),
  actions: event.actions.map((instruction) => ({ ...instruction, id: uid("inst") })),
  subEvents: event.subEvents.map(cloneEvent),
});

const maxZOrder = (scene: GDScene): number =>
  scene.instances.reduce((max, instance) => Math.max(max, instance.zOrder), 0) + 1;

const layerOf = (scene: GDScene): string =>
  scene.activeLayer || scene.layers[0]?.name || BASE_LAYER_NAME;

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  // -- scenes ----------------------------------------------------------------
  create_scene: {
    name: "create_scene",
    label: "Crear escena",
    description: "Crea una escena vacía con su capa base.",
    mutates: true,
    supported: true,
    validate: (payload, project) => {
      if (!isRecord(payload)) return "create_scene: payload no válido.";

      const p = payload as unknown as CreateScenePayload;
      const error = safeName(p.name, "nombre de escena");
      if (error) return error;
      if (sceneOf(project, (p.name as string).trim())) {
        return `Ya existe una escena llamada «${(p.name as string).trim()}».`;
      }
      return null;
    },
    run: (project, payload) => {
      const p = payload as unknown as CreateScenePayload;
      const name = p.name.trim();
      const next = { ...project, scenes: [...project.scenes, makeScene(name)] };
      return ok(next, { created: [{ kind: "scene", id: name, name }] });
    },
  },

  duplicate_scene: {
    name: "duplicate_scene",
    label: "Duplicar escena",
    description: "Copia una escena con objetos, instancias y eventos nuevos.",
    mutates: true,
    supported: true,
    validate: (payload, project) => {
      if (!isRecord(payload)) return "duplicate_scene: payload no válido.";

      const p = payload as unknown as DuplicateScenePayload;
      const scene = requireScene(project, p.sceneName);
      if (!scene) return `No existe la escena «${String(p.sceneName)}».`;
      let error: string | null = null;
      if (p.newName !== undefined) {
        error = safeName(p.newName, "nuevo nombre de escena");
        if (!error) {
          const candidate = (p.newName as string).trim();
          if (sceneOf(project, candidate)) error = `Ya existe una escena llamada «${candidate}».`;
        }
      }
      return error;
    },
    run: (project, payload) => {
      const p = payload as unknown as DuplicateScenePayload;
      const source = requireScene(project, p.sceneName)!;
      const name =
        p.newName?.trim() ??
        newNameGenerator(
          `${source.name} (copia)`,
          project.scenes.map((s) => s.name),
        );
      const idMap = new Map<string, string>();
      const objects = source.objects.map((object) => {
        const nextId = uid("obj");
        idMap.set(object.id, nextId);
        return { ...object, id: nextId };
      });
      const copy: GDScene = {
        ...source,
        name,
        objects,
        instances: source.instances.map((instance) => ({
          ...instance,
          id: uid("inst"),
          objectId: idMap.get(instance.objectId) ?? instance.objectId,
        })),
        events: source.events.map(cloneEvent),
      };
      return ok(
        { ...project, scenes: [...project.scenes, copy] },
        {
          created: [{ kind: "scene", id: name, name }],
        },
      );
    },
  },

  update_scene: {
    name: "update_scene",
    label: "Modificar escena",
    description: "Cambia propiedades seguras de la escena (color de fondo).",
    mutates: true,
    supported: true,
    validate: (payload, project) => {
      if (!isRecord(payload)) return "update_scene: payload no válido.";

      const p = payload as unknown as UpdateScenePayload;
      const error = sceneError(p.sceneName);
      if (error) return error;
      const scene = requireScene(project, p.sceneName);
      if (!scene) return `No existe la escena «${String(p.sceneName)}».`;
      if (p.backgroundColor !== undefined && !isGDevelopColor(p.backgroundColor)) {
        return "El color de fondo debe tener el formato «R;G;B» (p. ej. «230;235;255»).";
      }
      if (p.backgroundColor === undefined) {
        return "update_scene: indica al menos una propiedad (backgroundColor).";
      }
      return null;
    },
    run: (project, payload) => {
      const p = payload as unknown as UpdateScenePayload;
      const next = withScene(project, p.sceneName, (scene) => ({
        ...scene,
        ...(p.backgroundColor !== undefined ? { backgroundColor: p.backgroundColor } : {}),
      }));
      return ok(next, { modified: [{ kind: "scene", id: p.sceneName, name: p.sceneName }] });
    },
  },

  // -- objects -----------------------------------------------------------------
  create_object: {
    name: "create_object",
    label: "Crear objeto",
    description:
      "Crea una definición de objeto (Sprite, Texto, Mosaico…) en la escena. Usa tipos que el runtime dibuja.",
    mutates: true,
    supported: true,
    validate: (payload, project) => {
      if (!isRecord(payload)) return "create_object: payload no válido.";

      const p = payload as unknown as CreateObjectPayload;
      const sceneError = safeName(p.name, "nombre de objeto");
      if (sceneError) return sceneError;
      if (!isCreatableObjectType(String(p.type))) {
        return (
          `El tipo de objeto «${String(p.type)}» no está soportado por el runtime. ` +
          "Usa Sprite, Texto, Mosaico, Sprite de Panel, Hoja de sprites, Texto BBCode o Bitmap Text."
        );
      }
      const scene = requireScene(project, p.sceneName);
      if (!scene) return `No existe la escena «${String(p.sceneName)}».`;
      const name = (p.name as string).trim();
      if (scene.objects.some((object) => object.name === name)) {
        return `Ya existe un objeto llamado «${name}» en la escena.`;
      }
      const isText =
        String(p.type) === "TextObject::Text" ||
        String(p.type) === "BBTextObject::BBText" ||
        String(p.type) === "BitmapTextObject::BitmapText";
      if (isText && p.text !== undefined) {
        return safeText(p.text, "texto", 2_000);
      }
      return null;
    },
    run: (project, payload) => {
      const p = payload as unknown as CreateObjectPayload;
      const isText =
        p.type === "TextObject::Text" ||
        p.type === "BBTextObject::BBText" ||
        p.type === "BitmapTextObject::BitmapText";
      const object: GDObjectDef = {
        id: uid("obj"),
        name: p.name.trim(),
        type: p.type,
        behaviors: [],
        effects: [],
        variables: [],
        ...(isText
          ? {
              text: p.text ?? "Texto",
              textColor: "#ffffff",
              textSize: 24,
              fontFamily: "Arial",
              bold: false,
              italic: false,
              alignment: "left" as const,
              wrapping: false,
            }
          : {}),
        ...(!isText && p.asset !== undefined ? { asset: p.asset } : {}),
      };
      const next = withScene(project, p.sceneName, (scene) => ({
        ...scene,
        objects: [...scene.objects, object],
      }));
      return ok(next, { created: [{ kind: "object", id: object.id, name: object.name }] });
    },
  },

  update_object: {
    name: "update_object",
    label: "Modificar objeto",
    description:
      "Cambia propiedades seguras de un objeto: nombre (sincroniza eventos y grupos), texto, color, tamaño, negrita, cursiva.",
    mutates: true,
    supported: true,
    validate: (payload, project) => {
      if (!isRecord(payload)) return "update_object: payload no válido.";

      const p = payload as unknown as UpdateObjectPayload;
      const scene = requireScene(project, p.sceneName);
      if (!scene) return `No existe la escena «${String(p.sceneName)}».`;
      const object = requireObject(scene, p.objectId);
      if (!object) return `No existe el objeto con id «${String(p.objectId)}».`;
      const patch = p.patch;
      if (!isRecord(patch) || Object.keys(patch).length === 0) {
        return "update_object: el patch está vacío.";
      }
      const allowed = new Set(["name", "text", "textColor", "textSize", "bold", "italic"]);
      if (Object.keys(patch).some((key) => !allowed.has(key))) {
        return "update_object: solo se permiten name, text, textColor, textSize, bold, italic.";
      }
      if (patch.name !== undefined) {
        const error = safeName(patch.name, "nuevo nombre");
        if (error) return error;
        const candidate = (patch.name as string).trim();
        if (scene.objects.some((item) => item.name === candidate && item.id !== object.id)) {
          return `Ya existe un objeto llamado «${candidate}».`;
        }
      }
      if (patch.text !== undefined && safeText(patch.text, "texto", 2_000)) {
        return safeText(patch.text, "texto", 2_000);
      }
      if (patch.textColor !== undefined && !isHexColor(patch.textColor)) {
        return "textColor debe ser un color hexadecimal (#RRGGBB).";
      }
      if (patch.textSize !== undefined && !inRange(patch.textSize, "textSize", 4, 512)) {
        return "textSize debe estar entre 4 y 512.";
      }
      return null;
    },
    run: (project, payload) => {
      const p = payload as unknown as UpdateObjectPayload;
      const oldName = sceneOf(project, p.sceneName)?.objects.find(
        (item) => item.id === p.objectId,
      )?.name;
      let renameFrom: string | null = null;
      let renameTo: string | null = null;
      if (p.patch.name && oldName && p.patch.name !== oldName) {
        renameFrom = oldName;
        renameTo = p.patch.name;
      }
      const next = withScene(project, p.sceneName, (scene) => {
        const objects = scene.objects.map((item) =>
          item.id === p.objectId ? { ...item, ...p.patch } : item,
        );
        if (renameFrom && renameTo) {
          return {
            ...scene,
            objects,
            groups: scene.groups.map((group) => ({
              ...group,
              objects: group.objects.map((name) => (name === renameFrom ? renameTo : name)),
            })),
            events: scene.events.map((event) => renameObjectInEvent(event, renameFrom, renameTo)),
          };
        }
        return { ...scene, objects };
      });
      const object = sceneOf(project, p.sceneName)?.objects.find((item) => item.id === p.objectId);
      return ok(next, {
        modified: [{ kind: "object", id: p.objectId, name: object?.name ?? p.objectId }],
      });
    },
  },

  delete_object: {
    name: "delete_object",
    label: "Eliminar objeto",
    description: "Elimina la definición de objeto, sus instancias y referencias en grupos.",
    mutates: true,
    supported: true,
    validate: (payload, project) => {
      if (!isRecord(payload)) return "delete_object: payload no válido.";

      const p = payload as unknown as DeleteObjectPayload;
      const scene = requireScene(project, p.sceneName);
      if (!scene) return `No existe la escena «${String(p.sceneName)}».`;
      if (!requireObject(scene, p.objectId)) {
        return `No existe el objeto con id «${String(p.objectId)}».`;
      }
      return null;
    },
    run: (project, payload) => {
      const p = payload as unknown as DeleteObjectPayload;
      const target = requireObject(requireScene(project, p.sceneName)!, p.objectId)!;
      const next = withScene(project, p.sceneName, (scene) => ({
        ...scene,
        objects: scene.objects.filter((item) => item.id !== p.objectId),
        instances: scene.instances.filter((instance) => instance.objectId !== p.objectId),
        groups: scene.groups.map((group) => ({
          ...group,
          objects: group.objects.filter((name) => name !== target.name),
        })),
      }));
      const removedInstances = requireScene(project, p.sceneName)!.instances.filter(
        (instance) => instance.objectId === p.objectId,
      ).length;
      return ok(next, {
        deleted: [
          { kind: "object", id: target.id, name: target.name },
          ...(removedInstances > 0
            ? [
                {
                  kind: "instance" as const,
                  id: p.objectId,
                  name: `${removedInstances} instancias de ${target.name}`,
                },
              ]
            : []),
        ],
      });
    },
  },

  // -- instances ----------------------------------------------------------------
  create_instance: {
    name: "create_instance",
    label: "Crear instancia",
    description: "Coloca una instancia de un objeto existente en la escena.",
    mutates: true,
    supported: true,
    validate: (payload, project) => {
      if (!isRecord(payload)) return "create_instance: payload no válido.";

      const p = payload as unknown as CreateInstancePayload;
      const scene = requireScene(project, p.sceneName);
      if (!scene) return `No existe la escena «${String(p.sceneName)}».`;
      if (!requireObject(scene, p.objectId)) {
        return `No existe el objeto con id «${String(p.objectId)}».`;
      }
      if (!inRange(p.x, "posición X", -MAX_COORDINATE, MAX_COORDINATE)) {
        return `x debe estar entre ${-MAX_COORDINATE} y ${MAX_COORDINATE}.`;
      }
      if (!inRange(p.y, "posición Y", -MAX_COORDINATE, MAX_COORDINATE)) {
        return `y debe estar entre ${-MAX_COORDINATE} y ${MAX_COORDINATE}.`;
      }
      if (p.width !== undefined && !inRange(p.width, "ancho", 1, MAX_DIMENSION)) {
        return `width debe estar entre 1 y ${MAX_DIMENSION}.`;
      }
      if (p.height !== undefined && !inRange(p.height, "alto", 1, MAX_DIMENSION)) {
        return `height debe estar entre 1 y ${MAX_DIMENSION}.`;
      }
      return null;
    },
    run: (project, payload) => {
      const p = payload as unknown as CreateInstancePayload;
      const scene = requireScene(project, p.sceneName)!;
      const object = requireObject(scene, p.objectId)!;
      const isText =
        object.type === "TextObject::Text" ||
        object.type === "BBTextObject::BBText" ||
        object.type === "BitmapTextObject::BitmapText";
      const instance: GDInstance = {
        id: uid("inst"),
        objectId: object.id,
        x: p.x,
        y: p.y,
        angle: 0,
        customSize: p.width !== undefined || p.height !== undefined,
        width: p.width ?? (isText ? 160 : 64),
        height: p.height ?? (isText ? 32 : 64),
        zOrder: maxZOrder(scene),
        layer: layerOf(scene),
        locked: false,
        hiddenAtStart: false,
        variables: [],
        effects: [],
      };
      const next = withScene(project, p.sceneName, (current) => ({
        ...current,
        instances: [...current.instances, instance],
      }));
      return ok(next, {
        created: [{ kind: "instance", id: instance.id, name: `Instancia de ${object.name}` }],
      });
    },
  },

  move_instance: {
    name: "move_instance",
    label: "Mover instancia",
    description: "Mueve una instancia a una posición absoluta.",
    mutates: true,
    supported: true,
    validate: (payload, project) => {
      if (!isRecord(payload)) return "move_instance: payload no válido.";

      const p = payload as unknown as MoveInstancePayload;
      const scene = requireScene(project, p.sceneName);
      if (!scene) return `No existe la escena «${String(p.sceneName)}».`;
      if (!requireInstance(scene, p.instanceId)) {
        return `No existe la instancia con id «${String(p.instanceId)}».`;
      }
      if (!inRange(p.x, "posición X", -MAX_COORDINATE, MAX_COORDINATE)) {
        return `x debe estar entre ${-MAX_COORDINATE} y ${MAX_COORDINATE}.`;
      }
      if (!inRange(p.y, "posición Y", -MAX_COORDINATE, MAX_COORDINATE)) {
        return `y debe estar entre ${-MAX_COORDINATE} y ${MAX_COORDINATE}.`;
      }
      return null;
    },
    run: (project, payload) => {
      const p = payload as unknown as MoveInstancePayload;
      const next = withScene(project, p.sceneName, (scene) => ({
        ...scene,
        instances: scene.instances.map((instance) =>
          instance.id === p.instanceId ? { ...instance, x: p.x, y: p.y } : instance,
        ),
      }));
      return ok(next, {
        modified: [{ kind: "instance", id: p.instanceId, name: p.instanceId }],
      });
    },
  },

  resize_instance: {
    name: "resize_instance",
    label: "Redimensionar instancia",
    description: "Cambia el tamaño de una instancia (activa el tamaño personalizado).",
    mutates: true,
    supported: true,
    validate: (payload, project) => {
      if (!isRecord(payload)) return "resize_instance: payload no válido.";

      const p = payload as unknown as ResizeInstancePayload;
      const scene = requireScene(project, p.sceneName);
      if (!scene) return `No existe la escena «${String(p.sceneName)}».`;
      if (!requireInstance(scene, p.instanceId)) {
        return `No existe la instancia con id «${String(p.instanceId)}».`;
      }
      if (!inRange(p.width, "ancho", 1, MAX_DIMENSION)) {
        return `width debe estar entre 1 y ${MAX_DIMENSION}.`;
      }
      if (!inRange(p.height, "alto", 1, MAX_DIMENSION)) {
        return `height debe estar entre 1 y ${MAX_DIMENSION}.`;
      }
      return null;
    },
    run: (project, payload) => {
      const p = payload as unknown as ResizeInstancePayload;
      const next = withScene(project, p.sceneName, (scene) => ({
        ...scene,
        instances: scene.instances.map((instance) =>
          instance.id === p.instanceId
            ? { ...instance, width: p.width, height: p.height, customSize: true }
            : instance,
        ),
      }));
      return ok(next, {
        modified: [{ kind: "instance", id: p.instanceId, name: p.instanceId }],
      });
    },
  },

  assign_sprite: {
    name: "assign_sprite",
    label: "Asignar sprite",
    description:
      "Asigna un recurso existente (o placeholder vacío) como imagen del objeto, actualizando el primer frame de su animación.",
    mutates: true,
    supported: true,
    validate: (payload, project) => {
      if (!isRecord(payload)) return "assign_sprite: payload no válido.";

      const p = payload as unknown as AssignSpritePayload;
      const scene = requireScene(project, p.sceneName);
      if (!scene) return `No existe la escena «${String(p.sceneName)}».`;
      const object = requireObject(scene, p.objectId);
      if (!object) return `No existe el objeto con id «${String(p.objectId)}».`;
      const resource = p.resource;
      if (typeof resource !== "string") return "assign_sprite: resource debe ser un nombre.";
      if (resource.length > 0) {
        const known =
          project.resources.some((entry) => entry.name === resource || entry.file === resource) ||
          /^(?:data:|blob:|https?:\/\/)/i.test(resource);
        if (!known) {
          return `El recurso «${resource}» no existe en el proyecto. Etapa 1 usa recursos existentes.`;
        }
      }
      return null;
    },
    run: (project, payload) => {
      const p = payload as unknown as AssignSpritePayload;
      const next = withScene(project, p.sceneName, (scene) => ({
        ...scene,
        objects: scene.objects.map((object) => {
          if (object.id !== p.objectId) return object;
          const animations = object.animations ?? [];
          const first = animations[0];
          const nextAnimations: GDObjectAnimation[] =
            animations.length === 0
              ? [
                  {
                    name: "Animación 1",
                    loops: true,
                    timeBetweenFrames: 1,
                    images: [
                      {
                        image: p.resource,
                        originX: 0,
                        originY: 0,
                        centerX: 32,
                        centerY: 32,
                        opacity: 100,
                      },
                    ],
                    points: [],
                  },
                ]
              : first
                ? animations.map((animation, index) =>
                    index === 0
                      ? {
                          ...animation,
                          images: animation.images.map((image, index2) =>
                            index2 === 0 ? { ...image, image: p.resource } : image,
                          ),
                        }
                      : animation,
                  )
                : animations;
          return {
            ...object,
            ...(p.resource.length > 0 ? { asset: p.resource } : {}),
            ...(nextAnimations.length > 0 ? { animations: nextAnimations } : {}),
          };
        }),
      }));
      return ok(next, {
        modified: [{ kind: "object", id: p.objectId, name: p.objectId }],
      });
    },
  },

  create_animation: {
    name: "create_animation",
    label: "Crear animación",
    description: "Añade una animación (un frame con el recurso indicado o el actual) a un objeto.",
    mutates: true,
    supported: true,
    validate: (payload, project) => {
      if (!isRecord(payload)) return "create_animation: payload no válido.";

      const p = payload as unknown as CreateAnimationPayload;
      const scene = requireScene(project, p.sceneName);
      if (!scene) return `No existe la escena «${String(p.sceneName)}».`;
      const object = requireObject(scene, p.objectId);
      if (!object) return `No existe el objeto con id «${String(p.objectId)}».`;
      const error = safeName(p.name, "nombre de animación");
      if (error) return error;
      const name = (p.name as string).trim();
      const existing = object.animations ?? [];
      if (existing.some((animation) => animation.name === name)) {
        return `El objeto ya tiene una animación llamada «${name}».`;
      }
      return null;
    },
    run: (project, payload) => {
      const p = payload as unknown as CreateAnimationPayload;
      const scene = requireScene(project, p.sceneName)!;
      const object = requireObject(scene, p.objectId)!;
      const resource =
        p.resource ??
        object.asset ??
        (object.animations?.[0]?.images[0]?.image as string | undefined) ??
        "";
      const animation: GDObjectAnimation = {
        name: p.name.trim(),
        loops: true,
        timeBetweenFrames: 1,
        images: [
          { image: resource, originX: 0, originY: 0, centerX: 32, centerY: 32, opacity: 100 },
        ],
        points: [],
      };
      const next = withScene(project, p.sceneName, (current) => ({
        ...current,
        objects: current.objects.map((item) =>
          item.id === p.objectId
            ? { ...item, animations: [...(item.animations ?? []), animation] }
            : item,
        ),
      }));
      return ok(next, {
        created: [
          { kind: "animation", id: animation.name, name: `${object.name} · ${animation.name}` },
        ],
      });
    },
  },

  // -- behaviors ------------------------------------------------------------------
  add_behavior: {
    name: "add_behavior",
    label: "Añadir comportamiento",
    description:
      "Añade un comportamiento que el runtime SIMULA (plataformas, anclar, salud, destello, tween, arrastrable). Los demás se rechazan con explicación.",
    mutates: true,
    supported: true,
    validate: (payload, project) => {
      if (!isRecord(payload)) return "add_behavior: payload no válido.";

      const p = payload as unknown as AddBehaviorPayload;
      const scene = requireScene(project, p.sceneName);
      if (!scene) return `No existe la escena «${String(p.sceneName)}».`;
      const object = requireObject(scene, p.objectId);
      if (!object) return `No existe el objeto con id «${String(p.objectId)}».`;
      const type = p.type;
      if (typeof type !== "string" || type.length === 0) {
        return "add_behavior: indica el typeId del comportamiento.";
      }
      if (!isSupportedBehavior(type)) {
        return unsupportedBehaviorMessage(type);
      }
      const name =
        typeof p.name === "string" && p.name.trim().length > 0
          ? p.name.trim()
          : type.split("::").pop()!;
      if (object.behaviors.some((behavior) => behavior.name === name)) {
        return `El objeto ya tiene un comportamiento llamado «${name}».`;
      }
      if (p.properties !== undefined && !isRecord(p.properties)) {
        return "add_behavior: properties debe ser un objeto de pares clave/valor.";
      }
      return null;
    },
    run: (project, payload) => {
      const p = payload as unknown as AddBehaviorPayload;
      const scene = requireScene(project, p.sceneName)!;
      const object = requireObject(scene, p.objectId)!;
      const behavior: GDObjectBehavior = {
        name:
          typeof p.name === "string" && p.name.trim().length > 0
            ? p.name.trim()
            : p.type.split("::").pop()!,
        type: p.type,
        properties: { ...(BEHAVIOR_DEFAULT_PROPERTIES[p.type] ?? {}), ...(p.properties ?? {}) },
      };
      const next = withScene(project, p.sceneName, (current) => ({
        ...current,
        objects: current.objects.map((item) =>
          item.id === p.objectId ? { ...item, behaviors: [...item.behaviors, behavior] } : item,
        ),
      }));
      return ok(next, {
        created: [
          { kind: "behavior", id: behavior.name, name: `${object.name} · ${behavior.name}` },
        ],
      });
    },
  },

  remove_behavior: {
    name: "remove_behavior",
    label: "Quitar comportamiento",
    description: "Elimina un comportamiento de un objeto por su nombre de instancia.",
    mutates: true,
    supported: true,
    validate: (payload, project) => {
      if (!isRecord(payload)) return "remove_behavior: payload no válido.";

      const p = payload as unknown as RemoveBehaviorPayload;
      const scene = requireScene(project, p.sceneName);
      if (!scene) return `No existe la escena «${String(p.sceneName)}».`;
      const object = requireObject(scene, p.objectId);
      if (!object) return `No existe el objeto con id «${String(p.objectId)}».`;
      if (!object.behaviors.some((behavior) => behavior.name === p.behaviorName)) {
        return `El objeto no tiene un comportamiento llamado «${String(p.behaviorName)}».`;
      }
      return null;
    },
    run: (project, payload) => {
      const p = payload as unknown as RemoveBehaviorPayload;
      const next = withScene(project, p.sceneName, (scene) => ({
        ...scene,
        objects: scene.objects.map((item) =>
          item.id === p.objectId
            ? {
                ...item,
                behaviors: item.behaviors.filter((behavior) => behavior.name !== p.behaviorName),
              }
            : item,
        ),
      }));
      return ok(next, {
        deleted: [{ kind: "behavior", id: p.behaviorName, name: p.behaviorName }],
      });
    },
  },

  // -- variables --------------------------------------------------------------------
  create_variable: {
    name: "create_variable",
    label: "Crear variable",
    description: "Crea una variable de escena (o global) de tipo número, cadena o booleano.",
    mutates: true,
    supported: true,
    validate: (payload, project) => {
      if (!isRecord(payload)) return "create_variable: payload no válido.";

      const p = payload as unknown as CreateVariablePayload;
      const error = safeName(p.name, "nombre de variable");
      if (error) return error;
      if (p.type !== "number" && p.type !== "string" && p.type !== "boolean") {
        return "create_variable: type debe ser number, string o boolean.";
      }
      const name = (p.name as string).trim();
      const scope = p.scope === "global" ? "global" : "scene";
      if (scope === "global") {
        if (project.globalVariables.some((variable) => variable.name === name)) {
          return `Ya existe una variable global llamada «${name}».`;
        }
      } else {
        const scene = requireScene(project, p.sceneName);
        if (!scene) return `No existe la escena «${String(p.sceneName)}».`;
        if (scene.variables.some((variable) => variable.name === name)) {
          return `La escena ya tiene una variable llamada «${name}».`;
        }
      }
      return null;
    },
    run: (project, payload) => {
      const p = payload as unknown as CreateVariablePayload;
      const name = p.name.trim();
      const type: VariableType = p.type;
      const variable: GDVariable = {
        name,
        type,
        value: p.value ?? defaultVariableValue(type),
        children: [],
      };
      const scope = p.scope === "global" ? "global" : "scene";
      const next =
        scope === "global"
          ? { ...project, globalVariables: [...project.globalVariables, variable] }
          : withScene(project, p.sceneName, (scene) => ({
              ...scene,
              variables: [...scene.variables, variable],
            }));
      return ok(next, {
        created: [
          {
            kind: "variable",
            id: name,
            name: `${name} (${scope === "global" ? "global" : "de escena"})`,
          },
        ],
      });
    },
  },

  // -- events -----------------------------------------------------------------------
  create_event: {
    name: "create_event",
    label: "Crear evento",
    description:
      "Crea un evento estándar con condiciones/acciones cuyas instrucciones estén soportadas por el runtime (matriz de capacidades).",
    mutates: true,
    supported: true,
    validate: (payload, project) => {
      if (!isRecord(payload)) return "create_event: payload no válido.";

      const p = payload as unknown as CreateEventPayload;
      const scene = requireScene(project, p.sceneName);
      if (!scene) return `No existe la escena «${String(p.sceneName)}».`;
      const conditionsError = validateInstructions(
        p.conditions,
        "create_event.conditions",
        "condition",
        scene,
        project,
      );
      if (conditionsError) return conditionsError;
      const actionsError = validateInstructions(
        p.actions,
        "create_event.actions",
        "action",
        scene,
        project,
      );
      if (actionsError) return actionsError;
      if (p.conditions === undefined && p.actions === undefined) {
        return "create_event: un evento necesita condiciones o acciones (o ambas).";
      }
      return null;
    },
    run: (project, payload) => {
      const p = payload as unknown as CreateEventPayload;
      const event: GDEvent = {
        id: uid("event"),
        kind: "standard",
        conditions: (p.conditions ?? []).map(toInstruction),
        actions: (p.actions ?? []).map(toInstruction),
        subEvents: [],
        collapsed: false,
      };
      const next = withScene(project, p.sceneName, (scene) => ({
        ...scene,
        events: [...scene.events, event],
      }));
      return ok(next, { created: [{ kind: "event", id: event.id, name: event.id }] });
    },
  },

  update_event: {
    name: "update_event",
    label: "Modificar evento",
    description: "Reemplaza las condiciones/acciones (o el estado) de un evento existente.",
    mutates: true,
    supported: true,
    validate: (payload, project) => {
      if (!isRecord(payload)) return "update_event: payload no válido.";

      const p = payload as unknown as UpdateEventPayload;
      const scene = requireScene(project, p.sceneName);
      if (!scene) return `No existe la escena «${String(p.sceneName)}».`;
      const event = findEvent(scene.events, p.eventId);
      if (!event) return `No existe el evento con id «${String(p.eventId)}».`;
      const conditionsError = validateInstructions(
        p.conditions,
        "update_event.conditions",
        "condition",
        scene,
        project,
      );
      if (conditionsError) return conditionsError;
      const actionsError = validateInstructions(
        p.actions,
        "update_event.actions",
        "action",
        scene,
        project,
      );
      if (actionsError) return actionsError;
      if (p.conditions === undefined && p.actions === undefined && p.disabled === undefined) {
        return "update_event: indica qué cambiar (conditions, actions o disabled).";
      }
      return null;
    },
    run: (project, payload) => {
      const p = payload as unknown as UpdateEventPayload;
      const next = withScene(project, p.sceneName, (scene) => ({
        ...scene,
        events: scene.events.map((event) => {
          if (event.id !== p.eventId) return event;
          const updated: GDEvent = {
            ...event,
            ...(p.conditions !== undefined ? { conditions: p.conditions.map(toInstruction) } : {}),
            ...(p.actions !== undefined ? { actions: p.actions.map(toInstruction) } : {}),
            ...(p.disabled !== undefined ? { disabled: p.disabled } : {}),
          };
          return updated;
        }),
      }));
      return ok(next, {
        modified: [{ kind: "event", id: p.eventId, name: p.eventId }],
      });
    },
  },

  add_collision: {
    name: "add_collision",
    label: "Añadir colisión",
    description:
      "Crea un evento con condición Collision entre dos objetos y, opcionalmente, destruye uno al tocarse.",
    mutates: true,
    supported: true,
    validate: (payload, project) => {
      if (!isRecord(payload)) return "add_collision: payload no válido.";

      const p = payload as unknown as AddCollisionPayload;
      const scene = requireScene(project, p.sceneName);
      if (!scene) return `No existe la escena «${String(p.sceneName)}».`;
      if (!requireObjectName(scene, p.objectA)) {
        return `No existe el objeto «${String(p.objectA)}».`;
      }
      if (!requireObjectName(scene, p.objectB)) {
        return `No existe el objeto «${String(p.objectB)}».`;
      }
      if (
        p.deleteTarget !== undefined &&
        p.deleteTarget !== "A" &&
        p.deleteTarget !== "B" &&
        p.deleteTarget !== "none"
      ) {
        return "add_collision: deleteTarget debe ser A, B o none.";
      }
      return null;
    },
    run: (project, payload) => {
      const p = payload as unknown as AddCollisionPayload;
      const scene = requireScene(project, p.sceneName)!;
      const event: GDEvent = {
        id: uid("event"),
        kind: "standard",
        conditions: [
          {
            id: uid("inst"),
            typeId: "Collision",
            inverted: false,
            parameters: { object: p.objectA, object2: p.objectB },
          },
        ],
        actions:
          p.deleteTarget === "A" || p.deleteTarget === "B"
            ? [
                {
                  id: uid("inst"),
                  typeId: "Delete",
                  inverted: false,
                  parameters: { object: p.deleteTarget === "A" ? p.objectA : p.objectB },
                },
              ]
            : [],
        subEvents: [],
        collapsed: false,
      };
      const next = withScene(project, p.sceneName, (current) => ({
        ...current,
        events: [...current.events, event],
      }));
      const targetName =
        p.deleteTarget === "A" ? p.objectA : p.deleteTarget === "B" ? p.objectB : null;
      return ok(next, {
        created: [
          {
            kind: "event",
            id: event.id,
            name: `Colisión ${p.objectA} ↔ ${p.objectB}${targetName ? ` (destruye ${targetName})` : ""}`,
          },
        ],
      });
    },
  },

  // -- registered but not implemented yet (honest "unsupported") -------------------
  create_asset: unsupportedTool(
    "create_asset",
    "Crear recurso",
    "Etapas 1-2 del brief: por ahora el agente usa recursos existentes y placeholders; la generación/importación de sprites llega con la etapa 2.",
  ),
  import_asset: unsupportedTool(
    "import_asset",
    "Importar recurso",
    "Importar archivos locales requiere Nexusclaw (ejecutor local), aún no construido.",
  ),
  run_preview: unsupportedTool(
    "run_preview",
    "Ejecutar vista previa",
    "La preview es una acción del editor (PreviewDialog), no una operación sobre el proyecto: la sesión del agente la disparará como acción de anfitrión.",
  ),
  inspect_diagnostics: unsupportedTool(
    "inspect_diagnostics",
    "Inspeccionar diagnósticos",
    "Leer diagnósticos es una acción de anfitrión de la sesión del agente, no una mutación del proyecto.",
  ),
  undo_last_plan: unsupportedTool(
    "undo_last_plan",
    "Deshacer último plan",
    "El undo lo gestiona la sesión del agente sobre sus snapshots (rollbackAppliedPlan), no como herramienta de proyecto.",
  ),
  restore_snapshot: unsupportedTool(
    "restore_snapshot",
    "Restaurar snapshot",
    "La restauración de snapshots la gestiona la sesión del agente (modos snapshot/branch), no como herramienta de proyecto.",
  ),
};

export const toolByName = (name: string): ToolDefinition | undefined =>
  TOOL_REGISTRY[name] as ToolDefinition | undefined;

export const TOOL_NAMES = Object.keys(TOOL_REGISTRY);

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function unsupportedTool(name: string, label: string, reason: string): ToolDefinition {
  return {
    name,
    label,
    description: reason,
    mutates: false,
    supported: false,
    unsupportedReason: reason,
    validate: () => null,
    run: (project) => ok(project),
  };
}

function findEvent(events: GDEvent[], id: unknown): GDEvent | null {
  if (typeof id !== "string") return null;
  for (const event of events) {
    if (event.id === id) return event;
    const found = findEvent(event.subEvents, id);
    if (found) return found;
  }
  return null;
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
