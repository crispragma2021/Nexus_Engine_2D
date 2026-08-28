// Server-only Google Drive helpers (per app user, through the connector gateway).
import { callAsAppUser } from "@/integrations/lovable/appUserConnector";

export const GATEWAY_BASE_URL = "https://connector-gateway.lovable.dev";
export const DRIVE_CONNECTOR_ID = "google_drive";
export const DRIVE_FOLDER_NAME = "Mis juegos - Studio";
const FILE_SUFFIX = ".studio.json";

export interface DriveProjectFile {
  id: string;
  name: string;
  modifiedTime: string;
}

async function driveFetch(
  connectionAPIKey: string,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const res = await callAsAppUser({
    gatewayBaseUrl: GATEWAY_BASE_URL,
    connectionAPIKey,
    connectorId: DRIVE_CONNECTOR_ID,
    path,
    ...(init ? { init } : {}),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`[drive] request failed [${res.status}] ${path}: ${body}`);
    throw new Error(`Google Drive respondió ${res.status}: ${body.slice(0, 300)}`);
  }
  return res;
}

export async function getDriveUserEmail(connectionAPIKey: string): Promise<string | null> {
  const res = await driveFetch(connectionAPIKey, "/drive/v3/about?fields=user(emailAddress)");
  const json = (await res.json()) as { user?: { emailAddress?: string } };
  return json.user?.emailAddress ?? null;
}

export async function ensureProjectsFolder(connectionAPIKey: string): Promise<string> {
  const q = encodeURIComponent(
    `mimeType='application/vnd.google-apps.folder' and name='${DRIVE_FOLDER_NAME}' and trashed=false`,
  );
  const res = await driveFetch(connectionAPIKey, `/drive/v3/files?q=${q}&fields=files(id,name)`);
  const json = (await res.json()) as { files?: Array<{ id: string }> };
  const existing = json.files?.[0]?.id;
  if (existing) return existing;

  const created = await driveFetch(connectionAPIKey, "/drive/v3/files?fields=id", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: DRIVE_FOLDER_NAME,
      mimeType: "application/vnd.google-apps.folder",
    }),
  });
  const createdJson = (await created.json()) as { id: string };
  return createdJson.id;
}

export async function listDriveProjectFiles(
  connectionAPIKey: string,
): Promise<DriveProjectFile[]> {
  const folderId = await ensureProjectsFolder(connectionAPIKey);
  const q = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
  const res = await driveFetch(
    connectionAPIKey,
    `/drive/v3/files?q=${q}&orderBy=modifiedTime desc&fields=files(id,name,modifiedTime)`,
  );
  const json = (await res.json()) as { files?: DriveProjectFile[] };
  return (json.files ?? []).map((f) => ({
    ...f,
    name: f.name.endsWith(FILE_SUFFIX) ? f.name.slice(0, -FILE_SUFFIX.length) : f.name,
  }));
}

export async function readDriveProjectFile(
  connectionAPIKey: string,
  fileId: string,
): Promise<string> {
  const res = await driveFetch(connectionAPIKey, `/drive/v3/files/${fileId}?alt=media`);
  return res.text();
}

export async function writeDriveProjectFile(
  connectionAPIKey: string,
  params: { fileId?: string; name: string; content: string },
): Promise<DriveProjectFile> {
  const fileName = `${params.name}${FILE_SUFFIX}`;
  const boundary = `studio${Math.random().toString(36).slice(2)}`;
  const metadata: Record<string, unknown> = { name: fileName };
  if (!params.fileId) {
    metadata['parents'] = [await ensureProjectsFolder(connectionAPIKey)];
  }

  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n` +
    `${params.content}\r\n--${boundary}--`;

  const path = params.fileId
    ? `/upload/drive/v3/files/${params.fileId}?uploadType=multipart&fields=id,name,modifiedTime`
    : `/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime`;

  const res = await driveFetch(connectionAPIKey, path, {
    method: params.fileId ? "PATCH" : "POST",
    headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
    body,
  });
  const json = (await res.json()) as DriveProjectFile;
  return { ...json, name: params.name };
}

export async function deleteDriveProjectFile(
  connectionAPIKey: string,
  fileId: string,
): Promise<void> {
  await driveFetch(connectionAPIKey, `/drive/v3/files/${fileId}`, { method: "DELETE" });
}
