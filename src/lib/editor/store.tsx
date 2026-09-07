import * as React from "react";
import type {
  GDEvent,
  GDExtension,
  GDGameSettings,
  GDInstance,
  GDInstruction,
  GDLayer,
  GDObjectAnimation,
  GDObjectBehavior,
  GDObjectDef,
  GDObjectGroup,
  GDObjectPoint,
  GDProject,
  GDResource,
  GDScene,
  GDEffect,
  GDVariable,
} from "./types";
import { DEFAULT_GRID } from "./types";
import { createDemoProject } from "./data";
import { newEvent } from "./events";
import { getCurrentProject } from "@/lib/projects/local";
import {
  BASE_LAYER_NAME,
  makeScene,
  migrateProject,
  renameSceneInProject,
  withScene,
} from "./scenes";
import { newNameGenerator, uid } from "./ids";
import { applyAiEditPlan, createAiEditPlan } from "./ai";
import {
  createAgentSession,
  makeAuditEntry,
  setAgentMode,
  setAgentSnapshotMode,
  withAuditEntry,
  type AgentAuditEntry,
  type AgentSessionState,
  type AutonomyMode,
  type SnapshotMode,
} from "../agent/session";

export type EditorTab = "scene" | "events";

export type OpenedTabKind =
  | "home"
  | "scene"
  | "gameSettings"
  | "resources"
  | "extensions"
  | "externalEvents"
  | "externalLayouts"
  | "globalVariables";

export interface OpenedTab {
  id: string;
  kind: OpenedTabKind;
  label: string;
  /** scene name for kind === "scene" */
  sceneName?: string;
}

export interface VariableScopeLocation {
  scope: "scene" | "global" | "object" | "instance";
  objectId?: string;
  /** parent structure/array names, e.g. ["Jugador", "controles"] */
  path?: string[];
}

/**
 * Modal dialogs. GDevelop opens these from the panels/toolbars; keeping them in
 * the store (instead of local component state) lets any panel request one and
 * lets keyboard shortcuts reach them.
 */
export type EditorDialog =
  | { name: "newObject" }
  | { name: "objectEditor"; objectId: string }
  | { name: "behaviors"; objectId: string }
  | { name: "effects"; targetKind: "object" | "instance" | "layer"; targetId: string }
  | { name: "sceneProperties" }
  | { name: "projectProperties" }
  | { name: "variables"; scope: "scene" | "global" }
  | { name: "resources" }
  | {
      name: "instruction";
      eventId: string;
      slot: "conditions" | "actions";
      instructionId: string | { name: "share"; tab: "publish" | "invite" } | null;
    }
  | { name: "externalEvents"; eventsName: string }
  | { name: "share"; tab: "publish" | "invite" }
  | null;

export interface InlineAiSession {
  x: number;
  y: number;
  sceneName: string;
  instanceIds: string[];
  objectIds: string[];
  cursorPosition: { x: number; y: number } | null;
  targetName?: string;
}

interface UIState {
  tab: EditorTab;
  dialog: EditorDialog;
  openedTabs: OpenedTab[];
  activeTabId: string;
  rightTab: "properties" | "instances" | "layers";
  selectedInstanceIds: string[];
  selectedObjectIds: string[];
  /** events selected in the sheet (ctrl/shift click, like GDevelop) */
  selectedEventIds: string[];
  selectedGroupName: string | null;
  selectedLayerName: string | null;
  selectedInstruction: {
    eventId: string;
    slot: "conditions" | "actions";
    instructionId: string;
  } | null;
  showLeftPanel: boolean;
  showRightPanel: boolean;
  showObjectsPanel: boolean;
  showGroupsPanel: boolean;
  showPropertiesPanel: boolean;
  showInstancesPanel: boolean;
  showLayersPanel: boolean;
  zoom: number;
  pan: { x: number; y: number };
  showHitMasks: boolean;
  /** GDevelop's "Máscara de la ventana": darken outside the game window */
  windowMask: boolean;
  showHiddenInstances: boolean;
  projectManagerOpen: boolean;
  commandPaletteOpen: boolean;
  /** Contextual hybrid automation bar (Ctrl/Cmd+K). */
  quickAutomationOpen: boolean;
  /** Agent panel (plan → approve → apply → preview → diagnostics). */
  agentPanelOpen: boolean;
  inlineAi: InlineAiSession | null;
  previewOpen: boolean;
  previewWithDebugger: boolean;
  debuggerOpen: boolean;
  /** Last Canvas pointer in viewport coordinates, used to anchor the in-situ prompt. */
  cursorClientPosition: { x: number; y: number } | null;
  /** Last Canvas pointer in scene coordinates, used by generated insertions. */
  cursorPosition: { x: number; y: number } | null;
}

