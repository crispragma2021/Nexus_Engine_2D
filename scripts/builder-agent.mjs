#!/usr/bin/env node

async function loadLearnedRules() {
  try {
    const dbPath = path.join(process.env.HOME || "", "nexus_memory.db");
    if (!fs.existsSync(dbPath)) return "";
    const { stdout } = await execAsync("sqlite3 \"" + dbPath + "\" \"SELECT summary FROM builder_memory WHERE category='environment' ORDER BY id DESC LIMIT 5;\"");
    const rules = stdout.trim().split("\n").filter(Boolean);
    if (!rules.length) return "";
    return "\n[REGLAS APRENDIDAS DEL ENTORNO LOCAL]:\n" + rules.map(r => "- " + r).join("\n");
  } catch (_) {
    return "";
  }
}

// --- RESILIENCIA TERMUX: Gestor dinámico de rutas temporales ---
function getSafeTempDir() {
  const termuxTmp = process.env.TMPDIR || (process.env.PREFIX ? process.env.PREFIX + "/tmp" : null);
  if (termuxTmp && fs.existsSync(termuxTmp)) return termuxTmp;
  const homeTmp = path.join(process.env.HOME || "", ".tmp");
  if (!fs.existsSync(homeTmp)) fs.mkdirSync(homeTmp, { recursive: true });
  return homeTmp;
}
const SAFE_TMP_DIR = getSafeTempDir();
import readline from "node:readline";
import net from "node:net";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execAsync = promisify(exec);
// Raíz del repositorio gestionado por el agente: siempre scripts/.. del propio
// ejecutable, en lugar de process.cwd() (que depende del directorio de arranque).
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
// Fijar cwd al repo para que todas las tools (git, archivos, shell, búsqueda)
// resuelvan rutas relativas contra el repositorio real del agente y no contra
// el directorio desde el que se lanzó el daemon.
try {
  process.chdir(REPO_ROOT);
} catch {}
const SOCKET_PATH = "/data/data/com.termux/files/home/.nexus_host.sock";
const DB_PATH = "/data/data/com.termux/files/home/nexus_memory.db";

// Resuelve rutas relativas contra REPO_ROOT; las absolutas se respetan tal cual.
function resolveRepoPath(p) {
  return path.isAbsolute(p) ? p : path.resolve(REPO_ROOT, p);
}

// Secretos: prioriza process.env y, si faltan, hace fallback al vault local
// (~/.nexus_secrets/deepseek.env) para arrancar sin depender del shell padre.
function loadSecrets() {
  const base = { apiKey: "", baseUrl: "https://api.deepseek.com" };
  if (process.env.DEEPSEEK_API_KEY) {
    base.apiKey = process.env.DEEPSEEK_API_KEY;
    base.baseUrl = process.env.DEEPSEEK_BASE_URL || base.baseUrl;
    return base;
  }
  try {
    const vault = path.join(os.homedir(), ".nexus_secrets", "deepseek.env");
    const content = fs.readFileSync(vault, "utf-8");
    const grab = (k) => (content.match(new RegExp("^" + k + "\\s*=\\s*\"?([^\"\\n]+)\"?", "m")) || [])[1] || "";
    base.apiKey = grab("DEEPSEEK_API_KEY");
    base.baseUrl = grab("DEEPSEEK_BASE_URL") || base.baseUrl;
  } catch {
    // Sin vault disponible: se mantiene apiKey vacía y el check de abajo aborta.
  }
  return base;
}

const SECRETS = loadSecrets();
const API_KEY = SECRETS.apiKey;
const DEEPSEEK_BASE_URL = SECRETS.baseUrl;

