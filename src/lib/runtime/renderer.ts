// Canvas 2D renderer for the runtime scene state.

import type { RuntimeState } from "./types";

const imageCache = new Map<string, HTMLImageElement>();

function getImage(src: string): HTMLImageElement | undefined {
  const cached = imageCache.get(src);
  if (cached) return cached.complete && cached.naturalWidth > 0 ? cached : undefined;
  const image = new Image();
  image.src = src;
  imageCache.set(src, image);
  return undefined;
}

export interface RenderOptions {
  width: number;
  height: number;
  background: string;
}

export function renderScene(
  ctx: CanvasRenderingContext2D,
  state: RuntimeState,
  options: RenderOptions,
) {
  const { width, height, background } = options;
  ctx.save();
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  const objects = [...state.objects]
    .filter((object) => !object.destroyed && !object.hidden)
    .sort((a, b) => a.zOrder - b.zOrder);

  for (const object of objects) {
    const isUi = object.layer !== "Base layer";
    const offsetX = isUi ? 0 : state.camera.x;
    const offsetY = isUi ? 0 : state.camera.y;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, object.opacity / 255));
    ctx.translate(object.x - offsetX + object.width / 2, object.y - offsetY + object.height / 2);
    if (object.angle) ctx.rotate((object.angle * Math.PI) / 180);
    if (object.flipX) ctx.scale(-1, 1);

    if (object.type === "Text") {
      ctx.globalAlpha = 1;
      ctx.fillStyle = object.textColor;
      ctx.font = `600 ${object.textSize}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.fillText(object.text, -object.width / 2, 0);
    } else {
      const image = object.asset ? getImage(object.asset) : undefined;
      if (image) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(image, -object.width / 2, -object.height / 2, object.width, object.height);
      } else {
        ctx.fillStyle = "rgba(112,70,236,0.65)";
        ctx.fillRect(-object.width / 2, -object.height / 2, object.width, object.height);
      }
    }
    ctx.restore();
  }

  ctx.restore();
}