type Action =
  // shell / ui
  | { type: "ui"; patch: Partial<UIState> }
  | { type: "openDialog"; dialog: NonNullable<EditorDialog> }
  | { type: "closeDialog" }
  | { type: "openInlineAi"; x: number; y: number }
  | { type: "closeInlineAi" }
  | { type: "markSaved" }
  | { type: "openTab"; tab: Omit<OpenedTab, "id"> & { id?: string } }
  | { type: "closeTab"; id: string }
  | { type: "setActiveTab"; id: string }
  // project
  | { type: "loadProject"; project: GDProject }
  | { type: "renameProject"; name: string }
  | { type: "updateGameSettings"; patch: Partial<GDGameSettings> }
  | { type: "setActiveScene"; name: string }
  | { type: "addScene"; name?: string }
  | { type: "deleteScene"; name: string }
  | { type: "renameScene"; from: string; to: string }
  | { type: "duplicateScene"; name: string }
  | { type: "updateScene"; patch: Partial<GDScene> }
  | { type: "updateGrid"; patch: Partial<GDScene["grid"]> }
  | {
      type: "applyAiEdit";
      sceneName: string;
      scene: GDScene;
      selectedInstanceIds?: string[];
    }
  // agent session (plan → approve → atomic transaction → preview → diagnostics)
  | {
      type: "applyAgentPlan";
      project: GDProject;
      agent: AgentSessionState;
      /** Scene to focus after the transaction (plan target scene). */
      sceneName?: string;
    }
  | { type: "agentAudit"; entry: AgentAuditEntry }
  | { type: "agentSetMode"; mode: AutonomyMode }
  | { type: "agentSetSnapshotMode"; mode: SnapshotMode }
  // objects
  | { type: "addObject"; object: Partial<GDObjectDef> & { name: string; type: string } }
  | { type: "updateObject"; id: string; patch: Partial<GDObjectDef> }
  | { type: "renameObject"; id: string; name: string }
  | { type: "deleteObject"; id: string }
  | { type: "duplicateObject"; id: string }
  | { type: "setObjectGlobal"; id: string; isGlobal: boolean }
  | { type: "addObjectAnimation"; objectId: string }
  | {
      type: "updateObjectAnimation";
      objectId: string;
      index: number;
      patch: Partial<GDObjectAnimation>;
    }
  | { type: "deleteObjectAnimation"; objectId: string; index: number }
  | { type: "addObjectFrame"; objectId: string; animationIndex: number }
  | {
      type: "updateObjectFrame";
      objectId: string;
      animationIndex: number;
      frameIndex: number;
      patch: Partial<GDObjectAnimation["images"][number]>;
    }
  | { type: "deleteObjectFrame"; objectId: string; animationIndex: number; frameIndex: number }
  | { type: "addObjectPoint"; objectId: string; animationIndex: number }
  | {
      type: "updateObjectPoint";
      objectId: string;
      animationIndex: number;
      pointIndex: number;
      patch: Partial<GDObjectPoint>;
    }
  | { type: "deleteObjectPoint"; objectId: string; animationIndex: number; pointIndex: number }
  // behaviors & effects
  | { type: "addBehavior"; objectId: string; behavior: GDObjectBehavior }
  | {
      type: "updateBehavior";
      objectId: string;
      behaviorName: string;
      patch: Partial<GDObjectBehavior>;
    }
  | { type: "deleteBehavior"; objectId: string; behaviorName: string }
  | { type: "addEffect"; target: EffectTarget; effect: GDEffect }
  | { type: "updateEffect"; target: EffectTarget; index: number; patch: Partial<GDEffect> }
  | { type: "deleteEffect"; target: EffectTarget; index: number }
  | { type: "moveEffect"; target: EffectTarget; index: number; direction: -1 | 1 }
  | { type: "toggleEffect"; target: EffectTarget; index: number }
  // instances
  | { type: "selectInstances"; ids: string[] }
  | { type: "selectEvents"; ids: string[] }
  | { type: "addInstance"; objectId: string; x: number; y: number; layer?: string }
  | { type: "addInstances"; instances: GDInstance[] }
  | { type: "moveInstances"; ids: string[]; dx: number; dy: number }
  | { type: "setInstancesPositions"; positions: { id: string; x: number; y: number }[] }
  | { type: "updateInstance"; id: string; patch: Partial<GDInstance> }
  | { type: "deleteInstances"; ids: string[] }
  | { type: "duplicateInstances"; ids: string[] }
  | { type: "setInstancesZOrder"; ids: string[]; mode: "front" | "back" | "value"; value?: number }
  | { type: "toggleInstancesLock"; ids: string[] }
  | { type: "toggleInstancesVisibility"; ids: string[] }
  // layers
  | { type: "addLayer"; name?: string; isLightingLayer?: boolean }
  | { type: "updateLayer"; name: string; patch: Partial<GDLayer> }
  | { type: "renameLayer"; from: string; to: string }
  | { type: "deleteLayer"; name: string }
  | { type: "moveLayer"; name: string; direction: -1 | 1 }
  | { type: "toggleLayerVisibility"; name: string }
  | { type: "toggleLayerLock"; name: string }
  | { type: "setActiveLayer"; name: string }
  // groups
  | { type: "addObjectGroup"; name?: string }
  | { type: "updateObjectGroup"; name: string; patch: Partial<GDObjectGroup> }
  | { type: "deleteObjectGroup"; name: string }
  // variables
  | { type: "addVariable"; location: VariableScopeLocation }
  | {
      type: "updateVariable";
      location: VariableScopeLocation;
      path: string[];
      patch: Partial<GDVariable>;
    }
  | { type: "deleteVariable"; location: VariableScopeLocation; path: string[] }
  | { type: "addVariableChild"; location: VariableScopeLocation; path: string[] }
  // events
  | { type: "addEvent"; parentId: string | null; kind: GDEvent["kind"]; position?: number }
  | { type: "insertGeneratedEvents"; events: GDEvent[]; position?: number }
  | { type: "deleteEvent"; id: string }
  | { type: "deleteEvents"; ids: string[] }
  | { type: "duplicateEvent"; id: string }
  | { type: "toggleCollapse"; id: string }
  | { type: "toggleEventDisabled"; id: string }
  | { type: "updateEvent"; id: string; patch: Partial<GDEvent> }
  | { type: "moveEvent"; id: string; direction: -1 | 1 }
  | {
      type: "addInstruction";
      eventId: string;
      slot: "conditions" | "actions";
      instruction: GDInstruction;
    }
  | {
      type: "updateInstruction";
      eventId: string;
      slot: "conditions" | "actions";
      instructionId: string;
      patch: Partial<GDInstruction>;
    }
  | {
      type: "deleteInstruction";
      eventId: string;
      slot: "conditions" | "actions";
      instructionId: string;
    }
  | {
      type: "moveInstruction";
      eventId: string;
      slot: "conditions" | "actions";
      instructionId: string;
      direction: -1 | 1;
    }
  | {
      type: "toggleInstructionInverted";
      eventId: string;
      slot: "conditions" | "actions";
      instructionId: string;
    }
  // resources
  | { type: "addResource"; resource: GDResource }
  | {
      /** Adds generated image + normal object + optional instance as one undoable edit. */
      type: "addGeneratedAssetBundle";
      resource: GDResource;
      object: GDObjectDef;
      instance?: GDInstance;
    }
  | { type: "updateResource"; name: string; patch: Partial<GDResource> }
  | { type: "deleteResource"; name: string }
  // extensions
  | { type: "installExtension"; extension: GDExtension }
  | { type: "uninstallExtension"; name: string }
  // external events / layouts
  | { type: "addExternalEvents"; name?: string }
  | { type: "addExternalLayout"; name?: string }
  // history
  | { type: "recordHistory" }
  | { type: "undo" }
  | { type: "redo" };

export type EffectTarget =
  | { kind: "object"; id: string }
  | { kind: "instance"; id: string }
  | { kind: "layer"; name: string };

interface State {
  project: GDProject;
  activeSceneName: string;
  ui: UIState;
  /** Agent session: memory, autonomy mode, snapshots and audit log. */
  agent: AgentSessionState;
  past: { project: GDProject; sceneName: string; agent: AgentSessionState }[];
  future: { project: GDProject; sceneName: string; agent: AgentSessionState }[];
  /** dirty flag, drives the unsaved dot in the titlebar */
  dirty: boolean;
}

const initialUI: UIState = {
  tab: "scene",
  dialog: null,
  openedTabs: [{ id: "scene:Level 1", kind: "scene", label: "Level 1", sceneName: "Level 1" }],
  activeTabId: "scene:Level 1",
  rightTab: "properties",
  selectedInstanceIds: [],
  selectedObjectIds: [],
  selectedEventIds: [],
  selectedGroupName: null,
  selectedLayerName: null,
  selectedInstruction: null,
  showLeftPanel: true,
  showRightPanel: true,
  showObjectsPanel: true,
  showGroupsPanel: true,
  showPropertiesPanel: true,
  showInstancesPanel: true,
  showLayersPanel: true,
  zoom: 1,
  pan: { x: 0, y: 0 },
  showHitMasks: false,
  windowMask: true,
  showHiddenInstances: true,
  projectManagerOpen: false,
  commandPaletteOpen: false,
  quickAutomationOpen: false,
  agentPanelOpen: false,
  inlineAi: null,
  previewOpen: false,
  previewWithDebugger: false,
  debuggerOpen: false,
  cursorClientPosition: null,
  cursorPosition: null,
};

/* ------------------------------------------------------------------ helpers */

function patchScene(state: State, updater: (scene: GDScene) => GDScene): State {
  const project = withScene(state.project, state.activeSceneName, updater);
  if (project === state.project) return state;
  return { ...state, project, dirty: true };
}

function mapEvents(events: GDEvent[], fn: (e: GDEvent) => GDEvent | null): GDEvent[] {
  const out: GDEvent[] = [];
  for (const e of events) {
    const mapped = fn(e);
    if (!mapped) continue;
    out.push({ ...mapped, subEvents: mapEvents(mapped.subEvents, fn) });
  }
  return out;
}

function insertSub(events: GDEvent[], parentId: string, child: GDEvent): GDEvent[] {
  return events.map((e) =>
    e.id === parentId
      ? {
          ...e,
          collapsed: false,
          subEvents: [...e.subEvents, child],
        }
      : { ...e, subEvents: insertSub(e.subEvents, parentId, child) },
  );
}

function siblingList(
  events: GDEvent[],
  parentId: string | null,
  updater: (list: GDEvent[]) => GDEvent[],
): GDEvent[] {
  if (parentId === null) return updater(events);
  return events.map((e) =>
    e.id === parentId
      ? { ...e, subEvents: updater(e.subEvents) }
      : { ...e, subEvents: siblingList(e.subEvents, parentId, updater) },
  );
}

export function findEvent(events: GDEvent[], id: string): GDEvent | undefined {
  for (const e of events) {
    if (e.id === id) return e;
    const found = findEvent(e.subEvents, id);
    if (found) return found;
  }
  return undefined;
}

export function parentOfEvent(
  events: GDEvent[],
  id: string,
  parent: string | null = null,
): string | null {
  for (const e of events) {
    if (e.id === id) return parent;
    const found = parentOfEvent(e.subEvents, id, e.id);
    if (found !== null) return found;
  }
  return null;
}

/* ------------------------------------------------------- variables in a tree */

function variableAt(list: GDVariable[], path: string[]): GDVariable | undefined {
  let current: GDVariable | undefined;
  let level = list;
  for (const name of path) {
    current = level.find((v) => v.name === name);
    if (!current) return undefined;
    level = current.children;
  }
  return current;
}

function mapVariableTree(
  list: GDVariable[],
  path: string[],
  updater: (v: GDVariable) => GDVariable,
): GDVariable[] {
  if (path.length === 0) return list.map(updater);
  const [head, ...rest] = path;
  return list.map((v) =>
    v.name === head ? { ...v, children: mapVariableTree(v.children, rest, updater) } : v,
  );
}

