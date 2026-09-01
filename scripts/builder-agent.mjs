#!/usr/bin/env node
import readline from "node:readline";
import net from "node:net";
import fs from "node:fs";
import path from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);
const SOCKET_PATH = "/data/data/com.termux/files/home/.nexus_host.sock";
const DB_PATH = "/data/data/com.termux/files/home/nexus_memory.db";
const API_KEY = process.env.DEEPSEEK_API_KEY;

if (!API_KEY) {
  console.error("\x1b[31mError: DEEPSEEK_API_KEY no definida en el entorno.\x1b[0m");
  process.exit(1);
}

// Iniciar daemon nativo en segundo plano si no está activo
if (!fs.existsSync(SOCKET_PATH)) {
  exec("nexus_host_daemon &");
}

function sendToNativeDaemon(actionObject) {
  return new Promise((resolve) => {
    const client = net.createConnection(SOCKET_PATH, () => {
      client.write(JSON.stringify(actionObject) + "\n");
    });

    client.on("data", (data) => {
      try {
        const res = JSON.parse(data.toString().trim());
        client.end();
        resolve(res.result || (res.ok ? "OK" : "Fallo"));
      } catch {
        client.end();
        resolve(data.toString().trim());
      }
    });

    client.on("error", (err) => {
      resolve(`Error socket nativo: ${err.message}`);
    });
  });
}

// Obtener dimensiones reales de pantalla
async function getScreenDimensions() {
  try {
    const { stdout } = await execAsync("wm size");
    const match = stdout.match(/(\d+)x(\d+)/);
    if (match) {
      return { width: parseInt(match[1], 10), height: parseInt(match[2], 10) };
    }
  } catch {}
  return { width: 1080, height: 2400 }; // Fallback estándar
}

// Manejo de Memoria SQLite
async function readRecentMemory(limit = 5) {
  try {
    const cmd = `sqlite3 "${DB_PATH}" "SELECT session_date, category, summary FROM builder_memory ORDER BY id DESC LIMIT ${limit};"`;
    const { stdout } = await execAsync(cmd);
    return stdout.trim() || "No hay registros previos de memoria.";
  } catch (e) {
    return `Error al consultar memoria: ${e.message}`;
  }
}

