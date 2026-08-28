import type * as React from "react";

// Drag & drop payload shared by the object list, resources panel and the canvas.
// GDevelop drags objects with `text/plain` = "object-name"; we add a typed flavour
// so the canvas can distinguish objects, instances and resources.

export const DND_OBJECT = "application/x-nexus-object";
export const DND_INSTANCE = "application/x-nexus-instance";
export const DND_RESOURCE = "application/x-nexus-resource";

export interface DropPayload {
  kind: "object" | "resource";
  /** object name (scene objects) or resource name */
  value: string;
}

export function readDropPayload(event: React.DragEvent): DropPayload | null {
  const objectId = event.dataTransfer.getData(DND_OBJECT);
  if (objectId) return { kind: "object", value: objectId };
  const resourceId = event.dataTransfer.getData(DND_RESOURCE);
  if (resourceId) return { kind: "resource", value: resourceId };
  // Cross-application drops (files) and plain text drags.
  const plain = event.dataTransfer.getData("text/plain");
  if (plain) return { kind: "object", value: plain };
  const file = event.dataTransfer.files?.[0];
  if (file) return { kind: "resource", value: file.name };
  return null;
}

export function setDropEffects(event: React.DragEvent, effect: "copy" | "move" | "link" | "none") {
  event.dataTransfer.dropEffect = effect;
}
