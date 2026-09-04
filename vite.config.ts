import { defineConfig, type UserConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ command }): UserConfig => {
  const config: UserConfig = {
    plugins: [tanstackStart(), viteReact(), tailwindcss()],
    resolve: {
      alias: {
        "@": "/src",
      },
    },
  };

  if (command === "serve") {
    // Modo desarrollo: escucha en todas las interfaces para poder abrir el
    // editor 2D desde la red (LAN/proxy) en el puerto 8080.
    config.server = {
      host: "0.0.0.0",
      port: 8080,
      strictPort: true,
      // Permite que el túnel de Cloudflare (dominios públicos) acceda al
      // servidor en desarrollo sin ser bloqueado por Vite.
      allowedHosts: [
        "autosasistente.app",
        "www.autosasistente.app",
        "localhost",
        "127.0.0.1",
      ],
    };
  }

  return config;
});
