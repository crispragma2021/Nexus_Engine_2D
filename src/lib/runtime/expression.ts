// Tiny expression evaluator for GDevelop-style expressions.
// Supports numbers, string literals, + - * / %, parentheses, and a set of
// built-in functions/properties: Variable(x), VariableString(x), Random(n),
// TimeDelta(), Object.X(), Object.Y(), Object.Angle(), Object.Width()...

import type { RTObject } from "./types";

export interface EvalContext {
  variables: Record<string, string>;
  globalVariables?: Record<string, string>;
  objects: RTObject[];
  /** objects picked by the current event, per object name */
  picked: Record<string, RTObject[]>;
  timers: Record<string, number>;
  time: number;
  delta: number;
  camera?: { x: number; y: number };
  pointer?: { x: number; y: number };
  sceneName?: string;
}

type Value = number | string;

const isDigit = (c: string) => c >= "0" && c <= "9";
const isIdentStart = (c: string) => /[A-Za-z_]/.test(c);
const isIdent = (c: string) => /[A-Za-z0-9_.]/.test(c);

/**
 * Functions whose first argument is a *variable name* written without quotes,
 * exactly like in GDevelop: `Variable(lives)`, `GlobalVariable(score)`.
 */
const NAME_ARGUMENT_FUNCTIONS = new Set([
  "variable",
  "variableasnumber",
  "variablestring",
  "variableasstring",
  "variablechildcount",
  "globalvariable",
  "globalvariableasnumber",
  "globalvariableasstring",
  "globalvariablestring",
  "globalvariablechildcount",
  "objectvariable",
  "objectvariableasnumber",
  "objectvariablestring",
  "objectvariablechildcount",
]);

/** Object accessors that take the object name as their first argument. */
const OBJECT_ACCESSOR_FUNCTIONS: Record<string, string> = {
  objectx: "x",
  objecty: "y",
  objectcenterx: "centerx",
  objectcentery: "centery",
  centerx: "centerx",
  centery: "centery",
  objectangle: "angle",
  objectwidth: "width",
  objectheight: "height",
  objectopacity: "opacity",
  objectdepth: "zorder",
  objectvisible: "visible",
  visible: "visible",
  hidden: "hidden",
  flippedx: "flipped",
  animationname: "animationname",
  currentframe: "currentframe",
  objecttimelelife: "timelife",
};

interface Token {
  kind: "num" | "str" | "ident" | "op";
  value: string;
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const c = input[i]!;
    if (c === " " || c === "\t" || c === "\n") {
      i++;
      continue;
    }
    if (c === '"') {
      let out = "";
      i++;
      while (i < input.length && input[i] !== '"') {
        out += input[i];
        i++;
      }
      i++; // closing quote
      tokens.push({ kind: "str", value: out });
      continue;
    }
    if (isDigit(c) || (c === "." && isDigit(input[i + 1] ?? ""))) {
      let out = "";
      while (i < input.length && (isDigit(input[i]!) || input[i] === ".")) {
        out += input[i];
        i++;
      }
      tokens.push({ kind: "num", value: out });
      continue;
    }
    if (isIdentStart(c)) {
      let out = "";
      while (i < input.length && isIdent(input[i]!)) {
        out += input[i];
        i++;
      }
      tokens.push({ kind: "ident", value: out });
      continue;
    }
    tokens.push({ kind: "op", value: c });
    i++;
  }
  return tokens;
}

class Parser {
  private pos = 0;

  constructor(
    private readonly tokens: Token[],
    private readonly ctx: EvalContext,
  ) {}

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private eat(value?: string): Token | undefined {
    const token = this.tokens[this.pos];
    if (!token) return undefined;
    if (value !== undefined && token.value !== value) return undefined;
    this.pos++;
    return token;
  }

  parseExpression(): Value {
    let left = this.parseTerm();
    for (;;) {
      const token = this.peek();
      if (!token || token.kind !== "op" || (token.value !== "+" && token.value !== "-")) break;
      this.pos++;
      const right = this.parseTerm();
      if (token.value === "+") {
        left =
          typeof left === "string" || typeof right === "string"
            ? `${asString(left)}${asString(right)}`
            : left + right;
      } else {
        left = asNumber(left) - asNumber(right);
      }
    }
    return left;
  }

