import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

function arrayLiteral(source, declaration) {
  const declarationIndex = source.indexOf(declaration);
  assert.notEqual(declarationIndex, -1, `No se encontró ${declaration}`);
  const start = source.indexOf("[", declarationIndex);
  assert.notEqual(start, -1, `No se encontró el arreglo de ${declaration}`);
  const end = matchingDelimiter(source, start, "[", "]");
  return source.slice(start + 1, end);
}

function matchingDelimiter(source, start, open, close) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (lineComment) {
      if (char === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      if (char === "*" && next === "/") {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === "/" && next === "/") {
      lineComment = true;
      index += 1;
      continue;
    }
    if (char === "/" && next === "*") {
      blockComment = true;
      index += 1;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === open) depth += 1;
    if (char === close) {
      depth -= 1;
      if (depth === 0) return index;
    }
  }

  throw new Error(`Delimitador ${open}${close} sin cerrar`);
}

function topLevelObjects(source) {
  const objects = [];
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  let depth = 0;
  let start = -1;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (lineComment) {
      if (char === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      if (char === "*" && next === "/") {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === "/" && next === "/") {
      lineComment = true;
      index += 1;
      continue;
    }
    if (char === "/" && next === "*") {
      blockComment = true;
      index += 1;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "{") {
      if (depth === 0) start = index;
      depth += 1;
      continue;
    }
    if (char === "}") {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        objects.push(source.slice(start, index + 1));
        start = -1;
      }
    }
  }

  return objects;
}

function definitions(source, declaration) {
  return topLevelObjects(arrayLiteral(source, declaration)).map((entry) => {
    const id = entry.match(/\bid:\s*"([^"]+)"/)?.[1];
    assert.ok(id, `Definición sin id en ${declaration}`);
    return { id, unsupported: /\bunsupported:\s*true\b/.test(entry) };
  });
}

test("cada instrucción soportada por el catálogo tiene implementación en el runtime", async () => {
  const [catalogSource, engineSource] = await Promise.all([
    read("src/lib/editor/instructions.ts"),
    read("src/lib/runtime/engine.ts"),
  ]);
  const catalog = definitions(catalogSource, "export const INSTRUCTIONS");
  const runtimeCases = new Set(
    [...engineSource.matchAll(/\bcase\s+"([^"]+)"\s*:/g)].map((match) => match[1]),
  );
  const missing = catalog
    .filter((instruction) => !instruction.unsupported && !runtimeCases.has(instruction.id))
    .map((instruction) => instruction.id);

  assert.deepEqual(
    missing,
    [],
    `Instrucciones anunciadas sin implementación: ${missing.join(", ")}`,
  );
});

test("el catálogo no marca como no soportadas instrucciones ya implementadas", async () => {
  const [catalogSource, engineSource] = await Promise.all([
    read("src/lib/editor/instructions.ts"),
    read("src/lib/runtime/engine.ts"),
  ]);
  const catalog = definitions(catalogSource, "export const INSTRUCTIONS");
  const runtimeCases = new Set(
    [...engineSource.matchAll(/\bcase\s+"([^"]+)"\s*:/g)].map((match) => match[1]),
  );
  const stale = catalog
    .filter((instruction) => instruction.unsupported && runtimeCases.has(instruction.id))
    .map((instruction) => instruction.id);

  assert.deepEqual(stale, [], `Metadatos obsoletos de runtime: ${stale.join(", ")}`);
});

test("los identificadores de instrucciones y eventos son únicos", async () => {
  const source = await read("src/lib/editor/instructions.ts");
  const all = [
    ...definitions(source, "export const INSTRUCTIONS"),
    ...definitions(source, "export const EVENT_TYPES"),
  ];
  const duplicates = all
    .map((entry) => entry.id)
    .filter((id, index, ids) => ids.indexOf(id) !== index);

  assert.deepEqual(duplicates, [], `IDs duplicados: ${duplicates.join(", ")}`);
});

test("los módulos críticos no contienen exports de valor duplicados", async () => {
  const files = ["src/lib/editor/instructions.ts", "src/lib/runtime/engine.ts"];
  for (const file of files) {
    const source = await read(file);
    const names = [
      ...source.matchAll(/\bexport\s+(?:const|function|class)\s+([A-Za-z_$][\w$]*)/g),
    ].map((match) => match[1]);
    const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
    assert.deepEqual(duplicates, [], `Exports duplicados en ${file}: ${duplicates.join(", ")}`);
  }
});

test("las instrucciones desconocidas fallan de forma segura y las desactivadas no se ejecutan", async () => {
  const source = await read("src/lib/runtime/engine.ts");

  assert.match(source, /if \(result === null\) return false;/);
  assert.match(
    source,
    /reportUnsupportedInstruction\("condition", instruction, eventId\);\s*return null;/,
  );
  assert.match(source, /reportUnsupportedInstruction\("action", instruction, eventId\);/);
  assert.match(source, /event\.conditions\.filter\(\(condition\) => !condition\.disabled\)/);
  assert.match(source, /if \(action\.disabled\) continue;/);
});

test("los enlaces a eventos externos tienen ejecución y protección contra ciclos", async () => {
  const source = await read("src/lib/runtime/engine.ts");

  assert.match(source, /event\.kind === "link"/);
  assert.match(source, /this\.project\?\.externalEvents\.find/);
  assert.match(source, /this\.activeExternalEvents\.has\(name\)/);
});

test("la superficie pública se mantiene exclusivamente 2D", async () => {
  const publicFiles = [
    "README.md",
    "public/manifest.webmanifest",
    "src/routes/index.tsx",
    "src/routes/__root.tsx",
    "src/lib/editor/brand.ts",
    "src/lib/home/data.ts",
    "src/components/home/StoreView.tsx",
  ];
  const contents = await Promise.all(publicFiles.map(read));
  const leaks = publicFiles.filter((_, index) => /2D\s*\/\s*3D|\b3D\b/i.test(contents[index]));

  assert.deepEqual(leaks, [], `Referencias públicas a 3D: ${leaks.join(", ")}`);
});
