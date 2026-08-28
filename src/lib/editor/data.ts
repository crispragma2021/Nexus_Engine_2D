// Demo project — the equivalent of GDevelop's "Platformer" example, expressed with
// the same model the editor edits (animations + frames + points, behaviors with
// properties, layers with camera and effects, groups, external layouts).

import { DEFAULT_GRID } from "./types";
import type { GDEvent, GDInstruction, GDObjectDef, GDProject, GDScene, GDVariable } from "./types";
import { makeScene } from "./scenes";
import { uid } from "./ids";

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

function playerObject(): GDObjectDef {
  return {
    id: "obj_player",
    name: "Jugador",
    type: "Sprite",
    asset: "player.png",
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
            image: "player.png",
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
            image: "player.png",
            originX: 0,
            originY: 0,
            centerX: 0.5,
            centerY: 0.5,
            opacity: 255,
          },
          {
            image: "slime.png",
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
            image: "player.png",
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
      playerObject(),
      {
        id: "obj_platform",
        name: "Plataforma",
        type: "TiledSpriteObject::TiledSprite",
        asset: "platform.png",
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
      simpleSprite("obj_coin", "Moneda", "coin.png", {
        behaviors: [
          {
            name: "Interpolación",
            type: "Tween::TweenBehavior",
            properties: { tweenName: "0" },
          },
        ],
        variables: [num("valor", "1")],
      }),
      simpleSprite("obj_slime", "Slime", "slime.png", {
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
          {
            name: "Plataforma",
            type: "PlatformBehavior::PlatformBehavior",
            properties: { platformType: "Normal platform", canBeGrabbed: "no", yGrabOffset: "0" },
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
        textColor: "#1D1D26",
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
    ],
    instances: [
      instance("inst_ground1", "obj_platform", 0, 520, 832, 80, 1),
      instance("inst_plat1", "obj_platform", 180, 400, 160, 32, 2),
      instance("inst_plat2", "obj_platform", 460, 320, 160, 32, 2),
      instance("inst_plat3", "obj_platform", 640, 420, 128, 32, 2),
      instance("inst_player", "obj_player", 90, 430, 72, 55, 5),
      instance("inst_coin1", "obj_coin", 220, 350, 34, 34, 3),
      instance("inst_coin2", "obj_coin", 500, 270, 34, 34, 3),
      instance("inst_coin3", "obj_coin", 680, 370, 34, 34, 3),
      instance("inst_coin4", "obj_coin", 560, 470, 34, 34, 3),
      instance("inst_slime1", "obj_slime", 380, 470, 52, 44, 4),
      instance("inst_slime2", "obj_slime", 660, 470, 52, 44, 4),
      {
        ...instance("inst_score", "obj_score", 16, 12, 200, 34, 10),
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
