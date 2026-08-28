// Scene properties dialog — GDevelop's `CompactScenePropertiesEditor` shown as a
// dialog: background, resolution, magnification, sound behaviour and the grid.

import * as React from "react";
import { useEditor } from "@/lib/editor/store";
import { S } from "@/lib/editor/i18n";
import {
  ChoiceField,
  ColorField,
  FieldRow,
  GdButton,
  GdDialog,
  NumberField,
  PropertySection,
  ToggleField,
} from "./gd/kit";

export function ScenePropertiesDialog() {
  const { scene, dispatch, ui, project } = useEditor();
  const open = ui.dialog?.name === "sceneProperties";
  const [name, setName] = React.useState(scene.name);
  React.useEffect(() => setName(scene.name), [scene.name, open]);

  const close = () => dispatch({ type: "closeDialog" });

  return (
    <GdDialog
      open={open}
      onClose={close}
      title={S.sceneProperties}
      width="max-w-2xl"
      helpPath="https://gdevelop.io/docs/getting-started/levels/scene-properties"
      footer={
        <>
          <GdButton onClick={close}>{S.cancel}</GdButton>
          <GdButton
            variant="raised"
            primary
            onClick={() => {
              if (name && name !== scene.name)
                dispatch({ type: "renameScene", from: scene.name, to: name });
              close();
            }}
          >
            {S.ok}
          </GdButton>
        </>
      }
    >
      <div className="p-2">
        <PropertySection title={S.name}>
          <FieldRow label="Nombre de la escena">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-8 min-w-0 flex-1 rounded border border-separator bg-[#1D1D26] px-2 text-[12.5px] outline-none focus:border-[var(--brand-light)]"
            />
          </FieldRow>
          <FieldRow label={S.background}>
            <ColorField
              value={scene.backgroundColor}
              onChange={(backgroundColor) =>
                dispatch({ type: "updateScene", patch: { backgroundColor } })
              }
            />
          </FieldRow>
        </PropertySection>

        <PropertySection title="Pantalla">
          <FieldRow label={S.customWindowSize}>
            <ToggleField
              checked={!!scene.useCustomWindowSize}
              label={S.customWindowSize}
              onChange={(useCustomWindowSize) =>
                dispatch({ type: "updateScene", patch: { useCustomWindowSize } })
              }
            />
          </FieldRow>
          {scene.useCustomWindowSize ? (
            <>
              <FieldRow label="Ancho">
                <NumberField
                  value={scene.customWindowWidth ?? project.gameSettings.windowWidth}
                  onChange={(customWindowWidth) =>
                    dispatch({
                      type: "updateScene",
                      patch: { customWindowWidth: Math.max(1, Math.round(customWindowWidth)) },
                    })
                  }
                />
              </FieldRow>
              <FieldRow label="Alto">
                <NumberField
                  value={scene.customWindowHeight ?? project.gameSettings.windowHeight}
                  onChange={(customWindowHeight) =>
                    dispatch({
                      type: "updateScene",
                      patch: { customWindowHeight: Math.max(1, Math.round(customWindowHeight)) },
                    })
                  }
                />
              </FieldRow>
            </>
          ) : (
            <FieldRow label="Resolución del juego">
              <span className="text-[12.5px] tabular-nums text-text-secondary">
                {project.gameSettings.windowWidth} × {project.gameSettings.windowHeight}
              </span>
            </FieldRow>
          )}
          <FieldRow label={S.magnification}>
            <NumberField
              value={scene.magnification ?? 1}
              step={0.25}
              onChange={(magnification) =>
                dispatch({
                  type: "updateScene",
                  patch: { magnification: Math.max(0.1, Math.min(8, magnification)) },
                })
              }
            />
          </FieldRow>
          <FieldRow label={S.adaptResolution}>
            <ToggleField
              checked={scene.adaptResolutionAtRuntime !== false}
              label={S.adaptResolution}
              onChange={(adaptResolutionAtRuntime) =>
                dispatch({ type: "updateScene", patch: { adaptResolutionAtRuntime } })
              }
            />
          </FieldRow>
          <FieldRow label={S.stopSounds}>
            <ToggleField
              checked={!!scene.stopSoundsOnSceneChange}
              label={S.stopSounds}
              onChange={(stopSoundsOnSceneChange) =>
                dispatch({ type: "updateScene", patch: { stopSoundsOnSceneChange } })
              }
            />
          </FieldRow>
        </PropertySection>

        <PropertySection title="Cuadrícula">
          <FieldRow label="Tipo">
            <ChoiceField
              value={scene.grid.kind}
              options={["rectangular", "isometric"]}
              labels={{ rectangular: "Rectangular", isometric: "Isométrica" }}
              onChange={(kind) =>
                dispatch({
                  type: "updateGrid",
                  patch: { kind: kind as "rectangular" | "isometric" },
                })
              }
            />
          </FieldRow>
          <FieldRow label={S.visible}>
            <ToggleField
              checked={scene.grid.show}
              onChange={(show) => dispatch({ type: "updateGrid", patch: { show } })}
              label={S.toggleGrid}
            />
          </FieldRow>
          <FieldRow label={S.snapToGrid}>
            <ToggleField
              checked={scene.grid.snap}
              onChange={(snap) => dispatch({ type: "updateGrid", patch: { snap } })}
              label={S.snapToGrid}
            />
          </FieldRow>
          <FieldRow label={S.gridHorizontal}>
            <NumberField
              value={scene.grid.width}
              onChange={(width) =>
                dispatch({ type: "updateGrid", patch: { width: Math.max(1, width) } })
              }
            />
          </FieldRow>
          <FieldRow label={S.gridVertical}>
            <NumberField
              value={scene.grid.height}
              onChange={(height) =>
                dispatch({ type: "updateGrid", patch: { height: Math.max(1, height) } })
              }
            />
          </FieldRow>
          <FieldRow label={S.gridOffsetX}>
            <NumberField
              value={scene.grid.offsetX}
              onChange={(offsetX) => dispatch({ type: "updateGrid", patch: { offsetX } })}
            />
          </FieldRow>
          <FieldRow label={S.gridOffsetY}>
            <NumberField
              value={scene.grid.offsetY}
              onChange={(offsetY) => dispatch({ type: "updateGrid", patch: { offsetY } })}
            />
          </FieldRow>
          <FieldRow label={S.gridColor}>
            <ColorField
              value={scene.grid.color}
              onChange={(color) => dispatch({ type: "updateGrid", patch: { color } })}
            />
          </FieldRow>
          <FieldRow label={S.gridAlpha}>
            <NumberField
              value={scene.grid.alpha}
              step={0.05}
              onChange={(alpha) =>
                dispatch({ type: "updateGrid", patch: { alpha: Math.max(0, Math.min(1, alpha)) } })
              }
            />
          </FieldRow>
        </PropertySection>
      </div>
    </GdDialog>
  );
}
