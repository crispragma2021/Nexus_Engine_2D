// Shared primitives that encode GDevelop's look in one place, so panels and
// dialogs stay visually identical without repeating the metrics everywhere.
//
// Metrics from the reference app: panel title 11px uppercase on desktop / 15px
// bold on mobile, list rows 27-34px, dialog background #25252E, fields with an
// underline border (#D6DEEC), icon buttons 32px (48px touch target on mobile).

import * as React from "react";
import { ChevronDown, ChevronRight, HelpCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------- panel */

export function PanelHeader({
  title,
  badge,
  actions,
  onClose,
  className,
}: {
  title: React.ReactNode;
  badge?: React.ReactNode | undefined;
  actions?: React.ReactNode | undefined;
  onClose?: (() => void) | undefined;
  className?: string | undefined;
}) {
  return (
    <div
      className={cn(
        "flex h-9 shrink-0 items-center gap-1 border-b border-separator px-2",
        className,
      )}
    >
      <span className="flex-1 truncate text-[11px] font-semibold uppercase tracking-wide text-muted-foreground md:text-[11px]">
        {title}
      </span>
      {badge ? (
        <span className="rounded-full bg-elevated px-1.5 py-0.5 text-[10px] tabular-nums text-text-secondary">
          {badge}
        </span>
      ) : null}
      {actions}
      {onClose ? (
        <button
          type="button"
          aria-label="Cerrar panel"
          onClick={onClose}
          className="-mr-1 flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-elevated hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

/** Panel column: header + scrollable body + optional footer action. */
export function Panel({
  title,
  badge,
  actions,
  footer,
  onClose,
  children,
  className,
  bodyClassName,
}: {
  title: React.ReactNode;
  badge?: React.ReactNode | undefined;
  actions?: React.ReactNode | undefined;
  footer?: React.ReactNode | undefined;
  onClose?: (() => void) | undefined;
  children: React.ReactNode;
  className?: string | undefined;
  bodyClassName?: string | undefined;
}) {
  return (
    <section
      className={cn(
        "flex min-h-0 w-full flex-col border-separator bg-toolbar text-foreground",
        className,
      )}
    >
      <PanelHeader title={title} badge={badge} actions={actions} onClose={onClose} />
      <div className={cn("min-h-0 flex-1 overflow-y-auto", bodyClassName)}>{children}</div>
      {footer ? <div className="shrink-0 border-t border-separator p-2">{footer}</div> : null}
    </section>
  );
}

/** Tree section header (collapsible, like ObjectsList / LayersList groups). */
export function PanelSection({
  title,
  defaultOpen = true,
  right,
  children,
  className,
}: {
  title: React.ReactNode;
  defaultOpen?: boolean;
  right?: React.ReactNode | undefined;
  children: React.ReactNode;
  className?: string | undefined;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className={cn("border-b border-separator/70", className)}>
      <div className="flex items-center gap-1 py-1.5 pl-1 pr-2">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="flex min-w-0 flex-1 items-center gap-1 rounded px-1 py-1 text-left text-[11px] font-semibold uppercase tracking-wide text-text-secondary hover:bg-list-hover"
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
      {open ? <div className="pb-1">{children}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ search */

export function SearchBar({
  value,
  onChange,
  placeholder,
  icon,
  autoFocus,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  icon?: React.ReactNode | undefined;
  autoFocus?: boolean;
  className?: string | undefined;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded bg-search-bar px-2 text-[12px] text-foreground",
        className,
      )}
    >
      {icon}
      <input
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 w-full min-w-0 bg-transparent text-[12px] text-foreground outline-none placeholder:text-text-placeholder"
      />
      {value ? (
        <button
          type="button"
          aria-label="Borrar"
          onClick={() => onChange("")}
          className="text-text-secondary hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------- list */

export function ListItem({
  selected,
  hovered = true,
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & {
  selected?: boolean | undefined;
  hovered?: boolean | undefined;
}) {
  return (
    <div
      {...rest}
      className={cn(
        "flex items-center gap-2 rounded px-2 py-[5px] text-[12.5px] leading-tight text-foreground",
        hovered && "hover:bg-list-hover",
        selected && "bg-selection",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------- buttons */

export function GdButton({
  variant = "flat",
  primary,
  success,
  className,
  children,
  icon,
  size = "medium",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "flat" | "raised" | "text";
  primary?: boolean;
  success?: boolean;
  icon?: React.ReactNode | undefined;
  size?: "small" | "medium";
}) {
  return (
    <button
      type="button"
      {...rest}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-1.5 rounded font-medium transition-colors disabled:pointer-events-none disabled:opacity-40",
        size === "small" ? "h-7 px-2 text-[11px]" : "h-9 md:h-8 px-3 text-[12.5px]",
        variant === "raised" &&
          (primary
            ? "bg-primary text-primary-foreground hover:bg-[#5C36D6]"
            : success
              ? "bg-success text-window hover:opacity-90"
              : "bg-elevated text-foreground hover:bg-selection"),
        variant === "flat" &&
          (primary
            ? "bg-primary/15 text-link hover:bg-primary/25"
            : "text-muted-foreground hover:bg-hover-bg hover:text-foreground"),
        variant === "text" && "text-link underline-offset-2 hover:underline",
        className,
      )}
    >
      {icon}
      {children}
    </button>
  );
}

export function IconButton({
  label,
  active,
  className,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  active?: boolean | undefined;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      {...rest}
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground md:h-7 md:w-7",
        active && "bg-elevated text-link",
        rest.disabled && "pointer-events-none opacity-40",
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ dialog */

export function GdDialog({
  open,
  onClose,
  title,
  children,
  footer,
  width = "max-w-3xl",
  helpPath,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode | undefined;
  width?: string | undefined;
  helpPath?: string | undefined;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 md:items-center md:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-lg border border-separator bg-toolbar shadow-[0_14px_40px_rgba(0,0,0,0.45)] md:rounded-lg",
          width,
        )}
      >
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-separator px-4">
          <h2 className="min-w-0 flex-1 truncate text-[14px] font-semibold text-foreground md:text-[13px]">
            {title}
          </h2>
          {helpPath ? (
            <a
              href={helpPath}
              target="_blank"
              rel="noreferrer"
              title="Ayuda"
              className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground hover:bg-elevated hover:text-foreground"
            >
              <HelpCircle className="h-4 w-4" />
            </a>
          ) : null}
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground hover:bg-elevated hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer ? (
          <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-separator px-3 py-2">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- menu/popover */

export interface MenuEntry {
  id: string;
  label: string;
  icon?: React.ReactNode | undefined;
  disabled?: boolean | undefined;
  danger?: boolean | undefined;
  separatorBefore?: boolean | undefined;
  checked?: boolean | undefined;
  onSelect?: (() => void) | undefined;
}

export function GdMenu({
  entries,
  onClose,
  anchor,
}: {
  entries: MenuEntry[];
  onClose: () => void;
  anchor: { x: number; y: number };
}) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = React.useState(anchor);

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPosition({
      x: Math.max(4, Math.min(anchor.x, window.innerWidth - rect.width - 8)),
      y: Math.max(4, Math.min(anchor.y, window.innerHeight - rect.height - 8)),
    });
  }, [anchor.x, anchor.y]);

  React.useEffect(() => {
    const dismiss = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("mousedown", dismiss);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", dismiss);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed z-[60] min-w-48 overflow-hidden rounded-md border border-separator bg-toolbar py-1 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
      style={{ left: position.x, top: position.y }}
      role="menu"
    >
      {entries.map((entry) => (
        <React.Fragment key={entry.id}>
          {entry.separatorBefore ? <div className="my-1 h-px bg-separator" /> : null}
          <button
            type="button"
            role="menuitem"
            disabled={entry.disabled}
            onClick={() => {
              entry.onSelect?.();
              onClose();
            }}
            className={cn(
              "flex w-full items-center gap-2 px-3 py-[6px] text-left text-[12.5px] text-foreground hover:bg-list-hover disabled:pointer-events-none disabled:opacity-40",
              entry.danger && "text-destructive",
            )}
          >
            <span className="flex w-4 shrink-0 justify-center">
              {entry.checked ? (
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
              ) : (
                entry.icon
              )}
            </span>
            <span className="truncate">{entry.label}</span>
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}

/** Hook for the right-click menus used across panels and the canvas. */
export function useContextMenu() {
  const [state, setState] = React.useState<{
    anchor: { x: number; y: number };
    entries: MenuEntry[];
  } | null>(null);
  const open = (
    event: {
      preventDefault: () => void;
      stopPropagation: () => void;
      clientX: number;
      clientY: number;
    },
    entries: MenuEntry[],
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setState({ anchor: { x: event.clientX, y: event.clientY }, entries });
  };
  const menu = state ? (
    <GdMenu entries={state.entries} anchor={state.anchor} onClose={() => setState(null)} />
  ) : null;
  return { open, menu, isOpen: state !== null };
}

/* ------------------------------------------------------------------ fields */

export function FieldRow({
  label,
  children,
  hint,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  hint?: React.ReactNode | undefined;
}) {
  return (
    <label className="flex items-center gap-2 px-3 py-1 text-[12.5px]">
      <span
        className="w-28 shrink-0 truncate text-[12.5px] text-text-secondary"
        title={typeof label === "string" ? label : undefined}
      >
        {label}
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-2">{children}</span>
      {hint}
    </label>
  );
}

const underlineField =
  "h-8 min-w-0 flex-1 border-b border-input bg-transparent px-1 text-[12.5px] text-foreground outline-none focus:border-link-hover";

export function TextField({
  value,
  onChange,
  placeholder,
  type = "text",
  align,
}: {
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string | undefined;
  type?: string | undefined;
  align?: "center" | "left" | undefined;
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cn(underlineField, align === "center" && "text-center tabular-nums")}
    />
  );
}

export function NumberField({
  value,
  onChange,
  step = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <input
      type="number"
      step={step}
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(Number(e.target.value))}
      className={cn(underlineField, "tabular-nums")}
    />
  );
}

export function ChoiceField({
  value,
  options,
  onChange,
  labels,
}: {
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
  labels?: Record<string, string> | undefined;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(underlineField, "appearance-none pr-6")}
    >
      {options.map((option) => (
        <option key={option} value={option} className="bg-toolbar">
          {labels?.[option] ?? option}
        </option>
      ))}
    </select>
  );
}

/** GDevelop's on/off switch, sized for the properties panel. */
export function ToggleField({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string | undefined;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-[18px] w-[34px] shrink-0 rounded-full transition-colors",
        checked ? "bg-[#9979f1]" : "bg-[#606166]",
      )}
    >
      <span
        className={cn(
          "absolute top-[2px] h-[14px] w-[14px] rounded-full bg-[#FAFAFA] transition-all",
          checked ? "left-[18px]" : "left-[2px]",
        )}
      />
    </button>
  );
}

export function ColorField({
  value,
  onChange,
}: {
  /** GDevelop "R;G;B" string */
  value: string;
  onChange: (v: string) => void;
}) {
  const toHex = (rgb: string) => {
    const [r = "0", g = "0", b = "0"] = rgb.split(";");
    const n = (v: string) => Math.max(0, Math.min(255, Number(v) || 0));
    return `#${[n(r), n(g), n(b)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  };
  const fromHex = (hex: string) => {
    const clean = hex.replace("#", "");
    if (clean.length !== 6) return value;
    const parts = [0, 2, 4].map((i) => parseInt(clean.slice(i, i + 2), 16));
    return parts.join(";");
  };
  return (
    <span className="flex min-w-0 flex-1 items-center gap-2">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(underlineField, "tabular-nums")}
      />
      <input
        type="color"
        value={toHex(value)}
        onChange={(e) => onChange(fromHex(e.target.value))}
        aria-label="Selector de color"
        className="h-7 w-9 shrink-0 cursor-pointer rounded border border-separator bg-window p-0.5"
      />
    </span>
  );
}

/** Section used inside the properties editor (collapsible, chevron button). */
export function PropertySection({
  title,
  children,
  defaultOpen = true,
  right,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  right?: React.ReactNode | undefined;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="border-b border-separator py-1.5">
      <div className="flex items-center gap-2 px-2">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-separator text-muted-foreground hover:text-foreground"
        >
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <span className="flex-1 truncate text-[13px] font-semibold text-foreground">{title}</span>
        {right}
      </div>
      {open ? <div className="mt-1">{children}</div> : null}
    </div>
  );
}
