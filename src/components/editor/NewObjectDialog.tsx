// "Elegir un tipo de objeto" — GDevelop's object type picker: search + the list of
// object types (from the installed extensions), a description pane, and the object
// name. Creating a Sprite or a Text object opens its editor right away.

import * as React from "react";
import { Search } from "lucide-react";
import { useEditor } from "@/lib/editor/store";
import {
  OBJECT_TYPES,
  isSpriteLike,
  isTextLike,
  objectTypeId,
  resolveAsset,
} from "@/lib/editor/catalog";
import { newNameGenerator } from "@/lib/editor/ids";
import { S } from "@/lib/editor/i18n";
import { cn } from "@/lib/utils";
import { GdButton, GdDialog, SearchBar } from "./gd/kit";
import { CatalogIcon } from "./gd/icons";

export function NewObjectDialog() {
  const { scene, project, dispatch, ui } = useEditor();
  const open = ui.dialog?.name === "newObject";
  const [query, setQuery] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string>(OBJECT_TYPES[0]?.typeId ?? "Sprite");
  const [autoName, setAutoName] = React.useState(true);
  const [name, setName] = React.useState("");

  const selected = OBJECT_TYPES.find((type) => type.typeId === selectedId) ?? OBJECT_TYPES[0];
  const taken = scene.objects.map((object) => object.name);
  const suggested = selected ? newNameGenerator(sanitizeName(selected.name), taken) : "Objeto";
  const finalName = (name.trim() || suggested).trim();

  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setName("");
      setAutoName(true);
      setSelectedId(OBJECT_TYPES[0]?.typeId ?? "Sprite");
    }
  }, [open]);

  const results = OBJECT_TYPES.filter(
    (type) =>
      !query ||
      type.name.toLowerCase().includes(query.toLowerCase()) ||
      type.description.toLowerCase().includes(query.toLowerCase()),
  );

  const create = () => {
    if (!selected) return;
    const resources = project.resources.filter((resource) => resource.kind === "image");
    const firstImage = resources[0]?.name;
    const id = `obj-${Math.random().toString(36).slice(2, 9)}`;
    dispatch({
      type: "addObject",
      object: {
        id,
        name: finalName,
        type: objectTypeId(selected.typeId),
        ...(isSpriteLike(selected.typeId) && firstImage ? { asset: firstImage } : {}),
        ...(isSpriteLike(selected.typeId)
          ? {
              animations: [
                {
                  name: "Idle",
                  images: firstImage
                    ? [
                        {
                          image: firstImage,
                          originX: 0,
                          originY: 0,
                          centerX: 0,
                          centerY: 0,
                          opacity: 255,
                        },
                      ]
                    : [],
                  timeBetweenFrames: 0,
                  loops: true,
                  points: [],
                },
              ],
            }
          : {}),
        ...(isTextLike(selected.typeId)
          ? { text: "Texto", textSize: 32, textColor: "250;250;250", alignment: "left" as const }
          : {}),
        behaviors: [],
        effects: [],
        variables: [],
      },
    });
    dispatch({ type: "closeDialog" });
    if (isSpriteLike(selected.typeId) || isTextLike(selected.typeId)) {
      dispatch({ type: "openDialog", dialog: { name: "objectEditor", objectId: id } });
    }
  };

  return (
    <GdDialog
      open={open}
      onClose={() => dispatch({ type: "closeDialog" })}
      title={S.addObjectSearch}
      width="max-w-3xl"
      footer={
        <>
          <GdButton onClick={() => dispatch({ type: "closeDialog" })}>{S.cancel}</GdButton>
          <GdButton variant="raised" primary disabled={!selected} onClick={create}>
            {`Crear un objeto «${selected?.name ?? ""}»`}
          </GdButton>
        </>
      }
    >
      <div className="grid md:grid-cols-[minmax(0,1fr)_260px]">
        <div className="border-b border-separator md:border-b-0 md:border-r">
          <div className="flex items-center gap-2 border-b border-separator px-2 py-1.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-text-secondary" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={S.addObjectSearch}
              className="h-7 w-full min-w-0 bg-transparent text-[12.5px] outline-none placeholder:text-text-placeholder"
            />
          </div>
          <div className="max-h-[46vh] overflow-y-auto">
            {results.map((type) => (
              <button
                key={type.typeId}
                type="button"
                onClick={() => setSelectedId(type.typeId)}
                onDoubleClick={create}
                className={cn(
                  "flex w-full items-center gap-2 border-b border-separator/60 px-2.5 py-2 text-left hover:bg-list-hover",
                  selectedId === type.typeId && "bg-[#3D4D51]",
                )}
              >
                <CatalogIcon
                  name={type.icon}
                  className={cn(
                    "h-5 w-5 shrink-0",
                    selectedId === type.typeId ? "text-[#E5C07B]" : "text-[#C9B6FC]",
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block truncate text-[13px]",
                      selectedId === type.typeId ? "text-[#E5C07B]" : "text-foreground",
                    )}
                  >
                    {type.name}
                  </span>
                  <span className="block truncate text-[11px] text-text-secondary">
                    {type.description}
                  </span>
                </span>
                {type.installable ? (
                  <span className="shrink-0 rounded bg-elevated px-1 text-[10px] text-text-secondary">
                    extensión
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3">
          <label className="block text-[11px] uppercase tracking-wide text-text-secondary">
            {S.name}
          </label>
          <div className="mt-1 flex items-center gap-1">
            <input
              value={autoName ? suggested : name}
              onChange={(event) => {
                setAutoName(false);
                setName(event.target.value);
              }}
              className={cn(
                "h-8 min-w-0 flex-1 rounded border px-2 text-[12.5px] outline-none",
                taken.includes(finalName)
                  ? "border-[#FE6C46] bg-[rgba(254,108,70,0.15)]"
                  : "border-separator bg-[#1D1D26] focus:border-[var(--brand-light)]",
              )}
            />
            {autoName ? null : (
              <button
                type="button"
                onClick={() => {
                  setAutoName(true);
                  setName("");
                }}
                className="h-8 shrink-0 rounded px-1.5 text-[11px] text-text-secondary hover:bg-elevated"
                title="Usar el nombre sugerido"
              >
                auto
              </button>
            )}
          </div>
          {taken.includes(finalName) ? (
            <p className="mt-1 text-[11px] text-[#FFB4A2]">Ya existe un objeto con este nombre.</p>
          ) : null}

          {selected ? (
            <>
              <div className="mt-3 flex h-24 items-center justify-center rounded border border-separator bg-[#101017]">
                {isSpriteLike(selected.typeId) && project.resources[0] ? (
                  <img
                    src={resolveAsset(project.resources[0].file) ?? project.resources[0].file}
                    alt=""
                    className="max-h-20 max-w-full object-contain [image-rendering:pixelated]"
                  />
                ) : (
                  <CatalogIcon name={selected.icon} className="h-9 w-9 text-[#C9B6FC]" />
                )}
              </div>
              <p className="mt-2 text-[12px] leading-snug text-text-secondary">
                {selected.description}
              </p>
            </>
          ) : null}
        </div>
      </div>
    </GdDialog>
  );
}

const sanitizeName = (label: string) =>
  label
    .replace(/[^\p{L}\p{N}]+/gu, "")
    .slice(0, 24)
    .replace(/^./, (first) => first.toUpperCase());