function removeVariable(list: GDVariable[], path: string[]): GDVariable[] {
  if (path.length <= 1) {
    const name = path[0];
    return list.filter((v) => v.name !== name);
  }
  const [head, ...rest] = path;
  return list.map((v) =>
    v.name === head ? { ...v, children: removeVariable(v.children, rest) } : v,
  );
}

function emptyVariableFor(parent: GDVariable | undefined): GDVariable {
  const isIndex = parent?.type === "array";
  const size = parent ? parent.children.length : 0;
  return {
    name: isIndex ? String(size) : `Variable ${size + 1}`,
    type: "number",
    value: "0",
    children: [],
  };
}

function sceneVariablesOf(scene: GDScene, location: VariableScopeLocation): GDVariable[] {
  switch (location.scope) {
    case "scene":
      return scene.variables;
    case "global":
      return [];
    case "object":
      return scene.objects.find((o) => o.id === location.objectId)?.variables ?? [];
    case "instance":
      return scene.instances.find((i) => i.id === location.objectId)?.variables ?? [];
  }
}

/* ----------------------------------------------------------------- reducer */

const MUTATING = new Set([
  "addObject",
  "updateObject",
  "renameObject",
  "deleteObject",
  "duplicateObject",
  "setObjectGlobal",
  "addObjectAnimation",
  "updateObjectAnimation",
  "deleteObjectAnimation",
  "addObjectFrame",
  "updateObjectFrame",
  "deleteObjectFrame",
  "addObjectPoint",
  "updateObjectPoint",
  "deleteObjectPoint",
  "addBehavior",
  "updateBehavior",
  "deleteBehavior",
  "addEffect",
  "updateEffect",
  "deleteEffect",
  "moveEffect",
  "toggleEffect",
  "addInstance",
  "addInstances",
  "updateInstance",
  "deleteInstances",
  "duplicateInstances",
  "setInstancesZOrder",
  "toggleInstancesLock",
  "toggleInstancesVisibility",
  "addLayer",
  "updateLayer",
  "renameLayer",
  "deleteLayer",
  "moveLayer",
  "toggleLayerVisibility",
  "toggleLayerLock",
  "setActiveLayer",
  "addObjectGroup",
  "updateObjectGroup",
  "deleteObjectGroup",
  "addVariable",
  "updateVariable",
  "deleteVariable",
  "addVariableChild",
  "addEvent",
  "insertGeneratedEvents",
  "deleteEvent",
  "deleteEvents",
  "duplicateEvent",
  "updateEvent",
  "moveEvent",
  "toggleEventDisabled",
  "addInstruction",
  "updateInstruction",
  "deleteInstruction",
  "moveInstruction",
  "toggleInstructionInverted",
  "addResource",
  "addGeneratedAssetBundle",
  "updateResource",
  "deleteResource",
  "installExtension",
  "uninstallExtension",
  "addExternalEvents",
  "addExternalLayout",
  "updateGrid",
  "updateScene",
  "updateGameSettings",
  "renameProject",
  "addScene",
  "deleteScene",
  "renameScene",
  "duplicateScene",
  "applyAiEdit",
  "applyAgentPlan",
]);

function effectsOf(target: EffectTarget, scene: GDScene): GDEffect[] | undefined {
  if (target.kind === "object") return scene.objects.find((o) => o.id === target.id)?.effects;
  if (target.kind === "instance") return scene.instances.find((i) => i.id === target.id)?.effects;
  return scene.layers.find((l) => l.name === target.name)?.effects;
}

