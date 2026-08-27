import * as React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LANGUAGES = [
  "Español (Spanish)",
  "English",
  "Français (French)",
  "Português (Portuguese)",
  "Deutsch (German)",
  "Italiano (Italian)",
  "日本語 (Japanese)",
];

export function LanguageDialog({ open, onOpenChange }: Props) {
  const [lang, setLang] = React.useState(LANGUAGES[0]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[92vh] max-w-lg flex-col gap-0 border-separator bg-window p-0">
        <DialogTitle className="px-5 pb-4 pt-5 text-2xl font-bold text-foreground">
          Idioma
        </DialogTitle>

        <div className="min-h-0 flex-1 overflow-y-auto px-5">
          <div className="flex items-start gap-4">
            <p className="w-24 shrink-0 text-base text-foreground">Elija el idioma de GDevelop</p>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              aria-label="Elija el idioma"
              className="min-w-0 flex-1 rounded-t-md border-b-2 border-foreground bg-elevated px-3 py-3 text-base text-foreground outline-none"
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-4 text-base text-muted-foreground">
            Puedes{" "}
            <a href="https://crowdin.com/project/gdevelop" className="text-link underline">
              ayudar a traducir GDevelop a tu idioma
            </a>
            .
          </p>
        </div>

        <div className="flex items-center gap-2 border-t border-separator px-4 py-3">
          <button
            type="button"
            className="rounded-md border border-separator px-4 py-2.5 text-sm font-semibold text-foreground"
          >
            Reportar una traducción errónea
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="ml-auto rounded-md border border-separator px-5 py-2.5 text-sm font-semibold text-foreground"
          >
            Cerrar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
