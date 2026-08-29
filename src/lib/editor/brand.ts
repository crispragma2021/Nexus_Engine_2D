// Brand single-source of truth for Nexus Engine.
//
// The UI is a faithful clone of GDevelop 5's editor (layout, density, colors,
// interactions) but the product identity — name, links, storage keys, splash —
// is ours. Change it here, never inside a component.

export const BRAND = {
  name: "Nexus Engine",
  legalName: "Nexus Engine Studio",
  tagline: "Motor de juegos 2D para crear y publicar",
  /** Same purple ramp GDevelop uses, kept as a token so it can be re-skinned. */
  accent: "#7046EC",
  accentDark: "#4F28CD",
  docsUrl: "https://nexusengine.dev/docs",
  communityUrl: "https://nexusengine.dev/community",
  translateUrl: "https://nexusengine.dev/translate",
  assetStoreUrl: "https://nexusengine.dev/assets",
  /** Shown by the runtime on the loading screen, like GDevelop's splash. */
  splashLabel: "Creado con Nexus Engine",
  /** localStorage prefix; `gdevelop:` is still read once and migrated. */
  storagePrefix: "nexus-engine:",
  copyright: "© Nexus Engine",
} as const;

export const storageKey = (key: string) => `${BRAND.storagePrefix}${key}`;

/** Reads a value written under the previous (legacy) brand prefix, once. */
export function readLegacyStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const fresh = window.localStorage.getItem(storageKey(key));
    if (fresh !== null) return fresh;
    const legacy = window.localStorage.getItem(`gdevelop:${key}`);
    if (legacy !== null) window.localStorage.setItem(storageKey(key), legacy);
    return legacy;
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(key), value);
  } catch {
    /* cuota llena */
  }
}

/** Nexus Engine replaces the "made with GDevelop" watermark/splash toggles. */
export const SPLASH_COLORS = ["#1D1D26", "#25252E", "#000000"] as const;
