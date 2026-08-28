// Icon registry. GDevelop ships one SVG per object type / behavior / extension
// (UI/CustomSvgIcons + the extension folders); here they are mapped onto lucide
// glyphs and a handful of inline paths so the catalog stays data-driven.

import {
  Accessibility,
  Anchor,
  Boxes,
  Brush,
  Camera,
  Clapperboard,
  Crop,
  Dices,
  Film,
  FileType,
  Frame,
  Gamepad2,
  Grid2x2,
  Grid3x3,
  Heart,
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  LayoutPanelTop,
  Lightbulb,
  MousePointerClick,
  Music,
  PenTool,
  PersonStanding,
  Puzzle,
  RectangleHorizontal,
  Rows3,
  Sparkles,
  SquareStack,
  Spline,
  Timer,
  Type,
  Video,
  Waves,
  Wind,
  Zap,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  sprite: PersonStanding,
  tiled: LayoutGrid,
  panel: LayoutPanelTop,
  shapes: PenTool,
  sheet: Rows3,
  text: Type,
  bbtext: FileType,
  bitmap: Frame,
  particles: Sparkles,
  tilemap: Grid2x2,
  video: Video,
  model3d: Boxes,
  spine: Spline,
  custom: Puzzle,
  image: ImageIcon,
  audio: Music,
  font: Type,
  json: FileType,
  // behaviors
  platformer: PersonStanding,
  platform: RectangleHorizontal,
  anchor: Anchor,
  flash: Zap,
  health: Heart,
  tween: Waves,
  drag: MousePointerClick,
  physics: Dices,
  pathfinding: Accessibility,
  camera: Camera,
  effects: Brush,
  light: Lightbulb,
  grid: Grid3x3,
  timer: Timer,
  layer: Layers,
  layers: Layers,
  gamepad: Gamepad2,
  clapperboard: Clapperboard,
  stack: SquareStack,
  film: Film,
  puzzle: Puzzle,
  wind: Wind,
  crop: Crop,
  cursor: MousePointerClick,
};

export function CatalogIcon({ name, className }: { name: string; className?: string }) {
  const Icon = MAP[name] ?? Puzzle;
  return <Icon className={className} aria-hidden />;
}

/** Object type -> icon key (used by the object list, instances and the sheet). */
export function iconForObjectType(type: string): string {
  if (type === "Sprite") return "sprite";
  if (type.includes("TiledSprite")) return "tiled";
  if (type.includes("PanelSprite")) return "panel";
  if (type.includes("PrimitiveDrawing")) return "shapes";
  if (type.includes("SpriteSheet")) return "sheet";
  if (type.includes("BitmapText")) return "bitmap";
  if (type.includes("BBText")) return "bbtext";
  if (type.includes("Text")) return "text";
  if (type.includes("Particle")) return "particles";
  if (type.includes("TileMap") || type.includes("Tilemap")) return "tilemap";
  if (type.includes("Video")) return "video";
  if (type.includes("Model3D")) return "model3d";
  if (type.includes("Spine")) return "spine";
  return "custom";
}

export const BEHAVIOR_ICON: Record<string, string> = {
  "PlatformBehavior::PlatformerObjectBehavior": "platformer",
  "PlatformBehavior::PlatformBehavior": "platform",
  "AnchorBehavior::AnchorBehavior": "anchor",
  "Flash::Flash": "flash",
  "Health::Health": "health",
  "Tween::TweenBehavior": "tween",
  "DraggableBehavior::Draggable": "drag",
  "Physics2::Physics2Behavior": "physics",
  "PathfindingBehavior::PathfindingBehavior": "pathfinding",
};

/** Instruction category -> icon key, for the instruction selector list. */
export const CATEGORY_ICON: Record<string, string> = {
  adv: "puzzle",
  scene: "clapperboard",
  keyboard: "gamepad",
  mouse: "cursor",
  sprite: "sprite",
  text: "text",
  collision: "crop",
  variables: "stack",
  timers: "timer",
  camera: "camera",
  layers: "layers",
  audio: "audio",
  timescale: "wind",
  platform: "platform",
  tween: "tween",
  flash: "flash",
  health: "health",
  effects: "effects",
};
