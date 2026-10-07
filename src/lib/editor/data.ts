// Demo project — the equivalent of GDevelop's "Platformer" example, expressed with
// the same model the editor edits (animations + frames + points, behaviors with
// properties, layers with camera and effects, groups, external layouts).

import { DEFAULT_GRID } from "./types";
import type { GDEvent, GDInstruction, GDObjectDef, GDProject, GDScene, GDVariable } from "./types";
import { makeScene } from "./scenes";
import { uid } from "./ids";
import { generateButtonSvgDataUrl } from "../agent/planner";
export { uid };

const num = (name: string, value: string, children: GDVariable[] = []): GDVariable => ({
  name,
  type: "number",
  value,
  children,
});

const text = (name: string, value: string): GDVariable => ({
  name,
  type: "string",
  value,
  children: [],
  previewAsString: true,
});

const ins = (typeId: string, parameters: Record<string, string> = {}): GDInstruction => ({
  id: uid("in"),
  typeId,
  inverted: false,
  parameters,
});

const event = (patch: Partial<GDEvent> & { id?: string }): GDEvent => ({
  id: patch.id ?? uid("ev"),
  kind: "standard",
  conditions: [],
  actions: [],
  subEvents: [],
  collapsed: false,
  ...patch,
});

const comment = (commentText: string, background: string, textColor: string): GDEvent =>
  event({
    kind: "comment",
    comment: commentText,
    commentColors: { background, text: textColor },
  });

