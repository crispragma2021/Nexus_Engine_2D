// Scene canvas — the port of GDevelop's `InstancesRenderer`: a zoomed, pannable
// view of the scene with the window frame, the grid, drag-to-move instances,
// rubber-band selection, resize handles, drop-to-create and the status bar.
//
// Drawing reuses the runtime renderer (one code path for the editor and the game),
// exactly like GDevelop reuses Pixi for both; the selection UI is drawn on top.

import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEditor } from "@/lib/editor/store";
import { renderScene } from "@/lib/runtime/renderer";
import type { RTLayer, RTObject, RuntimeState } from "@/lib/runtime/types";
import { resolveAsset } from "@/lib/editor/catalog";
import { DND_OBJECT, DND_RESOURCE, readDropPayload } from "@/lib/editor/dnd";
import type { GDInstance, GDScene } from "@/lib/editor/types";
import { cn } from "@/lib/utils";
import { useContextMenu, type MenuEntry } from "./gd/kit";
import { S } from "@/lib/editor/i18n";
import { copyInstances, cutInstances, hasClipboard, pasteInto } from "@/lib/editor/clipboard";
import {
  fitGameWindowZoom,
  resolveTwoPointerGesture,
  resolveZoomAtPoint,
  shouldCenterGameWindow,
  type CanvasGestureStart,
  type CanvasPoint,
} from "@/lib/editor/canvas-gestures";
import { SceneViewToolbar } from "./SceneViewToolbar";

const HANDLE = 7;
const WHEEL_ZOOM_FACTOR = 1.7 ** (1 / 16);
type HandleId = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "rotate";

const rgb = (value: string) => {
  const parts = value.split(";").map((part) => Math.max(0, Math.min(255, Number(part) || 0)));
  return `rgb(${parts[0] ?? 0}, ${parts[1] ?? 0}, ${parts[2] ?? 0})`;
};

/** Editor projection of the scene into the runtime shape the renderer consumes. */
function buildEditorState(
  scene: GDScene,
  options: { showHidden: boolean },
): { state: RuntimeState; byInstance: Map<string, RTObject> } {
  const layers: Record<string, RTLayer> = {};
  const baseName = scene.layers[0]?.name;
  for (const layer of scene.layers) {
    const isBase = layer.name === baseName;
    const follows = !isBase && layer.followBaseLayer !== false;
    layers[layer.name] = {
      name: layer.name,
      visible: layer.visible,
      cameraX: follows ? 0 : layer.camera.x,
      cameraY: follows ? 0 : layer.camera.y,
      cameraZoom: 1,
      opacity: 255,
      followBaseLayer: follows,
    };
  }
  const byInstance = new Map<string, RTObject>();
  const objects: RTObject[] = [];
  for (const instance of scene.instances) {
    const def = scene.objects.find((o) => o.id === instance.objectId);
    if (!def) continue;
    if (instance.hiddenAtStart && !options.showHidden) continue;
    const animation = def.animations?.[0];
    const object: RTObject = {
      id: instance.id,
      name: def.name,
      type: def.type,
      ...(def.asset ? { asset: def.asset } : {}),
      ...(animation?.images[0]?.hitBox ? { hitBox: animation.images[0].hitBox } : {}),
      x: instance.x,
      y: instance.y,
      width: instance.width,
      height: instance.height,
      angle: instance.angle,
      zOrder: instance.zOrder,
      layer: instance.layer,
      opacity: 255,
      hidden: def.instancesHidden === true,
      flipX: false,
      flipY: false,
      text: def.text ?? "",
      textColor: hexOf(def.textColor),
      textSize: def.textSize ?? 24,
      bold: def.bold ?? false,
      alignment: def.alignment ?? "left",
      animationIndex: 0,
      timeBetweenFrames: animation?.timeBetweenFrames ?? 0,
      animationSpeedScale: 1,
      animationName: "",
      frameIndex: 0,
      frameTimer: 0,
      behaviors: def.behaviors.map((b) => b.name),
      behaviorTypes: Object.fromEntries(def.behaviors.map((b) => [b.name, b.type])),
      behaviorProps: Object.fromEntries(def.behaviors.map((b) => [b.name, b.properties])),
      controls: { left: false, right: false, up: false, down: false, jump: false },
      ignoreControls: false,
      onFloor: false,
      jumping: false,
      falling: false,
      vx: 0,
      vy: 0,
      gravity: 0,
      maxFallingSpeed: 0,
      friction: 0,
      health: 0,
      maxHealth: 0,
      flash: { active: false, elapsed: 0, duration: 0, half: 0, hidden: false },
      tweens: {},
      tint: tintOf(instance.effects.length ? instance.effects : def.effects),
      colorOverlay: null,
      variables: {},
      destroyed: false,
    };
    const image = animation?.images?.[0]?.image ?? def.asset;
    if (image) object.asset = image;
    byInstance.set(instance.id, object);
    objects.push(object);
  }
  const base = layers[scene.layers[0]?.name ?? "Base layer"];
  return {
    byInstance,
    state: {
      objects,
      layers,
      variables: {},
      globalVariables: {},
      timers: {},
      pausedTimers: {},
      camera: { x: base?.cameraX ?? 0, y: base?.cameraY ?? 0 },
      time: 0,
      timeScale: 1,
      frame: 0,
      sceneName: scene.name,
      logs: [],
      paused: false,
      stats: { objectsCount: objects.length, instructionsCount: 0, eventsCount: 0, frameTimeMs: 0 },
    },
  };
}

