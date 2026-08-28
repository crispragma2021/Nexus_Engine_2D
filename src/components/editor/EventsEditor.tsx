// Events sheet — GDevelop's `EventsSheet`: the tree of events where each row is
// [move handle][conditions][actions], with sub-events indented by the connector
// lines, comment/group/link pseudo-events, else rows, disable toggles, search
// highlighting and the "add" links under every block.
//
// Visual metrics come from EventsTree/style.css: rows use `margin-bottom:1px`,
// radius `0 2px 2px 0`, a 10px move handle, `#32323B` borders around the
// conditions/actions containers and a dashed `#4AB0E4` outline on selection.

import * as React from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Link2,
  Pencil,
  Plus,
  Search,
  Settings2,
  SquareStack,
  Trash2,
  Type as TypeIcon,
  UnfoldVertical,
  Variable,
} from "lucide-react";
import { useEditor } from "@/lib/editor/store";
import { COMMENT_COLORS } from "@/lib/editor/events";
import {
  MODOPS,
  OPERATORS,
  instructionById,
  sentenceParts,
  type InstructionDef,
  type ParamType,
} from "@/lib/editor/instructions";
import type { GDEvent, GDInstruction } from "@/lib/editor/types";
import { S } from "@/lib/editor/i18n";
import { cn } from "@/lib/utils";
import { GdButton, GdMenu, SearchBar, useContextMenu, type MenuEntry } from "./gd/kit";
import { CATEGORY_ICON, CatalogIcon } from "./gd/icons";

const PARAM_COLOR: Record<string, string> = {
  number: "#0ECD7A",
  expression: "#0ECD7A",
  string: "#E0D01F",
  yesno: "#E0D01F",
  choices: "#A483FF",
  object: "#A483FF",
  color: "#FF85ED",
  key: "#FF85ED",
  button: "#FF85ED",
  sound: "#FF85ED",
  operator: "#FF85ED",
  modop: "#FF85ED",
  behavior: "#9AA5CE",
  animation: "#9AA5CE",
  varobj: "#8AD6FF",
  textObject: "#8AD6FF",
  varscene: "#8AD6FF",
  varglobal: "#8AD6FF",
  layer: "#8AD6FF",
  scene: "#8AD6FF",
};

const rgbTriplet = (value: string) =>
  value.startsWith("#")
    ? value
    : `rgb(${value
        .split(";")
        .map((part) => Math.max(0, Math.min(255, Number(part) || 0)))
        .join(",")})`;

