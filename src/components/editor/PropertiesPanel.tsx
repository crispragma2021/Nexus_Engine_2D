// Properties panel — GDevelop's `PropertiesEditor` for whatever is selected:
// an instance (position, size, angle, Z, layer, opacity, behaviors, effects,
// instance variables), an object, a layer, or the scene itself.

import * as React from "react";
import {
  Film,
  Lock,
  Pencil,
  Plus,
  RotateCcw,
  Settings2,
  SquareStack,
  Trash2,
  Unlock,
  Variable,
} from "lucide-react";
import { useEditor, type VariableScopeLocation } from "@/lib/editor/store";
import { S } from "@/lib/editor/i18n";
import {
  BEHAVIORS,
  behaviorByTypeId,
  behaviorShortName,
  objectTypeLabel,
  resolveAsset,
} from "@/lib/editor/catalog";
import { BASE_LAYER_NAME } from "@/lib/editor/scenes";
import { cn } from "@/lib/utils";
import {
  FieldRow,
  NumberField,
  Panel,
  PropertySection,
  TextField,
  ToggleField,
  ChoiceField,
  ColorField,
  GdButton,
} from "./gd/kit";
import { CatalogIcon, BEHAVIOR_ICON, iconForObjectType } from "./gd/icons";
import { EffectsList, type EffectsApi } from "./gd/EffectsList";
import { VariablesEditor, type VariablesApi } from "./gd/VariablesEditor";

export function PropertiesPanel() {
  const { scene, ui, dispatch } = useEditor();
  const selectedInstance =
    ui.selectedInstanceIds.length === 1
      ? scene.instances.find((i) => i.id === ui.selectedInstanceIds[0])
      : undefined;
  const selectedObject =
    ui.selectedObjectIds.length === 1
      ? scene.objects.find((o) => o.id === ui.selectedObjectIds[0])
      : undefined;
  const selectedLayer = ui.selectedLayerName
    ? scene.layers.find((l) => l.name === ui.selectedLayerName)
    : undefined;

  const objectOfInstance = selectedInstance
    ? scene.objects.find((o) => o.name === selectedInstance.objectId)
    : undefined;

  const title = selectedInstance
    ? S.instanceProperties
    : selectedObject
      ? `${S.properties}: ${selectedObject.name}`
      : selectedLayer
        ? `${S.layer}: ${selectedLayer.name}`
        : S.sceneProperties;

  return (
    <Panel title={title} className="min-h-0 flex-1 border-l border-separator" bodyClassName="pb-3">
      {selectedInstance && objectOfInstance ? (
        <InstanceProperties
          instanceId={selectedInstance.id}
          objectId={objectOfInstance.id}
          count={ui.selectedInstanceIds.length}
        />
      ) : selectedObject ? (
        <ObjectProperties objectId={selectedObject.id} />
      ) : selectedLayer ? (
        <LayerProperties name={selectedLayer.name} />
      ) : (
        <SceneQuickProperties />
      )}
    </Panel>
  );
}

/* ------------------------------------------------------------------ instance */