const hexOf = (value?: string) => {
  if (!value) return "#FAFAFA";
  if (value.startsWith("#")) return value;
  const parts = value.split(";").map((p) => Number(p) || 0);
  return `#${parts.map((p) => Math.max(0, Math.min(255, p)).toString(16).padStart(2, "0")).join("")}`;
};

function tintOf(effects: { type: string; parameters: Record<string, string> }[]) {
  const tint = effects.find(
    (effect) => effect.type === "Tint" && effect.parameters["disabled"] !== "yes",
  );
  if (!tint) return null;
  return [
    Number(tint.parameters["r"] ?? 255),
    Number(tint.parameters["g"] ?? 255),
    Number(tint.parameters["b"] ?? 255),
  ] as [number, number, number];
}

interface View {
  scale: number;
  offsetX: number;
  offsetY: number;
}

interface ActiveCanvasGesture {
  pointerIds: readonly [number, number];
  start: CanvasGestureStart;
}

export function SceneCanvas() {
  const { scene, ui, dispatch, project } = useEditor();
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeTouchPointers = useRef(new Map<number, CanvasPoint>());
  const activeGesture = useRef<ActiveCanvasGesture | null>(null);
  const touchSequenceTransformed = useRef(false);
  const touchSequenceSelection = useRef<string[]>([]);
  const didInitialFit = useRef(false);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const [drag, setDrag] = useState<
    | {
        kind: "move";
        start: { x: number; y: number };
        origin: Map<string, { x: number; y: number }>;
        dragged?: boolean;
      }
    | {
        kind: "resize";
        handle: HandleId;
        start: { x: number; y: number };
        origin: { x: number; y: number; width: number; height: number };
      }
    | {
        kind: "rotate";
        start: number;
        originAngle: number;
        center: { x: number; y: number };
        id: string;
      }
    | {
        kind: "marquee";
        start: { x: number; y: number };
        current: { x: number; y: number };
        additive: boolean;
      }
    | { kind: "pan"; start: { x: number; y: number }; origin: { x: number; y: number } }
    | null
  >(null);
  const { open, menu } = useContextMenu();
  const uiViewRef = useRef({ zoom: ui.zoom, pan: ui.pan });
  uiViewRef.current = { zoom: ui.zoom, pan: ui.pan };

  const windowSize = useMemo(() => {
    const width = scene.useCustomWindowSize
      ? (scene.customWindowWidth ?? project.gameSettings.windowWidth)
      : project.gameSettings.windowWidth;
    const height = scene.useCustomWindowSize
      ? (scene.customWindowHeight ?? project.gameSettings.windowHeight)
      : project.gameSettings.windowHeight;
    return { width: width || 800, height: height || 600 };
  }, [
    scene.useCustomWindowSize,
    scene.customWindowWidth,
    scene.customWindowHeight,
    project.gameSettings.windowWidth,
    project.gameSettings.windowHeight,
  ]);

  const magnification = scene.magnification && scene.magnification > 0 ? scene.magnification : 1;
  const centerWindow = useMemo(
    () => shouldCenterGameWindow(size, windowSize, magnification),
    [size, windowSize, magnification],
  );

  const view = useMemo<View>(() => {
    const scale = ui.zoom * magnification;
    const centeredX = (size.width - windowSize.width * scale) / 2;
    const centeredY = (size.height - windowSize.height * scale) / 2;
    return {
      scale,
      // Keep large game windows centered as their zoom changes. User pan is
      // applied afterwards and remains independent from the game frame.
      offsetX: (centerWindow ? centeredX : 0) + ui.pan.x,
      offsetY: (centerWindow ? centeredY : 0) + ui.pan.y,
    };
  }, [
    size.width,
    size.height,
    ui.zoom,
    ui.pan.x,
    ui.pan.y,
    windowSize.width,
    windowSize.height,
    magnification,
    centerWindow,
  ]);

  const toWorld = useCallback(
    (point: { x: number; y: number }) => ({
      x: (point.x - view.offsetX) / view.scale,
      y: (point.y - view.offsetY) / view.scale,
    }),
    [view.offsetX, view.offsetY, view.scale],
  );

  const editorView = useMemo(
    () => buildEditorState(scene, { showHidden: ui.showHiddenInstances }),
    [scene, ui.showHiddenInstances],
  );

  const snapValue = useCallback(
    (value: number, step: number) => (scene.grid.snap ? Math.round(value / step) * step : value),
    [scene.grid.snap],
  );

  /* ---------------------------------------------------------------- drawing */
  useEffect(() => {
    didInitialFit.current = false;
  }, [scene.name]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const observer = new ResizeObserver(() => {
      const rect = wrap.getBoundingClientRect();
      const nextSize = {
        width: Math.max(120, Math.floor(rect.width)),
        height: Math.max(120, Math.floor(rect.height)),
      };
      setSize(nextSize);

      // GDevelop chooses an initial zoom from the project resolution. Do the
      // same once per scene so all four edges of the game window are visible.
      if (!didInitialFit.current) {
        didInitialFit.current = true;
        const current = uiViewRef.current;
        if (Math.abs(current.zoom - 1) < 0.0001 && current.pan.x === 0 && current.pan.y === 0) {
          const zoom = fitGameWindowZoom(nextSize, windowSize, magnification);
          if (zoom < 0.99) dispatch({ type: "ui", patch: { zoom, pan: { x: 0, y: 0 } } });
        }
      }
    });
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [dispatch, magnification, scene.name, windowSize]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== size.width * dpr || canvas.height !== size.height * dpr) {
      canvas.width = size.width * dpr;
      canvas.height = size.height * dpr;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.width, size.height);
    ctx.fillStyle = "#F5F5F7";
    ctx.fillRect(0, 0, size.width, size.height);
    drawEditorBackdrop(ctx, size, view);

    // The runtime paints the game background only inside the resolution frame,
    // while instances remain visible and editable anywhere in the infinite
    // editor world (including negative and out-of-window coordinates).
    ctx.save();
    ctx.translate(view.offsetX, view.offsetY);
    ctx.scale(view.scale, view.scale);
    renderScene(ctx, editorView.state, {
      width: windowSize.width,
      height: windowSize.height,
      background: rgb(scene.backgroundColor),
      resolve: (name) => resolveAsset(name, project.resources),
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      showHitMasks: ui.showHitMasks,
    });
    drawGrid(ctx, scene, windowSize);
    ctx.restore();

    ctx.save();
    ctx.translate(view.offsetX, view.offsetY);
    ctx.scale(view.scale, view.scale);

    // Selection, handles and marquee, in world space.
    for (const id of ui.selectedInstanceIds) {
      const object = editorView.byInstance.get(id);
      if (!object) continue;
      drawSelection(ctx, object, view.scale);
    }
    if (drag?.kind === "marquee") {
      const a = toWorld(drag.start);
      const b = toWorld(drag.current);
      ctx.save();
      ctx.strokeStyle = "#6868E8";
      ctx.fillStyle = "rgba(104,104,232,0.18)";
      ctx.lineWidth = 1 / view.scale;
      const rect = {
        x: Math.min(a.x, b.x),
        y: Math.min(a.y, b.y),
        w: Math.abs(b.x - a.x),
        h: Math.abs(b.y - a.y),
      };
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
      ctx.restore();
    }
    ctx.restore();

    // Window mask: darken everything outside the game area.
    // windowMask removido para preservar paridad de fondo claro

    // High-contrast game-resolution frame. It must remain unmistakable against
    // both the scene background and the infinite editor backdrop.
    ctx.save();
    const frameLeft = view.offsetX;
    const frameTop = view.offsetY;
    const frameWidth = windowSize.width * view.scale;
    const frameHeight = windowSize.height * view.scale;
    ctx.strokeStyle = "#8AD6FF";
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(0,0,0,0.9)";
    ctx.shadowBlur = 4;
    ctx.strokeRect(frameLeft - 1, frameTop - 1, frameWidth + 2, frameHeight + 2);
    ctx.shadowBlur = 0;

    const frameLabel = `JUEGO · ${windowSize.width}×${windowSize.height}`;
    ctx.font = "600 10px ui-sans-serif, system-ui, sans-serif";
    const labelWidth = Math.ceil(ctx.measureText(frameLabel).width) + 12;
    const labelX = Math.max(4, Math.min(size.width - labelWidth - 4, frameLeft));
    const labelY = frameTop >= 22 ? frameTop - 20 : Math.max(4, frameTop + 4);
    ctx.fillStyle = "rgba(220,224,230,0.95)";
    ctx.fillRect(labelX, labelY, labelWidth, 17);
    ctx.strokeStyle = "rgba(138,214,255,0.75)";
    ctx.lineWidth = 1;
    ctx.strokeRect(labelX + 0.5, labelY + 0.5, labelWidth - 1, 16);
    ctx.fillStyle = "#2563EB";
    ctx.textBaseline = "middle";
    ctx.fillText(frameLabel, labelX + 6, labelY + 8.5);
    ctx.restore();

    // Hover highlight.
    if (hover) {
      const world = toWorld(hover);
      const hit = hitTest(editorView.state.objects, world.x, world.y);
      if (hit && !ui.selectedInstanceIds.includes(hit.id)) {
        ctx.save();
        ctx.translate(view.offsetX, view.offsetY);
        ctx.scale(view.scale, view.scale);
        ctx.strokeStyle = "rgba(74,176,228,0.55)";
        ctx.lineWidth = 1 / view.scale;
        ctx.strokeRect(hit.x, hit.y, hit.width, hit.height);
        ctx.restore();
      }
    }
  }, [
    size,
    view,
    scene,
    windowSize,
    ui.showHitMasks,
    ui.selectedInstanceIds,
    ui.windowMask,
    hover,
    drag,
    editorView,
    project.gameSettings.renderOutsideGameArea,
    project.resources,
    toWorld,
  ]);

  useEffect(() => {
    draw();
  }, [draw]);

  /* ------------------------------------------------------------ hit testing */
  const handleAt = useCallback(
    (point: { x: number; y: number }): HandleId | null => {
      if (ui.selectedInstanceIds.length !== 1) return null;
      const object = editorView.byInstance.get(ui.selectedInstanceIds[0]!);
      if (!object) return null;
      const box = {
        x: view.offsetX + object.x * view.scale,
        y: view.offsetY + object.y * view.scale,
        w: object.width * view.scale,
        h: object.height * view.scale,
      };
      const points: Record<HandleId, { x: number; y: number }> = {
        nw: { x: box.x, y: box.y },
        n: { x: box.x + box.w / 2, y: box.y },
        ne: { x: box.x + box.w, y: box.y },
        e: { x: box.x + box.w, y: box.y + box.h / 2 },
        se: { x: box.x + box.w, y: box.y + box.h },
        s: { x: box.x + box.w / 2, y: box.y + box.h },
        sw: { x: box.x, y: box.y + box.h },
        w: { x: box.x, y: box.y + box.h / 2 },
        rotate: { x: box.x + box.w / 2, y: box.y - 24 },
      };
      for (const [id, position] of Object.entries(points)) {
        if (Math.abs(point.x - position.x) <= HANDLE && Math.abs(point.y - position.y) <= HANDLE) {
          return id as HandleId;
        }
      }
      return null;
    },
    [editorView, ui.selectedInstanceIds, view],
  );

  const localPoint = (event: React.PointerEvent | React.MouseEvent) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const startTwoPointerGesture = () => {
    const pair = [...activeTouchPointers.current.entries()].slice(0, 2);
    const first = pair[0];
    const second = pair[1];
    if (!first || !second) return;
    activeGesture.current = {
      pointerIds: [first[0], second[0]],
      start: {
        points: [first[1], second[1]],
        zoom: ui.zoom,
        magnification,
        pan: { ...ui.pan },
        transform: { ...view },
        viewport: { ...size },
        gameWindow: { ...windowSize },
        centerWindow,
      },
    };
    touchSequenceTransformed.current = true;
    // A two-finger navigation gesture must not inherit the selection side
    // effect caused when its first finger touched the canvas.
    dispatch({ type: "selectInstances", ids: touchSequenceSelection.current });
    setDrag(null);
    setHover(null);
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const point = localPoint(event);
    if (event.pointerType === "touch") {
      if (activeTouchPointers.current.size === 0) {
        touchSequenceTransformed.current = false;
        touchSequenceSelection.current = [...ui.selectedInstanceIds];
      }
      activeTouchPointers.current.set(event.pointerId, point);
      event.currentTarget.setPointerCapture(event.pointerId);
      if (activeTouchPointers.current.size >= 2) {
        startTwoPointerGesture();
        event.preventDefault();
        return;
      }
    }

    if (event.button === 1 || (event.button === 0 && event.altKey)) {
      setDrag({
        kind: "pan",
        start: { x: event.clientX, y: event.clientY },
        origin: { ...ui.pan },
      });
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      return;
    }
    if (event.button !== 0) return;
    const handle = handleAt(point);
    const world = toWorld(point);
    dispatch({
      type: "ui",
      patch: {
        cursorClientPosition: { x: event.clientX, y: event.clientY },
        cursorPosition: { x: Math.round(world.x), y: Math.round(world.y) },
      },
    });

    if (handle && ui.selectedInstanceIds.length === 1) {
      const id = ui.selectedInstanceIds[0]!;
      const object = editorView.byInstance.get(id);
      const instance = scene.instances.find((candidate) => candidate.id === id);
      const layer = instance
        ? scene.layers.find((candidate) => candidate.name === instance.layer)
        : undefined;
      if (instance?.locked || layer?.locked) return;
      if (handle === "rotate" && object) {
        const center = { x: object.x + object.width / 2, y: object.y + object.height / 2 };
        setDrag({
          kind: "rotate",
          id,
          center,
          originAngle: object.angle,
          start: (Math.atan2(world.y - center.y, world.x - center.x) * 180) / Math.PI,
        });
        event.currentTarget.setPointerCapture(event.pointerId);
        return;
      }
      if (object) {
        setDrag({
          kind: "resize",
          handle,
          start: point,
          origin: { x: object.x, y: object.y, width: object.width, height: object.height },
        });
        event.currentTarget.setPointerCapture(event.pointerId);
        return;
      }
    }

    const hit = hitTest(editorView.state.objects, world.x, world.y);
    if (!hit) {
      if (!event.shiftKey) dispatch({ type: "selectInstances", ids: [] });
      setDrag({ kind: "marquee", start: point, current: point, additive: event.shiftKey });
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }
    const sourceInstance = scene.instances.find((instance) => instance.id === hit.id);
    const sourceLayer = sourceInstance
      ? scene.layers.find((layer) => layer.name === sourceInstance.layer)
      : undefined;
    if (sourceInstance?.locked || sourceLayer?.locked) {
      dispatch({ type: "selectInstances", ids: [hit.id] });
      return;
    }
    let ids = ui.selectedInstanceIds;
    if (event.shiftKey) {
      ids = ids.includes(hit.id) ? ids.filter((i) => i !== hit.id) : [...ids, hit.id];
      dispatch({ type: "selectInstances", ids });
      return;
    }
    if (!ids.includes(hit.id)) {
      ids = [hit.id];
      dispatch({ type: "selectInstances", ids });
    }
    const origin = new Map<string, { x: number; y: number }>();
    for (const id of ids) {
      const object = editorView.byInstance.get(id);
      const instance = scene.instances.find((candidate) => candidate.id === id);
      const layer = instance
        ? scene.layers.find((candidate) => candidate.name === instance.layer)
        : undefined;
      if (object && !instance?.locked && !layer?.locked) {
        origin.set(id, { x: object.x, y: object.y });
      }
    }
    setDrag({ kind: "move", start: world, origin, dragged: false });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const point = localPoint(event);
    if (event.pointerType === "touch" && activeTouchPointers.current.has(event.pointerId)) {
      activeTouchPointers.current.set(event.pointerId, point);
      const gesture = activeGesture.current;
      if (gesture) {
        const first = activeTouchPointers.current.get(gesture.pointerIds[0]);
        const second = activeTouchPointers.current.get(gesture.pointerIds[1]);
        if (first && second) {
          const next = resolveTwoPointerGesture(gesture.start, [first, second]);
          dispatch({ type: "ui", patch: next });
        }
        event.preventDefault();
        return;
      }
      // Once a sequence became a two-finger transform, the last remaining
      // finger cannot accidentally select or move an instance.
      if (touchSequenceTransformed.current) return;
    }

    if (event.pointerType !== "touch") setHover(point);
    dispatch({
      type: "ui",
      patch: {
        cursorClientPosition: { x: event.clientX, y: event.clientY },
        cursorPosition: { x: Math.round(toWorld(point).x), y: Math.round(toWorld(point).y) },
      },
    });
    if (!drag) return;
    if (drag.kind === "pan") {
      dispatch({
        type: "ui",
        patch: {
          pan: {
            x: drag.origin.x + (event.clientX - drag.start.x),
            y: drag.origin.y + (event.clientY - drag.start.y),
          },
        },
      });
      return;
    }
    const world = toWorld(point);
    if (drag.kind === "marquee") {
      setDrag({ ...drag, current: point });
      return;
    }
    if (drag.kind === "move") {
      const totalDx = world.x - drag.start.x;
      const totalDy = world.y - drag.start.y;

      if (!drag.dragged) {
        if (Math.hypot(totalDx, totalDy) < 3 / view.scale) {
          return;
        }
        dispatch({ type: "recordHistory" });
        setDrag({ ...drag, dragged: true });
      }

      const positions = Array.from(drag.origin.entries()).map(([id, initialPos]) => ({
        id,
        x: snapValue(initialPos.x + totalDx, scene.grid.width),
        y: snapValue(initialPos.y + totalDy, scene.grid.height),
      }));

      if (positions.length > 0) {
        dispatch({
          type: "setInstancesPositions",
          positions,
        });
      }
      return;
    }
    if (drag.kind === "rotate") {
      const angle = (Math.atan2(world.y - drag.center.y, world.x - drag.center.x) * 180) / Math.PI;
      const next = drag.originAngle + (angle - drag.start);
      dispatch({
        type: "updateInstance",
        id: drag.id,
        patch: { angle: Math.round(event.shiftKey ? Math.round(next / 15) * 15 : next) },
      });
      return;
    }
    if (drag.kind === "resize") {
      const id = ui.selectedInstanceIds[0];
      if (!id) return;
      const dx = (point.x - drag.start.x) / view.scale;
      const dy = (point.y - drag.start.y) / view.scale;
      const origin = drag.origin;
      let x = origin.x;
      let y = origin.y;
      let width = origin.width;
      let height = origin.height;
      if (drag.handle.includes("w")) {
        x = snapValue(origin.x + dx, scene.grid.width);
        width = Math.max(4, origin.width + (origin.x - x));
      }
      if (drag.handle.includes("e")) {
        width = Math.max(4, snapValue(origin.width + dx, scene.grid.width));
      }
      if (drag.handle.includes("n")) {
        y = snapValue(origin.y + dy, scene.grid.height);
        height = Math.max(4, origin.height + (origin.y - y));
      }
      if (drag.handle.includes("s")) {
        height = Math.max(4, snapValue(origin.height + dy, scene.grid.height));
      }
      dispatch({
        type: "updateInstance",
        id,
        patch: { x, y, width, height, customSize: true },
      });
    }
  };

  const onPointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (event.pointerType === "touch") {
      const transformed = touchSequenceTransformed.current;
      activeTouchPointers.current.delete(event.pointerId);
      if (activeGesture.current || transformed) {
        activeGesture.current = null;
        setDrag(null);
        if (activeTouchPointers.current.size >= 2) startTwoPointerGesture();
        if (activeTouchPointers.current.size === 0) touchSequenceTransformed.current = false;
        try {
          event.currentTarget.releasePointerCapture(event.pointerId);
        } catch {
          /* pointer capture may already be gone */
        }
        return;
      }
      if (activeTouchPointers.current.size === 0) touchSequenceTransformed.current = false;
    }

    if (drag?.kind === "marquee") {
      const a = toWorld(drag.start);
      const b = toWorld(drag.current);
      const box = {
        x: Math.min(a.x, b.x),
        y: Math.min(a.y, b.y),
        w: Math.abs(b.x - a.x),
        h: Math.abs(b.y - a.y),
      };
      const ids = editorView.state.objects
        .filter(
          (object) =>
            object.x < box.x + box.w &&
            object.x + object.width > box.x &&
            object.y < box.y + box.h &&
            object.y + object.height > box.y,
        )
        .map((object) => object.id);
      if (ids.length > 0 || !drag.additive) {
        dispatch({
          type: "selectInstances",
          ids: drag.additive ? [...new Set([...ui.selectedInstanceIds, ...ids])] : ids,
        });
      }
    }
    setDrag(null);
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* pointer capture may already be gone */
    }
  };

  const onPointerCancel = (event: React.PointerEvent<HTMLCanvasElement>) => {
    activeTouchPointers.current.delete(event.pointerId);
    activeGesture.current = null;
    setDrag(null);
    setHover(null);
    if (activeTouchPointers.current.size === 0) touchSequenceTransformed.current = false;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* pointer capture may already be gone */
    }
  };

  const onWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      const rect = event.currentTarget.getBoundingClientRect();
      const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      const next = resolveZoomAtPoint(
        point,
        ui.zoom * (event.deltaY < 0 ? WHEEL_ZOOM_FACTOR : 1 / WHEEL_ZOOM_FACTOR),
        {
          zoom: ui.zoom,
          magnification,
          pan: ui.pan,
          transform: view,
          viewport: size,
          gameWindow: windowSize,
          centerWindow,
        },
      );
      dispatch({ type: "ui", patch: next });
      return;
    }
    if (event.shiftKey) {
      dispatch({ type: "ui", patch: { pan: { x: ui.pan.x - event.deltaY, y: ui.pan.y } } });
      return;
    }
    dispatch({
      type: "ui",
      patch: { pan: { x: ui.pan.x - event.deltaX, y: ui.pan.y - event.deltaY } },
    });
  };

  const onDoubleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const world = toWorld(localPoint(event));
    const hit = hitTest(editorView.state.objects, world.x, world.y);
    if (!hit) return;
    const object = scene.objects.find((o) => o.name === hit.name);
    if (object)
      dispatch({ type: "openDialog", dialog: { name: "objectEditor", objectId: object.id } });
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const payload = readDropPayload(event);
    if (!payload) return;
    const world = toWorld({ x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY });
    if (payload.kind === "object") {
      const object = scene.objects.find((o) => o.name === payload.value);
      if (!object) return;
      dispatch({
        type: "addInstance",
        objectId: object.id,
        x: snapValue(world.x, scene.grid.width),
        y: snapValue(world.y, scene.grid.height),
      });
      return;
    }
    // A resource dropped on the scene creates (or reuses) a sprite using it.
    const name = payload.value.replace(/\.[a-z0-9]+$/i, "");
    const existing = scene.objects.find((o) => o.name === name);
    dispatch({
      type: "addObject",
      object: {
        name: existing
          ? uniqueName(
              name,
              scene.objects.map((o) => o.name),
            )
          : name,
        type: "Sprite",
        asset: payload.value,
        animations: [],
        effects: [],
        behaviors: [],
        variables: [],
      },
    });
  };

  const contextMenuEntries = (event: React.MouseEvent<HTMLCanvasElement>): MenuEntry[] => {
    const world = toWorld(localPoint(event));
    const hit = hitTest(editorView.state.objects, world.x, world.y);
    const selected = ui.selectedInstanceIds;
    if (hit && !selected.includes(hit.id)) dispatch({ type: "selectInstances", ids: [hit.id] });
    const instances: GDInstance[] = selected
      .map((id) => scene.instances.find((i) => i.id === id))
      .filter((i): i is GDInstance => !!i);
    return [
      {
        id: "front",
        label: S.bringToFront,
        disabled: instances.length === 0,
        onSelect: () => dispatch({ type: "setInstancesZOrder", ids: selected, mode: "front" }),
      },
      {
        id: "back",
        label: S.sendToBack,
        disabled: instances.length === 0,
        onSelect: () => dispatch({ type: "setInstancesZOrder", ids: selected, mode: "back" }),
      },
      {
        id: "duplicate",
        label: S.duplicate,
        disabled: instances.length === 0,
        separatorBefore: true,
        onSelect: () => dispatch({ type: "duplicateInstances", ids: selected }),
      },
      {
        id: "copy",
        label: S.copy,
        disabled: instances.length === 0,
        onSelect: () => copyInstances(instances),
      },
      {
        id: "cut",
        label: S.cut,
        disabled: instances.length === 0,
        onSelect: () => {
          cutInstances(scene, selected);
          dispatch({ type: "deleteInstances", ids: selected });
        },
      },
      {
        id: "paste",
        label: S.paste,
        disabled: !hasClipboard(),
        onSelect: () => {
          const { instances: next } = pasteInto(scene);
          if (next.length) dispatch({ type: "addInstances", instances: next });
        },
      },
      {
        id: "hide",
        label: instances.every((i) => i.hiddenAtStart) ? S.show : S.hide,
        disabled: instances.length === 0,
        separatorBefore: true,
        onSelect: () => dispatch({ type: "toggleInstancesVisibility", ids: selected }),
      },
      {
        id: "lock",
        label: instances.every((i) => i.locked) ? S.unlock : S.lock,
        disabled: instances.length === 0,
        onSelect: () => dispatch({ type: "toggleInstancesLock", ids: selected }),
      },
      {
        id: "delete",
        label: S.delete,
        danger: true,
        disabled: instances.length === 0,
        separatorBefore: true,
        onSelect: () => dispatch({ type: "deleteInstances", ids: selected }),
      },
      {
        id: "objects",
        label: S.addANewObject,
        separatorBefore: true,
        onSelect: () => dispatch({ type: "openDialog", dialog: { name: "newObject" } }),
      },
    ];
  };

  const fitWindow = () =>
    dispatch({
      type: "ui",
      patch: {
        zoom: fitGameWindowZoom(size, windowSize, magnification),
        pan: { x: 0, y: 0 },
      },
    });

  const cursor =
    drag?.kind === "move"
      ? "grabbing"
      : drag?.kind === "pan"
        ? "move"
        : hover && handleAt(hover)
          ? handleCursor(handleAt(hover)!)
          : "default";

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-[#F5F5F7]">
      <div
        ref={wrapRef}
        className="relative min-h-0 flex-1 overflow-hidden"
        onDragOver={(event) => {
          if (
            event.dataTransfer.types.includes(DND_OBJECT) ||
            event.dataTransfer.types.includes(DND_RESOURCE)
          ) {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
          }
        }}
        onDrop={onDrop}
      >
        <canvas
          ref={canvasRef}
          aria-label="Editor de escena 2D: un dedo interactúa; dos dedos desplazan y amplían"
          data-touch-controls="one-finger-interaction two-finger-pan pinch-zoom"
          style={{ width: size.width, height: size.height, cursor }}
          className="absolute inset-0 block touch-none select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onPointerLeave={(event) => {
            if (event.pointerType !== "touch") setHover(null);
          }}
          onWheel={onWheel}
          onDoubleClick={onDoubleClick}
          onContextMenu={(event) => open(event, contextMenuEntries(event))}
        />
        <SceneViewToolbar onFit={fitWindow} />
      </div>
      <StatusBar onFitWindow={fitWindow} />
      {menu}
    </div>
  );
}

