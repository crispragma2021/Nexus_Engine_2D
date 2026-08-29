import type { GDProject } from "@/lib/editor/types";
import { getCurrentProject, saveLocalProject, setCurrentProject } from "./local";

export interface SaveResult {
  local: true;
}

/** Persiste un proyecto en el dispositivo y actualiza la referencia activa. */
export async function saveProjectEverywhere(project: GDProject): Promise<SaveResult> {
  const current = getCurrentProject();
  const entry = saveLocalProject({
    id: current?.id ?? null,
    name: project.name,
    project,
  });
  setCurrentProject({ id: entry.id, project });
  return { local: true };
}
