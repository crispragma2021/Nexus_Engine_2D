// Deterministic tests for the agent session (block 2): session memory,
// autonomy modes (Supervised default), snapshot restore, the plan →
// validate → atomic apply pipeline, and the deterministic instruction
// planner. Runs under plain Node (node --experimental-strip-types).

import test from "node:test";
import assert from "node:assert/strict";

import {
  createAgentSession,
  evaluateAndApplyPlan,
  isAgentSessionState,
  makeAuditEntry,
  planIsDestructive,
  planRequiresApproval,
  restoreAgentBaseline,
  setAgentMode,
  undoLastAgentPlan,
  withAuditEntry,
  MAX_AUDIT_ENTRIES,
} from "../src/lib/agent/session.ts";
import { createOperation, createPlan } from "../src/lib/agent/operations.ts";
import { planFromInstruction } from "../src/lib/agent/planner.ts";
import type { GDProject } from "../src/lib/editor/types.ts";

// ---------------------------------------------------------------------------
// Fixture (same shape as agent-operations.test.ts)
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
            id: "obj_jugador",
            name: "Jugador",
            type: "Sprite",
            asset: "player.png",
            animations: [
              {
                name: "Animación 1",
                loops: true,
                timeBetweenFrames: 1,
                images: [
                  {
                    image: "player.png",
                    originX: 0,
                    originY: 0,
                    centerX: 16,
                    centerY: 16,
                    opacity: 255,
                  },
                ],
                points: [],
              },
            ],
            behaviors: [],
            effects: [],
            variables: [],
          },
          {
            id: "obj_moneda",
            name: "Moneda",
            type: "Sprite",
            asset: "player.png",
            animations: [
              {
                name: "Animación 1",
                loops: true,
                timeBetweenFrames: 1,
                images: [
                  {
                    image: "player.png",
                    originX: 0,
                    originY: 0,
                    centerX: 16,
                    centerY: 16,
                    opacity: 255,
                  },
                ],
                points: [],
              },
            ],
            behaviors: [],
            effects: [],
            variables: [],
          },
          {
            id: "obj_texto_viejo",
            name: "TextoViejo",
            type: "TextObject::Text",
            text: "viejo",
            textColor: "#ffffff",
            textSize: 16,
            fontFamily: "Arial",
            behaviors: [],
            effects: [],
            variables: [],
          },
        ],
        instances: [
          {
            id: "inst_jugador",
            objectId: "obj_jugador",
            x: 10,
            y: 20,
            angle: 0,
            customSize: false,
            width: 64,
            height: 64,
            zOrder: 0,
            layer: "Base layer",
            locked: false,
            hiddenAtStart: false,
            variables: [],
            effects: [],
          },
          {
            id: "inst_moneda",
            objectId: "obj_moneda",
            x: 300,
            y: 400,
            angle: 0,
            customSize: false,
            width: 32,
            height: 32,
            zOrder: 1,
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
      { name: "player.png", kind: "image", file: "player.png", url: "data:image/png;base64,x" },
    ],
    globalVariables: [],
    extensions: [],
    externalEvents: [],
    externalLayouts: [],
  };
}

const CONTEXT = {
  project: fixtureProject(),
  activeSceneName: "Nivel 1",
};

// ---------------------------------------------------------------------------
// Session defaults + guard
// ---------------------------------------------------------------------------

test("createAgentSession: Supervised por defecto, snapshot, baseline y audit inicial", () => {
  const project = fixtureProject();
  const session = createAgentSession(project);
  assert.equal(session.mode, "Supervised");
  assert.equal(session.snapshotMode, "snapshot");
  assert.equal(session.baseline, project);
  assert.deepEqual(session.applied, []);
  assert.equal(session.audit.length, 1);
  assert.equal(session.audit[0]!.kind, "session-start");
  assert.ok(isAgentSessionState(session));
});

test("isAgentSessionState rechaza estado inválido", () => {
  assert.equal(isAgentSessionState(null), false);
  assert.equal(isAgentSessionState({}), false);
  assert.equal(
    isAgentSessionState({ ...createAgentSession(fixtureProject()), mode: "Turbo" }),
    false,
  );
});

// ---------------------------------------------------------------------------
// Autonomy gating
// ---------------------------------------------------------------------------

test("planRequiresApproval: Supervised siempre pide aprobación", () => {
  const safe = createPlan("seguro", [
    createOperation("create_variable", { sceneName: "Nivel 1", name: "puntos", type: "number" }),
  ]);
  assert.equal(planRequiresApproval(safe, "Supervised"), true);
});

