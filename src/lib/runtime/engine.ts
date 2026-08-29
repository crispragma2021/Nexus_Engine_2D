// GameRuntime: the Nexus Engine runtime. It interprets the visual event tree
// produced by the editor and simulates one scene per frame — the equivalent of
// GDJS, written in plain TypeScript against this project's data model.
//
// Design rules (see docs/skills/nexus-gdevelop-parity.md):
//  • one entry point per frame: `step(deltaSeconds)`
//  • instructions dispatch on their catalog `typeId` (no eval of user code)
//  • state is flat and serializable so the renderer stays dumb

import type {
  GDEvent,
  GDInstruction,
  GDObjectDef,
  GDProject,
  GDRuntimeScene,
  GDScene,
  GDVariable,
} from "@/lib/editor/types";
import { asNumber, evalNumber, evalString, type EvalContext } from "./expression";
import { PHYSICS, type RTLayer, type RTObject, type RuntimeState } from "./types";

type PickMap = Record<string, RTObject[]>;

let runtimeIdCounter = 0;
const nextId = () => `rt_${++runtimeIdCounter}`;

/** A real image resource is optional in tests: the renderer falls back to a box. */
export interface RuntimeOptions {
  /** called when an action requests a scene change */
  onChangeScene?: (scene: string) => void;
  /** called when a sound should play */
  onPlaySound?: (file: string, volume: number, loop: boolean) => void;
  /** called when a sound channel should stop */
  onStopSound?: (channel: number) => void;
  /** lets `ChangeScene` load another scene of the same project */
  resolveScene?: (name: string) => GDRuntimeScene | null;
}

export class GameRuntime {
  state: RuntimeState;
  width: number;
  height: number;

  private scene: GDRuntimeScene;
  private readonly project: GDProject | null;
  private readonly options: RuntimeOptions;
  private readonly onceFlags = new Set<string>();
  private readonly keys = new Set<string>();
  private readonly keysReleased = new Set<string>();
  private readonly keysPressedOnce = new Set<string>();
  private readonly mouse = new Set<string>();
  private pointer = { x: 0, y: 0 };

  constructor(
    scene: GDRuntimeScene,
    options: RuntimeOptions = {},
    project: GDProject | null = null,
  ) {
    this.options = options;
    this.project = project;
    this.scene = scene;
    this.width = scene.windowWidth;
    this.height = scene.windowHeight;
    this.state = this.createState();
  }

  /** Convenience for the preview: run one scene of a whole project. */
  static forProject(project: GDProject, scene: GDScene, options: RuntimeOptions = {}): GameRuntime {
    return new GameRuntime(toRuntimeSceneFromProject(project, scene), options, project);
  }

  // ---------------------------------------------------------------- lifecycle

  private createState(): RuntimeState {
    const layers: Record<string, RTLayer> = {};
    const baseName = this.scene.layers[0]?.name;
    for (const layer of this.scene.layers) {
      const isBase = layer.name === baseName;
      const follows = !isBase && layer.followBaseLayer !== false;
      layers[layer.name] = {
        name: layer.name,
        visible: layer.visible,
        // A following layer has no camera of its own: the base camera is used.
        cameraX: follows ? 0 : (layer.camera?.x ?? 0),
        cameraY: follows ? 0 : (layer.camera?.y ?? 0),
        cameraZoom: 1,
        opacity: 255,
        followBaseLayer: !isBase && follows,
      };
    }
    const fallbackLayer = this.scene.layers[0]?.name ?? "Base layer";
    if (!layers[fallbackLayer]) {
      layers[fallbackLayer] = {
        name: fallbackLayer,
        visible: true,
        cameraX: 0,
        cameraY: 0,
        cameraZoom: 1,
        opacity: 255,
        followBaseLayer: false,
      };
    }

    const objects = this.scene.instances.map((instance) => {
      const def = this.scene.objects.find((o) => o.id === instance.objectId);
      return this.createRuntimeObject(def, {
        x: instance.x,
        y: instance.y,
        angle: instance.angle,
        zOrder: instance.zOrder,
        layer: instance.layer,
        width: instance.width,
        height: instance.height,
        hidden: instance.hiddenAtStart ?? false,
        effects: instance.effects,
        variables: [...(def?.variables ?? []), ...(instance.variables ?? [])],
        useInstanceSize: true,
      });
    });

    return {
      objects,
      layers,
      variables: flattenVariables(this.scene.sceneVariables),
      globalVariables: flattenVariables(this.scene.globalVariables),
      timers: {},
      pausedTimers: {},
      camera: { x: 0, y: 0 },
      time: 0,
      timeScale: 1,
      frame: 0,
      sceneName: this.scene.name,
      logs: [],
      paused: false,
      stats: { objectsCount: objects.length, instructionsCount: 0, eventsCount: 0, frameTimeMs: 0 },
    };
  }

