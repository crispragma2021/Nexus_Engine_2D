import * as React from "react";
import {
  X,
  Search,
  Image as ImageIcon,
  LayoutGrid,
  Square,
  Type,
  Sparkles,
  PenTool,
  Video,
  Grid2x2,
  MousePointerClick,
  CircleDot,
  Boxes,
} from "lucide-react";
import { uid } from "@/lib/editor/data";
import { useEditor } from "@/lib/editor/store";

const TYPES = [
  { name: "Sprite", desc: "Animated object which can be moved and rotated", icon: ImageIcon },
  { name: "Tiled Sprite", desc: "Displays an image repeated over an area", icon: LayoutGrid },
  { name: "Panel Sprite", desc: "Also known as 9-patch, for panels and buttons", icon: Square },
  { name: "Text", desc: "Displays a text on the screen", icon: Type },
  { name: "BBText", desc: "Rich text with formatting tags", icon: Type },
  { name: "Bitmap Text", desc: "Text using a bitmap font", icon: Type },
  { name: "Particle Emitter", desc: "Displays a large number of particles", icon: Sparkles },
  { name: "Shape Painter", desc: "Draw simple shapes on the screen", icon: PenTool },
  { name: "Video", desc: "Displays a video on the screen", icon: Video },
  { name: "Tilemap", desc: "Displays a tile-based map", icon: Grid2x2 },
  { name: "Button", desc: "A clickable button with states", icon: MousePointerClick },
  { name: "Light", desc: "Displays a light on the scene", icon: CircleDot },
  { name: "3D Box", desc: "A 3D box object", icon: Boxes },
];

export function NewObjectDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { dispatch } = useEditor();
  const [query, setQuery] = React.useState("");
  if (!open) return null;

  const list = TYPES.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()));

  const add = (type: string) => {
    const id = uid("obj");
    dispatch({
      type: "addObject",
      object: {
        id,
        name: `New${type.replace(/\s/g, "")}`,
        type,
        behaviors: [],
        variables: [],
        ...(type === "Text" ? { text: "Text", textColor: "#FAFAFA", textSize: 24 } : {}),
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[80vh] w-full max-w-3xl flex-col rounded-lg border border-separator bg-toolbar shadow-2xl">
        <div className="flex items-center justify-between border-b border-separator px-4 py-3">
          <h2 className="text-sm font-semibold">Add a new object</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-elevated hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="border-b border-separator p-3">
          <div className="flex items-center gap-2 rounded bg-elevated px-2 py-1.5">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a new object type"
              className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
        <div className="grid flex-1 grid-cols-1 gap-2 overflow-y-auto p-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((t) => (
            <button
              key={t.name}
              type="button"
              onClick={() => add(t.name)}
              className="flex items-start gap-2.5 rounded border border-separator bg-elevated p-3 text-left transition-colors hover:border-primary hover:bg-selection"
            >
              <t.icon className="mt-0.5 h-5 w-5 shrink-0 text-link" />
              <span>
                <span className="block text-[13px] font-medium">{t.name}</span>
                <span className="mt-0.5 block text-[11.5px] leading-snug text-muted-foreground">
                  {t.desc}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
