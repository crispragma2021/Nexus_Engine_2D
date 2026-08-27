import * as React from "react";
import type { GDEvent, GDInstance, GDInstruction, GDObjectDef, GDProject } from "./types";
import { createDemoProject, uid } from "./data";

export type EditorTab = "scene" | "events";

interface UIState {
  tab: EditorTab;
  selectedInstanceIds: string[];
  selectedObjectId: string | null;
  rightTab: "properties" | "instances" | "layers";
  showLeftPanel: boolean;
  showRightPanel: boolean;
  grid: boolean;
  snap: boolean;
  zoom: number;
  projectManagerOpen: boolean;
}

type Action =
  | { type: "ui"; patch: Partial<UIState> }
  | { type: "selectInstance"; id: string | null; additive?: boolean }
  | { type: "moveInstance"; id: string; x: number; y: number }
  | { type: "updateInstance"; id: string; patch: Partial<GDInstance> }
  | { type: "deleteInstance"; id: string }
  | { type: "addInstance"; objectId: string; x: number; y: number }
  | { type: "addObject"; object: GDObjectDef }
  | { type: "updateObject"; id: string; patch: Partial<GDObjectDef> }
  | { type: "deleteObject"; id: string }
  | { type: "toggleLayer"; name: string }
  | { type: "toggleLayerLock"; name: string }
  | { type: "setActiveLayer"; name: string }
  | { type: "setBackgroundColor"; value: string }
  | { type: "addSceneVariable" }
  | { type: "updateSceneVariable"; id: string; patch: Partial<GDSceneVariable> }
  | { type: "deleteSceneVariable"; id: string }
  | { type: "addLayer" }

  | { type: "addEvent"; parentId: string | null; kind: GDEvent["kind"] }
  | { type: "deleteEvent"; id: string }
  | { type: "toggleCollapse"; id: string }
  | { type: "updateEvent"; id: string; patch: Partial<GDEvent> }
  | { type: "addInstruction"; eventId: string; slot: "conditions" | "actions"; instruction: GDInstruction }
  | { type: "updateInstruction"; eventId: string; slot: "conditions" | "actions"; instructionId: string; patch: Partial<GDInstruction> }
  | { type: "deleteInstruction"; eventId: string; slot: "conditions" | "actions"; instructionId: string }
  | { type: "undo" }
  | { type: "redo" };

interface State {
  project: GDProject;
  ui: UIState;
  past: GDProject[];
  future: GDProject[];
}

const initialUI: UIState = {
  tab: "scene",
  selectedInstanceIds: [],
  selectedObjectId: null,
  rightTab: "properties",
  showLeftPanel: true,
  showRightPanel: true,
  grid: true,
  snap: false,
  zoom: 1,
  projectManagerOpen: false,
};

/* ---------- event tree helpers ---------- */

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
      ? { ...e, collapsed: false, subEvents: [...e.subEvents, child] }
      : { ...e, subEvents: insertSub(e.subEvents, parentId, child) },
  );
}

export function newEvent(kind: GDEvent["kind"]): GDEvent {
  return {
    id: uid("ev"),
    kind,
    conditions: [],
    actions: [],
    subEvents: [],
    collapsed: false,
    ...(kind === "comment" ? { comment: "Write your comment here", commentColor: "green" as const } : {}),
    ...(kind === "group" ? { groupName: "New group", groupColor: "#7046EC" } : {}),
  };
}

/* ---------- reducer ---------- */

const MUTATING = new Set([
  "moveInstance", "updateInstance", "deleteInstance", "addInstance",
  "addObject", "updateObject", "deleteObject", "toggleLayer", "addLayer",
  "addEvent", "deleteEvent", "updateEvent",
  "addInstruction", "updateInstruction", "deleteInstruction",
]);

