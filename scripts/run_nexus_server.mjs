import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import serverApp from "../dist/server/server.js";

const PORT = parseInt(process.env.PORT || "3000", 10);
const CLIENT_DIR = path.resolve(process.cwd(), "dist/client");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2"
};

// Gateway del asistente Nexus AI (/api/agent): la misma lógica pura que usan la
// función serverless de Vercel (api/agent.ts) y el middleware de Vite. La clave
// GEMINI_API_KEY se lee solo aquí, en el servidor. Si este Node no puede cargar
// TypeScript (Node < 22.18 sin --experimental-strip-types) el servidor sigue
// sirviendo el editor y el asistente usa el planificador local determinista.
let handleGatewayNodeRequest = null;
try {
  ({ handleGatewayNodeRequest } = await import("../src/lib/agent/gateway-node.ts"));
} catch (err) {
  console.warn("Gateway /api/agent no disponible en este Node:", err?.message ?? err);
}

const server = http.createServer(async (req, res) => {
  try {
    // 0. Gateway del asistente Nexus AI (antes de assets estáticos y del SSR)
    if (handleGatewayNodeRequest && (await handleGatewayNodeRequest(req, res))) {
      return;
    }

    const urlObj = new URL(req.url, `http://${req.headers.host || "localhost:3000"}`);
    const assetPath = path.join(CLIENT_DIR, urlObj.pathname);

    // 1. Servir assets estáticos (JS, CSS, imágenes) directamente desde dist/client
    if (fs.existsSync(assetPath) && fs.statSync(assetPath).isFile()) {
      const ext = path.extname(assetPath);
      res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
      fs.createReadStream(assetPath).pipe(res);
      return;
    }

    // 2. Despachar rutas SSR dinámicas (/ y /editor) al entry de TanStack Start
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (Array.isArray(v)) {
        for (const item of v) headers.append(k, item);
      } else if (v !== undefined) {
        headers.set(k, v);
      }
    }

    const init = {
      method: req.method,
      headers,
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      init.body = Buffer.concat(chunks);
    }

    const webReq = new Request(urlObj.href, init);
    const webRes = await serverApp.fetch(webReq);

    const outHeaders = {};
    webRes.headers.forEach((val, key) => {
      outHeaders[key] = val;
    });

    res.writeHead(webRes.status, outHeaders);
    if (webRes.body) {
      Readable.fromWeb(webRes.body).pipe(res);
    } else {
      res.end();
    }
  } catch (err) {
    console.error("Error despachando request:", err);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error");
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Nexus Engine 2D listo en http://localhost:${PORT}/editor`);
});