function InstanceProperties({
  instanceId,
  objectId,
  count,
}: {
  instanceId: string;
  objectId: string;
  count: number;
}) {
  const { scene, dispatch } = useEditor();
  const instance = scene.instances.find((i) => i.id === instanceId);
  const object = scene.objects.find((o) => o.id === objectId);
  if (!instance || !object) return null;

  const patch = (next: Partial<typeof instance>) =>
    dispatch({ type: "updateInstance", id: instanceId, patch: next });

  const instanceLocation: VariableScopeLocation = { scope: "instance", objectId: instanceId };
  const variablesApi: VariablesApi = {
    variables: instance.variables,
    add: (path) =>
      path.length === 0
        ? dispatch({ type: "addVariable", location: instanceLocation })
        : dispatch({ type: "addVariableChild", location: instanceLocation, path }),
    update: (path, patch) =>
      dispatch({ type: "updateVariable", location: instanceLocation, path, patch }),
    remove: (path) => dispatch({ type: "deleteVariable", location: instanceLocation, path }),
  };

  const effectsApi: EffectsApi = {
    effects: instance.effects,
    add: (effect) =>
      dispatch({
        type: "addEffect",
        target: { kind: "instance", id: instanceId },
        effect,
      }),
    update: (index, next) =>
      dispatch({
        type: "updateEffect",
        target: { kind: "instance", id: instanceId },
        index,
        patch: next,
      }),
    remove: (index) =>
      dispatch({ type: "deleteEffect", target: { kind: "instance", id: instanceId }, index }),
    move: (index, direction) =>
      dispatch({
        type: "moveEffect",
        target: { kind: "instance", id: instanceId },
        index,
        direction,
      }),
  };

  return (
    <>
      <PropertySection title={S.position}>
        <FieldRow label="X">
          <NumberField value={instance.x} onChange={(x) => patch({ x: Math.round(x) })} />
        </FieldRow>
        <FieldRow label="Y">
          <NumberField value={instance.y} onChange={(y) => patch({ y: Math.round(y) })} />
        </FieldRow>
      </PropertySection>

      <PropertySection title={S.size}>
        <FieldRow label={S.customSize}>
          <ToggleField
            checked={instance.customSize}
            label={S.customSize}
            onChange={(customSize) => patch({ customSize })}
          />
        </FieldRow>
        {instance.customSize ? (
          <>
            <FieldRow label="Ancho">
              <NumberField
                value={instance.width}
                onChange={(width) => patch({ width: Math.max(1, Math.round(width)) })}
              />
            </FieldRow>
            <FieldRow label="Alto">
              <NumberField
                value={instance.height}
                onChange={(height) => patch({ height: Math.max(1, Math.round(height)) })}
              />
            </FieldRow>
          </>
        ) : (
          <p className="px-3 py-1 text-[12px] text-text-placeholder">
            Tamaño original del recurso (deshaz «{S.customSize}» para cambiarlo).
          </p>
        )}
      </PropertySection>

      <PropertySection title={S.angle}>
        <FieldRow label={S.angle}>
          <NumberField value={instance.angle} onChange={(angle) => patch({ angle })} />
        </FieldRow>
        <div className="flex items-center gap-1 px-3 pb-1">
          {[0, 90, 180, 270].map((angle) => (
            <button
              key={angle}
              type="button"
              onClick={() => patch({ angle })}
              className="h-6 rounded border border-separator px-1.5 text-[11px] text-text-secondary hover:bg-list-hover hover:text-foreground"
            >
              {angle}°
            </button>
          ))}
          <button
            type="button"
            aria-label="Restablecer ángulo"
            onClick={() => patch({ angle: 0 })}
            className="grid h-6 w-6 place-items-center rounded border border-separator text-text-secondary hover:bg-list-hover hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        </div>
      </PropertySection>

      <PropertySection title={`${S.zOrder} / ${S.layer}`}>
        <FieldRow label={S.zOrder}>
          <NumberField
            value={instance.zOrder}
            onChange={(zOrder) => patch({ zOrder: Math.round(zOrder) })}
          />
        </FieldRow>
        <FieldRow label={S.layer}>
          <ChoiceField
            value={instance.layer}
            options={scene.layers.map((l) => l.name)}
            onChange={(layer) => patch({ layer })}
          />
        </FieldRow>
      </PropertySection>

      <PropertySection title={`${S.opacity} / ${S.hidden}`}>
        <FieldRow label={S.opacity}>
          <input
            type="range"
            min={0}
            max={255}
            value={255}
            disabled
            className="h-1 min-w-0 flex-1 accent-[var(--brand)]"
            aria-label={S.opacity}
          />
          <span className="w-8 shrink-0 text-right text-[12px] tabular-nums text-text-secondary">
            255
          </span>
        </FieldRow>
        <FieldRow label={S.hiddenWhenSceneStarts}>
          <ToggleField
            checked={instance.hiddenAtStart}
            label={S.hiddenWhenSceneStarts}
            onChange={(hiddenAtStart) => patch({ hiddenAtStart })}
          />
        </FieldRow>
        <FieldRow label={S.locked}>
          <ToggleField
            checked={instance.locked}
            label={S.locked}
            onChange={(locked) => patch({ locked })}
          />
        </FieldRow>
      </PropertySection>

      {count > 1 ? (
        <p className="px-3 py-2 text-[12px] text-text-secondary">
          {count} instancias seleccionadas — las propiedades de arriba pertenecen a la instancia
          activa.
        </p>
      ) : null}

      <BehaviorSection objectId={objectId} />

      <PropertySection title={`${S.effects} (${instance.effects.length})`}>
        <EffectsList api={effectsApi} compact />
      </PropertySection>

      <PropertySection title={S.instanceVariables}>
        <VariablesEditor api={variablesApi} emptyLabel={S.addYourFirstInstanceVariable} />
      </PropertySection>
    </>
  );
}

/* -------------------------------------------------------------------- object */