function projectReducer(project: GDProject, action: Action): GDProject {
  switch (action.type) {
    case "moveInstance":
      return {
        ...project,
        instances: project.instances.map((i) =>
          i.id === action.id ? { ...i, x: action.x, y: action.y } : i,
        ),
      };
    case "updateInstance":
      return {
        ...project,
        instances: project.instances.map((i) =>
          i.id === action.id ? { ...i, ...action.patch } : i,
        ),
      };
    case "deleteInstance":
      return { ...project, instances: project.instances.filter((i) => i.id !== action.id) };
    case "addInstance": {
      const obj = project.objects.find((o) => o.id === action.objectId);
      if (!obj) return project;
      const inst: GDInstance = {
        id: uid("inst"),
        objectId: obj.id,
        x: action.x,
        y: action.y,
        angle: 0,
        width: obj.type === "Text" ? 140 : 64,
        height: obj.type === "Text" ? 32 : 64,
        zOrder: project.instances.length + 1,
        layer: project.layers[0]?.name ?? "Base layer",
        locked: false,
        customSize: false,
      };
      return { ...project, instances: [...project.instances, inst] };
    }
    case "addObject":
      return { ...project, objects: [...project.objects, action.object] };
    case "updateObject":
      return {
        ...project,
        objects: project.objects.map((o) => (o.id === action.id ? { ...o, ...action.patch } : o)),
      };
    case "deleteObject":
      return {
        ...project,
        objects: project.objects.filter((o) => o.id !== action.id),
        instances: project.instances.filter((i) => i.objectId !== action.id),
      };
    case "toggleLayer":
      return {
        ...project,
        layers: project.layers.map((l) =>
          l.name === action.name ? { ...l, visible: !l.visible } : l,
        ),
      };
    case "addLayer":
      return {
        ...project,
        layers: [...project.layers, { name: `Layer ${project.layers.length + 1}`, visible: true }],
      };
    case "addEvent": {
      const ev = newEvent(action.kind);
      if (!action.parentId) return { ...project, events: [...project.events, ev] };
      return { ...project, events: insertSub(project.events, action.parentId, ev) };
    }
    case "deleteEvent":
      return { ...project, events: mapEvents(project.events, (e) => (e.id === action.id ? null : e)) };
    case "updateEvent":
      return {
        ...project,
        events: mapEvents(project.events, (e) => (e.id === action.id ? { ...e, ...action.patch } : e)),
      };
    case "addInstruction":
      return {
        ...project,
        events: mapEvents(project.events, (e) =>
          e.id === action.eventId
            ? { ...e, [action.slot]: [...e[action.slot], action.instruction] }
            : e,
        ),
      };
    case "updateInstruction":
      return {
        ...project,
        events: mapEvents(project.events, (e) =>
          e.id === action.eventId
            ? {
                ...e,
                [action.slot]: e[action.slot].map((ins) =>
                  ins.id === action.instructionId ? { ...ins, ...action.patch } : ins,
                ),
              }
            : e,
        ),
      };
    case "deleteInstruction":
      return {
        ...project,
        events: mapEvents(project.events, (e) =>
          e.id === action.eventId
            ? { ...e, [action.slot]: e[action.slot].filter((i) => i.id !== action.instructionId) }
            : e,
        ),
      };
    default:
      return project;
  }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ui":
      return { ...state, ui: { ...state.ui, ...action.patch } };
    case "selectInstance": {
      if (!action.id) return { ...state, ui: { ...state.ui, selectedInstanceIds: [] } };
      const sel = action.additive
        ? state.ui.selectedInstanceIds.includes(action.id)
          ? state.ui.selectedInstanceIds.filter((i) => i !== action.id)
          : [...state.ui.selectedInstanceIds, action.id]
        : [action.id];
      return { ...state, ui: { ...state.ui, selectedInstanceIds: sel, rightTab: "properties" } };
    }
    case "toggleCollapse":
      return {
        ...state,
        project: projectReducer(state.project, {
          type: "updateEvent",
          id: action.id,
          patch: {
            collapsed: !findEvent(state.project.events, action.id)?.collapsed,
          },
        }),
      };
    case "undo": {
      const prev = state.past[state.past.length - 1];
      if (!prev) return state;
      return {
        ...state,
        project: prev,
        past: state.past.slice(0, -1),
        future: [state.project, ...state.future].slice(0, 50),
      };
    }
    case "redo": {
      const next = state.future[0];
      if (!next) return state;
      return {
        ...state,
        project: next,
        past: [...state.past, state.project].slice(-50),
        future: state.future.slice(1),
      };
    }
    default: {
      const project = projectReducer(state.project, action);
      if (project === state.project) return state;
      const record = MUTATING.has(action.type) && action.type !== "moveInstance";
      return {
        ...state,
        project,
        past: record ? [...state.past, state.project].slice(-50) : state.past,
        future: record ? [] : state.future,
      };
    }
  }
}

export function findEvent(events: GDEvent[], id: string): GDEvent | undefined {
  for (const e of events) {
    if (e.id === id) return e;
    const found = findEvent(e.subEvents, id);
    if (found) return found;
  }
  return undefined;
}

interface Ctx {
  state: State;
  project: GDProject;
  ui: UIState;
  dispatch: React.Dispatch<Action>;
  canUndo: boolean;
  canRedo: boolean;
}

const EditorContext = React.createContext<Ctx | null>(null);

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(reducer, undefined, () => ({
    project: createDemoProject(),
    ui: initialUI,
    past: [],
    future: [],
  }));

  const value = React.useMemo<Ctx>(
    () => ({
      state,
      project: state.project,
      ui: state.ui,
      dispatch,
      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0,
    }),
    [state],
  );

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export function useEditor() {
  const ctx = React.useContext(EditorContext);
  if (!ctx) throw new Error("useEditor must be used inside EditorProvider");
  return ctx;
}
