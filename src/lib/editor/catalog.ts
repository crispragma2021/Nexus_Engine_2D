// Catalogs that back the pickers: object types, behaviors, effects, resources and
// installed extensions. Names/descriptions mirror GDevelop's official catalogues
// (Extensions/*/JsExtension.js + locales/es_ES) so the dialogs read like the real app.

import playerUrl from "../../assets/player.png";
import coinUrl from "../../assets/coin.png";
import platformUrl from "../../assets/platform.png";
import slimeUrl from "../../assets/slime.png";
import type { GDResource } from "./types";

/** Project files shipped with the sample (GDevelop resolves resources by name). */
export const PROJECT_ASSETS: Record<string, string> = {
  "player.png": playerUrl,
  "coin.png": coinUrl,
  "platform.png": platformUrl,
  "slime.png": slimeUrl,
};

export const resolveAsset = (
  name?: string,
  resources: readonly GDResource[] = [],
): string | undefined => {
  if (!name) return undefined;
  const resource = resources.find((entry) => entry.name === name || entry.file === name);
  if (resource?.url) return resource.url;
  const file = resource?.file || name;
  if (/^(?:data:|blob:|https?:\/\/)/i.test(file)) return file;
  return PROJECT_ASSETS[file] ?? PROJECT_ASSETS[name];
};

export interface ObjectTypeEntry {
  typeId: string;
  name: string;
  description: string;
  /** lucide icon name, see `src/components/editor/gd/icons.tsx` */
  icon: string;
  category: "graphics" | "text" | "utility";
  installable?: boolean;
}

export const OBJECT_TYPES: ObjectTypeEntry[] = [
  {
    typeId: "Sprite",
    name: "Sprite",
    description: "Objeto que puede moverse y rotar, con animaciones",
    icon: "sprite",
    category: "graphics",
  },
  {
    typeId: "TiledSpriteObject::TiledSprite",
    name: "Mosaico",
    description: "Muestra una imagen repetida sobre un área",
    icon: "tiled",
    category: "graphics",
  },
  {
    typeId: "PanelSpriteObject::PanelSprite",
    name: "Sprite de Panel",
    description: "Panel escalable en 9 regiones (nine-patch), ideal para menús",
    icon: "panel",
    category: "graphics",
  },
  {
    typeId: "PrimitiveDrawing::Drawer",
    name: "Pintor de Formas",
    description: "Dibuja formas simples (líneas, círculos, rectángulos) en pantalla",
    icon: "shapes",
    category: "graphics",
  },
  {
    typeId: "SpriteObject::SpriteSheet",
    name: "Hoja de sprites",
    description: "Varias animaciones desde una sola imagen, recortada automáticamente",
    icon: "sheet",
    category: "graphics",
  },
  {
    typeId: "TextObject::Text",
    name: "Texto",
    description: "Muestra un texto en el juego",
    icon: "text",
    category: "text",
  },
  {
    typeId: "BBTextObject::BBText",
    name: "Texto enriquecido (BBCode)",
    description: "Texto con etiquetas de formato: negrita, color, tamaño…",
    icon: "bbtext",
    category: "text",
  },
  {
    typeId: "BitmapTextObject::BitmapText",
    name: "Texto de mapa de bits",
    description: "Texto dibujado con una fuente de imagen (retro / píxel)",
    icon: "bitmap",
    category: "text",
  },
  {
    typeId: "ParticleEmitter",
    name: "Editor de Partículas",
    description: "Muestra una gran cantidad de partículas para efectos visuales",
    icon: "particles",
    category: "graphics",
  },
  {
    typeId: "TileMap",
    name: "Mapa de teselas (Tilemap)",
    description: "Pinta el nivel con un conjunto de teselas",
    icon: "tilemap",
    category: "graphics",
  },
  {
    typeId: "VideoObject::Video",
    name: "Vídeo",
    description: "Reproduce un vídeo en la escena",
    icon: "video",
    category: "graphics",
    installable: true,
  },
  {
    typeId: "Spine",
    name: "Spine",
    description: "Animaciones óseas exportadas desde Spine",
    icon: "spine",
    category: "graphics",
    installable: true,
  },
  {
    typeId: "CustomObject",
    name: "Objeto personalizado",
    description: "Crea tu propio objeto con comportamientos, efectos y eventos",
    icon: "custom",
    category: "utility",
  },
];

