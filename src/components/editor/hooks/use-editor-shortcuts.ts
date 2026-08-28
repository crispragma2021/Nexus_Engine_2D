// Keyboard shortcuts for the editor, mirroring GDevelop's default map:
// Ctrl+Z / Ctrl+Shift+Z, Ctrl+C / Ctrl+X / Ctrl+V, Ctrl+D, Ctrl+S, Supr,
// arrows to nudge instances (Shift = ×10) and Esc to clear the selection.

import { useEffect } from "react";
import { useEditor } from "@/lib/editor/store";
import { copyInstances, copyObjects, pasteInto } from "@/lib/editor/clipboard";
import { saveProjectEverywhere } from "@/lib/projects/save";

const isTyping = (target: EventTarget | null) => {
  const element = target as HTMLElement | null;
  if (!element) return false;
  const tag = element.tagName;
  return (
    tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || element.isContentEditable === true
  );
};

export function useEditorShortcuts() {
  const { ui, scene, project, dispatch, canUndo, canRedo } = useEditor();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (ui.dialog || ui.previewOpen || ui.projectManagerOpen) return;
      const ctrl = event.ctrlKey || event.metaKey;
      const key = event.key;

      if (ctrl && key.toLowerCase() === "s") {
        event.preventDefault();
        void saveProjectEverywhere(project).then(() => dispatch({ type: "markSaved" }));
        return;
      }
      if (isTyping(event.target)) return;

      if (ctrl && key.toLowerCase() === "z") {
        event.preventDefault();
        dispatch({ type: event.shiftKey ? "redo" : canUndo ? "undo" : "redo" });
        return;
      }
      if (ctrl && key.toLowerCase() === "y") {
        event.preventDefault();
        if (canRedo) dispatch({ type: "redo" });
        return;
      }

      const inEvents = ui.tab === "events";

      if (ctrl && key.toLowerCase() === "d") {
        event.preventDefault();
        if (inEvents) {
          for (const id of ui.selectedEventIds) dispatch({ type: "duplicateEvent", id });
        } else if (ui.selectedInstanceIds.length > 0) {
          dispatch({ type: "duplicateInstances", ids: ui.selectedInstanceIds });
        } else {
          for (const id of ui.selectedObjectIds) dispatch({ type: "duplicateObject", id });
        }
        return;
      }

      if (ctrl && key.toLowerCase() === "c" && !inEvents) {
        event.preventDefault();
        if (ui.selectedInstanceIds.length > 0) {
          copyInstances(scene.instances.filter((i) => ui.selectedInstanceIds.includes(i.id)));
        } else {
          copyObjects(scene.objects.filter((o) => ui.selectedObjectIds.includes(o.id)));
        }
        return;
      }

      if (ctrl && key.toLowerCase() === "x" && !inEvents) {
        event.preventDefault();
        if (ui.selectedInstanceIds.length > 0) {
          copyInstances(scene.instances.filter((i) => ui.selectedInstanceIds.includes(i.id)));
          dispatch({ type: "deleteInstances", ids: ui.selectedInstanceIds });
        } else if (ui.selectedObjectIds.length > 0) {
          copyObjects(scene.objects.filter((o) => ui.selectedObjectIds.includes(o.id)));
          for (const id of ui.selectedObjectIds) dispatch({ type: "deleteObject", id });
        }
        return;
      }

      if (ctrl && key.toLowerCase() === "v") {
        event.preventDefault();
        if (inEvents) {
          const first = scene.events[0];
          if (first) dispatch({ type: "duplicateEvent", id: first.id });
          return;
        }
        const { objects, instances } = pasteInto(scene);
        for (const object of objects) dispatch({ type: "addObject", object });
        if (instances.length > 0) dispatch({ type: "addInstances", instances });
        return;
      }

      if (inEvents && key.toLowerCase() === "e") {
        event.preventDefault();
        dispatch({ type: "addEvent", parentId: null, kind: "standard" });
        return;
      }
      if (inEvents && (key === "Enter" || key.toLowerCase() === "c")) {
        // GDevelop: `C` adds a comment, `Enter` adds an event.
        event.preventDefault();
        dispatch({
          type: "addEvent",
          parentId: ui.selectedEventIds[0] ?? null,
          kind: key === "Enter" ? "standard" : "comment",
        });
        return;
      }

      if (key === "Delete" || key === "Backspace") {
        if (inEvents) {
          if (ui.selectedEventIds.length === 0) return;
          event.preventDefault();
          dispatch({ type: "deleteEvents", ids: ui.selectedEventIds });
          dispatch({ type: "selectEvents", ids: [] });
          return;
        }
        if (ui.selectedInstanceIds.length > 0) {
          event.preventDefault();
          dispatch({ type: "deleteInstances", ids: ui.selectedInstanceIds });
        } else if (ui.selectedObjectIds.length > 0) {
          event.preventDefault();
          for (const id of ui.selectedObjectIds) dispatch({ type: "deleteObject", id });
        }
        return;
      }

      if (key === "Escape") {
        dispatch({ type: "selectInstances", ids: [] });
        dispatch({
          type: "ui",
          patch: { selectedObjectIds: [], selectedEventIds: [], selectedInstruction: null },
        });
        return;
      }

      if (!inEvents && ui.selectedInstanceIds.length > 0 && key.startsWith("Arrow")) {
        event.preventDefault();
        const step = event.shiftKey ? 10 : scene.grid.snap ? scene.grid.width : 1;
        const delta = {
          ArrowLeft: { dx: -step, dy: 0 },
          ArrowRight: { dx: step, dy: 0 },
          ArrowUp: { dx: 0, dy: -step },
          ArrowDown: { dx: 0, dy: step },
        }[key];
        if (delta) dispatch({ type: "moveInstances", ids: ui.selectedInstanceIds, ...delta });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [ui, scene, project, dispatch, canUndo, canRedo]);
}
