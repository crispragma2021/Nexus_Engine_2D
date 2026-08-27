import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { INSTRUCTIONS, INSTRUCTION_CATEGORIES } from "@/lib/editor/instructions";

export default defineTool({
  name: "search_instructions",
  title: "Search GDevelop instructions",
  description:
    "Search the catalog of GDevelop-style event conditions and actions by text, kind and category.",
  inputSchema: {
    query: z.string().trim().default("").describe("Free text matched against name and description."),
    kind: z.enum(["condition", "action", "any"]).default("any").describe("Instruction kind filter."),
    category: z
      .string()
      .trim()
      .default("All")
      .describe(`One of: ${INSTRUCTION_CATEGORIES.join(", ")}.`),
    limit: z.number().int().min(1).max(100).default(20),
  },
  outputSchema: {
    count: z.number(),
    items: z.array(
      z.object({
        id: z.string(),
        kind: z.string(),
        category: z.string(),
        name: z.string(),
        description: z.string(),
        sentence: z.string(),
      }),
    ),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ query, kind, category, limit }) => {
    const q = query.toLowerCase();
    const items = INSTRUCTIONS.filter(
      (i) =>
        (kind === "any" || i.kind === kind) &&
        (category === "All" || i.category === category) &&
        (!q || i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)),
    )
      .slice(0, limit)
      .map(({ id, kind: k, category: c, name, description, sentence }) => ({
        id,
        kind: k,
        category: c,
        name,
        description,
        sentence,
      }));

    return {
      content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
      structuredContent: { count: items.length, items },
    };
  },
});
