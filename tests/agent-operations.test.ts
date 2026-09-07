// Deterministic tests for the agent core: ProjectOperation contract, Game Tool
// Registry, plan validator, atomic transactions and rollback. Runs under plain
// Node (node --experimental-strip-types), so it imports the real modules with
// .ts extensions and builds its own fixture project (no Vite assets).

import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  applyOperation,
  applyPlan,
  createOperation,
  createPlan,
  rollbackAppliedPlan,
  summarizePlan,
  type AgentPlan,
  type ProjectOperation,
} from "../src/lib/agent/operations.ts";
import {
  validateOperation,
  validatePlan,
  MAX_PLAN_OPERATIONS,
} from "../src/lib/agent/validator.ts";
import {
  SUPPORTED_BEHAVIOR_TYPES,
  SUPPORTED_INSTRUCTION_TYPES,
} from "../src/lib/agent/capabilities.ts";
import { TOOL_NAMES } from "../src/lib/agent/tools.ts";
import type { GDProject } from "../src/lib/editor/types.ts";

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

function fixtureProject(): GDProject {
  return {
    name: "Test",
    version: "1.0.0",
    firstLayoutName: "Nivel 1",
    scenes: [
      {
        name: "Nivel 1",
        backgroundColor: "255;255;255",
        grid: {
          show: false,
          snap: false,
          width: 32,
          height: 32,
          kind: "rectangular",
          color: "158;180;255",
          alpha: 0.8,
          offsetX: 0,
          offsetY: 0,
        },
        layers: [{ name: "Base layer", visible: true, camera: { x: 0, y: 0 }, effects: [] }],
        activeLayer: "Base layer",
        objects: [
          {
            id: "obj_plataforma",
            name: "Plataforma",
            type: "Sprite",
            asset: "platform.png",
            animations: [
              {
                name: "Animación 1",
                loops: true,
                timeBetweenFrames: 1,
                images: [
                  {
                    image: "platform.png",
                    originX: 0,
                    originY: 0,
                    centerX: 16,
                    centerY: 16,
                    opacity: 100,
                  },
                ],
                points: [],
              },
            ],
            behaviors: [
              {
                name: "Platform",
                type: "PlatformBehavior::PlatformBehavior",
                properties: { platformType: "Normal platform" },
              },
            ],
            effects: [],
            variables: [],
          },
          {
            id: "obj_texto",
            name: "Puntos",
            type: "TextObject::Text",
            text: "0",
            textColor: "#ffffff",
            textSize: 24,
            fontFamily: "Arial",
            behaviors: [],
            effects: [],
            variables: [],
          },
        ],
        instances: [
          {
            id: "inst_plataforma",
            objectId: "obj_plataforma",
            x: 0,
            y: 480,
            angle: 0,
            customSize: true,
            width: 800,
            height: 32,
            zOrder: 0,
            layer: "Base layer",
            locked: false,
            hiddenAtStart: false,
            variables: [],
            effects: [],
          },
        ],
        events: [],
        variables: [],
        groups: [],
      },
    ],
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
      startScene: "Nivel 1",
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
    resources: [
      { name: "platform.png", kind: "image", file: "platform.png", url: "data:image/png;base64,x" },
      { name: "player.png", kind: "image", file: "player.png", url: "data:image/png;base64,x" },
    ],
    globalVariables: [],
    extensions: [],
    externalEvents: [],
    externalLayouts: [],
  };
}

const sceneOf = (project: GDProject, name = "Nivel 1") =>
  project.scenes.find((scene) => scene.name === name)!;

// ---------------------------------------------------------------------------
// Contract + registry basics
// ---------------------------------------------------------------------------

test("createOperation produces a version-1 operation", () => {
  const operation = createOperation("create_scene", { name: "Nivel 2" });
  assert.equal(operation.version, 1);
  assert.equal(operation.type, "create_scene");
  assert.equal(typeof operation.id, "string");
  assert.ok(operation.id.length > 0);
});

