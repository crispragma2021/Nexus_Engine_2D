import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path: string) => readFile(new URL(path, import.meta.url), "utf8");

test("the permanent mobile dock exposes the five GDevelop scene tools", async () => {
  const source = await read("../src/components/editor/MobileBottomBar.tsx");

  for (const key of ["objects", "groups", "properties", "instances", "layers"]) {
    assert.match(source, new RegExp(`key: "${key}"`));
  }
  assert.match(source, /data-editor-mobile-dock="permanent"/);
  assert.match(source, /className="fixed inset-x-0 bottom-0 z-40/);
  assert.match(source, /<InstancesPanel onClose=/);
  assert.match(source, /<LayersPanel onClose=/);
});

test("mobile dock panels and contextual AI popovers stop above the fixed dock", async () => {
  const [styles, shell, dock, automation, inlinePrompt] = await Promise.all([
    read("../src/styles.css"),
    read("../src/components/editor/EditorShell.tsx"),
    read("../src/components/editor/MobileBottomBar.tsx"),
    read("../src/components/editor/QuickAutomationBar.tsx"),
    read("../src/components/editor/InlineAiPrompt.tsx"),
  ]);

  assert.match(styles, /--mobile-editor-dock-height:/);
  assert.match(shell, /pb-\[var\(--mobile-editor-dock-height\)\] md:pb-0/);
  assert.match(dock, /bottom-\[var\(--mobile-editor-dock-height\)\] z-30/);
  // The QuickAutomation drawer is a full-height bottom sheet (bottom-0, above
  // the dock z-index) that intentionally overlays the dock for max space.
  assert.match(automation, /data-ai-overlay="drawer"/);
  assert.match(automation, /fixed inset-x-0 bottom-0/);
  assert.match(automation, /md:bottom-4/);
  // Everything that must coexist with the dock stops right above it.
  assert.match(inlinePrompt, /data-ai-overlay="contextual-popover"/);
  assert.match(inlinePrompt, /bottom-\[calc\(var\(--mobile-editor-dock-height\)/);
});

test("the scene canvas declares explicit one- and two-finger arbitration", async () => {
  const source = await read("../src/components/editor/SceneCanvas.tsx");

  assert.match(source, /data-touch-controls="one-finger-interaction two-finger-pan pinch-zoom"/);
  assert.match(source, /resolveTwoPointerGesture/);
  assert.match(source, /touchSequenceTransformed/);
  assert.match(source, /JUEGO ·/);
});

test("the instance inspector resolves definitions by stable object id", async () => {
  const source = await read("../src/components/editor/PropertiesPanel.tsx");

  assert.match(source, /scene\.objects\.find\(\(o\) => o\.id === selectedInstance\.objectId\)/);
  assert.doesNotMatch(source, /o\.name === selectedInstance\.objectId/);
});
