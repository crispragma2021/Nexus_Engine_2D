#!/usr/bin/env node
/**
 * Runtime conformance — Nexus Engine.
 *
 * Headless, deterministic simulation of the TypeScript runtime (no DOM, no
 * browser). Builds a small platformer project in memory, runs it twice with
 * identical inputs and verifies the contract:
 *
 *   1. Determinism        — same project + same inputs => identical state.
 *   2. Platform physics   — the character falls and lands on the platform.
 *   3. Default controls   — holding "Right" moves the character.
 *   4. Events             — Collision deletes the coin and adds to Puntos.
 *   5. Damage             — collision with the slime lowers Vidas.
 *   6. Diagnostics        — an unsupported instruction fails safely.
 *   7. Helpers            — compare/applyModOp/normalizeKey contract.
 *
 * Run with `npm run conformance`.
 */

import assert from "node:assert/strict";
import { register } from "node:module";

// Extensionless relative imports in the TS sources need a resolve hook under
// plain Node ESM (Vite handles them in the app; see conformance-ts-loader.mjs).
register("./conformance-ts-loader.mjs", import.meta.url);

const { GameRuntime, compare, applyModOp, normalizeKey } =
  await import("../src/lib/runtime/engine.ts");

// ---------------------------------------------------------------------------
// Fixture project (shape: GDProject, src/lib/editor/types.ts)
// ---------------------------------------------------------------------------

const grid = {
  show: false,
  snap: false,
  width: 32,
  height: 32,
  kind: "rectangular",
  color: "158;180;255",
  alpha: 0.8,
  offsetX: 0,
  offsetY: 0,
};

const layer = { name: "Base layer", visible: true, camera: { x: 0, y: 0 }, effects: [] };

const sprite = (name, behaviors = []) => ({
  id: `obj-${name}`,
  name,
  type: "Sprite",
  behaviors,
  effects: [],
  variables: [],
});

const instance = (name, x, y, width, height) => ({
  id: `inst-${name}`,
  objectId: `obj-${name}`,
  x,
  y,
  angle: 0,
  customSize: true,
  width,
  height,
  zOrder: 0,
  layer: "Base layer",
  locked: false,
  hiddenAtStart: false,
  variables: [],
  effects: [],
});

const instruction = (id, typeId, parameters = {}, inverted = false) => ({
  id,
  typeId,
  inverted,
  parameters,
});

const project = {
  name: "Conformance",
  scenes: [
    {
      name: "Nivel 1",
      backgroundColor: "230;235;255",
      grid,
      layers: [layer],
      activeLayer: "Base layer",
      objects: [
        sprite("Jugador", [
          {
            name: "PlatformerObject",
            type: "PlatformBehavior::PlatformerObjectBehavior",
            properties: {
              jumpSpeed: "600",
              gravity: "1800",
              maxFallingSpeed: "900",
              acceleration: "800",
              maxSpeed: "250",
              friction: "20",
            },
          },
        ]),
        sprite("Plataforma", [
          { name: "Platform", type: "PlatformBehavior::PlatformBehavior", properties: {} },
        ]),
        sprite("Moneda"),
        sprite("Slime"),
      ],
      instances: [
        instance("Plataforma", 0, 480, 800, 32), // top edge at y=480
        instance("Jugador", 60, 300, 32, 32), // falls, lands at y=448
        instance("Moneda", 200, 448, 16, 16), // on the walking path
        instance("Slime", 400, 448, 32, 32), // on the walking path
      ],
      events: [
        {
          id: "ev-coin",
          kind: "standard",
          conditions: [
            instruction("c-coin", "Collision", { object: "Jugador", object2: "Moneda" }),
          ],
          actions: [
            instruction("a-coin-del", "Delete", { object: "Moneda" }),
            instruction("a-coin-var", "ModVarScene", { variable: "Puntos", op: "add", value: "1" }),
          ],
          subEvents: [],
          collapsed: false,
        },
        {
          id: "ev-hurt",
          kind: "standard",
          conditions: [instruction("c-hurt", "Collision", { object: "Jugador", object2: "Slime" })],
          actions: [
            instruction("a-hurt-var", "ModVarScene", { variable: "Vidas", op: "add", value: "-1" }),
          ],
          subEvents: [],
          collapsed: false,
        },
        {
          id: "ev-unknown",
          kind: "standard",
          conditions: [],
          actions: [instruction("a-unknown", "NexusNoSoportado::NoExiste", {})],
          subEvents: [],
          collapsed: false,
        },
      ],
      variables: [
        { name: "Puntos", type: "number", value: "0", children: [] },
        { name: "Vidas", type: "number", value: "3", children: [] },
      ],
      groups: [],
    },
  ],
  gameSettings: {
    author: "conformance",
    description: "Headless runtime conformance fixture",
    version: "1.0.0",
    packageName: "com.nexus.conformance",
    orientation: "landscape",
    windowWidth: 800,
    windowHeight: 600,
    useWindowSizeAsBaseSize: true,
    magnification: 1,
    minFPS: 1,
    maxFPS: 60,
    adaptGameResolutionAtRuntime: false,
    scaleMode: "nearest",
    windowMode: "default",
    startScene: "Nivel 1",
    pauseOnLostFocus: true,
    renderOutsideGameArea: false,
    loadingScreen: {
      displayBrandSplash: false,
      minDuration: 0,
      fadeInDuration: 0,
      fadeOutDuration: 0,
      backgroundColor: "0;0;0",
    },
    watermark: { showOnMobile: false },
    projectUuid: "conformance",
    folderPolicy: "doNotUse",
  },
  resources: [],
  globalVariables: [],
  extensions: [],
  externalEvents: [],
  externalLayouts: [],
  version: "1.0.0",
  firstLayoutName: "Nivel 1",
};

