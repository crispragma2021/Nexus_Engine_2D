// Scene helpers: the editor edits one scene at a time, the runtime is handed a
// projection of that scene (see `src/lib/runtime/engine.ts`, which keeps reading
// a flat `{ objects, instances, layers, events }` shape).

import type {
  GDEvent,
  GDExternalLayout,
  GDInstance,
  GDObjectDef,
  GDProject,
  GDScene,
  GDVariable,
} from "./types.ts";
import { DEFAULT_GRID } from "./types.ts";
import { uid } from "./ids.ts";

/** GDevelop keeps the base layer name untranslated in the project file. */
export const BASE_LAYER_NAME = "Base layer";

export interface EmptyProjectOptions {
  name: string;
  windowWidth: number;
  windowHeight: number;
  pixelArt?: boolean;
}

/** Creates the canonical blank 2D project used by every product entry point. */
export function createEmptyProject(options: EmptyProjectOptions): GDProject {
  const name = options.name.trim() || "Proyecto sin título";
  const windowWidth = clampDimension(options.windowWidth, 800);
  const windowHeight = clampDimension(options.windowHeight, 600);
  const sceneName = "Escena 1";
  const orientation =
    windowWidth === windowHeight ? "any" : windowWidth > windowHeight ? "landscape" : "portrait";

  return {
    name,
    version: "1.0.0",
    firstLayoutName: sceneName,
    scenes: [makeScene(sceneName)],
    resources: [],
    globalVariables: [],
    externalEvents: [],
    externalLayouts: [],
    extensions: [],
    gameSettings: {
      author: "",
      description: "",
      version: "1.0.0",
      packageName: "com.nexusengine.game",
      orientation,
      windowWidth,
      windowHeight,
      useWindowSizeAsBaseSize: true,
      magnification: 1,
      minFPS: 30,
      maxFPS: 60,
      adaptGameResolutionAtRuntime: true,
      scaleMode: options.pixelArt ? "nearest" : "linear",
      windowMode: "default",
      startScene: sceneName,
      pauseOnLostFocus: false,
      renderOutsideGameArea: false,
      loadingScreen: {
        displayBrandSplash: true,
        minDuration: 0,
        fadeInDuration: 0,
        fadeOutDuration: 0,
        backgroundColor: "#1D1D26",
      },
      watermark: { showOnMobile: false },
      projectUuid: uid("nexus"),
      folderPolicy: "doNotUse",
    },
  };
}

function clampDimension(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(7680, Math.max(1, Math.round(value)));
}

export function makeScene(name: string, patch: Partial<GDScene> = {}): GDScene {
  return {
    name,
    backgroundColor: "255;255;255",
    magnification: 1,
    adaptResolutionAtRuntime: true,
    stopSoundsOnSceneChange: false,
    grid: { ...DEFAULT_GRID },
    layers: [{ name: BASE_LAYER_NAME, visible: true, camera: { x: 0, y: 0 }, effects: [] }],
    activeLayer: BASE_LAYER_NAME,
    objects: [],
    instances: [],
    events: [],
    variables: [],
    groups: [],
    ...patch,
  };
}

export function getScene(project: GDProject, name: string): GDScene | undefined {
  return project.scenes.find((s) => s.name === name);
}

export function activeScene(project: GDProject, activeName: string): GDScene | undefined {
  return getScene(project, activeName) ?? project.scenes[0];
}

/** Immutably replace the active scene with the result of `updater`. */
export function withScene(
  project: GDProject,
  name: string,
  updater: (s: GDScene) => GDScene,
): GDProject {
  let touched = false;
  const scenes = project.scenes.map((scene) => {
    if (scene.name !== name) return scene;
    touched = true;
    return updater(scene);
  });
  // Renaming: caller passes the new name in the returned scene; keep list stable.
  if (!touched) return project;
  return { ...project, scenes };
}

export function renameSceneInProject(project: GDProject, from: string, to: string): GDProject {
  const scenes = project.scenes.map((s) =>
    s.name === from
      ? {
          ...s,
          name: to,
          activeLayer: s.activeLayer === from ? to : s.activeLayer,
          layers: s.layers.map((l) => (l.name === from ? { ...l, name: to } : l)),
          instances: s.instances.map((i) => (i.layer === from ? { ...i, layer: to } : i)),
        }
      : s,
  );
  const firstLayoutName = project.firstLayoutName === from ? to : project.firstLayoutName;
  return {
    ...project,
    scenes,
    firstLayoutName,
    gameSettings: { ...project.gameSettings, startScene: firstLayoutName },
  };
}

/** The projection `GameRuntime` simulates. Keeps the engine API untouched. */
export function toRuntimeScene(project: GDProject, scene: GDScene) {
  const { windowWidth, windowHeight } = sceneWindowSize(project, scene);
  return {
    name: scene.name,
    backgroundColor: scene.backgroundColor,
    windowWidth,
    windowHeight,
    layers: scene.layers,
    objects: scene.objects,
    instances: scene.instances,
    events: scene.events,
    sceneVariables: scene.variables,
    globalVariables: project.globalVariables,
    groups: scene.groups,
    scenes: project.scenes.map((s) => s.name),
  };
}

export function sceneWindowSize(
  project: GDProject,
  scene: GDScene,
): { windowWidth: number; windowHeight: number } {
  if (scene.useCustomWindowSize && scene.customWindowWidth && scene.customWindowHeight) {
    return { windowWidth: scene.customWindowWidth, windowHeight: scene.customWindowHeight };
  }
  return {
    windowWidth: project.gameSettings.windowWidth,
    windowHeight: project.gameSettings.windowHeight,
  };
}