test("planRequiresApproval: SemiAutonomous aplica seguro y pide el destructivo", () => {
  const safe = createPlan("seguro", [
    createOperation("create_variable", { sceneName: "Nivel 1", name: "puntos", type: "number" }),
  ]);
  const destructive = createPlan("borra", [
    createOperation("delete_object", { sceneName: "Nivel 1", objectId: "obj_texto_viejo" }),
  ]);
  assert.equal(planIsDestructive(destructive), true);
  assert.equal(planIsDestructive(safe), false);
  assert.equal(planRequiresApproval(safe, "SemiAutonomous"), false);
  assert.equal(planRequiresApproval(destructive, "SemiAutonomous"), true);
});

test("planRequiresApproval: Autonomous no pide aprobación (pero no publica)", () => {
  const destructive = createPlan("borra", [
    createOperation("delete_object", { sceneName: "Nivel 1", objectId: "obj_texto_viejo" }),
  ]);
  assert.equal(planRequiresApproval(destructive, "Autonomous"), false);
});

test("setAgentMode registra en el audit y no duplica si no cambia", () => {
  let session = createAgentSession(fixtureProject());
  const before = session.audit.length;
  session = setAgentMode(session, "SemiAutonomous");
  assert.equal(session.mode, "SemiAutonomous");
  assert.equal(session.audit.length, before + 1);
  assert.equal(session.audit[session.audit.length - 1]!.kind, "mode");
  const unchanged = setAgentMode(session, "SemiAutonomous");
  assert.equal(unchanged, session);
});

// ---------------------------------------------------------------------------
// evaluateAndApplyPlan: validate → atomic apply → audit
// ---------------------------------------------------------------------------

test("evaluateAndApplyPlan aplica un plan válido y lo registra", () => {
  const project = fixtureProject();
  const session = createAgentSession(project);
  const plan = createPlan("Nueva escena", [createOperation("create_scene", { name: "Nivel 2" })]);
  const { session: next, result } = evaluateAndApplyPlan(session, project, plan);
  assert.equal(result.ok, true);
  assert.ok(result.project.scenes.some((scene) => scene.name === "Nivel 2"));
  assert.equal(next.applied.length, 1);
  assert.equal(next.audit[next.audit.length - 1]!.kind, "applied");
  assert.equal(next.baseline, project); // el baseline no toca
});

test("evaluateAndApplyPlan rechaza un plan inválido sin tocar el proyecto", () => {
  const project = fixtureProject();
  const session = createAgentSession(project);
  const plan = createPlan("malo", [createOperation("no_existe_esta_herramienta", { a: 1 })]);
  const { session: next, result } = evaluateAndApplyPlan(session, project, plan);
  assert.equal(result.ok, false);
  assert.equal(result.project, project); // referencia idéntica
  assert.equal(next.applied.length, 0);
  assert.equal(next.audit[next.audit.length - 1]!.kind, "rejected");
  assert.ok(result.diagnostics.some((diagnostic) => diagnostic.code === "unknown-tool"));
});

test("evaluateAndApplyPlan: plan multi-operación que referencia lo que crea", () => {
  const project = fixtureProject();
  const session = createAgentSession(project);
  const plan = createPlan("escena + variable", [
    createOperation("create_scene", { name: "Nivel 2" }),
    createOperation("create_variable", {
      sceneName: "Nivel 2",
      name: "vidas",
      type: "number",
      value: "3",
    }),
  ]);
  const { result } = evaluateAndApplyPlan(session, project, plan);
  assert.equal(result.ok, true);
  const scene = result.project.scenes.find((entry) => entry.name === "Nivel 2")!;
  assert.equal(scene.variables.length, 1);
  assert.equal(scene.variables[0]!.name, "vidas");
});

test("evaluateAndApplyPlan: aborto atómico (nada del plan queda aplicado)", () => {
  const project = fixtureProject();
  const session = createAgentSession(project);
  const plan = createPlan("mixto", [
    createOperation("create_variable", {
      sceneName: "Nivel 1",
      name: "ok",
      type: "number",
    }),
    createOperation("delete_object", { sceneName: "Nivel 1", objectId: "obj_inexistente" }),
  ]);
  const { result } = evaluateAndApplyPlan(session, project, plan);
  assert.equal(result.ok, false);
  assert.equal(result.project, project); // nada se aplicó
  const scene = project.scenes[0]!;
  assert.equal(scene.variables.length, 0);
});