  private createRuntimeObject(
    def: GDObjectDef | undefined,
    patch: {
      x: number;
      y: number;
      angle: number;
      zOrder: number;
      layer: string;
      width: number;
      height: number;
      hidden: boolean;
      effects?: { type: string; name: string; parameters: Record<string, string> }[];
      variables: GDVariable[];
      useInstanceSize: boolean;
    },
  ): RTObject {
    const animations = def?.animations ?? [];
    const first = animations[0];
    const frame = first?.images[0];
    const behaviors = def?.behaviors ?? [];
    const behaviorTypes: Record<string, string> = {};
    const behaviorProps: Record<string, Record<string, string>> = {};
    let platformer: Record<string, string> | null = null;
    for (const behavior of behaviors) {
      behaviorTypes[behavior.name] = behavior.type;
      behaviorProps[behavior.name] = behavior.properties;
      if (behavior.type === "PlatformBehavior::PlatformerObjectBehavior")
        platformer = behavior.properties;
    }
    const healthBehavior = behaviors.find((b) => b.type === "Health::Health");
    const flashBehavior = behaviors.find((b) => b.type === "Flash::Flash");

    const object: RTObject = {
      id: nextId(),
      name: def?.name ?? "Desconocido",
      type: def?.type ?? "Sprite",
      ...(def?.asset ? { asset: def.asset } : {}),
      x: patch.x,
      y: patch.y,
      width: patch.width,
      height: patch.height,
      angle: patch.angle,
      zOrder: patch.zOrder,
      layer: patch.layer,
      opacity: 255,
      hidden: patch.hidden,
      flipX: false,
      flipY: false,
      text: def?.text ?? "",
      textColor: def?.textColor ?? "#FAFAFA",
      textSize: def?.textSize ?? 24,
      bold: def?.bold ?? false,
      ...(def?.fontFamily ? { fontFamily: def.fontFamily } : {}),
      alignment: def?.alignment ?? "left",
      animationIndex: 0,
      animationName: first?.name ?? "",
      timeBetweenFrames: first?.timeBetweenFrames ?? 0,
      animationSpeedScale: 1,
      frameIndex: 0,
      frameTimer: 0,
      behaviors: behaviors.map((b) => b.name),
      behaviorTypes,
      behaviorProps,
      controls: { left: false, right: false, up: false, down: false, jump: false },
      ignoreControls: false,
      onFloor: false,
      jumping: false,
      falling: false,
      vx: 0,
      vy: 0,
      gravity: asNumber(platformer?.["gravity"], PHYSICS.gravity),
      maxFallingSpeed: asNumber(platformer?.["maxFallingSpeed"], PHYSICS.maxFallSpeed),
      friction: asNumber(platformer?.["friction"], PHYSICS.friction),
      health: asNumber(healthBehavior?.properties["health"], 100),
      maxHealth: asNumber(healthBehavior?.properties["maxHealth"], 100),
      flash: {
        active: false,
        elapsed: 0,
        duration: asNumber(flashBehavior?.properties["flashDuration"], 0.2),
        half: asNumber(flashBehavior?.properties["halfTimes"], 0.1),
        hidden: false,
      },
      tweens: {},
      tint: null,
      colorOverlay: null,
      variables: flattenVariables(patch.variables),
      destroyed: false,
    };

    if (frame && !patch.useInstanceSize) {
      object.asset = frame.image;
    } else if (frame) {
      object.asset = frame.image;
    }

    for (const effect of patch.effects ?? []) {
      if (effect.parameters["disabled"] === "yes") continue;
      if (effect.type === "Tint") {
        object.tint = [
          asNumber(effect.parameters["r"], 255),
          asNumber(effect.parameters["g"], 255),
          asNumber(effect.parameters["b"], 255),
        ];
      } else if (effect.type === "ColorOverlay") {
        object.colorOverlay = [
          asNumber(effect.parameters["r"], 255),
          asNumber(effect.parameters["g"], 255),
          asNumber(effect.parameters["b"], 255),
          asNumber(effect.parameters["alpha"], 255),
        ];
      }
    }
    return object;
  }

  reset() {
    this.onceFlags.clear();
    this.keys.clear();
    this.keysReleased.clear();
    this.keysPressedOnce.clear();
    this.mouse.clear();
    this.state = this.createState();
  }

  /** GDevelop reloads the whole scene on ChangeScene. */
  loadScene(name: string): boolean {
    if (!this.project) return false;
    const scene = this.project.scenes.find((s) => s.name === name);
    if (!scene) return false;
    this.scene = toRuntimeSceneFromProject(this.project, scene);
    this.width = this.scene.windowWidth;
    this.height = this.scene.windowHeight;
    const keepGlobals = this.state.globalVariables;
    const keys = new Set(this.keys);
    this.reset();
    this.state.globalVariables = keepGlobals;
    for (const key of keys) this.keys.add(key);
    return true;
  }

  // -------------------------------------------------------------------- input

  pressKey(key: string) {
    const normalized = normalizeKey(key);
    if (!this.keys.has(normalized)) this.keysPressedOnce.add(normalized);
    this.keys.add(normalized);
  }

  releaseKey(key: string) {
    const normalized = normalizeKey(key);
    this.keys.delete(normalized);
    this.keysReleased.add(normalized);
  }

  pressMouse(button = "Left") {
    this.mouse.add(button);
  }

  releaseMouse(button = "Left") {
    this.mouse.delete(button);
  }

  movePointer(x: number, y: number) {
    this.pointer.x = x;
    this.pointer.y = y;
  }

  isKeyPressed(key: string) {
    return this.keys.has(normalizeKey(key));
  }

  // --------------------------------------------------------------------- step

  step(deltaSeconds: number) {
    const startedAt = nowMs();
    const raw = Math.min(deltaSeconds, 1 / 20);
    if (this.state.paused) {
      this.state.frame += 1;
      return;
    }
    const delta = raw * (this.state.timeScale || 1);
    this.state.time += delta;
    this.state.frame += 1;

    for (const name of Object.keys(this.state.timers)) {
      if (this.state.pausedTimers[name]) continue;
      this.state.timers[name] = (this.state.timers[name] ?? 0) + delta;
    }

    this.state.stats.instructionsCount = 0;
    this.state.stats.eventsCount = 0;
    this.runEvents(this.scene.events, {}, delta);
    this.updateAnimations(delta);
    this.updateTweens(delta);
    this.updateFlash(delta);
    this.simulatePhysics(delta);

    const baseLayer = this.state.layers[this.baseLayerName()];
    if (baseLayer) {
      this.state.camera.x = baseLayer.cameraX;
      this.state.camera.y = baseLayer.cameraY;
      this.state.camera.zoom = baseLayer.cameraZoom;
    }

    this.state.objects = this.state.objects.filter((object) => !object.destroyed);
    this.state.stats.objectsCount = this.state.objects.length;
    this.keysReleased.clear();
    this.keysPressedOnce.clear();
    this.state.stats.frameTimeMs = nowMs() - startedAt;
  }

  // ------------------------------------------------------------------- events

  private ctx(picked: PickMap, delta: number): EvalContext {
    return {
      variables: this.state.variables,
      globalVariables: this.state.globalVariables,
      objects: this.state.objects,
      picked,
      timers: this.state.timers,
      time: this.state.time,
      delta,
      camera: this.state.camera,
      pointer: this.pointer,
    };
  }