function ObjectProperties({ objectId }: { objectId: string }) {
  const { scene, dispatch, project } = useEditor();
  const object = scene.objects.find((o) => o.id === objectId);
  if (!object) return null;
  const objectLocation: VariableScopeLocation = { scope: "object", objectId };
  const variablesApi: VariablesApi = {
    variables: object.variables,
    add: (path) =>
      path.length === 0
        ? dispatch({ type: "addVariable", location: objectLocation })
        : dispatch({ type: "addVariableChild", location: objectLocation, path }),
    update: (path, patch) =>
      dispatch({ type: "updateVariable", location: objectLocation, path, patch }),
    remove: (path) => dispatch({ type: "deleteVariable", location: objectLocation, path }),
  };
  const effectsApi: EffectsApi = {
    effects: object.effects,
    add: (effect) =>
      dispatch({ type: "addEffect", target: { kind: "object", id: objectId }, effect }),
    update: (index, patch) =>
      dispatch({ type: "updateEffect", target: { kind: "object", id: objectId }, index, patch }),
    remove: (index) =>
      dispatch({ type: "deleteEffect", target: { kind: "object", id: objectId }, index }),
    move: (index, direction) =>
      dispatch({ type: "moveEffect", target: { kind: "object", id: objectId }, index, direction }),
  };
  const instances = scene.instances.filter((i) => i.objectId === object.id);

  return (
    <>
      <div className="flex items-center gap-2 px-3 py-2">
        {(() => {
          const image = resolveAsset(
            object.animations?.[0]?.images?.[0]?.image ?? object.asset,
            project.resources,
          );
          return image ? (
            <img
              src={image}
              alt=""
              className="h-8 w-8 shrink-0 rounded bg-[#1D1D26] object-contain p-0.5 [image-rendering:pixelated]"
            />
          ) : (
            <CatalogIcon
              name={iconForObjectType(object.type)}
              className="h-7 w-7 shrink-0 text-[#C9B6FC]"
            />
          );
        })()}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold">{object.name}</div>
          <div className="truncate text-[11px] text-text-secondary">
            {objectTypeLabel(object.type)} · {instances.length} instancia(s)
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1 px-2 pb-1">
        <GdButton
          variant="raised"
          primary
          size="small"
          icon={<Pencil className="h-3.5 w-3.5" />}
          onClick={() =>
            dispatch({ type: "openDialog", dialog: { name: "objectEditor", objectId } })
          }
        >
          {S.editObject}
        </GdButton>
        <GdButton
          variant="raised"
          size="small"
          icon={<Settings2 className="h-3.5 w-3.5" />}
          onClick={() => dispatch({ type: "openDialog", dialog: { name: "behaviors", objectId } })}
        >
          {S.behaviors}
        </GdButton>
      </div>

      <PropertySection title={`${S.behaviors} (${object.behaviors.length})`}>
        {object.behaviors.length === 0 ? (
          <p className="px-3 py-1 text-[12.5px] text-text-secondary">{S.addYourFirstBehavior}</p>
        ) : null}
        {object.behaviors.map((behavior) => {
          const definition = behaviorByTypeId(behavior.type);
          return (
            <div key={behavior.name} className="flex items-center gap-2 px-3 py-1 text-[12.5px]">
              <CatalogIcon
                name={BEHAVIOR_ICON[behavior.type] ?? "puzzle"}
                className="h-4 w-4 shrink-0 text-[#8AD6FF]"
              />
              <span className="min-w-0 flex-1 truncate">{behavior.name}</span>
              <span className="shrink-0 text-[10px] text-text-secondary">
                {definition?.name ?? behaviorShortName(behavior.type)}
              </span>
            </div>
          );
        })}
        <div className="px-3 pb-1">
          <GdButton
            variant="raised"
            size="small"
            icon={<Plus className="h-3.5 w-3.5" />}
            onClick={() =>
              dispatch({ type: "openDialog", dialog: { name: "behaviors", objectId } })
            }
          >
            {S.addABehavior}
          </GdButton>
        </div>
      </PropertySection>

      <PropertySection title={`${S.effects} (${object.effects.length})`}>
        <EffectsList api={effectsApi} compact />
      </PropertySection>

      <PropertySection title={`${S.variables} (${object.variables.length})`}>
        <VariablesEditor api={variablesApi} />
      </PropertySection>
    </>
  );
}

