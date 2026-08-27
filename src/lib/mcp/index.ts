import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchInstructions from "./tools/search-instructions";
import getInstruction from "./tools/get-instruction";
import listObjectTypes from "./tools/list-object-types";
import getThemeTokens from "./tools/get-theme-tokens";

const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "gdevelop-design-guru",
  title: "GDevelop Design Guru",
  version: "0.1.0",
  instructions:
    "Reference tools for a GDevelop 5-style game editor UI: search the condition/action catalog, inspect one instruction's parameters, list object types, and read the dark theme color tokens.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchInstructions, getInstruction, listObjectTypes, getThemeTokens],
});