  private live(name: string): RTObject[] {
    const members = this.groupMembers(name);
    if (members) {
      const out: RTObject[] = [];
      for (const member of members) {
        for (const object of this.state.objects) {
          if (object.name === member && !object.destroyed && !out.includes(object))
            out.push(object);
        }
      }
      return out;
    }
    return this.state.objects.filter((o) => o.name === name && !o.destroyed);
  }

  /** Object groups behave like an object that owns the instances of its members. */
  private groupMembers(name: string): string[] | null {
    const group = this.scene.groups?.find((g) => g.name === name);
    return group ? group.objects : null;
  }

  private pickList(picked: PickMap, name: string): RTObject[] {
    const existing = picked[name];
    if (existing) return existing.filter((o) => !o.destroyed);
    const all = this.live(name);
    picked[name] = all;
    return all;
  }

  private runEvents(events: GDEvent[], inherited: PickMap, delta: number) {
    let previousEventRan: boolean | null = null;

    for (const event of events) {
      if (event.disabled) {
        previousEventRan = null;
        continue;
      }
      if (event.kind === "comment") continue;

      const picked: PickMap = {};
      for (const [key, value] of Object.entries(inherited)) picked[key] = [...value];

      if (event.kind === "group") {
        this.runEvents(event.subEvents, picked, delta);
        previousEventRan = null;
        continue;
      }

      if (event.kind === "else") {
        // "Si no (else)": only runs when the previous sibling event did not run.
        if (previousEventRan !== false) {
          previousEventRan = null;
          continue;
        }
        previousEventRan = true;
        for (const action of event.actions) {
          this.runAction(action, picked, delta);
          this.state.stats.instructionsCount += 1;
        }
        this.runEvents(event.subEvents, picked, delta);
        continue;
      }

      const conditionsPass = event.conditions.every((condition) => {
        if (condition.typeId === "BuiltinCommonInstructions::Else") {
          return previousEventRan === false;
        }
        const result = this.evalCondition(condition, picked, delta, event.id);
        this.state.stats.instructionsCount += 1;
        return condition.inverted ? !result : result;
      });
      if (event.conditions.length > 0 && !conditionsPass) {
        previousEventRan = false;
        continue;
      }
      previousEventRan = true;
      this.state.stats.eventsCount += 1;

      for (const action of event.actions) {
        this.runAction(action, picked, delta);
        this.state.stats.instructionsCount += 1;
      }
      this.runEvents(event.subEvents, picked, delta);
    }
  }

  private evalCondition(
    instruction: GDInstruction,
    picked: PickMap,
    delta: number,
    eventId: string,
  ): boolean {
    const p = instruction.parameters;
    const ctx = this.ctx(picked, delta);

    switch (instruction.typeId) {
      case "BuiltinCommonInstructions::Once":
      case "SceneJustBegins": {
        const key = `${eventId}:${instruction.id}`;
        if (this.onceFlags.has(key)) return false;
        this.onceFlags.add(key);
        return true;
      }
      case "BuiltinCommonInstructions::Else":
        return true; // handled by runEvents
      case "BuiltinCommonInstructions::CompareValues":
        return compare(
          evalNumber(p["left"] ?? "0", ctx),
          p["operator"] ?? "=",
          evalNumber(p["right"] ?? "0", ctx),
        );
      case "BuiltinCommonInstructions::StrEqual":
        return compareStrings(
          evalString(p["left"] ?? "", ctx),
          p["operator"] ?? "=",
          evalString(p["right"] ?? "", ctx),
        );
      case "CompareSceneVar": {
        const left = asNumber(this.state.variables[p["variable"] ?? ""] ?? 0);
        return compare(left, p["operator"] ?? "=", evalNumber(p["value"] ?? "0", ctx));
      }
      case "CompareSceneVarString": {
        const left = evalString(String(this.state.variables[p["variable"] ?? ""] ?? ""), ctx);
        return compareStrings(left, p["operator"] ?? "=", evalString(p["value"] ?? "", ctx));
      }
      case "CompareGlobalVar": {
        const left = asNumber(this.state.globalVariables[p["variable"] ?? ""] ?? 0);
        return compare(left, p["operator"] ?? "=", evalNumber(p["value"] ?? "0", ctx));
      }
      case "ValueOfTimer": {
        const name = p["timer"] ?? "";
        const value = this.state.timers[name];
        if (value === undefined) {
          this.state.timers[name] = 0;
          return false;
        }
        return compare(value, p["operator"] ?? ">", evalNumber(p["seconds"] ?? "0", ctx));
      }
      case "TimerRepeated": {
        const name = p["timer"] ?? "";
        const limit = evalNumber(p["seconds"] ?? "0", ctx);
        const value = this.state.timers[name];
        if (value === undefined) {
          this.state.timers[name] = 0;
          return false;
        }
        if (value < limit) return false;
        this.state.timers[name] = 0;
        return true;
      }
      case "KeyPressed":
        return this.keys.has(normalizeKey(p["key"] ?? ""));
      case "KeyNotPressed":
        return !this.keys.has(normalizeKey(p["key"] ?? ""));
      case "KeyReleased":
        return (
          this.keysReleased.has(normalizeKey(p["key"] ?? "")) ||
          this.keysPressedOnce.has(normalizeKey(p["key"] ?? ""))
        );
      case "SourisBouton":
        return this.mouse.has(p["button"] ?? "Left");
      case "SourisSurObjet": {
        const list = this.pickList(picked, p["object"] ?? "").filter((object) =>
          pointInObject(object, this.pointer.x, this.pointer.y),
        );
        picked[p["object"] ?? ""] = list;
        return list.length > 0;
      }
      case "Collision": {
        const [hitA, hitB] = this.collisions(
          p["object"] ?? "",
          p["object2"] ?? "",
          p["ignoreTouchingEdges"] === "yes",
        );
        picked[p["object"] ?? ""] = hitA;
        picked[p["object2"] ?? ""] = hitB;
        return hitA.length > 0;
      }
      case "Separation": {
        const [hitA, hitB] = this.collisions(
          p["object"] ?? "",
          p["object2"] ?? "",
          p["ignoreTouchingEdges"] === "yes",
        );
        const colliding = new Set(hitA);
        const list = this.pickList(picked, p["object"] ?? "").filter((o) => !colliding.has(o));
        picked[p["object"] ?? ""] = list;
        return list.length > 0;
      }
      case "OnFloor":
      case "PlatformBehavior::IsOnFloor": {
        const list = this.pickList(picked, p["object"] ?? "").filter((o) => o.onFloor);
        picked[p["object"] ?? ""] = list;
        return list.length > 0;
      }
      case "PlatformBehavior::IsJumping": {
        const list = this.pickList(picked, p["object"] ?? "").filter((o) => o.jumping);
        picked[p["object"] ?? ""] = list;
        return list.length > 0;
      }
      case "PlatformBehavior::IsFalling": {
        const list = this.pickList(picked, p["object"] ?? "").filter(
          (o) => o.falling && !o.onFloor,
        );
        picked[p["object"] ?? ""] = list;
        return list.length > 0;
      }
      case "PosX":
        return this.filterObjects(picked, p["object"] ?? "", (object) =>
          compare(object.x, p["operator"] ?? "=", evalNumber(p["value"] ?? "0", ctx)),
        );
      case "PosY":
        return this.filterObjects(picked, p["object"] ?? "", (object) =>
          compare(object.y, p["operator"] ?? "=", evalNumber(p["value"] ?? "0", ctx)),
        );
      case "Angle":
        return this.filterObjects(picked, p["object"] ?? "", (object) =>
          compare(object.angle, p["operator"] ?? "=", evalNumber(p["value"] ?? "0", ctx)),
        );
      case "Visible":
        return this.filterObjects(picked, p["object"] ?? "", (object) => !object.hidden);
      case "Opacity":
        return this.filterObjects(picked, p["object"] ?? "", (object) =>
          compare(object.opacity, p["operator"] ?? "=", evalNumber(p["value"] ?? "0", ctx)),
        );
      case "AnimationNameIs": {
        const wanted = evalString(p["animation"] ?? "", ctx);
        return this.filterObjects(picked, p["object"] ?? "", (o) => o.animationName === wanted);
      }
      case "Health::IsDead":
        return this.filterObjects(picked, p["object"] ?? "", (o) => o.health <= 0);
      case "Health::CompareHealth":
        return this.filterObjects(picked, p["object"] ?? "", (o) =>
          compare(o.health, p["operator"] ?? "=", evalNumber(p["value"] ?? "0", ctx)),
        );
      case "Flash::IsFlashEnabled":
        return this.filterObjects(picked, p["object"] ?? "", (o) => o.flash.active);
      case "Tween::TweenFinished": {
        const name = p["name"] ?? "0";
        return this.filterObjects(picked, p["object"] ?? "", (o) => !!o.tweens[name]?.done);
      }
      default:
        // Unknown instructions are permissive, like the "unsupported" chip in the sheet.
        return true;
    }
  }

