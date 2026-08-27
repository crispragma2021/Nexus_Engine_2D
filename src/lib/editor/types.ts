// Project model types for the GDevelop-style editor clone.

export interface GDVariable {
  name: string;
  value: string;
}

export interface GDObjectDef {
  id: string;
  name: string;
  /** e.g. "Sprite", "Tiled Sprite", "Text" */
  type: string;
  /** image asset url for sprite-like objects */
  asset?: string;
  /** text content for Text objects */
  text?: string;
  textColor?: string;
  textSize?: number;
  behaviors: string[];
  variables: GDVariable[];
}

export interface GDInstance {
  id: string;
  objectId: string;
  x: number;
  y: number;
  angle: number;
  width: number;
  height: number;
  zOrder: number;
  layer: string;
  locked: boolean;
  customSize: boolean;
}

export interface GDLayer {
  name: string;
  visible: boolean;
  locked?: boolean;
}

export type GDSceneVariableType = "number" | "string" | "boolean";

export interface GDSceneVariable {
  id: string;
  name: string;
  type: GDSceneVariableType;
  value: string;
}


export interface GDInstruction {
  id: string;
  /** id in the instruction catalog */
  typeId: string;
  inverted: boolean;
  parameters: Record<string, string>;
}

export type GDEventKind = "standard" | "comment" | "group";

export interface GDEvent {
  id: string;
  kind: GDEventKind;
  conditions: GDInstruction[];
  actions: GDInstruction[];
  subEvents: GDEvent[];
  collapsed: boolean;
  disabled?: boolean;
  /** comment events */
  comment?: string;
  commentColor?: "green" | "yellow" | "orange";
  /** group events */
  groupName?: string;
  groupColor?: string;
}

export interface GDProject {
  name: string;
  windowWidth: number;
  windowHeight: number;
  objects: GDObjectDef[];
  instances: GDInstance[];
  layers: GDLayer[];
  events: GDEvent[];
  scenes: string[];
  extensions: string[];
  /** scene background color, GDevelop "R;G;B" format */
  backgroundColor?: string;
  /** currently active layer name */
  activeLayer?: string;
  sceneVariables?: GDSceneVariable[];

}