  private parseTerm(): Value {
    let left = this.parseUnary();
    for (;;) {
      const token = this.peek();
      if (
        !token ||
        token.kind !== "op" ||
        (token.value !== "*" && token.value !== "/" && token.value !== "%")
      )
        break;
      this.pos++;
      const right = asNumber(this.parseUnary());
      const l = asNumber(left);
      if (token.value === "*") left = l * right;
      else if (token.value === "/") left = right === 0 ? 0 : l / right;
      else left = right === 0 ? 0 : l % right;
    }
    return left;
  }

  private parseUnary(): Value {
    if (this.peek()?.value === "-") {
      this.pos++;
      return -asNumber(this.parseUnary());
    }
    if (this.peek()?.value === "+") {
      this.pos++;
      return this.parseUnary();
    }
    return this.parsePrimary();
  }

  private parsePrimary(): Value {
    const token = this.eat();
    if (!token) return 0;
    if (token.kind === "num") return Number(token.value);
    if (token.kind === "str") return token.value;
    if (token.kind === "op" && token.value === "(") {
      const value = this.parseExpression();
      this.eat(")");
      return value;
    }
    if (token.kind === "ident") {
      const args: Value[] = [];
      if (this.peek()?.value === "(") {
        this.pos++;
        const nameArgument = NAME_ARGUMENT_FUNCTIONS.has(token.value.toLowerCase());
        while (this.peek() && this.peek()!.value !== ")") {
          const name = this.tryParseNameArgument(nameArgument);
          args.push(name === null ? this.parseExpression() : name);
          if (this.peek()?.value === ",") this.pos++;
        }
        this.eat(")");
      }
      return this.callIdentifier(token.value, args);
    }
    return 0;
  }

  /**
   * Reads an argument written as a bare name. `Variable(score)` always means the
   * variable called *score*; the other functions use it for object names, which
   * only counts when the name is not a scene variable — so `Max(1, Puntos)`
   * keeps evaluating `Puntos` as an expression.
   */
  private tryParseNameArgument(alwaysName: boolean): string | null {
    const token = this.peek();
    if (!token || token.kind !== "ident") return null;
    const next = this.tokens[this.pos + 1];
    if (next && next.value !== "," && next.value !== ")") return null;
    if (!alwaysName && this.ctx.variables[token.value] !== undefined) return null;
    this.pos++;
    return token.value;
  }

  /** Reads an object property expression (`Player.X()`, `ObjectY(Player)` ...). */
  private readObjectProperty(target: RTObject, property: string, args: Value[]): Value {
    const ctx = this.ctx;
    switch (property.toLowerCase()) {
      case "x":
        return target.x;
      case "livescount":
        return target.health;
      case "visible":
        return target.hidden ? 0 : 1;
      case "hidden":
        return target.hidden ? 1 : 0;
      case "flipped":
        return target.flipX ? 1 : 0;
      case "animationnam":
      case "animationname":
        return target.animationName;
      case "timelife":
        return ctx.time;
      case "currentframe":
        return target.frameIndex;
      case "y":
        return target.y;
      case "angle":
        return target.angle;
      case "width":
        return target.width;
      case "height":
        return target.height;
      case "opacity":
        return target.opacity;
      case "zorder":
        return target.zOrder;
      case "centerx":
        return target.x + target.width / 2;
      case "centery":
        return target.y + target.height / 2;
      case "variable":
        return Number(target.variables[asString(args[0] ?? "")] ?? 0);
      case "variablestring":
        return target.variables[asString(args[0] ?? "")] ?? "";
      case "lives":
        return target.health;
      default:
        return 0;
    }
  }

