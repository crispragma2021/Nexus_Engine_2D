import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { HardDrive, Loader2, RefreshCw, Trash2 } from "lucide-react";
import {
  deleteLocalProject,
  listLocalProjects,
  setCurrentProject,
  type LocalProject,
} from "@/lib/projects/local";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("es", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export function ProjectsSection() {
  const navigate = useNavigate();
  const [local, setLocal] = useState<LocalProject[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLocal(listLocalProjects());
  }, []);

  const refresh = () => {
    setBusy(true);
    setLocal(listLocalProjects());
    window.setTimeout(() => setBusy(false), 180);
  };

  const openLocalProject = async (project: LocalProject) => {
    setCurrentProject({ id: project.id, project: project.project });
    await navigate({ to: "/editor" });
  };

  return (
    <section className="mt-7 rounded-lg border border-separator bg-toolbar p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-foreground">Mis proyectos</h2>
        <button
          type="button"
          onClick={refresh}
          aria-label="Actualizar proyectos"
          className="p-2 text-muted-foreground"
        >
          {busy ? <Loader2 className="size-5 animate-spin" /> : <RefreshCw className="size-5" />}
        </button>
      </div>

      <div className="mt-3 rounded-md border border-separator bg-elevated p-3">
        <div className="flex items-center gap-2">
          <HardDrive className="size-5 text-[#45D9A1]" />
          <p className="flex-1 text-sm text-foreground">
            Tus proyectos se guardan de forma segura en este dispositivo.
          </p>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
          <HardDrive className="size-4" /> En este dispositivo
        </h3>
        {local.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Aún no guardaste juegos localmente.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {local.map((project) => (
              <li key={project.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void openLocalProject(project)}
                  className="flex-1 rounded-md border border-separator px-3 py-2 text-left"
                >
                  <span className="block text-sm font-semibold text-foreground">
                    {project.name}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {formatDate(project.updatedAt)}
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={`Eliminar ${project.name} del dispositivo`}
                  onClick={() => {
                    deleteLocalProject(project.id);
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
