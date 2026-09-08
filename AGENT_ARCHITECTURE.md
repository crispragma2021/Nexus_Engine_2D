# NEXUS AI AGENT & ROUTING ARCHITECTURE

## 1. Gateway & Endpoint Local

- **Ruta Backend**: `/api/agent` — `GET` (estado) y `POST` (chat completions).
- **Protocolo**: proxy chat-completions compatible OpenAI.
- **URL Base Gemini**: `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`
- **Modelos**: lista blanca `gemini-2.5-flash` (por defecto) / `gemini-1.5-flash`.
- **Credenciales**: `process.env.GEMINI_API_KEY` (inyección server-side, alias aceptado
  `GOOGLE_API_KEY`). Nunca se exponen al cliente: cualquier credencial que envíe el navegador se
  descarta y la clave no aparece en respuestas, cabeceras ni mensajes de error.

### Implementación

| Capa           | Archivo                                | Responsabilidad                                                                                              |
| -------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Lógica pura    | `src/lib/agent/gemini-gateway.ts`      | Saneado acotado de la petición, lista blanca de modelos, timeout duro, normalización OpenAI, errores.        |
| Adaptador Node | `src/lib/agent/gateway-node.ts`        | Traduce `IncomingMessage`/`ServerResponse` ↔ gateway (lectura de cuerpo con límite, escritura de respuesta). |
| Producción     | `api/agent.ts`                         | Función serverless de Vercel en `/api/agent`.                                                                |
| Desarrollo     | `vite.config.ts` (`nexusAgentGateway`) | Middleware de `vite dev` y `vite preview` sobre el mismo módulo puro.                                        |
| Self-hosting   | `scripts/run_nexus_server.mjs`         | Intercepta `/api/agent` antes de los assets y del SSR.                                                       |

> La versión fijada de TanStack Start en este repo no expone rutas de servidor por archivo
> (`server.handlers`), así que el endpoint se sirve con adaptadores sobre la lógica pura en vez de
> añadir dependencias nuevas. Los tres adaptadores delegan en el mismo módulo testeado.

`GET /api/agent` devuelve `{ ok, provider, endpoint, enabled, models, defaultModel }` para que la UI
sepa si el asistente remoto está configurado, sin revelar la clave.

## 2. Orquestador de Escena (Cliente)

- **Componente UI**: `src/components/editor/QuickAutomationBar.tsx`
- **Cliente del gateway**: `src/lib/agent/nexus-client.ts` (`requestNexusPlan`, `planWithAssistant`,
  `probeNexusAssistant`)
- **Validador y Planificador**: `src/lib/agent/model.ts` -> función `planFromModel`
- **Herramientas registradas**: `src/lib/agent/tools.ts` (`TOOL_REGISTRY`)
- **Respaldo determinista**: `src/lib/editor/ai-logic.ts` + `src/lib/agent/planner.ts`
- **Flujo de Ejecución**:
  1. Input de usuario -> `POST /api/agent` (sin token: la clave vive en el servidor).
  2. Parseo y validación de operaciones contra `GDProject` / `GDScene` (`parseModelPlan` ->
     `validatePlan`). La respuesta del modelo es siempre un plan **candidato**.
  3. Aprobación según el modo de autonomía de la sesión (`Supervised` aprueba siempre) y ejecución
     mediante `commit(plan)` como transacción atómica reversible.
  4. Si el gateway no está configurado, falla o no produce un plan válido, entra el planificador
     local y la UI indica el origen del plan (`Nexus AI` vs `Planificador local`).

`model.ts` acepta endpoints relativos del mismo origen (`/api/agent`) además de URLs absolutas
HTTPS: sin host no hay fuga posible de credenciales a terceros.

## 3. Integración con el Ecosistema

- **Core Daemon (Rust)**: `autonomous_agent` (en `agente-nexus/target/release/`)
- **Generador de Scripts**: `nexus_coder.py` (en `NEXUS_ULTIMATE_CORE/agents/`)
- **Build & CI**: GitHub Actions compila `dist/`. La carpeta `dist/` permanece ignorada por
  `.gitignore` y nunca se confirma.
- **Verificación**: `npm run test` (suites `tests/agent-gateway.test.ts` y
  `tests/nexus-assistant.test.ts` cubren el gateway y el cliente sin red), `npm run typecheck`,
  `npm run lint` y `npm run build`.

## 4. Configuración

```sh
# .env (solo servidor; nunca en el bundle del cliente)
GEMINI_API_KEY=...
NEXUS_AGENT_TIMEOUT_MS=45000   # opcional, 5000–120000
```

Sin `GEMINI_API_KEY` el endpoint responde `503 configuration_error` y el editor sigue siendo fully
funcional con el planificador local.
