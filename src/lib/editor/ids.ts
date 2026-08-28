// Id generation for the in-memory project model (GDevelop relies on names for
// objects/layers, ids only for instances, so ids stay cheap and local).

let counter = 0;

export const uid = (prefix: string) =>
  `${prefix}_${++counter}_${Math.floor(Math.random() * 1e6).toString(36)}`;

/** GDevelop's `newNameGenerator`: "NewObject", "NewObject2", "NewObject3"… */
export function newNameGenerator(base: string, taken: string[]): string {
  const clean = base.replace(/[0-9]+$/, "");
  if (!taken.includes(clean)) return clean;
  for (let i = 2; ; i++) {
    const candidate = `${clean}${i}`;
    if (!taken.includes(candidate)) return candidate;
  }
}
