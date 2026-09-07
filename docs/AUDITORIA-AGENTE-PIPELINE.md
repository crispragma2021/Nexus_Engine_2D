# Auditoría del pipeline del agente IA — `src/lib/agent/*`

Fecha: 2026-09-07 · Alcance: módulos `capabilities.ts`, `deepseek-client.ts`,
`model.ts`, `operations.ts`, `planner.ts`, `schemas.ts`, `session.ts`,
`tools.ts`, `validator.ts` (+ consumidores `AgentPanel`, `use-agent-commit`,
`ai-logic.ts`).

## Veredicto general

La arquitectura es sólida y coherente con el contrato del brief:

- **Frontera de confianza clara**: el modelo/CLI solo produce candidatos
  (`AgentPlan`); nada llega al store o a React sin pasar `validatePlan` y el
  flujo atómico `evaluateAndApplyPlan` de la sesión.
- **Aplicación atómica**: `applyPlan` aborta el plan completo ante el primer
  fallo y deja el proyecto intacto; cada operación registra snapshots
  `before/after` para rollback/undo.
- **Matriz de capacidades única** (`capabilities.ts`) y honesta: lo que el
  runtime no simula se reporta como *unsupported*, nunca se finge. Los tests
  verifican que no haya deriva con el catálogo y el dispatch del runtime.
- **Autonomía acotada**: 50 ops/plan, 100 entradas de auditoría, 10 planes
  aplicados retenidos.
- **Higiene de secretos**: el token nunca aparece en razones de error ni en
  el audit; `model.ts` exige HTTPS (o localhost) y usa timeout duro.
- Suite de tests: **99/99 en verde** (incluye agent-model, agent-operations,
  agent-session, ai-logic).

## Hallazgos por severidad

### M — Duplicación de gateways LLM divergentes (`deepseek-client.ts` vs `model.ts`)

`deepseek-client.ts` (usado por `scripts/agent-cli.mjs`) y `model.ts` (usado
por `AgentPanel.tsx`) resuelven el mismo problema con contratos distintos:

| Aspecto | `model.ts` | `deepseek-client.ts` |
|---|---|---|
| Timeout / abort | Sí (30s default, 120s máx) | **No** (fetch puede colgarse) |
| Fences ```json``` | Sí (strip) | No |
| Re-registro de ids del modelo | Sí (evita colisiones) | No |
| Catálogo de tools en prompt | Solo `supported` + docs de payload | `TOOL_NAMES` crudo (incluye 6 no soportadas) |
| Contexto | Acotado a 8000 chars | Proyecto completo sin tope |
| `max_tokens` | 2000 | No definido |

Riesgo concreto del CLI: el SYSTEM_PROMPT anuncia `create_asset`,
`import_asset`, `run_preview`, etc., que el validador rechaza por
`tool-unsupported` → planes fallidos evitables y contexto desperdiciado.
Recomendación: consolidar el CLI sobre `model.ts` (endpoint configurable) o
alinear `deepseek-client` con `buildToolCatalog()` + `parseModelPlan` + timeout.

### M — `validateInstructions` no valida el esquema de parámetros por instrucción

En `create_event` / `update_event` (`tools.ts`) solo se comprueba que el
`typeId` esté soportado y que `parameters` sea un objeto. No se valida:

- claves **requeridas/permitidas** de cada instrucción (`ai-logic.ts` tiene
  `SCHEMA` con `required`/`allowed` que aquí no se reutiliza);
- que las **referencias** (`object`, `object2`, `scene`, `file`) existan en la
  escena/proyecto.

Consecuencia: un plan del modelo puede crear `KeyPressed` sin `key`,
`Collision` con objetos inexistentes, etc., y pasar la validación → eventos
muertos en el runtime (que falla seguro, pero genera ruido). Además,
`add_collision` sí verifica nombres de objeto mientras `create_event` no:
inconsistencia. Recomendación: exportar el `SCHEMA`/validador de `ai-logic` y
aplicarlo en `validateInstructions` (con referencias contra la escena destino).

### L — Coste de validación en proyectos grandes

`validatePlan` hace dry-run **ejecutando** `applyOperation` sobre un estado
`working` para poder validar operaciones secuenciales que referencian lo que
el plan crea. Correcto, pero implica clonar el documento del proyecto por cada
operación válida, y después `applyPlan` lo ejecuta de nuevo para el commit
real: **~2× trabajo** y O(ops × tamaño del JSON). Con 50 ops sobre una escena
con miles de instancias puede notarse. Recomendación: en el dry-run bastaría
ejecutar `validate` + simular los ids/nombres creados sin clonar todo el
proyecto, o marcar como límite práctico 20–30 ops para escenas grandes.

### L — Retención de memoria de la sesión

`MAX_APPLIED_PLANS = 10` y cada plan guarda hasta 50 `OperationRecord` con
`before`/`after` del proyecto completo → en el peor caso ~1000 copias del
documento en memoria en móvil. Aceptable para documentos pequeños, pero es el
primer candidato a ajustar si los proyectos crecen. Alternativa: guardar
solamente `before` (rollback) y el diff/entidades cambiadas.

### L — `buildModelContext` trunca el JSON por bytes

`buildModelContext` corta el JSON a 8000 caracteres con `slice(0, N) + "…"`.
Si el corte cae dentro de una cadena o número, el contexto enviado al modelo
es JSON inválido (no rompe el pipeline, pero degrada la calidad del plan).
Recomendación: truncar por entidades (p. ej. objetos/instancias por escena)
manteniendo JSON válido.

### L — `planner.ts`: ternario redundante y referencias cross-scene

```ts
const lookupScene = targetSceneName === createdSceneName ? activeScene : activeScene;
```
Ambas ramas son idénticas (código muerto); además un plan compuesto del tipo
«crea la escena X y añade una instancia de Moneda» planifica la instancia del
objeto de la escena activa dentro de la escena nueva X, y la validación la
rechaza con razón honesta (el objeto no existe en X). Recomendación: resolver
el ternario según el intento real y, en flujos compuestos, crear también el
objeto en la escena nueva antes de instanciarlo.

### L — Cosmético

- En `capabilities.ts` hay un `//` dentro de un JSDoc (comentario roto).
- `create_event` no admite sub-eventos y `eventsToAgentPlan` los descarta en
  silencio (hoy los compiladores emiten eventos planos; si mañana un compilador
  generase jerarquías se perderían datos). Recomendación: avisar en vez de
  descartar.

## Fortalezas a preservar

- `parseModelPlan` re-registra los ids de operaciones (ignora ids del modelo).
- Validación contra el estado real del proyecto (ids, nombres, capacidades),
  no solo contra la forma.
- Transacción atómica + rollback por snapshots (`OperationRecord`).
- Matriz de capacidades como *single source of truth* con tests anti-deriva.
- Rechazos honestos con mensajes en español y opciones alternativas.
- Auditoría acotada y trazable en la sesión.
