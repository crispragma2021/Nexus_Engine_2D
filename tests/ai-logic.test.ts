import test from "node:test";
import assert from "node:assert/strict";

import {
  AiLogicValidationError,
  compileIntentToEvents,
  supportedAiLogicInstructions,
  validateGeneratedEvents,
} from "../src/lib/editor/ai-logic.ts";
import type { GDEvent } from "../src/lib/editor/types.ts";

const context = {
  objectNames: ["Jugador", "Moneda", "Enemigo", "Boton"],
  sceneNames: ["Nivel1", "GameOver"],
  audioResources: ["coin.wav", "hit.ogg"],
  activeLayer: "Base layer",
};

test("compiles a collision intention into ordinary editable instructions", () => {
  const [event] = compileIntentToEvents(
    "Cuando Jugador colisiona con Moneda, elimina Moneda",
    context,
  );

  assert.ok(event);
  assert.equal(event.kind, "standard");
  assert.deepEqual(event.conditions[0]?.parameters, {
    object: "Jugador",
    object2: "Moneda",
    ignoreTouchingEdges: "no",
  });
  assert.equal(event.conditions[0]?.typeId, "Collision");
  assert.equal(event.actions[0]?.typeId, "Delete");
  assert.equal(event.actions[0]?.parameters.object, "Moneda");
  assert.deepEqual(event.subEvents, []);
});

test("compiles keyboard movement with catalog-compatible parameters", () => {
  const [event] = compileIntentToEvents(
    "Al presionar la tecla espacio, mueve Jugador 24 píxeles a la derecha",
    context,
  );

  assert.equal(event?.conditions[0]?.typeId, "KeyPressed");
  assert.equal(event?.conditions[0]?.parameters.key, "Space");
  assert.equal(event?.actions[0]?.typeId, "ChangeX");
  assert.deepEqual(event?.actions[0]?.parameters, {
    object: "Jugador",
    op: "add",
    value: "24",
  });
});

test("compiles timers, creation coordinates and the active layer", () => {
  const [event] = compileIntentToEvents("Cada 1,5 segundos crea Enemigo en (640, 240)", context);

  assert.equal(event?.conditions[0]?.typeId, "TimerRepeated");
  assert.equal(event?.conditions[0]?.parameters.seconds, "1.5");
  assert.deepEqual(event?.actions[0]?.parameters, {
    object: "Enemigo",
    x: "640",
    y: "240",
    layer: "Base layer",
  });
});

test("compiles pointer and audio intentions without opaque AI nodes", () => {
  const [event] = compileIntentToEvents(
    "Al hacer clic en Boton reproduce el audio coin.wav",
    context,
  );

  assert.deepEqual(
    event?.conditions.map((item) => item.typeId),
    ["SourisSurObjet", "SourisBouton"],
  );
  assert.equal(event?.actions[0]?.typeId, "PlaySound");
  assert.equal(event?.actions[0]?.parameters.file, "coin.wav");
  assert.equal(event?.actions[0]?.parameters.volume, "100");
});

test("compiles scene changes and variable increments", () => {
  const [sceneEvent] = compileIntentToEvents("Al comenzar cambia a la escena GameOver", context);
  assert.equal(sceneEvent?.conditions[0]?.typeId, "SceneJustBegins");
  assert.equal(sceneEvent?.actions[0]?.typeId, "ChangeScene");
  assert.equal(sceneEvent?.actions[0]?.parameters.scene, "GameOver");

  const [variableEvent] = compileIntentToEvents(
    "Cuando Jugador colisiona con Moneda, añade 1 a la variable puntos",
    context,
  );
  assert.equal(variableEvent?.actions[0]?.typeId, "ModVarScene");
  assert.deepEqual(variableEvent?.actions[0]?.parameters, {
    variable: "puntos",
    op: "add",
    value: "1",
  });
});

test("rejects incomplete and unsafe intentions with actionable errors", () => {
  assert.throws(
    () => compileIntentToEvents("Al comenzar elimina Intruso", context),
    /Indica qué objeto debe eliminarse/,
  );
  assert.throws(
    () => compileIntentToEvents("mueve Jugador a la derecha", context),
    /No pude identificar cuándo/,
  );
  assert.throws(
    () => compileIntentToEvents(`Al comenzar\u0000 elimina Moneda`, context),
    AiLogicValidationError,
  );
});

test("validates catalog ids, parameter allowlists and project references", () => {
  const event: GDEvent = {
    id: "ev_test",
    kind: "standard",
    conditions: [
      { id: "in_condition", typeId: "SceneJustBegins", inverted: false, parameters: {} },
    ],
    actions: [
      {
        id: "in_action",
        typeId: "Delete",
        inverted: false,
        parameters: { object: "Intruso" },
      },
    ],
    subEvents: [],
    collapsed: false,
  };
  assert.throws(() => validateGeneratedEvents([event], context), /no existe/);

  const unknown = structuredClone(event);
  unknown.actions[0]!.typeId = "RunArbitraryCode";
  assert.throws(() => validateGeneratedEvents([unknown], context), /no permitida/);

  const extra = structuredClone(event);
  extra.actions[0]!.parameters = { object: "Moneda", script: "alert(1)" };
  assert.throws(() => validateGeneratedEvents([extra], context), /Parámetro no permitido/);
});

test("advertises only instructions represented by normal visual events", () => {
  const supported = supportedAiLogicInstructions();
  assert.ok(supported.includes("Collision"));
  assert.ok(supported.includes("Create"));
  assert.ok(supported.includes("PlaySound"));
  assert.ok(!supported.includes("eval"));
});