export function generatePlatformSvgDataUrl(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <rect x="0" y="12" width="64" height="52" fill="#5D4037"/>
    <rect x="0" y="18" width="64" height="46" fill="#4E342E"/>
    <rect x="8" y="24" width="12" height="8" rx="2" fill="#3E2723" opacity="0.6"/>
    <rect x="36" y="32" width="16" height="10" rx="2" fill="#3E2723" opacity="0.6"/>
    <rect x="18" y="44" width="14" height="8" rx="2" fill="#3E2723" opacity="0.6"/>
    <rect x="48" y="20" width="10" height="6" rx="2" fill="#3E2723" opacity="0.6"/>
    <path d="M0 0 L64 0 L64 16 C56 18, 48 12, 40 16 C32 20, 24 12, 16 16 C8 18, 4 12, 0 16 Z" fill="#4CAF50"/>
    <path d="M0 0 L64 0 L64 10 C56 12, 48 8, 40 11 C32 14, 24 8, 16 11 C8 13, 4 8, 0 11 Z" fill="#8BC34A"/>
    <rect x="0" y="0" width="64" height="3" fill="#C8E6C9"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function generateBackgroundSvgDataUrl(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
    <defs>
      <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#1A237E"/>
        <stop offset="40%" stop-color="#283593"/>
        <stop offset="80%" stop-color="#5C6BC0"/>
        <stop offset="100%" stop-color="#9FA8DA"/>
      </linearGradient>
    </defs>
    <rect width="800" height="600" fill="url(#skyGrad)"/>
    <polygon points="-50,600 150,380 350,600" fill="#283593" opacity="0.7"/>
    <polygon points="200,600 450,320 700,600" fill="#1A237E" opacity="0.8"/>
    <polygon points="500,600 680,400 850,600" fill="#3F51B5" opacity="0.6"/>
    <g fill="#FFFFFF" opacity="0.85">
      <ellipse cx="120" cy="120" rx="50" ry="22"/>
      <ellipse cx="160" cy="110" rx="35" ry="25"/>
      <ellipse cx="90" cy="125" rx="30" ry="18"/>
      <ellipse cx="580" cy="160" rx="65" ry="26"/>
      <ellipse cx="630" cy="145" rx="45" ry="28"/>
      <ellipse cx="530" cy="165" rx="40" ry="20"/>
    </g>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function generateBoxSvgDataUrl(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
    <rect x="2" y="2" width="36" height="36" rx="4" fill="#8D6E63" stroke="#4E342E" stroke-width="2.5"/>
    <rect x="6" y="6" width="28" height="28" fill="#A1887F"/>
    <line x1="6" y1="6" x2="34" y2="34" stroke="#5D4037" stroke-width="3"/>
    <line x1="34" y1="6" x2="6" y2="34" stroke="#5D4037" stroke-width="3"/>
    <circle cx="8" cy="8" r="1.5" fill="#3E2723"/>
    <circle cx="32" cy="8" r="1.5" fill="#3E2723"/>
    <circle cx="8" cy="32" r="1.5" fill="#3E2723"/>
    <circle cx="32" cy="32" r="1.5" fill="#3E2723"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function generatePlayerSvgDataUrl(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="55" viewBox="0 0 72 55">
    <path d="M 15 45 C 10 30, 20 15, 38 12 C 55 10, 68 20, 65 35 C 62 48, 48 52, 35 52 C 22 52, 15 48, 15 45 Z" fill="#00E676" stroke="#1B5E20" stroke-width="2.5"/>
    <path d="M 28 28 C 32 20, 48 20, 52 32 C 54 42, 42 48, 30 46 Z" fill="#B9F6CA"/>
    <polygon points="20,15 25,5 30,14" fill="#FF5252"/>
    <polygon points="32,12 37,2 42,11" fill="#FF5252"/>
    <polygon points="44,14 49,4 54,15" fill="#FF5252"/>
    <circle cx="54" cy="20" r="5" fill="#FFFFFF"/>
    <circle cx="56" cy="20" r="2.5" fill="#1A237E"/>
    <path d="M 18 38 C 10 38, 2 45, 5 50 C 10 52, 16 48, 20 44 Z" fill="#00E676" stroke="#1B5E20" stroke-width="2"/>
    <rect x="26" y="44" width="10" height="10" rx="3" fill="#00C853" stroke="#1B5E20" stroke-width="1.5"/>
    <rect x="44" y="44" width="10" height="10" rx="3" fill="#00C853" stroke="#1B5E20" stroke-width="1.5"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function generateSlimeSvgDataUrl(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="52" height="44" viewBox="0 0 52 44">
    <path d="M 6 42 C 0 25, 10 6, 26 6 C 42 6, 52 25, 46 42 C 40 44, 12 44, 6 42 Z" fill="#7C4DFF" stroke="#311B92" stroke-width="2.5"/>
    <circle cx="18" cy="22" r="4.5" fill="#FFFFFF"/>
    <circle cx="19" cy="22" r="2" fill="#000000"/>
    <circle cx="34" cy="22" r="4.5" fill="#FFFFFF"/>
    <circle cx="33" cy="22" r="2" fill="#000000"/>
    <ellipse cx="20" cy="12" rx="6" ry="3" fill="#B388FF" opacity="0.8"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function generateCoinSvgDataUrl(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34">
    <circle cx="17" cy="17" r="15" fill="#FFD700" stroke="#FF8F00" stroke-width="2.5"/>
    <circle cx="17" cy="17" r="11" fill="#FFC107"/>
    <path d="M 17 9 L 19.5 14 L 25 14.5 L 21 18.5 L 22.5 24 L 17 21 L 11.5 24 L 13 18.5 L 9 14.5 L 14.5 14 Z" fill="#FFE082"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function playerObject(): GDObjectDef {
  const playerAsset = generatePlayerSvgDataUrl();
  return {
    id: "obj_player",
    name: "Jugador",
    type: "Sprite",
    asset: playerAsset,
    behaviors: [
      {
        name: "PlataformaCharacter",
        type: "PlatformBehavior::PlatformerObjectBehavior",
        properties: {
          acceleration: "1500",
          maxSpeed: "250",
          friction: "20",
          jumpSpeed: "600",
          jumpSustain: "300",
          gravity: "1800",
          maxFallingSpeed: "900",
          canGrabPlatforms: "no",
          canGoDownFromJumpthru: "yes",
          maxJumps: "2",
        },
      },
    ],
    effects: [],
    variables: [
      num("Vidas", "3"),
      num("Invulnerable", "0"),
      {
        name: "Estado",
        type: "structure",
        value: "",
        children: [text("actual", "reposo"), num("tick", "0")],
      },
    ],
    animations: [
      {
        name: "reposo",
        loops: false,
        timeBetweenFrames: 0,
        images: [
          {
            image: playerAsset,
            originX: 0,
            originY: 0,
            centerX: 0.5,
            centerY: 0.5,
            opacity: 255,
          },
        ],
        points: [
          { name: "cañón", x: 52, y: 18 },
          { name: "suelo", x: 32, y: 54 },
        ],
      },
      {
        name: "correr",
        loops: true,
        timeBetweenFrames: 8,
        images: [
          {
            image: playerAsset,
            originX: 0,
            originY: 0,
            centerX: 0.5,
            centerY: 0.5,
            opacity: 255,
          },
        ],
        points: [
          { name: "cañón", x: 52, y: 18 },
          { name: "suelo", x: 32, y: 54 },
        ],
      },
      {
        name: "saltar",
        loops: false,
        timeBetweenFrames: 0,
        images: [
          {
            image: playerAsset,
            originX: 0,
            originY: 0,
            centerX: 0.5,
            centerY: 0.5,
            opacity: 255,
          },
        ],
        points: [{ name: "cañón", x: 52, y: 18 }],
      },
    ],
  };
}

function simpleSprite(
  id: string,
  name: string,
  asset: string,
  patch: Partial<GDObjectDef> = {},
): GDObjectDef {
  return {
    id,
    name,
    type: "Sprite",
    asset,
    behaviors: [],
    effects: [],
    variables: [],
    animations: [
      {
        name: "reposo",
        loops: true,
        timeBetweenFrames: 0,
        images: [
          { image: asset, originX: 0, originY: 0, centerX: 0.5, centerY: 0.5, opacity: 255 },
        ],
        points: [],
      },
    ],
    ...patch,
  };
}

function levelOneScene(): GDScene {
  return makeScene("Level 1", {
    backgroundColor: "247;249;255",
    grid: { ...DEFAULT_GRID, show: true, snap: true },
    layers: [
      { name: "Base layer", visible: true, camera: { x: 0, y: 0 }, effects: [] },
      {
        name: "Interfaz",
        visible: true,
        locked: false,
        camera: { x: 0, y: 0 },
        effects: [],
        followBaseLayer: false,
      },
    ],
    activeLayer: "Base layer",
    objects: [
      simpleSprite("obj_bg", "FondoNivel", generateBackgroundSvgDataUrl()),
      playerObject(),
      {
        id: "obj_platform",
        name: "Plataforma",
        type: "TiledSpriteObject::TiledSprite",
        asset: generatePlatformSvgDataUrl(),
        behaviors: [
          {
            name: "Plataforma",
            type: "PlatformBehavior::PlatformBehavior",
            properties: { platformType: "Normal platform", canBeGrabbed: "yes", yGrabOffset: "0" },
          },
        ],
        effects: [],
        variables: [],
      },
      simpleSprite("obj_box", "Caja", generateBoxSvgDataUrl(), {
        behaviors: [
          {
            name: "Plataforma",
            type: "PlatformBehavior::PlatformBehavior",
            properties: { platformType: "Normal platform", canBeGrabbed: "yes", yGrabOffset: "0" },
          },
        ],
      }),
      simpleSprite("obj_coin", "Moneda", generateCoinSvgDataUrl(), {
        behaviors: [
          {
            name: "Interpolación",
            type: "Tween::TweenBehavior",
            properties: { tweenName: "0" },
          },
        ],
        variables: [num("valor", "1")],
      }),
      simpleSprite("obj_slime", "Slime", generateSlimeSvgDataUrl(), {
        behaviors: [
          {
            name: "Destello",
            type: "Flash::Flash",
            properties: { flashDuration: "0.2", times: "5", halfTimes: "0.1" },
          },
          {
            name: "Salud",
            type: "Health::Health",
            properties: { health: "2", maxHealth: "2", minHealth: "0", shield: "0" },
          },
        ],
        effects: [
          {
            type: "Tint",
            name: "Tinte",
            parameters: { r: "255", g: "170", b: "90" },
          },
        ],
        variables: [num("velocidad", "80")],
      }),
      {
        id: "obj_score",
        name: "TextoPuntos",
        type: "TextObject::Text",
        text: "Puntos: 0",
        textColor: "#FFFFFF",
        textSize: 24,
        fontFamily: "PressStart2P.ttf",
        bold: true,
        alignment: "left",
        wrapping: false,
        behaviors: [
          {
            name: "Anclar",
            type: "AnchorBehavior::AnchorBehavior",
            properties: { anchor: "Left", relativeToWindow: "yes", relativeToBottomLeft: "yes" },
          },
        ],
        effects: [],
        variables: [],
      },
      simpleSprite("obj_btn_left", "BotonIzquierda", generateButtonSvgDataUrl("BotonIzquierda"), {
        behaviors: [
          {
            name: "Anclar",
            type: "AnchorBehavior::AnchorBehavior",
            properties: { anchor: "Left", relativeToWindow: "yes", relativeToBottomLeft: "yes" },
          },
        ],
      }),
      simpleSprite("obj_btn_right", "BotonDerecha", generateButtonSvgDataUrl("BotonDerecha"), {
        behaviors: [
          {
            name: "Anclar",
            type: "AnchorBehavior::AnchorBehavior",
            properties: { anchor: "Left", relativeToWindow: "yes", relativeToBottomLeft: "yes" },
          },
        ],
      }),
      simpleSprite("obj_btn_jump", "BotonSalto", generateButtonSvgDataUrl("BotonSalto"), {
        behaviors: [
          {
            name: "Anclar",
            type: "AnchorBehavior::AnchorBehavior",
            properties: { anchor: "Right", relativeToWindow: "yes", relativeToBottomLeft: "yes" },
          },
        ],
      }),
    ],
    instances: [
      instance("inst_bg", "obj_bg", 0, 0, 1000, 600, 0),
      instance("inst_ground1", "obj_platform", 20, 510, 440, 40, 1),
      instance("inst_ground2", "obj_platform", 560, 510, 400, 40, 1),
      instance("inst_plat1", "obj_platform", 20, 340, 420, 40, 2),
      instance("inst_plat2", "obj_platform", 400, 380, 150, 40, 2),
      instance("inst_plat3", "obj_platform", 680, 360, 280, 40, 2),
      instance("inst_plat_top1", "obj_platform", 50, 170, 310, 40, 2),
      instance("inst_plat_top2", "obj_platform", 370, 130, 190, 40, 2),
      instance("inst_plat_top3", "obj_platform", 750, 150, 220, 40, 2),
      instance("inst_box1", "obj_box", 280, 470, 40, 40, 2),
      instance("inst_box2", "obj_box", 480, 340, 40, 40, 2),
      instance("inst_box3", "obj_box", 740, 320, 40, 40, 2),
      instance("inst_player", "obj_player", 70, 420, 72, 55, 5),
      instance("inst_slime1", "obj_slime", 320, 440, 52, 44, 4),
      instance("inst_slime2", "obj_slime", 720, 290, 52, 44, 4),
      instance("inst_slime3", "obj_slime", 220, 270, 52, 44, 4),
      instance("inst_coin1", "obj_coin", 70, 280, 34, 34, 3),
      instance("inst_coin2", "obj_coin", 100, 280, 34, 34, 3),
      instance("inst_coin3", "obj_coin", 130, 280, 34, 34, 3),
      instance("inst_coin4", "obj_coin", 270, 420, 34, 34, 3),
      instance("inst_coin5", "obj_coin", 300, 390, 34, 34, 3),
      instance("inst_coin6", "obj_coin", 330, 360, 34, 34, 3),
      instance("inst_coin7", "obj_coin", 450, 70, 34, 34, 3),
      instance("inst_coin8", "obj_coin", 475, 70, 34, 34, 3),
      instance("inst_coin9", "obj_coin", 810, 290, 34, 34, 3),
      instance("inst_coin10", "obj_coin", 840, 290, 34, 34, 3),
      {
        ...instance("inst_score", "obj_score", 16, 12, 200, 34, 10),
        layer: "Interfaz",
      },
      {
        ...instance("inst_btn_left", "obj_btn_left", 24, 510, 64, 64, 10),
        layer: "Interfaz",
      },
      {
        ...instance("inst_btn_right", "obj_btn_right", 104, 510, 64, 64, 10),
        layer: "Interfaz",
      },
      {
        ...instance("inst_btn_jump", "obj_btn_jump", 712, 510, 64, 64, 10),
        layer: "Interfaz",
      },
    ],
    variables: [
      num("Puntos", "0"),
      num("Nivel", "1"),
      text("mensaje", "¡Buena suerte!"),
      {
        name: "Jugador",
        type: "structure",
        value: "",
        children: [num("vida", "3"), text("nombre", "Nexus"), num("monedas", "0")],
      },
    ],
    groups: [
      { name: "Enemigos", objects: ["Slime"], behaviors: [] },
      { name: "Coleccionables", objects: ["Moneda"], behaviors: [] },
    ],
    events: levelOneEvents(),
  });
}

function instance(
  id: string,
  objectId: string,
  x: number,
  y: number,
  width: number,
  height: number,
  zOrder: number,
) {
  return {
    id,
    objectId,
    x,
    y,
    angle: 0,
    width,
    height,
    zOrder,
    layer: "Base layer",
    locked: false,
    hiddenAtStart: false,
    customSize: true,
    variables: [],
    effects: [],
  };
}

/** Event sheet, written the way GDevelop's platformer example does it. */
function levelOneEvents(): GDEvent[] {
  return [
    comment("CONFIGURACIÓN INICIAL", "255;230;109", "0;0;0"),
    event({
      conditions: [ins("BuiltinCommonInstructions::Once")],
      actions: [
        ins("ModVarScene", { variable: "Puntos", op: "set to", value: "0" }),
        ins("TXT::SetText", {
          object: "TextoPuntos",
          text: '"Puntos: " + ToString(Variable(Puntos))',
        }),
        ins("Montre", { object: "Jugador" }),
      ],
    }),
    comment("CONTROLES TÁCTILES MÓVILES", "255;230;109", "0;0;0"),
    event({
      conditions: [
        ins("SourisSurObjet", { object: "BotonIzquierda" }),
        ins("SourisBouton", { button: "Left" }),
      ],
      actions: [
        ins("PlatformBehavior::SimulateControl", {
          object: "Jugador",
          behavior: "PlataformaCharacter",
          key: "Left",
          pressed: "yes",
        }),
        ins("ChangeAnimationName", { object: "Jugador", animation: '"correr"' }),
        ins("FlipX", { object: "Jugador", flip: "yes" }),
      ],
    }),
    event({
      conditions: [
        ins("SourisSurObjet", { object: "BotonDerecha" }),
        ins("SourisBouton", { button: "Left" }),
      ],
      actions: [
        ins("PlatformBehavior::SimulateControl", {
          object: "Jugador",
          behavior: "PlataformaCharacter",
          key: "Right",
          pressed: "yes",
        }),
        ins("ChangeAnimationName", { object: "Jugador", animation: '"correr"' }),
        ins("FlipX", { object: "Jugador", flip: "no" }),
      ],
    }),
    event({
      conditions: [
        ins("SourisSurObjet", { object: "BotonSalto" }),
        ins("SourisBouton", { button: "Left" }),
      ],
      actions: [
        ins("PlatformBehavior::SimulateControl", {
          object: "Jugador",
          behavior: "PlataformaCharacter",
          key: "Jump",
          pressed: "yes",
        }),
        ins("ChangeAnimationName", { object: "Jugador", animation: '"saltar"' }),
      ],
    }),
    comment("MOVIMIENTO DEL JUGADOR", "255;230;109", "0;0;0"),
    event({
      conditions: [ins("KeyPressed", { key: "Right" })],
      actions: [
        ins("PlatformBehavior::SimulateControl", {
          object: "Jugador",
          behavior: "PlataformaCharacter",
          key: "Right",
          pressed: "yes",
        }),
        ins("ChangeAnimationName", { object: "Jugador", animation: '"correr"' }),
        ins("FlipX", { object: "Jugador", flip: "no" }),
      ],
    }),
    event({
      conditions: [ins("KeyNotPressed", { key: "Right" })],
      actions: [
        ins("PlatformBehavior::SimulateControl", {
          object: "Jugador",
          behavior: "PlataformaCharacter",
          key: "Right",
          pressed: "no",
        }),
      ],
    }),
    event({
      conditions: [ins("KeyPressed", { key: "Left" })],
      actions: [
        ins("PlatformBehavior::SimulateControl", {
          object: "Jugador",
          behavior: "PlataformaCharacter",
          key: "Left",
          pressed: "yes",
        }),
        ins("ChangeAnimationName", { object: "Jugador", animation: '"correr"' }),
        ins("FlipX", { object: "Jugador", flip: "yes" }),
      ],
    }),
    event({
      conditions: [ins("KeyNotPressed", { key: "Left" })],
      actions: [
        ins("PlatformBehavior::SimulateControl", {
          object: "Jugador",
          behavior: "PlataformaCharacter",
          key: "Left",
          pressed: "no",
        }),
      ],
    }),
    event({
      conditions: [ins("KeyPressed", { key: "Space" })],
      actions: [
        ins("PlatformBehavior::SimulateJumpKey", {
          object: "Jugador",
          behavior: "PlataformaCharacter",
        }),
        ins("ChangeAnimationName", { object: "Jugador", animation: '"saltar"' }),
      ],
    }),
    event({
      conditions: [
        ins("KeyNotPressed", { key: "Right" }),
        ins("KeyNotPressed", { key: "Left" }),
        ins("PlatformBehavior::IsOnFloor", {
          object: "Jugador",
          behavior: "PlataformaCharacter",
        }),
      ],
      actions: [ins("ChangeAnimationName", { object: "Jugador", animation: '"reposo"' })],
    }),
    comment("MONEDAS Y ENEMIGOS", "255;230;109", "0;0;0"),
    event({
      kind: "group",
      groupName: "Recoger monedas",
      groupColor: "#7046EC",
      subEvents: [
        event({
          conditions: [
            ins("Collision", { object: "Jugador", object2: "Moneda", ignoreTouchingEdges: "no" }),
          ],
          actions: [
            ins("Delete", { object: "Moneda" }),
            ins("ModVarScene", { variable: "Puntos", op: "add", value: "1" }),
            ins("TXT::SetText", {
              object: "TextoPuntos",
              text: '"Puntos: " + ToString(Variable(Puntos))',
            }),
            ins("PlaySound", { file: "coin.wav", volume: "100", loop: "no" }),
            ins("ToggleSceneVar", { variable: "empieza", value: "yes" }),
          ],
        }),
      ],
    }),
    event({
      conditions: [ins("TimerRepeated", { timer: "slime_move", seconds: "2" })],
      actions: [ins("AddForceToward", { object: "Slime", target: "Jugador", speed: "60" })],
      subEvents: [
        event({
          conditions: [
            ins("Collision", { object: "Slime", object2: "Jugador", ignoreTouchingEdges: "yes" }),
          ],
          actions: [
            ins("Health::RemoveHealth", {
              object: "Slime",
              behavior: "Salud",
              health: "1",
            }),
            ins("Flash::Flash", { object: "Slime", behavior: "Destello" }),
            ins("PlaySound", { file: "hurt.wav", volume: "80", loop: "no" }),
          ],
        }),
      ],
    }),
    event({
      conditions: [
        ins("KeyPressed", { key: "Down" }),
        ins("Collision", { object: "Jugador", object2: "Slime", ignoreTouchingEdges: "yes" }),
      ],
      actions: [ins("Delete", { object: "Jugador" }), ins("ChangeScene", { scene: "Menú" })],
    }),
  ];
}

function menuScene(): GDScene {
  return makeScene("Menú", {
    backgroundColor: "29;29;38",
    grid: { ...makeScene("x").grid, show: false, snap: false },
    objects: [
      {
        id: "obj_title",
        name: "Titulo",
        type: "TextObject::Text",
        text: "NEXUS PLATFORMER",
        textColor: "#FAFAFA",
        textSize: 48,
        bold: true,
        alignment: "center",
        behaviors: [],
        effects: [],
        variables: [],
      },
      {
        id: "obj_hint",
        name: "Ayuda",
        type: "TextObject::Text",
        text: "Pulsa Espacio para jugar",
        textColor: "#C5C5C9",
        textSize: 20,
        behaviors: [],
        effects: [],
        variables: [],
      },
    ],
    instances: [
      instance("inst_title", "obj_title", 120, 240, 560, 60, 1),
      instance("inst_hint", "obj_hint", 240, 340, 320, 30, 2),
    ],
    events: [
      event({
        conditions: [ins("KeyPressed", { key: "Space" })],
        actions: [ins("ChangeScene", { scene: "Level 1" })],
      }),
    ],
  });
}

export function createDemoProject(): GDProject {
  return {
    name: "Mi proyecto de plataformas",
    version: "1.0.0",
    firstLayoutName: "Level 1",
    scenes: [levelOneScene(), menuScene()],
    resources: [
      { name: "player.png", kind: "image", file: "player.png", size: 3.4 },
      { name: "coin.png", kind: "image", file: "coin.png", size: 1.1 },
      { name: "platform.png", kind: "image", file: "platform.png", size: 0.8 },
      { name: "slime.png", kind: "image", file: "slime.png", size: 2.2 },
      { name: "demo_level_bg.jpg", kind: "image", file: "demo_level_bg.jpg", size: 1.5 },
      { name: "coin.wav", kind: "audio", file: "coin.wav", size: 12.4 },
      { name: "hurt.wav", kind: "audio", file: "hurt.wav", size: 18.9 },
      { name: "theme.ogg", kind: "audio", file: "theme.ogg", size: 780.5, alwaysLoaded: true },
      { name: "PressStart2P.ttf", kind: "font", file: "PressStart2P.ttf", size: 45.2 },
    ],
    globalVariables: [
      num("MejorPuntuacion", "128"),
      text("NombreJugador", "Nexus"),
      {
        name: "Opciones",
        type: "structure",
        value: "",
        children: [
          num("musica", "80"),
          num("sonido", "100"),
          { name: "controles", type: "structure", value: "", children: [text("salto", "Space")] },
        ],
      },
    ],
    extensions: [
      {
        name: "Plataformas",
        longName: "Platformer",
        icon: "platform",
        version: "1.5.6",
        loaded: true,
      },
      { name: "Interpolación", longName: "Tween", icon: "tween", version: "1.1.2", loaded: true },
      { name: "Destello", longName: "Flash", icon: "flash", version: "1.0.1", loaded: true },
      { name: "Salud", longName: "Health", icon: "health", version: "1.0.0", loaded: true },
      { name: "Anclar", longName: "Anchor", icon: "anchor", version: "1.0.4", loaded: true },
      { name: "Efectos", longName: "Effects", icon: "effects", version: "1.2.0", loaded: true },
      { name: "Cámara", longName: "Camera", icon: "camera", version: "1.0.0", loaded: true },
    ],
    externalEvents: [
      {
        name: "Sistema de puntuación",
        events: [
          event({
            conditions: [ins("BuiltinCommonInstructions::Once")],
            actions: [
              ins("ModVarGlobal", {
                variable: "MejorPuntuacion",
                op: "max",
                value: "Variable(Puntos)",
              }),
            ],
          }),
        ],
      },
    ],
    externalLayouts: [
      {
        name: "Fila de monedas",
        instances: [
          instance("inst_el_coin1", "obj_coin", 100, 300, 34, 34, 3),
          instance("inst_el_coin2", "obj_coin", 150, 300, 34, 34, 3),
          instance("inst_el_coin3", "obj_coin", 200, 300, 34, 34, 3),
        ],
      },
    ],
    gameSettings: {
      author: "Nexus Studio",
      description: "Un plataformas hecho con Nexus Engine, sin escribir código.",
      version: "1.0.0",
      packageName: "com.nexusengine.platformer",
      orientation: "landscape",
      windowWidth: 800,
      windowHeight: 600,
      useWindowSizeAsBaseSize: true,
      magnification: 1,
      minFPS: 30,
      maxFPS: 65,
      adaptGameResolutionAtRuntime: true,
      scaleMode: "linear",
      windowMode: "default",
      startScene: "Level 1",
      pauseOnLostFocus: false,
      renderOutsideGameArea: false,
      loadingScreen: {
        displayBrandSplash: true,
        minDuration: 0,
        fadeInDuration: 0,
        fadeOutDuration: 0,
        backgroundColor: "#1D1D26",
      },
      watermark: { showOnMobile: false },
      projectUuid: "nexus-demo-0001",
      folderPolicy: "doNotUse",
    },
  };
}
