import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path: string) => readFile(new URL(path, import.meta.url), "utf8");

test("MainMenu component exposes the hamburger trigger and core options", async () => {
  const source = await read("../src/components/editor/MainMenu.tsx");
  assert.match(source, /aria-label="Menú principal"/);
  assert.match(source, /<Menu className="h-4 w-4"/);
  assert.match(source, /Crear un juego/);
  assert.match(source, /Abrir\.\.\./);
  assert.match(source, /Abrir recientes/);
});

test("MainMenu wires its file actions to the store instead of fake toasts", async () => {
  const source = await read("../src/components/editor/MainMenu.tsx");
  assert.match(source, /saveProjectEverywhere/);
  assert.match(source, /type: "markSaved"/);
  assert.match(source, /createEmptyProject/);
  assert.match(source, /type: "loadProject"/);
  assert.match(source, /name: "share", tab/);
  assert.match(source, /type: "openDialog"/);
  assert.match(source, /openShare\("publish"\)/);
  assert.match(source, /openShare\("invite"\)/);
});

test("ProjectTitlebar embeds the MainMenu and a project-name badge", async () => {
  const source = await read("../src/components/editor/ProjectTitlebar.tsx");
  assert.match(source, /<MainMenu \/>/);
  assert.match(source, /from "\.\/MainMenu"/);
  assert.match(source, /project\.name/);
});

test("the share dialog is rendered by the editor shell from the store", async () => {
  const shell = await read("../src/components/editor/EditorShell.tsx");
  assert.match(shell, /<ShareDialog/);
  assert.match(shell, /ui\.dialog\?\.name === "share"/);
  assert.match(shell, /type: "closeDialog"/);
});

test("the share dialog actually exports the zip via exportGameToZip", async () => {
  const dialog = await read("../src/components/editor/ShareDialog.tsx");
  assert.match(dialog, /exportGameToZip/);
  assert.match(dialog, /downloadZip/);
  assert.match(dialog, /link\.download =/);
});