function projectReducer(state: State, action: Action): State {
  const project = state.project;
  const scene = project.scenes.find((s) => s.name === state.activeSceneName) ?? project.scenes[0];
  if (!scene) return state;

  switch (action.type) {
    /* ------------------------------------------------------------ project */
    case "renameProject":
      return { ...state, dirty: true, project: { ...project, name: action.name } };

    case "updateGameSettings": {
      const gameSettings = { ...project.gameSettings, ...action.patch };
      let next = { ...project, gameSettings };
      if (action.patch.startScene && action.patch.startScene !== project.firstLayoutName) {
        next = { ...next, firstLayoutName: action.patch.startScene };
      }
      return { ...state, dirty: true, project: next };
    }

    /* ------------------------------------------------------------- scenes */
    case "setActiveScene": {
      const id = `scene:${action.name}`;
      const exists = state.ui.openedTabs.some((t) => t.id === id);
      const openedTabs = exists
        ? state.ui.openedTabs
        : [
            ...state.ui.openedTabs,
            { id, kind: "scene" as const, label: action.name, sceneName: action.name },
          ];
      return {
        ...state,
        activeSceneName: action.name,
        ui: {
          ...state.ui,
          openedTabs,
          activeTabId: id,
          selectedInstanceIds: [],
          selectedObjectIds: [],
          selectedLayerName: null,
          selectedGroupName: null,
        },
      };
    }

    case "addScene": {
      const names = project.scenes.map((s) => s.name);
      const name = action.name ?? newNameGenerator("Nueva escena", names);
      const created = makeScene(name, {
        backgroundColor: "255;255;255",
        grid: { ...DEFAULT_GRID, show: true },
      });
      return {
        ...state,
        dirty: true,
        project: { ...project, scenes: [...project.scenes, created] },
        activeSceneName: name,
        ui: {
          ...state.ui,
          openedTabs: [
            ...state.ui.openedTabs,
            { id: `scene:${name}`, kind: "scene", label: name, sceneName: name },
          ],
          activeTabId: `scene:${name}`,
        },
      };
    }

    case "deleteScene": {
      if (project.scenes.length <= 1) return state;
      const scenes = project.scenes.filter((s) => s.name !== action.name);
      const first = scenes[0];
      if (!first) return state;
      const openedTabs = state.ui.openedTabs.filter((t) => t.sceneName !== action.name);
      const activeSceneName =
        state.activeSceneName === action.name ? first.name : state.activeSceneName;
      return {
        ...state,
        dirty: true,
        project: {
          ...project,
          scenes,
          firstLayoutName: scenes.some((s) => s.name === project.firstLayoutName)
            ? project.firstLayoutName
            : first.name,
        },
        activeSceneName,
        ui: {
          ...state.ui,
          openedTabs,
          activeTabId:
            state.activeSceneName === action.name ? `scene:${first.name}` : state.ui.activeTabId,
        },
      };
    }

    case "renameScene": {
      if (!action.to.trim() || action.to === action.from) return state;
      const renamed = renameSceneInProject(project, action.from, action.to.trim());
      const openedTabs = state.ui.openedTabs.map((t) =>
        t.sceneName === action.from
          ? {
              ...t,
              label: action.to.trim(),
              id: `scene:${action.to.trim()}`,
              sceneName: action.to.trim(),
            }
          : t,
      );
      return {
        ...state,
        dirty: true,
        project: renamed,
        activeSceneName: action.to.trim(),
        ui: {
          ...state.ui,
          openedTabs,
          activeTabId:
            state.activeSceneName === action.from
              ? `scene:${action.to.trim()}`
              : state.ui.activeTabId,
        },
      };
    }

    case "duplicateScene": {
      const source = project.scenes.find((s) => s.name === action.name);
      if (!source) return state;
      const name = newNameGenerator(
        `${source.name} (copia)`,
        project.scenes.map((s) => s.name),
      );
      const idMap = new Map<string, string>();
      const objects = source.objects.map((o) => {
        const nextId = uid("obj");
        idMap.set(o.id, nextId);
        return { ...o, id: nextId };
      });
      const copy: GDScene = {
        ...source,
        name,
        objects,
        instances: source.instances.map((i) => ({
          ...i,
          id: uid("inst"),
          objectId: idMap.get(i.objectId) ?? i.objectId,
        })),
        events: source.events.map(cloneEvent),
      };
      return {
        ...state,
        dirty: true,
        project: { ...project, scenes: [...project.scenes, copy] },
      };
    }

    case "updateScene":
      return patchScene(state, (s) => ({ ...s, ...action.patch }));

    case "updateGrid":
      return patchScene(state, (s) => ({ ...s, grid: { ...s.grid, ...action.patch } }));

    case "applyAiEdit": {
      if (
        action.scene.name !== action.sceneName ||
        !project.scenes.some((candidate) => candidate.name === action.sceneName)
      ) {
        return state;
      }
      return {
        ...state,
        dirty: true,
        project: {
          ...project,
          scenes: project.scenes.map((candidate) =>
            candidate.name === action.sceneName ? action.scene : candidate,
          ),
        },
        ui:
          action.selectedInstanceIds === undefined
            ? state.ui
            : {
                ...state.ui,
                selectedInstanceIds: action.selectedInstanceIds,
                selectedObjectIds: [],
              },
      };
    }

    /* ------------------------------------------------------------ objects */
    case "addObject": {
      const id = action.object.id ?? uid("obj");
      const created: GDObjectDef = {
        behaviors: [],
        effects: [],
        variables: [],
        ...action.object,
        id,
      };
      return patchScene(state, (s) => ({ ...s, objects: [...s.objects, created] }));
    }

    case "updateObject":
      return patchScene(state, (s) => ({
        ...s,
        objects: s.objects.map((o) => (o.id === action.id ? { ...o, ...action.patch } : o)),
      }));

    case "renameObject": {
      const old = scene.objects.find((o) => o.id === action.id);
      if (!old || old.name === action.name) return state;
      const nextName = action.name.trim();
      if (!nextName) return state;
      return patchScene(state, (s) => ({
        ...s,
        objects: s.objects.map((o) => (o.id === action.id ? { ...o, name: nextName } : o)),
        // GDevelop keeps the references in sync when an object is renamed.
        events: mapEvents(s.events, (e) => renameObjectInEvent(e, old.name, nextName)),
        groups: s.groups.map((g) => ({
          ...g,
          objects: g.objects.map((n) => (n === old.name ? nextName : n)),
        })),
      }));
    }

    case "deleteObject": {
      const target = scene.objects.find((o) => o.id === action.id);
      return patchScene(state, (s) => ({
        ...s,
        objects: s.objects.filter((o) => o.id !== action.id),
        instances: s.instances.filter((i) => i.objectId !== action.id),
        groups: s.groups.map((g) => ({
          ...g,
          objects: target ? g.objects.filter((n) => n !== target.name) : g.objects,
        })),
      }));
    }

    case "duplicateObject": {
      const source = scene.objects.find((o) => o.id === action.id);
      if (!source) return state;
      const name = newNameGenerator(
        `${source.name}Copy`,
        scene.objects.map((o) => o.name),
      );
      const created: GDObjectDef = { ...source, id: uid("obj"), name };
      return patchScene(state, (s) => ({ ...s, objects: [...s.objects, created] }));
    }

    case "setObjectGlobal":
      return patchScene(state, (s) => ({
        ...s,
        objects: s.objects.map((o) =>
          o.id === action.id ? { ...o, isGlobal: action.isGlobal } : o,
        ),
      }));

    case "addObjectAnimation":
      return patchScene(state, (s) => ({
        ...s,
        objects: s.objects.map((o) =>
          o.id === action.objectId
            ? {
                ...o,
                animations: [
                  ...(o.animations ?? []),
                  {
                    name: newNameGenerator(
                      "Animación",
                      (o.animations ?? []).map((a) => a.name),
                    ),
                    loops: true,
                    timeBetweenFrames: 1,
                    images: [
                      {
                        image: o.asset ?? "",
                        originX: 0,
                        originY: 0,
                        centerX: 0.5,
                        centerY: 0.5,
                        opacity: 255,
                      },
                    ],
                    points: [],
                  },
                ],
              }
            : o,
        ),
      }));

    case "updateObjectAnimation":
      return patchScene(state, (s) => ({
        ...s,
        objects: s.objects.map((o) =>
          o.id === action.objectId
            ? {
                ...o,
                animations: (o.animations ?? []).map((a, i) =>
                  i === action.index ? { ...a, ...action.patch } : a,
                ),
              }
            : o,
        ),
      }));

    case "deleteObjectAnimation":
      return patchScene(state, (s) => ({
        ...s,
        objects: s.objects.map((o) =>
          o.id === action.objectId
            ? { ...o, animations: (o.animations ?? []).filter((_, i) => i !== action.index) }
            : o,
        ),
      }));

    case "addObjectFrame":
      return patchScene(state, (s) => ({
        ...s,
        objects: s.objects.map((o) => {
          if (o.id !== action.objectId) return o;
          const animations = [...(o.animations ?? [])];
          const current = animations[action.animationIndex];
          if (!current) return o;
          animations[action.animationIndex] = {
            ...current,
            images: [
              ...current.images,
              {
                image: current.images[current.images.length - 1]?.image ?? o.asset ?? "",
                originX: 0,
                originY: 0,
                centerX: 0.5,
                centerY: 0.5,
                opacity: 255,
              },
            ],
          };
          return { ...o, animations };
        }),
      }));

    case "updateObjectFrame":
      return patchScene(state, (s) => ({
        ...s,
        objects: s.objects.map((o) => {
          if (o.id !== action.objectId) return o;
          const animations = [...(o.animations ?? [])];
          const current = animations[action.animationIndex];
          if (!current) return o;
          animations[action.animationIndex] = {
            ...current,
            images: current.images.map((f, i) =>
              i === action.frameIndex ? { ...f, ...action.patch } : f,
            ),
          };
          return { ...o, animations };
        }),
      }));

    case "deleteObjectFrame":
      return patchScene(state, (s) => ({
        ...s,
        objects: s.objects.map((o) => {
          if (o.id !== action.objectId) return o;
          const animations = [...(o.animations ?? [])];
          const current = animations[action.animationIndex];
          if (!current || current.images.length <= 1) return o;
          animations[action.animationIndex] = {
            ...current,
            images: current.images.filter((_, i) => i !== action.frameIndex),
          };
          return { ...o, animations };
        }),
      }));

    case "addObjectPoint":
      return patchScene(state, (s) => ({
        ...s,
        objects: s.objects.map((o) => {
          if (o.id !== action.objectId) return o;
          const animations = [...(o.animations ?? [])];
          const current = animations[action.animationIndex];
          if (!current) return o;
          animations[action.animationIndex] = {
            ...current,
            points: [
              ...current.points,
              {
                name: newNameGenerator(
                  "nuevoPunto",
                  current.points.map((p) => p.name),
                ),
                x: 0,
                y: 0,
              },
            ],
          };
          return { ...o, animations };
        }),
      }));

    case "updateObjectPoint":
      return patchScene(state, (s) => ({
        ...s,
        objects: s.objects.map((o) => {
          if (o.id !== action.objectId) return o;
          const animations = [...(o.animations ?? [])];
          const current = animations[action.animationIndex];
          if (!current) return o;
          animations[action.animationIndex] = {
            ...current,
            points: current.points.map((p, i) =>
              i === action.pointIndex ? { ...p, ...action.patch } : p,
            ),
          };
          return { ...o, animations };
        }),
      }));

    case "deleteObjectPoint":
      return patchScene(state, (s) => ({
        ...s,
        objects: s.objects.map((o) => {
          if (o.id !== action.objectId) return o;
          const animations = [...(o.animations ?? [])];
          const current = animations[action.animationIndex];
          if (!current) return o;
          animations[action.animationIndex] = {
            ...current,
            points: current.points.filter((_, i) => i !== action.pointIndex),
          };
          return { ...o, animations };
        }),
      }));

    /* --------------------------------------------------- behaviors/effects */
    case "addBehavior":
      return patchScene(state, (s) => ({
        ...s,
        objects: s.objects.map((o) =>
          o.id === action.objectId ? { ...o, behaviors: [...o.behaviors, action.behavior] } : o,
        ),
      }));

    case "updateBehavior":
      return patchScene(state, (s) => ({
        ...s,
        objects: s.objects.map((o) =>
          o.id === action.objectId
            ? {
                ...o,
                behaviors: o.behaviors.map((b) =>
                  b.name === action.behaviorName ? { ...b, ...action.patch } : b,
                ),
              }
            : o,
        ),
      }));

    case "deleteBehavior":
      return patchScene(state, (s) => ({
        ...s,
        objects: s.objects.map((o) =>
          o.id === action.objectId
            ? { ...o, behaviors: o.behaviors.filter((b) => b.name !== action.behaviorName) }
            : o,
        ),
      }));

    case "addEffect":
      return patchScene(state, (s) =>
        withEffects(s, action.target, (list) => [...list, action.effect]),
      );

    case "updateEffect":
      return patchScene(state, (s) =>
        withEffects(s, action.target, (list) =>
          list.map((e, i) => (i === action.index ? { ...e, ...action.patch } : e)),
        ),
      );

    case "deleteEffect":
      return patchScene(state, (s) =>
        withEffects(s, action.target, (list) => list.filter((_, i) => i !== action.index)),
      );

    case "moveEffect":
      return patchScene(state, (s) =>
        withEffects(s, action.target, (list) =>
          swap(list, action.index, action.index + action.direction),
        ),
      );

    case "toggleEffect":
      return patchScene(state, (s) =>
        withEffects(s, action.target, (list) =>
          list.map((e, i) =>
            i === action.index
              ? {
                  ...e,
                  parameters: {
                    ...e.parameters,
                    disabled: e.parameters["disabled"] === "yes" ? "no" : "yes",
                  },
                }
              : e,
          ),
        ),
      );

    /* ---------------------------------------------------------- instances */
    case "addInstance": {
      const obj = scene.objects.find((o) => o.id === action.objectId);
      if (!obj) return state;
      const isText = obj.type === "TextObject::Text" || obj.type === "Text";
      const inst: GDInstance = {
        id: uid("inst"),
        objectId: obj.id,
        x: Math.round(action.x),
        y: Math.round(action.y),
        angle: 0,
        customSize: false,
        width: isText ? 160 : 64,
        height: isText ? 32 : 64,
        zOrder: scene.instances.length + 1,
        layer: action.layer ?? scene.activeLayer ?? BASE_LAYER_NAME,
        locked: false,
        hiddenAtStart: false,
        variables: [],
        effects: [],
      };
      return patchScene(state, (s) => ({ ...s, instances: [...s.instances, inst] }));
    }

    case "addInstances":
      return patchScene(state, (s) => ({ ...s, instances: [...s.instances, ...action.instances] }));

    case "moveInstances":
      return patchScene(state, (s) => ({
        ...s,
        instances: s.instances.map((i) =>
          action.ids.includes(i.id) ? { ...i, x: i.x + action.dx, y: i.y + action.dy } : i,
        ),
      }));

    case "setInstancesPositions": {
      const posMap = new Map(action.positions.map((p) => [p.id, p]));
      return patchScene(state, (s) => ({
        ...s,
        instances: s.instances.map((i) => {
          const target = posMap.get(i.id);
          return target ? { ...i, x: target.x, y: target.y } : i;
        }),
      }));
    }

    case "updateInstance":
      return patchScene(state, (s) => ({
        ...s,
        instances: s.instances.map((i) => (i.id === action.id ? { ...i, ...action.patch } : i)),
      }));

    case "deleteInstances":
      return patchScene(state, (s) => ({
        ...s,
        instances: s.instances.filter((i) => !action.ids.includes(i.id)),
      }));

    case "duplicateInstances": {
      const copies = scene.instances
        .filter((i) => action.ids.includes(i.id))
        .map((i) => ({ ...i, id: uid("inst"), x: i.x + 20, y: i.y + 20, locked: false }));
      if (copies.length === 0) return state;
      return {
        ...patchScene(state, (s) => ({ ...s, instances: [...s.instances, ...copies] })),
        ui: { ...state.ui, selectedInstanceIds: copies.map((c) => c.id) },
      };
    }

    case "setInstancesZOrder": {
      const max = scene.instances.reduce((acc, i) => Math.max(acc, i.zOrder), 0);
      const min = scene.instances.reduce((acc, i) => Math.min(acc, i.zOrder), 0);
      return patchScene(state, (s) => ({
        ...s,
        instances: s.instances.map((i) =>
          action.ids.includes(i.id)
            ? {
                ...i,
                zOrder:
                  action.mode === "front"
                    ? max + 1
                    : action.mode === "back"
                      ? min - 1
                      : (action.value ?? i.zOrder),
              }
            : i,
        ),
      }));
    }

    case "toggleInstancesLock":
      return patchScene(state, (s) => ({
        ...s,
        instances: s.instances.map((i) =>
          action.ids.includes(i.id) ? { ...i, locked: !i.locked } : i,
        ),
      }));

    case "toggleInstancesVisibility":
      return patchScene(state, (s) => ({
        ...s,
        instances: s.instances.map((i) =>
          action.ids.includes(i.id) ? { ...i, hiddenAtStart: !i.hiddenAtStart } : i,
        ),
      }));

    /* -------------------------------------------------------------- layers */
    case "addLayer": {
      const name =
        action.name ??
        newNameGenerator(
          action.isLightingLayer ? "Capa de luz" : "Nueva capa",
          scene.layers.map((l) => l.name),
        );
      return patchScene(state, (s) => ({
        ...s,
        layers: [
          ...s.layers,
          {
            name,
            visible: true,
            camera: { x: 0, y: 0 },
            effects: [],
            ...(action.isLightingLayer === undefined
              ? {}
              : { isLightingLayer: action.isLightingLayer }),
            followBaseLayer: !action.isLightingLayer && s.layers.length > 0,
            ...(action.isLightingLayer ? { ambientLightColor: "180;180;180" } : {}),
          },
        ],
      }));
    }

    case "updateLayer":
      return patchScene(state, (s) => ({
        ...s,
        layers: s.layers.map((l) => (l.name === action.name ? { ...l, ...action.patch } : l)),
      }));

    case "renameLayer":
      return patchScene(state, (s) => ({
        ...s,
        layers: s.layers.map((l) => (l.name === action.from ? { ...l, name: action.to } : l)),
        instances: s.instances.map((i) =>
          i.layer === action.from ? { ...i, layer: action.to } : i,
        ),
        activeLayer: s.activeLayer === action.from ? action.to : s.activeLayer,
      }));

    case "deleteLayer":
      return patchScene(state, (s) => ({
        ...s,
        layers: s.layers.filter((l) => l.name !== action.name),
        instances: s.instances.filter((i) => i.layer !== action.name),
      }));

    case "moveLayer":
      return patchScene(state, (s) => ({
        ...s,
        layers: swap(
          s.layers,
          s.layers.findIndex((l) => l.name === action.name),
          s.layers.findIndex((l) => l.name === action.name) + action.direction,
        ),
      }));

    case "toggleLayerVisibility":
      return patchScene(state, (s) => ({
        ...s,
        layers: s.layers.map((l) => (l.name === action.name ? { ...l, visible: !l.visible } : l)),
      }));

    case "toggleLayerLock":
      return patchScene(state, (s) => ({
        ...s,
        layers: s.layers.map((l) => (l.name === action.name ? { ...l, locked: !l.locked } : l)),
      }));

    case "setActiveLayer":
      return patchScene(state, (s) => ({ ...s, activeLayer: action.name }));

    /* -------------------------------------------------------------- groups */
    case "addObjectGroup": {
      const name =
        action.name ??
        newNameGenerator(
          "Nuevo grupo",
          scene.groups.map((g) => g.name),
        );
      return patchScene(state, (s) => ({
        ...s,
        groups: [...s.groups, { name, objects: [], behaviors: [] }],
      }));
    }

    case "updateObjectGroup":
      return patchScene(state, (s) => ({
        ...s,
        groups: s.groups.map((g) =>
          g.name === action.name
            ? { ...g, ...action.patch, name: action.patch.name?.trim() || g.name }
            : g,
        ),
      }));

    case "deleteObjectGroup":
      return patchScene(state, (s) => ({
        ...s,
        groups: s.groups.filter((g) => g.name !== action.name),
      }));

    /* ----------------------------------------------------------- variables */
    case "addVariable": {
      const list =
        action.location.scope === "global"
          ? project.globalVariables
          : sceneVariablesOf(scene, action.location);
      const parent =
        action.location.path && action.location.path.length > 0
          ? variableAt(list, action.location.path)
          : undefined;
      const created = emptyVariableFor(parent);
      const nextList =
        parent === undefined
          ? [
              ...list,
              {
                ...created,
                name: newNameGenerator(
                  "Variable",
                  list.map((v) => v.name),
                ),
              },
            ]
          : mapVariableTree(list, action.location.path!, (v) =>
              v === parent ? { ...v, type: "structure", children: [...v.children, created] } : v,
            );
      return writeVariableList(state, action.location, nextList);
    }

    case "addVariableChild": {
      const list =
        action.location.scope === "global"
          ? project.globalVariables
          : sceneVariablesOf(scene, action.location);
      const parent = variableAt(list, action.path);
      if (!parent) return state;
      const created = emptyVariableFor(parent);
      const nextList = mapVariableTree(list, action.path, (v) =>
        v === parent ? { ...v, type: "structure", children: [...v.children, created] } : v,
      );
      return writeVariableList(state, action.location, nextList);
    }

    case "updateVariable": {
      const list =
        action.location.scope === "global"
          ? project.globalVariables
          : sceneVariablesOf(scene, action.location);
      const target = variableAt(list, action.path);
      if (!target) return state;
      // Renaming must produce a new object so siblings keep their order.
      const nextList = mapVariableTree(list, action.path, (v) => {
        if (v !== target) return v;
        const patch = { ...action.patch };
        if (patch.type && patch.type !== "number" && patch.type !== "string" && v.value === "0") {
          patch.value = patch.type === "boolean" ? "false" : "";
        }
        return { ...v, ...patch };
      });
      return writeVariableList(state, action.location, nextList);
    }

    case "deleteVariable": {
      const list =
        action.location.scope === "global"
          ? project.globalVariables
          : sceneVariablesOf(scene, action.location);
      const nextList = removeVariable(list, action.path);
      return writeVariableList(state, action.location, nextList);
    }

    /* --------------------------------------------------------------- events */
    case "addEvent": {
      const ev = newEvent(action.kind);
      return patchScene(state, (s) => ({
        ...s,
        events:
          action.parentId === null ? [...s.events, ev] : insertSub(s.events, action.parentId, ev),
      }));
    }

    case "insertGeneratedEvents": {
      if (action.events.length === 0) return state;
      const position = Math.max(
        0,
        Math.min(scene.events.length, action.position ?? scene.events.length),
      );
      const next = patchScene(state, (s) => {
        const events = [...s.events];
        events.splice(position, 0, ...action.events);
        return { ...s, events };
      });
      return {
        ...next,
        ui: {
          ...next.ui,
          tab: "events",
          selectedEventIds: action.events.map((event) => event.id),
          selectedInstanceIds: [],
          selectedObjectIds: [],
        },
      };
    }

    case "deleteEvent":
    case "deleteEvents": {
      // cleared below
      const ids = action.type === "deleteEvent" ? [action.id] : action.ids;
      return patchScene(state, (s) => ({
        ...s,
        events: mapEvents(s.events, (e) => (ids.includes(e.id) ? null : e)),
      }));
    }

    case "duplicateEvent": {
      const source = findEvent(scene.events, action.id);
      if (!source) return state;
      const copy = cloneEvent(source);
      const parentId = parentOfEvent(scene.events, action.id);
      return patchScene(state, (s) => ({
        ...s,
        events: siblingList(s.events, parentId, (list) => {
          const index = list.findIndex((e) => e.id === action.id);
          const next = [...list];
          next.splice(index + 1, 0, copy);
          return next;
        }),
      }));
    }

    case "toggleCollapse":
      return patchScene(state, (s) => ({
        ...s,
        events: mapEvents(s.events, (e) =>
          e.id === action.id ? { ...e, collapsed: !e.collapsed } : e,
        ),
      }));

    case "toggleEventDisabled":
      return patchScene(state, (s) => ({
        ...s,
        events: mapEvents(s.events, (e) =>
          e.id === action.id ? { ...e, disabled: !e.disabled } : e,
        ),
      }));

    case "updateEvent":
      return patchScene(state, (s) => ({
        ...s,
        events: mapEvents(s.events, (e) => (e.id === action.id ? { ...e, ...action.patch } : e)),
      }));

    case "moveEvent": {
      const parentId = parentOfEvent(scene.events, action.id);
      return patchScene(state, (s) => ({
        ...s,
        events: siblingList(s.events, parentId, (list) =>
          swap(
            list,
            list.findIndex((e) => e.id === action.id),
            list.findIndex((e) => e.id === action.id) + action.direction,
          ),
        ),
      }));
    }

    case "addInstruction":
      return patchScene(state, (s) => ({
        ...s,
        events: mapEvents(s.events, (e) =>
          e.id === action.eventId
            ? { ...e, [action.slot]: [...e[action.slot], action.instruction] }
            : e,
        ),
      }));

    case "toggleInstructionInverted":
      return patchScene(state, (s) => ({
        ...s,
        events: mapEvents(s.events, (e) =>
          e.id === action.eventId
            ? {
                ...e,
                [action.slot]: e[action.slot].map((ins) =>
                  ins.id === action.instructionId ? { ...ins, inverted: !ins.inverted } : ins,
                ),
              }
            : e,
        ),
      }));

    case "updateInstruction":
      return patchScene(state, (s) => ({
        ...s,
        events: mapEvents(s.events, (e) =>
          e.id === action.eventId
            ? {
                ...e,
                [action.slot]: e[action.slot].map((ins) =>
                  ins.id === action.instructionId ? { ...ins, ...action.patch } : ins,
                ),
              }
            : e,
        ),
      }));

    case "deleteInstruction":
      return patchScene(state, (s) => ({
        ...s,
        events: mapEvents(s.events, (e) =>
          e.id === action.eventId
            ? { ...e, [action.slot]: e[action.slot].filter((i) => i.id !== action.instructionId) }
            : e,
        ),
      }));

    case "moveInstruction":
      return patchScene(state, (s) => ({
        ...s,
        events: mapEvents(s.events, (e) => {
          if (e.id !== action.eventId) return e;
          const index = e[action.slot].findIndex((i) => i.id === action.instructionId);
          return { ...e, [action.slot]: swap(e[action.slot], index, index + action.direction) };
        }),
      }));

    /* ------------------------------------------------------------ resources */
    case "addResource":
      return {
        ...state,
        dirty: true,
        project: {
          ...project,
          resources: [
            ...project.resources,
            project.resources.some((r) => r.name === action.resource.name)
              ? {
                  ...action.resource,
                  name: newNameGenerator(
                    action.resource.name,
                    project.resources.map((r) => r.name),
                  ),
                }
              : action.resource,
          ],
        },
      };

    case "addGeneratedAssetBundle": {
      const resourceNames = project.resources.map((resource) => resource.name);
      const resourceName = project.resources.some(
        (resource) => resource.name === action.resource.name,
      )
        ? newNameGenerator(action.resource.name, resourceNames)
        : action.resource.name;
      const resource = {
        ...action.resource,
        name: resourceName,
        file:
          action.resource.file === action.resource.name || !action.resource.file
            ? resourceName
            : action.resource.file,
      };
      const objectName = scene.objects.some((object) => object.name === action.object.name)
        ? newNameGenerator(
            action.object.name,
            scene.objects.map((object) => object.name),
          )
        : action.object.name;
      const objectId = scene.objects.some((object) => object.id === action.object.id)
        ? uid("obj")
        : action.object.id;
      const rewriteResource = (name: string) =>
        name === action.resource.name || name === action.resource.file ? resourceName : name;
      const object: GDObjectDef = {
        ...action.object,
        id: objectId,
        name: objectName,
        ...(action.object.asset ? { asset: rewriteResource(action.object.asset) } : {}),
        ...(action.object.animations
          ? {
              animations: action.object.animations.map((animation) => ({
                ...animation,
                images: animation.images.map((frame) => ({
                  ...frame,
                  image: rewriteResource(frame.image),
                })),
              })),
            }
          : {}),
      };
      const instance = action.instance
        ? {
            ...action.instance,
            id: scene.instances.some((candidate) => candidate.id === action.instance!.id)
              ? uid("inst")
              : action.instance.id,
            objectId,
          }
        : undefined;
      const nextProject = withScene(
        { ...project, resources: [...project.resources, resource] },
        state.activeSceneName,
        (current) => ({
          ...current,
          objects: [...current.objects, object],
          instances: instance ? [...current.instances, instance] : current.instances,
        }),
      );
      return {
        ...state,
        dirty: true,
        project: nextProject,
        ui: {
          ...state.ui,
          selectedObjectIds: instance ? [] : [objectId],
          selectedInstanceIds: instance ? [instance.id] : [],
        },
      };
    }

    case "updateResource": {
      const current = project.resources.find((resource) => resource.name === action.name);
      if (!current) return state;
      const nextName = action.patch.name?.trim() || current.name;
      if (
        nextName !== current.name &&
        project.resources.some((resource) => resource.name === nextName)
      ) {
        return state;
      }
      const nextFile =
        action.patch.file ?? (current.file === current.name ? nextName : current.file);
      const resources = project.resources.map((resource) =>
        resource.name === action.name
          ? { ...resource, ...action.patch, name: nextName, file: nextFile }
          : resource,
      );
      const scenes = project.scenes.map((entry) => ({
        ...entry,
        objects: entry.objects.map((object) => ({
          ...object,
          ...(object.asset === current.name ? { asset: nextName } : {}),
          ...(object.animations
            ? {
                animations: object.animations.map((animation) => ({
                  ...animation,
                  images: animation.images.map((frame) =>
                    frame.image === current.name ? { ...frame, image: nextName } : frame,
                  ),
                })),
              }
            : {}),
        })),
        events: entry.events.map((event) => renameResourceInEvent(event, current.name, nextName)),
      }));
      return {
        ...state,
        dirty: true,
        project: { ...project, resources, scenes },
      };
    }

    case "deleteResource":
      return {
        ...state,
        dirty: true,
        project: { ...project, resources: project.resources.filter((r) => r.name !== action.name) },
      };

    /* ------------------------------------------------------------ extensions */
    case "installExtension":
      if (project.extensions.some((e) => e.name === action.extension.name)) return state;
      return {
        ...state,
        dirty: true,
        project: { ...project, extensions: [...project.extensions, action.extension] },
      };

    case "uninstallExtension":
      return {
        ...state,
        dirty: true,
        project: {
          ...project,
          extensions: project.extensions.filter((e) => e.name !== action.name),
        },
      };

    case "addExternalEvents": {
      const name =
        action.name ??
        newNameGenerator(
          "Nueva lista de eventos",
          project.externalEvents.map((e) => e.name),
        );
      return {
        ...state,
        dirty: true,
        project: { ...project, externalEvents: [...project.externalEvents, { name, events: [] }] },
      };
    }

    case "addExternalLayout": {
      const name =
        action.name ??
        newNameGenerator(
          "Nuevo diseño",
          project.externalLayouts.map((l) => l.name),
        );
      return {
        ...state,
        dirty: true,
        project: {
          ...project,
          externalLayouts: [...project.externalLayouts, { name, instances: [] }],
        },
      };
    }

    default:
      return state;
  }
}

