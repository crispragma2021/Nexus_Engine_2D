// Game settings — the dialog GDevelop opens from the titlebar (project name,
// start scene, resolution, scale, loading screen, resources, extensions and the
// global variables). Tabs match the real app's sidebar.

import * as React from "react";
import { Boxes, Image as ImageIcon, Plus, Puzzle, Upload, Variable, Volume2 } from "lucide-react";
import { useEditor, type VariableScopeLocation } from "@/lib/editor/store";
import { INSTALLED_EXTENSIONS, RESOURCE_KINDS, resolveAsset } from "@/lib/editor/catalog";
import { S } from "@/lib/editor/i18n";
import type { GDResource } from "@/lib/editor/types";
import { cn } from "@/lib/utils";
import {
  ChoiceField,
  ColorField,
  FieldRow,
  GdButton,
  GdDialog,
  NumberField,
  PropertySection,
  SearchBar,
  TextField,
  ToggleField,
} from "./gd/kit";
import { VariablesEditor, type VariablesApi } from "./gd/VariablesEditor";
import { CatalogIcon } from "./gd/icons";
import { toast } from "sonner";
import {
  parseSfxrMetadata,
  playSfxr,
  serializeSfxrMetadata,
  sfxrToDataUrl,
  SFXR_PRESETS,
  type SfxrParameters,
  type SfxrPresetName,
} from "@/lib/audio/sfxr";

type Tab = "game" | "resources" | "extensions" | "variables";

const TABS: { id: Tab; label: string; icon: typeof Boxes }[] = [
  { id: "game", label: S.gameSettings, icon: Boxes },
  { id: "resources", label: S.resources, icon: ImageIcon },
  { id: "extensions", label: S.extensions, icon: Puzzle },
  { id: "variables", label: S.globalVariables, icon: Variable },
];

