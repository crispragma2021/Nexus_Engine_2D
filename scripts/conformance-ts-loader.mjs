/**
 * Minimal ESM resolve hook for the headless runtime conformance run.
 *
 * The editor/runtime sources use extensionless relative imports ("./expression"),
 * which Vite resolves but plain Node ESM does not. This hook retries with a
 * ".ts" suffix only when the plain resolution fails and the specifier is a
 * relative import. It is used exclusively by scripts/runtime-conformance.mjs;
 * the app itself is built by Vite and never loads this hook.
 */

export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    if (
      error &&
      error.code === "ERR_MODULE_NOT_FOUND" &&
      (specifier.startsWith("./") || specifier.startsWith("../")) &&
      !specifier.endsWith(".ts") &&
      !specifier.endsWith(".js") &&
      !specifier.endsWith(".json")
    ) {
      return nextResolve(`${specifier}.ts`, context);
    }
    throw error;
  }
}
