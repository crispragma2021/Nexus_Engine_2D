import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Cloud, CloudOff, HardDrive, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { connectGoogleDrive } from "@/lib/projects/driveClient";
import {
  deleteDriveProject,
  disconnectDrive,
  getDriveStatus,
  listDriveProjects,
  loadDriveProject,
} from "@/lib/drive.functions";
import {
  deleteLocalProject,
  listLocalProjects,
  setCurrentProject,
  type LocalProject,
} from "@/lib/projects/local";
import type { GDProject } from "@/lib/editor/types";

interface DriveFile {
  id: string;
  name: string;
  modifiedTime: string;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("es", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export function ProjectsSection() {
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState(false);
  const [status, setStatus] = useState<{ connected: boolean; email: string | null } | null>(null);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [local, setLocal] = useState<LocalProject[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setSignedIn(Boolean(session)),
    );
    setLocal(listLocalProjects());
    return () => sub.subscription.unsubscribe();
  }, []);

  const refreshDrive = useCallback(async () => {
    if (!signedIn) {
      setStatus(null);
      setFiles([]);
      return;
    }
    setBusy(true);
    try {
      const s = await getDriveStatus();
      setStatus(s);
      setFiles(s.connected ? (await listDriveProjects()).files : []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo leer Google Drive");
    } finally {
      setBusy(false);
    }
  }, [signedIn]);

  useEffect(() => {
    void refreshDrive();
  }, [refreshDrive]);

  const onConnect = async () => {
    setBusy(true);
    try {
      await connectGoogleDrive();
      toast.success("Google Drive conectado");
      await refreshDrive();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo conectar Google Drive");
    } finally {
      setBusy(false);
    }
  };

  const onDisconnect = async () => {
    setBusy(true);
    try {
      await disconnectDrive();
      toast.success("Google Drive desconectado");
      await refreshDrive();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo desconectar");
    } finally {
      setBusy(false);
    }
  };

  const openDriveProject = async (file: DriveFile) => {
    setBusy(true);
    try {
      const { content } = await loadDriveProject({ data: { fileId: file.id } });
      const project = JSON.parse(content) as GDProject;
      setCurrentProject({ id: null, driveFileId: file.id, project });
      await navigate({ to: "/editor" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo abrir el proyecto");
    } finally {
      setBusy(false);
    }
  };

  const openLocalProject = async (p: LocalProject) => {
    setCurrentProject({
      id: p.id,
      ...(p.driveFileId ? { driveFileId: p.driveFileId } : {}),
      project: p.project,
    });
    await navigate({ to: "/editor" });
  };

  return (
    <section className="mt-7 rounded-lg border border-separator bg-toolbar p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-foreground">Mis proyectos</h2>
        <button
          type="button"
          onClick={() => {
            setLocal(listLocalProjects());
            void refreshDrive();
          }}
          aria-label="Actualizar proyectos"
          className="p-2 text-muted-foreground"
        >
          {busy ? <Loader2 className="size-5 animate-spin" /> : <RefreshCw className="size-5" />}
        </button>
      </div>

      <div className="mt-3 rounded-md border border-separator bg-elevated p-3">
        {!signedIn ? (
          <p className="text-sm text-muted-foreground">
            Inicia sesión para guardar tus juegos en tu cuenta de Google Drive.
          </p>
        ) : status?.connected ? (
          <div className="flex flex-wrap items-center gap-2">
            <Cloud className="size-5 text-[#45D9A1]" />
            <span className="flex-1 text-sm text-foreground">
              Drive conectado{status.email ? ` · ${status.email}` : ""}
            </span>
            <button
              type="button"
              onClick={() => void onDisconnect()}
              disabled={busy}
              className="rounded-md border border-separator px-3 py-2 text-sm font-semibold text-foreground disabled:opacity-50"
            >
              Desconectar
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <CloudOff className="size-5 text-muted-foreground" />
            <span className="flex-1 text-sm text-foreground">
              Conecta Google Drive para guardar cada proyecto en tu cuenta.
            </span>
            <button
              type="button"
              onClick={() => void onConnect()}
              disabled={busy}
              className="rounded-md bg-primary px-3 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
            >
              Conectar Drive
            </button>
          </div>
        )}
      </div>

      {status?.connected && (
        <div className="mt-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
            <Cloud className="size-4" /> En Drive
          </h3>
          {files.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Todavía no hay juegos en Drive.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {files.map((f) => (
                <li key={f.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void openDriveProject(f)}
                    className="flex-1 rounded-md border border-separator px-3 py-2 text-left"
                  >
                    <span className="block text-sm font-semibold text-foreground">{f.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {formatDate(f.modifiedTime)}
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Eliminar ${f.name} de Drive`}
                    onClick={async () => {
                      try {
                        await deleteDriveProject({ data: { fileId: f.id } });
                        await refreshDrive();
                      } catch (error) {
                        toast.error(
                          error instanceof Error ? error.message : "No se pudo eliminar",
                        );
                      }
                    }}
                    className="p-2 text-muted-foreground"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-4">
        <h3 className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
          <HardDrive className="size-4" /> En este dispositivo
        </h3>
        {local.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Aún no guardaste juegos localmente.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {local.map((p) => (
              <li key={p.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void openLocalProject(p)}
                  className="flex-1 rounded-md border border-separator px-3 py-2 text-left"
                >
                  <span className="block text-sm font-semibold text-foreground">{p.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {formatDate(p.updatedAt)}
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={`Eliminar ${p.name} del dispositivo`}
                  onClick={() => {
                    deleteLocalProject(p.id);
                    setLocal(listLocalProjects());
                  }}
                  className="p-2 text-muted-foreground"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
