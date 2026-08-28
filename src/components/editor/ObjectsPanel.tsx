// Scene objects list, port of GDevelop's `ObjectsList`: a compact search bar, two
// collapsible sections (Objetos de escena / Objetos Globales) plus the object
// groups, one row per object with its icon, and a context menu with every command
// of the real app (editar, comportamientos, efectos, variables, duplicar, …).

import * as React from "react";
import {
  Boxes,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  MoreVertical,
  Pencil,
  Plus,
  Settings2,
  SquareStack,
  Trash2,
  Type,
  Variable,
} from "lucide-react";
import { useEditor } from "@/lib/editor/store";
import { S } from "@/lib/editor/i18n";
import { isTextLike, objectTypeLabel, resolveAsset } from "@/lib/editor/catalog";
import { DND_OBJECT } from "@/lib/editor/dnd";
import { copyObjects, cutObjects } from "@/lib/editor/clipboard";
import type { GDObjectDef } from "@/lib/editor/types";
import { cn } from "@/lib/utils";
import { GdButton, Panel, SearchBar, useContextMenu } from "./gd/kit";
import { CatalogIcon, iconForObjectType } from "./gd/icons";
import type { MenuEntry } from "./gd/kit";

function ObjectRow({
  object,
  instancesCount,
  selected,
  onRename,
}: {
  object: GDObjectDef;
  instancesCount: number;
  selected: boolean;
  onRename: (name: string) => void;
}) {
  const { ui, dispatch, scene } = useEditor();
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(object.name);
  const { open, menu } = useContextMenu();

  React.useEffect(() => setDraft(object.name), [object.name]);

  const isHidden = object.instancesHidden;

  const entries = (): MenuEntry[] => [
    {
      id: "edit",
      label: S.editObject,
      icon: <Pencil className="h-3.5 w-3.5" />,
      onSelect: () =>
        dispatch({ type: "openDialog", dialog: { name: "objectEditor", objectId: object.id } }),
    },
    {
      id: "rename",
      label: S.rename,
      onSelect: () => {
        setDraft(object.name);
        setEditing(true);
      },
    },
    {
      id: "instances",
      label: `${S.addInstanceToScene} (${instancesCount})`,
      disabled: instancesCount === 0,
      onSelect: () => {
        dispatch({ type: "selectInstances", ids: [] });
        dispatch({
          type: "ui",
          patch: { tab: "scene", rightTab: "instances", selectedObjectIds: [object.id] },
        });
      },
    },
    {
      id: "behaviors",
      label: S.editBehaviors,
      icon: <Settings2 className="h-3.5 w-3.5" />,
      onSelect: () =>
        dispatch({ type: "openDialog", dialog: { name: "behaviors", objectId: object.id } }),
    },
    {
      id: "effects",
      label: S.effects,
      icon: <SquareStack className="h-3.5 w-3.5" />,
      onSelect: () =>
        dispatch({
          type: "openDialog",
          dialog: { name: "effects", targetKind: "object", targetId: object.id },
        }),
    },
    {
      id: "variables",
      label: S.variables,
      icon: <Variable className="h-3.5 w-3.5" />,
      onSelect: () => dispatch({ type: "ui", patch: { rightTab: "properties" } }),
    },
    {
      id: "hide",
      label: isHidden ? S.show : S.hide,
      icon: isHidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />,
      onSelect: () =>
        dispatch({ type: "updateObject", id: object.id, patch: { instancesHidden: !isHidden } }),
    },
    {
      id: "global",
      label: object.isGlobal ? S.removeAsGlobalObject : S.setAsGlobalObject,
      onSelect: () =>
        dispatch({ type: "setObjectGlobal", id: object.id, isGlobal: !object.isGlobal }),
    },
    {
      id: "duplicate",
      label: S.duplicate,
      separatorBefore: true,
      onSelect: () => dispatch({ type: "duplicateObject", id: object.id }),
    },
    {
      id: "copy",
      label: S.copy,
      onSelect: () => copyObjects([object]),
    },
    {
      id: "cut",
      label: S.cut,
      onSelect: () => {
        cutObjects(scene, [object.id]);
        dispatch({ type: "deleteObject", id: object.id });
      },
    },
    {
      id: "delete",
      label: S.delete,
      danger: true,
      separatorBefore: true,
      icon: <Trash2 className="h-3.5 w-3.5" />,
      onSelect: () => {
        if (window.confirm(S.confirmRemoveObject))
          dispatch({ type: "deleteObject", id: object.id });
      },
    },
  ];

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        draggable={!editing}
        onDragStart={(event) => {
          event.dataTransfer.setData(DND_OBJECT, object.name);
          event.dataTransfer.setData("text/plain", object.name);
          event.dataTransfer.effectAllowed = "copy";
        }}
        onContextMenu={(event) => open(event, entries())}
        onClick={() =>
          dispatch({
            type: "ui",
            patch: { selectedObjectIds: [object.id], selectedInstanceIds: [] },
          })
        }
        onDoubleClick={() => {
          setDraft(object.name);
          setEditing(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter")
            dispatch({ type: "openDialog", dialog: { name: "objectEditor", objectId: object.id } });
        }}
        className={cn(
          "group mx-1 flex cursor-grab items-center gap-1.5 rounded px-1.5 py-[5px] text-[12.5px] text-foreground hover:bg-list-hover",
          selected && "bg-selection",
          isHidden && "opacity-60",
        )}
      >
        <ObjectGlyph object={object} />
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => {
              setEditing(false);
              if (draft.trim() && draft !== object.name) onRename(draft.trim());
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
              if (event.key === "Escape") {
                setDraft(object.name);
                setEditing(false);
              }
            }}
            className="h-5 min-w-0 flex-1 rounded border border-link bg-window px-1 text-[12.5px] outline-none"
          />
        ) : (
          <span className="min-w-0 flex-1 truncate">{object.name}</span>
        )}
        <span className="hidden shrink-0 text-[10px] text-text-secondary group-hover:inline">
          {instancesCount > 0 ? instancesCount : ""}
        </span>
        <button
          type="button"
          aria-label={`${S.editObject}: ${object.name}`}
          onClick={(event) => {
            event.stopPropagation();
            open(event, entries());
          }}
          className="shrink-0 rounded p-0.5 text-text-secondary opacity-0 hover:bg-toolbar hover:text-foreground group-hover:opacity-100"
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </button>
      </div>
      {menu}
    </>
  );
}