export function ProjectPropertiesDialog() {
  const { project, dispatch, ui } = useEditor();
  const dialog = ui.dialog;
  const openProject = dialog?.name === "projectProperties";
  const openResources = dialog?.name === "resources";
  const open = openProject || openResources;
  const [tab, setTab] = React.useState<Tab>("game");

  React.useEffect(() => {
    if (open) setTab(openResources ? "resources" : "game");
  }, [open, openResources]);

  const settings = project.gameSettings;
  const patch = (next: Partial<typeof settings>) =>
    dispatch({ type: "updateGameSettings", patch: next });

  return (
    <GdDialog
      open={open}
      onClose={() => dispatch({ type: "closeDialog" })}
      title={openResources ? S.resources : S.gameSettings}
      width="max-w-[min(1000px,96vw)]"
      helpPath="https://gdevelop.io/docs/getting-started/project-manager"
      footer={
        <GdButton variant="raised" primary onClick={() => dispatch({ type: "closeDialog" })}>
          {S.ok}
        </GdButton>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-[170px_minmax(0,1fr)]">
        <nav className="flex gap-1 overflow-x-auto border-b border-separator p-1 md:flex-col md:overflow-visible md:border-b-0 md:border-r">
          {TABS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => setTab(entry.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded px-2 py-1.5 text-left text-[12.5px] text-text-secondary hover:bg-list-hover hover:text-foreground",
                tab === entry.id && "bg-[#494952] text-[#F6F2FF]",
              )}
            >
              <entry.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{entry.label}</span>
            </button>
          ))}
        </nav>

        <div className="max-h-[62vh] min-w-0 overflow-y-auto p-2">
          {tab === "game" ? (
            <>
              <PropertySection title="Juego">
                <FieldRow label="Nombre del juego">
                  <TextField
                    value={project.name}
                    onChange={(name) => dispatch({ type: "renameProject", name })}
                  />
                </FieldRow>
                <FieldRow label="Autor">
                  <TextField value={settings.author} onChange={(author) => patch({ author })} />
                </FieldRow>
                <FieldRow label="Descripción">
                  <TextField
                    value={settings.description}
                    onChange={(description) => patch({ description })}
                  />
                </FieldRow>
                <FieldRow label="Versión">
                  <TextField value={settings.version} onChange={(version) => patch({ version })} />
                </FieldRow>
                <FieldRow label="Nombre del paquete">
                  <TextField
                    value={settings.packageName}
                    onChange={(packageName) => patch({ packageName })}
                  />
                </FieldRow>
                <FieldRow label="Escena que se abre al empezar el juego">
                  <ChoiceField
                    value={project.firstLayoutName}
                    options={project.scenes.map((scene) => scene.name)}
                    onChange={(startScene) => patch({ startScene })}
                  />
                </FieldRow>
              </PropertySection>

              <PropertySection title="Gráficos">
                <FieldRow label="Ancho del juego">
                  <NumberField
                    value={settings.windowWidth}
                    onChange={(windowWidth) =>
                      patch({ windowWidth: Math.max(1, Math.round(windowWidth)) })
                    }
                  />
                </FieldRow>
                <FieldRow label="Alto del juego">
                  <NumberField
                    value={settings.windowHeight}
                    onChange={(windowHeight) =>
                      patch({ windowHeight: Math.max(1, Math.round(windowHeight)) })
                    }
                  />
                </FieldRow>
                <FieldRow label="Usar el tamaño de la ventana como tamaño base">
                  <ToggleField
                    checked={settings.useWindowSizeAsBaseSize}
                    label="useWindowSizeAsBaseSize"
                    onChange={(useWindowSizeAsBaseSize) => patch({ useWindowSizeAsBaseSize })}
                  />
                </FieldRow>
                <FieldRow label="Adaptar la resolución en el juego">
                  <ToggleField
                    checked={settings.adaptGameResolutionAtRuntime}
                    label="adaptGameResolutionAtRuntime"
                    onChange={(adaptGameResolutionAtRuntime) =>
                      patch({ adaptGameResolutionAtRuntime })
                    }
                  />
                </FieldRow>
                <FieldRow label="Modo de escala">
                  <ChoiceField
                    value={settings.scaleMode}
                    options={["nearest", "linear"]}
                    labels={{ nearest: "Nítido (nearest)", linear: "Suave (linear)" }}
                    onChange={(scaleMode) =>
                      patch({ scaleMode: scaleMode as typeof settings.scaleMode })
                    }
                  />
                </FieldRow>
                <FieldRow label="Modo de ventana">
                  <ChoiceField
                    value={settings.windowMode}
                    options={["default", "fullscreen", "resizable"]}
                    labels={{
                      default: "Ventana",
                      fullscreen: "Pantalla completa",
                      resizable: "Redimensionable",
                    }}
                    onChange={(windowMode) =>
                      patch({ windowMode: windowMode as typeof settings.windowMode })
                    }
                  />
                </FieldRow>
                <FieldRow label="Orientación">
                  <ChoiceField
                    value={settings.orientation}
                    options={["landscape", "portrait", "any"]}
                    labels={{ landscape: "Horizontal", portrait: "Vertical", any: "Cualquiera" }}
                    onChange={(orientation) =>
                      patch({ orientation: orientation as typeof settings.orientation })
                    }
                  />
                </FieldRow>
                <FieldRow label={S.renderOutsideGameArea}>
                  <ToggleField
                    checked={settings.renderOutsideGameArea}
                    label={S.renderOutsideGameArea}
                    onChange={(renderOutsideGameArea) => patch({ renderOutsideGameArea })}
                  />
                </FieldRow>
                <FieldRow label="FPS mínimos">
                  <NumberField
                    value={settings.minFPS}
                    onChange={(minFPS) => patch({ minFPS: Math.max(10, Math.round(minFPS)) })}
                  />
                </FieldRow>
                <FieldRow label="FPS máximos">
                  <NumberField
                    value={settings.maxFPS}
                    onChange={(maxFPS) => patch({ maxFPS: Math.max(15, Math.round(maxFPS)) })}
                  />
                </FieldRow>
              </PropertySection>

              <PropertySection title="Pantalla de carga">
                <FieldRow label="Mostrar la pantalla de inicio de Nexus">
                  <ToggleField
                    checked={settings.loadingScreen.displayBrandSplash}
                    label="displayBrandSplash"
                    onChange={(displayBrandSplash) =>
                      patch({ loadingScreen: { ...settings.loadingScreen, displayBrandSplash } })
                    }
                  />
                </FieldRow>
                <FieldRow label="Duración mínima (s)">
                  <NumberField
                    value={settings.loadingScreen.minDuration}
                    step={0.1}
                    onChange={(minDuration) =>
                      patch({
                        loadingScreen: {
                          ...settings.loadingScreen,
                          minDuration: Math.max(0, minDuration),
                        },
                      })
                    }
                  />
                </FieldRow>
                <FieldRow label={S.background}>
                  <ColorField
                    value={settings.loadingScreen.backgroundColor}
                    onChange={(backgroundColor) =>
                      patch({ loadingScreen: { ...settings.loadingScreen, backgroundColor } })
                    }
                  />
                </FieldRow>
              </PropertySection>

              <PropertySection title="Comportamiento">
                <FieldRow label="Pausar el juego cuando la ventana pierde el foco">
                  <ToggleField
                    checked={settings.pauseOnLostFocus}
                    label="pauseOnLostFocus"
                    onChange={(pauseOnLostFocus) => patch({ pauseOnLostFocus })}
                  />
                </FieldRow>
                <FieldRow label="Política de carpetas">
                  <ChoiceField
                    value={settings.folderPolicy}
                    options={["doNotUse", "automatic"]}
                    labels={{ doNotUse: "Sin carpetas", automatic: "Automática" }}
                    onChange={(folderPolicy) =>
                      patch({ folderPolicy: folderPolicy as typeof settings.folderPolicy })
                    }
                  />
                </FieldRow>
              </PropertySection>
            </>
          ) : null}

          {tab === "resources" ? <ResourcesTab /> : null}
          {tab === "extensions" ? <ExtensionsTab /> : null}
          {tab === "variables" ? <GlobalVariablesTab /> : null}
        </div>
      </div>
    </GdDialog>
  );
}