  private collisions(objectA: string, objectB: string, ignoreTouchingEdges: boolean) {
    const a = this.pickListFor(objectA);
    const b = this.pickListFor(objectB);
    const hitA: RTObject[] = [];
    const hitB: RTObject[] = [];
    const pad = ignoreTouchingEdges ? 1 : 0;
    for (const objA of a) {
      for (const objB of b) {
        if (objA !== objB && overlaps(objA, objB, pad)) {
          if (!hitA.includes(objA)) hitA.push(objA);
          if (!hitB.includes(objB)) hitB.push(objB);
        }
      }
    }
    return [hitA, hitB] as const;
  }

  private pickListFor(name: string): RTObject[] {
    return this.live(name);
  }

  private filterObjects(
    picked: PickMap,
    name: string,
    predicate: (object: RTObject) => boolean,
  ): boolean {
    const list = this.pickList(picked, name).filter(predicate);
    picked[name] = list;
    return list.length > 0;
  }

  private targetsOf(picked: PickMap, name: string): RTObject[] {
    return this.pickList(picked, name);
  }

  // ----------------------------------------------------------------- actions

  private runAction(instruction: GDInstruction, picked: PickMap, delta: number) {
    const p = instruction.parameters;
    const ctx = this.ctx(picked, delta);
    const targets = () => this.targetsOf(picked, p["object"] ?? "");

    switch (instruction.typeId) {
      case "Create": {
        const def = this.scene.objects.find((o) => o.name === p["object"]);
        if (!def) break;
        const template = this.scene.instances.find((i) => i.objectId === def.id);
        const created = this.createRuntimeObject(def, {
          x: evalNumber(p["x"] ?? "0", ctx),
          y: evalNumber(p["y"] ?? "0", ctx),
          angle: 0,
          zOrder: template?.zOrder ?? 1,
          layer: p["layer"] || this.scene.layers[0]?.name || "Base layer",
          width: template?.width ?? 64,
          height: template?.height ?? 64,
          hidden: false,
          effects: def.effects,
          variables: def.variables,
          useInstanceSize: false,
        });
        this.state.objects.push(created);
        picked[def.name] = [created];
        break;
      }
      case "Delete":
        for (const object of targets()) object.destroyed = true;
        break;
      case "PosObj": {
        const x = evalNumber(p["x"] ?? "0", ctx);
        const y = evalNumber(p["y"] ?? "0", ctx);
        const useCenter = p["useCenterPosition"] === "yes";
        for (const object of targets()) {
          object.x = useCenter ? x - object.width / 2 : x;
          object.y = useCenter ? y - object.height / 2 : y;
        }
        break;
      }
      case "ChangeX":
        for (const object of targets()) {
          object.x = applyModOp(object.x, p["op"] ?? "set to", evalNumber(p["value"] ?? "0", ctx));
        }
        break;
      case "ChangeY":
        for (const object of targets()) {
          object.y = applyModOp(object.y, p["op"] ?? "set to", evalNumber(p["value"] ?? "0", ctx));
        }
        break;
      case "SetAngle":
        for (const object of targets()) {
          object.angle = normalizeAngle(
            applyModOp(object.angle, p["op"] ?? "set to", evalNumber(p["value"] ?? "0", ctx)),
          );
        }
        break;
      case "ChangeWidth":
        for (const object of targets()) {
          object.width = Math.max(
            1,
            applyModOp(object.width, p["op"] ?? "set to", evalNumber(p["value"] ?? "0", ctx)),
          );
        }
        break;
      case "ChangeHeight":
        for (const object of targets()) {
          object.height = Math.max(
            1,
            applyModOp(object.height, p["op"] ?? "set to", evalNumber(p["value"] ?? "0", ctx)),
          );
        }
        break;
      case "AddForceAngle": {
        const angle = (evalNumber(p["angle"] ?? "0", ctx) * Math.PI) / 180;
        const speed = evalNumber(p["speed"] ?? "0", ctx);
        for (const object of targets()) {
          object.vx += Math.cos(angle) * speed;
          object.vy += Math.sin(angle) * speed;
        }
        break;
      }
      case "AddForceXY":
        for (const object of targets()) {
          object.vx += evalNumber(p["x"] ?? "0", ctx);
          object.vy += evalNumber(p["y"] ?? "0", ctx);
        }
        break;
      case "AddForceToward": {
        const target = this.live(p["target"] ?? "")[0];
        const speed = evalNumber(p["speed"] ?? "0", ctx);
        if (!target) break;
        for (const object of targets()) {
          const dx = target.x + target.width / 2 - (object.x + object.width / 2);
          const dy = target.y + target.height / 2 - (object.y + object.height / 2);
          const length = Math.hypot(dx, dy) || 1;
          object.vx += (dx / length) * speed;
          object.vy += (dy / length) * speed;
        }
        break;
      }
      case "FlipX": {
        const flip = (p["flip"] ?? "yes") === "yes";
        for (const object of targets()) object.flipX = flip;
        break;
      }
      case "FlipY": {
        const flip = (p["flip"] ?? "yes") === "yes";
        for (const object of targets()) object.flipY = flip;
        break;
      }
      case "SetOpacity":
        for (const object of targets()) {
          object.opacity = clamp(
            applyModOp(object.opacity, p["op"] ?? "set to", evalNumber(p["value"] ?? "0", ctx)),
            0,
            255,
          );
        }
        break;
      case "Cache":
        for (const object of targets()) object.hidden = true;
        break;
      case "Montre":
        for (const object of targets()) object.hidden = false;
        break;
      case "ChangeZOrder":
        for (const object of targets()) {
          object.zOrder = applyModOp(
            object.zOrder,
            p["op"] ?? "set to",
            evalNumber(p["value"] ?? "0", ctx),
          );
        }
        break;
      case "ChangeAnimation": {
        const value = Math.round(
          applyModOp(0, p["op"] ?? "set to", evalNumber(p["value"] ?? "0", ctx)),
        );
        for (const object of targets()) {
          const def = this.scene.objects.find((o) => o.name === object.name);
          const animations = def?.animations ?? [];
          const index = clamp(value, 0, Math.max(0, animations.length - 1));
          // Like GDevelop, switching to the animation that is already playing is a
          // no-op: restarting it every frame would freeze the frames on the first one.
          if (object.animationIndex === index) continue;
          object.animationIndex = index;
          const animation = animations[index];
          if (animation) {
            object.animationName = animation.name;
            object.timeBetweenFrames = animation.timeBetweenFrames;
            object.frameIndex = 0;
            const image = animation.images[0]?.image;
            if (image) object.asset = image;
          }
        }
        break;
      }
      case "ChangeAnimationName": {
        const wanted = evalString(p["animation"] ?? "", ctx);
        for (const object of targets()) {
          const def = this.scene.objects.find((o) => o.name === object.name);
          const index = (def?.animations ?? []).findIndex((a) => a.name === wanted);
          if (index < 0 || index === object.animationIndex) continue;
          const animation = def?.animations?.[index];
          object.animationIndex = index;
          if (animation) {
            object.animationName = animation.name;
            object.timeBetweenFrames = animation.timeBetweenFrames;
            object.frameIndex = 0;
            const image = animation.images[0]?.image;
            if (image) object.asset = image;
          }
        }
        break;
      }
      case "SetSpriteSpeed":
        for (const object of targets()) {
          object.animationSpeedScale = Math.max(0.05, evalNumber(p["speed"] ?? "100", ctx) / 100);
        }
        break;
      case "TXT::SetText": {
        const text = evalString(p["text"] ?? "", ctx);
        for (const object of targets()) object.text = text;
        break;
      }
      case "TXT::SetFontSize":
        for (const object of targets()) {
          object.textSize = Math.max(1, evalNumber(p["size"] ?? "12", ctx));
        }
        break;
      case "TXT::SetColor":
        for (const object of targets()) {
          object.textColor = rgbToHex(
            evalNumber(p["r"] ?? "255", ctx),
            evalNumber(p["g"] ?? "255", ctx),
            evalNumber(p["b"] ?? "255", ctx),
          );
        }
        break;
      case "ModVarScene": {
        const name = p["variable"] ?? "";
        const current = asNumber(this.state.variables[name] ?? 0);
        this.state.variables[name] = String(
          applyModOp(current, p["op"] ?? "set to", evalNumber(p["value"] ?? "0", ctx)),
        );
        break;
      }
      case "ModVarSceneTxt": {
        const name = p["variable"] ?? "";
        const next = evalString(p["value"] ?? "", ctx);
        this.state.variables[name] =
          p["op"] === "add" ? String(this.state.variables[name] ?? "") + next : next;
        break;
      }
      case "ToggleSceneVar": {
        const name = p["variable"] ?? "";
        this.state.variables[name] = p["value"] === "no" ? "false" : "true";
        break;
      }
      case "ModVarGlobal": {
        const name = p["variable"] ?? "";
        const current = asNumber(this.state.globalVariables[name] ?? 0);
        const op = p["op"] ?? "set to";
        const value = evalNumber(p["value"] ?? "0", ctx);
        this.state.globalVariables[name] = String(
          op === "max" ? Math.max(current, value) : applyModOp(current, op, value),
        );
        break;
      }
      case "ModVarInstance": {
        const name = p["variable"] ?? "";
        const list = this.targetsOf(picked, p["object"] ?? p["instance"] ?? "");
        for (const object of list) {
          object.variables[name] = String(
            applyModOp(
              asNumber(object.variables[name] ?? 0),
              p["op"] ?? "set to",
              evalNumber(p["value"] ?? "0", ctx),
            ),
          );
        }
        break;
      }
      case "ModVarObjet": {
        const name = p["variable"] ?? "";
        for (const object of targets()) {
          object.variables[name] = String(
            applyModOp(
              asNumber(object.variables[name] ?? 0),
              p["op"] ?? "set to",
              evalNumber(p["value"] ?? "0", ctx),
            ),
          );
        }
        break;
      }
      case "ResetTimer":
        this.state.timers[p["timer"] ?? ""] = 0;
        break;
      case "PauseTimer":
        this.state.pausedTimers[p["timer"] ?? ""] = true;
        break;
      case "UnpauseTimer":
        delete this.state.pausedTimers[p["timer"] ?? ""];
        break;
      case "CentreCamera": {
        const layer = this.state.layers[p["layer"] ?? this.baseLayerName()];
        const target = targets()[0];
        if (!target || !layer) break;
        layer.cameraX = target.x + target.width / 2 - this.width / 2;
        layer.cameraY = target.y + target.height / 2 - this.height / 2;
        this.state.camera.x = layer.cameraX;
        this.state.camera.y = layer.cameraY;
        break;
      }
      case "SetCameraZoom": {
        const layer = this.state.layers[p["layer"] ?? this.baseLayerName()];
        const zoom = clamp(
          applyModOp(
            layer?.cameraZoom ?? 1,
            p["operator"] ?? "set to",
            evalNumber(p["factor"] ?? "1", ctx),
          ),
          0.1,
          8,
        );
        if (layer) {
          layer.cameraZoom = zoom;
          if (layer === this.state.layers[this.baseLayerName()]) this.state.camera.zoom = zoom;
        }
        break;
      }
      case "HideLayer": {
        const layer = this.state.layers[p["layer"] ?? ""];
        if (layer) layer.visible = false;
        break;
      }
      case "ShowLayer": {
        const layer = this.state.layers[p["layer"] ?? ""];
        if (layer) layer.visible = true;
        break;
      }
      case "SetLayerOpacity": {
        const layer = this.state.layers[p["layer"] ?? ""];
        if (layer) {
          layer.opacity = clamp(
            applyModOp(layer.opacity, p["op"] ?? "set to", evalNumber(p["value"] ?? "255", ctx)),
            0,
            255,
          );
        }
        break;
      }
      case "SetTimeScale":
        this.state.timeScale = Math.max(
          0,
          applyModOp(
            this.state.timeScale,
            p["op"] ?? "set to",
            evalNumber(p["timeScale"] ?? "1", ctx),
          ),
        );
        break;
      case "PauseGame":
        this.state.paused = true;
        this.log("Game paused");
        break;
      case "SetEffectParameter": {
        const effectIndex = Math.max(1, evalNumber(p["effect"] ?? "1", ctx)) - 1;
        const key = p["parameter"] ?? "r";
        const value = evalNumber(p["value"] ?? "0", ctx);
        for (const object of targets()) {
          const def = this.scene.objects.find((o) => o.name === object.name);
          const effect = def?.effects?.[effectIndex];
          if (!effect) continue;
          if (effect.type === "Tint") {
            const current = object.tint ?? [255, 255, 255];
            const next: [number, number, number] = [...current] as [number, number, number];
            if (key === "r") next[0] = value;
            if (key === "g") next[1] = value;
            if (key === "b") next[2] = value;
            object.tint = next;
          } else if (effect.type === "ColorOverlay") {
            const current = object.colorOverlay ?? [255, 255, 255, 255];
            const next: [number, number, number, number] = [...current] as [
              number,
              number,
              number,
              number,
            ];
            if (key === "r") next[0] = value;
            if (key === "g") next[1] = value;
            if (key === "b") next[2] = value;
            if (key === "alpha") next[3] = value;
            object.colorOverlay = next;
          }
        }
        break;
      }
      case "PlatformBehavior::SimulateControl": {
        const control = (p["key"] ?? "Right").toLowerCase();
        const pressed = (p["pressed"] ?? "yes") === "yes";
        for (const object of targets()) {
          switch (control) {
            case "left":
              object.controls.left = pressed;
              break;
            case "right":
              object.controls.right = pressed;
              break;
            case "up":
              object.controls.up = pressed;
              break;
            case "down":
              object.controls.down = pressed;
              break;
            case "jump":
              object.controls.jump = pressed;
              if (pressed) this.jump(object);
              break;
            default:
              break;
          }
        }
        break;
      }
      case "PlatformBehavior::SimulateJumpKey":
        for (const object of targets()) this.jump(object);
        break;
      case "PlatformBehavior::IgnoreControl":
        for (const object of targets()) {
          object.ignoreControls = (p["ignore"] ?? "yes") === "yes";
        }
        break;
      case "PlatformBehavior::SetGravity":
        for (const object of targets()) {
          object.gravity = evalNumber(p["gravity"] ?? "1800", ctx);
        }
        break;
      case "Flash::Flash":
        for (const object of targets()) {
          object.flash.active = true;
          object.flash.elapsed = 0;
        }
        break;
      case "Flash::StopFlash":
        for (const object of targets()) {
          object.flash.active = false;
          object.flash.hidden = false;
        }
        break;
      case "Health::RemoveHealth":
        for (const object of targets()) {
          object.health = Math.max(0, object.health - evalNumber(p["health"] ?? "1", ctx));
        }
        break;
      case "Health::AddHealth":
        for (const object of targets()) {
          object.health = Math.min(
            object.maxHealth,
            object.health + evalNumber(p["health"] ?? "1", ctx),
          );
        }
        break;
      case "Health::SetHealth":
        for (const object of targets()) {
          object.health = clamp(evalNumber(p["health"] ?? "100", ctx), 0, object.maxHealth);
        }
        break;
      case "Tween::CreateTween":
      case "Tween::CreateTween2": {
        const name = p["name"] ?? "0";
        const kind = p["kind"] ?? "alpha";
        for (const object of targets()) {
          object.tweens[`${kind}:${name}`] = {
            kind,
            from: evalNumber(p["from"] ?? "0", ctx),
            to: evalNumber(p["to"] ?? "0", ctx),
            elapsed: 0,
            duration: Math.max(0.0001, evalNumber(p["duration"] ?? "1", ctx)),
            easing: p["easing"] ?? "easeInOutQuad",
            done: false,
          };
        }
        break;
      }
      case "Tween::RemoveTween": {
        const name = p["name"] ?? "0";
        const kind = p["kind"] ?? "alpha";
        for (const object of targets()) delete object.tweens[`${kind}:${name}`];
        break;
      }
      case "PlaySound":
        this.options.onPlaySound?.(
          p["file"] ?? "",
          evalNumber(p["volume"] ?? "100", ctx) / 100,
          (p["loop"] ?? "no") === "yes",
        );
        this.log(`Sonido: ${p["file"] ?? ""}`);
        break;
      case "PlaySoundAtPosition":
        this.options.onPlaySound?.(
          p["file"] ?? "",
          evalNumber(p["volume"] ?? "100", ctx) / 100,
          (p["loop"] ?? "no") === "yes",
        );
        break;
      case "StopSound":
        this.options.onStopSound?.(evalNumber(p["channel"] ?? "0", ctx));
        break;
      case "ChangeScene": {
        const scene = p["scene"] ?? this.state.sceneName;
        this.state.sceneName = scene;
        const loaded = this.loadScene(scene);
        this.options.onChangeScene?.(scene);
        this.log(loaded ? `Escena cambiada a "${scene}"` : `Escena desconocida: ${scene}`);
        break;
      }
      case "EndScene":
        this.state.paused = true;
        this.log("Fin de la escena");
        break;
      default:
        break;
    }
  }

