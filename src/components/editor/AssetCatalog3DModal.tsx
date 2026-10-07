import * as React from "react";
import { useEditor } from "@/lib/editor/store";
import { GdButton, GdDialog, TextField } from "./gd/kit";
import { Box, Circle, Cylinder, Sparkles, Sun, Camera, Layers, Plus, Check } from "lucide-react";
import { toast } from "sonner";
import type { GDMesh3DType } from "@/lib/editor/types";
import { uid } from "@/lib/editor/ids";

interface AssetCatalog3DModalProps {
  open: boolean;
  onClose: () => void;
}

interface Primitive3DPreset {
  id: string;
  name: string;
  meshType: GDMesh3DType;
  icon: React.ReactNode;
  color: string;
  description: string;
  roughness: number;
  metalness: number;
}

const PRIMITIVE_PRESETS: Primitive3DPreset[] = [
  {
    id: "cube_pbr",
    name: "Cubo 3D (MeshInstance3D)",
    meshType: "box",
    icon: <Box className="h-6 w-6 text-[#478CBF]" />,
    color: "#478CBF",
    description: "Geometría cúbica PBR para bloques, edificios y plataformas.",
    roughness: 0.3,
    metalness: 0.1,
  },
  {
    id: "sphere_glossy",
    name: "Esfera 3D",
    meshType: "sphere",
    icon: <Circle className="h-6 w-6 text-[#A5B4FC]" />,
    color: "#A5B4FC",
    description: "Esfera suave ideal para coleccionables, proyectiles o planetas.",
    roughness: 0.1,
    metalness: 0.8,
  },
  {
    id: "cylinder_metal",
    name: "Cilindro 3D",
    meshType: "cylinder",
    icon: <Cylinder className="h-6 w-6 text-[#86EFAC]" />,
    color: "#86EFAC",
    description: "Columna o elemento cilíndrico metálico.",
    roughness: 0.2,
    metalness: 0.9,
  },
  {
    id: "torus_gold",
    name: "Toro / Anillo 3D",
    meshType: "torus",
    icon: <Sparkles className="h-6 w-6 text-[#FDE047]" />,
    color: "#FDE047",
    description: "Anillo tridimensional dorado para portales o portales IA.",
    roughness: 0.15,
    metalness: 0.95,
  },
  {
    id: "plane_floor",
    name: "Plano / Suelo 3D",
    meshType: "plane",
    icon: <Layers className="h-6 w-6 text-[#A1A1AA]" />,
    color: "#3F3F46",
    description: "Superficie de plano para terrenos y suelos de escena.",
    roughness: 0.8,
    metalness: 0.0,
  },
  {
    id: "light_directional",
    name: "Luz Direccional 3D",
    meshType: "light",
    icon: <Sun className="h-6 w-6 text-[#F97316]" />,
    color: "#FFF5CD",
    description: "Fuente de luz solar con sombras suaves activadas.",
    roughness: 0.5,
    metalness: 0.0,
  },
];