function BehaviorSection({ objectId }: { objectId: string }) {
  const { scene, dispatch } = useEditor();
  const object = scene.objects.find((o) => o.id === objectId);
  if (!object) return null;
  return (
    <PropertySection title={`${S.behaviors} (${object.behaviors.length})`}>
      {object.behaviors.length === 0 ? (
        <p className="px-3 py-1 text-[12.5px] text-text-secondary">{S.addYourFirstBehavior}</p>
      ) : null}
      {object.behaviors.map((behavior) => {
        const definition = BEHAVIORS.find((b) => b.typeId === behavior.type);
        return (
          <div key={behavior.name} className="px-3 py-1">
            <div className="flex items-center gap-2 text-[12.5px]">
              <CatalogIcon
                name={BEHAVIOR_ICON[behavior.type] ?? "puzzle"}
                className="h-4 w-4 shrink-0 text-[#8AD6FF]"
              />
              <span className="min-w-0 flex-1 truncate">{behavior.name}</span>
              <button
                type="button"
                aria-label={S.editBehaviors}
                onClick={() =>
                  dispatch({ type: "openDialog", dialog: { name: "behaviors", objectId } })
                }
                className="shrink-0 text-text-secondary hover:text-foreground"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label={S.delete}
                onClick={() =>
                  dispatch({ type: "deleteBehavior", objectId, behaviorName: behavior.name })
                }
                className="shrink-0 text-text-secondary hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            {definition
              ? definition.properties
                  .filter((property) => property.type !== "yesno")
                  .slice(0, 6)
                  .map((property) => (
                    <FieldRow key={property.key} label={property.label}>
                      <ExpressionLikeField
                        value={behavior.properties[property.key] ?? property.value}
                        numeric={property.type === "number"}
                        onChange={(value) =>
                          dispatch({
                            type: "updateBehavior",
                            objectId,
                            behaviorName: behavior.name,
                            patch: {
                              properties: { ...behavior.properties, [property.key]: value },
                            },
                          })
                        }
                      />
                    </FieldRow>
                  ))
              : null}
          </div>
        );
      })}
    </PropertySection>
  );
}

function ExpressionLikeField({
  value,
  numeric,
  onChange,
}: {
  value: string;
  numeric: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        "h-7 min-w-0 flex-1 rounded border border-separator bg-[#1D1D26] px-1.5 text-[12.5px] text-foreground outline-none focus:border-[var(--brand-light)]",
        numeric && "tabular-nums",
      )}
    />
  );
}

/* --------------------------------------------------------------------- layer */

function LayerProperties({ name }: { name: string }) {
  const { scene, dispatch } = useEditor();
  const layer = scene.layers.find((l) => l.name === name);
  if (!layer) return null;
  const isBase = layer.name === BASE_LAYER_NAME;
  const effectsApi: EffectsApi = {
    effects: layer.effects,
    add: (effect) => dispatch({ type: "addEffect", target: { kind: "layer", name }, effect }),
    update: (index, patch) =>
      dispatch({ type: "updateEffect", target: { kind: "layer", name }, index, patch }),
    remove: (index) => dispatch({ type: "deleteEffect", target: { kind: "layer", name }, index }),
    move: (index, direction) =>
      dispatch({ type: "moveEffect", target: { kind: "layer", name }, index, direction }),
  };
  const instances = scene.instances.filter((i) => i.layer === layer.name);

  return (
    <>
      <div className="flex items-center gap-2 px-3 py-2">
        <SquareStack className="h-5 w-5 shrink-0 text-[#C9B6FC]" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold">{layer.name}</div>
          <div className="text-[11px] text-text-secondary">
            {instances.length} instancia(s)
            {isBase ? " · capa base" : ""}
          </div>
        </div>
      </div>

      <PropertySection title={`${S.position} (cámara)`}>
        <FieldRow label="X">
          <NumberField
            value={layer.camera.x}
            onChange={(x) =>
              dispatch({ type: "updateLayer", name, patch: { camera: { ...layer.camera, x } } })
            }
          />
        </FieldRow>
        <FieldRow label="Y">
          <NumberField
            value={layer.camera.y}
            onChange={(y) =>
              dispatch({ type: "updateLayer", name, patch: { camera: { ...layer.camera, y } } })
            }
          />
        </FieldRow>
      </PropertySection>

      <PropertySection title={S.properties}>
        <FieldRow label={S.visible}>
          <ToggleField
            checked={layer.visible}
            label={S.visible}
            onChange={(visible) => dispatch({ type: "updateLayer", name, patch: { visible } })}
          />
        </FieldRow>
        <FieldRow label={S.locked}>
          <ToggleField
            checked={!!layer.locked}
            label={S.locked}
            onChange={(locked) => dispatch({ type: "updateLayer", name, patch: { locked } })}
          />
        </FieldRow>
        {!isBase ? (
          <FieldRow label="Usar la cámara de la capa base">
            <ToggleField
              checked={layer.followBaseLayer !== false}
              label="followBaseLayer"
              onChange={(followBaseLayer) =>
                dispatch({ type: "updateLayer", name, patch: { followBaseLayer } })
              }
            />
          </FieldRow>
        ) : null}
        {layer.isLightingLayer ? (
          <FieldRow label="Luz ambiental">
            <ColorField
              value={layer.ambientLightColor ?? "180;180;180"}
              onChange={(ambientLightColor) =>
                dispatch({ type: "updateLayer", name, patch: { ambientLightColor } })
              }
            />
          </FieldRow>
        ) : null}
      </PropertySection>

      <PropertySection title={`${S.effects} (${layer.effects.length})`}>
        <EffectsList api={effectsApi} compact />
      </PropertySection>
    </>
  );
}