// ---------------------------------------------------------------------------
// Undo / restore (snapshots)
// ---------------------------------------------------------------------------

test("undoLastAgentPlan restaura el snapshot del último plan", () => {
  const project = fixtureProject();
  let session = createAgentSession(project);
  const planA = createPlan("A", [
    createOperation("create_variable", { sceneName: "Nivel 1", name: "a", type: "number" }),
  ]);
  session = evaluateAndApplyPlan(session, project, planA).session;
  const afterA = evaluateAndApplyPlan(session, project, planA).result.project;
  const planB = createPlan("B", [
    createOperation("create_variable", { sceneName: "Nivel 1", name: "b", type: "number" }),
  ]);
  const second = evaluateAndApplyPlan(session, afterA, planB);
  session = second.session;
  assert.equal(second.result.project.scenes[0]!.variables.length, 2);

  const undone = undoLastAgentPlan(session);
  assert.ok(undone.project);
  assert.equal(undone.project!.scenes[0]!.variables.length, 1);
  assert.equal(session.applied.length, 2);
  assert.equal(undone.session.applied.length, 1);
  assert.equal(undone.session.audit[undone.session.audit.length - 1]!.kind, "undone");
});

test("undoLastAgentPlan sin nada aplicado no hace nada", () => {
  const session = createAgentSession(fixtureProject());
  const { session: next, project } = undoLastAgentPlan(session);
  assert.equal(project, null);
  assert.equal(next, session);
});

test("restoreAgentBaseline devuelve al proyecto de inicio de sesión", () => {
  const project = fixtureProject();
  let session = createAgentSession(project);
  const plan = createPlan("cambios", [
    createOperation("create_variable", { sceneName: "Nivel 1", name: "x", type: "number" }),
    createOperation("create_scene", { name: "Nivel 9" }),
  ]);
  const applied = evaluateAndApplyPlan(session, project, plan);
  session = applied.session;
  assert.equal(applied.result.project.scenes.length, 2);

  const restored = restoreAgentBaseline(session);
  assert.ok(restored.project);
  assert.deepEqual(
    restored.project!.scenes.map((scene) => scene.name),
    ["Nivel 1"],
  );
  assert.equal(restored.session.applied.length, 0);
  assert.equal(restored.session.audit[restored.session.audit.length - 1]!.kind, "restored");
});

test("el audit log es acotado (MAX_AUDIT_ENTRIES)", () => {
  let session = createAgentSession(fixtureProject());
  for (let i = 0; i < MAX_AUDIT_ENTRIES + 50; i += 1) {
    session = withAuditEntry(session, makeAuditEntry("applied", `cambio ${i}`));
  }
  assert.equal(session.audit.length, MAX_AUDIT_ENTRIES);
  assert.equal(session.audit[session.audit.length - 1]!.label, `cambio ${MAX_AUDIT_ENTRIES + 49}`);
});

// ---------------------------------------------------------------------------
// Planner determinista
// ---------------------------------------------------------------------------

test("planner: crea una escena con nombre", () => {
  const { plan } = planFromInstruction("crea la escena Nivel 2", CONTEXT);
  assert.ok(plan);
  assert.equal(plan!.operations.length, 1);
  assert.equal(plan!.operations[0]!.type, "create_scene");
  assert.deepEqual(plan!.operations[0]!.payload, { name: "Nivel 2" });
});

test("planner: escena + variable en la misma instrucción (referencia secuencial)", () => {
  const { plan } = planFromInstruction(
    "crea la escena Nivel 2 y añade la variable puntos",
    CONTEXT,
  );
  assert.ok(plan);
  assert.equal(plan!.operations.length, 2);
  assert.equal(plan!.operations[0]!.type, "create_scene");
  const variable = plan!.operations[1]!;
  assert.equal(variable.type, "create_variable");
  assert.deepEqual(variable.payload, { sceneName: "Nivel 2", name: "puntos", type: "number" });
  assert.equal(plan!.sceneName, "Nivel 2");
});

test("planner: instancia con posición explícita", () => {
  const { plan } = planFromInstruction("añade una instancia de Moneda en 200,100", CONTEXT);
  assert.ok(plan);
  const operation = plan!.operations[0]!;
  assert.equal(operation.type, "create_instance");
  const payload = operation.payload as { objectId: string; x: number; y: number };
  assert.equal(payload.objectId, "obj_moneda");
  assert.equal(payload.x, 200);
  assert.equal(payload.y, 100);
});

