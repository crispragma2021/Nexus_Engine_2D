import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path: string) => readFile(new URL(path, import.meta.url), "utf8");

test("MainMenu component exposes the hamburger trigger and core options", async () => {
  const source = await read("../src/components/editor/MainMenu.tsx");
  assert.match(source, /data-main-menu-button/);
  assert.match(source, /data-main-menu="dropdown"/);
  assert.match(source, /Crear un juego/);
  assert.match(source, /Abrir\.\.\./);
  assert.match(source, /Abrir recientes/);
  assert.match(source, /Exportar \(web, móvil\)/);
  assert.match(source, /Cerrar proyecto/);
});

test("ProjectTitlebar embeds the MainMenu before the home navigation", async () => {
  const source = await read("../src/components/editor/ProjectTitlebar.tsx");
  assert.match(source, /<MainMenu \/>/);
  assert.match(source, /from "\.\/MainMenu"/);
});
