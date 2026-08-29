import { cn } from "@/lib/utils";

interface NexusLogoProps {
  className?: string;
  label?: string;
}

/** Shared product mark. The wordmark stays in text so it remains crisp at any size. */
export function NexusLogo({ className, label = "Nexus Engine" }: NexusLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <img src="/icons/nexus-mark.svg" alt="" aria-hidden="true" className="size-8 shrink-0" />
      <span className="truncate">{label}</span>
    </span>
  );
}

export function NexusMark({ className }: { className?: string }) {
  return <img src="/icons/nexus-mark.svg" alt="Nexus Engine" className={cn("size-8", className)} />;
}
