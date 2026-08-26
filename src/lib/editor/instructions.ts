// Instruction catalog: conditions & actions offered by the events editor,
// modeled after GDevelop's real instruction list.

export type ParamType =
  | "object"
  | "textObject"
  | "key"
  | "button"
  | "expression"
  | "number"
  | "string"
  | "yesno"
  | "operator"
  | "modop"
  | "layer"
  | "scene"
  | "varscene"
  | "sound";

export interface InstructionParam {
  name: string;
  type: ParamType;
  label: string;
  defaultValue: string;
}

export interface InstructionDef {
  id: string;
  kind: "condition" | "action";
  category: string;
  name: string;
  description: string;
  /** sentence template, {0}, {1}… replaced by parameter chips */
  sentence: string;
  parameters: InstructionParam[];
}

const P = (
  name: string,
  type: ParamType,
  label: string,
  defaultValue: string,
): InstructionParam => ({ name, type, label, defaultValue });

export const INSTRUCTION_CATEGORIES = [
  "All",
  "Keyboard",
  "Mouse",
  "Scene",
  "Sprite",
  "Text",
  "Variables",
  "Timers",
  "Camera",
  "Audio",
] as const;

export const INSTRUCTIONS: InstructionDef[] = [
  // ---- Conditions: Scene ----
  {
    id: "BuiltinCommonInstructions::Once",
    kind: "condition",
    category: "Scene",
    name: "At the beginning of the scene",
    description: "True only the first time the event is run, when the scene starts.",
    sentence: "At the beginning of the scene",
    parameters: [],
  },
  {
    id: "CompareSceneVar",
    kind: "condition",
    category: "Variables",
    name: "Compare scene variable",
    description: "Compare the value of a scene variable.",
    sentence: "Compare scene variable {0}: {1} {2}",
    parameters: [
      P("variable", "varscene", "Variable", "Score"),
      P("operator", "operator", "Comparison", "="),
      P("value", "expression", "Value", "3"),
    ],
  },
  {
    id: "TimerGreater",
    kind: "condition",
    category: "Timers",
    name: "Value of a scene timer",
    description: "True when a scene timer exceeds a time in seconds.",
    sentence: "Value of scene timer {0} is greater than {1} seconds",
    parameters: [
      P("timer", "string", "Timer name", "enemy_spawn"),
      P("seconds", "number", "Time (seconds)", "2"),
    ],
  },
  // ---- Conditions: Keyboard / Mouse ----
  {
    id: "KeyPressed",
    kind: "condition",
    category: "Keyboard",
    name: "Key pressed",
    description: "True while the specified key is held down.",
    sentence: "{0} key is pressed",
    parameters: [P("key", "key", "Key", "Right")],
  },
  {
    id: "KeyReleased",
    kind: "condition",
    category: "Keyboard",
    name: "Key released",
    description: "True when the specified key is released.",
    sentence: "{0} key is released",
    parameters: [P("key", "key", "Key", "Space")],
  },
  {
    id: "MouseButtonPressed",
    kind: "condition",
    category: "Mouse",
    name: "Mouse button pressed",
    description: "True while a mouse button (or touch) is held.",
    sentence: "{0} mouse button is pressed",
    parameters: [P("button", "button", "Button", "Left")],
  },
  // ---- Conditions: Sprite / objects ----
  {
    id: "Collision",
    kind: "condition",
    category: "Sprite",
    name: "Collision",
    description: "True when two objects are colliding (bounding boxes).",
    sentence: "{0} is in collision with {1}",
    parameters: [
      P("object", "object", "Object", "Player"),
      P("object2", "object", "Object", "Coin"),
    ],
  },
  {
    id: "OnFloor",
    kind: "condition",
    category: "Sprite",
    name: "Is on floor (Platformer character)",
    description: "True when a platformer character is standing on a floor.",
    sentence: "{0} is on floor",
    parameters: [P("object", "object", "Object", "Player")],
  },
  {
    id: "ComparePosX",
    kind: "condition",
    category: "Sprite",
    name: "Compare X position of an object",
    description: "Compare the horizontal position of an object.",
    sentence: "Compare the X position of {0}: {1} {2}",
    parameters: [
      P("object", "object", "Object", "Player"),
      P("operator", "operator", "Comparison", ">"),
      P("value", "expression", "X position", "600"),
    ],
  },
  {
    id: "CompareAngle",
    kind: "condition",
    category: "Sprite",
    name: "Compare the angle of an object",
    description: "Compare the rotation angle of an object.",
    sentence: "Compare the angle of {0}: {1} {2}",
    parameters: [
      P("object", "object", "Object", "Slime"),
      P("operator", "operator", "Comparison", ">"),
      P("value", "expression", "Angle", "45"),
    ],
  },
  {
    id: "IsVisible",
    kind: "condition",
    category: "Sprite",
    name: "Object is visible",
    description: "True when the object is visible (not hidden).",
    sentence: "{0} is visible",
    parameters: [P("object", "object", "Object", "Coin")],
  },
  {
    id: "CompareOpacity",
    kind: "condition",
    category: "Sprite",
    name: "Compare the opacity of an object",
    description: "Compare the opacity (0-255) of an object.",
    sentence: "Compare the opacity of {0}: {1} {2}",
    parameters: [
      P("object", "object", "Object", "Player"),
      P("operator", "operator", "Comparison", "<"),
      P("value", "expression", "Opacity", "128"),
    ],
  },
  // ---- Actions: objects ----
  {
    id: "CreateObject",
    kind: "action",
    category: "Sprite",
    name: "Create an object",
    description: "Create a new instance of an object at a position.",
    sentence: "Create object {0} at position {1};{2} on layer {3}",
    parameters: [
      P("object", "object", "Object", "Coin"),
      P("x", "expression", "X", "400"),
      P("y", "expression", "Y", "300"),
      P("layer", "layer", "Layer", "Base layer"),
    ],
  },
  {
    id: "DeleteObject",
    kind: "action",
    category: "Sprite",
    name: "Delete an object",
    description: "Delete the object instances picked by the conditions.",
    sentence: "Delete object {0}",
    parameters: [P("object", "object", "Object", "Coin")],
  },
  {
    id: "SetPosition",
    kind: "action",
    category: "Sprite",
    name: "Change the position",
    description: "Set the position of an object.",
    sentence: "Change the position of {0}: set to {1};{2}",
    parameters: [
      P("object", "object", "Object", "Player"),
      P("x", "expression", "X", "0"),
      P("y", "expression", "Y", "0"),
    ],
  },
  {
    id: "ChangeX",
    kind: "action",
    category: "Sprite",
    name: "Change X position",
    description: "Modify the horizontal position of an object.",
    sentence: "Change the X position of {0}: {1} {2}",
    parameters: [
      P("object", "object", "Object", "Player"),
      P("op", "modop", "Modification", "add"),
      P("value", "expression", "Value", "5"),
    ],
  },
  {
    id: "AddForceAngle",
    kind: "action",
    category: "Sprite",
    name: "Add a force (angle)",
    description: "Push an object using a force at an angle.",
    sentence: "Add to {0} a force, angle: {1} degrees and speed: {2} pixels/second",
    parameters: [
      P("object", "object", "Object", "Slime"),
      P("angle", "expression", "Angle", "180"),
      P("speed", "expression", "Speed", "80"),
    ],
  },
  {
    id: "AddForceToward",
    kind: "action",
    category: "Sprite",
    name: "Add a force toward an object",
    description: "Push an object toward another object.",
    sentence: "Add to {0} a force toward {1}, speed: {2} pixels/second",
    parameters: [
      P("object", "object", "Object", "Slime"),
      P("target", "object", "Target", "Player"),
      P("speed", "expression", "Speed", "60"),
    ],
  },
  {
    id: "ChangeAngle",
    kind: "action",
    category: "Sprite",
    name: "Change the angle",
    description: "Modify the rotation angle of an object.",
    sentence: "Change the angle of {0}: {1} {2}",
    parameters: [
      P("object", "object", "Object", "Player"),
      P("op", "modop", "Modification", "set to"),
      P("value", "expression", "Angle", "0"),
    ],
  },
  {
    id: "FlipX",
    kind: "action",
    category: "Sprite",
    name: "Flip horizontally",
    description: "Flip the object horizontally (mirror its image).",
    sentence: "Flip {0} horizontally: {1}",
    parameters: [
      P("object", "object", "Object", "Player"),
      P("flip", "yesno", "Flip", "yes"),
    ],
  },
  {
    id: "ChangeAnim",
    kind: "action",
    category: "Sprite",
    name: "Change the animation",
    description: "Change the animation number or name of a Sprite.",
    sentence: "Change the animation of {0}: {1} {2}",
    parameters: [
      P("object", "object", "Object", "Player"),
      P("op", "modop", "Modification", "set to"),
      P("value", "expression", "Animation", "1"),
    ],
  },
  {
    id: "SetOpacity",
    kind: "action",
    category: "Sprite",
    name: "Change the opacity",
    description: "Modify the opacity of an object (0-255).",
    sentence: "Change the opacity of {0}: {1} {2}",
    parameters: [
      P("object", "object", "Object", "Player"),
      P("op", "modop", "Modification", "set to"),
      P("value", "expression", "Opacity", "255"),
    ],
  },
  {
    id: "HideObject",
    kind: "action",
    category: "Sprite",
    name: "Hide an object",
    description: "Hide the object (it is not rendered anymore).",
    sentence: "Hide {0}",
    parameters: [P("object", "object", "Object", "Coin")],
  },
  {
    id: "ShowObject",
    kind: "action",
    category: "Sprite",
    name: "Show an object",
    description: "Show a hidden object.",
    sentence: "Show {0}",
    parameters: [P("object", "object", "Object", "Coin")],
  },
  {
    id: "SetZOrder",
    kind: "action",
    category: "Sprite",
    name: "Change the z-order",
    description: "Change the drawing order of an object.",
    sentence: "Change the z-order of {0}: {1} {2}",
    parameters: [
      P("object", "object", "Object", "Coin"),
      P("op", "modop", "Modification", "set to"),
      P("value", "expression", "Z order", "2"),
    ],
  },
  // ---- Actions: text ----
  {
    id: "SetText",
    kind: "action",
    category: "Text",
    name: "Change the text",
    description: "Change the text displayed by a Text object.",
    sentence: "Change the text of {0}: set to {1}",
    parameters: [
      P("object", "textObject", "Text object", "ScoreText"),
      P("text", "string", "Text", "Score: 0"),
    ],
  },
  // ---- Actions: variables / timers ----
  {
    id: "SetSceneVar",
    kind: "action",
    category: "Variables",
    name: "Change scene variable",
    description: "Modify the value of a scene variable.",
    sentence: "Change scene variable {0}: {1} {2}",
    parameters: [
      P("variable", "varscene", "Variable", "Score"),
      P("op", "modop", "Modification", "add"),
      P("value", "expression", "Value", "1"),
    ],
  },
  {
    id: "StartTimer",
    kind: "action",
    category: "Timers",
    name: "Start (or reset) a scene timer",
    description: "Start a scene timer from zero.",
    sentence: "Start (or reset) scene timer {0}",
    parameters: [P("timer", "string", "Timer name", "enemy_spawn")],
  },
  // ---- Actions: camera / scene / audio ----
  {
    id: "CenterCamera",
    kind: "action",
    category: "Camera",
    name: "Center the camera on an object",
    description: "Make the camera follow an object.",
    sentence: "Center the camera on {0}",
    parameters: [P("object", "object", "Object", "Player")],
  },
  {
    id: "ChangeScene",
    kind: "action",
    category: "Scene",
    name: "Change the scene",
    description: "Stop the current scene and open another one.",
    sentence: "Change the scene to {0}",
    parameters: [P("scene", "scene", "Scene", "Level 1")],
  },
  {
    id: "PlaySound",
    kind: "action",
    category: "Audio",
    name: "Play a sound",
    description: "Play an audio file once.",
    sentence: "Play the sound {0}",
    parameters: [P("file", "sound", "Audio file", "coin.wav")],
  },
];

export const instructionById = (id: string): InstructionDef | undefined =>
  INSTRUCTIONS.find((i) => i.id === id);

/** Render an instruction sentence, splitting around {n} placeholders. */
export function sentenceParts(
  def: InstructionDef,
): Array<{ text?: string; paramIndex?: number }> {
  const parts: Array<{ text?: string; paramIndex?: number }> = [];
  const regex = /\{(\d+)\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(def.sentence)) !== null) {
    if (m.index > last) parts.push({ text: def.sentence.slice(last, m.index) });
    parts.push({ paramIndex: Number(m[1]) });
    last = m.index + m[0].length;
  }
  if (last < def.sentence.length) parts.push({ text: def.sentence.slice(last) });
  return parts;
}

export const OPERATORS = ["=", "<", ">", "≤", "≥", "≠"];
export const MODOPS = ["set to", "add", "subtract", "multiply", "divide"];
