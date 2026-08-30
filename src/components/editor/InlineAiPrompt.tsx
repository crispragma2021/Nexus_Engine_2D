import React, { useState, useEffect, useRef, type CSSProperties } from "react";
import { Sparkles, ArrowUp } from "lucide-react";
import { MAX_INLINE_AI_PROMPT_LENGTH } from "@/lib/editor/ai";

export interface InlineAiPromptProps {
  x: number;
  y: number;
  targetName?: string;
  onApply: (prompt: string, target?: string) => Promise<void>;
  onClose: () => void;
}

export const InlineAiPrompt: React.FC<InlineAiPromptProps> = ({
  x,
  y,
  targetName,
  onApply,
  onClose,
}) => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("pointerdown", handlePointerDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [onClose]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    try {
      await onApply(prompt, targetName);
      onClose();
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-label={targetName ? `Editar ${targetName} con IA` : "Editar con IA"}
      style={
        {
          "--inline-ai-x": `${x}px`,
          "--inline-ai-y": `${y}px`,
        } as CSSProperties
      }
      data-ai-overlay="contextual-popover"
      className="fixed bottom-[calc(var(--mobile-editor-dock-height)+0.75rem)] left-1/2 z-[35] -translate-x-1/2 animate-in duration-200 fade-in zoom-in md:bottom-auto md:left-[var(--inline-ai-x)] md:top-[var(--inline-ai-y)] md:-translate-y-full md:pb-3"
    >
      <form
        onSubmit={handleSubmit}
        className="flex w-72 max-w-[calc(100vw-1rem)] items-center rounded-full border border-zinc-700/80 bg-zinc-900 p-1 shadow-2xl backdrop-blur-xl md:w-96"
      >
        <div className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10">
          <Sparkles className="h-4 w-4 text-emerald-400" aria-hidden="true" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          disabled={loading}
          maxLength={MAX_INLINE_AI_PROMPT_LENGTH}
          autoComplete="off"
          aria-label={targetName ? `Modificar ${targetName}` : "Instrucción para la IA"}
          placeholder={targetName ? `Modificar ${targetName}...` : "Escribe una instrucción..."}
          className="flex-1 border-none bg-transparent px-2 text-sm text-zinc-100 outline-none placeholder-zinc-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!prompt.trim() || loading}
          aria-label={loading ? "Aplicando edición" : "Aplicar edición"}
          className="mr-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white transition-colors hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600"
        >
          {loading ? (
            <div
              className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
              aria-hidden="true"
            />
          ) : (
            <ArrowUp className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </form>
    </div>
  );
};
