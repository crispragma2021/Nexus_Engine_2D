import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path: string) => readFile(new URL(path, import.meta.url), "utf8");

test("the editor titlebar hosts the hamburger menu and keeps the project name visible", async () => {
  const source = await read("../src/components/editor/ProjectTitlebar.tsx");
  assert.match(source, /<MainMenu \/>/);
  assert.match(source, /useNavigate\(\)/);
  assert.match(source, /from "@tanstack\/react-router"/);
  assert.match(source, /project\.name/);
});