export function newEmptyInstances(instances: GDInstance[], scene: GDScene): GDInstance[] {
  return instances.filter((i) => scene.objects.some((o) => o.id === i.objectId));
}

export function objectsFromExternalLayout(
  layout: GDExternalLayout | undefined,
  scene: GDScene,
): { instances: GDInstance[]; objects: GDObjectDef[] } {
  if (!layout) return { instances: [], objects: [] };
  const known = new Set(scene.objects.map((o) => o.name));
  return {
    instances: layout.instances.map((i) => ({ ...i, id: uid("inst") })),
    objects: scene.objects.filter((o) => known.has(o.name)),
  };
}

export function emptyEvents(): GDEvent[] {
  return [];
}

export function emptyVariables(): GDVariable[] {
  return [];
}

/**
 * Projects saved before the multi-scene model stored objects/instances/events at
 * the root. Accept them and lift everything into a single scene.
 */
export function migrateProject(input: unknown): GDProject | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown> & Partial<GDProject>;
  if (
    Array.isArray(raw.scenes) &&
    (raw.scenes as unknown[])[0] &&
    typeof (raw.scenes as unknown[])[0] === "object"
  ) {
    const project = raw as GDProject;
    return {
      ...project,
      externalEvents: project.externalEvents ?? [],
      externalLayouts: project.externalLayouts ?? [],
      globalVariables: project.globalVariables ?? [],
      resources: project.resources ?? [],
      scenes: project.scenes.map((scene) => ({
        ...scene,
        grid: { ...DEFAULT_GRID, ...(scene.grid ?? {}) },
        groups: scene.groups ?? [],
        variables: scene.variables ?? [],
        layers: (scene.layers ?? []).map((layer) => ({
          ...layer,
          camera: layer.camera ?? { x: 0, y: 0 },
          effects: layer.effects ?? [],
        })),
      })),
    };
  }

  // legacy flat shape
  const legacy = raw as unknown as {
    name?: string;
    windowWidth?: number;
    windowHeight?: number;
    backgroundColor?: string;
    activeLayer?: string;
    scenes?: string[];
    objects?: GDObjectDef[];
    instances?: GDInstance[];
    layers?: GDScene["layers"];
    events?: GDEvent[];
    sceneVariables?: GDVariable[];
    extensions?: string[];
  };
  const name = legacy.scenes?.[0] ?? "Level 1";
  const scene = makeScene(name, {
    backgroundColor: legacy.backgroundColor ?? "255;255;255",
    activeLayer: legacy.activeLayer ?? BASE_LAYER_NAME,
    objects: (legacy.objects ?? []).map(normalizeObject),
    instances: (legacy.instances ?? []).map(normalizeInstance),
    layers: ((legacy.layers ?? []) as GDScene["layers"]).map((l) => ({
      ...l,
      camera: l.camera ?? { x: 0, y: 0 },
      effects: l.effects ?? [],
    })),
    events: legacy.events ?? [],
    variables: (legacy.sceneVariables ?? []).map((v) => ({
      name: v.name,
      type: (v as GDVariable).type ?? "number",
      value: v.value,
      children: [],
    })),
    groups: [],
  });
  return {
    name: legacy.name ?? "Proyecto sin título",
    version: "1.0.0",
    firstLayoutName: name,
    scenes: [scene],
    resources: [],
    globalVariables: [],
    externalEvents: [],
    externalLayouts: [],
    extensions: (legacy.extensions ?? []).map((n) => ({ name: n })),
    gameSettings: {
      author: "",
      description: "",
      version: "1.0.0",
      packageName: "com.nexusengine.game",
      orientation: "landscape",
      windowWidth: legacy.windowWidth ?? 800,
      windowHeight: legacy.windowHeight ?? 600,
      useWindowSizeAsBaseSize: true,
      magnification: 1,
      minFPS: 30,
      maxFPS: 65,
      adaptGameResolutionAtRuntime: true,
      scaleMode: "linear",
      windowMode: "default",
      startScene: name,
      pauseOnLostFocus: false,
      renderOutsideGameArea: false,
      loadingScreen: {
        displayBrandSplash: true,
        minDuration: 0,
        fadeInDuration: 0,
        fadeOutDuration: 0,
        backgroundColor: "#1D1D26",
      },
      watermark: { showOnMobile: false },
      projectUuid: uid("nexus"),
      folderPolicy: "doNotUse",
    },
  };
}

function normalizeObject(object: GDObjectDef): GDObjectDef {
  return {
    ...object,
    behaviors: (object.behaviors ?? []).map((b) =>
      typeof b === "string"
        ? {
            name: b,
            type:
              b === "Platform"
                ? "PlatformBehavior::PlatformBehavior"
                : "PlatformBehavior::PlatformerObjectBehavior",
            properties: {},
          }
        : b,
    ),
    effects: object.effects ?? [],
    variables: (object.variables ?? []).map((v) => ({
      name: v.name,
      type: (v as GDVariable).type ?? "number",
      value: v.value,
      children: (v as GDVariable).children ?? [],
    })),
  };
}

function normalizeInstance(instance: GDInstance): GDInstance {
  return {
    ...instance,
    variables: instance.variables ?? [],
    effects: instance.effects ?? [],
    hiddenAtStart: instance.hiddenAtStart ?? false,
    customSize: instance.customSize ?? true,
  };
}
