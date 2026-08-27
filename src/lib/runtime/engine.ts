// GameRuntime: the TypeScript engine that interprets the visual event tree
// produced by the editor and simulates the scene each frame.

import type { GDEvent, GDInstruction, GDProject } from "@/lib/editor/types";
import { asNumber, evalNumber, evalString, type EvalContext } from "./expression";
import { PHYSICS, type RTObject, type RuntimeState } from "./types";

type PickMap = Record<string, RTObject[]>;

let runtimeIdCounter = 0;
const nextId = () => `rt_${++runtimeIdCounter}`;

export interface RuntimeOptions {
  /** called when an action requests a scene change */
  onChangeScene?: (scene: string) => void;
  /** called when a sound should play */
  onPlaySound?: (file: string) => void;
}

export class GameRuntime {
  state: RuntimeState;
  readonly width: number;
  readonly height: number;

  private readonly project: GDProject;
  private readonly options: RuntimeOptions;
  private readonly onceFlags = new Set<string>();
  private readonly keys = new Set<string>();
  private readonly keysReleased = new Set<string>();
  private readonly mouse = new Set<string>();

  constructor(project: GDProject, options: RuntimeOptions = {}) {
    this.project = project;
    this.options = options;
    this.width = project.windowWidth;
    this.height = project.windowHeight;
    this.state = this.createState();
  }

  // ---------------------------------------------------------------- lifecycle

  private createState(): RuntimeState {
    const objects: RTObject[] = this.project.instances.map((instance) => {
      const def = this.project.objects.find((o) => o.id === instance.objectId);
      const variables: Record<string, string> = {};
      for (const variable of def?.variables ?? []) variables[variable.name] = variable.value;
      return {
        id: nextId(),
        name: def?.name ?? "Unknown",
        type: def?.type ?? "Sprite",
        ...(def?.asset ? { asset: def.asset } : {}),
        x: instance.x,
        y: instance.y,
        width: instance.width,
        height: instance.height,
        angle: instance.angle,
        zOrder: instance.zOrder,
        layer: instance.layer,
        opacity: 255,
        hidden: false,
        flipX: false,
        text: def?.text ?? "",
        textColor: def?.textColor ?? "#FAFAFA",
        textSize: def?.textSize ?? 24,
        animation: 0,
        behaviors: [...(def?.behaviors ?? [])],
        vx: 0,
        vy: 0,
        onFloor: false,
        variables,
        destroyed: false,
      };
    });

    return {
      objects,
      variables: {},
      timers: {},
      camera: { x: 0, y: 0 },
      time: 0,
      frame: 0,
      sceneName: this.project.scenes[0] ?? "Level 1",
      logs: [],
    };
  }

  reset() {
    this.onceFlags.clear();
    this.keys.clear();
    this.keysReleased.clear();
    this.mouse.clear();
    this.state = this.createState();
  }

  // -------------------------------------------------------------------- input