export function EventsEditor() {
  const { scene, ui, dispatch } = useEditor();
  const [query, setQuery] = React.useState("");
  const [addMenu, setAddMenu] = React.useState<{ x: number; y: number } | null>(null);
  const [settings, setSettings] = React.useState<{ x: number; y: number } | null>(null);
  const [showDisabledOnly, setShowDisabledOnly] = React.useState(false);

  const selectedIds = ui.selectedEventIds;
  const selectedParent = selectedIds.length === 1 ? (selectedIds[0] ?? null) : null;

  const addEntries: MenuEntry[] = [
    {
      id: "event",
      label: S.addEvent,
      icon: <Plus className="h-3.5 w-3.5" />,
      onSelect: () => dispatch({ type: "addEvent", parentId: null, kind: "standard" }),
    },
    {
      id: "subevent",
      label: S.addASubEvent,
      icon: <UnfoldVertical className="h-3.5 w-3.5" />,
      disabled: !selectedParent,
      onSelect: () => dispatch({ type: "addEvent", parentId: selectedParent, kind: "standard" }),
    },
    {
      id: "else",
      label: S.elseLabel,
      separatorBefore: true,
      disabled: !selectedParent,
      onSelect: () => {
        if (!selectedParent) return;
        dispatch({ type: "addEvent", parentId: selectedParent, kind: "else" });
      },
    },
    {
      id: "comment",
      label: S.addAComment,
      icon: <TypeIcon className="h-3.5 w-3.5" />,
      onSelect: () => dispatch({ type: "addEvent", parentId: null, kind: "comment" }),
    },
    {
      id: "group",
      label: S.addAGroup,
      icon: <SquareStack className="h-3.5 w-3.5" />,
      onSelect: () => dispatch({ type: "addEvent", parentId: null, kind: "group" }),
    },
    {
      id: "link",
      label: S.externalEvents,
      icon: <Link2 className="h-3.5 w-3.5" />,
      separatorBefore: true,
      onSelect: () => dispatch({ type: "addEvent", parentId: null, kind: "link" }),
    },
  ];

  const settingsEntries: MenuEntry[] = [
    {
      id: "disabled",
      label: showDisabledOnly ? "Mostrar todos los eventos" : "Mostrar solo los desactivados",
      checked: showDisabledOnly,
      onSelect: () => setShowDisabledOnly((value) => !value),
    },
    {
      id: "vars",
      label: S.sceneVariables,
      icon: <Variable className="h-3.5 w-3.5" />,
      onSelect: () =>
        dispatch({ type: "openDialog", dialog: { name: "variables", scope: "scene" } }),
    },
    {
      id: "properties",
      label: S.sceneProperties,
      icon: <Settings2 className="h-3.5 w-3.5" />,
      onSelect: () => dispatch({ type: "openDialog", dialog: { name: "sceneProperties" } }),
    },
  ];

  const filtered = query
    ? scene.events.filter((event) => eventMatches(event, query))
    : scene.events;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#1d1f24]">
      {/* Toolbar of the sheet */}
      <div className="flex h-11 shrink-0 items-center gap-1 border-b border-[#1a1c20] bg-[#22252c] px-2">
        <button
          type="button"
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            setAddMenu({ x: rect.left, y: rect.bottom + 2 });
          }}
          className="flex h-8 items-center gap-1.5 rounded bg-primary px-3 text-[12px] font-medium text-primary-foreground hover:bg-[#5C36D6]"
        >
          <Plus className="h-4 w-4" />
          {S.addEvent}
          <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        </button>
        <GdButton
          size="small"
          icon={<TypeIcon className="h-3.5 w-3.5" />}
          title={S.addAComment}
          onClick={() => dispatch({ type: "addEvent", parentId: selectedParent, kind: "comment" })}
        >
          <span className="hidden lg:inline">Comentario</span>
        </GdButton>
        <GdButton
          size="small"
          icon={<SquareStack className="h-3.5 w-3.5" />}
          title={S.addAGroup}
          onClick={() => dispatch({ type: "addEvent", parentId: selectedParent, kind: "group" })}
        >
          <span className="hidden lg:inline">Grupo</span>
        </GdButton>
        <div className="mx-1 h-5 w-px bg-separator" />
        <GdButton
          size="small"
          icon={<Trash2 className="h-3.5 w-3.5" />}
          title={S.deleteSelectedEvents}
          disabled={selectedIds.length === 0}
          onClick={() => {
            dispatch({ type: "deleteEvents", ids: selectedIds });
            dispatch({ type: "selectEvents", ids: [] });
          }}
        >
          <span className="hidden xl:inline">{S.deleteSelectedEvents}</span>
        </GdButton>
        {selectedIds.length > 0 ? (
          <GdButton
            size="small"
            icon={<Copy className="h-3.5 w-3.5" />}
            title={S.duplicate}
            onClick={() => {
              for (const id of selectedIds) dispatch({ type: "duplicateEvent", id });
            }}
          />
        ) : null}

        <div className="ml-auto flex w-56 items-center">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder={S.searchInEvents}
            icon={<Search className="h-3.5 w-3.5 text-text-secondary" />}
            className="h-8"
          />
        </div>
        <button
          type="button"
          aria-label={S.openSettings}
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            setSettings({ x: rect.right - 220, y: rect.bottom + 2 });
          }}
          className="grid h-8 w-8 shrink-0 place-items-center rounded text-text-secondary hover:bg-elevated hover:text-foreground"
        >
          <Settings2 className="h-4 w-4" />
        </button>
      </div>

      {/* The tree */}
      <div className="min-h-0 flex-1 overflow-auto bg-[var(--ev-tree)] p-2">
        {filtered.length === 0 ? (
          <EmptyEvents
            query={query}
            onAdd={() => dispatch({ type: "addEvent", parentId: null, kind: "standard" })}
          />
        ) : (
          <div className="flex flex-col">
            {filtered.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                depth={0}
                query={query}
                showDisabledOnly={showDisabledOnly}
              />
            ))}
            <button
              type="button"
              onClick={() => dispatch({ type: "addEvent", parentId: null, kind: "standard" })}
              className="mt-1 self-start rounded px-1.5 py-0.5 text-[12px] text-[#c9b6fc] opacity-80 hover:bg-[rgba(0,0,0,0.15)] hover:opacity-100"
            >
              + {S.addANewEmptyEvent}
            </button>
          </div>
        )}
      </div>

      {addMenu ? (
        <GdMenu entries={addEntries} anchor={addMenu} onClose={() => setAddMenu(null)} />
      ) : null}
      {settings ? (
        <GdMenu entries={settingsEntries} anchor={settings} onClose={() => setSettings(null)} />
      ) : null}
    </div>
  );
}

