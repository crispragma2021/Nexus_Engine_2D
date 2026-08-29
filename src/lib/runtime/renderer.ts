// Canvas 2D renderer for the runtime scene state.
//
// It only reads `RuntimeState` (plus a resource resolver) so the simulation stays
// independent from how things are drawn. Effects implemented here: tint, color
// overlay, opacity, flips and per-layer camera — everything else keeps the look of
// the plain Pixi renderer GDevelop uses.

import type { RuntimeState } from "./types";

const imageCache = new Map<string, HTMLImageElement>();

export type ResourceResolver = (name?: string) => string | undefined;

function getImage(src: string | undefined): HTMLImageElement | undefined {
  if (!src) return undefined;
  const cached = imageCache.get(src);
  if (cached) return cached.complete && cached.naturalWidth > 0 ? cached : undefined;
  const image = new Image();
  image.src = src;
  imageCache.set(src, image);
  return undefined;
}

export interface RenderOptions {
  /** size of the game window in *world* pixels */
  width: number;
  height: number;
  background: string;
  /** resolve an image resource name to a url (project resources) */
  resolve?: ResourceResolver;
  /** draw the runtime bounding boxes, like the editor "collision masks" toggle */
  showHitMasks?: boolean;
  /** zoom, and where the window is drawn on the canvas */
  scale?: number;
  offsetX?: number;
  offsetY?: number;
}

const isTextType = (type: string) =>
  type === "Text" || type.includes("Text") || type.includes("BBText");