  private callIdentifier(rawName: string, args: Value[]): Value {
    const ctx = this.ctx;
    const name = rawName;

    const accessor = OBJECT_ACCESSOR_FUNCTIONS[name.toLowerCase()];
    if (accessor) {
      const target = pickFirst(ctx, asString(args[0] ?? ""));
      return target ? this.readObjectProperty(target, accessor, args) : 0;
    }

    if (name.includes(".")) {
      const [objectName = "", rawProp = ""] = name.split(".");
      const target = pickFirst(ctx, objectName);
      if (!target) return 0;
      return this.readObjectProperty(target, rawProp, args);
    }

    switch (name.toLowerCase()) {
      case "variable":
      case "variableasnumber":
        return Number(ctx.variables[asString(args[0] ?? "")] ?? 0);
      case "variablestring":
      case "variableasstring":
        return ctx.variables[asString(args[0] ?? "")] ?? "";
      case "globalvariable":
        return Number(ctx.globalVariables?.[asString(args[0] ?? "")] ?? 0);
      case "globalvariablestring":
        return ctx.globalVariables?.[asString(args[0] ?? "")] ?? "";
      case "scene":
        return ctx.sceneName ?? "";
      case "camerax":
        return ctx.camera?.x ?? 0;
      case "cameray":
        return ctx.camera?.y ?? 0;
      case "mousex":
        return ctx.pointer?.x ?? 0;
      case "mousey":
        return ctx.pointer?.y ?? 0;
      case "randominrange":
        return (
          asNumber(args[0] ?? 0) +
          Math.floor(Math.random() * (asNumber(args[1] ?? 0) - asNumber(args[0] ?? 0) + 1))
        );
      case "timerelapsedtime":
      case "tolowercase":
        return asString(args[0] ?? "").toLowerCase();
      case "touppercase":
        return asString(args[0] ?? "").toUpperCase();
      case "strlen":
        return asString(args[0] ?? "").length;
      case "tostring":
        return asString(args[0] ?? "");
      case "tonumber":
        return asNumber(args[0] ?? 0);
      case "random":
        return Math.floor(Math.random() * (asNumber(args[0] ?? 0) + 1));
      case "randomfloat":
        return Math.random() * asNumber(args[0] ?? 1);
      case "timedelta":
        return ctx.delta;
      case "timefromstart":
        return ctx.time;
      case "abs":
        return Math.abs(asNumber(args[0] ?? 0));
      case "floor":
        return Math.floor(asNumber(args[0] ?? 0));
      case "ceil":
        return Math.ceil(asNumber(args[0] ?? 0));
      case "round":
        return Math.round(asNumber(args[0] ?? 0));
      case "min":
        return Math.min(asNumber(args[0] ?? 0), asNumber(args[1] ?? 0));
      case "max":
        return Math.max(asNumber(args[0] ?? 0), asNumber(args[1] ?? 0));
      case "cos":
        return Math.cos((asNumber(args[0] ?? 0) * Math.PI) / 180);
      case "sin":
        return Math.sin((asNumber(args[0] ?? 0) * Math.PI) / 180);
      case "sqrt":
        return Math.sqrt(Math.abs(asNumber(args[0] ?? 0)));
      default:
        // Bare identifier: treat as a scene variable name.
        return ctx.variables[name] ?? 0;
    }
  }
}

function pickFirst(ctx: EvalContext, objectName: string): RTObject | undefined {
  const picked = ctx.picked[objectName];
  if (picked && picked.length > 0) return picked[0];
  return ctx.objects.find((o) => o.name === objectName && !o.destroyed);
}

export function asNumber(value: Value | undefined, fallback = 0): number {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "boolean") return value ? 1 : 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function asString(value: Value): string {
  if (typeof value === "string") return value;
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 1000) / 1000);
}

/** Evaluates an expression, returning a number or a string. */
export function evaluate(source: string, ctx: EvalContext): Value {
  if (!source) return 0;
  try {
    return new Parser(tokenize(source), ctx).parseExpression();
  } catch {
    return 0;
  }
}

export const evalNumber = (source: string, ctx: EvalContext): number =>
  asNumber(evaluate(source, ctx));

export const evalString = (source: string, ctx: EvalContext): string => {
  const trimmed = source.trim();
  // Plain text without quotes or operators is used literally (e.g. "Score: 0").
  if (trimmed && !/["+]/.test(trimmed) && !/^[\d.\s-]+$/.test(trimmed)) return trimmed;
  return asString(evaluate(source, ctx));
};