  private baseLayerName(): string {
    return this.scene.layers[0]?.name ?? "Base layer";
  }

  private jump(object: RTObject) {
    if (!object.onFloor || object.ignoreControls) return;
    const props = this.platformerProps(object);
    const jumpSpeed = asNumber(props["jumpSpeed"], PHYSICS.jumpSpeed);
    object.vy = -jumpSpeed;
    object.onFloor = false;
    object.jumping = true;
  }

  /** Properties of the platformer behavior, whatever its instance name is. */
  private platformerProps(object: RTObject): Record<string, string> {
    for (const name of object.behaviors) {
      if (object.behaviorTypes[name] === "PlatformBehavior::PlatformerObjectBehavior") {
        return object.behaviorProps[name] ?? {};
      }
    }
    return {};
  }

  // -------------------------------------------------------------- animation

  private updateAnimations(delta: number) {
    for (const object of this.state.objects) {
      if (object.destroyed) continue;
      const def = this.scene.objects.find((o) => o.name === object.name);
      const animation = def?.animations?.[object.animationIndex];
      if (!animation || animation.images.length <= 1) continue;
      const stepMs =
        Math.max(0, animation.timeBetweenFrames) / Math.max(0.05, object.animationSpeedScale);
      object.frameTimer += delta * 1000;
      if (stepMs === 0) {
        // "as fast as possible": advance one frame per engine frame.
        object.frameIndex = (object.frameIndex + 1) % animation.images.length;
      } else {
        while (object.frameTimer >= stepMs) {
          object.frameTimer -= stepMs;
          object.frameIndex += 1;
          if (object.frameIndex >= animation.images.length) {
            object.frameIndex = animation.loops ? 0 : animation.images.length - 1;
            if (!animation.loops) break;
          }
        }
      }
      const image = animation.images[object.frameIndex]?.image;
      if (image) object.asset = image;
    }
  }