function ObjectGlyph({ object }: { object: GDObjectDef }) {
  const animation = object.animations?.[0];
  const image = animation?.images?.[0]?.image ?? object.asset;
  const url = resolveAsset(image);
  if (isTextLike(object.type)) return <Type className="h-4 w-4 shrink-0 text-[#8AD6FF]" />;
  if (url) {
    return (
      <img
        src={url}
        alt=""
        className="h-4 w-4 shrink-0 bg-[#1D1D26] object-contain [image-rendering:pixelated]"
        draggable={false}
      />
    );
  }
  return (
    <CatalogIcon
      name={iconForObjectType(object.type)}
      className="h-4 w-4 shrink-0 text-[#C9B6FC]"
    />
  );
}

export function ObjectsPanel() {
  const { scene, ui, dispatch } = useEditor();
  const [query, setQuery] = React.useState("");
  const [openSections, setOpenSections] = React.useState({
    scene: true,
    global: false,
    groups: true,
  });

  const matches = (object: GDObjectDef) => {
    if (!query) return true;
    const needle = query.toLowerCase();
    return (
      object.name.toLowerCase().includes(needle) ||
      objectTypeLabel(object.type).toLowerCase().includes(needle)
    );
  };

  const sceneObjects = scene.objects.filter((o) => !o.isGlobal && matches(o));
  const globalObjects = scene.objects.filter((o) => o.isGlobal && matches(o));
  const groups = (scene.groups ?? []).filter(
    (group) => !query || group.name.toLowerCase().includes(query.toLowerCase()),
  );
  const instancesOf = (id: string) => scene.instances.filter((i) => i.objectId === id).length;

  return (
    <Panel
      title={S.objects}
      badge={scene.objects.length}
      className="min-w-0 flex-1 border-r border-separator"
      actions={
        <button
          type="button"
          aria-label="Contraer"
          onClick={() => dispatch({ type: "ui", patch: { showObjectsPanel: false } })}
          className="grid h-6 w-6 place-items-center rounded text-text-secondary hover:bg-elevated hover:text-foreground"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      }
      footer={
        <GdButton
          variant="raised"
          primary
          className="w-full"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => dispatch({ type: "openDialog", dialog: { name: "newObject" } })}
        >
          {S.addANewObject}
        </GdButton>
      }
    >
      <div className="px-2 pb-1.5 pt-1">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder={S.searchObjects}
          icon={<Boxes className="h-3.5 w-3.5 text-text-secondary" />}
        />
      </div>

      <Section
        title={S.sceneObjects}
        open={openSections.scene}
        onToggle={() => setOpenSections((s) => ({ ...s, scene: !s.scene }))}
      >
        {sceneObjects.length === 0 ? (
          <p className="px-3 py-2 text-[12.5px] text-text-secondary">{S.noObjectYet}</p>
        ) : null}
        {sceneObjects.map((object) => (
          <ObjectRow
            key={object.id}
            object={object}
            instancesCount={instancesOf(object.id)}
            selected={ui.selectedObjectIds.includes(object.id)}
            onRename={(name) => dispatch({ type: "renameObject", id: object.id, name })}
          />
        ))}
      </Section>

      {globalObjects.length > 0 ? (
        <Section
          title={S.globalObjects}
          open={openSections.global}
          onToggle={() => setOpenSections((s) => ({ ...s, global: !s.global }))}
        >
          {globalObjects.map((object) => (
            <ObjectRow
              key={object.id}
              object={object}
              instancesCount={instancesOf(object.id)}
              selected={ui.selectedObjectIds.includes(object.id)}
              onRename={(name) => dispatch({ type: "renameObject", id: object.id, name })}
            />
          ))}
        </Section>
      ) : null}

      <Section
        title={S.objectGroups}
        open={openSections.groups}
        onToggle={() => setOpenSections((s) => ({ ...s, groups: !s.groups }))}
        right={
          <button
            type="button"
            aria-label={S.objectGroups}
            title={S.objectGroups}
            onClick={() => dispatch({ type: "addObjectGroup" })}
            className="grid h-5 w-5 place-items-center rounded text-text-secondary hover:bg-elevated hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        }
      >
        {groups.length === 0 ? (
          <p className="px-3 py-1 text-[12px] text-text-placeholder">—</p>
        ) : null}
        {groups.map((group) => (
          <div
            key={group.name}
            className={cn(
              "mx-1 flex items-center gap-1.5 rounded px-1.5 py-[5px] text-[12.5px] hover:bg-list-hover",
              ui.selectedGroupName === group.name && "bg-selection",
            )}
            onClick={() => dispatch({ type: "ui", patch: { selectedGroupName: group.name } })}
          >
            <SquareStack className="h-4 w-4 shrink-0 text-[#A483FF]" />
            <span className="min-w-0 flex-1 truncate">{group.name}</span>
            <span className="text-[10px] text-text-secondary">{group.objects.length}</span>
            <button
              type="button"
              aria-label={S.delete}
              onClick={(event) => {
                event.stopPropagation();
                dispatch({ type: "deleteObjectGroup", name: group.name });
              }}
              className="shrink-0 text-text-secondary opacity-0 hover:text-destructive group-hover:opacity-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </Section>
    </Panel>
  );
}

function Section({
  title,
  open,
  onToggle,
  right,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-1">
      <div className="flex items-center gap-1 px-1.5 py-1">
        <button
          type="button"
          aria-expanded={open}
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-1 rounded px-1 py-0.5 text-left text-[11px] font-semibold uppercase tracking-wide text-text-secondary hover:bg-list-hover hover:text-foreground"
        >
          {open ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
          <span className="truncate">{title}</span>
        </button>
        {right}
      </div>
      {open ? <div>{children}</div> : null}
    </div>
  );
}
