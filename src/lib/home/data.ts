// Demo content for the app shell (Learn / Create / Play / Store).

export interface Course {
  id: string;
  title: string;
  description: string;
  level: "Principiante" | "Intermedio" | "Avanzado";
  credits: number;
  progress: number;
  total: number;
  gradient: string;
}

export interface GameCard {
  id: string;
  title: string;
  rating: number;
  gradient: string;
}

export interface Template {
  id: string;
  title: string;
  credits: number;
  gradient: string;
}

export interface AssetPack {
  id: string;
  title: string;
  author: string;
  credits: number;
  kind: "Gratuito" | "Premium" | "Propio";
  view: "Arriba-abajo" | "Vista lateral" | "Isométrico";
  objectType: "Sprite" | "Sprite en mosaico" | "Panel de sprite" | "Modelo 3D" | "Mapa de baldosas";
  gradient: string;
}

export const COURSES: Course[] = [
  {
    id: "c1",
    title: "Curso Esencial del Editor",
    description:
      "Aprende los conceptos básicos del desarrollo de juegos para crear, pulir y publicar tu primer juego casual.",
    level: "Principiante",
    credits: 1000,
    progress: 0,
    total: 15,
    gradient: "from-[#4F28CD] to-[#7046EC]",
  },
  {
    id: "c2",
    title: "Crea un juego 3D de acción",
    description: "Crea tu juego 3D en el que se corre, conduce y lucha contra enemigos.",
    level: "Intermedio",
    credits: 1000,
    progress: 0,
    total: 12,
    gradient: "from-[#0F7B5F] to-[#45D9A1]",
  },
  {
    id: "c3",
    title: "De Cero a Creador",
    description: "Comienza tu viaje como creador de juegos, desde la idea hasta la publicación.",
    level: "Principiante",
    credits: 0,
    progress: 3,
    total: 10,
    gradient: "from-[#8A4B00] to-[#FFBC57]",
  },
];

export const TEMPLATES: Template[] = [
  { id: "t1", title: "FPS 3D Multiplayer", credits: 1000, gradient: "from-[#232336] to-[#4F28CD]" },
  {
    id: "t2",
    title: "Action Platformer Pixel",
    credits: 800,
    gradient: "from-[#3B1D5E] to-[#FF8569]",
  },
  { id: "t3", title: "2D Laner Racer", credits: 750, gradient: "from-[#12303F] to-[#6BAFFF]" },
  { id: "t4", title: "Cards Ranks", credits: 750, gradient: "from-[#2B1436] to-[#C9B6FC]" },
  { id: "t5", title: "Top-down Shooter", credits: 700, gradient: "from-[#1C2B1C] to-[#45D9A1]" },
  { id: "t6", title: "Endless Runner", credits: 650, gradient: "from-[#3A2410] to-[#FFBC57]" },
];

export const RECOMMENDED: GameCard[] = [
  { id: "g1", title: "Rocket Racers", rating: 92, gradient: "from-[#100A20] to-[#4F28CD]" },
  { id: "g2", title: "Wave Defender", rating: 85, gradient: "from-[#0B1520] to-[#6BAFFF]" },
  { id: "g3", title: "Slime Quest", rating: 88, gradient: "from-[#0F2318] to-[#45D9A1]" },
];

export const TOP_GAMES: GameCard[] = [
  { id: "p1", title: "Missiles Game 2D", rating: 91, gradient: "from-[#301020] to-[#FF8569]" },
  { id: "p2", title: "Blue Ball 4 Adventure", rating: 90, gradient: "from-[#101C36] to-[#6BAFFF]" },
  { id: "p3", title: "Astro Miner", rating: 89, gradient: "from-[#26170B] to-[#FFBC57]" },
];

export const IN_DEVELOPMENT: GameCard[] = [
  { id: "d1", title: "Tortol Escape", rating: 0, gradient: "from-[#123047] to-[#6BAFFF]" },
  { id: "d2", title: "Rally X Revenge", rating: 0, gradient: "from-[#3A2A05] to-[#FFBC57]" },
  { id: "d3", title: "Neon Drift", rating: 0, gradient: "from-[#2A0B3A] to-[#C9B6FC]" },
];

export const GENRES = ["Platformer", "Puzzle", "Adventure", "Action", "Minijuegos", "Racing"];

export const ASSET_PACKS: AssetPack[] = [
  {
    id: "a1",
    title: "Pixel Platformer Pack",
    author: "Studio Nova",
    credits: 0,
    kind: "Gratuito",
    view: "Vista lateral",
    objectType: "Sprite",
    gradient: "from-[#2A1B4D] to-[#7046EC]",
  },
  {
    id: "a2",
    title: "Top-down Dungeon Tiles",
    author: "Kenko",
    credits: 450,
    kind: "Premium",
    view: "Arriba-abajo",
    objectType: "Mapa de baldosas",
    gradient: "from-[#0F2A2A] to-[#45D9A1]",
  },
  {
    id: "a3",
    title: "UI Panel Kit",
    author: "Formo",
    credits: 300,
    kind: "Premium",
    view: "Arriba-abajo",
    objectType: "Panel de sprite",
    gradient: "from-[#2C2410] to-[#FFBC57]",
  },
  {
    id: "a4",
    title: "Iso City Blocks",
    author: "Hexa",
    credits: 600,
    kind: "Premium",
    view: "Isométrico",
    objectType: "Sprite en mosaico",
    gradient: "from-[#101E33] to-[#6BAFFF]",
  },
  {
    id: "a5",
    title: "Mis sprites del proyecto",
    author: "Tú",
    credits: 0,
    kind: "Propio",
    view: "Vista lateral",
    objectType: "Sprite",
    gradient: "from-[#2E1220] to-[#FF8569]",
  },
  {
    id: "a6",
    title: "Low-poly Props",
    author: "Volu",
    credits: 800,
    kind: "Premium",
    view: "Isométrico",
    objectType: "Modelo 3D",
    gradient: "from-[#1D1030] to-[#C9B6FC]",
  },
];
