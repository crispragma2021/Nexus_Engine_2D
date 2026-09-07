#!/usr/bin/env node
import { requestAgentPlan } from "../src/lib/agent/deepseek-client.ts";
import { createAgentSession, evaluateAndApplyPlan } from "../src/lib/agent/session.ts";

const prompt = process.argv.slice(2).join(" ");
if (!prompt) {
  console.error('Uso: node --experimental-transform-types scripts/agent-cli.mjs "tu instrucción"');
  process.exit(1);
}

// Proyecto base mínimo para pruebas. Debe ser un GDProject completo porque el
// gateway unificado (model.ts) construye el contexto desde gameSettings,
// resources, escenas, etc.
const dummyProject = {
  name: "Nexus Project",
  version: "1.0.0",
  firstLayoutName: "Escena 1",
  scenes: [
    {
      name: "Escena 1",
      backgroundColor: "20;20;30",
      grid: { show: false, snap: false, width: 32, height: 32, kind: "rectangular", color: "158;180;255", alpha: 0.8, offsetX: 0, offsetY: 0 },
      layers: [{ name: "Base layer", visible: true, camera: { x: 0, y: 0 }, effects: [] }],
      activeLayer: "Base layer",
      objects: [],
      instances: [],
      events: [],
      variables: [],
      groups: [],
    },
  ],
  gameSettings: {
    author: "test",
    description: "",
    version: "1.0.0",
    packageName: "com.nexus.test",
    orientation: "landscape",
    windowWidth: 800,
    windowHeight: 600,
    useWindowSizeAsBaseSize: true,
    magnification: 1,
    minFPS: 30,
    maxFPS: 60,
    adaptGameResolutionAtRuntime: false,
    scaleMode: "nearest",
    windowMode: "default",
    startScene: "Escena 1",
    pauseOnLostFocus: false,
    renderOutsideGameArea: false,
    loadingScreen: {
      displayBrandSplash: false,
      minDuration: 0,
      fadeInDuration: 0,
      fadeOutDuration: 0,
      backgroundColor: "0;0;0",
    },
    watermark: { showOnMobile: false },
    projectUuid: "test",
    folderPolicy: "doNotUse",
  },
  resources: [],
  globalVariables: [],
  extensions: [],
  externalEvents: [],
  externalLayouts: [],
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
