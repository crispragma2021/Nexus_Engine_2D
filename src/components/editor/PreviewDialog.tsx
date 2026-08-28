// Preview — GDevelop's `PreviewWindow`: runs the scene with the Nexus runtime in a
// canvas, forwards keyboard/mouse/touch to the runtime, offers the screen-size
// chooser, pause/restart, and the debugger panel when started "with debugger".

import * as React from "react";
import { Bug, Gamepad2, Pause, Play, RotateCcw, Smartphone, X } from "lucide-react";
import { useEditor } from "@/lib/editor/store";
import { toRuntimeScene } from "@/lib/editor/scenes";
import { GameRuntime, normalizeKey } from "@/lib/runtime/engine";
import { renderScene } from "@/lib/runtime/renderer";
import { resolveAsset } from "@/lib/editor/catalog";
import { S } from "@/lib/editor/i18n";
import { cn } from "@/lib/utils";
import { GdButton, GdMenu, type MenuEntry } from "./gd/kit";
import { DebuggerPanel } from "./DebuggerPanel";

const SCREENS: { id: string; label: string; width: number; height: number }[] = [
  { id: "window", label: "Tamaño de la ventana del juego", width: 0, height: 0 },
  { id: "desktop", label: "Escritorio (1920×1080)", width: 1920, height: 1080 },
  { id: "phone", label: "Móvil (414×736)", width: 414, height: 736 },
  { id: "tablet", label: "Tablet (1024×768)", width: 1024, height: 768 },
];

const TOUCH_BUTTONS: { key: string; label: string }[] = [
  { key: "Left", label: "◀" },
  { key: "Right", label: "▶" },
  { key: "Up", label: "▲" },
  { key: "Space", label: "A" },
];