function writeVariableList(
  state: State,
  location: VariableScopeLocation,
  list: GDVariable[],
): State {
  if (location.scope === "global") {
    return {
      ...state,
      dirty: true,
      project: { ...state.project, globalVariables: list },
    };
  }
  return patchScene(state, (s) => {
    if (location.scope === "scene") return { ...s, variables: list };
    if (location.scope === "object") {
      return {
        ...s,
        objects: s.objects.map((o) => (o.id === location.objectId ? { ...o, variables: list } : o)),
      };
    }
    return {
      ...s,
      instances: s.instances.map((i) =>
        i.id === location.objectId ? { ...i, variables: list } : i,
      ),
    };
  });
}

function swap<T>(list: T[], from: number, to: number): T[] {
  if (from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const a = list[from];
  const b = list[to];
  if (a === undefined || b === undefined) return list;
  const next = [...list];
  next[from] = b;
  next[to] = a;
  return next;
}

/** Applies an effects-list update on the layer/object/instance that owns the list. */
function withEffects(
  scene: GDScene,
  target: EffectTarget,
  updater: (list: GDEffect[]) => GDEffect[],
): GDScene {
  if (target.kind === "object") {
    return {
      ...scene,
      objects: scene.objects.map((o) =>
        o.id === target.id ? { ...o, effects: updater(o.effects) } : o,
      ),
    };
  }
  if (target.kind === "instance") {
    return {
      ...scene,
      instances: scene.instances.map((i) =>
        i.id === target.id ? { ...i, effects: updater(i.effects) } : i,
      ),
    };
  }
  return {
    ...scene,
    layers: scene.layers.map((l) =>
      l.name === target.name ? { ...l, effects: updater(l.effects) } : l,
    ),
  };
}

function renameResourceInEvent(event: GDEvent, from: string, to: string): GDEvent {
  const fix = (list: GDInstruction[]) =>
    list.map((instruction) => ({
      ...instruction,
      parameters:
        instruction.parameters["file"] === from
          ? { ...instruction.parameters, file: to }
          : instruction.parameters,
    }));
  return {
    ...event,
    conditions: fix(event.conditions),
    actions: fix(event.actions),
    subEvents: event.subEvents.map((child) => renameResourceInEvent(child, from, to)),
  };
}

function renameObjectInEvent(event: GDEvent, from: string, to: string): GDEvent {
  const fix = (list: GDInstruction[]) =>
    list.map((i) => {
      const parameters = { ...i.parameters };
      for (const key of Object.keys(parameters)) {
        if (parameters[key] === from) parameters[key] = to;
      }
      return { ...i, parameters };
    });
  return {
    ...event,
    conditions: fix(event.conditions),
    actions: fix(event.actions),
    subEvents: event.subEvents.map((s) => renameObjectInEvent(s, from, to)),
  };
}

export function cloneEvent(event: GDEvent): GDEvent {
  return {
    ...event,
    id: uid("ev"),
    conditions: event.conditions.map((c) => ({
      ...c,
      id: uid("in"),
      parameters: { ...c.parameters },
    })),
    actions: event.actions.map((a) => ({ ...a, id: uid("in"), parameters: { ...a.parameters } })),
    subEvents: event.subEvents.map(cloneEvent),
  };
}

/* ------------------------------------------------------------------ store */

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ui":
      return { ...state, ui: { ...state.ui, ...action.patch } };

    case "openDialog":
      return {
        ...state,
        ui: {
          ...state.ui,
          dialog: action.dialog,
          inlineAi: null,
          quickAutomationOpen: false,
        },
      };

    case "closeDialog":
      return { ...state, ui: { ...state.ui, dialog: null } };

    case "openInlineAi": {
      const scene =
        state.project.scenes.find((candidate) => candidate.name === state.activeSceneName) ??
        state.project.scenes[0];
      if (!scene) return state;
      const instanceIds = state.ui.selectedInstanceIds.filter((id) =>
        scene.instances.some((instance) => instance.id === id),
      );
      const objectIds = [
        ...new Set(
          instanceIds.length > 0
            ? instanceIds
                .map((id) => scene.instances.find((instance) => instance.id === id)?.objectId)
                .filter((id): id is string => Boolean(id))
            : state.ui.selectedObjectIds.filter((id) =>
                scene.objects.some((object) => object.id === id),
              ),
        ),
      ];
      const objects = objectIds
        .map((id) => scene.objects.find((object) => object.id === id))
        .filter((object): object is GDObjectDef => Boolean(object));
      const targetName =
        instanceIds.length === 1 && objects.length === 1
          ? objects[0]!.name
          : instanceIds.length > 1 && objects.length === 1
            ? `${objects[0]!.name} (${instanceIds.length} instancias)`
            : instanceIds.length > 0
              ? `${instanceIds.length} instancias`
              : objects.length === 1
                ? objects[0]!.name
                : objects.length > 1
                  ? `${objects.length} objetos`
                  : undefined;
      const inlineAi: InlineAiSession = {
        x: action.x,
        y: action.y,
        sceneName: scene.name,
        instanceIds,
        objectIds,
        cursorPosition: state.ui.cursorPosition ? { ...state.ui.cursorPosition } : null,
        ...(targetName ? { targetName } : {}),
      };
      return {
        ...state,
        ui: {
          ...state.ui,
          inlineAi,
          commandPaletteOpen: false,
          quickAutomationOpen: false,
        },
      };
    }

    case "closeInlineAi":
      return { ...state, ui: { ...state.ui, inlineAi: null } };

    case "markSaved":
      return { ...state, dirty: false };

    case "selectInstances":
      return {
        ...state,
        ui: {
          ...state.ui,
          selectedInstanceIds: action.ids,
          ...(action.ids.length > 0 ? { selectedObjectIds: [] } : {}),
        },
      };

    case "selectEvents":
      return { ...state, ui: { ...state.ui, selectedEventIds: action.ids } };

    case "openTab": {
      const id = action.tab.id ?? `${action.tab.kind}:${action.tab.label}`;
      const exists = state.ui.openedTabs.some((t) => t.id === id);
      const openedTabs = exists
        ? state.ui.openedTabs
        : [...state.ui.openedTabs, { ...action.tab, id }];
      const activeSceneName =
        action.tab.kind === "scene" && action.tab.sceneName
          ? action.tab.sceneName
          : state.activeSceneName;
      return {
        ...state,
        activeSceneName,
        ui: { ...state.ui, openedTabs, activeTabId: id },
      };
    }

    case "closeTab": {
      const index = state.ui.openedTabs.findIndex((t) => t.id === action.id);
      if (index === -1) return state;
      const openedTabs = state.ui.openedTabs.filter((t) => t.id !== action.id);
      let activeTabId = state.ui.activeTabId;
      let activeSceneName = state.activeSceneName;
      if (state.ui.activeTabId === action.id) {
        const next = openedTabs[Math.max(0, index - 1)];
        activeTabId = next?.id ?? "";
        if (next?.sceneName) activeSceneName = next.sceneName;
      }
      return { ...state, activeSceneName, ui: { ...state.ui, openedTabs, activeTabId } };
    }

    case "setActiveTab": {
      const tab = state.ui.openedTabs.find((t) => t.id === action.id);
      if (!tab) return state;
      return {
        ...state,
        activeSceneName: tab.sceneName ?? state.activeSceneName,
        ui: { ...state.ui, activeTabId: action.id },
      };
    }

    case "loadProject": {
      const migrated = migrateProject(action.project) ?? createDemoProject();
      const first = migrated.scenes[0]?.name ?? "Level 1";
      return {
        project: migrated,
        activeSceneName: first,
        ui: {
          ...initialUI,
          openedTabs: [{ id: `scene:${first}`, kind: "scene", label: first, sceneName: first }],
          activeTabId: `scene:${first}`,
        },
        agent: createAgentSession(migrated),
        past: [],
        future: [],
        dirty: false,
      };
    }

    case "applyAgentPlan": {
      if (action.agent === state.agent && action.project === state.project) return state;
      let openedTabs = state.ui.openedTabs;
      let activeTabId = state.ui.activeTabId;
      let activeSceneName = state.activeSceneName;
      const sceneName = action.sceneName;
      if (
        sceneName &&
        action.project.scenes.some((candidate) => candidate.name === sceneName) &&
        sceneName !== state.activeSceneName
      ) {
        const id = `scene:${sceneName}`;
        if (!state.ui.openedTabs.some((tab) => tab.id === id)) {
          openedTabs = [
            ...state.ui.openedTabs,
            { id, kind: "scene" as const, label: sceneName, sceneName },
          ];
        }
        activeSceneName = sceneName;
        activeTabId = id;
      }
      return {
        ...state,
        project: action.project,
        agent: action.agent,
        activeSceneName,
        dirty: action.project !== state.project ? true : state.dirty,
        ui: {
          ...state.ui,
          openedTabs,
          activeTabId,
          selectedInstanceIds: [],
          selectedObjectIds: [],
        },
        past: [
          ...state.past,
          { project: state.project, sceneName: state.activeSceneName, agent: state.agent },
        ].slice(-60),
        future: [],
      };
    }

    case "agentAudit":
      return { ...state, agent: withAuditEntry(state.agent, action.entry) };

    case "agentSetMode":
      return { ...state, agent: setAgentMode(state.agent, action.mode) };

    case "agentSetSnapshotMode":
      return { ...state, agent: setAgentSnapshotMode(state.agent, action.mode) };

    case "recordHistory": {
      return {
        ...state,
        past: [
          ...state.past,
          { project: state.project, sceneName: state.activeSceneName, agent: state.agent },
        ].slice(-60),
        future: [],
        dirty: true,
      };
    }

    case "undo": {
      const prev = state.past[state.past.length - 1];
      if (!prev) return state;
      return {
        ...state,
        project: prev.project,
        activeSceneName: prev.sceneName,
        agent: prev.agent,
        past: state.past.slice(0, -1),
        future: [
          { project: state.project, sceneName: state.activeSceneName, agent: state.agent },
          ...state.future,
        ].slice(0, 60),
        dirty: true,
      };
    }

    case "redo": {
      const next = state.future[0];
      if (!next) return state;
      return {
        ...state,
        project: next.project,
        activeSceneName: next.sceneName,
        agent: next.agent,
        past: [
          ...state.past,
          { project: state.project, sceneName: state.activeSceneName, agent: state.agent },
        ].slice(-60),
        future: state.future.slice(1),
        dirty: true,
      };
    }

    default: {
      const nextProject = projectReducer(state, action);
      if (nextProject === state) return state;
      const changed = nextProject.project !== state.project || nextProject.ui !== state.ui;
      if (!changed) return state;
      const record =
        MUTATING.has(action.type) &&
        action.type !== "moveInstances" &&
        action.type !== "setInstancesPositions";
      return {
        ...nextProject,
        past: record
          ? [
              ...state.past,
              { project: state.project, sceneName: state.activeSceneName, agent: state.agent },
            ].slice(-60)
          : nextProject.past,
        future: record ? [] : nextProject.future,
      };
    }
  }
}

