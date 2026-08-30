export interface CanvasPoint {
  x: number;
  y: number;
}

export interface CanvasViewport {
  width: number;
  height: number;
}

export interface GameWindowSize {
  width: number;
  height: number;
}

export interface CanvasViewTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface CanvasGestureStart {
  points: readonly [CanvasPoint, CanvasPoint];
  zoom: number;
  magnification: number;
  pan: CanvasPoint;
  transform: CanvasViewTransform;
  viewport: CanvasViewport;
  gameWindow: GameWindowSize;
  centerWindow: boolean;
}

export const CANVAS_MIN_ZOOM = 1 / 128;
export const CANVAS_MAX_ZOOM = 128;

export function clampCanvasZoom(zoom: number): number {
  return Math.min(CANVAS_MAX_ZOOM, Math.max(CANVAS_MIN_ZOOM, zoom));
}

export function pointerGestureForCount(count: number): "none" | "interaction" | "transform" {
  if (count >= 2) return "transform";
  if (count === 1) return "interaction";
  return "none";
}

export function midpoint(a: CanvasPoint, b: CanvasPoint): CanvasPoint {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function pointDistance(a: CanvasPoint, b: CanvasPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Offset contributed by the editor itself before the user's pan is applied.
 * Large game windows are kept centered in the available viewport, matching the
 * scene editor projection used by SceneCanvas.
 */
export function centeredWindowOffset(
  viewport: CanvasViewport,
  gameWindow: GameWindowSize,
  scale: number,
  centerWindow: boolean,
): CanvasPoint {
  if (!centerWindow) return { x: 0, y: 0 };
  return {
    x: (viewport.width - gameWindow.width * scale) / 2,
    y: (viewport.height - gameWindow.height * scale) / 2,
  };
}

/** Return whether SceneCanvas uses its centered-window projection. */
export function shouldCenterGameWindow(
  viewport: CanvasViewport,
  gameWindow: GameWindowSize,
  magnification: number,
  padding = 32,
): boolean {
  const fit = Math.min(
    (viewport.width - padding) / Math.max(1, gameWindow.width * magnification),
    (viewport.height - padding) / Math.max(1, gameWindow.height * magnification),
  );
  return fit < 1;
}

/**
 * Zoom that leaves the complete game window visible with a small editor margin.
 * The result is the UI zoom (before a scene magnification is applied).
 */
export function fitGameWindowZoom(
  viewport: CanvasViewport,
  gameWindow: GameWindowSize,
  magnification: number,
  padding = 48,
): number {
  const usableWidth = Math.max(1, viewport.width - padding);
  const usableHeight = Math.max(1, viewport.height - padding);
  const renderedScale = Math.min(
    usableWidth / Math.max(1, gameWindow.width),
    usableHeight / Math.max(1, gameWindow.height),
    magnification,
  );
  return clampCanvasZoom(renderedScale / Math.max(Number.EPSILON, magnification));
}

/**
 * Resolve a two-pointer gesture from its initial snapshot. The scene point that
 * was below the initial midpoint stays below the current midpoint. Consequently
 * moving both fingers pans, changing their distance zooms, and doing both works
 * in one gesture without jumps.
 */
export function resolveTwoPointerGesture(
  start: CanvasGestureStart,
  points: readonly [CanvasPoint, CanvasPoint],
): { zoom: number; pan: CanvasPoint } {
  const startCenter = midpoint(start.points[0], start.points[1]);
  const currentCenter = midpoint(points[0], points[1]);
  const startDistance = Math.max(1, pointDistance(start.points[0], start.points[1]));
  const currentDistance = Math.max(1, pointDistance(points[0], points[1]));
  const zoom = clampCanvasZoom(start.zoom * (currentDistance / startDistance));
  const scale = zoom * start.magnification;
  const worldAnchor = {
    x: (startCenter.x - start.transform.offsetX) / start.transform.scale,
    y: (startCenter.y - start.transform.offsetY) / start.transform.scale,
  };
  const wantedOffset = {
    x: currentCenter.x - worldAnchor.x * scale,
    y: currentCenter.y - worldAnchor.y * scale,
  };
  const centeredOffset = centeredWindowOffset(
    start.viewport,
    start.gameWindow,
    scale,
    start.centerWindow,
  );

  return {
    zoom,
    pan: {
      x: wantedOffset.x - centeredOffset.x,
      y: wantedOffset.y - centeredOffset.y,
    },
  };
}

/** Zoom around a screen-space point while keeping its scene position fixed. */
export function resolveZoomAtPoint(
  point: CanvasPoint,
  nextZoom: number,
  options: Omit<CanvasGestureStart, "points">,
): { zoom: number; pan: CanvasPoint } {
  const zoom = clampCanvasZoom(nextZoom);
  const scale = zoom * options.magnification;
  const worldAnchor = {
    x: (point.x - options.transform.offsetX) / options.transform.scale,
    y: (point.y - options.transform.offsetY) / options.transform.scale,
  };
  const wantedOffset = {
    x: point.x - worldAnchor.x * scale,
    y: point.y - worldAnchor.y * scale,
  };
  const centeredOffset = centeredWindowOffset(
    options.viewport,
    options.gameWindow,
    scale,
    options.centerWindow,
  );
  return {
    zoom,
    pan: {
      x: wantedOffset.x - centeredOffset.x,
      y: wantedOffset.y - centeredOffset.y,
    },
  };
}
