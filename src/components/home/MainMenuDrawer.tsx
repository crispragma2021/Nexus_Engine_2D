import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface MenuEntry {
  label: string;
  disabled?: boolean;
  submenu?: boolean;
  divider?: boolean;
  action?: () => void;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasProject: boolean;
  onCreateGame: () => void;
  onPreferences: () => void;
}

export function MainMenuDrawer({
  open,
  onOpenChange,
  hasProject,
  onCreateGame,
  onPreferences,
}: Props) {
  const [section, setSection] = useState<"root" | "file" | "help" | "recent">("root");
  const navigate = useNavigate();

  const close = () => {
    onOpenChange(false);
    setTimeout(() => setSection("root"), 250);
  };

  const fileEntries: MenuEntry[] = [
    {
      label: "Crear un juego",
      action: () => {
        close();
        onCreateGame();
      },
    },
    { label: "Abrir…", action: () => navigate({ to: "/editor" }).then(close) },
    { label: "Abrir recientes", submenu: true, action: () => setSection("recent") },
    { label: "Guardar", disabled: !hasProject, divider: true },
    { label: "Guardar como…", disabled: !hasProject },
    { label: "Mostrar historial de versiones", disabled: !hasProject },
    { label: "Invitar colaboradores", disabled: !hasProject, divider: true },
    { label: "Exportar (web, iOS, Android)…", disabled: !hasProject },
    { label: "Cerrar proyecto", disabled: !hasProject, divider: true },
    {
      label: "Preferencias",
      divider: true,
      action: () => {
        close();
        onPreferences();
      },
    },
  ];

  const helpEntries: MenuEntry[] = [
    { label: "Documentación" },
    { label: "Tutoriales y guías" },
    { label: "Comunidad" },
    { label: "Reportar un problema", divider: true },
    { label: "Acerca de" },
  ];

  const recentEntries: MenuEntry[] = [
    { label: "My platformer project", action: () => navigate({ to: "/editor" }).then(close) },
    { label: "Space shooter (demo)", disabled: true },
    { label: "Puzzle prototype", disabled: true },
  ];

  const renderList = (entries: MenuEntry[]) => (
    <ul className="px-4">
      {entries.map((e) => (
        <li key={e.label} className={cn(e.divider && "border-t border-separator")}>
          <button
            type="button"
            disabled={e.disabled}
            onClick={e.action}
            className={cn(
              "flex w-full items-center justify-between gap-3 py-4 text-left text-base",
              e.disabled
                ? "cursor-default text-muted-foreground/50"
                : "text-foreground active:bg-elevated",
            )}
          >
            <span>{e.label}</span>
            {e.submenu && <ChevronRight className="size-5 text-muted-foreground" />}
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <Sheet open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <SheetContent
        side="left"
        className="w-[82vw] max-w-sm border-separator bg-window p-0 [&>button]:hidden"
      >
        <SheetTitle className="sr-only">Menú</SheetTitle>
        <div className="flex h-14 items-center gap-3 border-b border-separator bg-elevated px-4">
          <Menu className="size-6 text-foreground" />
          <span className="flex-1 text-lg font-semibold text-foreground">Menú</span>
          <button type="button" onClick={close} aria-label="Cerrar menú" className="p-1">
            <X className="size-6 text-foreground" />
          </button>
        </div>

        {section === "root" ? (
          <div className="grid grid-cols-2 divide-x divide-separator border-b border-separator">
            <button
              type="button"
              onClick={() => setSection("file")}
              className="py-4 text-base font-semibold text-foreground active:bg-elevated"
            >
              Archivo
            </button>
            <button
              type="button"
              onClick={() => setSection("help")}
              className="py-4 text-base font-semibold text-foreground active:bg-elevated"
            >
              Ayuda
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setSection(section === "recent" ? "file" : "root")}
            className="flex w-full items-center gap-2 px-4 py-4 text-base font-semibold text-foreground active:bg-elevated"
          >
            <ChevronLeft className="size-5" />
            Atrás
          </button>
        )}

        <div className="h-[calc(100%-7rem)] overflow-y-auto">
          {section === "file" && renderList(fileEntries)}
          {section === "help" && renderList(helpEntries)}
          {section === "recent" && renderList(recentEntries)}
          {section === "root" && (
            <p className="px-6 pt-40 text-center text-base text-muted-foreground">
              Para empezar, abrir o crear un nuevo proyecto.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
