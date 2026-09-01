#!/usr/bin/env node
import { requestAgentPlan } from "../src/lib/agent/deepseek-client.ts";
import { createAgentSession, evaluateAndApplyPlan } from "../src/lib/agent/session.ts";

const prompt = process.argv.slice(2).join(" ");
if (!prompt) {
  console.error('Uso: node --experimental-transform-types scripts/agent-cli.mjs "tu instrucción"');
  process.exit(1);
}

// Proyecto base mínimo para pruebas
const dummyProject = {
  name: "Nexus Project",
  version: "1.0.0",
  scenes: [
    {
      name: "Escena 1",
      backgroundColor: "20;20;30",
      objects: [],
      instances: [],
      layers: [{ name: "Base", cameraCount: 1 }],
      events: [],
      groups: [],
      variables: [],
    },
  ],
  globalVariables: [],
  resources: [],
};

console.log(`[DeepSeek Agent] Procesando: "${prompt}"...`);

const { plan, error } = await requestAgentPlan({
  prompt,
  project: dummyProject,
});

if (error) {
  console.error(`[Error]: ${error}`);
  process.exit(1);
}

console.log("\n--- PLAN GENERADO Y VALIDADO ---");
console.log(JSON.stringify(plan, null, 2));

const session = createAgentSession(dummyProject);
const outcome = evaluateAndApplyPlan(session, dummyProject, plan);

console.log("\n--- RESULTADO DE LA TRANSACCIÓN ---");
console.log(`OK: ${outcome.result.ok}`);
console.log(`Operaciones aplicadas: ${outcome.result.records.length}`);
