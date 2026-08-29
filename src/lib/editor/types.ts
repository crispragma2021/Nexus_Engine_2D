// Project model types for the Nexus Engine editor.
//
// The shape mirrors GDevelop's serialized project (jsonObject / gdProject) closely
// enough that a real .json exported by GDevelop reads correctly: objects carry
// animations + frames + points, layers carry camera + effects, behaviours and
// effects are lists of {type, parameters}. Everything the editor mutates goes
// through `src/lib/editor/store.tsx`; the runtime consumes one *scene* at a time
// (see `src/lib/editor/scenes.ts`).

export type GDVariableType = "number" | "string" | "boolean" | "structure" | "array";

export interface GDVariable {
  name: string;
  type: GDVariableType;
  /** number as string, text, "true"/"false"; unused for structure/array */
  value: string;
  children: GDVariable[];
  /** render a string variable as text instead of a number field */
  previewAsString?: boolean | undefined;
}

export interface GDObjectPoint {
  name: string;
  x: number;
  y: number;
}

export interface GDHitBoxPoint {
  /** Pixel coordinate in the source frame. */
  x: number;
  y: number;
}

/**
 * Editable collision geometry stored on a regular sprite frame. Generated masks
 * intentionally use the same project model and object editor as manual masks.
 */
export interface GDFrameHitBox {
  kind: "rectangle" | "polygon";
  x: number;
  y: number;
  width: number;
  height: number;
  /** Source frame dimensions used to scale this mask with the instance. */
  referenceWidth?: number | undefined;
  referenceHeight?: number | undefined;
  vertices: GDHitBoxPoint[];
  /** Helps the inspector explain where the initial suggestion came from. */
  source?: "manual" | "detected" | undefined;
}

export interface GDAnimationFrameImage {
  /** resource name, e.g. "player.png" */
  image: string;
  /** origin of the frame inside the image (GDevelop "Origen") */
  originX: number;
  originY: number;
  /** rotation/scale center (GDevelop "Centro") */
  centerX: number;
  centerY: number;
  opacity: number;
  /** Optional custom collision shape, inspectable in ObjectEditorDialog. */
  hitBox?: GDFrameHitBox | undefined;
}

export interface GDObjectAnimation {
  name: string;
  loops: boolean;
  /** milliseconds between frames, GDevelop default is 1 (as fast as possible) */
  timeBetweenFrames: number;
  /** 0 = automatic (all frames at once), 1+ = one frame per tick */
  haveCustomHitBoxes?: boolean | undefined;
  images: GDAnimationFrameImage[];
  points: GDObjectPoint[];
}

export interface GDObjectBehavior {
  /** instance name, unique inside the object ("PlatformerObject") */
  name: string;
  /** behavior type from the catalog ("PlatformBehavior::PlatformerObjectBehavior") */
  type: string;
  properties: Record<string, string>;
}

export interface GDEffect {
  type: string;
  /** user-visible name, defaults to the catalog label */
  name: string;
  parameters: Record<string, string>;
}

export interface GDObjectDef {
  id: string;
  name: string;
  /** object type from the catalog, e.g. "Sprite", "Tiled Sprite", "Text" */
  type: string;
  /** image resource used by simple (non animated) objects */
  asset?: string | undefined;
  /** text content for Text objects */
  text?: string | undefined;
  textColor?: string | undefined;
  textSize?: number | undefined;
  fontFamily?: string | undefined;
  bold?: boolean | undefined;
  italic?: boolean | undefined;
  alignment?: "left" | "center" | "right" | undefined;
  wrapping?: boolean | undefined;
  /** Sprite animations (frames reference resources by name) */
  animations?: GDObjectAnimation[] | undefined;
  behaviors: GDObjectBehavior[];
  effects: GDEffect[];
  variables: GDVariable[];
  /** promoted to the project so every scene can reuse it */
  isGlobal?: boolean | undefined;
  /** editor-only: hide every instance of this object in the scene view */
  instancesHidden?: boolean | undefined;
}

export interface GDInstance {
  id: string;
  objectId: string;
  x: number;
  y: number;
  angle: number;
  /** "Personalizar tamaño" — when false the original image size is used */
  customSize: boolean;
  width: number;
  height: number;
  zOrder: number;
  layer: string;
  locked: boolean;
  /** "Oculto cuando la escena comienza" */
  hiddenAtStart: boolean;
  /** instance variables overriding the object defaults */
  variables: GDVariable[];
  effects: GDEffect[];
}

export interface GDLayer {
  name: string;
  /** visibility in the editor (GDevelop "visible"/eye icon) */
  visible: boolean;
  locked?: boolean | undefined;
  camera: { x: number; y: number };
  effects: GDEffect[];
  isLightingLayer?: boolean | undefined;
  /** base layer camera drives this layer */
  followBaseLayer?: boolean | undefined;
  ambientLightColor?: string | undefined;
}

export interface GDObjectGroup {
  name: string;
  objects: string[];
  /** behaviors shared by every object of the group */
  behaviors: GDObjectBehavior[];
}

export type GDInstructionKind = "standard" | "comment" | "group" | "link" | "else";

export interface GDInstruction {
  id: string;
  /** id in the instruction catalog */
  typeId: string;
  /** "Añadir si …no" — the condition is negated */
  inverted: boolean;
  disabled?: boolean | undefined;
  parameters: Record<string, string>;
}

