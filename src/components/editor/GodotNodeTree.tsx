import { useEditor } from "@/lib/editor/store";
import { Box, Camera, Sun, BoxSelect, FolderTree, Plus, Circle, Cylinder, Layers, Sparkles } from "lucide-react";
import { GdButton } from "./gd/kit";

export function GodotNodeTree() {
  const { scene, ui, dispatch } = useEditor();
  const selectedInstanceId = ui.selectedInstanceIds[0];

  const handleSelectInstance = (instanceId: string) => {
    dispatch({ type: "ui", patch: { selectedInstanceIds: [instanceId] } });
  };

  const handleOpenCatalog3D = () => {
    dispatch({ type: "openDialog", dialog: { name: "assetCatalog3D" } });
  };

  const getNodeIcon = (meshType?: string) => {
    switch (meshType) {
      case "camera":
        return <Camera className="h-3.5 w-3.5 text-[#A5B4FC]" />;
      case "light":
        return <Sun className="h-3.5 w-3.5 text-[#FDE047]" />;
      case "sphere":
        return <Circle className="h-3.5 w-3.5 text-[#86EFAC]" />;
      case "cylinder":
        return <Cylinder className="h-3.5 w-3.5 text-[#86EFAC]" />;
      case "plane":
        return <Layers className="h-3.5 w-3.5 text-[#A1A1AA]" />;
      case "box":
      default:
        return <Box className="h-3.5 w-3.5 text-[#FC7A7A]" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-toolbar w-[236px] border-r border-separator">
      <div className="flex h-8 items-center justify-between border-b border-separator bg-[#32323B] px-2 text-[11px] font-semibold text-text-secondary">
        <div className="flex items-center">
          <FolderTree className="h-3.5 w-3.5 mr-1.5 text-[#478CBF]" />
          <span>Árbol de Escena (3D)</span>
        </div>
        <button
          onClick={handleOpenCatalog3D}
          className="hover:text-white p-1 rounded hover:bg-[#478CBF]/20 text-[#478CBF]"
          title="Añadir Nodo 3D"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 text-[12px]">
        {/* Node: Spatial (Root) */}
        <div className="flex items-center gap-1.5 py-1 px-1.5 rounded bg-[#3c3c46] text-foreground font-medium mb-1">
          <BoxSelect className="h-3.5 w-3.5 text-[#FC7A7A]" />
          <span className="truncate">{scene.name} (Spatial)</span>
        </div>

        {/* Global Built-in Camera & Light Nodes */}
        <div className="ml-2 border-l border-separator pl-2 flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 py-1 px-1.5 rounded hover:bg-hover-bg cursor-pointer text-text-secondary">
            <Camera className="h-3.5 w-3.5 text-[#A5B4FC]" />
            <span className="truncate">MainCamera3D</span>
          </div>
          <div className="flex items-center gap-1.5 py-1 px-1.5 rounded hover:bg-hover-bg cursor-pointer text-text-secondary">
            <Sun className="h-3.5 w-3.5 text-[#FDE047]" />
            <span className="truncate">DirectionalLight3D</span>
          </div>

          {/* Dynamic Scene Instances mapped as 3D Nodes */}
          {scene.instances.map((inst) => {
            const objDef = scene.objects.find((o) => o.id === inst.objectId);
            const isSelected = inst.id === selectedInstanceId;
            const nodeName = objDef?.name ?? `Node_${inst.id.slice(0, 4)}`;
            const meshType = objDef?.meshType3D;

            return (
              <div
                key={inst.id}
                onClick={() => handleSelectInstance(inst.id)}
                className={`flex items-center gap-1.5 py-1 px-1.5 rounded cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-[#478CBF] text-white font-semibold shadow-sm"
                    : "hover:bg-[#2A2A38] text-text-secondary hover:text-foreground"
                }`}
              >
                {getNodeIcon(meshType)}
                <span className="truncate">{nodeName}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-2 border-t border-separator bg-[#1A1A24]">
        <GdButton
          variant="raised"
          onClick={handleOpenCatalog3D}
          className="w-full text-[11px] justify-center bg-gradient-to-r from-[#8A2BE2]/80 to-[#478CBF]/80 text-white hover:opacity-90 transition-opacity gap-1.5"
        >
          <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
          <span>Catálogo & IA 3D</span>
        </GdButton>
      </div>
    </div>
  );
}