function StatusBar({ onFitWindow }: { onFitWindow: () => void }) {
  const { ui, scene, project } = useEditor();
  const { width, height } = useMemo(() => {
    const w = scene.useCustomWindowSize
      ? (scene.customWindowWidth ?? project.gameSettings.windowWidth)
      : project.gameSettings.windowWidth;
    const h = scene.useCustomWindowSize
      ? (scene.customWindowHeight ?? project.gameSettings.windowHeight)
      : project.gameSettings.windowHeight;
    return { width: w, height: h };
  }, [scene, project.gameSettings]);
  return (
    <div className="flex h-6 shrink-0 items-center gap-3 border-t border-separator bg-toolbar px-2 text-[11px] tabular-nums text-text-secondary">
      <span className="w-24">
        {ui.cursorPosition ? `${ui.cursorPosition.x};${ui.cursorPosition.y}` : "—"}
      </span>
      <span className="hidden sm:inline">
        Ventana: {width}×{height}
      </span>
      <button
        type="button"
        onClick={onFitWindow}
        className="rounded px-1 text-[#8AD6FF] hover:bg-elevated hover:text-foreground"
        title="Encajar la ventana del juego"
      >
        Encajar
      </button>
      <span className="hidden lg:inline">
        Capa: {scene.activeLayer} · {S.instances}: {scene.instances.length}
      </span>
      <span className="hidden text-[10px] text-text-placeholder sm:inline md:hidden">
        1 dedo: editar · 2: mover/zoom
      </span>
      <span className="ml-auto">{Math.round(ui.zoom * 100)}%</span>
      <span className={cn("hidden sm:inline", scene.grid.show ? "text-[#8AD6FF]" : "")}>
        {scene.grid.width}×{scene.grid.height}
      </span>
      <span className="hidden lg:inline">
        {ui.showHiddenInstances ? "Ocultas visibles" : "Ocultas ocultas"}
      </span>
    </div>
  );
}