test("planner: comportamiento con alias", () => {
  const { plan } = planFromInstruction("añade el comportamiento plataforma a Jugador", CONTEXT);
  assert.ok(plan);
  const operation = plan!.operations[0]!;
  assert.equal(operation.type, "add_behavior");
  const payload = operation.payload as { objectId: string; type: string };
  assert.equal(payload.objectId, "obj_jugador");
  assert.equal(payload.type, "PlatformBehavior::PlatformBehavior");
});

test("planner: variable booleana global", () => {
  const { plan } = planFromInstruction("crea la variable vidas booleana global", CONTEXT);
  assert.ok(plan);
  const operation = plan!.operations[0]!;
  assert.equal(operation.type, "create_variable");
  assert.deepEqual(operation.payload, {
    sceneName: "Nivel 1",
    name: "vidas",
    type: "boolean",
    scope: "global",
  });
});

test("planner: colisión con destrucción del objetivo", () => {
  const { plan } = planFromInstruction(
    "cuando Jugador colisiona con Moneda, destruye Moneda",
    CONTEXT,
  );
  assert.ok(plan);
  const operation = plan!.operations[0]!;
  assert.equal(operation.type, "add_collision");
  const payload = operation.payload as {
    objectA: string;
    objectB: string;
    deleteTarget?: string;
  };
  assert.equal(payload.objectA, "Jugador");
  assert.equal(payload.objectB, "Moneda");
  assert.equal(payload.deleteTarget, "B");
});

test("planner: mover instancia a coordenadas absolutas", () => {
  const { plan } = planFromInstruction("mueve Moneda a 120,60", CONTEXT);
  assert.ok(plan);
  const operation = plan!.operations[0]!;
  assert.equal(operation.type, "move_instance");
  const payload = operation.payload as { instanceId: string; x: number; y: number };
  assert.equal(payload.instanceId, "inst_moneda");
  assert.equal(payload.x, 120);
  assert.equal(payload.y, 60);
});

test("planner: eliminar objeto (destructivo)", () => {
  const { plan } = planFromInstruction("elimina el objeto TextoViejo", CONTEXT);
  assert.ok(plan);
  const operation = plan!.operations[0]!;
  assert.equal(operation.type, "delete_object");
  assert.equal((operation.payload as { objectId: string }).objectId, "obj_texto_viejo");
  assert.equal(planIsDestructive(plan!), true);
});

test("planner: evento simple via compilador determinista", () => {
  const { plan } = planFromInstruction("al presionar espacio, mueve Jugador a la derecha", CONTEXT);
  assert.ok(plan, "debe generar un plan de evento");
  const operation = plan!.operations[0]!;
  assert.equal(operation.type, "create_event");
  const payload = operation.payload as {
    conditions?: { typeId: string }[];
    actions?: { typeId: string }[];
  };
  assert.ok(payload.conditions?.some((instruction) => instruction.typeId === "KeyPressed"));
  assert.ok(payload.actions?.some((instruction) => instruction.typeId === "ChangeX"));
});

test("planner: objeto inexistente → razón honesta, sin plan", () => {
  const { plan, reason } = planFromInstruction("añade una instancia de Dragón en 10,10", CONTEXT);
  assert.equal(plan, null);
  assert.match(reason ?? "", /Dragón/);
});

test("planner: instrucción ininteligible → razón honesta, sin plan", () => {
  const { plan, reason } = planFromInstruction("hola mundo muy bonito", CONTEXT);
  assert.equal(plan, null);
  assert.ok(reason && reason.length > 10);
});

test("planner: texto vacío/corto → razón", () => {
  assert.equal(planFromInstruction("", CONTEXT).plan, null);
  assert.equal(planFromInstruction("ok", CONTEXT).plan, null);
});

test("planner: los planes del planner pasan validatePlan y se aplican", () => {
  const project = fixtureProject();
  const session = createAgentSession(project);
  const prompts = [
    "crea la escena Nivel 2 y añade la variable puntos",
    "añade una instancia de Moneda en 200,100",
    "crea la variable vidas booleana global",
  ];
  let current = project;
  for (const prompt of prompts) {
    const { plan } = planFromInstruction(prompt, { project: current, activeSceneName: "Nivel 1" });
    assert.ok(plan, `plan para: ${prompt}`);
    const { result } = evaluateAndApplyPlan(session, current, plan!);
    assert.equal(
      result.ok,
      true,
      `aplicado: ${prompt} (${result.diagnostics.map((d) => d.message).join("; ")})`,
    );
    current = result.project;
  }
  assert.ok(current.scenes.some((scene) => scene.name === "Nivel 2"));
});