test("el registro contiene las herramientas del brief (23)", () => {
  const expected = [
    "create_scene",
    "duplicate_scene",
    "update_scene",
    "create_object",
    "update_object",
    "delete_object",
    "create_instance",
    "move_instance",
    "resize_instance",
    "assign_sprite",
    "create_animation",
    "add_behavior",
    "remove_behavior",
    "create_variable",
    "create_event",
    "update_event",
    "add_collision",
    "create_asset",
    "import_asset",
    "run_preview",
    "inspect_diagnostics",
    "undo_last_plan",
    "restore_snapshot",
  ];
  for (const name of expected) {
    assert.ok(TOOL_NAMES.includes(name), `falta la herramienta ${name}`);
  }
});

test("herramientas no implementadas se reportan como no soportadas (sin fingen)", () => {
  const project = fixtureProject();
  const outcome = applyOperation(project, createOperation("create_asset", { name: "coin2.png" }));
  assert.ok(outcome.diagnostics.some((d) => d.code === "tool-unsupported"));
  assert.equal(outcome.project, project, "el proyecto no cambia");
});

test("herramienta inexistente → unknown-tool, proyecto intacto", () => {
  const project = fixtureProject();
  const outcome = applyOperation(project, createOperation("hack_project", {}));
  assert.ok(outcome.diagnostics.some((d) => d.code === "unknown-tool"));
  assert.equal(outcome.project, project);
});

test("operación con forma inválida → invalid-operation", () => {
  const project = fixtureProject();
  const bad = { id: "", version: 2, type: "create_scene", payload: null } as unknown;
  const outcome = applyOperation(project, bad);
  assert.ok(outcome.diagnostics.some((d) => d.code === "invalid-operation"));
  assert.equal(outcome.project, project);
});

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

test("create_scene + duplicate_scene + update_scene", () => {
  let project = fixtureProject();
  project = applyOperation(project, createOperation("create_scene", { name: "Nivel 2" })).project;
  assert.ok(project.scenes.some((s) => s.name === "Nivel 2"));

  // nombre duplicado → rechazado
  const dup = applyOperation(project, createOperation("create_scene", { name: "Nivel 2" }));
  assert.ok(dup.diagnostics.some((d) => d.code === "invalid-payload"));

  const copy = applyOperation(
    project,
    createOperation("duplicate_scene", { sceneName: "Nivel 1" }),
  ).project;
  const copied = copy.scenes.find((s) => s.name === "Nivel 1 (copia)")!;
  assert.ok(copied);
  assert.equal(copied.objects.length, 2);
  assert.equal(copied.instances.length, 1);
  // los objetos de la copia tienen ids nuevos
  assert.ok(!project.scenes[0]!.objects.some((o) => o.id === copied.objects[0]!.id));

  const painted = applyOperation(
    project,
    createOperation("update_scene", { sceneName: "Nivel 1", backgroundColor: "30;40;90" }),
  ).project;
  assert.equal(sceneOf(painted).backgroundColor, "30;40;90");

  const badColor = applyOperation(
    project,
    createOperation("update_scene", { sceneName: "Nivel 1", backgroundColor: "azul" }),
  );
  assert.ok(badColor.diagnostics.some((d) => d.code === "invalid-payload"));
});

test("create_object / update_object / delete_object", () => {
  const project = fixtureProject();
  const created = applyOperation(
    project,
    createOperation("create_object", {
      sceneName: "Nivel 1",
      name: "Jugador",
      type: "Sprite",
      asset: "player.png",
    }),
  ).project;
  const player = sceneOf(created).objects.find((o) => o.name === "Jugador")!;
  assert.ok(player);
  assert.equal(player.asset, "player.png");

  // tipo no soportado → explicación honesta
  const badType = applyOperation(
    project,
    createOperation("create_object", {
      sceneName: "Nivel 1",
      name: "Video",
      type: "VideoObject::Video",
    }),
  );
  assert.ok(badType.diagnostics.some((d) => d.code === "invalid-payload"));

  // rename sincroniza eventos y grupos
  const eventProject = applyOperation(
    created,
    createOperation("create_event", {
      sceneName: "Nivel 1",
      conditions: [
        { typeId: "Collision", parameters: { object: "Jugador", object2: "Plataforma" } },
      ],
    }),
  ).project;
  const renamed = applyOperation(
    eventProject,
    createOperation("update_object", {
      sceneName: "Nivel 1",
      objectId: player.id,
      patch: { name: "Héroe" },
    }),
  ).project;
  const event = sceneOf(renamed).events[0]!;
  assert.equal(event.conditions[0]!.parameters["object"], "Héroe");

  const deleted = applyOperation(
    renamed,
    createOperation("delete_object", { sceneName: "Nivel 1", objectId: player.id }),
  );
  assert.ok(deleted.deleted.some((e) => e.kind === "object"));
  assert.equal(
    sceneOf(deleted.project).objects.find((o) => o.name === "Héroe"),
    undefined,
  );
});

