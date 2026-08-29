// Instances list, port of GDevelop's `InstancesEditor/InstancesList`: search,
// one row per instance (icon, object name, layer, hidden/lock markers), click to
// select it on the canvas, and a footer that adds the selected object's instance.

import * as React from "react";
import {
  ArrowDownToLine,
  ArrowUpToLine,
  Copy,
  Eye,
  EyeOff,
  Lock,
  MoreVertical,
  Plus,
  Scissors,
  Settings,
  Trash2,
  Unlock,
} from "lucide-react";
import { useEditor } from "@/lib/editor/store";
import { S } from "@/lib/editor/i18n";
import { copyInstances, cutInstances } from "@/lib/editor/clipboard";
import { resolveAsset } from "@/lib/editor/catalog";
import { isTextLike } from "@/lib/editor/catalog";
import { cn } from "@/lib/utils";
import { GdButton, GdMenu, Panel, SearchBar, type MenuEntry } from "./gd/kit";
import { CatalogIcon, iconForObjectType } from "./gd/icons";

export function InstancesPanel() {
  const { scene, ui, dispatch, project } = useEditor();
  const [query, setQuery] = React.useState("");
  const [settings, setSettings] = React.useState<{ x: number; y: number } | null>(null);
  const [rowMenu, setRowMenu] = React.useState<{
    x: number;
    y: number;
    instanceId: string;
  } | null>(null);

  const objectById = (id: string) => scene.objects.find((o) => o.id === id);

  const rows = scene.instances
    .map((instance, index) => {
      const object = scene.objects.find((o) => o.id === instance.objectId);
      return { instance, index, object };
    })
    .filter(({ instance, object }) => {
      if (!query) return true;
      const needle = query.toLowerCase();
      return (
        (object?.name ?? instance.objectId).toLowerCase().includes(needle) ||
        instance.layer.toLowerCase().includes(needle)
      );
    })
    .sort((a, b) => a.instance.zOrder - b.instance.zOrder || a.index - b.index);

  const entriesFor = (instanceId: string): MenuEntry[] => {
    const instance = scene.instances.find((i) => i.id === instanceId);
    if (!instance) return [];
    return [
      {
        id: "front",
        label: S.bringToFront,
        icon: <ArrowUpToLine className="h-3.5 w-3.5" />,
        onSelect: () => dispatch({ type: "setInstancesZOrder", ids: [instanceId], mode: "front" }),
      },
      {
        id: "back",
        label: S.sendToBack,
        icon: <ArrowDownToLine className="h-3.5 w-3.5" />,
        onSelect: () => dispatch({ type: "setInstancesZOrder", ids: [instanceId], mode: "back" }),
      },
      {
        id: "duplicate",
        label: S.duplicate,
        icon: <Copy className="h-3.5 w-3.5" />,
        separatorBefore: true,
        onSelect: () => dispatch({ type: "duplicateInstances", ids: [instanceId] }),
      },
      {
        id: "copy",
        label: S.copy,
        onSelect: () => copyInstances([instance]),
      },
      {
        id: "cut",
        label: S.cut,
        icon: <Scissors className="h-3.5 w-3.5" />,
        onSelect: () => {
          cutInstances(scene, [instanceId]);
          dispatch({ type: "deleteInstances", ids: [instanceId] });
        },
      },
      {
        id: "hide",
        label: instance.hiddenAtStart ? S.show : S.hide,
        icon: instance.hiddenAtStart ? (
          <Eye className="h-3.5 w-3.5" />
        ) : (
          <EyeOff className="h-3.5 w-3.5" />
        ),
        onSelect: () => dispatch({ type: "toggleInstancesVisibility", ids: [instanceId] }),
      },
      {
        id: "lock",
        label: instance.locked ? S.unlock : S.lock,
        icon: instance.locked ? (
          <Unlock className="h-3.5 w-3.5" />
        ) : (
          <Lock className="h-3.5 w-3.5" />
        ),
        onSelect: () => dispatch({ type: "toggleInstancesLock", ids: [instanceId] }),
      },
      {
        id: "delete",
        label: S.delete,
        danger: true,
        separatorBefore: true,
        icon: <Trash2 className="h-3.5 w-3.5" />,
        onSelect: () => dispatch({ type: "deleteInstances", ids: [instanceId] }),
      },
    ];
  };

  return (
    <Panel
      title={S.instances}
      badge={scene.instances.length}
      className="min-h-0 flex-1"
      actions={
        <>
          <button
            type="button"
            aria-label={S.openSettings}
            title="Mostrar instancias ocultas"
            onClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              setSettings({ x: rect.right - 190, y: rect.bottom + 2 });
            }}
            className="grid h-6 w-6 place-items-center rounded text-text-secondary hover:bg-elevated hover:text-foreground"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label={S.closeInstancesPanel}
            onClick={() => dispatch({ type: "ui", patch: { showInstancesPanel: false } })}
            className="grid h-6 w-6 place-items-center rounded text-[14px] leading-none text-text-secondary hover:bg-elevated hover:text-foreground"
          >
            ×
          </button>
        </>
      }
      footer={
        <GdButton
          variant="raised"
          primary
          className="w-full"
          icon={<Plus className="h-4 w-4" />}
          disabled={scene.objects.length === 0}
          onClick={() => {
            const source =
              scene.objects.find((o) => o.id === ui.selectedObjectIds[0]) ?? scene.objects[0];
            if (!source) return;
            dispatch({
              type: "addInstance",
              objectId: source.id,
              x: Math.round(scene.layers[0]?.camera.x ?? 0) + 100,
              y: Math.round(scene.layers[0]?.camera.y ?? 0) + 100,
            });
          }}
        >
          {S.addInstanceToScene}
        </GdButton>
      }
    >
      <div className="px-2 pb-1.5 pt-1">
        <SearchBar value={query} onChange={setQuery} placeholder={S.searchInstances} />
      </div>

      {rows.length === 0 ? (
        <p className="px-3 py-2 text-[12.5px] text-text-secondary">
          {scene.instances.length === 0 ? S.noObjectYet : "Sin resultados"}
        </p>
      ) : null}

      {rows.map(({ instance }) => {
        const object = objectById(instance.objectId);
        const selected = ui.selectedInstanceIds.includes(instance.id);
        const image = resolveAsset(
          object?.animations?.[0]?.images?.[0]?.image ?? object?.asset,
          project.resources,
        );
        return (
          <div
            key={instance.id}
            onClick={(event) =>
              dispatch({
                type: "selectInstances",
                ids: event.shiftKey
                  ? [...new Set([...ui.selectedInstanceIds, instance.id])]
                  : [instance.id],
              })
            }
            className={cn(
              "group mx-1 flex cursor-pointer items-center gap-1.5 rounded px-1.5 py-[5px] text-[12.5px] hover:bg-list-hover",
              selected && "bg-selection",
              instance.hiddenAtStart && "opacity-60",
            )}
          >
            {image && object && !isTextLike(object.type) ? (
              <img
                src={image}
                alt=""
                draggable={false}
                className="h-4 w-4 shrink-0 bg-[#1D1D26] object-contain [image-rendering:pixelated]"
              />
            ) : (
              <CatalogIcon
                name={object ? iconForObjectType(object.type) : "sprite"}
                className="h-4 w-4 shrink-0 text-[#C9B6FC]"
              />
            )}
            <span className="min-w-0 flex-1 truncate text-foreground">
              {object?.name ?? instance.objectId}
            </span>
            <span className="hidden shrink-0 text-[10px] text-text-secondary md:inline">
              {instance.layer}
            </span>
            {instance.locked ? <Lock className="h-3 w-3 shrink-0 text-[#FFBC57]" /> : null}
            {instance.hiddenAtStart ? (
              <EyeOff className="h-3 w-3 shrink-0 text-text-secondary" />
            ) : null}
            <button
              type="button"
              aria-label={`Opciones de ${object?.name ?? instance.objectId}`}
              onClick={(event) => {
                event.stopPropagation();
                const rect = event.currentTarget.getBoundingClientRect();
                setRowMenu({ x: rect.right - 180, y: rect.bottom + 2, instanceId: instance.id });
              }}
              className="shrink-0 rounded p-0.5 text-text-secondary opacity-0 hover:bg-toolbar hover:text-foreground group-hover:opacity-100"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}

      {settings ? (
        <GdMenu
          anchor={settings}
          onClose={() => setSettings(null)}
          entries={[
            {
              id: "hidden",
              label: S.showHiddenInstances,
              checked: ui.showHiddenInstances,
              onSelect: () =>
                dispatch({ type: "ui", patch: { showHiddenInstances: !ui.showHiddenInstances } }),
            },
            {
              id: "layers",
              label: S.closeLayersPanel,
              onSelect: () => dispatch({ type: "ui", patch: { showLayersPanel: false } }),
            },
          ]}
        />
      ) : null}
      {rowMenu ? (
        <GdMenu
          entries={entriesFor(rowMenu.instanceId)}
          anchor={rowMenu}
          onClose={() => setRowMenu(null)}
        />
      ) : null}
    </Panel>
  );
}
