import { defineConfig, loadEnv, type Plugin, type UserConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { handleGatewayNodeRequest } from "./src/lib/agent/gateway-node";

/**
 * Gateway del asistente Nexus AI (`/api/agent`) para los servidores de Vite.
 *
 * Usa exactamente la misma lógica pura que la función serverless de Vercel
 * (`api/agent.ts`) y que el servidor propio (`scripts/run_nexus_server.mjs`),
 * de modo que el comportamiento del asistente es idéntico en desarrollo y en
 * producción. Sin `GEMINI_API_KEY` en el entorno responde 503 y la UI continúa
 * con el planificador local determinista.
 */
function nexusAgentGateway(env: Record<string, string>): Plugin {
  return {
    name: "nexus-agent-gateway",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          if (await handleGatewayNodeRequest(req, res, { env: { ...process.env, ...env } })) return;
        } catch {
          // Nunca se bloquea el servidor de desarrollo por el gateway.
        }
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          if (await handleGatewayNodeRequest(req, res, { env: { ...process.env, ...env } })) return;
        } catch {
          // Idem en `vite preview`.
        }
        next();
      });
    },
  };
}

export default defineConfig(({ mode, command }): UserConfig => {
  const loadedEnv = loadEnv(mode, process.cwd(), "");
  const config: UserConfig = {
    plugins: [tanstackStart(), viteReact(), tailwindcss(), nexusAgentGateway(loadedEnv)],
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
      port: Number(process.env["PORT"]) || 5175,
      strictPort: true,
      allowedHosts: true,
    };
  }

  return config;
});
