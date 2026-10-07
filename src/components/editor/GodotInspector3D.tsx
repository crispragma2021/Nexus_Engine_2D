import { useEditor } from "@/lib/editor/store";
import { S } from "@/lib/editor/i18n";
import { Settings2, RotateCcw, Box, SlidersHorizontal, Package, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function GodotInspector3D() {
  const { ui } = useEditor();

  return (
    <div className="hidden w-[318px] shrink-0 flex-col border-l border-separator bg-toolbar md:flex h-full">
      <div className="flex h-8 shrink-0 items-center gap-px border-b border-separator bg-[#32323B] px-2 text-[11px] font-semibold text-text-secondary">
        <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
        Inspector 3D (Godot)
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 text-[12px]">
        {/* Header Node */}
        <div className="flex items-center gap-2 mb-4 bg-window p-2 rounded border border-separator">
          <Box className="h-5 w-5 text-[#86EFAC]" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-foreground truncate">PlayerMesh3D</div>
            <div className="text-[10px] text-text-secondary">MeshInstance3D</div>
          </div>
        </div>

        {/* Transform Group */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2 cursor-pointer hover:bg-hover-bg p-1 rounded -mx-1">
            <span className="font-semibold text-text-secondary uppercase text-[10px]">Transform</span>
            <RotateCcw className="h-3 w-3 text-text-placeholder hover:text-text-secondary" />
          </div>
          
          <div className="space-y-2">
            {/* Position */}
            <div className="flex items-center">
              <span className="w-16 text-text-secondary">Position</span>
              <div className="flex flex-1 gap-1">
                <input type="text" className="w-full bg-[#1A1A24] border border-separator rounded px-1 py-0.5 text-center" defaultValue="0" />
                <input type="text" className="w-full bg-[#1A1A24] border border-separator rounded px-1 py-0.5 text-center" defaultValue="1.5" />
                <input type="text" className="w-full bg-[#1A1A24] border border-separator rounded px-1 py-0.5 text-center" defaultValue="0" />
              </div>
            </div>
            {/* Rotation */}
            <div className="flex items-center">
              <span className="w-16 text-text-secondary">Rotation</span>
              <div className="flex flex-1 gap-1">
                <input type="text" className="w-full bg-[#1A1A24] border border-separator rounded px-1 py-0.5 text-center" defaultValue="0" />
                <input type="text" className="w-full bg-[#1A1A24] border border-separator rounded px-1 py-0.5 text-center" defaultValue="90" />
                <input type="text" className="w-full bg-[#1A1A24] border border-separator rounded px-1 py-0.5 text-center" defaultValue="0" />
              </div>
            </div>
            {/* Scale */}
            <div className="flex items-center">
              <span className="w-16 text-text-secondary">Scale</span>
              <div className="flex flex-1 gap-1">
                <input type="text" className="w-full bg-[#1A1A24] border border-separator rounded px-1 py-0.5 text-center" defaultValue="1" />
                <input type="text" className="w-full bg-[#1A1A24] border border-separator rounded px-1 py-0.5 text-center" defaultValue="1" />
                <input type="text" className="w-full bg-[#1A1A24] border border-separator rounded px-1 py-0.5 text-center" defaultValue="1" />
              </div>
            </div>
          </div>
        </div>

        {/* Mesh Group */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2 cursor-pointer hover:bg-hover-bg p-1 rounded -mx-1">
            <span className="font-semibold text-text-secondary uppercase text-[10px]">MeshInstance3D</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Mesh</span>
              <div className="flex items-center gap-1 bg-[#1A1A24] border border-separator rounded px-2 py-0.5 w-32 cursor-pointer hover:border-[var(--brand-light)]">
                <Package className="h-3 w-3 text-text-placeholder" />
                <span className="truncate">BoxMesh</span>
              </div>
            </div>
          </div>
        </div>

        {/* Material Group */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2 cursor-pointer hover:bg-hover-bg p-1 rounded -mx-1">
            <span className="font-semibold text-text-secondary uppercase text-[10px]">Surface Material Override</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">0</span>
              <div className="flex items-center gap-1 bg-[#1A1A24] border border-separator rounded px-2 py-0.5 w-32 cursor-pointer hover:border-[var(--brand-light)]">
                <div className="w-3 h-3 rounded-sm bg-[#478CBF]"></div>
                <span className="truncate">StandardMaterial3D</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-1 pl-2 border-l border-separator ml-2">
              <span className="text-text-secondary">Albedo</span>
              <div className="flex items-center gap-1 bg-[#1A1A24] border border-separator rounded px-2 py-0.5 w-24 cursor-pointer hover:border-[var(--brand-light)]">
                <ImageIcon className="h-3 w-3 text-text-placeholder" />
                <span className="truncate">Empty</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