/** Legacy-friendly aliases so a project saved with plain names keeps working. */
export const OBJECT_TYPE_ALIASES: Record<string, string> = {
  Sprite: "Sprite",
  "Tiled Sprite": "TiledSpriteObject::TiledSprite",
  Text: "TextObject::Text",
  "Panel Sprite": "PanelSpriteObject::PanelSprite",
  BBText: "BBTextObject::BBText",
  "Bitmap Text": "BitmapTextObject::BitmapText",
  "Shape Painter": "PrimitiveDrawing::Drawer",
  Tilemap: "TileMap",
  Video: "VideoObject::Video",
};

export const objectTypeId = (type: string): string => OBJECT_TYPE_ALIASES[type] ?? type;

export const objectTypeByTypeId = (typeId: string): ObjectTypeEntry | undefined => {
  const id = objectTypeId(typeId);
  return OBJECT_TYPES.find((t) => t.typeId === id) ?? OBJECT_TYPES.find((t) => t.typeId === typeId);
};

export const objectTypeLabel = (type: string): string => objectTypeByTypeId(type)?.name ?? type;

export const isSpriteLike = (type: string): boolean => {
  const id = objectTypeId(type);
  return (
    id === "Sprite" ||
    id === "SpriteObject::SpriteSheet" ||
    id === "TiledSpriteObject::TiledSprite" ||
    id === "PanelSpriteObject::PanelSprite"
  );
};

export const isTextLike = (type: string): boolean => {
  const id = objectTypeId(type);
  return (
    id === "TextObject::Text" ||
    id === "Text" ||
    id === "BBTextObject::BBText" ||
    id === "BitmapTextObject::BitmapText"
  );
};

export interface BehaviorEntry {
  typeId: string;
  name: string;
  description: string;
  icon: string;
  helpPath: string;
  properties: {
    key: string;
    label: string;
    type: "number" | "yesno" | "choices";
    value: string;
    choices?: string[];
  }[];
  /** which runtime capabilities it unlocks (engine reads these) */
  runtime?: "platformer" | "platform" | "anchor" | "flash" | "health" | "tween" | "draggable";
}

