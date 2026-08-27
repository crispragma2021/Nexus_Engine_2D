import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

const TOKENS = {
  window: "#1D1D26",
  toolbar: "#25252E",
  elevated: "#32323B",
  separator: "#494952",
  primary: "#7046EC",
  primaryDark: "#4F28CD",
  link: "#DDD1FF",
  linkHover: "#C9B6FC",
  foreground: "#FAFAFA",
  mutedForeground: "#C5C5C9",
  selection: "#3E4452",
  success: "#45D9A1",
  info: "#6BAFFF",
  warning: "#FFBC57",
  error: "#FF8569",
};

export default defineTool({
  name: "get_theme_tokens",
  title: "Get GDevelop dark theme tokens",
  description:
    "Return the GDevelop 5 dark theme color tokens used by this editor UI, as hex values keyed by role.",
  inputSchema: {
    role: z
      .string()
      .trim()
      .default("")
      .describe("Optional single token role to return, e.g. 'primary'."),
  },
  outputSchema: { tokens: z.record(z.string(), z.string().nullable()) },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ role }) => {
    const tokens = role ? { [role]: TOKENS[role as keyof typeof TOKENS] ?? null } : TOKENS;
    return {
      content: [{ type: "text", text: JSON.stringify(tokens, null, 2) }],
      structuredContent: { tokens },
    };
  },
});