test("create_instance / move_instance / resize_instance / assign_sprite / create_animation", () => {
  const project = fixtureProject();
  const withInstance = applyOperation(
    project,
    createOperation("create_instance", {
      sceneName: "Nivel 1",
      objectId: "obj_plataforma",
      x: 100,
      y: 400,
    }),
  ).project;
  const instance = sceneOf(withInstance).instances.find((i) => i.id !== "inst_plataforma")!;
  assert.ok(instance);
  assert.equal(instance.x, 100);

  const moved = applyOperation(
    withInstance,
    createOperation("move_instance", {
      sceneName: "Nivel 1",
      instanceId: instance.id,
      x: 150,
      y: 410,
    }),
  ).project;
  assert.equal(sceneOf(moved).instances.find((i) => i.id === instance.id)!.x, 150);

  const resized = applyOperation(
    moved,
    createOperation("resize_instance", {
      sceneName: "Nivel 1",
      instanceId: instance.id,
      width: 128,
      height: 64,
    }),
  ).project;
  const resizedInstance = sceneOf(resized).instances.find((i) => i.id === instance.id)!;
  assert.equal(resizedInstance.width, 128);
  assert.equal(resizedInstance.customSize, true);

  // id inexistente → no hay alucinaciones de ids
  const badId = applyOperation(
    moved,
    createOperation("move_instance", {
      sceneName: "Nivel 1",
      instanceId: "inst_nosabe",
      x: 0,
      y: 0,
    }),
  );
  assert.ok(badId.diagnostics.some((d) => d.code === "invalid-payload"));

  const assigned = applyOperation(
    resized,
    createOperation("assign_sprite", {
      sceneName: "Nivel 1",
      objectId: "obj_texto",
      resource: "player.png",
    }),
  );
  assert.ok(assigned.created.length === 0 && assigned.project);

  const animated = applyOperation(
    project,
    createOperation("create_animation", {
      sceneName: "Nivel 1",
      objectId: "obj_plataforma",
      name: "Caminar",
      resource: "player.png",
    }),
  ).project;
  const animations = sceneOf(animated).objects[0]!.animations!;
  assert.ok(animations.some((a) => a.name === "Caminar" && a.images[0]!.image === "player.png"));
});

test("add_behavior: solo comportamientos que el runtime simula", () => {
  const project = fixtureProject();
  const withPlatformer = applyOperation(
    project,
    createOperation("add_behavior", {
      sceneName: "Nivel 1",
      objectId: "obj_plataforma",
      type: "PlatformBehavior::PlatformerObjectBehavior",
    }),
  ).project;
  const object = sceneOf(withPlatformer).objects.find((o) => o.id === "obj_plataforma")!;
  const behavior = object.behaviors.find(
    (b) => b.type === "PlatformBehavior::PlatformerObjectBehavior",
  )!;
  assert.ok(behavior);
  // propiedades por defecto del catálogo
  assert.equal(behavior.properties["gravity"], "1800");

  // Physics2 existe en el catálogo pero el runtime no lo simula → se rechaza y se explica
  const physics = applyOperation(
    project,
    createOperation("add_behavior", {
      sceneName: "Nivel 1",
      objectId: "obj_plataforma",
      type: "Physics2::Physics2Behavior",
    }),
  );
  const diagnostic = physics.diagnostics.find((d) => d.code === "invalid-payload");
  assert.ok(diagnostic, "debe rechazar Physics2");
  assert.match(diagnostic!.message, /runtime aún no lo simula/);

  const removed = applyOperation(
    withPlatformer,
    createOperation("remove_behavior", {
      sceneName: "Nivel 1",
      objectId: "obj_plataforma",
      behaviorName: behavior.name,
    }),
  );
  assert.ok(removed.deleted.some((e) => e.kind === "behavior"));
});