  private updateTweens(delta: number) {
    for (const object of this.state.objects) {
      if (object.destroyed) continue;
      for (const [key, tween] of Object.entries(object.tweens)) {
        if (tween.done) continue;
        tween.elapsed += delta;
        const progress = clamp(tween.elapsed / tween.duration, 0, 1);
        const value = tween.from + (tween.to - tween.from) * ease(tween.easing, progress);
        switch (tween.kind) {
          case "x":
            object.x = value;
            break;
          case "y":
            object.y = value;
            break;
          case "angle":
            object.angle = value;
            break;
          case "alpha":
            object.opacity = clamp(value, 0, 255);
            break;
          case "size":
            object.width = Math.max(1, value);
            object.height = Math.max(1, value);
            break;
          default:
            break;
        }
        if (progress >= 1) {
          tween.done = true;
          delete object.tweens[key];
        }
      }
    }
  }

  private updateFlash(delta: number) {
    for (const object of this.state.objects) {
      if (!object.flash.active || object.destroyed) continue;
      object.flash.elapsed += delta;
      const half = Math.max(0.016, object.flash.half);
      const blinking = Math.floor(object.flash.elapsed / half) % 2 === 1;
      object.flash.hidden = blinking;
      if (object.flash.elapsed >= object.flash.duration * 5) {
        object.flash.active = false;
        object.flash.hidden = false;
      }
    }
  }

