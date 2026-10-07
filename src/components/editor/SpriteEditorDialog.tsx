import * as React from "react";
import { Sparkles, Save, Eraser, PenTool, PaintBucket, ImageIcon } from "lucide-react";
import { useEditor } from "@/lib/editor/store";
import { S } from "@/lib/editor/i18n";
import { GdDialog, GdButton } from "./gd/kit";

export function SpriteEditorDialog() {
  const { ui, dispatch } = useEditor();
  const dialog = ui.dialog;
  const isOpen = dialog?.name === "spriteEditor";
  
  const close = () => dispatch({ type: "closeDialog" });

  if (!isOpen) return null;

  return (
    <GdDialog
      open
      onClose={close}
      title="Editor de Sprites (Piskel + IA)"
      width="max-w-[800px]"
      footer={
        <>
          <div className="mr-auto flex gap-2">
            <GdButton 
              icon={<Sparkles className="h-4 w-4 text-[#FF4AB0]" />} 
              variant="raised" 
              className="bg-[#2a2a36]"
            >
              Mejorar con IA (Flux)
            </GdButton>
            <GdButton 
              icon={<ImageIcon className="h-4 w-4 text-[#4AB0E4]" />} 
              variant="raised" 
              className="bg-[#2a2a36]"
            >
              Generar Variante
            </GdButton>
          </div>
          <div className="flex gap-2">
            <GdButton onClick={close}>{S.cancel}</GdButton>
            <GdButton variant="raised" primary onClick={close} icon={<Save className="h-4 w-4" />}>
              {S.ok}
            </GdButton>
          </div>
        </>
      }
    >
      <div className="flex min-h-[400px] border border-separator bg-[#1D1D26] rounded">
        {/* Toolbar izquierda (estilo Piskel) */}
        <div className="w-12 border-r border-separator bg-toolbar flex flex-col items-center py-2 gap-2">
          <button className="h-8 w-8 grid place-items-center rounded bg-selection text-foreground hover:bg-elevated" title="Lápiz">
            <PenTool className="h-4 w-4" />
          </button>
          <button className="h-8 w-8 grid place-items-center rounded text-text-secondary hover:bg-elevated" title="Goma">
            <Eraser className="h-4 w-4" />
          </button>
          <button className="h-8 w-8 grid place-items-center rounded text-text-secondary hover:bg-elevated" title="Cubo de Pintura">
            <PaintBucket className="h-4 w-4" />
          </button>
          
          <div className="mt-auto mb-2 flex flex-col gap-1">
            <div className="w-6 h-6 rounded-full bg-white border border-separator cursor-pointer" />
            <div className="w-6 h-6 rounded-full bg-black border border-separator cursor-pointer" />
          </div>
        </div>
        
        {/* Canvas central */}
        <div className="flex-1 flex items-center justify-center bg-[url('/bg-checker.png')] bg-repeat relative overflow-hidden" style={{ backgroundImage: "linear-gradient(45deg, #25252E 25%, transparent 25%, transparent 75%, #25252E 75%, #25252E), linear-gradient(45deg, #25252E 25%, transparent 25%, transparent 75%, #25252E 75%, #25252E)", backgroundSize: "16px 16px", backgroundPosition: "0 0, 8px 8px" }}>
          {/* Aquí iría el <canvas> real o integración iframe de Piskel */}
          <div className="text-center p-8 bg-background border border-separator shadow-lg rounded">
            <ImageIcon className="h-16 w-16 text-text-placeholder mx-auto mb-4" />
            <p className="text-text-secondary font-medium">Lienzo Híbrido (Piskel / IA Canvas)</p>
            <p className="text-[11px] text-text-placeholder mt-2">Área interactiva de dibujo en desarrollo</p>
          </div>
        </div>
        
        {/* Panel derecho (Capas/Paletas) */}
        <div className="w-48 border-l border-separator bg-toolbar p-2 flex flex-col gap-4">
          <div>
            <h3 className="text-[11px] font-semibold text-text-secondary uppercase mb-2">Capas de IA</h3>
            <div className="bg-elevated rounded p-2 text-[12px] text-text-secondary border border-separator cursor-pointer hover:border-[var(--brand-light)]">
              Capa Base (Manual)
            </div>
          </div>
          <div>
            <h3 className="text-[11px] font-semibold text-text-secondary uppercase mb-2">Prompt Actual</h3>
            <textarea 
              className="w-full h-24 bg-background border border-separator rounded p-2 text-[12px] text-foreground resize-none focus:outline-none focus:border-[var(--brand-light)]"
              placeholder="Describe lo que quieres que la IA dibuje o mejore aquí..."
            />
          </div>
        </div>
      </div>
    </GdDialog>
  );
}
