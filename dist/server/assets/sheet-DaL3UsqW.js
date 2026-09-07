import * as React from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { X } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cva } from "class-variance-authority";
//#region src/lib/editor/types.ts
var DEFAULT_GRID = {
	show: false,
	snap: false,
	width: 32,
	height: 32,
	kind: "rectangular",
	color: "158;180;255",
	alpha: .8,
	offsetX: 0,
	offsetY: 0
};
//#endregion
//#region src/lib/editor/ids.ts
var counter = 0;
var uid = (prefix) => `${prefix}_${++counter}_${Math.floor(Math.random() * 1e6).toString(36)}`;
/** GDevelop's `newNameGenerator`: "NewObject", "NewObject2", "NewObject3"… */
function newNameGenerator(base, taken) {
	const clean = base.replace(/[0-9]+$/, "");
	if (!taken.includes(clean)) return clean;
	for (let i = 2;; i++) {
		const candidate = `${clean}${i}`;
		if (!taken.includes(candidate)) return candidate;
	}
}
//#endregion
//#region src/lib/editor/scenes.ts
/** GDevelop keeps the base layer name untranslated in the project file. */
var BASE_LAYER_NAME = "Base layer";
/** Creates the canonical blank 2D project used by every product entry point. */
function createEmptyProject(options) {
	const name = options.name.trim() || "Proyecto sin título";
	const windowWidth = clampDimension(options.windowWidth, 800);
	const windowHeight = clampDimension(options.windowHeight, 600);
	const sceneName = "Escena 1";
	const orientation = windowWidth === windowHeight ? "any" : windowWidth > windowHeight ? "landscape" : "portrait";
	return {
		name,
		version: "1.0.0",
		firstLayoutName: sceneName,
		scenes: [makeScene(sceneName)],
		resources: [],
		globalVariables: [],
		externalEvents: [],
		externalLayouts: [],
		extensions: [],
		gameSettings: {
			author: "",
			description: "",
			version: "1.0.0",
			packageName: "com.nexusengine.game",
			orientation,
			windowWidth,
			windowHeight,
			useWindowSizeAsBaseSize: true,
			magnification: 1,
			minFPS: 30,
			maxFPS: 60,
			adaptGameResolutionAtRuntime: true,
			scaleMode: options.pixelArt ? "nearest" : "linear",
			windowMode: "default",
			startScene: sceneName,
			pauseOnLostFocus: false,
			renderOutsideGameArea: false,
			loadingScreen: {
				displayBrandSplash: true,
				minDuration: 0,
				fadeInDuration: 0,
				fadeOutDuration: 0,
				backgroundColor: "#1D1D26"
			},
			watermark: { showOnMobile: false },
			projectUuid: uid("nexus"),
			folderPolicy: "doNotUse"
		}
	};
}
function clampDimension(value, fallback) {
	if (!Number.isFinite(value)) return fallback;
	return Math.min(7680, Math.max(1, Math.round(value)));
}
function makeScene(name, patch = {}) {
	return {
		name,
		backgroundColor: "255;255;255",
		magnification: 1,
		adaptResolutionAtRuntime: true,
		stopSoundsOnSceneChange: false,
		grid: { ...DEFAULT_GRID },
		layers: [{
			name: BASE_LAYER_NAME,
			visible: true,
			camera: {
				x: 0,
				y: 0
			},
			effects: []
		}],
		activeLayer: BASE_LAYER_NAME,
		objects: [],
		instances: [],
		events: [],
		variables: [],
		groups: [],
		...patch
	};
}
/** Immutably replace the active scene with the result of `updater`. */
function withScene(project, name, updater) {
	let touched = false;
	const scenes = project.scenes.map((scene) => {
		if (scene.name !== name) return scene;
		touched = true;
		return updater(scene);
	});
	if (!touched) return project;
	return {
		...project,
		scenes
	};
}
function renameSceneInProject(project, from, to) {
	const scenes = project.scenes.map((s) => s.name === from ? {
		...s,
		name: to,
		activeLayer: s.activeLayer === from ? to : s.activeLayer,
		layers: s.layers.map((l) => l.name === from ? {
			...l,
			name: to
		} : l),
		instances: s.instances.map((i) => i.layer === from ? {
			...i,
			layer: to
		} : i)
	} : s);
	const firstLayoutName = project.firstLayoutName === from ? to : project.firstLayoutName;
	return {
		...project,
		scenes,
		firstLayoutName,
		gameSettings: {
			...project.gameSettings,
			startScene: firstLayoutName
		}
	};
}
/** The projection `GameRuntime` simulates. Keeps the engine API untouched. */
function toRuntimeScene(project, scene) {
	const { windowWidth, windowHeight } = sceneWindowSize(project, scene);
	return {
		name: scene.name,
		backgroundColor: scene.backgroundColor,
		windowWidth,
		windowHeight,
		layers: scene.layers,
		objects: scene.objects,
		instances: scene.instances,
		events: scene.events,
		sceneVariables: scene.variables,
		globalVariables: project.globalVariables,
		groups: scene.groups,
		scenes: project.scenes.map((s) => s.name)
	};
}
function sceneWindowSize(project, scene) {
	if (scene.useCustomWindowSize && scene.customWindowWidth && scene.customWindowHeight) return {
		windowWidth: scene.customWindowWidth,
		windowHeight: scene.customWindowHeight
	};
	return {
		windowWidth: project.gameSettings.windowWidth,
		windowHeight: project.gameSettings.windowHeight
	};
}
/**
* Projects saved before the multi-scene model stored objects/instances/events at
* the root. Accept them and lift everything into a single scene.
*/
function migrateProject(input) {
	if (!input || typeof input !== "object") return null;
	const raw = input;
	if (Array.isArray(raw.scenes) && raw.scenes[0] && typeof raw.scenes[0] === "object") {
		const project = raw;
		return {
			...project,
			externalEvents: project.externalEvents ?? [],
			externalLayouts: project.externalLayouts ?? [],
			globalVariables: project.globalVariables ?? [],
			resources: project.resources ?? [],
			scenes: project.scenes.map((scene) => ({
				...scene,
				grid: {
					...DEFAULT_GRID,
					...scene.grid ?? {}
				},
				groups: scene.groups ?? [],
				variables: scene.variables ?? [],
				layers: (scene.layers ?? []).map((layer) => ({
					...layer,
					camera: layer.camera ?? {
						x: 0,
						y: 0
					},
					effects: layer.effects ?? []
				}))
			}))
		};
	}
	const legacy = raw;
	const name = legacy.scenes?.[0] ?? "Level 1";
	const scene = makeScene(name, {
		backgroundColor: legacy.backgroundColor ?? "255;255;255",
		activeLayer: legacy.activeLayer ?? "Base layer",
		objects: (legacy.objects ?? []).map(normalizeObject),
		instances: (legacy.instances ?? []).map(normalizeInstance),
		layers: (legacy.layers ?? []).map((l) => ({
			...l,
			camera: l.camera ?? {
				x: 0,
				y: 0
			},
			effects: l.effects ?? []
		})),
		events: legacy.events ?? [],
		variables: (legacy.sceneVariables ?? []).map((v) => ({
			name: v.name,
			type: v.type ?? "number",
			value: v.value,
			children: []
		})),
		groups: []
	});
	return {
		name: legacy.name ?? "Proyecto sin título",
		version: "1.0.0",
		firstLayoutName: name,
		scenes: [scene],
		resources: [],
		globalVariables: [],
		externalEvents: [],
		externalLayouts: [],
		extensions: (legacy.extensions ?? []).map((n) => ({ name: n })),
		gameSettings: {
			author: "",
			description: "",
			version: "1.0.0",
			packageName: "com.nexusengine.game",
			orientation: "landscape",
			windowWidth: legacy.windowWidth ?? 800,
			windowHeight: legacy.windowHeight ?? 600,
			useWindowSizeAsBaseSize: true,
			magnification: 1,
			minFPS: 30,
			maxFPS: 65,
			adaptGameResolutionAtRuntime: true,
			scaleMode: "linear",
			windowMode: "default",
			startScene: name,
			pauseOnLostFocus: false,
			renderOutsideGameArea: false,
			loadingScreen: {
				displayBrandSplash: true,
				minDuration: 0,
				fadeInDuration: 0,
				fadeOutDuration: 0,
				backgroundColor: "#1D1D26"
			},
			watermark: { showOnMobile: false },
			projectUuid: uid("nexus"),
			folderPolicy: "doNotUse"
		}
	};
}
function normalizeObject(object) {
	return {
		...object,
		behaviors: (object.behaviors ?? []).map((b) => typeof b === "string" ? {
			name: b,
			type: b === "Platform" ? "PlatformBehavior::PlatformBehavior" : "PlatformBehavior::PlatformerObjectBehavior",
			properties: {}
		} : b),
		effects: object.effects ?? [],
		variables: (object.variables ?? []).map((v) => ({
			name: v.name,
			type: v.type ?? "number",
			value: v.value,
			children: v.children ?? []
		}))
	};
}
function normalizeInstance(instance) {
	return {
		...instance,
		variables: instance.variables ?? [],
		effects: instance.effects ?? [],
		hiddenAtStart: instance.hiddenAtStart ?? false,
		customSize: instance.customSize ?? true
	};
}
//#endregion
//#region src/lib/editor/brand.ts
var BRAND = {
	name: "Nexus Engine",
	legalName: "Nexus Engine Studio",
	tagline: "Motor de juegos 2D para crear y publicar",
	/** Same purple ramp GDevelop uses, kept as a token so it can be re-skinned. */
	accent: "#7046EC",
	accentDark: "#4F28CD",
	docsUrl: "https://nexusengine.dev/docs",
	communityUrl: "https://nexusengine.dev/community",
	translateUrl: "https://nexusengine.dev/translate",
	assetStoreUrl: "https://nexusengine.dev/assets",
	/** Shown by the runtime on the loading screen, like GDevelop's splash. */
	splashLabel: "Creado con Nexus Engine",
	/** localStorage prefix; `gdevelop:` is still read once and migrated. */
	storagePrefix: "nexus-engine:",
	copyright: "© Nexus Engine"
};
var storageKey = (key) => `${BRAND.storagePrefix}${key}`;
//#endregion
//#region src/lib/projects/local.ts
var LIST_KEY = storageKey("projects");
var CURRENT_KEY = storageKey("current-project");
var LEGACY_LIST_KEYS = ["studio:projects", "gdevelop:projects"];
var LEGACY_CURRENT_KEYS = ["studio:current-project", "gdevelop:current-project"];
var LocalProjectStorageError = class extends Error {
	constructor(message, options) {
		super(message, options);
		this.name = "LocalProjectStorageError";
	}
};
function legacyKeysFor(key) {
	if (key === LIST_KEY) return LEGACY_LIST_KEYS;
	if (key === CURRENT_KEY) return LEGACY_CURRENT_KEYS;
	return [];
}
function read(key, fallback) {
	if (typeof window === "undefined") return fallback;
	try {
		let raw = window.localStorage.getItem(key);
		if (raw === null) for (const legacyKey of legacyKeysFor(key)) {
			raw = window.localStorage.getItem(legacyKey);
			if (raw === null) continue;
			try {
				window.localStorage.setItem(key, raw);
			} catch {}
			break;
		}
		return raw ? JSON.parse(raw) : fallback;
	} catch {
		return fallback;
	}
}
function write(key, value) {
	if (typeof window === "undefined") throw new LocalProjectStorageError("El almacenamiento local no está disponible.");
	try {
		window.localStorage.setItem(key, JSON.stringify(value));
	} catch (cause) {
		throw new LocalProjectStorageError("No se pudo guardar el proyecto en este dispositivo. Comprueba el espacio disponible.", { cause });
	}
}
function newLocalId() {
	return `loc_${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`}`;
}
function listLocalProjects() {
	return read(LIST_KEY, []).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
function saveLocalProject(input) {
	const all = read(LIST_KEY, []);
	const id = input.id ?? newLocalId();
	const entry = {
		id,
		name: input.name,
		updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
		project: input.project
	};
	write(LIST_KEY, [entry, ...all.filter((project) => project.id !== id)]);
	return entry;
}
function deleteLocalProject(id) {
	write(LIST_KEY, read(LIST_KEY, []).filter((project) => project.id !== id));
	if (read(CURRENT_KEY, null)?.id === id) clearCurrentProject();
}
function getLocalProject(id) {
	return read(LIST_KEY, []).find((project) => project.id === id);
}
function setCurrentProject(ref) {
	write(CURRENT_KEY, ref.id ? { id: ref.id } : {
		id: null,
		project: ref.project
	});
}
function getCurrentProject() {
	const stored = read(CURRENT_KEY, null);
	if (!stored) return null;
	if (stored.id) {
		const saved = getLocalProject(stored.id);
		if (saved) return {
			id: saved.id,
			project: saved.project
		};
	}
	return stored.project ? {
		id: stored.id,
		project: stored.project
	} : null;
}
function clearCurrentProject() {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.removeItem(CURRENT_KEY);
		for (const legacyKey of LEGACY_CURRENT_KEYS) window.localStorage.removeItem(legacyKey);
	} catch (cause) {
		throw new LocalProjectStorageError("No se pudo cerrar el proyecto local.", { cause });
	}
}
//#endregion
//#region src/lib/utils.ts
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
//#endregion
//#region src/components/brand/NexusLogo.tsx
/** Shared product mark. The wordmark stays in text so it remains crisp at any size. */
function NexusLogo({ className, label = "Nexus Engine" }) {
	return /* @__PURE__ */ jsxs("span", {
		className: cn("inline-flex items-center gap-2", className),
		children: [/* @__PURE__ */ jsx("img", {
			src: "/icons/nexus-mark.svg",
			alt: "",
			"aria-hidden": "true",
			className: "size-8 shrink-0"
		}), /* @__PURE__ */ jsx("span", {
			className: "truncate",
			children: label
		})]
	});
}
function NexusMark({ className }) {
	return /* @__PURE__ */ jsx("img", {
		src: "/icons/nexus-mark.svg",
		alt: "Nexus Engine",
		className: cn("size-8", className)
	});
}
//#endregion
//#region src/components/ui/sheet.tsx
var Sheet = SheetPrimitive.Root;
var SheetPortal = SheetPrimitive.Portal;
var SheetOverlay = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(SheetPrimitive.Overlay, {
	className: cn("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props,
	ref
}));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;
var sheetVariants = cva("fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out", {
	variants: { side: {
		top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
		bottom: "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
		left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
		right: "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm"
	} },
	defaultVariants: { side: "right" }
});
var SheetContent = React.forwardRef(({ side = "right", className, children, overlayClassName, hideCloseButton = false, ...props }, ref) => /* @__PURE__ */ jsxs(SheetPortal, { children: [/* @__PURE__ */ jsx(SheetOverlay, { className: overlayClassName }), /* @__PURE__ */ jsxs(SheetPrimitive.Content, {
	ref,
	className: cn(sheetVariants({ side }), className),
	...props,
	children: [!hideCloseButton ? /* @__PURE__ */ jsxs(SheetPrimitive.Close, {
		className: "absolute right-4 top-4 cursor-pointer rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary",
		children: [/* @__PURE__ */ jsx(X, { className: "h-4 w-4" }), /* @__PURE__ */ jsx("span", {
			className: "sr-only",
			children: "Close"
		})]
	}) : null, children]
})] }));
SheetContent.displayName = SheetPrimitive.Content.displayName;
var SheetHeader = ({ className, ...props }) => /* @__PURE__ */ jsx("div", {
	className: cn("flex flex-col space-y-2 text-center sm:text-left", className),
	...props
});
SheetHeader.displayName = "SheetHeader";
var SheetFooter = ({ className, ...props }) => /* @__PURE__ */ jsx("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
});
SheetFooter.displayName = "SheetFooter";
var SheetTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(SheetPrimitive.Title, {
	ref,
	className: cn("text-lg font-semibold text-foreground", className),
	...props
}));
SheetTitle.displayName = SheetPrimitive.Title.displayName;
var SheetDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(SheetPrimitive.Description, {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
SheetDescription.displayName = SheetPrimitive.Description.displayName;
//#endregion
export { uid as C, newNameGenerator as S, makeScene as _, NexusLogo as a, toRuntimeScene as b, clearCurrentProject as c, listLocalProjects as d, saveLocalProject as f, createEmptyProject as g, BASE_LAYER_NAME as h, SheetTitle as i, deleteLocalProject as l, BRAND as m, SheetContent as n, NexusMark as o, setCurrentProject as p, SheetDescription as r, cn as s, Sheet as t, getCurrentProject as u, migrateProject as v, DEFAULT_GRID as w, withScene as x, renameSceneInProject as y };
