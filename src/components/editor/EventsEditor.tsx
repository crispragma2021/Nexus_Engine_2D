import * as React from "react";
import {
  Plus,
  MessageSquare,
  FolderPlus,
  Search,
  Undo2,
  Redo2,
  ChevronDown,
  ChevronRight,
  Trash2,
  CornerDownRight,
} from "lucide-react";
import { useEditor } from "@/lib/editor/store";
import type { GDEvent, GDInstruction } from "@/lib/editor/types";
import { instructionById, sentenceParts } from "@/lib/editor/instructions";
import { InstructionSelectorDialog } from "./InstructionSelectorDialog";
import { cn } from "@/lib/utils";

type SelectorTarget = { eventId: string; slot: "conditions" | "actions" } | null;

function InstructionRow({
  ins,
  eventId,
  slot,
}: {
  ins: GDInstruction;
  eventId: string;
  slot: "conditions" | "actions";
}) {
  const { project, dispatch } = useEditor();
  const def = instructionById(ins.typeId);
  if (!def) return null;
  const parts = sentenceParts(def);

  return (
    <div className="group flex items-start gap-1 px-1.5 py-[3px] text-[12px] leading-snug hover:bg-elevated/60">
      <span className="flex-1">
        {parts.map((p, idx) => {
          if (p.text !== undefined) return <span key={idx}>{p.text}</span>;
          const param = def.parameters[p.paramIndex!];
          if (!param) return null;
          const value = ins.parameters[param.name] ?? param.defaultValue;
          const isObject = project.objects.some((o) => o.name === value);
          return (
            <input
              key={idx}
              value={value}
              size={Math.max(3, String(value).length)}
              onChange={(e) =>
                dispatch({
                  type: "updateInstruction",
                  eventId,
                  slot,
                  instructionId: ins.id,
                  patch: { parameters: { ...ins.parameters, [param.name]: e.target.value } },
                })
              }
              className={cn(
                "mx-0.5 rounded border border-transparent bg-elevated/70 px-1 text-[12px] outline-none focus:border-link",
                isObject ? "text-warning-gd" : "text-link",
              )}
            />
          );
        })}
      </span>
      <button
        type="button"
        title="Delete"
        onClick={() =>
          dispatch({ type: "deleteInstruction", eventId, slot, instructionId: ins.id })
        }
        className="mt-0.5 hidden text-muted-foreground hover:text-destructive group-hover:block"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

function EventNode({
  event,
  index,
  depth,
  onSelector,
}: {
  event: GDEvent;
  index: string;
  depth: number;
  onSelector: (t: SelectorTarget) => void;
}) {
  const { dispatch } = useEditor();

  if (event.kind === "comment") {
    return (
      <div className="flex" style={{ paddingLeft: depth * 20 }}>
        <div className="w-9 shrink-0 border-r border-separator bg-toolbar py-1 text-center text-[10px] tabular-nums text-muted-foreground">
          {index}
        </div>
        <div className="group flex flex-1 items-start gap-2 border-b border-separator bg-comment-green/25 px-2 py-1">
          <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-comment-green" />
          <input
            value={event.comment ?? ""}
            onChange={(e) =>
              dispatch({ type: "updateEvent", id: event.id, patch: { comment: e.target.value } })
            }
            className="flex-1 bg-transparent text-[12px] text-foreground outline-none"
          />
          <button
            type="button"
            onClick={() => dispatch({ type: "deleteEvent", id: event.id })}
            className="hidden text-muted-foreground hover:text-destructive group-hover:block"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    );
  }

  const isGroup = event.kind === "group";

  return (
    <div>
      <div className="flex" style={{ paddingLeft: depth * 20 }}>
        <div className="w-9 shrink-0 border-r border-separator bg-toolbar py-1 text-center text-[10px] tabular-nums text-muted-foreground">
          {index}
        </div>
        <div className="min-w-0 flex-1 border-b border-separator">
          {isGroup ? (
            <div
              className="group flex items-center gap-2 px-2 py-1"
              style={{ backgroundColor: `${event.groupColor ?? "#7046EC"}44` }}
            >
              <button
                type="button"
                onClick={() => dispatch({ type: "toggleCollapse", id: event.id })}
                className="text-muted-foreground hover:text-foreground"
              >
                {event.collapsed ? (
                  <ChevronRight className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
              <input
                value={event.groupName ?? ""}
                onChange={(e) =>
                  dispatch({ type: "updateEvent", id: event.id, patch: { groupName: e.target.value } })
                }
                className="flex-1 bg-transparent text-[12px] font-semibold uppercase tracking-wide text-foreground outline-none"
              />
              <button
                type="button"
                title="Añadir un sub-evento"
                onClick={() => dispatch({ type: "addEvent", parentId: event.id, kind: "standard" })}
                className="text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => dispatch({ type: "deleteEvent", id: event.id })}
                className="hidden text-muted-foreground hover:text-destructive group-hover:block"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="group flex min-h-8">
              <div className="w-1/2 border-r border-separator">
                <div className="flex items-center gap-1 px-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "toggleCollapse", id: event.id })}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {event.collapsed ? (
                      <ChevronRight className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </button>
                  <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Condiciones
                  </span>

                  <span className="flex-1" />
                  <button
                    type="button"
                    title="Añadir un sub-evento"
                    onClick={() =>
                      dispatch({ type: "addEvent", parentId: event.id, kind: "standard" })
                    }
                    className="hidden text-muted-foreground hover:text-foreground group-hover:block"
                  >
                    <CornerDownRight className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    title="Eliminar evento"
                    onClick={() => dispatch({ type: "deleteEvent", id: event.id })}
                    className="hidden text-muted-foreground hover:text-destructive group-hover:block"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                {event.conditions.map((c) => (
                  <InstructionRow key={c.id} ins={c} eventId={event.id} slot="conditions" />
                ))}
                <button
                  type="button"
                  onClick={() => onSelector({ eventId: event.id, slot: "conditions" })}
                  className="mb-1 ml-2 flex items-center gap-1 text-[11px] text-link hover:text-link-hover"
                >
                  <Plus className="h-3 w-3" /> Añadir condición
                </button>
              </div>
              <div className="w-1/2">
                <div className="px-1.5 pt-1 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Acciones
                </div>
                {event.actions.map((a) => (
                  <InstructionRow key={a.id} ins={a} eventId={event.id} slot="actions" />
                ))}
                <button
                  type="button"
                  onClick={() => onSelector({ eventId: event.id, slot: "actions" })}
                  className="mb-1 ml-2 flex items-center gap-1 text-[11px] text-link hover:text-link-hover"
                >
                  <Plus className="h-3 w-3" /> Añadir acción
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {!event.collapsed &&
        event.subEvents.map((sub, i) => (
          <EventNode
            key={sub.id}
            event={sub}
            index={`${index}.${i + 1}`}
            depth={depth + 1}
            onSelector={onSelector}
          />
        ))}
    </div>
  );
}

function EToolbar({ onSearch }: { onSearch: (v: string) => void }) {
  const { dispatch, canUndo, canRedo } = useEditor();
  const btn =
    "flex items-center gap-1 rounded px-2 py-1 text-[11px] text-muted-foreground hover:bg-elevated hover:text-foreground";
  return (
    <div className="flex h-9 shrink-0 items-center gap-1 border-b border-separator bg-toolbar px-2">
      <button
        type="button"
        className={btn}
        onClick={() => dispatch({ type: "addEvent", parentId: null, kind: "standard" })}
      >
        <Plus className="h-3.5 w-3.5" /> Añadir un nuevo evento
      </button>
      <button
        type="button"
        className={btn}
        onClick={() => dispatch({ type: "addEvent", parentId: null, kind: "comment" })}
      >
        <MessageSquare className="h-3.5 w-3.5" /> Comentario
      </button>
      <button
        type="button"
        className={btn}
        onClick={() => dispatch({ type: "addEvent", parentId: null, kind: "group" })}
      >
        <FolderPlus className="h-3.5 w-3.5" /> Grupo
      </button>
      <div className="mx-1 h-5 w-px bg-separator" />
      <button
        type="button"
        className={cn(btn, !canUndo && "opacity-35")}
        onClick={() => dispatch({ type: "undo" })}
      >
        <Undo2 className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        className={cn(btn, !canRedo && "opacity-35")}
        onClick={() => dispatch({ type: "redo" })}
      >
        <Redo2 className="h-3.5 w-3.5" />
      </button>
      <div className="flex-1" />
      <div className="flex items-center gap-1.5 rounded border border-separator bg-window px-2 py-1">
        <Search className="h-3 w-3 text-muted-foreground" />
        <input
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Buscar en eventos"
          className="w-40 bg-transparent text-[11px] text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}

function matches(event: GDEvent, q: string): boolean {
  if (!q) return true;
  const text = [
    event.comment,
    event.groupName,
    ...[...event.conditions, ...event.actions].flatMap((i) => [
      instructionById(i.typeId)?.name,
      ...Object.values(i.parameters),
    ]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return text.includes(q.toLowerCase()) || event.subEvents.some((s) => matches(s, q));
}

export function EventsEditor() {
  const { project } = useEditor();
  const [selector, setSelector] = React.useState<SelectorTarget>(null);
  const [query, setQuery] = React.useState("");

  const events = project.events.filter((e) => matches(e, query));

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-window">
      <EToolbar onSearch={setQuery} />
      <div className="flex-1 overflow-auto">
        {events.map((e, i) => (
          <EventNode
            key={e.id}
            event={e}
            index={String(i + 1)}
            depth={0}
            onSelector={setSelector}
          />
        ))}
        {events.length === 0 && (
          <p className="p-6 text-center text-[12px] text-muted-foreground">
            No events. Click “Add a new event” to start building your game logic.
          </p>
        )}
      </div>
      {selector && (
        <InstructionSelectorDialog
          eventId={selector.eventId}
          slot={selector.slot}
          onClose={() => setSelector(null)}
        />
      )}
    </div>
  );
}
