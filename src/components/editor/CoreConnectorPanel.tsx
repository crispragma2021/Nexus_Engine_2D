import { useState, useEffect } from "react";
import { X, Play, RefreshCw, Eye } from "lucide-react";

export interface CoreConnectorPanelProps {
  onClose: () => void;
}

interface VisionData {
  base64: string | null;
  ocr: string | null;
  active: boolean;
}

export function CoreConnectorPanel({ onClose }: CoreConnectorPanelProps) {
  const [vision, setVision] = useState<VisionData | null>(null);
  const [pipelineOutput, setPipelineOutput] = useState<string>("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [serverStatus, setServerStatus] = useState<"checking" | "online" | "offline">("checking");

  const checkStatus = async () => {
    try {
      setServerStatus("checking");
      const res = await fetch("http://127.0.0.1:43210/health");
      if (res.ok) setServerStatus("online");
      else setServerStatus("offline");
    } catch {
      setServerStatus("offline");
    }
  };

  const fetchVision = async () => {
    try {
      const res = await fetch("http://127.0.0.1:43210/api/vision/latest");
      if (res.ok) {
        const data = await res.json();
        setVision(data);
      }
    } catch (e) {
      console.error("Failed to fetch vision", e);
    }
  };

  const executePipeline = async (type: string, prompt: string) => {
    setIsExecuting(true);
    setPipelineOutput(`Running pipeline: ${type}...`);
    try {
      const res = await fetch("http://127.0.0.1:43210/api/pipelines/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pipeline_type: type, prompt }),
      });
      const data = await res.json();
      setPipelineOutput(data.output || "No output");
    } catch (e) {
      setPipelineOutput(`Error: ${e}`);
    } finally {
      setIsExecuting(false);
    }
  };

  useEffect(() => {
    checkStatus();
    fetchVision();
    const interval = setInterval(fetchVision, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-20 right-4 w-96 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl flex flex-col z-50 max-h-[80vh]">
      <div className="flex items-center justify-between p-3 border-b border-zinc-800 bg-zinc-800/50">
        <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
          <Eye size={16} className="text-purple-400" />
          NEXUS Core Integration
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-zinc-700 rounded-md text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-6">
        {/* Status */}
        <div className="flex items-center justify-between bg-zinc-800/50 p-3 rounded-md">
          <span className="text-xs text-zinc-400">Core Status:</span>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              {serverStatus === "online" && (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </>
              )}
              {serverStatus === "offline" && <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>}
              {serverStatus === "checking" && <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>}
            </span>
            <span className="text-sm font-medium text-zinc-200 uppercase tracking-wider text-xs">
              {serverStatus}
            </span>
            <button onClick={checkStatus} className="ml-2 text-zinc-500 hover:text-zinc-300">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Omnipresent Vision */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex justify-between">
            <span>Omnipresent Vision</span>
            {vision?.active ? <span className="text-emerald-400">Active</span> : <span className="text-zinc-500">Inactive</span>}
          </h4>
          <div className="aspect-video bg-black rounded-md overflow-hidden border border-zinc-800 flex items-center justify-center relative">
            {vision?.base64 ? (
              <img src={`data:image/png;base64,${vision.base64}`} alt="Vision" className="w-full h-full object-cover opacity-80" />
            ) : (
              <span className="text-zinc-600 text-xs">No Signal</span>
            )}
            <div className="absolute inset-0 border border-purple-500/20 pointer-events-none"></div>
          </div>
          {vision?.ocr && (
            <div className="bg-black/50 p-2 rounded text-[10px] font-mono text-emerald-400 h-16 overflow-y-auto">
              {vision.ocr}
            </div>
          )}
        </div>

        {/* Pipelines */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Agent Pipelines</h4>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => executePipeline("extract_ui", "Genera una UI moderna")}
              disabled={isExecuting || serverStatus !== "online"}
              className="flex items-center justify-between px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-md text-sm text-indigo-300 transition-colors disabled:opacity-50"
            >
              <span>UI Extractor</span>
              <Play size={14} />
            </button>
            <button
              onClick={() => executePipeline("generate_code", "Genera backend Axum básico")}
              disabled={isExecuting || serverStatus !== "online"}
              className="flex items-center justify-between px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-md text-sm text-emerald-300 transition-colors disabled:opacity-50"
            >
              <span>Backend Generator</span>
              <Play size={14} />
            </button>
            <button
              onClick={() => executePipeline("infer_architecture", "Infiere arquitectura base con stripe")}
              disabled={isExecuting || serverStatus !== "online"}
              className="flex items-center justify-between px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-md text-sm text-amber-300 transition-colors disabled:opacity-50"
            >
              <span>Architecture Inference</span>
              <Play size={14} />
            </button>
          </div>
        </div>

        {/* Output */}
        {pipelineOutput && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Terminal Output</h4>
            <div className="bg-black p-3 rounded-md text-[10px] font-mono text-zinc-300 h-32 overflow-y-auto whitespace-pre-wrap border border-zinc-800">
              {pipelineOutput}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
