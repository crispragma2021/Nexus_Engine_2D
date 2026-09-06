import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path: string) => readFile(new URL(path, import.meta.url), "utf8");

test("the editor titlebar exposes a persistent back-to-home navigation", async () => {
  const source = await read("../src/components/editor/ProjectTitlebar.tsx");
  assert.match(source, /data-editor-home-button/);
  assert.match(source, /useNavigate\(\)/);
  assert.match(source, /from "@tanstack\/react-router"/);
  assert.match(source, /navigate\(\{\s*to: "\/"\s*\}\)/);
  assert.match(source, /S\.home/);
  assert.match(source, /ArrowLeft/);
});

test("the scene canvas hosts a floating scene view toolbar", async () => {
  const canvas = await read("../src/components/editor/SceneCanvas.tsx");
  assert.match(canvas, /<SceneViewToolbar onFit=\{fitWindow\} \/>/);
  assert.match(canvas, /from "\.\/SceneViewToolbar"/);
});

test("the scene view toolbar provides grid, snap, zoom and fit controls", async () => {
  const toolbar = await read("../src/components/editor/SceneViewToolbar.tsx");
  assert.match(toolbar, /data-scene-view-toolbar="floating"/);
  assert.match(toolbar, /absolute left-2 top-2/);
  assert.match(toolbar, /S\.toggleGrid/);
  assert.match(toolbar, /S\.snapToGrid/);
  assert.match(toolbar, /scene\.grid\.show/);
  assert.match(toolbar, /scene\.grid\.snap/);
  assert.match(toolbar, /updateGrid/);
  assert.match(toolbar, /S\.zoomOut/);
  assert.match(toolbar, /S\.zoomIn/);
  assert.match(toolbar, /S\.zoomReset/);
  assert.match(toolbar, /clampCanvasZoom/);
  assert.match(toolbar, /Math\.round\(ui\.zoom \* 100\)/);
  assert.match(toolbar, /S\.zoomToFit/);
  assert.match(toolbar, /onFit/);
});
