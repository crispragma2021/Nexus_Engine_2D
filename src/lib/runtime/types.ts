// Runtime model: the live, mutable state the TS engine simulates each frame.

export interface RTObject {
  /** unique runtime id */
  id: string;
  /** object definition name, e.g. "Player" */
  name: string;
  /** definition type, e.g. "Sprite" | "Text" | "Tiled Sprite" */
  type: string;
  asset?: string;
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
  text: string;
  textColor: string;
  textSize: number;
  animation: number;
  behaviors: string[];
  /** velocity in pixels/second */
  vx: number;
  vy: number;
  onFloor: boolean;
  variables: Record<string, string>;
  destroyed: boolean;
}

export interface RTCamera {
  x: number;
  y: number;
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
  variables: Record<string, string>;
  timers: Record<string, number>;
  camera: RTCamera;
  time: number;
  frame: number;
  sceneName: string;
  logs: RTLogEntry[];
}

/** Physics constants for the built-in platformer behavior. */
export const PHYSICS = {
  gravity: 1800,
  maxFallSpeed: 900,
  jumpSpeed: 700,
  damping: 0.86,
} as const;