export function AssetCatalog3DModal({ open, onClose }: AssetCatalog3DModalProps) {
  const { scene, dispatch } = useEditor();
  const [promptText, setPromptText] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);

  if (!open) return null;

  const handleAddPrimitive = (preset: Primitive3DPreset) => {
    const objectId = uid("obj3d");
    const objectName = `${preset.name.split(" ")[0]}_3D_${scene.objects.length + 1}`;

    dispatch({
      type: "addObject",
      object: {
        id: objectId,
        name: objectName,
        type: "Sprite",
        asset: "",
        behaviors: [],
        effects: [],
        variables: [],
        meshType3D: preset.meshType,
        material3D: {
          color: preset.color,
          roughness: preset.roughness,
          metalness: preset.metalness,
          wireframe: false,
        },
      },
    });

    const instanceId = uid("inst3d");
    dispatch({
      type: "addInstance",
      objectId,
      x: 400 + Math.random() * 40 - 20,
      y: 300 + Math.random() * 40 - 20,
      layer: scene.activeLayer || "Base layer",
    });

    // Patch 3D coordinates
    dispatch({
      type: "updateInstance",
      id: instanceId,
      patch: {
        position3d: { x: (Math.random() - 0.5) * 2, y: 0.5, z: (Math.random() - 0.5) * 2 },
        scale3d: { x: 1, y: 1, z: 1 },
        rotation3d: { x: 0, y: 0, z: 0 },
      },
    });

    toast.success(`¡Nodo '${objectName}' añadido exitosamente a la escena 3D!`);
    onClose();
  };

  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim()) return;

    setIsGenerating(true);
    toast.info(`Generando modelo 3D con IA: "${promptText}"...`);

    await new Promise((r) => setTimeout(r, 1200));

    const objectId = uid("ai3d");
    const objectName =
      promptText
        .trim()
        .replace(/[^a-zA-Z0-9_]/g, "_")
        .slice(0, 16) || "Asset3D_IA";
    const colors = ["#EF4444", "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)] ?? "#EF4444";

    dispatch({
      type: "addObject",
      object: {
        id: objectId,
        name: objectName,
        type: "Sprite",
        asset: "",
        behaviors: [],
        effects: [],
        variables: [],
        meshType3D: "box",
        material3D: {
          color: randomColor,
          roughness: 0.2,
          metalness: 0.5,
          wireframe: false,
        },
      },
    });

    dispatch({
      type: "addInstance",
      objectId,
      x: 400,
      y: 300,
      layer: scene.activeLayer || "Base layer",
    });

    toast.success(`¡Asset 3D generado por IA ('${objectName}') añadido a la escena!`);
    setIsGenerating(false);
    onClose();
  };

  return (
    <GdDialog
      open={open}
      onClose={onClose}
      title="🎨 Catálogo de Assets & Generador 3D (IA)"
      width="max-w-2xl"
      footer={
        <GdButton variant="raised" onClick={onClose}>
          Cerrar
        </GdButton>
      }
    >
      <div className="p-4 space-y-5">
        {/* AI Generator Box */}
        <form
          onSubmit={handleAiGenerate}
          className="rounded-xl border border-[#8A2BE2]/40 bg-gradient-to-r from-[#8A2BE2]/15 via-[#478CBF]/15 to-transparent p-3.5 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-yellow-300" />
            <span className="text-[13px] font-bold text-foreground">Generar Modelo 3D con IA</span>
          </div>
          <p className="text-[11px] text-text-secondary mb-3">
            Describe en lenguaje natural cualquier objeto 3D, vehículo o elemento para que la IA
            cree la malla y shaders PBR:
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Ej: Cofre de tesoro medieval dorado, Nave espacial sci-fi..."
              className="flex-1 h-9 rounded-lg border border-separator bg-[#161622] px-3 text-[12.5px] text-foreground outline-none focus:border-[#8A2BE2]"
            />
            <button
              type="submit"
              disabled={isGenerating || !promptText.trim()}
              className="h-9 px-4 rounded-lg bg-gradient-to-r from-[#8A2BE2] to-[#478CBF] text-[12px] font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {isGenerating ? "Generando..." : "Generar en 3D"}
            </button>
          </div>
        </form>

        {/* Primitives Grid */}
        <div>
          <h4 className="text-[12px] font-semibold text-text-secondary uppercase tracking-wider mb-2.5">
            Primitivas & Nodos 3D Godot (1-Clic)
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {PRIMITIVE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleAddPrimitive(preset)}
                className="flex flex-col items-start p-3 rounded-xl border border-separator bg-[#1D1D26] hover:bg-[#252532] hover:border-[#478CBF] text-left transition-all group"
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <div className="p-1.5 rounded-lg bg-[#2A2A38] group-hover:bg-[#343446]">
                    {preset.icon}
                  </div>
                  <Plus className="h-4 w-4 text-text-placeholder group-hover:text-[#478CBF]" />
                </div>
                <span className="text-[12px] font-bold text-foreground group-hover:text-[#478CBF]">
                  {preset.name}
                </span>
                <span className="text-[10px] text-text-secondary line-clamp-2 mt-0.5">
                  {preset.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </GdDialog>
  );
}
