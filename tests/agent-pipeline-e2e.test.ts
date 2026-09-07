// E2E del pipeline IA determinista: crea la escena "Arena_Test" con un objeto
// jugador, físicas de plataformas y un evento de colisión, todo a través de las
// mismas funciones puras que usa el agente (operations + validator + session).
//
// El objetivo es confirmar que el pipeline es 100% determinista: ejecutar el
// mismo escenario dos veces sobre proyectos idénticos produce la misma
// estructura canónica (mismos objetos, comportamientos y eventos; los ids
// internos son generados por uid y se ignoran en la comparación).

import test from "node:test";
import assert from "node:assert/strict";

import { applyPlan, createOperation, createPlan } from "../src/lib/agent/operations.ts";
import { validatePlan } from "../src/lib/agent/validator.ts";
import { planFromInstruction } from "../src/lib/agent/planner.ts";
import type { GDProject } from "../src/lib/editor/types.ts";

// ---------------------------------------------------------------------------
// Fixture mínimo (GDProject válido, sin escenas: se crea Arena_Test en el test)
// ---------------------------------------------------------------------------

function emptyProject(): GDProject {
  return {
    name: "Test",
    version: "1.0.0",
    firstLayoutName: "",
    scenes: [],
    gameSettings: {
      author: "test",
      description: "",
      version: "1.0.0",
      packageName: "com.nexus.test",
      orientation: "landscape",
      windowWidth: 800,
      windowHeight: 600,
      useWindowSizeAsBaseSize: true,
      magnification: 1,
      minFPS: 30,
      maxFPS: 60,
      adaptGameResolutionAtRuntime: false,
      scaleMode: "nearest",
      windowMode: "default",
      startScene: "",
      pauseOnLostFocus: false,
      renderOutsideGameArea: false,
      loadingScreen: {
        displayBrandSplash: false,
        minDuration: 0,
        fadeInDuration: 0,
        fadeOutDuration: 0,
        backgroundColor: "0;0;0",
      },
      watermark: { showOnMobile: false },
      projectUuid: "test",
      folderPolicy: "doNotUse",
    },
    resources: [],
    globalVariables: [],
    extensions: [],
    externalEvents: [],
    externalLayouts: [],
  };
}

const sceneOf = (project: GDProject, name: string) =>
  project.scenes.find((scene) => scene.name === name)!;

// ---------------------------------------------------------------------------
// Escenario canónico (estructura independiente de los ids generados)
// ---------------------------------------------------------------------------