export function renderScene(
  ctx: CanvasRenderingContext2D,
  state: RuntimeState,
  options: RenderOptions,
) {
  const { width, height, background, resolve, showHitMasks } = options;
  const scale = options.scale ?? 1;

  ctx.save();
  ctx.translate(options.offsetX ?? 0, options.offsetY ?? 0);
  ctx.scale(scale, scale);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  const objects = [...state.objects]
    .filter((object) => !object.destroyed && !object.hidden && !object.flash.hidden)
    .sort((a, b) => a.zOrder - b.zOrder);

  for (const object of objects) {
    const layer = state.layers[object.layer];
    if (layer && !layer.visible) continue;
    // Layers that follow the base layer are driven by the global camera; the
    // others keep their own camera (GDevelop's `useRenderingForLayer` logic).
    const ownCamera = !!layer && layer.followBaseLayer === false;
    const camX = ownCamera ? (layer?.cameraX ?? 0) : state.camera.x;
    const camY = ownCamera ? (layer?.cameraY ?? 0) : state.camera.y;
    const zoom = ownCamera ? (layer?.cameraZoom ?? 1) : (state.camera.zoom ?? 1);
    const layerAlpha = (layer?.opacity ?? 255) / 255;

    // Camera zoom scales around the middle of the window.
    const centerWorldX = camX + width / 2;
    const centerWorldY = camY + height / 2;
    const viewX = (object.x - centerWorldX) * zoom + width / 2;
    const viewY = (object.y - centerWorldY) * zoom + height / 2;
    const viewW = object.width * zoom;
    const viewH = object.height * zoom;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, object.opacity / 255)) * layerAlpha;
    const cx = viewX + viewW / 2;
    const cy = viewY + viewH / 2;
    ctx.translate(cx, cy);
    if (object.angle) ctx.rotate((object.angle * Math.PI) / 180);
    if (object.flipX) ctx.scale(-1, 1);
    if (object.flipY) ctx.scale(1, -1);

    if (isTextType(object.type)) {
      ctx.fillStyle = object.textColor;
      ctx.font = `${object.bold ? "700 " : ""}${Math.max(1, object.textSize * zoom)}px ${object.fontFamily ? `"${object.fontFamily.replace(/\.[a-z]+$/i, "")}", ` : ""}ui-sans-serif, system-ui, sans-serif`;
      ctx.textBaseline = "middle";
      ctx.textAlign =
        object.alignment === "center" ? "center" : object.alignment === "right" ? "right" : "left";
      const anchorX =
        object.alignment === "center" ? 0 : object.alignment === "right" ? viewW / 2 : -viewW / 2;
      ctx.fillText(object.text, anchorX, 0);
      ctx.restore();
      continue;
    }

    const url = resolve?.(object.asset) ?? object.asset;
    const image = getImage(url);
    if (image) {
      ctx.imageSmoothingEnabled = false;
      if (object.type === "TiledSpriteObject::TiledSprite" || object.type === "Tiled Sprite") {
        drawTiled(ctx, image, viewW, viewH);
      } else {
        ctx.drawImage(image, -viewW / 2, -viewH / 2, viewW, viewH);
      }
      applyTint(ctx, object.tint, object.colorOverlay, viewW, viewH);
    } else {
      ctx.fillStyle = object.tint
        ? `rgb(${object.tint[0]}, ${object.tint[1]}, ${object.tint[2]})`
        : "rgba(112,70,236,0.65)";
      ctx.fillRect(-viewW / 2, -viewH / 2, viewW, viewH);
    }

    if (showHitMasks) {
      ctx.globalAlpha = 0.75;
      ctx.strokeStyle = "#FF85ED";
      ctx.lineWidth = 1;
      const mask = object.hitBox;
      if (mask) {
        const referenceWidth = Math.max(1, mask.referenceWidth ?? object.width);
        const referenceHeight = Math.max(1, mask.referenceHeight ?? object.height);
        const sourcePoints =
          mask.kind === "polygon" && mask.vertices.length >= 3
            ? mask.vertices
            : [
                { x: mask.x, y: mask.y },
                { x: mask.x + mask.width, y: mask.y },
                { x: mask.x + mask.width, y: mask.y + mask.height },
                { x: mask.x, y: mask.y + mask.height },
              ];
        ctx.beginPath();
        sourcePoints.forEach((point, index) => {
          const x = (point.x / referenceWidth) * viewW - viewW / 2;
          const y = (point.y / referenceHeight) * viewH - viewH / 2;
          if (index === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.stroke();
      } else {
        ctx.strokeRect(-viewW / 2, -viewH / 2, viewW, viewH);
      }
    }
    ctx.restore();
  }

  ctx.restore();
}

function drawTiled(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
) {
  const tileW = image.naturalWidth || width;
  const tileH = image.naturalHeight || height;
  ctx.save();
  ctx.beginPath();
  ctx.rect(-width / 2, -height / 2, width, height);
  ctx.clip();
  for (let x = -width / 2; x < width / 2; x += tileW) {
    for (let y = -height / 2; y < height / 2; y += tileH) {
      ctx.drawImage(image, x, y, tileW, tileH);
    }
  }
  ctx.restore();
}

/**
 * Tint multiplies the pixels, color overlay replaces them — same visual result as
 * GDevelop's "Tinte" and "Superposición de color" effects, done with composite ops.
 */
function applyTint(
  ctx: CanvasRenderingContext2D,
  tint: [number, number, number] | null,
  overlay: [number, number, number, number] | null,
  width: number,
  height: number,
) {
  if (!tint && !overlay) return;
  ctx.save();
  ctx.globalCompositeOperation = tint ? "multiply" : "source-atop";
  if (tint) {
    ctx.globalAlpha = 1;
    ctx.fillStyle = `rgb(${tint[0]}, ${tint[1]}, ${tint[2]})`;
    ctx.fillRect(-width / 2, -height / 2, width, height);
  }
  if (overlay) {
    ctx.globalCompositeOperation = "source-atop";
    ctx.globalAlpha = Math.max(0, Math.min(1, overlay[3] / 255));
    ctx.fillStyle = `rgb(${overlay[0]}, ${overlay[1]}, ${overlay[2]})`;
    ctx.fillRect(-width / 2, -height / 2, width, height);
  }
  ctx.restore();
}

/** Natural size of an object image, used to size instances without custom size. */
export function naturalSize(name?: string, resolve?: ResourceResolver) {
  const url = resolve?.(name);
  const image = url ? getImage(url) : undefined;
  if (!image) return undefined;
  return { width: image.naturalWidth, height: image.naturalHeight };
}
