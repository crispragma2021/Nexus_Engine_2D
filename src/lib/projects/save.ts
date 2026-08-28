import type { GDProject } from "@/lib/editor/types";
import { getCurrentProject, saveLocalProject, setCurrentProject } from "./local";
import { getDriveStatus, saveDriveProject } from "@/lib/drive.functions";

export interface SaveResult {
  local: true;
  drive: boolean;
  driveError?: string;
}

/** Guarda el proyecto en el dispositivo y, si Drive está conectado, en la cuenta del usuario. */
export async function saveProjectEverywhere(project: GDProject): Promise<SaveResult> {
  const current = getCurrentProject();
  const entry = saveLocalProject({
    id: current?.id ?? null,
    name: project.name,
    project,
    ...(current?.driveFileId ? { driveFileId: current.driveFileId } : {}),
  });

  let driveFileId = current?.driveFileId;
  let drive = false;
  let driveError: string | undefined;

  try {
    const status = await getDriveStatus();
    if (status.connected) {
      const { file } = await saveDriveProject({
        data: {
          ...(driveFileId ? { fileId: driveFileId } : {}),
          name: project.name,
          content: JSON.stringify(project),
        },
      });
      driveFileId = file.id;
      drive = true;
    }
  } catch (error) {
    driveError = error instanceof Error ? error.message : "Error al guardar en Drive";
  }

  setCurrentProject({
    id: entry.id,
    ...(driveFileId ? { driveFileId } : {}),
    project,
  });
  if (driveFileId) saveLocalProject({ id: entry.id, name: project.name, project, driveFileId });

  return { local: true, drive, ...(driveError ? { driveError } : {}) };
}