/** Proyección canónica: nombres/objetos/comportamientos/eventos, sin ids. */
function canonical(project: GDProject): string {
  return JSON.stringify(
    project.scenes
      .map((scene) => ({
        name: scene.name,
        objects: [...scene.objects]
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((object) => ({
            name: object.name,
            type: object.type,
            behaviors: object.behaviors.map((behavior) => behavior.type).sort(),
          })),
        events: scene.events.map((event) => ({
          conditions: event.conditions.map((instruction) => ({
            typeId: instruction.typeId,
            parameters: instruction.parameters,
          })),
          actions: event.actions.map((instruction) => ({
            typeId: instruction.typeId,
            parameters: instruction.parameters,
          })),
        })),
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  );
}

/** Ejecuta el escenario completo y devuelve el proyecto final. */
function runArenaScenario(project: GDProject): GDProject {
  // 1. Crear la escena.
  const scenePlan = createPlan("Crear escena Arena_Test", [
    createOperation("create_scene", { name: "Arena_Test" }),
  ]);
  const sceneResult = applyPlan(project, scenePlan);
  assert.equal(sceneResult.ok, true, "falla al crear Arena_Test");
  let current = sceneResult.project;

  // 2. Crear objetos (jugador y plataforma).
  const objectsPlan = createPlan("Crear objetos de Arena_Test", [
    createOperation("create_object", {
      sceneName: "Arena_Test",
      name: "Jugador",
      type: "Sprite",
    }),
    createOperation("create_object", {
      sceneName: "Arena_Test",
      name: "Plataforma",
      type: "Sprite",
    }),
  ]);
  const objectsResult = applyPlan(current, objectsPlan);
  assert.equal(objectsResult.ok, true, "falla al crear los objetos");
  current = objectsResult.project;

  const arena = sceneOf(current, "Arena_Test");
  const jugador = arena.objects.find((object) => object.name === "Jugador")!;
  assert.ok(jugador, "debe existir el objeto Jugador");

  // 3. Físicas (comportamiento de plataformas simuladas por el runtime).
  const physicsPlan = createPlan("Añadir físicas de plataformas", [
    createOperation("add_behavior", {
      sceneName: "Arena_Test",
      objectId: jugador.id,
      type: "PlatformBehavior::PlatformerObjectBehavior",
    }),
  ]);
  const physicsResult = applyPlan(current, physicsPlan);
  assert.equal(physicsResult.ok, true, "falla al añadir físicas al Jugador");
  current = physicsResult.project;

  // 4. Evento de colisión (Jugador ↔ Plataforma, destruye la Plataforma).
  const collisionPlan = createPlan("Añadir colisión Jugador↔Plataforma", [
    createOperation("add_collision", {
      sceneName: "Arena_Test",
      objectA: "Jugador",
      objectB: "Plataforma",
      deleteTarget: "B",
    }),
  ]);
  const collisionResult = applyPlan(current, collisionPlan);
  assert.equal(collisionResult.ok, true, "falla al añadir la colisión");
  return collisionResult.project;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test("el plan de crear la escena Arena_Test pasa la validación", () => {
  const project = emptyProject();
  const plan = createPlan("Crear escena Arena_Test", [
    createOperation("create_scene", { name: "Arena_Test" }),
  ]);
  assert.equal(validatePlan(plan, project).ok, true);
});

test("e2e: el pipeline IA crea Arena_Test con jugador, físicas y colisión (determinista)", () => {
  const first = runArenaScenario(emptyProject());
  const second = runArenaScenario(emptyProject());

  const arenaA = sceneOf(first, "Arena_Test");
  const jugadorA = arenaA.objects.find((object) => object.name === "Jugador")!;
  assert.ok(
    jugadorA.behaviors.some(
      (behavior) => behavior.type === "PlatformBehavior::PlatformerObjectBehavior",
    ),
    "el Jugador debe tener físicas de plataformas",
  );
  assert.ok(
    arenaA.events.some(
      (event) =>
        event.conditions.some(
          (instruction) =>
            instruction.typeId === "Collision" &&
            instruction.parameters["object"] === "Jugador" &&
            instruction.parameters["object2"] === "Plataforma",
        ) && event.actions.some((instruction) => instruction.typeId === "Delete"),
    ),
    "debe existir un evento de colisión que destruye la Plataforma",
  );

  // Determinismo: dos ejecuciones sobre proyectos idénticos producen la misma
  // estructura canónica (los ids internos se ignoran en la proyección).
  assert.equal(canonical(first), canonical(second));
});

test("determinismo del planificador: la misma instrucción produce el mismo plan", () => {
  const project = runArenaScenario(emptyProject());
  const context = { project, activeSceneName: "Arena_Test" };
  const prompt = "cuando Jugador colisiona con Plataforma, destruye Plataforma";

  const a = planFromInstruction(prompt, context);
  const b = planFromInstruction(prompt, context);
  assert.ok(a.plan, "debe producir un plan");
  assert.ok(b.plan, "debe producir un plan en la segunda pasada");
  assert.equal(a.plan!.operations.length, b.plan!.operations.length);
  for (let index = 0; index < a.plan!.operations.length; index += 1) {
    assert.equal(a.plan!.operations[index]!.type, b.plan!.operations[index]!.type);
    assert.deepEqual(a.plan!.operations[index]!.payload, b.plan!.operations[index]!.payload);
  }
});

test("el proyecto final de Arena_Test es utilizable por el runtime (instancias válidas)", () => {
  const project = runArenaScenario(emptyProject());
  const arena = sceneOf(project, "Arena_Test");
  const objectIds = new Set(arena.objects.map((object) => object.id));
  for (const instance of arena.instances) {
    assert.ok(objectIds.has(instance.objectId), "instancia huérfana en Arena_Test");
  }
  // Invariante del serializador: eventos planos, sin sub-eventos opacos.
  for (const event of arena.events) {
    assert.equal(event.kind, "standard");
    assert.deepEqual(event.subEvents, []);
  }
});

// ---------------------------------------------------------------------------
// Regresión M2: la validación estricta de instrucciones (SCHEMA + referencias)
// rechaza un evento inválido ANTES de mutar la escena.
// ---------------------------------------------------------------------------

test("M2: un evento con KeyPressed sin tecla se rechaza antes de mutar", () => {
  const project = runArenaScenario(emptyProject());
  const plan = createPlan("evento con KeyPressed incompleto", [
    createOperation("create_event", {
      sceneName: "Arena_Test",
      conditions: [{ typeId: "KeyPressed", parameters: {} }],
      actions: [],
    }),
  ]);
  const result = applyPlan(project, plan);
  assert.equal(result.ok, false, "un KeyPressed sin key no debe aplicarse");
  assert.equal(result.project, project, "el proyecto no cambia tras un evento inválido");
  assert.ok(
    result.diagnostics.some((diagnostic) => diagnostic.code === "invalid-payload"),
    "debe reportar invalid-payload",
  );
});

test("M2: un evento con Collision hacia un objeto inexistente se rechaza", () => {
  const project = runArenaScenario(emptyProject());
  const plan = createPlan("evento con Collision fantasma", [
    createOperation("create_event", {
      sceneName: "Arena_Test",
      conditions: [
        {
          typeId: "Collision",
          parameters: { object: "Jugador", object2: "Fantasma" },
        },
      ],
      actions: [],
    }),
  ]);
  const result = applyPlan(project, plan);
  assert.equal(result.ok, false, "una Collision hacia un objeto inexistente no debe aplicarse");
  assert.equal(result.project, project);
  assert.ok(
    result.diagnostics.some((diagnostic) => diagnostic.code === "invalid-payload"),
    "debe reportar invalid-payload",
  );
});