// ---------------------------------------------------------------------------
// Simulation
// ---------------------------------------------------------------------------

const TICKS = 180; // 3 s at 60 fps
const DELTA = 1 / 60;

function runOnce() {
  const diagnostics = [];
  const runtime = GameRuntime.forProject(project, project.scenes[0], {
    onDiagnostic: (d) => diagnostics.push(d),
  });
  runtime.pressKey("Right");
  for (let tick = 0; tick < TICKS; tick += 1) runtime.step(DELTA);
  runtime.releaseKey("Right");
  return { runtime, diagnostics };
}

function snapshot(runtime) {
  // The runtime assigns its own sequential instance ids (rt_1, rt_2, ...) that
  // differ between runs, so snapshots key instances by definition name
  // (unique in this fixture) to stay comparable.
  const instances = runtime.state.objects
    .filter((object) => !object.destroyed)
    .map((object) => ({
      name: object.name,
      x: Math.round(object.x * 1000) / 1000,
      y: Math.round(object.y * 1000) / 1000,
      anim: object.animationIndex,
      frame: object.frameIndex,
    }))
    .sort((a, b) => (a.name < b.name ? -1 : 1));
  return {
    frame: runtime.state.frame,
    instances,
    variables: { ...runtime.state.variables },
    globalVariables: { ...runtime.state.globalVariables },
  };
}

const findInstance = (runtime, name) =>
  runtime.state.objects.find((object) => object.name === name && !object.destroyed);

let failures = 0;
const check = (label, fn) => {
  try {
    fn();
    console.log(`  ✓ ${label}`);
  } catch (error) {
    failures += 1;
    console.error(`  ✗ ${label}`);
    console.error(`    ${error.message}`);
  }
};

console.log("Nexus Engine — runtime conformance (headless)");

// Two identical runs.
const [first, second] = [runOnce(), runOnce()];
const { runtime, diagnostics } = first;

check("determinism: two runs with the same inputs are identical", () => {
  assert.deepEqual(snapshot(runtime), snapshot(second.runtime));
});

check("physics: the player lands on the platform (y=448, onFloor)", () => {
  const player = findInstance(runtime, "Jugador");
  assert.ok(player, "Jugador exists");
  assert.ok(Math.abs(player.y - 448) < 0.5, `player y=${player.y}, expected 448`);
  assert.equal(player.onFloor, true, "player is on the floor");
});

check("controls: holding Right moved the player", () => {
  const player = findInstance(runtime, "Jugador");
  assert.ok(player.x > 100, `player x=${player.x}, expected > 100`);
});

check("events: the coin was collected (destroyed) and Puntos=1", () => {
  const coin = runtime.state.objects.find((object) => object.name === "Moneda");
  assert.ok(!coin || coin.destroyed, "coin destroyed");
  assert.equal(runtime.state.variables["Puntos"], "1");
});

check("events: touching the slime lowered Vidas below 3", () => {
  const vidas = Number(runtime.state.variables["Vidas"]);
  assert.ok(vidas < 3, `Vidas=${vidas}, expected < 3`);
});

check("diagnostics: the unsupported instruction was reported, not thrown", () => {
  const report = diagnostics.find((d) => d.code === "unsupported-instruction");
  assert.ok(report, "an unsupported-instruction diagnostic was emitted");
  assert.equal(runtime.state.frame, TICKS, "the runtime kept stepping after it");
});

check("helpers: compare / applyModOp / normalizeKey contract", () => {
  assert.equal(compare(1, ">", 0), true);
  assert.equal(compare(2, "==", 2), true);
  assert.equal(applyModOp(5, "add", 2), 7);
  assert.equal(applyModOp(5, "subtract", 2), 3);
  assert.equal(applyModOp(5, "set to", 9), 9);
  assert.equal(normalizeKey("ArrowRight"), "Right");
  assert.equal(normalizeKey("a"), "a");
});

if (failures > 0) {
  console.error(`\nConformance FAILED: ${failures} check(s) failed.`);
  process.exitCode = 1;
} else {
  console.log("\nConformance OK: all runtime contract checks passed.");
}
