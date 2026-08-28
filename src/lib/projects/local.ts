import type { GDProject } from "@/lib/editor/types";

const LIST_KEY = "studio:projects";
const CURRENT_KEY = "studio:current-project";

export interface LocalProject {
  id: string;
  name: string;
  updatedAt: string;
  driveFileId?: string;
  project: GDProject;
}

export interface CurrentProjectRef {
  id: string | null;
  driveFileId?: string;
  project: GDProject;
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* cuota llena: ignoramos */
  }
}

export function listLocalProjects(): LocalProject[] {
  return read<LocalProject[]>(LIST_KEY, []).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}

export function saveLocalProject(input: {
  id?: string | null;
  name: string;
  project: GDProject;
  driveFileId?: string;
}): LocalProject {
  const all = read<LocalProject[]>(LIST_KEY, []);
  const id = input.id ?? `loc_${Date.now().toString(36)}`;
  const entry: LocalProject = {
    id,
    name: input.name,
    updatedAt: new Date().toISOString(),
    ...(input.driveFileId ? { driveFileId: input.driveFileId } : {}),
    project: input.project,
  };
  const next = [entry, ...all.filter((p) => p.id !== id)];
  write(LIST_KEY, next);
  return entry;
}

export function deleteLocalProject(id: string): void {
  write(
    LIST_KEY,
    read<LocalProject[]>(LIST_KEY, []).filter((p) => p.id !== id),
  );
}

export function getLocalProject(id: string): LocalProject | undefined {
  return read<LocalProject[]>(LIST_KEY, []).find((p) => p.id === id);
}

export function setCurrentProject(ref: CurrentProjectRef): void {
  write(CURRENT_KEY, ref);
}

export function getCurrentProject(): CurrentProjectRef | null {
  return read<CurrentProjectRef | null>(CURRENT_KEY, null);
}

export function clearCurrentProject(): void {
  if (typeof window !== "undefined") window.localStorage.removeItem(CURRENT_KEY);
}