export const BEHAVIORS: BehaviorEntry[] = [
  {
    typeId: "PlatformBehavior::PlatformerObjectBehavior",
    name: "Objeto que se desplaza sobre plataformas",
    description:
      "Personaje de plataformas: corre, salta, se desliza por las paredes y cae con gravedad.",
    icon: "platformer",
    helpPath: "/events-behaviors/standard-behaviors/platformer/",
    runtime: "platformer",
    properties: [
      { key: "acceleration", label: "Aceleración", type: "number", value: "800" },
      { key: "maxSpeed", label: "Velocidad máxima", type: "number", value: "250" },
      { key: "friction", label: "Fricción cuando nada la empuja", type: "number", value: "20" },
      { key: "jumpSpeed", label: "Velocidad de salto", type: "number", value: "600" },
      {
        key: "jumpSustain",
        label: "Poder de salto (mantener la tecla)",
        type: "number",
        value: "300",
      },
      {
        key: "canGoDownFromJumpthru",
        label: "Puede bajar por plataformas de un vía",
        type: "yesno",
        value: "yes",
      },
      {
        key: "canGrabPlatforms",
        label: "Puede agarrarse a las plataformas",
        type: "yesno",
        value: "no",
      },
      { key: "gravity", label: "Gravedad", type: "number", value: "1800" },
      { key: "maxFallingSpeed", label: "Velocidad máxima de caída", type: "number", value: "900" },
    ],
  },
  {
    typeId: "PlatformBehavior::PlatformBehavior",
    name: "Plataforma",
    description: "Objeto sólido que puede sostener otros objetos, con plataformas móviles.",
    icon: "platform",
    helpPath: "/events-behaviors/standard-behaviors/platformer/",
    runtime: "platform",
    properties: [
      {
        key: "platformType",
        label: "Tipo de plataforma",
        type: "choices",
        value: "Normal platform",
        choices: ["Normal platform", "Deletable platform", "One-way platform"],
      },
      { key: "canBeGrabbed", label: "Puede ser agarrada", type: "yesno", value: "yes" },
      { key: "yGrabOffset", label: "Compensación de agarre (Y)", type: "number", value: "0" },
    ],
  },
  {
    typeId: "AnchorBehavior::AnchorBehavior",
    name: "Anclar",
    description: "Mantiene el objeto anclado a los bordes de la pantalla al redimensionar.",
    icon: "anchor",
    helpPath: "/events-behaviors/standard-behaviors/anchor/",
    runtime: "anchor",
    properties: [
      { key: "relativeToWindow", label: "Relativo a la ventana", type: "yesno", value: "yes" },
      {
        key: "relativeToBottomLeft",
        label: "Relativo a la esquina inferior izquierda",
        type: "yesno",
        value: "yes",
      },
      {
        key: "anchor",
        label: "Ancla",
        type: "choices",
        value: "All",
        choices: ["Left", "Right", "Top", "Bottom", "All"],
      },
    ],
  },
  {
    typeId: "Flash::Flash",
    name: "Destello",
    description: "Hace parpadear el objeto (útil tras recibir un golpe).",
    icon: "flash",
    helpPath: "/events-behaviors/standard-behaviors/flash/",
    runtime: "flash",
    properties: [
      { key: "flashDuration", label: "Duración del destello (s)", type: "number", value: "0.2" },
      { key: "times", label: "Número de parpadeos", type: "number", value: "5" },
      { key: "halfTimes", label: "Media duración de un parpadeo", type: "number", value: "0.1" },
    ],
  },
  {
    typeId: "Health::Health",
    name: "Salud",
    description: "Puntos de salud (vida), escudo y daño, con acciones y expresiones.",
    icon: "health",
    helpPath: "/extensions/health/",
    runtime: "health",
    properties: [
      { key: "health", label: "Salud", type: "number", value: "100" },
      { key: "maxHealth", label: "Salud máxima", type: "number", value: "100" },
      { key: "minHealth", label: "Salud mínima", type: "number", value: "0" },
      { key: "shield", label: "Escudo", type: "number", value: "0" },
      { key: "invulnerabilityDuration", label: "Invulnerabilidad (s)", type: "number", value: "0" },
    ],
  },
  {
    typeId: "Tween::TweenBehavior",
    name: "Interpolación",
    description: "Mueve objetos en trayectorias con easing durante una duración dada.",
    icon: "tween",
    helpPath: "/events-behaviors/standard-behaviors/tween/",
    runtime: "tween",
    properties: [
      { key: "tweenName", label: "Nombre de la interpolación", type: "number", value: "0" },
    ],
  },
  {
    typeId: "DraggableBehavior::Draggable",
    name: "Arrastrable",
    description: "Permite mover el objeto con el ratón o el dedo.",
    icon: "drag",
    helpPath: "/extensions/drag-drop/",
    runtime: "draggable",
    properties: [
      { key: "canBeDragged", label: "Puede ser arrastrado", type: "yesno", value: "yes" },
      {
        key: "mouseButton",
        label: "Botón del ratón",
        type: "choices",
        value: "Left",
        choices: ["Left", "Right", "Middle"],
      },
    ],
  },
  {
    typeId: "Physics2::Physics2Behavior",
    name: "Motor de física 2.0",
    description: "Simulación realista con cuerpo dinámico, estático o cinemático.",
    icon: "physics",
    helpPath: "/extensions/physics-2-0/",
    properties: [
      {
        key: "bodyType",
        label: "Tipo de cuerpo",
        type: "choices",
        value: "Dynamic",
        choices: ["Dynamic", "Static", "Kinematic"],
      },
      { key: "mass", label: "Masa", type: "number", value: "1" },
      { key: "friction", label: "Fricción", type: "number", value: "0.5" },
      { key: "restitution", label: "Restitución (rebote)", type: "number", value: "0.1" },
      { key: "density", label: "Densidad", type: "number", value: "1" },
    ],
  },
  {
    typeId: "PathfindingBehavior::PathfindingBehavior",
    name: "Personaje con búsqueda de caminos",
    description: "Calcula trayectorias evitando obstáculos en una cuadrícula.",
    icon: "pathfinding",
    helpPath: "/extensions/pathfinding/",
    properties: [
      { key: "speed", label: "Velocidad", type: "number", value: "150" },
      { key: "allowDiagonals", label: "Permitir diagonales", type: "yesno", value: "yes" },
      { key: "cellWidth", label: "Ancho de celda", type: "number", value: "32" },
      { key: "cellHeight", label: "Altura de celda", type: "number", value: "32" },
    ],
  },
];

export const behaviorByTypeId = (typeId: string): BehaviorEntry | undefined =>
  BEHAVIORS.find((b) => b.typeId === typeId);

/** Behavior name as shown in the properties panel (short form). */
export const behaviorShortName = (typeId: string): string => {
  const entry = behaviorByTypeId(typeId);
  if (!entry) return typeId.split("::").pop() ?? typeId;
  if (entry.runtime === "platformer") return "Plataformas (personaje)";
  if (entry.runtime === "platform") return "Plataformas";
  return entry.name;
};