export interface GDEvent {
  id: string;
  kind: GDInstructionKind;
  conditions: GDInstruction[];
  actions: GDInstruction[];
  subEvents: GDEvent[];
  collapsed: boolean;
  disabled?: boolean | undefined;
  /** comment events */
  comment?: string | undefined;
  commentColors?: { background: string; text: string } | undefined;
  /** group events */
  groupName?: string | undefined;
  groupColor?: string | undefined;
  /** link to external events */
  linkToEventsName?: string | undefined;
}

export interface GDSceneGridSettings {
  show: boolean;
  snap: boolean;
  width: number;
  height: number;
  kind: "rectangular" | "isometric";
  /** GDevelop default: rgb(158,180,255) at alpha 0.8 */
  color: string;
  alpha: number;
  offsetX: number;
  offsetY: number;
}

export interface GDScene {
  name: string;
  /** GDevelop "R;G;B" format */
  backgroundColor: string;
  /** per-scene resolution override ("Usar un tamaño personalizado") */
  useCustomWindowSize?: boolean | undefined;
  customWindowWidth?: number | undefined;
  customWindowHeight?: number | undefined;
  magnification?: number | undefined;
  adaptResolutionAtRuntime?: boolean | undefined;
  stopSoundsOnSceneChange?: boolean | undefined;
  grid: GDSceneGridSettings;
  layers: GDLayer[];
  /** layer new instances land on */
  activeLayer: string;
  objects: GDObjectDef[];
  instances: GDInstance[];
  events: GDEvent[];
  variables: GDVariable[];
  groups: GDObjectGroup[];
}

export interface GDResourceGenerationMetadata {
  provider: "huggingface" | "cloudflare" | "procedural";
  prompt?: string | undefined;
  model?: string | undefined;
  generatedAt?: string | undefined;
  backgroundRemoved?: boolean | undefined;
}

export interface GDResourceEditorMetadata {
  source: "manual" | "generated" | "procedural";
  generation?: GDResourceGenerationMetadata | undefined;
  /** Editable SFXR values; kept generic so imported audio remains format-agnostic. */
  sfx?: Record<string, number | string> | undefined;
}

export interface GDResource {
  name: string;
  kind: "image" | "audio" | "font" | "json" | "video";
  /** file name as stored in the project folder */
  file: string;
  /** Resolved browser URL. Imported/generated files use a persistent data URL. */
  url?: string | undefined;
  /** Legacy metadata text kept for GDevelop-compatible project round trips. */
  metadata?: string | undefined;
  /** Structured, user-inspectable provenance and procedural settings. */
  editorMetadata?: GDResourceEditorMetadata | undefined;
  alwaysLoaded?: boolean | undefined;
  /** size in KB, shown in the resources list like GDevelop does */
  size?: number | undefined;
}

export interface GDGameSettings {
  author: string;
  description: string;
  version: string;
  packageName: string;
  orientation: "landscape" | "portrait" | "any";
  windowWidth: number;
  windowHeight: number;
  useWindowSizeAsBaseSize: boolean;
  /** editor/preview magnification, GDevelop: 1 */
  magnification: number;
  minFPS: number;
  maxFPS: number;
  adaptGameResolutionAtRuntime: boolean;
  scaleMode: "nearest" | "linear";
  windowMode: "default" | "fullscreen" | "resizable";
  startScene: string;
  pauseOnLostFocus: boolean;
  renderOutsideGameArea: boolean;
  loadingScreen: {
    displayBrandSplash: boolean;
    minDuration: number;
    fadeInDuration: number;
    fadeOutDuration: number;
    backgroundColor: string;
    backgroundImage?: string | undefined;
  };
  watermark: { showOnMobile: boolean };
  projectUuid: string;
  folderPolicy: "doNotUse" | "automatic";
}

export interface GDExtension {
  name: string;
  longName?: string | undefined;
  version?: string | undefined;
  /** icon file name inside the extension package */
  icon?: string | undefined;
  loaded?: boolean | undefined;
}

export interface GDExternalEvent {
  name: string;
  events: GDEvent[];
}

export interface GDExternalLayout {
  name: string;
  instances: GDInstance[];
}

export interface GDProject {
  name: string;
  /** first scene = legacy `scenes[0]` */
  scenes: GDScene[];
  gameSettings: GDGameSettings;
  resources: GDResource[];
  globalVariables: GDVariable[];
  extensions: GDExtension[];
  externalEvents: GDExternalEvent[];
  externalLayouts: GDExternalLayout[];
  version: string;
  firstLayoutName: string;
}

/** What the runtime is handed: one scene + the project bits it needs. */
export interface GDRuntimeScene {
  name: string;
  backgroundColor: string;
  windowWidth: number;
  windowHeight: number;
  layers: GDLayer[];
  objects: GDObjectDef[];
  instances: GDInstance[];
  events: GDEvent[];
  sceneVariables: GDVariable[];
  globalVariables: GDVariable[];
  groups: GDObjectGroup[];
  scenes: string[];
}

export const DEFAULT_GRID: GDSceneGridSettings = {
  show: false,
  snap: false,
  width: 32,
  height: 32,
  kind: "rectangular",
  color: "158;180;255",
  alpha: 0.8,
  offsetX: 0,
  offsetY: 0,
};
