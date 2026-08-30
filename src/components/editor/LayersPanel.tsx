// Layers list, port of GDevelop's `LayersList`: one row per layer with the
// visibility/lock toggles, the active layer used for new instances, a menu to add
// a normal or lighting layer, and the "show effects in the editor" switch.

import * as React from "react";
import {
  ChevronDown,
  Eye,
  EyeOff,
  Layers as LayersIcon,
  Lightbulb,
  Lock,
  MoreVertical,
  Plus,
  SquareStack,
  Trash2,
  Unlock,
} from "lucide-react";
import { useEditor } from "@/lib/editor/store";
import { S } from "@/lib/editor/i18n";
import { BASE_LAYER_NAME } from "@/lib/editor/scenes";
import type { GDLayer } from "@/lib/editor/types";
import { cn } from "@/lib/utils";
import { GdMenu, Panel, type MenuEntry } from "./gd/kit";

export function LayersPanel({ onClose }: { onClose?: (() => void) | undefined } = {}) {
  const { scene, ui, dispatch } = useEditor();
  const [menu, setMenu] = React.useState<{ x: number; y: number } | null>(null);
  const [rowMenu, setRowMenu] = React.useState<{
    x: number;
    y: number;
    layer: GDLayer;
  } | null>(null);

  const addEntries: MenuEntry[] = [
    {
      id: "layer",
      label: S.addALayer,
      icon: <LayersIcon className="h-3.5 w-3.5" />,
      onSelect: () => dispatch({ type: "addLayer" }),
    },
    {
      id: "lighting",
      label: S.addLightingLayer,
      icon: <Lightbulb className="h-3.5 w-3.5" />,
      onSelect: () => dispatch({ type: "addLayer", isLightingLayer: true }),
    },
    {
      id: "effects",
      label: S.effects,
      separatorBefore: true,
      icon: <SquareStack className="h-3.5 w-3.5" />,
      onSelect: () =>
        dispatch({
          type: "openDialog",
          dialog: {
            name: "effects",
            targetKind: "layer",
            targetId: scene.activeLayer,
          },
        }),
    },
    {
      id: "properties",
      label: S.sceneProperties,
      onSelect: () => dispatch({ type: "openDialog", dialog: { name: "sceneProperties" } }),
    },
  ];

  const rowEntries = (layer: GDLayer): MenuEntry[] => {
    const isBase = layer.name === BASE_LAYER_NAME;
    return [
      {
        id: "rename",
        label: S.rename,
        disabled: isBase,
        onSelect: () => {
          const name = window.prompt(S.rename, layer.name);
          if (name && name !== layer.name)
            dispatch({ type: "renameLayer", from: layer.name, to: name });
        },
      },
      {
        id: "effects",
        label: S.effects,
        onSelect: () =>
          dispatch({
            type: "openDialog",
            dialog: { name: "effects", targetKind: "layer", targetId: layer.name },
          }),
      },
      {
        id: "lock",
        label: layer.locked ? S.unlock : S.lock,
        icon: layer.locked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />,
        onSelect: () => dispatch({ type: "toggleLayerLock", name: layer.name }),
      },
      {
        id: "up",
        label: "Subir capa",
        separatorBefore: true,
        disabled: isBase,
        onSelect: () => dispatch({ type: "moveLayer", name: layer.name, direction: -1 }),
      },
      {
        id: "down",
        label: "Bajar capa",
        disabled: isBase,
        onSelect: () => dispatch({ type: "moveLayer", name: layer.name, direction: 1 }),
      },
      {
        id: "delete",
        label: S.delete,
        danger: true,
        separatorBefore: true,
        disabled: isBase,
        icon: <Trash2 className="h-3.5 w-3.5" />,
        onSelect: () => dispatch({ type: "deleteLayer", name: layer.name }),
      },
    ];
  };

  return (
    <Panel
      title={S.layers}
      badge={scene.layers.length}
      className="min-h-0 flex-1"
      actions={
        <>
          <button
            type="button"
            title={ui.showHitMasks ? S.disableEffectsInEditor : S.displayEffectsInEditor}
            aria-label={S.displayEffectsInEditor}
            aria-pressed={ui.showHitMasks}
            onClick={() => dispatch({ type: "ui", patch: { showHitMasks: !ui.showHitMasks } })}
            className={cn(
              "grid h-6 w-6 place-items-center rounded hover:bg-elevated",
              ui.showHitMasks ? "text-link" : "text-text-secondary",
            )}
          >
            <SquareStack className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label={S.addALayer}
            onClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              setMenu({ x: rect.left, y: rect.bottom + 2 });
            }}
            className="grid h-6 w-6 place-items-center rounded text-text-secondary hover:bg-elevated hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          {onClose ? (
            <button
              type="button"
              aria-label={S.closeLayersPanel}
              onClick={onClose}
              className="grid h-6 w-6 place-items-center rounded text-[14px] text-text-secondary hover:bg-elevated hover:text-foreground"
            >
              ×
            </button>
          ) : null}
        </>
      }
    >
      {scene.layers.map((layer) => {
        const isBase = layer.name === BASE_LAYER_NAME;
        const isActive = scene.activeLayer === layer.name;
        const instances = scene.instances.filter((i) => i.layer === layer.name).length;
        return (
          <div
            key={layer.name}
            onClick={() => {
              dispatch({ type: "setActiveLayer", name: layer.name });
              dispatch({
                type: "ui",
                patch: {
                  selectedLayerName: layer.name,
                  selectedInstanceIds: [],
                  selectedObjectIds: [],
                },
              });
            }}
            className={cn(
              "group mx-1 flex cursor-pointer items-center gap-1 rounded px-1 py-[5px] text-[12.5px] hover:bg-list-hover",
              isActive && "bg-selection",
            )}
          >
            <button
              type="button"
              aria-label={layer.visible ? S.hide : S.show}
              title={layer.visible ? S.visibleWhenSceneStarts : S.hiddenWhenSceneStarts}
              onClick={(event) => {
                event.stopPropagation();
                dispatch({ type: "toggleLayerVisibility", name: layer.name });
              }}
              className="shrink-0 text-text-secondary hover:text-foreground"
            >
              {layer.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              aria-label={layer.locked ? S.unlock : S.lock}
              onClick={(event) => {
                event.stopPropagation();
                dispatch({ type: "toggleLayerLock", name: layer.name });
              }}
              className={cn(
                "shrink-0 hover:text-foreground",
                layer.locked
                  ? "text-[#FFBC57]"
                  : "text-text-placeholder opacity-40 group-hover:opacity-100",
              )}
            >
              {layer.locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
            </button>
            <span className="min-w-0 flex-1 truncate text-foreground">
              {layer.isLightingLayer ? (
                <Lightbulb className="mr-1 inline h-3.5 w-3.5 text-[#FFBC57]" />
              ) : null}
              {layer.name}
            </span>
            {layer.effects.length > 0 ? (
              <span
                title={`${S.effects}: ${layer.effects.length}`}
                className="shrink-0 rounded bg-elevated px-1 text-[10px] text-text-secondary"
              >
                {layer.effects.length}
              </span>
            ) : null}
            <span className="hidden shrink-0 text-[10px] text-text-secondary group-hover:inline">
              {instances}
            </span>
            <button
              type="button"
              aria-label={`${layer.name}: ${S.options}`}
              onClick={(event) => {
                event.stopPropagation();
                const rect = event.currentTarget.getBoundingClientRect();
                setRowMenu({ x: rect.right - 170, y: rect.bottom + 2, layer });
              }}
              className="shrink-0 rounded p-0.5 text-text-secondary opacity-0 hover:bg-toolbar hover:text-foreground group-hover:opacity-100"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}

      {menu ? <GdMenu entries={addEntries} anchor={menu} onClose={() => setMenu(null)} /> : null}
      {rowMenu ? (
        <GdMenu
          entries={rowEntries(rowMenu.layer)}
          anchor={rowMenu}
          onClose={() => setRowMenu(null)}
        />
      ) : null}
    </Panel>
  );
}
