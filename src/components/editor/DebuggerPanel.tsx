// Debugger for the preview — GDevelop's `Debugger` iframe: the inspector (scene
// variables and instances), the events debugger (which instructions ran) and the
// profiler counters. Reads the live `RuntimeState` from the runtime instance.

import * as React from "react";
import { Activity, Bug, ScrollText } from "lucide-react";
import type { GameRuntime } from "@/lib/runtime/engine";
import { S } from "@/lib/editor/i18n";
import { cn } from "@/lib/utils";

type Tab = "inspector" | "debugger" | "profiler";

const TABS: { id: Tab; label: string; icon: typeof Activity }[] = [
  { id: "inspector", label: S.inspector, icon: Activity },
  { id: "debugger", label: S.debugger, icon: Bug },
  { id: "profiler", label: S.profiler, icon: ScrollText },
];

export function DebuggerPanel({
  runtime,
  className,
}: {
  runtime: GameRuntime;
  className?: string;
}) {
  const [tab, setTab] = React.useState<Tab>("inspector");
  const [, setPulse] = React.useState(0);
  React.useEffect(() => {
    const id = window.setInterval(() => setPulse((value) => value + 1), 250);
    return () => window.clearInterval(id);
  }, []);

  const state = runtime.state;

  return (
    <aside
      className={cn("flex min-h-0 flex-col bg-[#1B1D22] text-[12px] text-foreground", className)}
    >
      <div className="flex shrink-0 gap-1 border-b border-separator p-1">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setTab(entry.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1 rounded px-1 py-1 text-[11.5px]",
              tab === entry.id
                ? "bg-[#494952] text-[#F6F2FF]"
                : "text-text-secondary hover:bg-list-hover",
            )}
          >
            <entry.icon className="h-3.5 w-3.5" />
            <span className="truncate">{entry.label}</span>
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === "inspector" ? <Inspector state={state} /> : null}
        {tab === "debugger" ? <EventsDebug state={state} /> : null}
        {tab === "profiler" ? <Profiler state={state} /> : null}
      </div>
    </aside>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-2 border-b border-separator/50 px-2 py-1">
      <span className="min-w-0 flex-1 truncate text-text-secondary">{label}</span>
      <span className="shrink-0 tabular-nums text-foreground">{value}</span>
    </div>
  );
}

function Inspector({ state }: { state: GameRuntime["state"] }) {
  return (
    <div>
      <h4 className="bg-[#25252E] px-2 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-[#D6DEEC]">
        {S.sceneVariables}
      </h4>
      {Object.keys(state.variables).length === 0 ? (
        <p className="px-2 py-1.5 text-text-placeholder">Sin variables de escena.</p>
      ) : null}
      {Object.entries(state.variables).map(([name, value]) => (
        <Row key={name} label={name} value={value} />
      ))}

      <h4 className="mt-2 bg-[#25252E] px-2 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-[#D6DEEC]">
        {S.globalVariables}
      </h4>
      {Object.keys(state.globalVariables).length === 0 ? (
        <p className="px-2 py-1.5 text-text-placeholder">Sin variables globales.</p>
      ) : null}
      {Object.entries(state.globalVariables).map(([name, value]) => (
        <Row key={name} label={name} value={value} />
      ))}

      <h4 className="mt-2 bg-[#25252E] px-2 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-[#D6DEEC]">
        {S.instances} ({state.objects.length})
      </h4>
      {state.objects.slice(0, 40).map((object) => (
        <details key={object.id} className="border-b border-separator/50">
          <summary className="flex cursor-pointer items-center gap-2 px-2 py-1 hover:bg-list-hover">
            <span className="min-w-0 flex-1 truncate">{object.name}</span>
            <span className="shrink-0 text-[10.5px] text-text-secondary">
              {Math.round(object.x)},{Math.round(object.y)}
            </span>
            {object.hidden ? (
              <span className="shrink-0 rounded bg-elevated px-1 text-[9.5px] text-[#FFBC57]">
                oculto
              </span>
            ) : null}
          </summary>
          <div className="bg-[#16181D]">
            <Row label="capa" value={object.layer} />
            <Row label="z" value={object.zOrder} />
            <Row label="ángulo" value={`${Math.round(object.angle)}°`} />
            <Row
              label="tamaño"
              value={`${Math.round(object.width)}×${Math.round(object.height)}`}
            />
            <Row label="animación" value={`${object.animationName} #${object.frameIndex}`} />
            <Row label="opacidad" value={object.opacity} />
            <Row label="velocidad" value={`${Math.round(object.vx)}, ${Math.round(object.vy)}`} />
            {object.behaviors.length > 0 ? (
              <Row label="comportamientos" value={object.behaviors.join(", ")} />
            ) : null}
            {Object.keys(object.variables).length > 0
              ? Object.entries(object.variables).map(([name, value]) => (
                  <Row key={name} label={`var ${name}`} value={value} />
                ))
              : null}
          </div>
        </details>
      ))}
    </div>
  );
}

