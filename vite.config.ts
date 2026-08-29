import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { nitro } from "nitro/vite";

export default defineConfig(({ command }) => ({
  plugins: [
    tailwindcss(),
    tanstackStart({
      importProtection: {
        behavior: "error",
        client: {
          files: ["**/server/**"],
          specifiers: ["server-only"],
        },
      },
      server: { entry: "server" },
    }),
    ...(command === "build" ? [nitro({ preset: process.env.NITRO_PRESET || "vercel" })] : []),
    react(),
  ],
  resolve: {
    alias: { "@": `${process.cwd()}/src` },
    tsconfigPaths: true,
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  server: {
    host: "0.0.0.0",
    port: 8080,
    allowedHosts: true,
  },
}));
