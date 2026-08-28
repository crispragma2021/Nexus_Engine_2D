// Object editor — the port of GDevelop's `ObjectEditor`: the animation list on the
// left (with the tabs for sprites / points / collision mask), the frame strip in the
// middle, and the properties of the selected animation or frame on the right.
// Text objects get the text properties instead of animations.

import * as React from "react";
import {
  ChevronLeft,
  Crosshair,
  Film,
  Image as ImageIcon,
  Plus,
  Ruler,
  Settings2,
  SquareDashed,
  Trash2,
} from "lucide-react";
import { useEditor } from "@/lib/editor/store";
import {
  OBJECT_TYPES,
  isSpriteLike,
  isTextLike,
  objectTypeLabel,
  resolveAsset,
} from "@/lib/editor/catalog";
import type { GDAnimationFrameImage, GDObjectDef, GDObjectPoint } from "@/lib/editor/types";
import { S } from "@/lib/editor/i18n";
import { cn } from "@/lib/utils";
import {
  ChoiceField,
  ColorField,
  FieldRow,
  GdButton,
  GdDialog,
  NumberField,
  PropertySection,
  TextField,
  ToggleField,
} from "./gd/kit";

type SidePanel = "sprites" | "points" | "masks";

export function ObjectEditorDialog() {
  const { scene, project, dispatch, ui } = useEditor();
  const objectId = ui.dialog?.name === "objectEditor" ? ui.dialog.objectId : null;
  const object = objectId ? scene.objects.find((o) => o.id === objectId) : undefined;
  const [panel, setPanel] = React.useState<SidePanel>("sprites");
  const [animationIndex, setAnimationIndex] = React.useState(0);
  const [frameIndex, setFrameIndex] = React.useState(0);

  React.useEffect(() => {
    setAnimationIndex(0);
    setFrameIndex(0);
    setPanel("sprites");
  }, [objectId]);

  const close = () => dispatch({ type: "closeDialog" });
  if (!object || !objectId) return null;

  const animations = object.animations ?? [];
  const animation = animations[animationIndex];
  const hasAnimations = isSpriteLike(object.type);
  const patchObject = (patch: Partial<GDObjectDef>) =>
    dispatch({ type: "updateObject", id: object.id, patch });

  return (
    <GdDialog
      open
      onClose={close}
      title={`${S.editObject} — ${object.name}`}
      width="max-w-[min(1180px,97vw)]"
      helpPath="https://gdevelop.io/docs/getting-started/assets/object"
      footer={
        <>
          <GdButton
            onClick={() => {
              close();
              dispatch({ type: "openDialog", dialog: { name: "behaviors", objectId } });
            }}
            icon={<Settings2 className="h-4 w-4" />}
          >
            {S.behaviors}
          </GdButton>
          <GdButton
            onClick={() => {
              close();
              dispatch({
                type: "openDialog",
                dialog: { name: "effects", targetKind: "object", targetId: objectId },
              });
            }}
            icon={<SquareDashed className="h-4 w-4" />}
          >
            {S.effects}
          </GdButton>
          <div className="ml-auto flex gap-2">
            <GdButton onClick={close}>{S.cancel}</GdButton>
            <GdButton variant="raised" primary onClick={close}>
              {S.ok}
            </GdButton>
          </div>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-[190px_minmax(0,1fr)_280px]">
        {/* left column */}
        <div className="flex flex-col border-b border-separator md:border-b-0 md:border-r">
          <div className="flex items-center gap-1 border-b border-separator px-1 py-1">
            <button
              type="button"
              aria-label="Volver"
              title="Volver a la escena"
              onClick={close}
              className="grid h-7 w-7 place-items-center rounded text-text-secondary hover:bg-elevated hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="truncate text-[12px] font-semibold uppercase tracking-wide text-text-secondary">
              {objectTypeLabel(object.type)}
            </span>
          </div>

          <div className="flex gap-1 border-b border-separator px-1 py-1">
            {(
              [
                { id: "sprites", label: hasAnimations ? "Sprites" : "Contenido", icon: Film },
                { id: "points", label: "Puntos", icon: Crosshair },
                { id: "masks", label: "Máscaras", icon: Ruler },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPanel(tab.id)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1 rounded px-1 py-1 text-[11px]",
                  panel === tab.id
                    ? "bg-[#494952] text-[#F6F2FF]"
                    : "text-text-secondary hover:bg-list-hover",
                )}
                title={tab.label}
              >
                <tab.icon className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-1">
            {hasAnimations ? (
              <>
                {animations.map((entry, index) => (
                  <div
                    key={`${entry.name}-${index}`}
                    className={cn(
                      "group mb-px flex cursor-pointer items-center gap-1 rounded px-1.5 py-1.5 text-[12.5px] hover:bg-list-hover",
                      animationIndex === index && "bg-selection",
                    )}
                    onClick={() => {
                      setAnimationIndex(index);
                      setFrameIndex(0);
                    }}
                  >
                    <span className="min-w-0 flex-1 truncate">{entry.name}</span>
                    <button
                      type="button"
                      aria-label={S.delete}
                      onClick={(event) => {
                        event.stopPropagation();
                        dispatch({ type: "deleteObjectAnimation", objectId, index });
                        setAnimationIndex((value) => Math.max(0, value - 1));
                      }}
                      className="shrink-0 text-text-secondary opacity-0 hover:text-destructive group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <GdButton
                  variant="raised"
                  primary
                  size="small"
                  className="mt-1 w-full"
                  icon={<Plus className="h-3.5 w-3.5" />}
                  onClick={() => {
                    dispatch({ type: "addObjectAnimation", objectId });
                    setAnimationIndex(Math.max(0, animations.length));
                  }}
                >
                  {S.addNewAnimation}
                </GdButton>
              </>
            ) : (
              <p className="p-2 text-[12px] text-text-secondary">
                Este tipo de objeto no usa animaciones. Edita sus propiedades a la derecha.
              </p>
            )}
          </div>
        </div>

        {/* center column */}
        <div className="min-h-[300px] p-2">
          {hasAnimations ? (
            animation ? (
              <>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-[12px] font-semibold uppercase tracking-wide text-text-secondary">
                    {animation.name} — fotogramas
                  </span>
                  <span className="text-[11px] text-text-placeholder">
                    {animation.images.length}
                  </span>
                  <GdButton
                    size="small"
                    variant="raised"
                    className="ml-auto"
                    icon={<Plus className="h-3.5 w-3.5" />}
                    onClick={() => {
                      dispatch({ type: "addObjectFrame", objectId, animationIndex });
                      setFrameIndex(animation.images.length);
                    }}
                  >
                    Añadir fotograma
                  </GdButton>
                </div>

                <div className="flex min-h-32 flex-wrap gap-2 rounded border border-separator bg-[#101017] p-2">
                  {animation.images.length === 0 ? (
                    <p className="p-2 text-[12px] text-text-placeholder">
                      Añade fotogramas para que el sprite se dibuje.
                    </p>
                  ) : null}
                  {animation.images.map((image, index) => {
                    const url = resolveAsset(image.image);
                    return (
                      <button
                        key={`${image.image}-${index}`}
                        type="button"
                        onClick={() => setFrameIndex(index)}
                        className={cn(
                          "group relative flex h-20 w-20 flex-col items-center justify-center gap-1 rounded border bg-[#1D1D26] p-1",
                          frameIndex === index
                            ? "border-[#4AB0E4]"
                            : "border-separator hover:border-[var(--brand-light)]",
                        )}
                        title={image.image}
                      >
                        {url ? (
                          <img
                            src={url}
                            alt=""
                            className="max-h-12 max-w-full object-contain [image-rendering:pixelated]"
                            draggable={false}
                          />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-text-placeholder" />
                        )}
                        <span className="w-full truncate text-[10px] text-text-secondary">
                          {index + 1}. {image.image}
                        </span>
                        <span
                          role="button"
                          tabIndex={-1}
                          aria-label={S.delete}
                          onClick={(event) => {
                            event.stopPropagation();
                            dispatch({
                              type: "deleteObjectFrame",
                              objectId,
                              animationIndex,
                              frameIndex: index,
                            });
                            setFrameIndex((value) =>
                              Math.max(0, Math.min(value, animation.images.length - 2)),
                            );
                          }}
                          className="absolute right-0.5 top-0.5 hidden h-4 w-4 place-items-center rounded bg-[#25252E] text-text-secondary group-hover:grid hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </span>
                      </button>
                    );
                  })}
                </div>

                {panel === "points" ? (
                  <PointsEditor
                    objectId={objectId}
                    animationIndex={animationIndex}
                    points={animation.points}
                  />
                ) : null}
                {panel === "masks" ? (
                  <MaskEditor
                    frame={animation.images[frameIndex]}
                    animationIndex={animationIndex}
                    objectId={objectId}
                    frameIndex={frameIndex}
                  />
                ) : null}
              </>
            ) : (
              <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2">
                <p className="text-[12.5px] text-text-secondary">
                  El objeto todavía no tiene ninguna animación.
                </p>
                <GdButton
                  variant="raised"
                  primary
                  icon={<Plus className="h-4 w-4" />}
                  onClick={() => dispatch({ type: "addObjectAnimation", objectId })}
                >
                  {S.addNewAnimation}
                </GdButton>
              </div>
            )
          ) : isTextLike(object.type) ? (
            <div className="rounded border border-[#32323B] bg-[#25252E] p-3">
              <label className="block text-[11px] uppercase tracking-wide text-text-secondary">
                Texto
              </label>
              <textarea
                value={object.text ?? ""}
                rows={4}
                onChange={(event) => patchObject({ text: event.target.value })}
                className="mt-1 w-full rounded border border-separator bg-[#1D1D26] p-2 text-[16px] text-foreground outline-none focus:border-[var(--brand-light)]"
              />
              <div className="mt-3 flex items-end justify-center rounded border border-separator bg-[#101017] p-6">
                <span
                  style={{
                    fontSize: Math.max(6, object.textSize ?? 24),
                    color: hexFromTriplet(object.textColor),
                    fontWeight: object.bold ? 700 : 400,
                    fontStyle: object.italic ? "italic" : "normal",
                  }}
                >
                  {object.text || "Texto"}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-40 items-center justify-center p-6 text-center text-[12.5px] text-text-secondary">
              Este objeto no tiene vista previa editable en el editor de {S.home}.
            </div>
          )}
        </div>

        {/* right column: properties */}
        <div className="border-l border-separator p-1">
          <PropertySection title={S.name}>
            <FieldRow label={S.name}>
              <TextField
                value={object.name}
                onChange={(name) => name && dispatch({ type: "renameObject", id: object.id, name })}
              />
            </FieldRow>
            <FieldRow label={S.type}>
              <ChoiceField
                value={object.type}
                options={OBJECT_TYPES.map((type) => type.typeId)}
                labels={Object.fromEntries(OBJECT_TYPES.map((type) => [type.typeId, type.name]))}
                onChange={(type) => patchObject({ type })}
              />
            </FieldRow>
            {!hasAnimations ? (
              <FieldRow label={S.resource}>
                <ChoiceField
                  value={object.asset ?? ""}
                  options={[
                    "",
                    ...project.resources.filter((r) => r.kind === "image").map((r) => r.name),
                  ]}
                  onChange={(asset) => patchObject({ asset })}
                />
              </FieldRow>
            ) : null}
          </PropertySection>

          {isTextLike(object.type) ? (
            <PropertySection title="Texto">
              <FieldRow label="Tamaño">
                <NumberField
                  value={object.textSize ?? 24}
                  onChange={(textSize) => patchObject({ textSize: Math.max(1, textSize) })}
                />
              </FieldRow>
              <FieldRow label={S.color}>
                <ColorField
                  value={object.textColor ?? "250;250;250"}
                  onChange={(textColor) => patchObject({ textColor })}
                />
              </FieldRow>
              <FieldRow label="Alineación">
                <ChoiceField
                  value={object.alignment ?? "left"}
                  options={["left", "center", "right"]}
                  labels={{ left: "Izquierda", center: "Centro", right: "Derecha" }}
                  onChange={(alignment) =>
                    patchObject({ alignment: alignment as GDObjectDef["alignment"] })
                  }
                />
              </FieldRow>
              <FieldRow label="Negrita">
                <ToggleField
                  checked={!!object.bold}
                  onChange={(bold) => patchObject({ bold })}
                  label="Negrita"
                />
              </FieldRow>
              <FieldRow label="Cursiva">
                <ToggleField
                  checked={!!object.italic}
                  onChange={(italic) => patchObject({ italic })}
                  label="Cursiva"
                />
              </FieldRow>
              <FieldRow label="Ajuste de línea">
                <ToggleField
                  checked={!!object.wrapping}
                  onChange={(wrapping) => patchObject({ wrapping })}
                  label="Ajuste de línea"
                />
              </FieldRow>
            </PropertySection>
          ) : null}

          {hasAnimations && animation ? (
            <>
              <PropertySection title="Animación">
                <FieldRow label="Nombre">
                  <TextField
                    value={animation.name}
                    onChange={(name) =>
                      dispatch({
                        type: "updateObjectAnimation",
                        objectId,
                        index: animationIndex,
                        patch: { name },
                      })
                    }
                  />
                </FieldRow>
                <FieldRow label="Velocidad (ms)">
                  <NumberField
                    value={animation.timeBetweenFrames}
                    onChange={(timeBetweenFrames) =>
                      dispatch({
                        type: "updateObjectAnimation",
                        objectId,
                        index: animationIndex,
                        patch: { timeBetweenFrames: Math.max(0, timeBetweenFrames) },
                      })
                    }
                  />
                </FieldRow>
                <FieldRow label="Repetir">
                  <ToggleField
                    checked={animation.loops}
                    label="Repetir"
                    onChange={(loops) =>
                      dispatch({
                        type: "updateObjectAnimation",
                        objectId,
                        index: animationIndex,
                        patch: { loops },
                      })
                    }
                  />
                </FieldRow>
              </PropertySection>

              {animation.images[frameIndex] ? (
                <PropertySection title={`Fotograma ${frameIndex + 1}`}>
                  <FieldRow label={S.resource}>
                    <ChoiceField
                      value={animation.images[frameIndex]?.image ?? ""}
                      options={project.resources
                        .filter((r) => r.kind === "image")
                        .map((r) => r.name)}
                      onChange={(image) =>
                        dispatch({
                          type: "updateObjectFrame",
                          objectId,
                          animationIndex,
                          frameIndex,
                          patch: { image },
                        })
                      }
                    />
                  </FieldRow>
                  <FieldRow label="Origen X">
                    <NumberField
                      value={animation.images[frameIndex]?.originX ?? 0}
                      onChange={(originX) =>
                        dispatch({
                          type: "updateObjectFrame",
                          objectId,
                          animationIndex,
                          frameIndex,
                          patch: { originX },
                        })
                      }
                    />
                  </FieldRow>
                  <FieldRow label="Origen Y">
                    <NumberField
                      value={animation.images[frameIndex]?.originY ?? 0}
                      onChange={(originY) =>
                        dispatch({
                          type: "updateObjectFrame",
                          objectId,
                          animationIndex,
                          frameIndex,
                          patch: { originY },
                        })
                      }
                    />
                  </FieldRow>
                  <FieldRow label="Centro X">
                    <NumberField
                      value={animation.images[frameIndex]?.centerX ?? 0}
                      onChange={(centerX) =>
                        dispatch({
                          type: "updateObjectFrame",
                          objectId,
                          animationIndex,
                          frameIndex,
                          patch: { centerX },
                        })
                      }
                    />
                  </FieldRow>
                  <FieldRow label="Centro Y">
                    <NumberField
                      value={animation.images[frameIndex]?.centerY ?? 0}
                      onChange={(centerY) =>
                        dispatch({
                          type: "updateObjectFrame",
                          objectId,
                          animationIndex,
                          frameIndex,
                          patch: { centerY },
                        })
                      }
                    />
                  </FieldRow>
                  <FieldRow label={S.opacity}>
                    <NumberField
                      value={animation.images[frameIndex]?.opacity ?? 255}
                      onChange={(opacity) =>
                        dispatch({
                          type: "updateObjectFrame",
                          objectId,
                          animationIndex,
                          frameIndex,
                          patch: { opacity: Math.max(0, Math.min(255, opacity)) },
                        })
                      }
                    />
                  </FieldRow>
                </PropertySection>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </GdDialog>
  );
}

function PointsEditor({
  objectId,
  animationIndex,
  points,
}: {
  objectId: string;
  animationIndex: number;
  points: GDObjectPoint[];
}) {
  const { dispatch } = useEditor();
  return (
    <div className="mt-3 rounded border border-separator">
      <div className="flex items-center gap-2 border-b border-separator bg-[#25252E] px-2 py-1">
        <span className="flex-1 text-[11px] font-semibold uppercase tracking-wide text-[#D6DEEC]">
          Puntos personalizados
        </span>
        <GdButton
          size="small"
          variant="raised"
          icon={<Plus className="h-3.5 w-3.5" />}
          onClick={() => dispatch({ type: "addObjectPoint", objectId, animationIndex })}
        >
          Añadir punto
        </GdButton>
      </div>
      {points.length === 0 ? (
        <p className="px-2 py-1.5 text-[12px] text-text-secondary">
          Añade puntos (origen, centro, o los que quieras) para colocar instancias o dirigir
          proyectiles.
        </p>
      ) : null}
      {points.map((point, index) => (
        <div key={`${point.name}-${index}`} className="flex items-center gap-1 px-2 py-1">
          <input
            value={point.name}
            aria-label="Nombre del punto"
            onChange={(event) =>
              dispatch({
                type: "updateObjectPoint",
                objectId,
                animationIndex,
                pointIndex: index,
                patch: { name: event.target.value },
              })
            }
            className="h-7 w-32 rounded border border-separator bg-[#1D1D26] px-1 text-[12px] outline-none focus:border-[var(--brand-light)]"
          />
          <span className="text-[11px] text-text-secondary">X</span>
          <input
            type="number"
            value={point.x}
            aria-label="X del punto"
            onChange={(event) =>
              dispatch({
                type: "updateObjectPoint",
                objectId,
                animationIndex,
                pointIndex: index,
                patch: { x: Number(event.target.value) },
              })
            }
            className="h-7 w-16 rounded border border-separator bg-[#1D1D26] px-1 text-[12px] tabular-nums outline-none focus:border-[var(--brand-light)]"
          />
          <span className="text-[11px] text-text-secondary">Y</span>
          <input
            type="number"
            value={point.y}
            aria-label="Y del punto"
            onChange={(event) =>
              dispatch({
                type: "updateObjectPoint",
                objectId,
                animationIndex,
                pointIndex: index,
                patch: { y: Number(event.target.value) },
              })
            }
            className="h-7 w-16 rounded border border-separator bg-[#1D1D26] px-1 text-[12px] tabular-nums outline-none focus:border-[var(--brand-light)]"
          />
          <button
            type="button"
            aria-label={S.delete}
            onClick={() =>
              dispatch({
                type: "updateObjectAnimation",
                objectId,
                index: animationIndex,
                patch: { points: points.filter((_, i) => i !== index) },
              })
            }
            className="ml-auto grid h-6 w-6 place-items-center rounded text-text-secondary hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

function MaskEditor({
  frame,
  objectId,
  animationIndex,
  frameIndex,
}: {
  frame: GDAnimationFrameImage | undefined;
  objectId: string;
  animationIndex: number;
  frameIndex: number;
}) {
  const { dispatch } = useEditor();
  const url = resolveAsset(frame?.image);
  if (!frame) {
    return (
      <p className="mt-3 rounded border border-separator p-2 text-[12px] text-text-secondary">
        Selecciona un fotograma para editar su máscara de colisión.
      </p>
    );
  }
  return (
    <div className="mt-3 rounded border border-separator">
      <div className="border-b border-separator bg-[#25252E] px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#D6DEEC]">
        Máscara de colisión
      </div>
      <div className="flex flex-wrap items-center gap-3 p-2">
        <div className="relative shrink-0 rounded border border-separator bg-[#101017] p-2">
          {url ? (
            <img src={url} alt="" className="max-h-24 object-contain [image-rendering:pixelated]" />
          ) : (
            <div className="grid h-20 w-20 place-items-center text-[11px] text-text-placeholder">
              sin imagen
            </div>
          )}
          <div
            className="pointer-events-none absolute border border-[#FF85ED]"
            style={{
              left: 8 + (frame.originX ?? 0),
              top: 8 + (frame.originY ?? 0),
              right: 8 - (frame.originX ?? 0) - 1,
              bottom: 8 - (frame.originY ?? 0) - 1,
            }}
          />
        </div>
        <div className="min-w-56 flex-1 text-[12px] text-text-secondary">
          <p>
            El motor de Nexus Engine usa la caja delimitadora del fotograma para las colisiones.
            Ajusta aquí el recorte (en píxeles, desde el origen) si necesitas una máscara más
            estrecha.
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <label className="flex items-center gap-1">
              <span className="w-16 text-[11px]">Recorte X</span>
              <input
                type="number"
                value={frame.originX}
                onChange={(event) =>
                  dispatch({
                    type: "updateObjectFrame",
                    objectId,
                    animationIndex,
                    frameIndex,
                    patch: { originX: Number(event.target.value) },
                  })
                }
                className="h-7 w-full rounded border border-separator bg-[#1D1D26] px-1 tabular-nums outline-none focus:border-[var(--brand-light)]"
              />
            </label>
            <label className="flex items-center gap-1">
              <span className="w-16 text-[11px]">Recorte Y</span>
              <input
                type="number"
                value={frame.originY}
                onChange={(event) =>
                  dispatch({
                    type: "updateObjectFrame",
                    objectId,
                    animationIndex,
                    frameIndex,
                    patch: { originY: Number(event.target.value) },
                  })
                }
                className="h-7 w-full rounded border border-separator bg-[#1D1D26] px-1 tabular-nums outline-none focus:border-[var(--brand-light)]"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

const hexFromTriplet = (value?: string) => {
  if (!value) return "#FAFAFA";
  if (value.startsWith("#")) return value;
  const parts = value.split(";").map((part) => Math.max(0, Math.min(255, Number(part) || 0)));
  return `#${parts.map((part) => part.toString(16).padStart(2, "0")).join("")}`;
};