if (!API_KEY) {
  console.error("\x1b[31mError: DEEPSEEK_API_KEY no está definida ni en el entorno ni en ~/.nexus_secrets/deepseek.env.\x1b[0m");
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
      description:
        "Ejecuta un toque en pantalla usando coordenadas relativas normalizadas (0.0 a 1.0).",
      parameters: {
        type: "object",
        properties: {
          norm_x: {
            type: "number",
            description: "Coordenada X relativa (ej. 0.5 para el centro horizontal)",
          },
          norm_y: {
            type: "number",
            description: "Coordenada Y relativa (ej. 0.5 para el centro vertical)",
          },
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
      description:
        "Guarda un hito, resumen de cambios o decisión arquitectónica en la base de datos SQLite.",
      parameters: {
        type: "object",
        properties: {
          category: {
            type: "string",
            description: "Categoría (ej: architecture, git, tool_added, bugfix)",
          },
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
          limit: {
            type: "number",
            description: "Cantidad de registros recientes a consultar (default: 5)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "run_project_tests",
      description:
        "Ejecuta la suite de tests de TypeScript del motor y el agente interno (src/lib/agent).",
      parameters: {
        type: "object",
        properties: {
          test_file: {
            type: "string",
            description: "Archivo de test específico (opcional, ej. tests/agent-session.test.ts)",
          },
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
      name: "audit_code_changes",
      description: "Ejecuta una auditoría estricta sobre las modificaciones pendientes (git diff) evaluando rendimiento móvil, fugas de memoria y buenas prácticas antes de commitear.",
      parameters: {
        type: "object",
        properties: {
          focus_area: { type: "string", enum: ["performance", "memory_leaks", "clean_code", "all"], description: "Área de enfoque principal para la revisión" }
        }
      }
    }
  },
{
    type: "function",
    function: {
      name: "symbol_navigator",
      description: "Localiza al instante definiciones, funciones, clases, componentes o interfaces mediante ripgrep sin gastar tokens innecesarios.",
      parameters: {
        type: "object",
        properties: {
          symbol_name: { type: "string", description: "Nombre de la función, clase, interfaz o componente a rastrear" }
        },
        required: ["symbol_name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "system_telemetry",
      description: "Inspecciona el uso de memoria RAM, puertos de red ocupados (puerto 3000) o termina procesos colgados.",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["ports", "memory", "kill_port"], description: "Acción a diagnosticar" },
          port: { type: "number", description: "Número de puerto a consultar o liberar (por defecto 3000)" }
        },
        required: ["action"]
      }
    }
  },
{
    type: "function",
    function: {
      name: "git_ops",
      description: "Ejecuta operaciones seguras de Git: status, diff, o commit de cambios verificados.",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string", enum: ["status", "diff", "commit"], description: "Acción de git a realizar" },
          message: { type: "string", description: "Mensaje de commit (requerido si action es commit)" }
        },
        required: ["action"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "find_in_code",
      description: "Busca patrones de texto o nombres de funciones en los archivos de código del proyecto.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Texto o expresión regular a buscar" },
          extension: { type: "string", description: "Filtro de extensión opcional, ej: ts, tsx, js, rs" }
        },
        required: ["query"]
      }
    }
  },
{
    type: "function",
    function: {
      name: "patch_file",
      description: "Aplica un reemplazo exacto (Search and Replace) dentro de un archivo existente sin sobreescribirlo por completo.",
      parameters: {
        type: "object",
        properties: {
          file_path: { type: "string", description: "Ruta del archivo a modificar" },
          search: { type: "string", description: "Texto exacto que se desea encontrar y reemplazar" },
          replace: { type: "string", description: "Texto nuevo de sustitución" }
        },
        required: ["file_path", "search", "replace"]
      }
    }
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


async function runQuickIntegrityCheck(filePath) {
  if (!filePath.endsWith(".ts") && !filePath.endsWith(".tsx") && !filePath.endsWith(".js") && !filePath.endsWith(".jsx")) {
    return "";
  }
  try {
    const { stdout, stderr } = await execAsync("node --check " + filePath + " 2>&1 || true", { cwd: REPO_ROOT });
    const output = (stdout + stderr).trim();
    if (output && output.toLowerCase().includes("syntaxerror")) {
      return "\n[ALERTA DE AUTOCORRECCIÓN]: Se detectó un error sintáctico tras el cambio:\n" + output;
    }
  } catch (e) {
    return "\n[ALERTA]: " + e.message;
  }
  return "";
}

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
      const clean = (args.test_file || "").replace(/^.*[\\/]/, "");
      const target = clean ? `tests/${clean}` : "tests/*.test.mjs tests/*.test.ts";
      const { stdout, stderr } = await execAsync(
        `node --experimental-strip-types --test ${target} 2>&1`,
        { cwd: REPO_ROOT, timeout: 120000 },
      );
      return (stdout || stderr || "Tests ejecutados.").trim();
    }
    if (fnName === "read_file") {
      const resolved = resolveRepoPath(args.file_path);
      if (!fs.existsSync(resolved)) return `Error: El archivo ${args.file_path} no existe en ${REPO_ROOT}.`;
      return fs.readFileSync(resolved, "utf-8");
    }
    if (fnName === "audit_code_changes") {
      const { stdout: diffOutput } = await execAsync("git diff", { cwd: REPO_ROOT });
      if (!diffOutput.trim()) {
        return "Auditoría cancelada: El árbol de trabajo está limpio, no hay cambios en git diff para auditar.";
      }
      const focus = args.focus_area || "all";
      const auditPrompt = `Actúa como Auditor Principal de Código Senior para Android/Termux y React/TypeScript.
Analiza críticamente el siguiente git diff con enfoque en: ${focus}.
Verifica:
1. Fugas de memoria (listeners sin cleanup, timers no cancelados).
2. Impacto en rendimiento móvil (re-renders, operaciones sincrónicas pesadas).
3. Violaciones de tipos TypeScript o posibles errores en tiempo de ejecución.
Emite un veredicto conciso: APROBADO o RECHAZADO, detallando puntos a corregir si hay fallos.

DIFF:
${diffOutput.slice(0, 3500)}`;

      const auditResponse = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "user", content: auditPrompt }],
          temperature: 0.2
        })
      });
      const data = await auditResponse.json();
      return "=== INFORME DE AUDITORÍA DE CÓDIGO ===\n" + (data.choices?.[0]?.message?.content || "No se pudo generar el veredicto.");
    }
    if (fnName === "symbol_navigator") {
      const target = (args.symbol_name || "").replace(/[^a-zA-Z0-9_-]/g, "");
      if (!target) return "Error: symbol_name vacío o inválido.";
      const pattern = "(function\\s+" + target + "|const\\s+" + target + "\\s*=|class\\s+" + target + "|interface\\s+" + target + "|export\\s+.*" + target + ")";
      const cmd = "rg -n --no-heading --color=never -e \"" + pattern + "\" src/ tests/ 2>/dev/null | head -n 20";
      const { stdout } = await execAsync(cmd, { cwd: REPO_ROOT });
      return stdout.trim() || "No se encontraron definiciones exactas para: " + target;
    }
    if (fnName === "system_telemetry") {
      const parsedPort = Number.parseInt(args.port, 10);
      const targetPort = Number.isInteger(parsedPort) && parsedPort > 0 && parsedPort <= 65535 ? parsedPort : 3000;
      if (args.action === "ports") {
        const { stdout } = await execAsync("lsof -i :" + targetPort + " 2>/dev/null || echo \"Puerto " + targetPort + " libre.\"", { cwd: REPO_ROOT });
        return stdout.trim();
      }
      if (args.action === "memory") {
        const { stdout } = await execAsync("free -m 2>/dev/null || cat /proc/meminfo | head -n 4", { cwd: REPO_ROOT });
        return stdout.trim();
      }
      if (args.action === "kill_port") {
        const { stdout } = await execAsync("fuser -k " + targetPort + "/tcp 2>/dev/null || true", { cwd: REPO_ROOT });
        return "Orden de liberación ejecutada para puerto " + targetPort + ".";
      }
    }
    if (fnName === "git_ops") {
      if (args.action === "status") {
        const { stdout } = await execAsync("git status -s", { cwd: REPO_ROOT });
        return stdout.trim() || "Árbol de trabajo limpio.";
      }
      if (args.action === "diff") {
        const { stdout } = await execAsync("git diff --stat", { cwd: REPO_ROOT });
        return stdout.trim() || "No hay diferencias pendientes.";
      }
      if (args.action === "commit") {
        if (!args.message) return "Error: Se requiere un mensaje para el commit.";
        const cleanMsg = String(args.message).replace(/[`$;]/g, "").replace(/"/g, "");
        if (!cleanMsg.trim()) return "Error: Mensaje de commit inválido.";
        const { stdout, stderr } = await execAsync(`git add -A && git commit -m "${cleanMsg}"`, { cwd: REPO_ROOT });
        return (stdout || stderr || "Commit completado.").trim();
      }
    }
    if (fnName === "find_in_code") {
      const extFilter = args.extension ? `--include="*.${args.extension}"` : `--include="*.ts" --include="*.tsx" --include="*.js" --include="*.rs"`;
      const cmd = `rg -n --glob "!node_modules" --glob "!.git"E ${extFilter} "${args.query.replace(/"/g, "")}" src/ tests/ 2>/dev/null | head -n 25`;
      const { stdout } = await execAsync(cmd, { cwd: REPO_ROOT });
      return stdout.trim() || "No se encontraron coincidencias.";
    }
    if (fnName === "patch_file") {
      const resolved = resolveRepoPath(args.file_path);
      if (!fs.existsSync(resolved)) return `Error: El archivo ${args.file_path} no existe en ${REPO_ROOT}.`;
      const original = fs.readFileSync(resolved, "utf-8");
      if (!original.includes(args.search)) {
        return `Error: No se encontró la cadena exacta de búsqueda en ${args.file_path}. Asegúrate de copiar el bloque idéntico.`;
      }
      const occurrences = original.split(args.search).length - 1;
      if (occurrences > 1) {
        return `Error: La cadena de búsqueda aparece ${occurrences} veces en el archivo. Proporciona más contexto alrededor para que sea única.`;
      }
      const updated = original.replace(args.search, args.replace);
      fs.writeFileSync(resolved, updated, "utf-8");
      const check = await runQuickIntegrityCheck(resolved); return `Archivo ${args.file_path} parcheado con éxito (1 bloque reemplazado).${check}`;
    }
    if (fnName === "write_file") {
      const resolved = resolveRepoPath(args.file_path);
      fs.mkdirSync(path.dirname(resolved), { recursive: true });
      fs.writeFileSync(resolved, args.content, "utf-8");
      const check = await runQuickIntegrityCheck(resolved); return `Archivo ${args.file_path} guardado correctamente.${check}`;
    }
    if (fnName === "execute_shell") {
      const { stdout, stderr } = await execAsync(args.command, {
        cwd: REPO_ROOT,
        timeout: 30000,
      });
      return (stdout || stderr || "(Comando finalizado sin salida)").trim();
    }
    return "Herramienta no implementada.";
  } catch (err) {
    return `Error en ${fnName}: ${err.message}${err.stderr ? "\n" + err.stderr : ""}`;
  }
}