export interface EffectEntry {
  typeId: string;
  name: string;
  description: string;
  parameters: { key: string; label: string; value: string }[];
  /** implemented by the Nexus renderer */
  supported: boolean;
}

export const EFFECTS: EffectEntry[] = [
  {
    typeId: "Tint",
    name: "Tinte",
    description: "Colorea el objeto con un tinte multiplicativo.",
    parameters: [
      { key: "r", label: "Rojo", value: "255" },
      { key: "g", label: "Verde", value: "255" },
      { key: "b", label: "Azul", value: "255" },
    ],
    supported: true,
  },
  {
    typeId: "ColorOverlay",
    name: "Superposición de color",
    description: "Sustituye el color del objeto por uno plano.",
    parameters: [
      { key: "r", label: "Rojo", value: "255" },
      { key: "g", label: "Verde", value: "80" },
      { key: "b", label: "Azul", value: "40" },
      { key: "alpha", label: "Opacidad", value: "255" },
    ],
    supported: true,
  },
  {
    typeId: "Blur",
    name: "Desenfoque (Kawase, rápido)",
    description: "Desenfoque Gaussiano de la imagen renderizada.",
    parameters: [
      { key: "blur", label: "Intensidad del desenfoque", value: "8" },
      { key: "quality", label: "Número de pasadas", value: "1" },
    ],
    supported: true,
  },
  {
    typeId: "DropShadow",
    name: "Sombra paralela",
    description: "Sombra desplazada detrás del objeto.",
    parameters: [
      { key: "blur", label: "Desenfoque de la sombra", value: "2" },
      { key: "distance", label: "Distancia", value: "5" },
      { key: "alpha", label: "Opacidad", value: "0.5" },
      { key: "color", label: "Color de la sombra", value: "#000000" },
    ],
    supported: true,
  },
  {
    typeId: "Outline",
    name: "Contorno",
    description: "Añade un contorno alrededor del objeto.",
    parameters: [
      { key: "thickness", label: "Grosor", value: "1" },
      { key: "color", label: "Color del contorno", value: "#FFFFFF" },
      { key: "alpha", label: "Opacidad", value: "1" },
    ],
    supported: false,
  },
  {
    typeId: "Glow",
    name: "Resplandor",
    description: "Brillo difuso sobre las zonas claras del objeto.",
    parameters: [
      { key: "outerBlur", label: "Desenfoque exterior", value: "2" },
      { key: "innerStrength", label: "Fuerza interior", value: "0.5" },
      { key: "color", label: "Color del resplandor", value: "#FFFFFF" },
    ],
    supported: false,
  },
  {
    typeId: "Pixelate",
    name: "Pixelización",
    description: "Reduce la resolución visible del objeto (efecto retro).",
    parameters: [{ key: "size", label: "Tamaño del píxel", value: "4" }],
    supported: false,
  },
  {
    typeId: "Brightness",
    name: "Brillo",
    description: "Ajusta el brillo de la imagen.",
    parameters: [{ key: "brightness", label: "Brillo", value: "0" }],
    supported: true,
  },
  {
    typeId: "Sepia",
    name: "Sepia",
    description: "Tono sepia sobre el objeto.",
    parameters: [{ key: "amount", label: "Cantidad", value: "1" }],
    supported: true,
  },
  {
    typeId: "BlackAndWhite",
    name: "Blanco y negro",
    description: "Elimina el color del objeto.",
    parameters: [],
    supported: true,
  },
  {
    typeId: "Night",
    name: "Noche",
    description: "Oscurece y enfría los colores (modo noche).",
    parameters: [
      { key: "intensity", label: "Intensidad", value: "0.2" },
      { key: "redTint", label: "Tinte rojo", value: "0.1" },
    ],
    supported: false,
  },
  {
    typeId: "Godray",
    name: "Rayos de luz",
    description: "Rayos volumétricos desde un punto de luz.",
    parameters: [
      { key: "exposure", label: "Exposición", value: "0.01" },
      { key: "decay", label: "Decaimiento", value: "0.95" },
      { key: "density", label: "Densidad", value: "0.5" },
    ],
    supported: false,
  },
];

export const effectByTypeId = (typeId: string): EffectEntry | undefined =>
  EFFECTS.find((e) => e.typeId === typeId);

export interface ResourceKindEntry {
  kind: "image" | "audio" | "font" | "json" | "video";
  name: string;
  description: string;
  icon: string;
  extensions: string;
}

