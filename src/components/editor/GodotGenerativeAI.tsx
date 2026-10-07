import * as React from "react";
import { Search, Sparkles, Box, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function GodotGenerativeAI() {
  const [prompt, setPrompt] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [generatedModels, setGeneratedModels] = React.useState<{name: string, url: string}[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    
    // Simular llamada a la API generadora (Meshy, Tripo3D, etc)
    setTimeout(() => {
      setIsGenerating(false);
      const newModelName = prompt.trim().replace(/\s+/g, "_").toLowerCase() + ".glb";
      setGeneratedModels(prev => [{ name: newModelName, url: "#" }, ...prev]);
      toast.success(`Modelo "${newModelName}" generado e importado a res://models/`);
      setPrompt("");
    }, 3000);
  };

  return (
    <div className="flex flex-1 overflow-hidden h-full">
      {/* Sidebar: Historial / Opciones */}
      <div className="w-[200px] border-r border-separator p-3 bg-window overflow-y-auto">
        <div className="text-[11px] font-semibold text-text-secondary uppercase mb-3 flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-[#B084E9]" />
          Motores Activos
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[11px] p-1.5 rounded bg-[#B084E9]/10 border border-[#B084E9]/30 text-[#B084E9] cursor-pointer">
            <Box className="h-3.5 w-3.5" />
            Nexus 3D Gen (Default)
          </div>
          <div className="flex items-center gap-2 text-[11px] p-1.5 rounded hover:bg-hover-bg text-text-secondary cursor-pointer">
            <Box className="h-3.5 w-3.5" />
            Meshy API
          </div>
          <div className="flex items-center gap-2 text-[11px] p-1.5 rounded hover:bg-hover-bg text-text-secondary cursor-pointer">
            <Box className="h-3.5 w-3.5" />
            Luma API
          </div>
        </div>
      </div>
      
      {/* Main Area */}
      <div className="flex-1 flex flex-col bg-[#1A1A24] p-4">
        {/* Prompt Input */}
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B084E9]" />
            <input 
              type="text" 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe el modelo 3D que necesitas (ej: 'Silla medieval de madera oscura')" 
              className="w-full bg-window border border-separator rounded-lg pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-[#B084E9] transition-colors"
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            />
          </div>
          <button 
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="flex items-center gap-2 bg-[#B084E9] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generar Modelo"}
          </button>
        </div>

        {/* Results Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="text-[12px] text-text-secondary mb-3">Modelos Generados Recientemente</div>
          <div className="grid grid-cols-4 gap-4">
            {generatedModels.map((model, idx) => (
              <div key={idx} className="bg-window border border-separator rounded-lg p-3 flex flex-col items-center gap-2 group relative overflow-hidden">
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="bg-[#4AB0E4] text-white p-1 rounded hover:bg-opacity-80" title="Añadir a Escena">
                    <Download className="h-3 w-3" />
                  </button>
                </div>
                <div className="w-16 h-16 bg-[#25252E] rounded flex items-center justify-center">
                  <Box className="h-8 w-8 text-[#86EFAC]" />
                </div>
                <div className="text-[11px] text-foreground text-center truncate w-full" title={model.name}>
                  {model.name}
                </div>
              </div>
            ))}
            
            {/* Placeholder Empty State */}
            {generatedModels.length === 0 && !isGenerating && (
              <div className="col-span-4 flex flex-col items-center justify-center text-text-placeholder py-12">
                <Sparkles className="h-12 w-12 mb-2 opacity-20" />
                <p className="text-sm">Escribe un prompt arriba para generar tu primer modelo 3D con Inteligencia Artificial.</p>
              </div>
            )}
            
            {/* Loading State */}
            {isGenerating && (
              <div className="bg-window border border-separator border-dashed rounded-lg p-3 flex flex-col items-center justify-center gap-2 h-[120px]">
                <Loader2 className="h-6 w-6 animate-spin text-[#B084E9]" />
                <div className="text-[10px] text-text-secondary animate-pulse text-center">Sintetizando malla y texturas...</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