async function chatTurn() {
  // Construir historial estricto: solo pares asistente-herramienta completos
  const cleanMessages = [];
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (m.role === "assistant" && Array.isArray(m.tool_calls) && m.tool_calls.length > 0) {
      const toolMap = new Map();
      let j = i + 1;
      while (j < messages.length && messages[j].role === "tool") {
        toolMap.set(messages[j].tool_call_id, messages[j]);
        j++;
      }
      const allFound = m.tool_calls.every(tc => toolMap.has(tc.id));
      if (allFound) {
        // Preservar reasoning_content requerido por thinking mode
        const cleanAssistant = {
          role: "assistant",
          content: m.content || "",
          tool_calls: m.tool_calls
        };
        if (m.reasoning_content !== undefined) {
          cleanAssistant.reasoning_content = m.reasoning_content;
        }
        cleanMessages.push(cleanAssistant);
        for (const tc of m.tool_calls) {
          cleanMessages.push(toolMap.get(tc.id));
        }
        i = j - 1;
      }
    } else if (m.role !== "tool") {
      cleanMessages.push(m);
    }
  }

  const res = await fetch(DEEPSEEK_BASE_URL + "/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-v4-flash",
      messages: cleanMessages,
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


const cliArgs = process.argv.slice(2).filter(a => !a.startsWith("-")).join(" ").trim();
if (cliArgs) {
  (async () => {
    try {
      console.log("[deep] Procesando orden directa:", cliArgs);
      await runAgentLoop(cliArgs);
    } catch (err) {
      console.error("[deep] Error:", err.message);
    }
    process.exit(0);
  })();
} else {
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

    // Purgar mensajes rotos de turnos anteriores
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "assistant" && messages[i].tool_calls) {
      const ids = new Set(messages[i].tool_calls.map(tc => tc.id));
      for (let j = i + 1; j < messages.length; j++) {
        if (messages[j].role === "tool") ids.delete(messages[j].tool_call_id);
      }
      if (ids.size > 0) {
        messages.splice(i);
      }
    }
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
                let result = "";
        try {
          result = await handleToolCall(fnName, args);
        } catch (toolErr) {
          result = "Error ejecutando " + fnName + ": " + (toolErr.message || String(toolErr));
        }

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

}