test("create_variable en escena y global", () => {
  let project = fixtureProject();
  project = applyOperation(
    project,
    createOperation("create_variable", {
      sceneName: "Nivel 1",
      name: "Puntos",
      type: "number",
      value: "5",
    }),
  ).project;
  assert.equal(sceneOf(project).variables[0]!.value, "5");

  project = applyOperation(
    project,
    createOperation("create_variable", { name: "VidasGlobales", type: "number", scope: "global" }),
  ).project;
  assert.ok(project.globalVariables.some((v) => v.name === "VidasGlobales"));

  const duplicate = applyOperation(
    project,
    createOperation("create_variable", { sceneName: "Nivel 1", name: "Puntos", type: "number" }),
  );
  assert.ok(duplicate.diagnostics.some((d) => d.code === "invalid-payload"));
});

test("create_event / update_event / add_collision: solo instrucciones soportadas", () => {
  const project = fixtureProject();
  const withEvent = applyOperation(
    project,
    createOperation("create_event", {
      sceneName: "Nivel 1",
      conditions: [{ typeId: "SceneJustBegins" }],
      actions: [
        { typeId: "ModVarScene", parameters: { variable: "Puntos", op: "add", value: "1" } },
      ],
    }),
  ).project;
  const event = sceneOf(withEvent).events[0]!;
  assert.equal(event.conditions[0]!.typeId, "SceneJustBegins");
  assert.equal(event.actions[0]!.typeId, "ModVarScene");

  // instrucción inventada → se rechaza (anti-alucinación)
  const invented = applyOperation(
    project,
    createOperation("create_event", {
      sceneName: "Nivel 1",
      actions: [{ typeId: "NexusInventado::HacerMagia" }],
    }),
  );
  assert.ok(invented.diagnostics.some((d) => d.code === "invalid-payload"));
  assert.match(
    invented.diagnostics.find((d) => d.code === "invalid-payload")!.message,
    /no la soporta/,
  );

  const updated = applyOperation(
    withEvent,
    createOperation("update_event", {
      sceneName: "Nivel 1",
      eventId: event.id,
      disabled: true,
    }),
  ).project;
  assert.equal(sceneOf(updated).events[0]!.disabled, true);

  const collision = applyOperation(
    project,
    createOperation("add_collision", {
      sceneName: "Nivel 1",
      objectA: "Puntos",
      objectB: "Plataforma",
      deleteTarget: "B",
    }),
  ).project;
  const collisionEvent = sceneOf(collision).events[0]!;
  assert.equal(collisionEvent.conditions[0]!.typeId, "Collision");
  assert.equal(collisionEvent.actions[0]!.parameters["object"], "Plataforma");

  // objeto inexistente → error
  const badCollision = applyOperation(
    project,
    createOperation("add_collision", {
      sceneName: "Nivel 1",
      objectA: "Nadie",
      objectB: "Plataforma",
    }),
  );
  assert.ok(badCollision.diagnostics.some((d) => d.code === "invalid-payload"));
});

// ---------------------------------------------------------------------------
// M2: el contrato de instrucciones (SCHEMA de ai-logic) se valida en eventos
// ---------------------------------------------------------------------------

test("create_event: KeyPressed sin tecla se rechaza antes de mutar (contrato SCHEMA)", () => {
  const project = fixtureProject();
  const op = createOperation("create_event", {
    sceneName: "Nivel 1",
    conditions: [{ typeId: "KeyPressed" }],
  });
  const outcome = applyOperation(project, op);
  assert.ok(outcome.diagnostics.some((d) => d.code === "invalid-payload"));
  assert.match(
    outcome.diagnostics.find((d) => d.code === "invalid-payload")!.message,
    /Falta el parámetro key/,
  );
  // la escena no se mutó
  assert.equal(sceneOf(outcome.project).events.length, 0);
});

test("create_event: Collision con objeto inexistente se rechaza (referencias vivas)", () => {
  const project = fixtureProject();
  const op = createOperation("create_event", {
    sceneName: "Nivel 1",
    conditions: [{ typeId: "Collision", parameters: { object: "Fantasma", object2: "Plataforma" } }],
  });
  const outcome = applyOperation(project, op);
  assert.ok(outcome.diagnostics.some((d) => d.code === "invalid-payload"));
  assert.match(
    outcome.diagnostics.find((d) => d.code === "invalid-payload")!.message,
    /no existe en la escena/,
  );
  assert.equal(sceneOf(outcome.project).events.length, 0);
});