function eventMatches(event: GDEvent, query: string): boolean {
  const needle = query.toLowerCase();
  if (event.comment?.toLowerCase().includes(needle)) return true;
  if (event.groupName?.toLowerCase().includes(needle)) return true;
  const match = (instruction: GDInstruction) => {
    const def = instructionById(instruction.typeId);
    if (
      def &&
      (def.name.toLowerCase().includes(needle) || def.sentence.toLowerCase().includes(needle))
    ) {
      return true;
    }
    return Object.values(instruction.parameters).some((value) =>
      value.toLowerCase().includes(needle),
    );
  };
  return (
    event.conditions.some(match) ||
    event.actions.some(match) ||
    event.subEvents.some((child) => eventMatches(child, query))
  );
}

function EmptyEvents({ query, onAdd }: { query: string; onAdd: () => void }) {
  return (
    <div className="flex h-full min-h-64 flex-col items-center justify-center gap-2 text-center">
      <h2 className="text-[15px] font-semibold text-foreground">
        {query ? `Sin resultados para «${query}»` : S.firstEventTitle}
      </h2>
      <p className="max-w-md text-[12.5px] text-text-secondary">{S.firstEventHelp}</p>
      {!query ? (
        <GdButton
          variant="raised"
          primary
          className="mt-2"
          icon={<Plus className="h-4 w-4" />}
          onClick={onAdd}
        >
          {S.addANewEmptyEvent}
        </GdButton>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------- the row */

function EventRow({
  event,
  depth,
  query,
  showDisabledOnly,
}: {
  event: GDEvent;
  depth: number;
  query: string;
  showDisabledOnly: boolean;
}) {
  const { ui, dispatch } = useEditor();
  const { open, menu } = useContextMenu();
  const [editing, setEditing] = React.useState(false);
  const selected = ui.selectedEventIds.includes(event.id);
  const isSubEvent = depth > 0;

  const entries = (): MenuEntry[] => [
    {
      id: "condition",
      label: S.addCondition,
      icon: <Plus className="h-3.5 w-3.5" />,
      disabled: event.kind !== "standard",
      onSelect: () =>
        dispatch({
          type: "openDialog",
          dialog: {
            name: "instruction",
            eventId: event.id,
            slot: "conditions",
            instructionId: null,
          },
        }),
    },
    {
      id: "action",
      label: S.addAction,
      icon: <Plus className="h-3.5 w-3.5" />,
      disabled: event.kind !== "standard",
      onSelect: () =>
        dispatch({
          type: "openDialog",
          dialog: { name: "instruction", eventId: event.id, slot: "actions", instructionId: null },
        }),
    },
    {
      id: "subevent",
      label: S.addASubEvent,
      disabled: event.kind === "comment",
      onSelect: () => dispatch({ type: "addEvent", parentId: event.id, kind: "standard" }),
    },
    {
      id: "else",
      label: S.elseLabel,
      disabled: isSubEvent || event.kind === "comment",
      onSelect: () => dispatch({ type: "addEvent", parentId: event.id, kind: "else" }),
    },
    {
      id: "disable",
      label: event.disabled ? S.enable : S.disable,
      icon: event.disabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />,
      onSelect: () => dispatch({ type: "toggleEventDisabled", id: event.id }),
    },
    {
      id: "duplicate",
      label: S.duplicate,
      separatorBefore: true,
      onSelect: () => dispatch({ type: "duplicateEvent", id: event.id }),
    },
    {
      id: "delete",
      label: S.delete,
      danger: true,
      icon: <Trash2 className="h-3.5 w-3.5" />,
      onSelect: () => {
        dispatch({ type: "deleteEvent", id: event.id });
        dispatch({
          type: "selectEvents",
          ids: ui.selectedEventIds.filter((id) => id !== event.id),
        });
      },
    },
  ];

  if (showDisabledOnly && !event.disabled) {
    return (
      <>
        {event.subEvents.map((child) => (
          <EventRow key={child.id} event={child} depth={depth} query={query} showDisabledOnly />
        ))}
      </>
    );
  }

  /* ---------------------------------------------------------------- comment */
  if (event.kind === "comment") {
    const colors = event.commentColors ?? {
      background: COMMENT_COLORS[0].background,
      text: COMMENT_COLORS[0].text,
    };
    return (
      <div
        className={cn("mb-px", isSubEvent && "pl-6")}
        style={{ paddingLeft: isSubEvent ? 24 + depth * 0 : undefined }}
      >
        <div
          onClick={() => dispatch({ type: "selectEvents", ids: [event.id] })}
          onDoubleClick={() => setEditing(true)}
          onContextMenu={(event2) => open(event2, entries())}
          className={cn(
            "flex items-start gap-2 rounded px-2 py-1.5 text-[13px] leading-snug",
            selected && "outline-dashed outline-1 outline-[#4AB0E4]",
            event.disabled && "opacity-60",
          )}
          style={{
            background: rgbTriplet(colors.background),
            color: rgbTriplet(colors.text),
            minHeight: 27,
          }}
        >
          <button
            type="button"
            aria-label={S.edit}
            onClick={(e) => {
              e.stopPropagation();
              setEditing(true);
            }}
            className="mt-0.5 shrink-0 opacity-60 hover:opacity-100"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          {editing ? (
            <textarea
              autoFocus
              defaultValue={event.comment ?? ""}
              rows={3}
              onBlur={(e) => {
                setEditing(false);
                dispatch({ type: "updateEvent", id: event.id, patch: { comment: e.target.value } });
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setEditing(false);
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey))
                  (e.target as HTMLTextAreaElement).blur();
              }}
              className="min-h-16 w-full resize-y rounded bg-[rgba(0,0,0,0.25)] p-1 text-[13px] outline-none"
            />
          ) : (
            <span
              className={cn(
                "min-w-0 flex-1 whitespace-pre-wrap",
                !event.comment && "italic opacity-60",
              )}
            >
              {event.comment || "Haz doble clic para escribir un comentario…"}
            </span>
          )}
          <span className="mt-0.5 flex shrink-0 gap-0.5">
            {["#2d3e2c", "#3e3a24", "#3e2d24", "#1a2638"].map((color, index) => (
              <button
                key={color}
                type="button"
                aria-label={`Color de comentario ${index + 1}`}
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch({
                    type: "updateEvent",
                    id: event.id,
                    patch: {
                      commentColors: {
                        background: color,
                        text: ["#98c379", "#e5c07b", "#d19a69", "#6bafff"][index] ?? "#98c379",
                      },
                    },
                  });
                }}
                className={cn(
                  "h-3 w-3 rounded-full border border-[rgba(255,255,255,0.25)]",
                  colors.background === color && "ring-1 ring-white/70",
                )}
                style={{ background: color }}
              />
            ))}
          </span>
        </div>
        {event.subEvents.length > 0 ? (
          <SubEvents
            events={event.subEvents}
            parentId={event.id}
            depth={depth + 1}
            query={query}
            showDisabledOnly={showDisabledOnly}
          />
        ) : null}
        {menu}
      </div>
    );
  }

  /* ------------------------------------------------------------------ group */
  if (event.kind === "group") {
    return (
      <div className={cn("mb-px", isSubEvent && "pl-6")}>
        <div
          onClick={(e) =>
            dispatch({
              type: "selectEvents",
              ids: e.shiftKey ? toggle(ui.selectedEventIds, event.id) : [event.id],
            })
          }
          onContextMenu={(e) => open(e, entries())}
          className={cn(
            "flex items-center gap-2 rounded bg-[#2b2f37] px-2 py-1.5",
            selected && "outline-dashed outline-1 outline-[#4AB0E4]",
            event.disabled && "opacity-60",
          )}
        >
          <button
            type="button"
            aria-label={event.collapsed ? "Expandir" : "Contraer"}
            onClick={(e) => {
              e.stopPropagation();
              dispatch({ type: "toggleCollapse", id: event.id });
            }}
            className="grid h-4 w-4 shrink-0 place-items-center rounded bg-[#282C34] text-text-secondary hover:text-foreground"
          >
            {event.collapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
          <input
            value={event.groupName ?? ""}
            aria-label="Nombre del grupo"
            onClick={(e) => e.stopPropagation()}
            onChange={(e) =>
              dispatch({ type: "updateEvent", id: event.id, patch: { groupName: e.target.value } })
            }
            className="h-6 w-48 rounded border border-transparent bg-transparent px-1 text-[13px] font-semibold text-foreground outline-none hover:border-separator focus:border-[var(--brand-light)] focus:bg-[#1d1f24]"
          />
          <span className="flex shrink-0 gap-1">
            {["#61AFFE", "#98c379", "#e5c07b", "#d19a69", "#c678dd"].map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Color del grupo ${color}`}
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch({ type: "updateEvent", id: event.id, patch: { groupColor: color } });
                }}
                className={cn(
                  "h-3 w-3 rounded-full",
                  (event.groupColor ?? "#61AFFE") === color && "ring-1 ring-white/70",
                )}
                style={{ background: color }}
              />
            ))}
          </span>
          <span className="ml-auto shrink-0 text-[11px] text-text-secondary">
            {event.subEvents.length} subevento(s)
          </span>
        </div>
        {!event.collapsed ? (
          <SubEvents
            events={event.subEvents}
            parentId={event.id}
            depth={depth + 1}
            query={query}
            showDisabledOnly={showDisabledOnly}
          />
        ) : null}
        {menu}
      </div>
    );
  }

  /* ------------------------------------------------------------------- link */
  if (event.kind === "link") {
    return (
      <div className={cn("mb-px", isSubEvent && "pl-6")}>
        <div
          onClick={() => dispatch({ type: "selectEvents", ids: [event.id] })}
          onContextMenu={(e) => open(e, entries())}
          className={cn(
            "flex items-center gap-2 rounded bg-[var(--ev-link-container)] px-2 py-1.5 text-[13px]",
            selected && "outline-dashed outline-1 outline-[#4AB0E4]",
          )}
        >
          <Link2 className="h-4 w-4 shrink-0 text-[#C678DD]" />
          <span className="text-[#c678dd]">{S.externalEvents}:</span>
          <input
            value={event.linkToEventsName ?? ""}
            aria-label="Nombre de los eventos externos"
            placeholder="nombre"
            onClick={(e) => e.stopPropagation()}
            onChange={(e) =>
              dispatch({
                type: "updateEvent",
                id: event.id,
                patch: { linkToEventsName: e.target.value },
              })
            }
            className="h-6 w-56 rounded border border-transparent bg-transparent px-1 text-[12.5px] text-foreground outline-none hover:border-separator focus:border-[var(--brand-light)]"
          />
          <span className="ml-auto shrink-0 text-[11px] text-text-secondary">
            {event.linkToEventsName ? "enlazado" : "sin destino"}
          </span>
        </div>
        {menu}
      </div>
    );
  }

  /* --------------------------------------------------------------- standard */
  const isElse = event.kind === "else";

  return (
    <div className={cn("mb-px flex flex-col", isSubEvent && "pl-6")}>
      <div
        className={cn("flex items-stretch", isSubEvent && "relative")}
        onClick={(e) =>
          dispatch({
            type: "selectEvents",
            ids:
              e.shiftKey || e.ctrlKey || e.metaKey
                ? toggle(ui.selectedEventIds, event.id)
                : [event.id],
          })
        }
        onContextMenu={(e) => open(e, entries())}
      >
        {/* move handle */}
        <div
          title="Arrastra para mover"
          className="flex w-2.5 shrink-0 cursor-grab items-center justify-center rounded-l-[2px] bg-[var(--ev-move-handle)] hover:bg-[var(--ev-move-handle-hover)]"
        >
          <span className="h-3 w-px bg-[rgba(255,255,255,0.35)]" />
        </div>
        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col rounded-r-[2px] bg-[var(--ev-row)]",
            event.disabled && "opacity-60",
          )}
        >
          <div className="flex min-w-0 items-stretch border border-[var(--ev-ca-border)]">
            <InstructionList
              event={event}
              slot="conditions"
              query={query}
              isElse={isElse}
              selected={selected}
            />
            <div className="w-px shrink-0 bg-[var(--ev-ca-border)]" />
            <InstructionList
              event={event}
              slot="actions"
              query={query}
              isElse={isElse}
              selected={selected}
            />
          </div>
        </div>
      </div>

      {(event.subEvents.length > 0 || selected) && !event.collapsed ? (
        <div className="relative">
          <div
            className="absolute bottom-0 left-0 top-0 w-6 border-b border-l border-l-[var(--ev-line)]"
            aria-hidden
          />
          <button
            type="button"
            aria-label={event.collapsed ? "Expandir subeventos" : "Contraer subeventos"}
            onClick={() => dispatch({ type: "toggleCollapse", id: event.id })}
            className="absolute left-1 top-0 z-10 grid h-4 w-4 -translate-y-1/2 place-items-center rounded bg-[#282C34] text-text-secondary hover:text-foreground"
          >
            {event.collapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
          <SubEvents
            events={event.subEvents}
            parentId={event.id}
            depth={depth + 1}
            query={query}
            showDisabledOnly={showDisabledOnly}
          />
        </div>
      ) : null}

      {event.subEvents.length > 0 && event.collapsed ? (
        <button
          type="button"
          onClick={() => dispatch({ type: "toggleCollapse", id: event.id })}
          className="ml-6 mt-px self-start rounded bg-[#282C34] px-1.5 py-0.5 text-[11px] text-text-secondary hover:text-foreground"
        >
          {event.subEvents.length} subevento(s) oculto(s)
        </button>
      ) : null}
      {menu}
    </div>
  );
}

function toggle(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id];
}

function SubEvents({
  events,
  parentId,
  depth,
  query,
  showDisabledOnly,
}: {
  events: GDEvent[];
  parentId: string;
  depth: number;
  query: string;
  showDisabledOnly: boolean;
}) {
  const { dispatch } = useEditor();
  return (
    <div className="relative pl-6">
      <div
        className="absolute bottom-0 left-0 top-0 w-6 border-b border-l border-l-[var(--ev-line)]"
        aria-hidden
      />
      {events.map((event) => (
        <EventRow
          key={event.id}
          event={event}
          depth={depth}
          query={query}
          showDisabledOnly={showDisabledOnly}
        />
      ))}
      <button
        type="button"
        onClick={() => dispatch({ type: "addEvent", parentId, kind: "standard" })}
        className="mb-px ml-6 rounded px-1.5 py-0.5 text-[11.5px] text-[#c9b6fc] opacity-70 hover:bg-[rgba(0,0,0,0.15)] hover:opacity-100"
      >
        + {S.addASubEvent}
      </button>
    </div>
  );
}

function InstructionList({
  event,
  slot,
  query,
  isElse,
  selected,
}: {
  event: GDEvent;
  slot: "conditions" | "actions";
  query: string;
  isElse: boolean;
  selected: boolean;
}) {
  const { ui, dispatch } = useEditor();
  const list = event[slot];
  const isConditions = slot === "conditions";
  const emptyLabel = isConditions ? (isElse ? "Si no…" : "Dejar vacío: siempre") : "";

  const openEditor = (instruction: GDInstruction | null) => {
    dispatch({
      type: "ui",
      patch: {
        selectedInstruction: {
          eventId: event.id,
          slot,
          instructionId: instruction?.id ?? "",
        },
      },
    });
    dispatch({
      type: "openDialog",
      dialog: {
        name: "instruction",
        eventId: event.id,
        slot,
        instructionId: instruction?.id ?? null,
      },
    });
  };

  return (
    <div
      className={cn(
        "min-w-0 flex-1",
        isConditions ? "bg-[var(--ev-conditions)]" : "bg-[var(--ev-actions)]",
      )}
    >
      {list.length === 0 ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openEditor(null);
          }}
          className={cn(
            "flex w-full items-center px-2 py-1 text-left text-[12.5px]",
            emptyLabel ? "text-text-placeholder" : "text-[#c9b6fc]",
          )}
        >
          {emptyLabel || `+ ${S.addAction}`}
        </button>
      ) : (
        list.map((instruction, index) => (
          <InstructionRow
            key={instruction.id}
            event={event}
            instruction={instruction}
            slot={slot}
            index={index}
            query={query}
            isSelectedEvent={selected}
            onOpen={() => openEditor(instruction)}
          />
        ))
      )}
      {list.length > 0 ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openEditor(list[list.length - 1] ?? null);
          }}
          className={cn(
            "w-full px-1.5 py-0.5 text-left text-[11.5px] opacity-65 hover:bg-[rgba(0,0,0,0.15)] hover:opacity-100",
            ui.selectedInstruction?.eventId === event.id && ui.selectedInstruction?.slot === slot
              ? "text-[#c9b6fc] opacity-100"
              : "text-[#c9b6fc]",
          )}
        >
          + {isConditions ? S.addCondition : S.addAction}
        </button>
      ) : null}
    </div>
  );
}

function InstructionRow({
  event,
  instruction,
  slot,
  index,
  query,
  isSelectedEvent,
  onOpen,
}: {
  event: GDEvent;
  instruction: GDInstruction;
  slot: "conditions" | "actions";
  index: number;
  query: string;
  isSelectedEvent: boolean;
  onOpen: () => void;
}) {
  const { dispatch, ui } = useEditor();
  const def = instructionById(instruction.typeId);
  const isSelected =
    ui.selectedInstruction?.eventId === event.id &&
    ui.selectedInstruction?.slot === slot &&
    ui.selectedInstruction?.instructionId === instruction.id;
  const isConditions = slot === "conditions";

  const parts = def ? sentenceParts(def) : [{ text: instruction.typeId }];
  const missing = def
    ? def.parameters.some(
        (parameter) => !instruction.parameters[parameter.name] && !parameter.defaultValue,
      )
    : false;

  return (
    <div
      className={cn(
        "group flex items-start gap-1 border px-1.5 py-1 text-[12.5px] leading-[18px] text-[var(--ev-row-text)]",
        "border-transparent",
        isSelected ? "border-[#4AB0E4] border-dashed" : "hover:bg-[var(--ev-selectable)]",
        isSelectedEvent && !isSelected && "bg-[rgba(0,0,0,0.12)]",
        instruction.disabled && "opacity-60",
      )}
      onClick={(e) => {
        e.stopPropagation();
        dispatch({
          type: "ui",
          patch: {
            selectedInstruction: { eventId: event.id, slot, instructionId: instruction.id },
          },
        });
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
    >
      <span className="mt-0.5 flex w-4 shrink-0 justify-center text-[11px] text-text-secondary">
        {index + 1}.
      </span>
      <p className={cn("min-w-0 flex-1 flex-wrap", instruction.disabled && "line-through")}>
        {isConditions && instruction.inverted ? (
          <span className="mr-1 rounded bg-[rgba(254,108,70,0.35)] px-1 text-[11px] font-semibold text-[#FFB4A2]">
            no
          </span>
        ) : null}
        {def ? (
          parts.map((part, partIndex) =>
            "paramIndex" in part && part.paramIndex !== undefined ? (
              <ParamChip
                key={`${part.paramIndex}-${partIndex}`}
                instruction={instruction}
                def={def}
                paramIndex={part.paramIndex}
                query={query}
                onOpen={onOpen}
              />
            ) : (
              <span key={partIndex}>
                <Highlight text={part.text ?? ""} query={query} />
              </span>
            ),
          )
        ) : (
          <span className="text-[#FFB4A2]">Instrucción desconocida: {instruction.typeId}</span>
        )}
        {def?.unsupported ? (
          <span
            title={S.unsupportedEffect}
            className="ml-1 rounded bg-[var(--ev-warning)] px-1 text-[10px] text-[#FFBC57]"
          >
            simulación limitada
          </span>
        ) : null}
        {missing && def ? (
          <span title="Faltan parámetros" className="ml-1 inline-flex">
            <AlertTriangle className="h-3.5 w-3.5 align-[-3px] text-[#FFBC57]" />
          </span>
        ) : null}
      </p>
      <span className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100">
        {isConditions ? (
          <MiniButton
            label={instruction.inverted ? "Quitar «no»" : "Añadir «no»"}
            onClick={() =>
              dispatch({
                type: "toggleInstructionInverted",
                eventId: event.id,
                slot,
                instructionId: instruction.id,
              })
            }
          >
            ±
          </MiniButton>
        ) : null}
        <MiniButton
          label={`Subir`}
          onClick={() =>
            dispatch({
              type: "moveInstruction",
              eventId: event.id,
              slot,
              instructionId: instruction.id,
              direction: -1,
            })
          }
        >
          ↑
        </MiniButton>
        <MiniButton
          label={`Bajar`}
          onClick={() =>
            dispatch({
              type: "moveInstruction",
              eventId: event.id,
              slot,
              instructionId: instruction.id,
              direction: 1,
            })
          }
        >
          ↓
        </MiniButton>
        <MiniButton
          label={S.delete}
          onClick={() =>
            dispatch({
              type: "deleteInstruction",
              eventId: event.id,
              slot,
              instructionId: instruction.id,
            })
          }
        >
          <Trash2 className="h-3 w-3" />
        </MiniButton>
      </span>
    </div>
  );
}

function MiniButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className="grid h-4 w-4 place-items-center rounded bg-[#282C34] text-[10px] text-text-secondary hover:bg-[#32323B] hover:text-foreground"
    >
      {children}
    </button>
  );
}

function ParamChip({
  instruction,
  def,
  paramIndex,
  query,
  onOpen,
}: {
  instruction: GDInstruction;
  def: InstructionDef;
  paramIndex: number;
  query: string;
  onOpen: () => void;
}) {
  const parameter = def.parameters[paramIndex];
  const raw = instruction.parameters[parameter?.name ?? String(paramIndex)] ?? "";
  const display = displayParam(parameter?.type, raw, parameter?.choices);
  const color = PARAM_COLOR[parameter?.type ?? "string"] ?? "#E0D01F";
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onOpen();
      }}
      className="mx-[1px] inline-flex max-w-full items-center rounded px-[3px] align-baseline hover:brightness-125"
      style={{ color, background: "rgba(0,0,0,0.22)" }}
      title={raw || "Sin valor"}
    >
      <span className="truncate">{display || "…"}</span>
      {query && raw.toLowerCase().includes(query.toLowerCase()) ? (
        <span className="ml-1 h-1 w-1 rounded-full bg-[#FC6421]" />
      ) : null}
    </button>
  );
}

function displayParam(
  type: ParamType | undefined,
  raw: string,
  choices?: readonly string[],
): string {
  if (!raw) return "";
  if (type === "yesno") return raw === "yes" ? "Sí" : "No";
  if (type === "key") return raw.length === 1 ? raw.toUpperCase() : raw;
  if (type === "choices" || (choices && choices.length > 0)) return raw;
  if (
    type === "object" ||
    type === "varobj" ||
    type === "textObject" ||
    type === "layer" ||
    type === "scene"
  ) {
    return raw;
  }
  return raw;
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const lower = text.toLowerCase();
  const needle = query.toLowerCase();
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  let index = lower.indexOf(needle);
  let key = 0;
  while (index >= 0) {
    if (index > cursor) parts.push(<span key={key++}>{text.slice(cursor, index)}</span>);
    parts.push(
      <span key={key++} className="rounded-[1px] bg-[rgba(252,100,33,0.25)]">
        {text.slice(index, index + needle.length)}
      </span>,
    );
    cursor = index + needle.length;
    index = lower.indexOf(needle, cursor);
  }
  parts.push(<span key={key++}>{text.slice(cursor)}</span>);
  return <>{parts}</>;
}
