import * as React from "react";
import {
  Settings,
  Layers as LayersIcon,
  FileCode2,
  Puzzle,
  Image as ImageIcon,
  ChevronRight,
  ChevronDown,
  Search,
  X,
  Plus,
} from "lucide-react";
import { useEditor } from "@/lib/editor/store";
import { cn } from "@/lib/utils";

interface SectionProps {
  icon: React.ReactNode;
  label: string;
  children?: React.ReactNode;
  defaultOpen?: boolean;
  leaf?: boolean;
}

function Section({ icon, label, children, defaultOpen, leaf }: SectionProps) {
  const [open, setOpen] = React.useState(!!defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => !leaf && setOpen((o) => !o)}
        className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left text-[13px] text-foreground hover:bg-elevated"
      >
        {leaf ? (
          <span className="w-3.5" />
        ) : open ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        <span className="text-link">{icon}</span>
        {label}
      </button>
      {open && children ? <div className="ml-5 border-l border-separator pl-2">{children}</div> : null}
    </div>
  );
}

function Item({ label, active }: { label: string; active?: boolean }) {
  return (
    <div
      className={cn(
        "cursor-pointer rounded px-2 py-1 text-[12.5px] text-muted-foreground hover:bg-elevated hover:text-foreground",
        active && "bg-selection text-foreground",
      )}
    >
      {label}
    </div>
  );
}

export function ProjectManagerDrawer() {
  const { ui, project, dispatch } = useEditor();
  const [query, setQuery] = React.useState("");
  if (!ui.projectManagerOpen) return null;

  const close = () => dispatch({ type: "ui", patch: { projectManagerOpen: false } });

  return (
    <div className="fixed inset-0 z-50 flex">
      <aside className="flex h-full w-72 flex-col border-r border-separator bg-toolbar shadow-2xl">
        <div className="flex h-11 items-center justify-between border-b border-separator px-3">
          <span className="text-[13px] font-semibold">Project manager</span>
          <button
            type="button"
            aria-label="Close project manager"
            onClick={close}
            className="rounded p-1 text-muted-foreground hover:bg-elevated hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-separator p-2">
          <div className="flex items-center gap-2 rounded bg-elevated px-2 py-1.5">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search in project"
              className="w-full bg-transparent text-[12.5px] outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-1">
          <Section icon={<Settings className="h-4 w-4" />} label="Game settings" />
          <Section icon={<LayersIcon className="h-4 w-4" />} label="Scenes" defaultOpen>
            {project.scenes.map((s) => (
              <Item key={s} label={s} active={s === "Level 1"} />
            ))}
            <button
              type="button"
              className="flex items-center gap-1 px-2 py-1 text-[12.5px] text-link hover:text-link-hover"
            >
              <Plus className="h-3 w-3" /> Add a new scene
            </button>
          </Section>
          <Section icon={<LayersIcon className="h-4 w-4" />} label="External layouts" />
          <Section icon={<FileCode2 className="h-4 w-4" />} label="External events" />
          <Section icon={<Puzzle className="h-4 w-4" />} label="Extensions" defaultOpen>
            {project.extensions.map((e) => (
              <Item key={e} label={e} />
            ))}
          </Section>
          <Section icon={<ImageIcon className="h-4 w-4" />} label="Resources" defaultOpen>
            {project.objects
              .filter((o) => o.asset)
              .map((o) => (
                <Item key={o.id} label={`${o.name.toLowerCase()}.png`} />
              ))}
          </Section>
        </div>
      </aside>
      <div className="flex-1 bg-black/50" onClick={close} />
    </div>
  );
}