  pressKey(key: string) {
    this.keys.add(normalizeKey(key));
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

  isKeyPressed(key: string) {
    return this.keys.has(normalizeKey(key));
  }

  // --------------------------------------------------------------------- step

  step(deltaSeconds: number) {
    const delta = Math.min(deltaSeconds, 1 / 20);
    this.state.time += delta;
    this.state.frame += 1;
    for (const name of Object.keys(this.state.timers)) {
      this.state.timers[name] = (this.state.timers[name] ?? 0) + delta;
    }

    this.runEvents(this.project.events, {}, delta);
    this.simulatePhysics(delta);

    this.state.objects = this.state.objects.filter((object) => !object.destroyed);
    this.keysReleased.clear();
  }

  // ------------------------------------------------------------------- events

  private ctx(picked: PickMap, delta: number): EvalContext {
    return {
      variables: this.state.variables,
      objects: this.state.objects,
      picked,
      timers: this.state.timers,
      time: this.state.time,
      delta,
    };
  }

  private live(name: string): RTObject[] {
    return this.state.objects.filter((o) => o.name === name && !o.destroyed);
  }

  private pickList(picked: PickMap, name: string): RTObject[] {
    const existing = picked[name];
    if (existing) return existing.filter((o) => !o.destroyed);
    const all = this.live(name);
    picked[name] = all;
    return all;
  }

  private runEvents(events: GDEvent[], inherited: PickMap, delta: number) {
    for (const event of events) {
      if (event.disabled || event.kind === "comment") continue;

      const picked: PickMap = {};
      for (const [key, value] of Object.entries(inherited)) picked[key] = [...value];

      if (event.kind === "group") {
        this.runEvents(event.subEvents, picked, delta);
        continue;
      }

      const conditionsPass = event.conditions.every((condition) => {
        const result = this.evalCondition(condition, picked, delta, event.id);
        return condition.inverted ? !result : result;
      });
      if (!conditionsPass) continue;

      for (const action of event.actions) this.runAction(action, picked, delta);
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
      case "BuiltinCommonInstructions::Once": {
        const key = `${eventId}:${instruction.id}`;
        if (this.onceFlags.has(key)) return false;
        this.onceFlags.add(key);
        return true;
      }
      case "CompareSceneVar": {
        const left = asNumber(this.state.variables[p["variable"] ?? ""] ?? 0);
        return compare(left, p["operator"] ?? "=", evalNumber(p["value"] ?? "0", ctx));
      }
      case "TimerGreater": {
        const name = p["timer"] ?? "";
        const value = this.state.timers[name];
        if (value === undefined) {
          this.state.timers[name] = 0;
          return false;
        }
        return value > evalNumber(p["seconds"] ?? "0", ctx);
      }
      case "KeyPressed":
        return this.keys.has(normalizeKey(p["key"] ?? ""));
      case "KeyReleased":
        return this.keysReleased.has(normalizeKey(p["key"] ?? ""));
      case "MouseButtonPressed":
        return this.mouse.has(p["button"] ?? "Left");
      case "Collision": {
        const a = this.pickList(picked, p["object"] ?? "");
        const b = this.pickList(picked, p["object2"] ?? "");
        const hitA: RTObject[] = [];
        const hitB: RTObject[] = [];
        for (const objA of a) {
          for (const objB of b) {
            if (objA !== objB && overlaps(objA, objB)) {
              if (!hitA.includes(objA)) hitA.push(objA);
              if (!hitB.includes(objB)) hitB.push(objB);
            }
          }
        }
        picked[p["object"] ?? ""] = hitA;
        picked[p["object2"] ?? ""] = hitB;
        return hitA.length > 0;
      }
      case "OnFloor": {
        const list = this.pickList(picked, p["object"] ?? "").filter((o) => o.onFloor);
        picked[p["object"] ?? ""] = list;
        return list.length > 0;
      }
      case "ComparePosX":
        return this.filterObjects(picked, p["object"] ?? "", (object) =>
          compare(object.x, p["operator"] ?? "=", evalNumber(p["value"] ?? "0", ctx)),
        );
      case "CompareAngle":
        return this.filterObjects(picked, p["object"] ?? "", (object) =>
          compare(object.angle, p["operator"] ?? "=", evalNumber(p["value"] ?? "0", ctx)),
        );
      case "IsVisible":
        return this.filterObjects(picked, p["object"] ?? "", (object) => !object.hidden);
      case "CompareOpacity":
        return this.filterObjects(picked, p["object"] ?? "", (object) =>
          compare(object.opacity, p["operator"] ?? "=", evalNumber(p["value"] ?? "0", ctx)),
        );
      default:
        return true;
    }
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

  private runAction(instruction: GDInstruction, picked: PickMap, delta: number) {
    const p = instruction.parameters;
    const ctx = this.ctx(picked, delta);
    const targets = () => this.pickList(picked, p["object"] ?? "");

    switch (instruction.typeId) {
      case "CreateObject": {
        const def = this.project.objects.find((o) => o.name === p["object"]);
        if (!def) break;
        const template = this.project.instances.find((i) => i.objectId === def.id);
        const variables: Record<string, string> = {};
        for (const variable of def.variables) variables[variable.name] = variable.value;
        const created: RTObject = {
          id: nextId(),
          name: def.name,
          type: def.type,
          ...(def.asset ? { asset: def.asset } : {}),
          x: evalNumber(p["x"] ?? "0", ctx),
          y: evalNumber(p["y"] ?? "0", ctx),
          width: template?.width ?? 32,
          height: template?.height ?? 32,
          angle: 0,
          zOrder: template?.zOrder ?? 1,
          layer: p["layer"] ?? "Base layer",
          opacity: 255,
          hidden: false,
          flipX: false,
          text: def.text ?? "",
          textColor: def.textColor ?? "#FAFAFA",
          textSize: def.textSize ?? 24,
          animation: 0,
          behaviors: [...def.behaviors],
          vx: 0,
          vy: 0,
          onFloor: false,
          variables,
          destroyed: false,
        };
        this.state.objects.push(created);
        picked[def.name] = [created];
        break;
      }
      case "DeleteObject":
        for (const object of targets()) object.destroyed = true;
        break;
      case "SetPosition":
        for (const object of targets()) {
          object.x = evalNumber(p["x"] ?? "0", ctx);
          object.y = evalNumber(p["y"] ?? "0", ctx);
        }
        break;
      case "ChangeX":
        for (const object of targets()) {
          object.x = applyModOp(object.x, p["op"] ?? "set to", evalNumber(p["value"] ?? "0", ctx));
        }
        break;
      case "ChangeAngle":
        for (const object of targets()) {
          object.angle = applyModOp(
            object.angle,
            p["op"] ?? "set to",
            evalNumber(p["value"] ?? "0", ctx),
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
      case "AddForceToward": {
        const target = this.live(p["target"] ?? "")[0];
        const speed = evalNumber(p["speed"] ?? "0", ctx);
        if (!target) break;
        for (const object of targets()) {
          const dx = target.x - object.x;
          const dy = target.y - object.y;
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
      case "ChangeAnim":
        for (const object of targets()) {
          object.animation = applyModOp(
            object.animation,
            p["op"] ?? "set to",
            evalNumber(p["value"] ?? "0", ctx),
          );
        }
        break;
      case "SetOpacity":
        for (const object of targets()) {
          object.opacity = clamp(
            applyModOp(object.opacity, p["op"] ?? "set to", evalNumber(p["value"] ?? "0", ctx)),
            0,
            255,
          );
        }
        break;
      case "HideObject":
        for (const object of targets()) object.hidden = true;
        break;
      case "ShowObject":
        for (const object of targets()) object.hidden = false;
        break;
      case "SetZOrder":
        for (const object of targets()) {
          object.zOrder = applyModOp(
            object.zOrder,
            p["op"] ?? "set to",
            evalNumber(p["value"] ?? "0", ctx),
          );
        }
        break;
      case "SetText": {
        const text = evalString(p["text"] ?? "", ctx);
        for (const object of targets()) object.text = text;
        break;
      }
      case "SetSceneVar": {
        const name = p["variable"] ?? "";
        const current = asNumber(this.state.variables[name] ?? 0);
        this.state.variables[name] = String(
          applyModOp(current, p["op"] ?? "set to", evalNumber(p["value"] ?? "0", ctx)),
        );
        break;
      }
      case "StartTimer":
        this.state.timers[p["timer"] ?? ""] = 0;
        break;
      case "CenterCamera": {
        const target = targets()[0];
        if (!target) break;
        this.state.camera.x = clamp(
          target.x + target.width / 2 - this.width / 2,
          0,
          Math.max(0, this.width),
        );
        this.state.camera.y = 0;
        break;
      }
      case "ChangeScene":
        this.state.sceneName = p["scene"] ?? this.state.sceneName;
        this.options.onChangeScene?.(this.state.sceneName);
        this.log(`Scene changed to "${this.state.sceneName}"`);
        break;
      case "PlaySound":
        this.options.onPlaySound?.(p["file"] ?? "");
        this.log(`Sound: ${p["file"] ?? ""}`);
        break;
      default:
        break;
    }
  }

  private log(message: string) {
    this.state.logs.push({ time: this.state.time, message });
    if (this.state.logs.length > 60) this.state.logs.shift();
  }

  // ------------------------------------------------------------------ physics

  private simulatePhysics(delta: number) {
    const platforms = this.state.objects.filter(
      (object) => !object.destroyed && object.behaviors.includes("Platform"),
    );

    for (const object of this.state.objects) {
      if (object.destroyed) continue;
      const isCharacter = object.behaviors.includes("Platformer character");

      if (isCharacter) {
        object.vy = Math.min(object.vy + PHYSICS.gravity * delta, PHYSICS.maxFallSpeed);
        if (object.onFloor && (this.keys.has("Space") || this.keys.has("Up"))) {
          object.vy = -PHYSICS.jumpSpeed;
          object.onFloor = false;
        }
      } else {
        object.vx *= PHYSICS.damping;
        object.vy *= PHYSICS.damping;
        if (Math.abs(object.vx) < 1) object.vx = 0;
        if (Math.abs(object.vy) < 1) object.vy = 0;
      }

      object.x += object.vx * delta;
      object.y += object.vy * delta;

      if (isCharacter) {
        object.onFloor = false;
        for (const platform of platforms) {
          if (!overlaps(object, platform)) continue;
          const previousBottom = object.y + object.height - object.vy * delta;
          if (object.vy >= 0 && previousBottom <= platform.y + 8) {
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
    }
  }
}

// ------------------------------------------------------------------- helpers

function overlaps(a: RTObject, b: RTObject): boolean {
  return (
    a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
  );
}

function compare(left: number, operator: string, right: number): boolean {
  switch (operator) {
    case ">":
      return left > right;
    case "<":
      return left < right;
    case ">=":
      return left >= right;
    case "<=":
      return left <= right;
    case "!=":
      return left !== right;
    default:
      return left === right;
  }
}

function applyModOp(current: number, op: string, value: number): number {
  switch (op) {
    case "add":
      return current + value;
    case "subtract":
      return current - value;
    case "multiply":
      return current * value;
    case "divide":
      return value === 0 ? current : current / value;
    default:
      return value;
  }
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const KEY_ALIASES: Record<string, string> = {
  arrowleft: "Left",
  arrowright: "Right",
  arrowup: "Up",
  arrowdown: "Down",
  " ": "Space",
  space: "Space",
  a: "Left",
  d: "Right",
  w: "Up",
  s: "Down",
};

export function normalizeKey(key: string): string {
  const lower = key.toLowerCase();
  return KEY_ALIASES[lower] ?? key.charAt(0).toUpperCase() + key.slice(1);
}
