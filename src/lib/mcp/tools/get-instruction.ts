import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { instructionById } from "@/lib/editor/instructions";

export default defineTool({
  name: "get_instruction",
  title: "Get instruction details",
  description:
    "Return the full definition of one condition or action, including its sentence template and typed parameters.",
  inputSchema: { id: z.string().trim().min(1).describe("Instruction id, e.g. 'sprite.collision'.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ id }) => {
    const def = instructionById(id);
    if (!def) throw new ToolError(`No instruction with id "${id}".`);
    return {
      content: [{ type: "text", text: JSON.stringify(def, null, 2) }],
      structuredContent: { instruction: def },
    };
  },
});
