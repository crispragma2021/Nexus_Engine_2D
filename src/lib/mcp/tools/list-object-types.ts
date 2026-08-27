import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

const TYPES = [
  { name: "Sprite", description: "Animated object with frames, points and collision masks." },
  { name: "Tiled Sprite", description: "Image repeated over a surface, ideal for backgrounds." },
  { name: "Panel Sprite", description: "9-patch image that scales without deforming its borders." },
  { name: "Text", description: "Displays a text with a font, size and color." },
  { name: "BBText", description: "Rich text supporting BBCode markup." },
  { name: "Bitmap Text", description: "Text rendered from a bitmap font atlas." },
  { name: "Particle Emitter", description: "Emits particles for fire, smoke or explosions." },
  { name: "Shape Painter", description: "Draws primitive shapes at runtime." },
  { name: "Video", description: "Plays a video file inside the scene." },
  { name: "Tilemap", description: "Tile-based level built from a tileset." },
];

export default defineTool({
  name: "list_object_types",
  title: "List object types",
  description: "List the GDevelop-style object types available in this editor with their descriptions.",
  inputSchema: {
    query: z.string().trim().default("").describe("Optional text filter on the type name."),
  },
  outputSchema: {
    count: z.number(),
    items: z.array(z.object({ name: z.string(), description: z.string() })),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ query }) => {
    const q = query.toLowerCase();
    const items = TYPES.filter((t) => !q || t.name.toLowerCase().includes(q));
    return {
      content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
      structuredContent: { count: items.length, items },
    };
  },
});
