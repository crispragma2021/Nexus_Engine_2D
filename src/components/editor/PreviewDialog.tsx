import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useEditor } from "@/lib/editor/store";
import { GameRuntime } from "@/lib/runtime/engine";
import { renderScene } from "@/lib/runtime/renderer";
import { cn } from "@/lib/utils";

interface PreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TOUCH_KEYS: { key: string; label: string }[] = [
  { key: "Left", label: "◀" },
  { key: "Up", label: "▲" },
  { key: "Right", label: "▶" },
];

export function PreviewDialog({ open, onOpenChange }: PreviewDialogProps) {
  const { project } = useEditor();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runtimeRef = useRef<GameRuntime | null>(null);
  const frameRef = useRef<number | null>(null);
  const [running, setRunning] = useState(true);
  const [fps, setFps] = useState(0);
  const [status, setStatus] = useState("");

  const start = useCallback(() => {
    const runtime = new GameRuntime(project, {
      onPlaySound: (file) => setStatus(`♪ ${file}`),
      onChangeScene: (scene) => {
        setStatus(`Scene → ${scene} (restarting)`);
        // A scene change restarts the simulation, like GDevelop does.
        window.setTimeout(() => runtimeRef.current?.reset(), 400);
      },
    });
    runtimeRef.current = runtime;
    return runtime;
  }, [project]);

  // Boot / dispose the runtime with the dialog.
  useEffect(() => {
    if (!open) {
      runtimeRef.current = null;
      return;
    }
    start();
    setRunning(true);
    setStatus("");
  }, [open, start]);

  // Game loop.
  useEffect(() => {
    if (!open || !running) return;
    let last = performance.now();
    let acc = 0;
    let frames = 0;

    const loop = (now: number) => {
      frameRef.current = requestAnimationFrame(loop);
      const runtime = runtimeRef.current;
      const canvas = canvasRef.current;
      if (!runtime || !canvas) return;

      const delta = (now - last) / 1000;
      last = now;
      acc += delta;
      frames += 1;
      if (acc >= 0.5) {
        setFps(Math.round(frames / acc));
        acc = 0;
        frames = 0;
      }

      runtime.step(delta);
      const ctx = canvas.getContext("2d");
      if (ctx) {
        renderScene(ctx, runtime.state, {
          width: runtime.width,
          height: runtime.height,
          background: "#1a1a24",
        });
      }
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [open, running]);

  // Keyboard input.
  useEffect(() => {
    if (!open) return;
    const down = (event: KeyboardEvent) => {
      if (event.key === " ") event.preventDefault();
      runtimeRef.current?.pressKey(event.key);
    };
    const up = (event: KeyboardEvent) => runtimeRef.current?.releaseKey(event.key);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [open]);

  const restart = () => {
    runtimeRef.current?.reset();
    setStatus("");
    setRunning(true);
  };

  const holdKey = (key: string) => ({
    onPointerDown: (event: React.PointerEvent) => {
      event.preventDefault();
      runtimeRef.current?.pressKey(key);
    },
    onPointerUp: () => runtimeRef.current?.releaseKey(key),
    onPointerLeave: () => runtimeRef.current?.releaseKey(key),
    onPointerCancel: () => runtimeRef.current?.releaseKey(key),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[min(96vw,900px)] gap-0 border-separator bg-toolbar p-0"
      >
        <DialogTitle className="sr-only">Game preview</DialogTitle>

        <div className="flex h-11 items-center gap-2 border-b border-separator px-2">
          <span className="truncate text-xs font-medium text-foreground">{project.name}</span>
          <span className="text-[10px] text-muted-foreground">{fps} FPS</span>
          {status ? (
            <span className="truncate text-[10px] text-link">{status}</span>
          ) : null}
          <div className="flex-1" />
          <button
            type="button"
            title={running ? "Pause" : "Resume"}
            aria-label={running ? "Pause" : "Resume"}
            onClick={() => setRunning((value) => !value)}
            className="flex h-9 w-9 items-center justify-center rounded text-muted-foreground hover:bg-elevated hover:text-foreground"
          >
            {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button
            type="button"
            title="Restart"
            aria-label="Restart"
            onClick={restart}
            className="flex h-9 w-9 items-center justify-center rounded text-muted-foreground hover:bg-elevated hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-center bg-window p-2">
          <canvas
            ref={canvasRef}
            width={project.windowWidth}
            height={project.windowHeight}
            className="h-auto w-full max-w-full rounded border border-separator"
            style={{ aspectRatio: `${project.windowWidth}/${project.windowHeight}` }}
          />
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-separator px-3 py-2 md:hidden">
          <div className="flex gap-2">
            {TOUCH_KEYS.map((entry) => (
              <button
                key={entry.key}
                type="button"
                aria-label={entry.key}
                {...holdKey(entry.key)}
                className="flex h-12 w-12 select-none items-center justify-center rounded-full bg-elevated text-base text-foreground active:bg-primary"
              >
                {entry.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-label="Jump"
            {...holdKey("Space")}
            className={cn(
              "flex h-12 select-none items-center justify-center rounded-full bg-primary px-6",
              "text-[11px] font-semibold uppercase tracking-wide text-foreground active:opacity-80",
            )}
          >
            Jump
          </button>
        </div>

        <p className="hidden px-3 pb-2 text-[10px] text-muted-foreground md:block">
          Arrows / A-D to move · Space or Up to jump
        </p>
      </DialogContent>
    </Dialog>
  );
}
