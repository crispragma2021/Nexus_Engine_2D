# NEXUS AI AGENT & ROUTING ARCHITECTURE

## 1. Gateway & Endpoint Local
- **Ruta Backend**: `/api/agent` (POST)
- **Protocolo**: OpenAI-compatible chat completions proxy.
- **URL Base Gemini**: `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`
- **Modelos**: `gemini-1.5-flash` / `gemini-2.5-flash`
- **Credenciales**: `process.env.GEMINI_API_KEY` (inyección server-side, no exponer al cliente).

## 2. Orquestador de Escena (Cliente)
- **Componente UI**: `src/components/editor/QuickAutomationBar.tsx`
- **Validador y Planificador**: `src/lib/agent/model.ts` -> función `planFromModel`
- **Herramientas registradas**: `src/lib/agent/tools.ts` (`TOOL_REGISTRY`)
- **Flujo de Ejecución**:
  1. Input de usuario -> llamada asíncrona a `/api/agent`.
  2. Parseo y validación de operaciones contra `GDProject` / `GDScene`.
  3. Ejecución directa mediante `commit(result.plan)`.

## 3. Integración con el Ecosistema
- **Core Daemon (Rust)**: `autonomous_agent` (en `agente-nexus/target/release/`)
- **Generador de Scripts**: `nexus_coder.py` (en `NEXUS_ULTIMATE_CORE/agents/`)
- **Build & CI**: GitHub Actions compila `dist/`. La carpeta `dist/` permanece ignorada por `.gitignore`.
