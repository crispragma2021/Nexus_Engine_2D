// Event factory helpers (GDevelop's `BuiltinCommonInstructions::*` shapes).

import type { GDEvent, GDInstruction } from "./types";
import { uid } from "./ids";

/** Comment presets, matching GDevelop's comment color picker. */
export const COMMENT_COLORS = [
  { id: "green", label: "Verde", background: "21;28;33", text: "152;195;121" },
  { id: "yellow", label: "Amarillo", background: "62;58;36", text: "229;192;123" },
  { id: "orange", label: "Naranja", background: "62;45;36", text: "209;154;105" },
  { id: "blue", label: "Azul", background: "26;38;56", text: "107;175;255" },
] as const;

export const GROUP_COLORS = [
  "#7046EC",
  "#4AB0E4",
  "#45D9A1",
  "#FFBC57",
  "#FF8569",
  "#C678DD",
] as const;

export function newEvent(kind: GDEvent["kind"], patch: Partial<GDEvent> = {}): GDEvent {
  return {
    id: uid("ev"),
    kind,
    conditions: [],
    actions: [],
    subEvents: [],
    collapsed: false,
    ...(kind === "comment"
      ? {
          comment: "",
          commentColors: {
            background: COMMENT_COLORS[0].background,
            text: COMMENT_COLORS[0].text,
          },
        }
      : {}),
    ...(kind === "group" ? { groupName: "Nuevo grupo", groupColor: GROUP_COLORS[0] } : {}),
    ...(kind === "link" ? { linkToEventsName: "" } : {}),
    ...patch,
  };
}

export function newInstruction(
  typeId: string,
  parameters: Record<string, string> = {},
): GDInstruction {
  return { id: uid("in"), typeId, inverted: false, parameters };
}

/** "Añadir si …no" — GDevelop's else event. */
export function newElseEvent(): GDEvent {
  return newEvent("else", {
    conditions: [newInstruction("BuiltinCommonInstructions::Else")],
  });
}
