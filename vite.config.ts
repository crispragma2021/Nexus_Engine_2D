import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    ...(command === "build" ? [nitro({ preset: process.env["NITRO_PRESET"] || "vercel" })] : []),
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
}));