/* --------------------------------------------------------------------- scene */

function SceneQuickProperties() {
  const { scene, dispatch, project } = useEditor();
  const sceneLocation: VariableScopeLocation = { scope: "scene" };
  const variablesApi: VariablesApi = {
    variables: scene.variables,
    add: (path) =>
      path.length === 0
        ? dispatch({ type: "addVariable", location: sceneLocation })
        : dispatch({ type: "addVariableChild", location: sceneLocation, path }),
    update: (path, patch) =>
      dispatch({ type: "updateVariable", location: { scope: "scene" }, path, patch }),
    remove: (path) => dispatch({ type: "deleteVariable", location: { scope: "scene" }, path }),
  };
  const layerNames = scene.layers.map((l) => l.name);

  return (
    <>
      <PropertySection title={S.sceneProperties}>
        <FieldRow label="Nombre">
          <TextField
            value={scene.name}
            onChange={(name) =>
              name && dispatch({ type: "renameScene", from: scene.name, to: name })
            }
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
        <FieldRow label={S.layerWhereInstancesAreAdded}>
          <ChoiceField
            value={scene.activeLayer}
            options={layerNames.length ? layerNames : [BASE_LAYER_NAME]}
            onChange={(activeLayer) => dispatch({ type: "updateScene", patch: { activeLayer } })}
          />
        </FieldRow>
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
          <p className="px-3 py-1 text-[12px] text-text-placeholder">
            {project.gameSettings.windowWidth} × {project.gameSettings.windowHeight} (configuración
            del juego)
          </p>
        )}
        <div className="px-3 pt-1">
          <GdButton
            variant="raised"
            size="small"
            icon={<Film className="h-3.5 w-3.5" />}
            onClick={() => dispatch({ type: "openDialog", dialog: { name: "sceneProperties" } })}
          >
            {S.sceneProperties}
          </GdButton>
        </div>
      </PropertySection>

      <PropertySection title="Cuadrícula">
        <FieldRow label={S.visible}>
          <ToggleField
            checked={scene.grid.show}
            label={S.toggleGrid}
            onChange={(show) => dispatch({ type: "updateGrid", patch: { show } })}
          />
        </FieldRow>
        <FieldRow label={S.snapToGrid}>
          <ToggleField
            checked={scene.grid.snap}
            label={S.snapToGrid}
            onChange={(snap) => dispatch({ type: "updateGrid", patch: { snap } })}
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
        <FieldRow label={S.gridColor}>
          <ColorField
            value={scene.grid.color}
            onChange={(color) => dispatch({ type: "updateGrid", patch: { color } })}
          />
        </FieldRow>
        <FieldRow label={S.gridAlpha}>
          <NumberField
            value={scene.grid.alpha}
            onChange={(alpha) =>
              dispatch({ type: "updateGrid", patch: { alpha: Math.max(0, Math.min(1, alpha)) } })
            }
          />
        </FieldRow>
      </PropertySection>

      <PropertySection title={`${S.sceneVariables} (${scene.variables.length})`}>
        <VariablesEditor api={variablesApi} />
      </PropertySection>

      <div className="flex items-center gap-2 px-3 py-2 text-[11.5px] text-text-secondary">
        <Film className="h-3.5 w-3.5" />
        {scene.instances.length} instancias · {scene.objects.length} objetos · {scene.events.length}{" "}
        eventos
        <span className="ml-auto flex items-center gap-1">
          <Variable className="h-3.5 w-3.5" />
          {project.globalVariables.length}
          <Lock className="h-3.5 w-3.5" />
          {scene.instances.filter((i) => i.locked).length}
        </span>
      </div>
    </>
  );
}