export function PreviewDialog() {
  const { project, scene, ui, dispatch } = useEditor();
  const open = ui.previewOpen;
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const runtimeRef = React.useRef<GameRuntime | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const [paused, setPaused] = React.useState(false);
  const [fps, setFps] = React.useState(0);
  const [screen, setScreen] = React.useState("window");
  const [screenMenu, setScreenMenu] = React.useState<{ x: number; y: number } | null>(null);
  const [showDebugger, setShowDebugger] = React.useState(ui.previewWithDebugger);
  const [status, setStatus] = React.useState("");
  const [tick, setTick] = React.useState(0);

  const close = () => {
    dispatch({ type: "ui", patch: { previewOpen: false, previewWithDebugger: false } });
  };

  // (Re)start the runtime for the current scene, wiring the sounds and scene
  // changes back to this dialog (like GDevelop's preview bridge).
  const start = React.useCallback(() => {
    const runtime = new GameRuntime(
      toRuntimeScene(project, scene),
      {
        onPlaySound: (file, volume, loop) =>
          setStatus(`♪ ${file}${loop ? " (bucle)" : ""} · ${Math.round(volume * 100)}%`),
        onStopSound: (channel) => setStatus(`■ canal ${channel} detenido`),
        onChangeScene: (name) => setStatus(`Escena → ${name}`),
      },
      project,
    );
    runtimeRef.current = runtime;
    setTick((value) => value + 1);
    return runtime;
  }, [project, scene]);

  React.useEffect(() => {
    if (!open) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      runtimeRef.current = null;
      setPaused(false);
      setStatus("");
      return;
    }
    setShowDebugger(ui.previewWithDebugger);
    const runtime = start();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      event.preventDefault();
      runtime.pressKey(event.key);
    };
    const onKeyUp = (event: KeyboardEvent) => {
      event.preventDefault();
      runtime.releaseKey(event.key);
    };
    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp);

    let last = performance.now();
    let frames = 0;
    let fpsClock = last;

    const loop = (now: number) => {
      rafRef.current = requestAnimationFrame(loop);
      const delta = Math.min(0.1, (now - last) / 1000);
      last = now;
      frames += 1;
      if (now - fpsClock > 500) {
        setFps(Math.round((frames * 1000) / (now - fpsClock)));
        frames = 0;
        fpsClock = now;
        setTick((value) => value + 1);
      }
      const current = runtimeRef.current;
      if (!current) return;
      if (!paused) current.step(delta);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      const state = current.state;
      const sceneEntry = project.scenes.find((entry) => entry.name === state.sceneName);
      const backgroundColor = sceneEntry?.backgroundColor ?? "#000000";
      const dpr = window.devicePixelRatio || 1;
      const wantedWidth = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      const wantedHeight = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== wantedWidth || canvas.height !== wantedHeight) {
        canvas.width = wantedWidth;
        canvas.height = wantedHeight;
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      renderScene(ctx, state, {
        width: current.width,
        height: current.height,
        background: `rgb(${backgroundColor.split(";").join(",")})`,
        resolve: resolveAsset,
        scale: wantedWidth / (current.width || 1),
      });
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [open, start, paused, project, ui.previewWithDebugger]);

  const runtime = runtimeRef.current;
  const size = SCREENS.find((entry) => entry.id === screen);
  const aspect =
    size && size.width
      ? `${size.width} / ${size.height}`
      : runtime
        ? `${runtime.width} / ${runtime.height}`
        : `${project.gameSettings.windowWidth} / ${project.gameSettings.windowHeight}`;

  const screenEntries: MenuEntry[] = SCREENS.map((entry) => ({
    id: entry.id,
    label: entry.label,
    checked: screen === entry.id,
    onSelect: () => setScreen(entry.id),
  }));

  const touch = (key: string, pressed: boolean) => {
    const current = runtimeRef.current;
    if (!current) return;
    if (pressed) current.pressKey(key);
    else current.releaseKey(key);
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col bg-[#0D0D12]",
        !open && "pointer-events-none invisible",
      )}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <header className="flex h-11 shrink-0 items-center gap-2 border-b border-separator bg-toolbar px-2">
        <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-foreground">
          <Play className="h-3.5 w-3.5 fill-current text-success" />
          {S.preview}
          <span className="font-normal text-text-secondary">
            — {runtime?.state.sceneName ?? scene.name}
          </span>
        </span>
        <span className="ml-2 rounded bg-elevated px-1.5 py-0.5 text-[11px] tabular-nums text-text-secondary">
          {fps} FPS
        </span>
        {status ? <span className="truncate text-[11.5px] text-[#8AD6FF]">{status}</span> : null}
        <div className="ml-auto flex items-center gap-1">
          <GdButton
            size="small"
            variant="raised"
            icon={paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            onClick={() => setPaused((value) => !value)}
          >
            {paused ? S.resume : S.pause}
          </GdButton>
          <GdButton
            size="small"
            variant="raised"
            icon={<RotateCcw className="h-3.5 w-3.5" />}
            onClick={() => {
              start();
              setPaused(false);
            }}
          >
            {S.restart}
          </GdButton>
          <GdButton
            size="small"
            variant="raised"
            icon={<Bug className="h-3.5 w-3.5" />}
            className={showDebugger ? "bg-[#3D4D51] text-[#E5C07B]" : undefined}
            onClick={() => setShowDebugger((value) => !value)}
          >
            {S.debugger}
          </GdButton>
          <button
            type="button"
            aria-label="Tamaño de pantalla"
            onClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              setScreenMenu({ x: rect.right - 230, y: rect.bottom + 2 });
            }}
            className="grid h-8 w-8 place-items-center rounded text-text-secondary hover:bg-elevated hover:text-foreground"
          >
            <Smartphone className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={S.close}
            onClick={close}
            className="grid h-8 w-8 place-items-center rounded text-text-secondary hover:bg-elevated hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 items-center justify-center p-3">
          <div
            className="relative flex max-h-full w-full max-w-[min(100%,1400px)] items-center justify-center"
            style={aspect ? { aspectRatio: aspect } : undefined}
          >
            <canvas
              ref={canvasRef}
              tabIndex={0}
              onMouseDown={(event) => {
                event.currentTarget.focus();
                runtimeRef.current?.pressMouse(event.button === 2 ? "Right" : "Left");
              }}
              onMouseUp={() => runtimeRef.current?.releaseMouse("Left")}
              onMouseMove={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                const current = runtimeRef.current;
                if (!current) return;
                const scaleX = current.width / rect.width;
                const scaleY = current.height / rect.height;
                current.movePointer(
                  (event.clientX - rect.left) * scaleX,
                  (event.clientY - rect.top) * scaleY,
                );
              }}
              className="max-h-[calc(100vh-190px)] w-full rounded bg-black shadow-[0_0_0_1px_rgba(255,255,255,0.08)] outline-none focus:shadow-[0_0_0_2px_var(--brand)]"
            />
            <div className="pointer-events-none absolute bottom-1 right-2 text-[10px] tabular-nums text-[#6a6a75]">
              {runtime ? `${runtime.width}×${runtime.height}` : ""} · {tick % 2 === 0 ? "●" : "○"}
            </div>
          </div>
        </div>

        {showDebugger && runtime ? (
          <DebuggerPanel
            runtime={runtime}
            className="w-[320px] shrink-0 border-l border-separator"
          />
        ) : null}
      </div>

      <footer className="flex h-14 shrink-0 items-center gap-2 border-t border-separator bg-toolbar px-3">
        <Gamepad2 className="h-4 w-4 shrink-0 text-text-secondary" />
        <div className="flex gap-1.5">
          {TOUCH_BUTTONS.map((button) => (
            <button
              key={button.key}
              type="button"
              onPointerDown={() => touch(button.key, true)}
              onPointerUp={() => touch(button.key, false)}
              onPointerLeave={() => touch(button.key, false)}
              className="grid h-10 w-12 select-none place-items-center rounded border border-separator bg-elevated text-[15px] text-foreground active:bg-[var(--brand)] active:text-[#F6F2FF]"
              title={`Tecla ${normalizeKey(button.key)}`}
            >
              {button.label}
            </button>
          ))}
        </div>
        <p className="ml-2 hidden text-[11.5px] text-text-secondary md:block">
          Las teclas del juego se capturan aquí: flechas para mover, Espacio/↑ para saltar. Haz clic
          en el juego para capturar el ratón.
        </p>
        <span className="ml-auto text-[11.5px] text-text-secondary">
          Cierra con la × para volver a editar
        </span>
      </footer>

      {screenMenu ? (
        <GdMenu entries={screenEntries} anchor={screenMenu} onClose={() => setScreenMenu(null)} />
      ) : null}
    </div>
  );
}

const EscHint = () => "Esc para cerrar la vista previa";