function hitTest(objects: RTObject[], x: number, y: number): RTObject | undefined {
  let best: RTObject | undefined;
  for (const object of objects) {
    if (object.hidden) continue;
    if (
      x >= object.x &&
      x <= object.x + object.width &&
      y >= object.y &&
      y <= object.y + object.height
    ) {
      if (!best || object.zOrder >= best.zOrder) best = object;
    }
  }
  return best;
}

function drawSelection(ctx: CanvasRenderingContext2D, object: RTObject, scale: number) {
  ctx.save();
  ctx.translate(object.x + object.width / 2, object.y + object.height / 2);
  if (object.angle) ctx.rotate((object.angle * Math.PI) / 180);
  ctx.translate(-object.width / 2, -object.height / 2);
  ctx.strokeStyle = "#4AB0E4";
  ctx.lineWidth = 1 / scale;
  ctx.setLineDash([3 / scale, 2 / scale]);
  ctx.strokeRect(0, 0, object.width, object.height);
  ctx.setLineDash([]);

  // Rotate stem.
  ctx.beginPath();
  ctx.moveTo(object.width / 2, 0);
  ctx.lineTo(object.width / 2, -24 / scale);
  ctx.stroke();

  const handles: { x: number; y: number }[] = [
    { x: 0, y: 0 },
    { x: object.width / 2, y: 0 },
    { x: object.width, y: 0 },
    { x: object.width, y: object.height / 2 },
    { x: object.width, y: object.height },
    { x: object.width / 2, y: object.height },
    { x: 0, y: object.height },
    { x: 0, y: object.height / 2 },
  ];
  const size = HANDLE / scale;
  ctx.fillStyle = "#FFFFFF";
  ctx.strokeStyle = "#20202A";
  for (const handle of handles) {
    ctx.fillRect(handle.x - size / 2, handle.y - size / 2, size, size);
    ctx.strokeRect(handle.x - size / 2, handle.y - size / 2, size, size);
  }
  // Rotate handle: circle.
  ctx.beginPath();
  ctx.arc(object.width / 2, -24 / scale, size * 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

function drawEditorBackdrop(
  ctx: CanvasRenderingContext2D,
  size: { width: number; height: number },
  view: View,
) {
  let worldStep = 64;
  while (worldStep * view.scale < 22) worldStep *= 2;
  while (worldStep * view.scale > 88) worldStep /= 2;
  const screenStep = Math.max(12, worldStep * view.scale);
  const startX = positiveModulo(view.offsetX, screenStep);
  const startY = positiveModulo(view.offsetY, screenStep);

  ctx.save();
  ctx.fillStyle = "rgba(158,180,255,0.16)";
  for (let x = startX; x <= size.width; x += screenStep) {
    for (let y = startY; y <= size.height; y += screenStep) {
      ctx.fillRect(Math.round(x) - 0.5, Math.round(y) - 0.5, 1.5, 1.5);
    }
  }
  ctx.restore();
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  scene: GDScene,
  windowSize: { width: number; height: number },
) {
  if (!scene.grid.show) return;
  const { width: cellW, height: cellH, offsetX, offsetY, alpha, kind } = scene.grid;
  const color = scene.grid.color.startsWith("#")
    ? scene.grid.color
    : `rgb(${scene.grid.color.split(";").join(",")})`;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (kind === "isometric") {
    const step = Math.max(4, cellW);
    for (let x = -windowSize.height - offsetX; x < windowSize.width + step; x += step) {
      ctx.moveTo(x, -offsetY);
      ctx.lineTo(x + windowSize.height, windowSize.height - offsetY);
      ctx.moveTo(x, -offsetY);
      ctx.lineTo(x - windowSize.height, windowSize.height - offsetY);
    }
  } else {
    for (let x = -offsetX; x <= windowSize.width; x += Math.max(2, cellW)) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, windowSize.height);
    }
    for (let y = -offsetY; y <= windowSize.height; y += Math.max(2, cellH)) {
      ctx.moveTo(0, y);
      ctx.lineTo(windowSize.width, y);
    }
  }
  ctx.stroke();
  ctx.restore();
}

function handleCursor(handle: HandleId): string {
  switch (handle) {
    case "n":
    case "s":
      return "ns-resize";
    case "e":
    case "w":
      return "ew-resize";
    case "ne":
    case "sw":
      return "nesw-resize";
    case "nw":
    case "se":
      return "nwse-resize";
    case "rotate":
      return "grab";
  }
}

function uniqueName(base: string, taken: string[]): string {
  let candidate = `${base}2`;
  let index = 2;
  while (taken.includes(candidate)) {
    index += 1;
    candidate = `${base}${index}`;
  }
  return candidate;
}