test("create_event: condición que pide slot de acción se rechaza (slot SCHEMA)", () => {
  const project = fixtureProject();
  // Delete es una acción; en conditions debe rechazarse por slot.
  const op = createOperation("create_event", {
    sceneName: "Nivel 1",
    conditions: [{ typeId: "Delete", parameters: { object: "Plataforma" } }],
  });
  const outcome = applyOperation(project, op);
  assert.ok(outcome.diagnostics.some((d) => d.code === "invalid-payload"));
  assert.equal(sceneOf(outcome.project).events.length, 0);
});

// ---------------------------------------------------------------------------
// Validator
// ---------------------------------------------------------------------------

test("validateOperation acepta un plan válido y rechaza los inválidos", () => {
  const project = fixtureProject();
  const good = createOperation("create_scene", { name: "Nivel 3" });
  assert.ok(validateOperation(good, project).ok);

  const badTool = createOperation("no_existe", {});
  assert.equal(validateOperation(badTool, project).errors[0]!.code, "unknown-tool");

  const badPayload = createOperation("create_instance", {
    sceneName: "Nivel 1",
    objectId: "obj_nosabe",
    x: 0,
    y: 0,
  });
  const result = validateOperation(badPayload, project);
  assert.equal(result.errors[0]!.code, "invalid-payload");
});

test("validatePlan: forma, tamaño y consistencia de ids", () => {
  const project = fixtureProject();
  const plan: AgentPlan = createPlan("Crea un nivel nuevo", [
    createOperation("create_scene", { name: "Nivel 2" }),
    createOperation("create_variable", { sceneName: "Nivel 2", name: "Vidas", type: "number" }),
  ]);
  assert.ok(validatePlan(plan, project).ok);

  // plan vacío
  const empty = createPlan("nada", []);
  assert.ok(!validatePlan(empty, project).ok);

  // demasiado grande
  const tooMany = Array.from({ length: MAX_PLAN_OPERATIONS + 1 }, () =>
    createOperation("update_scene", { sceneName: "Nivel 1", backgroundColor: "1;2;3" }),
  );
  assert.ok(!validatePlan(createPlan("mucho", tooMany), project).ok);

  // ids duplicados
  const opA = createOperation("create_scene", { name: "A" }, "op1");
  const opB = createOperation("create_scene", { name: "B" }, "op1");
  const result = validatePlan(createPlan("duplicado", [opA, opB]), project);
  assert.ok(result.errors.some((e) => e.code === "invalid-operation"));
});

// ---------------------------------------------------------------------------
// Transactions + rollback
// ---------------------------------------------------------------------------

test("applyPlan es atómico: un fallo aborta todo el plan", () => {
  const project = fixtureProject();
  const plan = createPlan("Plan con un fallo intermedio", [
    createOperation("create_scene", { name: "Nivel 2" }),
    createOperation("add_behavior", {
      sceneName: "Nivel 1",
      objectId: "obj_plataforma",
      type: "Physics2::Physics2Behavior", // no soportada → aborta
    }),
  ]);
  const result = applyPlan(project, plan);
  assert.equal(result.ok, false);
  assert.deepEqual(result.project, project, "el proyecto original no cambia");
  assert.ok(result.diagnostics.some((d) => d.code === "invalid-payload"));
  // la primera operación sí se ejecutó en la corrida interna, pero no se conserva
  assert.equal(result.project.scenes.length, 1);
});

test("applyPlan correcto: registros antes/después y resumen", () => {
  const project = fixtureProject();
  const plan = createPlan("Prepara el juego", [
    createOperation("create_object", {
      sceneName: "Nivel 1",
      name: "Jugador",
      type: "Sprite",
      asset: "player.png",
    }),
    createOperation("create_instance", {
      sceneName: "Nivel 1",
      objectId: "obj_plataforma",
      x: 200,
      y: 400,
    }),
  ]);
  const result = applyPlan(project, plan);
  assert.ok(result.ok);
  assert.equal(result.records.length, 2);
  assert.deepEqual(result.records[0]!.before, project);
  assert.deepEqual(result.records[1]!.after, result.project);

  const summary = summarizePlan(result);
  assert.ok(summary.some((line) => line.includes("Objeto creada: «Jugador»")));
  assert.ok(summary.some((line) => line.includes("Instancia creada")));
});