  // ------------------------------------------------------------------ physics

  private simulatePhysics(delta: number) {
    const platforms = this.state.objects.filter(
      (object) =>
        !object.destroyed && this.hasBehavior(object, "PlatformBehavior::PlatformBehavior"),
    );

    for (const object of this.state.objects) {
      if (object.destroyed) continue;
      const isCharacter = this.hasBehavior(object, "PlatformBehavior::PlatformerObjectBehavior");

      if (isCharacter) {
        const props = this.platformerProps(object);
        const acceleration = asNumber(props["acceleration"], PHYSICS.acceleration);
        const maxSpeed = asNumber(props["maxSpeed"], PHYSICS.maxSpeed);
        const friction = asNumber(props["friction"], PHYSICS.friction);

        // GDevelop drives a platformer character with the arrow keys (and Shift
        // to jump) as long as the behavior doesn't ignore the default controls —
        // the "simulate control" actions then add to them, they don't replace them.
        const useDefaults = !object.ignoreControls;
        const left = object.controls.left || (useDefaults && this.isKeyPressed("Left"));
        const right = object.controls.right || (useDefaults && this.isKeyPressed("Right"));
        if (left) object.vx -= acceleration * delta;
        if (right) object.vx += acceleration * delta;
        if (useDefaults && this.isKeyPressed("Shift")) this.jump(object);
        object.vx = clamp(object.vx, -maxSpeed, maxSpeed);
        if (!left && !right) {
          object.vx -= object.vx * Math.min(1, friction * delta);
          if (Math.abs(object.vx) < 2) object.vx = 0;
        }

        object.vy = Math.min(object.vy + object.gravity * delta, object.maxFallingSpeed);
        if (object.vy > 0) object.jumping = false;
      } else {
        object.vx *= Math.pow(PHYSICS.damping, delta * 60);
        object.vy *= Math.pow(PHYSICS.damping, delta * 60);
        if (Math.abs(object.vx) < 1) object.vx = 0;
        if (Math.abs(object.vy) < 1) object.vy = 0;
      }

      object.falling = isCharacter && !object.onFloor && object.vy > 0;

      object.x += object.vx * delta;
      object.y += object.vy * delta;

      if (isCharacter) {
        object.onFloor = false;
        for (const platform of platforms) {
          if (!overlaps(object, platform, 0)) continue;
          const previousBottom = object.y + object.height - object.vy * delta;
          const isOneWay = this.platformProps(platform)["platformType"] === "One-way platform";
          if (object.vy >= 0 && previousBottom <= platform.y + (isOneWay ? 4 : 8)) {
            object.y = platform.y - object.height;
            object.vy = 0;
            object.onFloor = true;
          }
        }
        if (object.y + object.height > this.height) {
          object.y = this.height - object.height;
          object.vy = 0;
          object.onFloor = true;
        }
      }

      object.x = clamp(object.x, -object.width, this.width);
      object.y = clamp(object.y, -object.height * 2, this.height + object.height);
    }
  }