/** Zoom limits from GDevelop's `Utils/ZoomUtils.js`. */
export const MIN_ZOOM = 1 / 128;
export const MAX_ZOOM = 128;
export const clampZoom = (zoom: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));

interface Ctx {
  state: State;
  project: GDProject;
  scene: GDScene;
  activeSceneName: string;
  /** kind of the document tab currently focused ("scene" | "home" | ...) */
  activeTabKind: OpenedTabKind;
  ui: UIState;
  /** Agent session state (memory, autonomy mode, snapshots, audit). */
  agent: AgentSessionState;
  dispatch: React.Dispatch<Action>;
  applyInlineAiPrompt: (prompt: string, targetName?: string) => Promise<string>;
  canUndo: boolean;
  canRedo: boolean;
  dirty: boolean;
}

const EditorContext = React.createContext<Ctx | null>(null);

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(reducer, undefined, () => {
    const project = createDemoProject();
    return {
      project,
      activeSceneName: project.scenes[0]?.name ?? "Level 1",
      ui: initialUI,
      agent: createAgentSession(project),
      past: [],
      future: [],
      dirty: false,
    };
  });

  // Load the project picked from the home screen after hydration.
  React.useEffect(() => {
    const current = getCurrentProject();
    if (current?.project) {
      dispatch({ type: "loadProject", project: current.project as GDProject });
    }
  }, []);

  const activeTab = state.ui.openedTabs.find((tab) => tab.id === state.ui.activeTabId);
  const applyInlineAiPrompt = React.useCallback(
    async (prompt: string, targetName?: string) => {
      const session = state.ui.inlineAi;
      if (!session) throw new Error("El editor in-situ de IA ya no está abierto.");
      if (targetName !== session.targetName) {
        throw new Error("La selección cambió mientras se preparaba la edición.");
      }
      const targetScene = state.project.scenes.find(
        (candidate) => candidate.name === session.sceneName,
      );
      if (!targetScene) throw new Error("La escena que intentas editar ya no existe.");

      const plan = createAiEditPlan(prompt, {
        scene: targetScene,
        selectedInstanceIds: session.instanceIds,
        selectedObjectIds: session.objectIds,
        cursorPosition: session.cursorPosition,
      });
      const applied = applyAiEditPlan(targetScene, plan);
      dispatch({
        type: "applyAiEdit",
        sceneName: session.sceneName,
        scene: applied.scene,
        ...(applied.selectedInstanceIds !== undefined
          ? { selectedInstanceIds: applied.selectedInstanceIds }
          : {}),
      });
      // The in-situ edit uses its own validated pipeline, but the session
      // memory records every AI change so the agent panel shows the whole
      // picture. Its undo is the editor's regular undo, not a plan rollback.
      dispatch({
        type: "agentAudit",
        entry: makeAuditEntry("applied", `Edición in-situ IA: ${plan.summary}`),
      });
      return plan.summary;
    },
    [state],
  );

  const value = React.useMemo<Ctx>(
    () => ({
      state,
      project: state.project,
      scene:
        state.project.scenes.find((s) => s.name === state.activeSceneName) ??
        state.project.scenes[0]!,
      activeSceneName: state.activeSceneName,
      activeTabKind: activeTab?.kind ?? "scene",
      ui: state.ui,
      agent: state.agent,
      dispatch,
      applyInlineAiPrompt,
      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0,
      dirty: state.dirty,
    }),
    [state, activeTab, applyInlineAiPrompt],
  );

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export function useEditor() {
  const ctx = React.useContext(EditorContext);
  if (!ctx) throw new Error("useEditor must be used inside EditorProvider");
  return ctx;
}

export type {
  GDScene,
  GDProject,
  GDObjectDef,
  GDInstance,
  GDEvent,
  GDInstruction,
  GDVariable,
  GDEffect,
  GDObjectBehavior,
};
