import { storageKey } from "@/lib/editor/brand";
import type { GDProject } from "@/lib/editor/types";

const LIST_KEY = storageKey("projects");
const CURRENT_KEY = storageKey("current-project");
const LEGACY_LIST_KEYS = ["studio:projects", "gdevelop:projects"];
const LEGACY_CURRENT_KEYS = ["studio:current-project", "gdevelop:current-project"];

export class LocalProjectStorageError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "LocalProjectStorageError";
  }
}

export interface LocalProject {
  id: string;
  name: string;
  updatedAt: string;
  project: GDProject;
}

export interface CurrentProjectRef {
  id: string | null;
  project: GDProject;
}

interface StoredCurrentProjectRef {
  id: string | null;
  /** Kept only for unsaved projects and compatibility with the old format. */
  project?: GDProject;
}

function legacyKeysFor(key: string): string[] {
  if (key === LIST_KEY) return LEGACY_LIST_KEYS;
  if (key === CURRENT_KEY) return LEGACY_CURRENT_KEYS;
  return [];
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    let raw = window.localStorage.getItem(key);
    if (raw === null) {
      for (const legacyKey of legacyKeysFor(key)) {
        raw = window.localStorage.getItem(legacyKey);
        if (raw === null) continue;
        try {
          window.localStorage.setItem(key, raw);
        } catch {
          // Reading legacy data is still useful even if migration cannot be persisted.
        }
        break;
      }
    }
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") {
    throw new LocalProjectStorageError("El almacenamiento local no está disponible.");
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (cause) {
    throw new LocalProjectStorageError(
      "No se pudo guardar el proyecto en este dispositivo. Comprueba el espacio disponible.",
      { cause },
    );
  }
}

function newLocalId(): string {
  const suffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  return `loc_${suffix}`;
}

export function listLocalProjects(): LocalProject[] {
  return read<LocalProject[]>(LIST_KEY, []).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function saveLocalProject(input: {
  id?: string | null;
  name: string;
  project: GDProject;
}): LocalProject {
  const all = read<LocalProject[]>(LIST_KEY, []);
  const id = input.id ?? newLocalId();
  const entry: LocalProject = {
    id,
    name: input.name,
    updatedAt: new Date().toISOString(),
    project: input.project,
  };
  const next = [entry, ...all.filter((project) => project.id !== id)];
  write(LIST_KEY, next);
  return entry;
}

export function deleteLocalProject(id: string): void {
  write(
    LIST_KEY,
    read<LocalProject[]>(LIST_KEY, []).filter((project) => project.id !== id),
  );
  const current = read<StoredCurrentProjectRef | null>(CURRENT_KEY, null);
  if (current?.id === id) clearCurrentProject();
}

export function getLocalProject(id: string): LocalProject | undefined {
  return read<LocalProject[]>(LIST_KEY, []).find((project) => project.id === id);
}

export function setCurrentProject(ref: CurrentProjectRef): void {
  // Saved projects are referenced by id so the full document is not duplicated in localStorage.
  const stored: StoredCurrentProjectRef = ref.id
    ? { id: ref.id }
    : { id: null, project: ref.project };
  write(CURRENT_KEY, stored);
}

export function getCurrentProject(): CurrentProjectRef | null {
  const stored = read<StoredCurrentProjectRef | null>(CURRENT_KEY, null);
  if (!stored) return null;
  if (stored.id) {
    const saved = getLocalProject(stored.id);
    if (saved) return { id: saved.id, project: saved.project };
  }
  return stored.project ? { id: stored.id, project: stored.project } : null;
}

export function clearCurrentProject(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CURRENT_KEY);
    for (const legacyKey of LEGACY_CURRENT_KEYS) window.localStorage.removeItem(legacyKey);
  } catch (cause) {
    throw new LocalProjectStorageError("No se pudo cerrar el proyecto local.", { cause });
  }
}
