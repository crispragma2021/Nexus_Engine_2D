#!/usr/bin/env node
import readline from "node:readline";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

const API_KEY = process.env.DEEPSEEK_API_KEY;
if (!API_KEY) {
  console.error("\x1b[31mError: DEEPSEEK_API_KEY no definida en el entorno.\x1b[0m");
  process.exit(1);
}

const API_URL = "https://api.deepseek.com/chat/completions";
const MODEL = "deepseek-v4-flash";

const tools = [
  {
    type: "function",
    function: {
      name: "run_git_command",
      description: "Ejecuta comandos de git en el repositorio local. Devuelve la salida stdout/stderr.",
      parameters: {
        type: "object",
        properties: {
          command: {
            type: "string",
            description: "Subcomando de git (ej. 'status -s', 'diff', 'log -n 3 --oneline', 'add .', 'commit -m \"...\"', 'push').",
          },
        },
        required: ["command"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "run_github_cli",
      description: "Ejecuta comandos de GitHub CLI (gh) para consultar o gestionar el repositorio remoto, issues y PRs.",
      parameters: {
        type: "object",
        properties: {
          command: {
            type: "string",
            description: "Subcomando de gh (ej. 'issue list', 'pr list', 'repo view').",
          },
        },
        required: ["command"],
      },
    },
  },
];

const messages = [
  {
    role: "system",
    content: "Eres el agente de desarrollo autónomo para Nexus Engine 2D en Termux. REGLA ESTRICTA: Tienes acceso total a Git y GitHub a través de tus herramientas 'run_git_command' y 'run_github_cli'. Cuando el usuario te pida revisar el repositorio, commits, ramas, diferencias o ejecutar acciones, DEBES invocar la herramienta de inmediato en lugar de darle instrucciones de texto para que él las copie.",
  },
];

async function executeLocalCommand(cmd) {
  try {
    const { stdout, stderr } = await execAsync(cmd, { cwd: process.cwd(), timeout: 20000 });
    return (stdout || stderr || "(Sin salida)").trim();
  } catch (error) {
    return `Error al ejecutar: ${error.message}${error.stderr ? "\n" + error.stderr : ""}`;
  }
}

async function chatTurn() {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
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
  prompt: "\x1b[36mdeep>\x1b[0m ",
});

console.log(`\x1b[32m=== SESIÓN DEEPSEEK (${MODEL}) INICIADA ===\x1b[0m`);
console.log("Control total sobre Git y GitHub activo.");
console.log("Usa \x1b[33mclosed deep\x1b[0m o \x1b[33mexit\x1b[0m para salir.\n");

rl.prompt();

rl.on("line", async (line) => {
  const input = line.trim();

  if (!input) {
    rl.prompt();
    return;
  }

  if (
    input.toLowerCase() === "closed deep" ||
    input.toLowerCase() === "exit" ||
    input.toLowerCase() === "quit" ||
    input === ":q"
  ) {
    console.log("\x1b[32m\n=== SESIÓN DEEPSEEK CERRADA ===\x1b[0m");
    process.exit(0);
  }

  messages.push({ role: "user", content: input });

  try {
    process.stdout.write("\x1b[90m[Procesando...]\x1b[0m\r");
    let responseMessage = await chatTurn();

    while (responseMessage?.tool_calls && responseMessage.tool_calls.length > 0) {
      messages.push(responseMessage);

      for (const toolCall of responseMessage.tool_calls) {
        const fnName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments || "{}");
        let result = "";

        process.stdout.write(`\r\x1b[K\x1b[33m[Ejecutando: ${fnName === "run_git_command" ? "git " : "gh "}${args.command}]\x1b[0m\n`);

        if (fnName === "run_git_command") {
          result = await executeLocalCommand(`git ${args.command}`);
        } else if (fnName === "run_github_cli") {
          result = await executeLocalCommand(`gh ${args.command}`);
        } else {
          result = "Herramienta no reconocida";
        }

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: result,
        });
      }

      process.stdout.write("\x1b[90m[Analizando salida...]\x1b[0m\r");
      responseMessage = await chatTurn();
    }

    const reply = responseMessage?.content || "(Acción completada)";
    messages.push({ role: "assistant", content: reply });
    process.stdout.write("\r\x1b[K");
    console.log(`\n\x1b[37m${reply}\x1b[0m\n`);
  } catch (err) {
    process.stdout.write("\r\x1b[K");
    console.log(`\x1b[31mError: ${err.message}\x1b[0m\n`);
  }

  rl.prompt();
}).on("close", () => {
  console.log("\x1b[32m\n=== SESIÓN DEEPSEEK CERRADA ===\x1b[0m");
  process.exit(0);
});