async function saveMemoryEntry(category, summary, details = "") {
  try {
    const escapedCat = category.replace(/'/g, "''");
    const escapedSummary = summary.replace(/'/g, "''");
    const escapedDetails = details.replace(/'/g, "''");
    const cmd = `sqlite3 "${DB_PATH}" "INSERT INTO builder_memory (category, summary, details) VALUES ('${escapedCat}', '${escapedSummary}', '${escapedDetails}');"`;
    await execAsync(cmd);
    return "Memoria guardada exitosamente.";
  } catch (e) {
    return `Error al guardar memoria: ${e.message}`;
  }
}

const tools = [
  {
    type: "function",
    function: {
      name: "host_tap_normalized",
      description: "Ejecuta un toque en pantalla usando coordenadas relativas normalizadas (0.0 a 1.0).",
      parameters: {
        type: "object",
        properties: {
          norm_x: { type: "number", description: "Coordenada X relativa (ej. 0.5 para el centro horizontal)" },
          norm_y: { type: "number", description: "Coordenada Y relativa (ej. 0.5 para el centro vertical)" },
        },
        required: ["norm_x", "norm_y"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "host_tap_pixels",
      description: "Ejecuta un toque en pantalla usando coordenadas exactas en píxeles (x, y).",
      parameters: {
        type: "object",
        properties: {
          x: { type: "number", description: "Coordenada X exacta en píxeles" },
          y: { type: "number", description: "Coordenada Y exacta en píxeles" },
        },
        required: ["x", "y"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "host_type",
      description: "Escribe texto en el dispositivo móvil.",
      parameters: {
        type: "object",
        properties: { text: { type: "string", description: "Texto a escribir" } },
        required: ["text"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "host_screenshot",
      description: "Toma una captura de pantalla nativa y devuelve la ruta guardada.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "memory_save",
      description: "Guarda un hito, resumen de cambios o decisión arquitectónica en la base de datos SQLite.",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string", description: "Categoría (ej: architecture, git, tool_added, bugfix)" },
          summary: { type: "string", description: "Resumen corto de la acción" },
          details: { type: "string", description: "Detalles adicionales opcionales" },
        },
        required: ["category", "summary"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "memory_read",
      description: "Consulta los últimos registros guardados en la memoria persistente SQLite.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Cantidad de registros recientes a consultar (default: 5)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "run_project_tests",
      description: "Ejecuta la suite de tests de TypeScript del motor y el agente interno (src/lib/agent).",
      parameters: {
        type: "object",
        properties: {
          test_file: { type: "string", description: "Archivo de test específico (opcional, ej. tests/agent-session.test.ts)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_file",
      description: "Lee el contenido de un archivo del proyecto.",
      parameters: {
        type: "object",
        properties: { file_path: { type: "string", description: "Ruta del archivo" } },
        required: ["file_path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "write_file",
      description: "Escribe o sobrescribe un archivo en el repositorio.",
      parameters: {
        type: "object",
        properties: {
          file_path: { type: "string", description: "Ruta del archivo a escribir" },
          content: { type: "string", description: "Contenido del archivo" },
        },
        required: ["file_path", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "execute_shell",
      description: "Ejecuta comandos de shell en Termux (git, npm, ls, etc.).",
      parameters: {
        type: "object",
        properties: { command: { type: "string", description: "Comando bash" } },
        required: ["command"],
      },
    },
  },
];

const messages = [
  {
    role: "system",
    content: `Eres el AGENTE CONSTRUCTOR AUTÓNOMO para Nexus Engine 2D.
Tienes control sobre el hardware de Android vía daemon Rust, persistencia en SQLite (~/nexus_memory.db) y control total sobre el código del repositorio.
REGLA ESTRICTA: Ejecuta las herramientas de inmediato. Registra en memoria (memory_save) los hitos y cambios relevantes para mantener contexto entre sesiones.`,
  },
];

async function handleToolCall(fnName, args) {
  try {
    if (fnName === "host_tap_normalized") {
      const dims = await getScreenDimensions();
      const px = Math.round(args.norm_x * dims.width);
      const py = Math.round(args.norm_y * dims.height);
      return await sendToNativeDaemon({ action: "Tap", payload: { x: px, y: py } });
    }
    if (fnName === "host_tap_pixels") {
      return await sendToNativeDaemon({ action: "Tap", payload: { x: args.x, y: args.y } });
    }
    if (fnName === "host_type") {
      return await sendToNativeDaemon({ action: "Type", payload: { text: args.text } });
    }
    if (fnName === "host_screenshot") {
      return await sendToNativeDaemon({ action: "Screenshot" });
    }
    if (fnName === "memory_save") {
      return await saveMemoryEntry(args.category, args.summary, args.details || "");
    }
    if (fnName === "memory_read") {
      return await readRecentMemory(args.limit || 5);
    }
    if (fnName === "run_project_tests") {
      const target = args.test_file || "tests/agent-*.test.ts";
      const { stdout, stderr } = await execAsync(`npx vitest run ${target} 2>&1 || npx ts-node --esm ${target} 2>&1 || npm test 2>&1`, { cwd: process.cwd(), timeout: 45000 });
      return (stdout || stderr || "Tests ejecutados.").trim();
    }
    if (fnName === "read_file") {
      const resolved = path.resolve(process.cwd(), args.file_path);
      if (!fs.existsSync(resolved)) return `Error: El archivo ${args.file_path} no existe.`;
      return fs.readFileSync(resolved, "utf-8");
    }
    if (fnName === "write_file") {
      const resolved = path.resolve(process.cwd(), args.file_path);
      fs.mkdirSync(path.dirname(resolved), { recursive: true });
      fs.writeFileSync(resolved, args.content, "utf-8");
      return `Archivo ${args.file_path} guardado correctamente.`;
    }
    if (fnName === "execute_shell") {
      const { stdout, stderr } = await execAsync(args.command, { cwd: process.cwd(), timeout: 30000 });
      return (stdout || stderr || "(Comando finalizado sin salida)").trim();
    }
    return "Herramienta no implementada.";
  } catch (err) {
    return `Error en ${fnName}: ${err.message}${err.stderr ? "\n" + err.stderr : ""}`;
  }
}

async function chatTurn() {
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-v4-flash",
      messages,
      tools,
      tool_choice: "auto",
      temperature: 0.1,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "\x1b[36mbuilder-agent>\x1b[0m ",
});

console.log("\x1b[32m=== AGENTE CONSTRUCTOR NEXUS (NATIVO RUST + SQLITE + TESTS) ===\x1b[0m");
console.log("Sistema listo. Usa \x1b[33mclosed deep\x1b[0m o \x1b[33mexit\x1b[0m para salir.\n");

rl.prompt();

rl.on("line", async (line) => {
  const input = line.trim();
  if (!input) return rl.prompt();
  if (input.toLowerCase() === "closed deep" || input.toLowerCase() === "exit" || input === ":q") {
    console.log("\x1b[32m\n=== SESIÓN FINALIZADA ===\x1b[0m");
    process.exit(0);
  }

  messages.push({ role: "user", content: input });

  try {
    process.stdout.write("\x1b[90m[Procesando acción...]\x1b[0m\r");
    let responseMessage = await chatTurn();

    while (responseMessage?.tool_calls && responseMessage.tool_calls.length > 0) {
      messages.push(responseMessage);

      for (const call of responseMessage.tool_calls) {
        const fnName = call.function.name;
        const args = JSON.parse(call.function.arguments || "{}");
        const argDisplay = args.command || args.file_path || args.category || "";

        process.stdout.write(`\r\x1b[K\x1b[33m[Acción: ${fnName} ${argDisplay}]\x1b[0m\n`);
        const result = await handleToolCall(fnName, args);

        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: result,
        });
      }

      process.stdout.write("\x1b[90m[Sintetizando...]\x1b[0m\r");
      responseMessage = await chatTurn();
    }

    const reply = responseMessage?.content || "(Completado)";
    messages.push({ role: "assistant", content: reply });
    process.stdout.write("\r\x1b[K");
    console.log(`\n\x1b[37m${reply}\x1b[0m\n`);
  } catch (err) {
    process.stdout.write("\r\x1b[K");
    console.log(`\x1b[31mError: ${err.message}\x1b[0m\n`);
  }

  rl.prompt();
}).on("close", () => {
  console.log("\x1b[32m\n=== SESIÓN FINALIZADA ===\x1b[0m");
  process.exit(0);
});
