// In-memory clipboard for objects and instances, mirroring GDevelop's
// `ObjectFolderOrObjectsClipboard` (names get a numeric suffix on paste, and
// instances keep their layer/position offset).

import type { GDInstance, GDObjectDef, GDScene } from "./types";
import { newNameGenerator, uid } from "./ids";

export type Clipboard =
  | { kind: "objects"; objects: GDObjectDef[] }
  | { kind: "instances"; instances: GDInstance[] }
  | null;

let clipboard: Clipboard = null;

export function copyObjects(objects: GDObjectDef[]): void {
  if (objects.length === 0) return;
  clipboard = {
    kind: "objects",
    objects: objects.map((o) => ({
      ...structuredCloneSafe(o),
      isGlobal: false,
    })),
  };
}

export function copyInstances(instances: GDInstance[]): void {
  if (instances.length === 0) return;
  clipboard = { kind: "instances", instances: instances.map((i) => structuredCloneSafe(i)) };
}

export function cutObjects(scene: GDScene, ids: string[]): void {
  copyObjects(scene.objects.filter((o) => ids.includes(o.id)));
}

export function cutInstances(scene: GDScene, ids: string[]): void {
  copyInstances(scene.instances.filter((i) => ids.includes(i.id)));
}

export function hasClipboard(): boolean {
  return clipboard !== null;
}

export function clipboardSummary(): string {
  if (!clipboard) return "";
  if (clipboard.kind === "objects") {
    return clipboard.objects.map((o) => o.name).join(", ");
  }
  const first = clipboard.instances[0];
  return clipboard.instances.length === 1 && first
    ? sceneObjectName(first)
    : `${clipboard.instances.length} instancias`;
}

function sceneObjectName(instance: GDInstance) {
  return instance.objectId;
}

/** Returns the new entities to insert into the scene. */
export function pasteInto(scene: GDScene): {
  objects: GDObjectDef[];
  instances: GDInstance[];
} {
  if (!clipboard) return { objects: [], instances: [] };
  if (clipboard.kind === "objects") {
    const taken = scene.objects.map((o) => o.name);
    const objects = clipboard.objects.map((object) => ({
      ...structuredCloneSafe(object),
      id: uid("obj"),
      name: newNameGenerator(object.name, taken),
    }));
    for (const object of objects) taken.push(object.name);
    return { objects, instances: [] };
  }
  const instances = clipboard.instances.map((instance) => ({
    ...structuredCloneSafe(instance),
    id: uid("inst"),
    x: instance.x + 32,
    y: instance.y + 32,
  }));
  return { objects: [], instances };
}

function structuredCloneSafe<T>(value: T): T {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

export function clearClipboard(): void {
  clipboard = null;
}