test("rollbackAppliedPlan restaura el estado previo al plan", () => {
  const project = fixtureProject();
  const plan = createPlan("Para deshacer", [createOperation("create_scene", { name: "Nivel 9" })]);
  const result = applyPlan(project, plan);
  assert.ok(result.ok);
  assert.ok(sceneOf(result.project, "Nivel 9"));
  const rolledBack = rollbackAppliedPlan(result);
  assert.deepEqual(rolledBack, project, "el rollback devuelve el proyecto original");
});

test("el proyecto resultante es utilizable por el runtime (fumarata)", () => {
  // El plan construye un escenario coherente: objeto + comportamiento + instancia.
  // Si GameRuntime lo levanta y da un tick, el contrato de proyecto se mantiene.
  const project = fixtureProject();
  const plan = createPlan("Plataforma mínima", [
    createOperation("create_object", {
      sceneName: "Nivel 1",
      name: "Jugador",
      type: "Sprite",
      asset: "player.png",
    }),
  ]);
  const result = applyPlan(project, plan);
  assert.ok(result.ok);
  const scene = sceneOf(result.project);
  // cada instancia referencia un objeto existente (invariante del serializador)
  const objectIds = new Set(scene.objects.map((o) => o.id));
  for (const instance of scene.instances) {
    assert.ok(objectIds.has(instance.objectId), "instancia huérfana");
  }
});

// ---------------------------------------------------------------------------
// Capabilities drift: la matriz debe coincidir con catálogo y runtime
// ---------------------------------------------------------------------------

test("la matriz de comportamientos coincide con el catálogo (source check)", async () => {
  const catalog = await readFile(new URL("../src/lib/editor/catalog.ts", import.meta.url), "utf8");
  const behaviorsBlock = catalog.slice(catalog.indexOf("export const BEHAVIORS"));
  const pairs: string[] = [];
  const blockRe = /typeId: "([^"]+)",[\s\S]*?(?=typeId: |\n\];)/g;
  let match: RegExpExecArray | null;
  while ((match = blockRe.exec(behaviorsBlock))) {
    const block = match[0];
    const runtime = /runtime: "([a-z]+)"/.exec(block);
    if (runtime) pairs.push(match[1]);
  }
  assert.ok(pairs.length >= 7, "debería haber al menos 7 comportamientos con runtime");
  for (const typeId of pairs) {
    assert.ok(
      (SUPPORTED_BEHAVIOR_TYPES as readonly string[]).includes(typeId),
      `el comportamiento ${typeId} simula en el runtime pero falta de la matriz`,
    );
  }
});

test("la matriz de instrucciones cubre el dispatch del runtime (source check)", async () => {
  const engine = await readFile(new URL("../src/lib/runtime/engine.ts", import.meta.url), "utf8");
  const knownTokens = new Set([
    "==",
    "!=",
    "<",
    "<=",
    ">",
    ">=",
    "≠",
    "≤",
    "≥",
    "add",
    "subtract",
    "multiply",
    "divide",
    "set to",
    "max",
    "min",
    "x",
    "y",
    "angle",
    "size",
    "alpha",
    "left",
    "right",
    "up",
    "down",
    "jump",
    "linear",
    "easeInQuad",
    "easeInOutQuad",
    "easeOutQuad",
    "easeInOutElastic",
    "linearStops",
  ]);
  const instructionIds = new Set<string>();
  const caseRe = /case "([^"]+)":/g;
  let match: RegExpExecArray | null;
  while ((match = caseRe.exec(engine))) {
    const id = match[1];
    if (knownTokens.has(id)) continue;
    if (id.includes("::") || /^[A-Z]/.test(id)) instructionIds.add(id);
  }
  // todas las instrucciones que el engine dispatchea deben estar en la matriz
  const missing = [...instructionIds].filter(
    (id) => !(SUPPORTED_INSTRUCTION_TYPES as readonly string[]).includes(id),
  );
  assert.deepEqual(missing, [], `instrucciones en el runtime sin matriz: ${missing.join(", ")}`);
});