function EventsDebug({ state }: { state: GameRuntime["state"] }) {
  return (
    <div>
      <h4 className="bg-[#25252E] px-2 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-[#D6DEEC]">
        Consola
      </h4>
      {state.logs.length === 0 ? (
        <p className="px-2 py-1.5 text-text-placeholder">Sin mensajes todavía.</p>
      ) : null}
      {[...state.logs].reverse().map((log, index) => (
        <div
          key={`${log.time}-${index}`}
          className="flex gap-2 border-b border-separator/50 px-2 py-1"
        >
          <span className="shrink-0 tabular-nums text-text-placeholder">
            {log.time.toFixed(2)}s
          </span>
          <span className="min-w-0 flex-1 break-words">{log.message}</span>
        </div>
      ))}
      <h4 className="mt-2 bg-[#25252E] px-2 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-[#D6DEEC]">
        Timers
      </h4>
      {Object.keys(state.timers).length === 0 ? (
        <p className="px-2 py-1.5 text-text-placeholder">Ningún temporizador creado.</p>
      ) : null}
      {Object.entries(state.timers).map(([name, value]) => (
        <Row key={name} label={name} value={`${value.toFixed(2)}s`} />
      ))}
    </div>
  );
}

function Profiler({ state }: { state: GameRuntime["state"] }) {
  const ms = state.stats.frameTimeMs;
  return (
    <div>
      <h4 className="bg-[#25252E] px-2 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-[#D6DEEC]">
        {S.profiler}
      </h4>
      <Row label={S.frameTime} value={`${ms.toFixed(2)} ms`} />
      <div className="px-2 py-1.5">
        <div className="h-1.5 overflow-hidden rounded bg-[#1D1D26]">
          <div
            className={cn(
              "h-full",
              ms > 16.6 ? "bg-[#FF8569]" : ms > 8 ? "bg-[#FFBC57]" : "bg-[#0ECD7A]",
            )}
            style={{ width: `${Math.min(100, (ms / 16.6) * 100)}%` }}
          />
        </div>
        <p className="mt-1 text-[10.5px] text-text-placeholder">
          Presupuesto por cuadro: 16,6 ms (60 FPS)
        </p>
      </div>
      <Row label={S.objectsCount} value={state.stats.objectsCount} />
      <Row label={S.eventsSheet} value={state.stats.eventsCount} />
      <Row label="Instrucciones ejecutadas" value={state.stats.instructionsCount} />
      <Row label="Cuadro" value={state.frame} />
      <Row label="Tiempo" value={`${state.time.toFixed(2)}s`} />
      <Row label="Escala de tiempo" value={state.timeScale.toFixed(2)} />
      <Row label="Cámara" value={`${Math.round(state.camera.x)}, ${Math.round(state.camera.y)}`} />
    </div>
  );
}
