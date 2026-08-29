// Runtime model: the live, mutable state the Nexus Engine TypeScript runtime
// simulates each frame. Built from one scene of the editor project.

import type { GDFrameHitBox } from "../editor/types";

export interface RTObject {
  /** unique runtime id */
  id: string;
  /** object definition name, e.g. "Jugador" */
  name: string;
  /** definition type, e.g. "Sprite" | "TextObject::Text" */
  type: string;
  /** current image resource (first frame of the current animation) */
  asset?: string;
  /** Current frame collision geometry, scaled with the runtime instance. */
  hitBox?: GDFrameHitBox;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  zOrder: number;
  layer: string;
  opacity: number;
  hidden: boolean;
  flipX: boolean;
  flipY: boolean;
  text: string;
  textColor: string;
  textSize: number;
  bold: boolean;
  fontFamily?: string;
  alignment: "left" | "center" | "right";
  animationIndex: number;
  animationName: string;
  /** 0 = as fast as possible, otherwise ms between frames */
  timeBetweenFrames: number;
  animationSpeedScale: number;
  frameIndex: number;
  frameTimer: number;
  /** list of behavior names on the object */
  behaviors: string[];
  /** behavior name -> type id, so instructions can target a specific behavior */
  behaviorTypes: Record<string, string>;
  /** per-behavior numeric/boolean properties, from the editor definition */
  behaviorProps: Record<string, Record<string, string>>;
  /** simulated platformer controls */
  controls: { left: boolean; right: boolean; up: boolean; down: boolean; jump: boolean };
  ignoreControls: boolean;
  onFloor: boolean;
  jumping: boolean;
  falling: boolean;
  vx: number;
  vy: number;
  gravity: number;
  maxFallingSpeed: number;
  friction: number;
  health: number;
  maxHealth: number;
  flash: { active: boolean; elapsed: number; duration: number; half: number; hidden: boolean };
  tweens: Record<
    string,
    {
      kind: string;
      from: number;
      to: number;
      elapsed: number;
      duration: number;
      easing: string;
      done: boolean;
    }
  >;
  tint: [number, number, number] | null;
  colorOverlay: [number, number, number, number] | null;
  variables: Record<string, string>;
  destroyed: boolean;
}

export interface RTLayer {
  name: string;
  visible: boolean;
  cameraX: number;
  cameraY: number;
  cameraZoom: number;
  opacity: number;
  followBaseLayer: boolean;
}

export interface RTCamera {
  x: number;
  y: number;
  /** zoom of the base layer camera (`SetCameraZoom`) */
  zoom?: number;
}

export interface RTInput {
  keys: Set<string>;
  keysJustReleased: Set<string>;
  mouse: Set<string>;
  pointerX: number;
  pointerY: number;
}

export interface RTLogEntry {
  time: number;
  message: string;
}

export interface RuntimeState {
  objects: RTObject[];
  layers: Record<string, RTLayer>;
  /** scene variables, flattened ("Jugador.controles" style keys for children) */
  variables: Record<string, string>;
  globalVariables: Record<string, string>;
  timers: Record<string, number>;
  pausedTimers: Record<string, boolean>;
  camera: RTCamera;
  time: number;
  timeScale: number;
  frame: number;
  sceneName: string;
  logs: RTLogEntry[];
  paused: boolean;
  stats: {
    objectsCount: number;
    /** instructions run during the last frame */
    instructionsCount: number;
    /** conditions/evaluations of the last frame */
    eventsCount: number;
    /** simulation time of the last frame, in ms */
    frameTimeMs: number;
  };
}

/** Physics constants for the built-in platformer behavior (GDevelop defaults). */
export const PHYSICS = {
  gravity: 1800,
  maxFallSpeed: 900,
  jumpSpeed: 600,
  jumpSustain: 300,
  acceleration: 800,
  maxSpeed: 250,
  friction: 20,
  damping: 0.86,
} as const;
