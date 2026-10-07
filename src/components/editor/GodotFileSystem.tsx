import * as React from "react";
import { useEditor } from "@/lib/editor/store";
import { Folder, FileCode, Box, Search, FolderTree } from "lucide-react";
import { GodotGenerativeAI } from "./GodotGenerativeAI";

export function GodotFileSystem() {
  const { ui } = useEditor();
  const [activeTab, setActiveTab] = React.useState<"filesystem" | "console" | "ai">("filesystem");

  if (!ui.is3DMode) return null;

  return (
    <div className="flex h-64 shrink-0 flex-col border-t border-separator bg-toolbar">
      <div className="flex h-8 shrink-0 items-center justify-between border-b border-separator bg-[#32323B] px-2 text-[11px] font-semibold text-text-secondary">
        <div className="flex items-center gap-4">
          <div 
            onClick={() => setActiveTab("filesystem")}
            className={`flex items-center cursor-pointer pb-1 translate-y-[2px] transition-colors ${activeTab === "filesystem" ? "text-foreground border-b-2 border-[#478CBF]" : "hover:text-foreground"}`}
          >
            FileSystem
          </div>
          <div 
            onClick={() => setActiveTab("console")}
            className={`flex items-center cursor-pointer pb-1 translate-y-[2px] transition-colors ${activeTab === "console" ? "text-foreground border-b-2 border-[#478CBF]" : "hover:text-foreground"}`}
          >
            Consola
          </div>
          <div 
            onClick={() => setActiveTab("ai")}
            className={`flex items-center cursor-pointer pb-1 translate-y-[2px] transition-colors ${activeTab === "ai" ? "text-[#B084E9] border-b-2 border-[#B084E9]" : "hover:text-[#B084E9]"}`}
          >
            IA Assets
          </div>
        </div>
      </div>
      
      {activeTab === "ai" ? (
        <GodotGenerativeAI />
      ) : activeTab === "filesystem" ? (
        <div className="flex flex-1 overflow-hidden">
          {/* Left Tree */}
          <div className="w-[200px] border-r border-separator overflow-y-auto p-2">
            <div className="flex items-center gap-1 text-[11px] text-text-secondary mb-1">
              <Search className="h-3 w-3" />
              <input type="text" placeholder="Filtrar..." className="bg-transparent border-none outline-none flex-1 text-foreground" />
            </div>
            <div className="flex items-center gap-1.5 py-1 px-1 rounded hover:bg-hover-bg cursor-pointer text-foreground text-[11px]">
              <FolderTree className="h-3.5 w-3.5 text-[#4AB0E4]" />
              <span>res://</span>
            </div>
            <div className="ml-2 border-l border-separator pl-2 mt-1 flex flex-col gap-0.5 text-[11px]">
              <div className="flex items-center gap-1.5 py-1 px-1 rounded hover:bg-hover-bg cursor-pointer text-text-secondary">
                <Folder className="h-3.5 w-3.5 text-[#4AB0E4]" />
                <span>models</span>
              </div>
              <div className="flex items-center gap-1.5 py-1 px-1 rounded hover:bg-hover-bg cursor-pointer text-text-secondary">
                <Folder className="h-3.5 w-3.5 text-[#4AB0E4]" />
                <span>textures</span>
              </div>
            </div>
          </div>
          
          {/* Right Content */}
          <div className="flex-1 overflow-y-auto p-4 bg-[#1A1A24]">
            <div className="flex gap-4">
              <div className="flex flex-col items-center gap-1 w-16 cursor-pointer hover:bg-toolbar p-2 rounded">
                <Folder className="h-8 w-8 text-[#4AB0E4]" />
                <span className="text-[10px] text-text-secondary truncate w-full text-center">models</span>
              </div>
              <div className="flex flex-col items-center gap-1 w-16 cursor-pointer hover:bg-toolbar p-2 rounded">
                <Folder className="h-8 w-8 text-[#4AB0E4]" />
                <span className="text-[10px] text-text-secondary truncate w-full text-center">textures</span>
              </div>
              <div className="flex flex-col items-center gap-1 w-16 cursor-pointer hover:bg-toolbar p-2 rounded">
                <FileCode className="h-8 w-8 text-foreground" />
                <span className="text-[10px] text-text-secondary truncate w-full text-center">main.tscn</span>
              </div>
              <div className="flex flex-col items-center gap-1 w-16 cursor-pointer hover:bg-toolbar p-2 rounded">
                <Box className="h-8 w-8 text-[#86EFAC]" />
                <span className="text-[10px] text-text-secondary truncate w-full text-center">player.glb</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-text-secondary text-xs">
          Consola inactiva
        </div>
      )}
    </div>
  );
}