  private hasBehavior(object: RTObject, type: string): boolean {
    return Object.values(object.behaviorTypes).includes(type);
  }

  private platformProps(object: RTObject): Record<string, string> {
    for (const name of object.behaviors) {
      if (object.behaviorTypes[name] === "PlatformBehavior::PlatformBehavior") {
        return object.behaviorProps[name] ?? {};
      }
    }
    return {};
  }

  private log(message: string) {
    this.state.logs.push({ time: this.state.time, message });
    if (this.state.logs.length > 80) this.state.logs.shift();
  }
}

// ------------------------------------------------------------------- helpers

function toRuntimeSceneFromProject(project: GDProject, scene: GDScene): GDRuntimeScene {
  return {
    name: scene.name,
    backgroundColor: scene.backgroundColor,
    windowWidth:
      scene.useCustomWindowSize && scene.customWindowWidth
        ? scene.customWindowWidth
        : project.gameSettings.windowWidth,
    windowHeight:
      scene.useCustomWindowSize && scene.customWindowHeight
        ? scene.customWindowHeight
        : project.gameSettings.windowHeight,
    layers: scene.layers,
    objects: scene.objects,
    instances: scene.instances,
    events: scene.events,
    sceneVariables: scene.variables,
    globalVariables: project.globalVariables,
    groups: scene.groups ?? [],
    scenes: project.scenes.map((s) => s.name),
  };
}

/** Nested variables are flattened with dotted keys, like GDevelop's expressions. */
export function flattenVariables(list: GDVariable[], prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const variable of list) {
    const key = prefix ? `${prefix}.${variable.name}` : variable.name;
    if (variable.type === "structure" || variable.type === "array") {
      Object.assign(out, flattenVariables(variable.children, key));
      out[key] = variable.value;
    } else {
      out[key] = variable.value;
    }
  }
  return out;
}

function overlaps(a: RTObject, b: RTObject, pad: number): boolean {
  return (
    a.x + pad < b.x + b.width - pad &&
    a.x + a.width - pad > b.x + pad &&
    a.y + pad < b.y + b.height - pad &&
    a.y + a.height - pad > b.y + pad
  );
}

function pointInObject(object: RTObject, x: number, y: number): boolean {
  return (
    x >= object.x && x <= object.x + object.width && y >= object.y && y <= object.y + object.height
  );
}

export function compare(left: number, operator: string, right: number): boolean {
  switch (operator) {
    case ">":
      return left > right;
    case "<":
      return left < right;
    case ">=":
    case "≥":
      return left >= right;
    case "<=":
    case "≤":
      return left <= right;
    case "!=":
    case "≠":
      return left !== right;
    default:
      return left === right;
  }
}

function compareStrings(left: string, operator: string, right: string): boolean {
  switch (operator) {
    case "!=":
    case "≠":
      return left !== right;
    default:
      return left === right;
  }
}

export function applyModOp(current: number, op: string, value: number): number {
  switch (op) {
    case "add":
      return current + value;
    case "subtract":
      return current - value;
    case "multiply":
      return current * value;
    case "divide":
      return value === 0 ? current : current / value;
    case "max":
      return Math.max(current, value);
    case "min":
      return Math.min(current, value);
    case "":
    case "set to":
    default:
      return value;
  }
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const normalizeAngle = (angle: number) => ((angle % 360) + 360) % 360;

function ease(kind: string, t: number): number {
  switch (kind) {
    case "linear":
    case "linearStops":
      return t;
    case "easeInQuad":
      return t * t;
    case "easeOutQuad":
      return 1 - (1 - t) * (1 - t);
    case "easeInOutElastic":
      return t === 0 || t === 1
        ? t
        : -(Math.pow(2, 10 * (t - 1)) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3))) / 2 +
            (t < 0.5 ? 0 : 1);
    case "easeInOutQuad":
    default:
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }
}

const rgbToHex = (r: number, g: number, b: number) =>
  `#${[r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join("")}`;

const nowMs = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

const KEY_ALIASES: Record<string, string> = {
  arrowleft: "Left",
  arrowright: "Right",
  arrowup: "Up",
  arrowdown: "Down",
  " ": "Space",
  spacebar: "Space",
  escape: "Escape",
  enter: "Return",
  controlleft: "Control",
  shiftleft: "Shift",
};

/** Maps a DOM `KeyboardEvent.key` onto GDevelop's key names. */
export function normalizeKey(key: string): string {
  const lower = key.toLowerCase();
  if (KEY_ALIASES[lower]) return KEY_ALIASES[lower]!;
  if (lower.length === 1) return lower;
  return key.charAt(0).toUpperCase() + key.slice(1);
}
