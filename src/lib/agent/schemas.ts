// Small payload-validation primitives shared by the agent tool registry.
// Kept dependency-free so the modules that use it stay importable under
// plain Node (tests + conformance) without Vite asset resolution.

export const MAX_NAME_LENGTH = 80;
export const MAX_TEXT_LENGTH = 2_000;
export const MAX_COORDINATE = 1_000_000;
export const MAX_DIMENSION = 100_000;

/** Rejects control characters that would corrupt the project JSON. */
export function hasDisallowedControlCharacters(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code <= 8 || code === 11 || code === 12 || (code >= 14 && code <= 31) || code === 127) {
      return true;
    }
  }
  return false;
}

/** Validates a user/agent supplied name and returns a friendly error or null. */
export function safeName(
  value: unknown,
  label: string,
  maxLength: number = MAX_NAME_LENGTH,
): string | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return `El ${label} propuesto no es válido.`;
  }
  const name = value.trim();
  if (name.length > maxLength) {
    return `El ${label} no puede superar ${maxLength} caracteres.`;
  }
  if (hasDisallowedControlCharacters(name)) {
    return `El ${label} propuesto contiene caracteres no válidos.`;
  }
  return null;
}

/** Validates text content (object text, scene descriptions…). */
export function safeText(value: unknown, label: string, maxLength: number): string | null {
  if (typeof value !== "string" || value.length > maxLength) {
    return `El ${label} propuesto no es válido.`;
  }
  if (hasDisallowedControlCharacters(value)) {
    return `El ${label} propuesto contiene caracteres no válidos.`;
  }
  return null;
}

/** Finite number inside a closed range. */
export function inRange(value: unknown, label: string, min: number, max: number): boolean {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

/** GDevelop "R;G;B" scene color, e.g. "230;235;255". */
export function isGDevelopColor(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const parts = value.split(";");
  return (
    parts.length === 3 &&
    parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) >= 0 && Number(part) <= 255)
  );
}

/** "#RRGGBB" hex color. */
export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}