export const RESOURCE_KINDS: ResourceKindEntry[] = [
  {
    kind: "image",
    name: "Imagen",
    description: "PNG, JPG, GIF o WebP para sprites y fondos",
    icon: "image",
    extensions: "*.png, *.jpg, *.jpeg, *.gif, *.webp",
  },
  {
    kind: "audio",
    name: "Audio",
    description: "Efectos de sonido y música (.ogg, .mp3, .m4a)",
    icon: "audio",
    extensions: "*.ogg, *.mp3, *.m4a, *.wav",
  },
  {
    kind: "font",
    name: "Fuente",
    description: "Tipos de letra personalizados (.ttf, .otf, .woff)",
    icon: "font",
    extensions: "*.ttf, *.otf, *.woff, *.woff2",
  },
  {
    kind: "json",
    name: "Archivo JSON",
    description: "Datos estructurados para tu juego",
    icon: "json",
    extensions: "*.json",
  },
  {
    kind: "video",
    name: "Vídeo",
    description: "Clip de vídeo para la escena",
    icon: "video",
    extensions: "*.mp4, *.webm",
  },
];

export const INSTALLED_EXTENSIONS = [
  { name: "Plataformas (platformer)", longName: "Platformer", icon: "platform", version: "1.5.6" },
  { name: "Física 2.0", longName: "Physics Engine 2.0", icon: "physics", version: "1.1.0" },
  { name: "Interpolación (tween)", longName: "Tween", icon: "tween", version: "1.1.2" },
  { name: "Anclar", longName: "Anchor", icon: "anchor", version: "1.0.4" },
  { name: "Destello", longName: "Flash", icon: "flash", version: "1.0.1" },
  { name: "Salud", longName: "Health", icon: "health", version: "1.0.0" },
  { name: "Efectos visuales", longName: "Effects", icon: "effects", version: "1.2.0" },
  { name: "Cámara", longName: "Camera", icon: "camera", version: "1.0.0" },
];

/** Store categories, as in GDevelop's asset store. */
export const STORE_CATEGORIES = [
  { id: "all", name: "Todos" },
  { id: "objects", name: "Objetos" },
  { id: "behaviors", name: "Comportamientos" },
  { id: "effects", name: "Efectos" },
  { id: "resources", name: "Recursos" },
  { id: "examples", name: "Ejemplos" },
  { id: "extensions", name: "Extensiones" },
];

/**
 * Keyboard keys offered by the "Tecla" parameter, following GDevelop's key names
 * (the runtime compares against these strings).
 */
export interface KeyEntry {
  name: string;
  label: string;
}

export const KEYS: KeyEntry[] = [
  ..."abcdefghijklmnopqrstuvwxyz".split("").map((letter) => ({
    name: letter,
    label: letter.toUpperCase(),
  })),
  ...[..."0123456789"].map((digit) => ({ name: digit, label: digit })),
  { name: "Space", label: "Espacio" },
  { name: "Return", label: "Intro" },
  { name: "Numpad0", label: "0 (teclado numérico)" },
  { name: "Numpad1", label: "1 (teclado numérico)" },
  { name: "Numpad2", label: "2 (teclado numérico)" },
  { name: "Escape", label: "Escape" },
  { name: "Tab", label: "Tabulador" },
  { name: "Backspace", label: "Retroceso" },
  { name: "Delete", label: "Supr" },
  { name: "Insert", label: "Insertar" },
  { name: "Home", label: "Inicio" },
  { name: "End", label: "Fin" },
  { name: "PageUp", label: "Re pág" },
  { name: "PageDown", label: "Av pág" },
  { name: "Up", label: "Flecha arriba" },
  { name: "Down", label: "Flecha abajo" },
  { name: "Left", label: "Flecha izquierda" },
  { name: "Right", label: "Flecha derecha" },
  { name: "LShift", label: "Shift izquierdo" },
  { name: "Control", label: "Control" },
  { name: "Alt", label: "Alt" },
  { name: "Comma", label: "Coma" },
  { name: "SemiColon", label: "Punto y coma" },
  { name: "Plus", label: "Más" },
  { name: "Minus", label: "Menos" },
  { name: "Slash", label: "Barra" },
];

export const MOUSE_BUTTONS: KeyEntry[] = [
  { name: "Left", label: "Botón izquierdo" },
  { name: "Right", label: "Botón derecho" },
  { name: "Middle", label: "Botón central" },
];