function ResourcesTab() {
  const { project, dispatch } = useEditor();
  const [query, setQuery] = React.useState("");
  const [kind, setKind] = React.useState<string>("all");
  const [selectedName, setSelectedName] = React.useState<string | null>(null);
  const imageInput = React.useRef<HTMLInputElement>(null);
  const audioInput = React.useRef<HTMLInputElement>(null);
  const rows = project.resources.filter(
    (resource) =>
      (kind === "all" || resource.kind === kind) &&
      (!query || resource.name.toLowerCase().includes(query.toLowerCase())),
  );
  const selected = project.resources.find((resource) => resource.name === selectedName);

  const add = (next: GDResource) => dispatch({ type: "addResource", resource: next });
  const importFiles = async (files: FileList | null, resourceKind: "image" | "audio") => {
    if (!files) return;
    const claimedNames = new Set(project.resources.map((resource) => resource.name));
    for (const file of Array.from(files)) {
      try {
        validateImportedFile(file, resourceKind);
        const name = uniqueResourceName(file.name, [...claimedNames]);
        claimedNames.add(name);
        add({
          name,
          kind: resourceKind,
          file: name,
          url: await fileToDataUrl(file),
          alwaysLoaded: true,
          size: Math.max(0.01, file.size / 1024),
          editorMetadata: { source: "manual" },
        });
        setSelectedName(name);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "No se pudo importar el archivo.");
      }
    }
  };
  const addPreset = (preset: SfxrPresetName) => {
    const parameters = { ...SFXR_PRESETS[preset] };
    const name = uniqueResourceName(
      `${preset}.wav`,
      project.resources.map((resource) => resource.name),
    );
    add({
      name,
      kind: "audio",
      file: name,
      url: sfxrToDataUrl(parameters),
      metadata: serializeSfxrMetadata(parameters, preset),
      editorMetadata: {
        source: "procedural",
        generation: {
          provider: "procedural",
          model: "sfxr",
          generatedAt: new Date().toISOString(),
        },
        sfx: { ...parameters },
      },
      alwaysLoaded: true,
    });
    setKind("audio");
    setSelectedName(name);
    try {
      playSfxr(parameters);
    } catch {
      // Creating the standard WAV resource must still work when Web Audio is unavailable.
    }
  };

  return (
    <div>
      <input
        ref={imageInput}
        type="file"
        accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
        multiple
        className="hidden"
        onChange={(event) => {
          void importFiles(event.target.files, "image");
          event.target.value = "";
        }}
      />
      <input
        ref={audioInput}
        type="file"
        accept=".wav,.mp3,.ogg,audio/wav,audio/mpeg,audio/ogg"
        multiple
        className="hidden"
        onChange={(event) => {
          void importFiles(event.target.files, "audio");
          event.target.value = "";
        }}
      />
      <div className="flex flex-wrap items-center gap-2 pb-2">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder={S.searchResources}
          className="min-w-40 flex-1"
        />
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => imageInput.current?.click()}
            className="flex h-8 items-center gap-1 rounded bg-primary px-2 text-[11.5px] font-medium text-primary-foreground hover:bg-[#5C36D6]"
            title="Importar PNG, JPG o SVG"
          >
            <Upload className="h-3.5 w-3.5" />
            Imagen
          </button>
          <button
            type="button"
            onClick={() => audioInput.current?.click()}
            className="flex h-8 items-center gap-1 rounded bg-primary px-2 text-[11.5px] font-medium text-primary-foreground hover:bg-[#5C36D6]"
            title="Importar WAV, MP3 u OGG"
          >
            <Volume2 className="h-3.5 w-3.5" />
            Audio
          </button>
          {RESOURCE_KINDS.map((entry) => (
            <button
              key={entry.kind}
              type="button"
              onClick={() =>
                add({
                  name: `recurso-${project.resources.length + 1}.${entry.extensions.split(",")[0]?.trim().replace("*.", "") ?? "png"}`,
                  kind: entry.kind,
                  file: "",
                  alwaysLoaded: true,
                  metadata: "",
                })
              }
              className="flex h-8 items-center gap-1 rounded bg-elevated px-2 text-[11.5px] text-foreground hover:bg-selection"
              title={entry.description}
            >
              <Plus className="h-3.5 w-3.5" />
              {entry.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-1 rounded border border-separator bg-[#1D1D26] p-1.5 text-[11.5px]">
        <span className="mr-1 text-text-secondary">SFX instantáneo:</span>
        {(Object.keys(SFXR_PRESETS) as SfxrPresetName[]).map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => addPreset(preset)}
            className="rounded bg-elevated px-2 py-1 capitalize text-foreground hover:bg-selection"
          >
            {preset}
          </button>
        ))}
        <span className="ml-auto text-[10.5px] text-text-placeholder">
          WAV editable · frecuencia, ataque, caída, sustain, salto tonal y distorsión
        </span>
      </div>

      <div className="flex gap-1 pb-2 text-[11.5px]">
        {["all", ...RESOURCE_KINDS.map((entry) => entry.kind)].map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setKind(option)}
            className={cn(
              "rounded px-2 py-0.5",
              kind === option
                ? "bg-[var(--brand)] text-[#F6F2FF]"
                : "text-text-secondary hover:bg-list-hover",
            )}
          >
            {option === "all"
              ? S.resourcesAnyKind
              : RESOURCE_KINDS.find((entry) => entry.kind === option)?.name}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded border border-separator">
        <table className="w-full table-fixed text-[12px]">
          <thead>
            <tr className="bg-[#25252E] text-left text-[#D6DEEC]">
              <th className="w-8 px-2 py-1" />
              <th className="px-2 py-1 font-medium">{S.name}</th>
              <th className="w-24 px-2 py-1 font-medium">{S.type}</th>
              <th className="px-2 py-1 font-medium">Archivo</th>
              <th className="w-16 px-2 py-1 font-medium">Precargado</th>
              <th className="w-10 px-2 py-1" />
            </tr>
          </thead>
          <tbody>
            {rows.map((resource, index) => (
              <tr
                key={resource.name}
                onClick={() => setSelectedName(resource.name)}
                className={cn(
                  "cursor-pointer",
                  index % 2 === 0 ? "bg-[#1D1D26]" : "bg-[#23232A]",
                  selectedName === resource.name &&
                    "outline outline-1 -outline-offset-1 outline-[#4AB0E4]",
                )}
              >
                <td className="px-2 py-1">
                  <span className="grid h-6 w-6 place-items-center rounded bg-[#101017]">
                    {resource.kind === "image" &&
                    resolveAsset(resource.file || resource.name, project.resources) ? (
                      <img
                        src={resolveAsset(resource.file || resource.name, project.resources)}
                        alt=""
                        className="h-5 w-5 object-contain [image-rendering:pixelated]"
                      />
                    ) : (
                      <CatalogIcon name={resource.kind} className="h-3.5 w-3.5 text-[#C9B6FC]" />
                    )}
                  </span>
                </td>
                <td className="truncate px-2 py-1 text-foreground">
                  <input
                    value={resource.name}
                    onChange={(event) => {
                      const name = event.target.value;
                      if (
                        !name.trim() ||
                        project.resources.some(
                          (candidate) =>
                            candidate.name !== resource.name && candidate.name === name.trim(),
                        )
                      ) {
                        return;
                      }
                      dispatch({
                        type: "updateResource",
                        name: resource.name,
                        patch: { name },
                      });
                      setSelectedName(name.trim());
                    }}
                    className="h-6 w-full rounded border border-transparent bg-transparent px-1 outline-none hover:border-separator focus:border-[var(--brand-light)]"
                  />
                </td>
                <td className="px-2 py-1 text-text-secondary">{resource.kind}</td>
                <td className="truncate px-2 py-1">
                  <input
                    value={resource.file}
                    placeholder="archivo.png"
                    onChange={(event) =>
                      dispatch({
                        type: "updateResource",
                        name: resource.name,
                        patch: { file: event.target.value },
                      })
                    }
                    className="h-6 w-full rounded border border-transparent bg-transparent px-1 font-mono text-[11.5px] outline-none hover:border-separator focus:border-[var(--brand-light)]"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    type="checkbox"
                    checked={resource.alwaysLoaded}
                    onChange={(event) =>
                      dispatch({
                        type: "updateResource",
                        name: resource.name,
                        patch: { alwaysLoaded: event.target.checked },
                      })
                    }
                    className="h-3.5 w-3.5 accent-[var(--brand)]"
                  />
                </td>
                <td className="px-2 py-1 text-right">
                  <button
                    type="button"
                    aria-label={S.delete}
                    onClick={() => dispatch({ type: "deleteResource", name: resource.name })}
                    className="text-text-secondary hover:text-destructive"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-2 py-2 text-center text-text-placeholder">
                  {S.addANewResource}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {selected ? (
        <ResourceInspector
          key={selected.name}
          resource={selected}
          onUpdate={(patch) => dispatch({ type: "updateResource", name: selected.name, patch })}
        />
      ) : null}
    </div>
  );
}

function ResourceInspector({
  resource,
  onUpdate,
}: {
  resource: GDResource;
  onUpdate: (patch: Partial<GDResource>) => void;
}) {
  const parsed = parseSfxrMetadata(resource.metadata);
  const [parameters, setParameters] = React.useState<SfxrParameters | null>(parsed);
  const provenance = resource.editorMetadata?.source ?? "manual";

  const setNumber = (key: Exclude<keyof SfxrParameters, "waveform">, value: number) => {
    if (!parameters) return;
    setParameters({ ...parameters, [key]: value });
  };
  const save = () => {
    if (!parameters) return;
    onUpdate({
      url: sfxrToDataUrl(parameters),
      metadata: serializeSfxrMetadata(parameters),
      editorMetadata: {
        source: "procedural",
        generation: resource.editorMetadata?.generation ?? {
          provider: "procedural",
          model: "sfxr",
        },
        sfx: { ...parameters },
      },
    });
    toast.success(`SFX «${resource.name}» actualizado como WAV estándar.`);
  };

  return (
    <div className="mt-2 rounded border border-separator bg-[#1D1D26] p-2">
      <div className="flex flex-wrap items-center gap-2 text-[11.5px]">
        <strong className="text-foreground">Inspector: {resource.name}</strong>
        <span className="rounded bg-elevated px-1.5 py-0.5 text-text-secondary">
          {provenance === "manual"
            ? "Importado manualmente"
            : provenance === "generated"
              ? "Generado con IA"
              : "Generado proceduralmente"}
        </span>
        {resource.size ? (
          <span className="text-text-placeholder">{resource.size.toFixed(1)} KB</span>
        ) : null}
      </div>

      {resource.editorMetadata?.generation ? (
        <div className="mt-2 grid gap-1 rounded border border-separator p-1.5 text-[10.5px] text-text-secondary sm:grid-cols-2">
          <span>
            Proveedor:{" "}
            <strong className="text-foreground">
              {resource.editorMetadata.generation.provider}
            </strong>
          </span>
          <span>
            Modelo:{" "}
            <strong className="text-foreground">
              {resource.editorMetadata.generation.model ?? "—"}
            </strong>
          </span>
          {resource.editorMetadata.generation.prompt ? (
            <label className="sm:col-span-2">
              Instrucción de origen
              <input
                value={resource.editorMetadata.generation.prompt}
                onChange={(event) =>
                  onUpdate({
                    editorMetadata: {
                      ...resource.editorMetadata!,
                      generation: {
                        ...resource.editorMetadata!.generation!,
                        prompt: event.target.value,
                      },
                    },
                  })
                }
                className="mt-0.5 h-7 w-full rounded border border-separator bg-[#101017] px-2 text-foreground outline-none focus:border-[var(--brand-light)]"
              />
            </label>
          ) : null}
        </div>
      ) : null}

      {parameters ? (
        <div className="mt-2">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-[11px] text-text-secondary">
              Forma de onda
              <select
                value={parameters.waveform}
                onChange={(event) =>
                  setParameters({
                    ...parameters,
                    waveform: event.target.value as SfxrParameters["waveform"],
                  })
                }
                className="mt-0.5 h-7 w-full rounded border border-separator bg-[#25252E] px-1 text-foreground"
              >
                <option value="square">Cuadrada</option>
                <option value="saw">Sierra</option>
                <option value="sine">Seno</option>
                <option value="noise">Ruido</option>
              </select>
            </label>
            {(
              [
                ["frequency", "Frecuencia (Hz)", 20, 8000, 1],
                ["attack", "Ataque (s)", 0, 2, 0.001],
                ["decay", "Caída (s)", 0.005, 4, 0.005],
                ["sustain", "Sustain (s)", 0, 4, 0.005],
                ["pitchJump", "Salto tonal (semitonos)", -60, 60, 1],
                ["distortion", "Distorsión", 0, 1, 0.01],
              ] as const
            ).map(([key, label, min, max, step]) => (
              <label key={key} className="text-[11px] text-text-secondary">
                {label}
                <input
                  type="number"
                  value={parameters[key]}
                  min={min}
                  max={max}
                  step={step}
                  onChange={(event) => setNumber(key, Number(event.target.value))}
                  className="mt-0.5 h-7 w-full rounded border border-separator bg-[#25252E] px-1 text-foreground outline-none focus:border-[var(--brand-light)]"
                />
              </label>
            ))}
          </div>
          <div className="mt-2 flex justify-end gap-1">
            <GdButton
              size="small"
              onClick={() => {
                try {
                  playSfxr(parameters);
                } catch (error) {
                  toast.error(
                    error instanceof Error ? error.message : "No se pudo reproducir el SFX.",
                  );
                }
              }}
            >
              Probar
            </GdButton>
            <GdButton size="small" variant="raised" primary onClick={save}>
              Aplicar parámetros
            </GdButton>
          </div>
        </div>
      ) : (
        <p className="mt-1 text-[11px] text-text-secondary">
          Recurso estándar editable. Puedes cambiar su nombre, archivo y precarga arriba o
          reemplazarlo mediante los controles de importación manual.
        </p>
      )}
    </div>
  );
}

function validateImportedFile(file: File, kind: "image" | "audio") {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const allowed = kind === "image" ? ["png", "jpg", "jpeg", "svg"] : ["wav", "mp3", "ogg"];
  if (!allowed.includes(extension)) {
    throw new Error(
      kind === "image"
        ? "Formato no admitido. Usa PNG, JPG o SVG."
        : "Formato no admitido. Usa WAV, MP3 u OGG.",
    );
  }
  if (file.size <= 0 || file.size > 20 * 1024 * 1024) {
    throw new Error("El recurso debe tener contenido y no superar 20 MB.");
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`No se pudo leer ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

function uniqueResourceName(base: string, taken: readonly string[]): string {
  if (!taken.includes(base)) return base;
  const dot = base.lastIndexOf(".");
  const stem = dot > 0 ? base.slice(0, dot) : base;
  const extension = dot > 0 ? base.slice(dot) : "";
  let index = 2;
  while (taken.includes(`${stem}-${index}${extension}`)) index += 1;
  return `${stem}-${index}${extension}`;
}

function ExtensionsTab() {
  const { project, dispatch } = useEditor();
  const [query, setQuery] = React.useState("");
  const installed = new Set(project.extensions.map((extension) => extension.name));
  const rows = INSTALLED_EXTENSIONS.filter(
    (extension) => !query || extension.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div>
      <SearchBar value={query} onChange={setQuery} placeholder={S.searchExtensions} />
      <div className="mt-2 grid gap-1 md:grid-cols-2">
        {rows.map((extension) => {
          const isInstalled = installed.has(extension.name);
          return (
            <div
              key={extension.name}
              className="flex items-center gap-2 rounded border border-separator bg-[#1D1D26] p-2"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded bg-[#25252E]">
                <CatalogIcon name={extension.icon} className="h-4 w-4 text-[#C9B6FC]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] text-foreground">
                  {extension.name}
                </span>
                <span className="block truncate text-[11px] text-text-secondary">
                  {extension.longName} · v{extension.version}
                </span>
              </span>
              <GdButton
                size="small"
                variant="raised"
                className={isInstalled ? "opacity-70" : undefined}
                onClick={() =>
                  isInstalled
                    ? dispatch({ type: "uninstallExtension", name: extension.name })
                    : dispatch({
                        type: "installExtension",
                        extension: {
                          name: extension.name,
                          longName: extension.name,
                          version: "1.0.0",
                        },
                      })
                }
              >
                {isInstalled ? S.installed : S.install}
              </GdButton>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GlobalVariablesTab() {
  const { project, dispatch } = useEditor();
  const location: VariableScopeLocation = { scope: "global" };
  const api: VariablesApi = {
    variables: project.globalVariables,
    add: (path) =>
      path.length === 0
        ? dispatch({ type: "addVariable", location })
        : dispatch({ type: "addVariableChild", location, path }),
    update: (path, patch) => dispatch({ type: "updateVariable", location, path, patch }),
    remove: (path) => dispatch({ type: "deleteVariable", location, path }),
  };
  return (
    <div>
      <h3 className="px-1 pb-1 text-[13px] font-semibold">{S.globalVariables}</h3>
      <VariablesEditor api={api} />
    </div>
  );
}

export function VariablesDialog() {
  const { scene, project, dispatch, ui } = useEditor();
  const dialog = ui.dialog?.name === "variables" ? ui.dialog : null;
  const isGlobal = dialog?.scope === "global";
  const location: VariableScopeLocation = { scope: isGlobal ? "global" : "scene" };
  const api: VariablesApi = {
    variables: isGlobal ? project.globalVariables : scene.variables,
    add: (path) =>
      path.length === 0
        ? dispatch({ type: "addVariable", location })
        : dispatch({ type: "addVariableChild", location, path }),
    update: (path, patch) => dispatch({ type: "updateVariable", location, path, patch }),
    remove: (path) => dispatch({ type: "deleteVariable", location, path }),
  };
  return (
    <GdDialog
      open={!!dialog}
      onClose={() => dispatch({ type: "closeDialog" })}
      title={isGlobal ? S.globalVariables : S.sceneVariables}
      width="max-w-2xl"
      helpPath="https://gdevelop.io/docs/getting-started/game-basics/variables"
      footer={
        <GdButton variant="raised" primary onClick={() => dispatch({ type: "closeDialog" })}>
          {S.ok}
        </GdButton>
      }
    >
      <div className="p-2">
        <VariablesEditor api={api} />
      </div>
    </GdDialog>
  );
}
