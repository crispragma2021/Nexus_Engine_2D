// Effects dialog: wraps the shared effects list for an object, an instance or a
// layer (GDevelop opens the same `EffectsList` component in all three cases).

import { useEditor, type EffectTarget } from "@/lib/editor/store";
import { S } from "@/lib/editor/i18n";
import { GdButton, GdDialog } from "./gd/kit";
import { EffectsList, type EffectsApi } from "./gd/EffectsList";

export function EffectsListDialog() {
  const { scene, dispatch, ui } = useEditor();
  const dialog = ui.dialog?.name === "effects" ? ui.dialog : null;
  const target: EffectTarget | null = dialog
    ? dialog.targetKind === "layer"
      ? { kind: "layer", name: dialog.targetId }
      : { kind: dialog.targetKind, id: dialog.targetId }
    : null;

  const effects = target
    ? target.kind === "object"
      ? (scene.objects.find((o) => o.id === target.id)?.effects ?? [])
      : target.kind === "instance"
        ? (scene.instances.find((i) => i.id === target.id)?.effects ?? [])
        : (scene.layers.find((l) => l.name === target.name)?.effects ?? [])
    : [];

  const label =
    target?.kind === "object"
      ? scene.objects.find((o) => o.id === target.id)?.name
      : target?.kind === "instance"
        ? (() => {
            const instance = scene.instances.find((i) => i.id === target.id);
            return (
              scene.objects.find((o) => o.id === instance?.objectId)?.name ?? instance?.objectId
            );
          })()
        : target?.name;

  const api: EffectsApi = {
    effects,
    add: (effect) => target && dispatch({ type: "addEffect", target, effect }),
    update: (index, patch) => target && dispatch({ type: "updateEffect", target, index, patch }),
    remove: (index) => target && dispatch({ type: "deleteEffect", target, index }),
    move: (index, direction) =>
      target && dispatch({ type: "moveEffect", target, index, direction }),
  };

  return (
    <GdDialog
      open={!!dialog && !!target}
      onClose={() => dispatch({ type: "closeDialog" })}
      title={`${S.effects}${label ? ` — ${label}` : ""}`}
      width="max-w-3xl"
      helpPath="https://gdevelop.io/docs/game-design/effects-in-gdevelop"
      footer={
        <GdButton variant="raised" primary onClick={() => dispatch({ type: "closeDialog" })}>
          {S.ok}
        </GdButton>
      }
    >
      <EffectsList api={api} />
    </GdDialog>
  );
}
