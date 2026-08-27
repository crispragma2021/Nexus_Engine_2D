import * as React from "react";
import { Send, Plus, Info, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AskAiDialog({ open, onOpenChange }: Props) {
  const [prompt, setPrompt] = React.useState("");
  const [mode, setMode] = React.useState("Medium");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[92vh] max-w-lg flex-col gap-0 border-separator bg-window p-0">
        <DialogTitle className="sr-only">Pregunta a la IA</DialogTitle>

        <div className="flex items-center justify-between border-b border-separator px-3 py-2">
          <MessageCircle className="size-6 text-foreground" />
          <button
            type="button"
            className="flex items-center gap-2 rounded-md bg-elevated px-4 py-2.5 text-sm font-bold text-muted-foreground"
          >
            <Plus className="size-4" /> Nuevo chat
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-center px-4">
          <div className="mb-6 text-center">
            <div
              className="mx-auto mb-4 size-14 rounded-xl bg-gradient-to-br from-[#FFBC57] via-[#FF8569] to-[#7046EC]"
              aria-hidden
            />
            <h2 className="text-3xl font-bold text-foreground">¿Qué quieres hacer?</h2>
          </div>

          <div className="rounded-xl border border-[#FF8569] bg-elevated p-3">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="Comienza un juego simple de corredores infinitos"
              aria-label="Pregunta a la IA"
              className="w-full resize-none bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
            />
            <div className="flex justify-end">
              <button
                type="button"
                aria-label="Enviar"
                className="rounded-md bg-window/60 p-2.5 text-muted-foreground"
              >
                <Send className="size-5" />
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              aria-label="Nivel de la IA"
              className="rounded-full bg-elevated px-4 py-2.5 text-base font-medium text-foreground outline-none"
            >
              <option>Simple</option>
              <option>Medium</option>
              <option>Advanced</option>
            </select>
            <Info className="size-5 text-muted-foreground" />
          </div>
        </div>

        <p className="border-t border-separator px-6 py-4 text-center text-sm leading-relaxed text-muted-foreground">
          La IA es experimental y aún se está mejorando. Los cambios y respuestas pueden tener
          errores: experimenta y utilízalo para aprender.
        </p>
      </DialogContent>
    </Dialog>
  );
}
