import test from "node:test";
import assert from "node:assert/strict";

import {
  CANVAS_MAX_ZOOM,
  fitGameWindowZoom,
  midpoint,
  pointDistance,
  pointerGestureForCount,
  resolveTwoPointerGesture,
  resolveZoomAtPoint,
  type CanvasGestureStart,
} from "../src/lib/editor/canvas-gestures.ts";

const start: CanvasGestureStart = {
  points: [
    { x: 300, y: 300 },
    { x: 500, y: 300 },
  ],
  zoom: 0.5,
  magnification: 1,
  pan: { x: 0, y: 0 },
  transform: { scale: 0.5, offsetX: 200, offsetY: 150 },
  viewport: { width: 800, height: 600 },
  gameWindow: { width: 800, height: 600 },
  centerWindow: true,
};

test("classifies one pointer as interaction and two pointers as canvas transform", () => {
  assert.equal(pointerGestureForCount(0), "none");
  assert.equal(pointerGestureForCount(1), "interaction");
  assert.equal(pointerGestureForCount(2), "transform");
  assert.equal(pointerGestureForCount(4), "transform");
});

test("computes pointer midpoint and distance", () => {
  assert.deepEqual(midpoint({ x: 2, y: 8 }, { x: 8, y: 4 }), { x: 5, y: 6 });
  assert.equal(pointDistance({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
});

test("two-finger translation pans without changing zoom", () => {
  const result = resolveTwoPointerGesture(start, [
    { x: 350, y: 320 },
    { x: 550, y: 320 },
  ]);

  assert.equal(result.zoom, 0.5);
  assert.deepEqual(result.pan, { x: 50, y: 20 });
});

test("pinch zoom keeps the scene point below the midpoint", () => {
  const result = resolveTwoPointerGesture(start, [
    { x: 200, y: 300 },
    { x: 600, y: 300 },
  ]);

  assert.equal(result.zoom, 1);
  assert.deepEqual(result.pan, { x: 0, y: 0 });
});

test("pinch zoom is clamped to the editor zoom limits", () => {
  const result = resolveTwoPointerGesture({ ...start, zoom: 100 }, [
    { x: -1_000, y: 300 },
    { x: 1_400, y: 300 },
  ]);

  assert.equal(result.zoom, CANVAS_MAX_ZOOM);
});

test("wheel zoom preserves the world point under the cursor", () => {
  const result = resolveZoomAtPoint({ x: 300, y: 250 }, 1, {
    zoom: start.zoom,
    magnification: start.magnification,
    pan: start.pan,
    transform: start.transform,
    viewport: start.viewport,
    gameWindow: start.gameWindow,
    centerWindow: start.centerWindow,
  });

  // Cursor world point is (200, 200). At 100%, a centered 800x600 window has
  // no automatic offset, so pan must place that world point back at 300,250.
  assert.deepEqual(result, { zoom: 1, pan: { x: 100, y: 50 } });
});

test("fit zoom leaves large windows visible and never enlarges small windows", () => {
  assert.equal(fitGameWindowZoom({ width: 1280, height: 720 }, { width: 320, height: 180 }, 1), 1);
  assert.equal(
    fitGameWindowZoom({ width: 688, height: 408 }, { width: 1280, height: 720 }, 1),
    0.5,
  );
});
