# Skill: Paridad UI/UX de GDevelop 5 sobre Nexus Engine

> Skill de trabajo para esta repo. Objetivo: la **interfaz y la experiencia son un clon
> fiel de GDevelop 5** (layout, densidad, colores, textos, interacciones), pero el
> **motor de juego es propio (TypeScript)** y la **marca es Nexus Engine**.
> Este documento es el contrato: si una regla de abajo choca con una intuición, gana la regla.

## 0. Orden obligatorio de trabajo

1. **Primero el motor/estado, después la piel.** Cualquier pantalla nueva nace de
   `src/lib/editor/types.ts` (modelo) → `src/lib/editor/store.tsx` (reducer) →
   `src/lib/runtime/*` (simulación) → y sólo entonces `src/components/editor/*`.
   Ningún componente guarda estado de proyecto en `useState`: si el dato pertenece al
   proyecto, vive en el modelo y se muta con una acción del reducer.
2. **Comparar contra la fuente real**, no contra la memoria. Clonar `4ian/GDevelop` con
   `--depth 1 --filter=blob:none --sparse` y habilitar `newIDE/app/src`; en la auditoría del
   29-08-2026 se usó `/tmp/gd-reference/newIDE/app/src` en el commit upstream `60d0aba`.
   Los textos oficiales están en `newIDE/app/src/locales/es_ES/messages.js` y
   `extension-messages.js`. Antes de inventar un label o un color, buscar ahí.
3. **Idioma = español oficial de GDevelop** (`es_ES`). Reutilizar la cadena exacta del
   catálogo traducido; si no existe, traducir con el mismo registro (tú informal, sin
   puntos finales en botones). Ver `src/lib/editor/i18n.ts`.

## 1. Inmutable: el camino del motor Nexus (TypeScript)

Es la única parte que **no** se copia de GDevelop. Reglas para respetarla:

| Pieza                           | Rol                                                                    | Convención                                                                                                                           |
| ------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `src/lib/runtime/types.ts`      | estado vivo mutable (`RTObject`, `RuntimeState`, `PHYSICS`)            | tipos planos, sin clases, `Record<string, string>` para variables                                                                    |
| `src/lib/runtime/expression.ts` | mini-evaluador de expresiones (`evalNumber`, `evalString`, `asNumber`) | mismo API; ampliar funciones sin romper firma                                                                                        |
| `src/lib/runtime/engine.ts`     | `GameRuntime`: interpreta el árbol de eventos y simula el frame        | `switch (instruction.typeId)` en `evalCondition` / `runAction`; **nunca** `eval` de JS del usuario; `step(deltaSeconds)` único bucle |
| `src/lib/runtime/renderer.ts`   | Canvas 2D a partir de `RuntimeState`                                   | dibujo determinista, caché de imágenes, sin estado de juego                                                                          |

Añadir una instrucción nueva = 3 pasos y nada más: ① entrada en `src/lib/editor/instructions.ts`
(catálogo con `sentence` y parámetros tipados), ② `case` en `engine.ts`, ③ si toca render,
campo en `RTObject` + rama en `renderer.ts`.

El runtime recibe **una escena**, no el proyecto entero: `getScene(project, name)`
(`src/lib/editor/scenes.ts`) produce el `GDRuntimeScene` que consume `GameRuntime`. Así el
motor sigue intacto aunque el editor soporte N escenas, layouts externos y eventos externos.

## 2. Fiel: reglas de la interfaz

### 2.1 Tokens (fuente: `UI/Theme/DefaultDarkTheme/theme.json`)

Nada de hex sueltos en componentes: todo pasa por las variables de `src/styles.css`.

| Rol                                            | Valor oficial                                                                                                                               | Token                                                       |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Ventana / canvas                               | `#1D1D26`                                                                                                                                   | `--window`                                                  |
| Toolbar y paneles                              | `#25252E`                                                                                                                                   | `--toolbar`                                                 |
| Superficie elevada / campos                    | `#32323B`                                                                                                                                   | `--elevated`                                                |
| Separadores / barra de búsqueda                | `#494952`                                                                                                                                   | `--separator`, `--search-bar`                               |
| Selección de fila                              | `#3E4452`                                                                                                                                   | `--selection`                                               |
| Hover de lista                                 | `#2f2f36`                                                                                                                                   | `--list-hover`                                              |
| Marca (Nexus = morado GDevelop)                | `#7046EC` / `#4F28CD` / `#37238F`                                                                                                           | `--brand`, `--brand-dark`, `--brand-darkest`                |
| Enlace / link-hover                            | `#DDD1FF` / `#C9B6FC`                                                                                                                       | `--link`, `--link-hover`                                    |
| Éxito (Play/hot reload)                        | `#45D9A1`                                                                                                                                   | `--success`                                                 |
| Texto secundario / deshabilitado / placeholder | `#C5C5C9` / `#9AA1AD` / `#A6A6AB`                                                                                                           | `--text-secondary`, `--text-disabled`, `--text-placeholder` |
| Hoja de eventos                                | `#282C34` (fila) · `#25252E` (condiciones) · `#1D1D26` (acciones)                                                                           | `--ev-row`, `--ev-conditions`, `--ev-actions`               |
| Parámetros de instrucción                      | base `#0ECD7A` · número `#E0D01F` · objeto `#A483FF` · comportamiento `#9AA5CE` · operador `#FF85ED` · variable `#8AD6FF` · error `#FE6C46` | `--param-*`                                                 |
| Cuadrícula del editor                          | `rgba(158,180,255,0.8)`                                                                                                                     | `--grid-line`                                               |
| Selección/marquesina del canvas                | `#6868e8`, handles relleno blanco + borde `#6868e8`                                                                                         | `--select-indigo`                                           |
| Pestañas                                       | barra `#32323B`, texto `#7F7F85`, activa `#494952` / `#F6F2FF`; pestaña cerrable activa `#25252E` borde `#7F7F85`                           | `--tabs-*`, `--closable-tab-*`                              |
| Tablas (`table.*`)                             | header `#25252E`, impar `#23232A`, par `#1D1D26`, borde `#282C34`, texto `#ABB2BF`                                                          | `--table-*`                                                 |

**Tema claro**: GDevelop lo tiene (`DefaultLightTheme`); aquí el producto es dark-only por
decisión de producto, no por olvido. No introducir `light:` ad-hoc.

### 2.2 Métricas (medidas en el fuente real)

- Toolbar principal: **40px** (`UI/Toolbar.js` `height = 40`), padding horizontal 8px.
- Barra de pestañas de proyecto: **34px** (`MainFrame/TabsTitlebar.js`).
- Zoom del editor de escena: factor de rueda `1.7^(1/16)`, pasos de botón `2^(2/16)`,
  límites `1/128 … 128` (`Utils/ZoomUtils.js`). Zoom inicial recomendado `700 / lado más largo`.
- Cuadrícula por defecto: 32×32, color `rgb(158,180,255)`, alfa `0.8`, `snap` **apagado**.
- Fuente de la hoja de eventos: 12–13px, filas de ~26px, dos columnas 50/50.
- Bordes: radio pequeño (`--radius: 0.375rem`), sombras casi inexistentes: GDevelop separa
  por color de superficie, no por sombra.

### 2.3 Estructura de la pantalla de escena

```
┌ Titlebar (34px): marca · pestañas cerrables (Inicio / Escena / Ajustes) · ventana ┐
│ Toolbar (40px): historial · guardar │ editor-toolbar del editor activo │ Preview▾ · Compartir │
│ Pestañas de editor: [Nombre escena ▾]  Scene | Events | Behaviors…                │
│ ┌ Paneles izquierda ┬─────────────── canvas ───────────────┬ Paneles derecha ──┐ │
│ │ Objetos (árbol     │ grid + máscara de ventana + handles  │ Propiedades       │ │
│ │ escena/globales)   │ zoom ctrl+rueda, pan espacio,        │ Instancias (tabla)│ │
│ │ Grupos de objetos  │ marcos de selección #6868e8,         │ Capas (visib/lock)│ │
│ └────────────────────┴ status bar «x;y» abajo a derecha ────┴───────────────────┘ │
└ barra de estado / atajos                                                            ┘
```

- Panel de objetos: árbol con raíces **«Objetos de escena»** y **«Objetos Globales»**,
  buscador abajo (`CompactSearchBar`), botón inferior **«Añadir un nuevo objeto»**, menú
  contextual con Copiar/Cortar/Pegar/Duplicar/Renombrar/Eliminar/Editar objeto/Editar
  variables/Editar comportamientos/Editar efectos/Intercambiar activos/
  Establecer como objeto global/Añadir instancia a la escena.
- Canvas: arrastrar un objeto de la lista y soltarlo crea la instancia
  (`InstancesAdder`); clic derecho = menú de la instancia; `Supr` elimina;
  `Ctrl+D` duplica; flechas mueven 1px (`Mayús` = 10px).
- Panel derecho: **3 paneles separables** (no un solo `aside` con 3 pestañas) y secciones
  plegables «Propiedades» / «Comportamientos» / «Variables de la escena».

### 2.4 Hoja de eventos (lo que la hace reconocible)

- Fondo global `#282C34`; cada evento: gutter de número + **manija de arrastre**
  (3 puntos, `#3E4452`, hover `#6C7D96`) + celda condiciones + celda acciones.
- Sub-eventos indentados con **línea guía vertical** `#494952`; contenedor de
  condiciones/acciones con borde `#32323B`; sub-instrucciones con borde `#3E4452`.
- Selección de instrucción: `1px dashed #4AB0E4` sobre `rgba(0,0,0,0.1)`.
- Comentario: color de texto `#98C379`-ish y toggle «Mostrar más/Menos»; grupo con color
  propio y checkbox de desactivación; `else` con icono; evento desactivado a `opacity: 0.4`.
- Textura de instrucción = la frase real de GDevelop con parámetros **inline** coloreados.
  Diálogo selector: dos columnas (categorías/búsqueda + lista con resaltado de coincidencias)
  y preview de la frase; pie «Cancelar» / «Añadir».
- Toolbar: Añadir un nuevo evento · Añadir un subevento · Comentario · Grupo ·
  Elige y agrega un evento · Eliminar seleccionados · Deshacer/Rehacer · Buscar en eventos ·
  Configuración (iconos de `UI/CustomSvgIcons`).

### 2.5 Marca Nexus Engine

- La marca se toca en **un solo sitio**: `src/lib/editor/brand.ts`. Todo texto visible usa
  `BRAND.name`; nada de «GDevelop» en UI, titles, toasts, claves de almacenamiento o README.
- La marca **no** cambia la estructura visual: mismo layout, mismos tokens, mismos flujos.
- Claves de `localStorage` con prefijo `nexus-engine:` (leer la antigua `gdevelop:` como
  migración, sin borrarla).

## 3. Checklist antes de dar por hecho un cambio

```bash
npx tsc --noEmit                     # 0 errores (Flow no existe aquí; TS estricto)
npx eslint . --max-warnings=0        # estilo
npx vite build                       # SSR + build ok
grep -rn "gdevelop" -i src --include=*.tsx --include=*.ts   # solo comentarios técnicos permitidos
curl -s localhost:5173/editor | grep -o 'Añadir un nuevo objeto'   # el texto real llega al DOM
```

Y en el navegador: tema, densidad, hover, selección y drag & drop **se ven igual** que en
GDevelop; la paleta no se altera; ningún botón decorativo sin acción (o se marca como
pendiente en `docs/GAP-ANALYSIS.md`).

## 4. Auditoría Web/Mobile de referencia (29-08-2026)

Referencia inspeccionada: `4ian/GDevelop@60d0aba`. La comparación se hizo por flujo y
responsabilidad, no copiando código Flow/PIXI dentro del editor TypeScript.

| Superficie                | Fuente upstream inspeccionada                                                                                         | Implementación Nexus y resultado                                                                                                                                                                                                                                                   |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dock móvil                | `SceneEditor/SwipeableDrawerEditorsDisplay/BottomToolbar.js`, `index.js` y `SwipeableDrawer.js`                       | `MobileBottomBar.tsx`: cinco accesos permanentes (Objetos, Grupos, Propiedades, Instancias y Capas), `nav` fijo con safe-area y Drawer redimensionable que termina **encima** del dock. Cambiar de acceso no desmonta ni desplaza el canvas.                                       |
| Canvas infinito y ventana | `InstancesEditor/Background.js`, `WindowBorder.js`, `WindowMask.js`, `ViewPosition.js` y `InstancesEditorSettings.js` | `SceneCanvas.tsx`: fondo infinito punteado, instancias editables fuera de la ventana, máscara opcional, marco cian contrastado con etiqueta de resolución y zoom inicial/acción «Encajar».                                                                                         |
| Gestos                    | `InstancesEditor/PinchHandler.js`, `LongTouchHandler.js` e `index.js`                                                 | `canvas-gestures.ts` + `SceneCanvas.tsx`: un puntero conserva selección/mover/redimensionar/rotar; dos punteros cancelan esa edición y realizan pan+pinch anclado al centro; el dedo restante queda inhibido hasta terminar la secuencia. También se ancla Ctrl/⌘+rueda al cursor. |
| Árbol de eventos          | `EventsSheet/EventsTree/*`, `EventsSheet/Toolbar.js`, `InstructionEditor/*` y `SearchPanel.js`                        | `EventsEditor.tsx` + `InstructionSelectorDialog.tsx`: eventos estándar, comentarios, grupos, enlaces, else, subeventos, activar/desactivar, duplicar/eliminar, búsqueda y parámetros visuales. En móvil la fila conserva sus dos columnas mediante desplazamiento horizontal.      |
| Capas                     | `LayersList/*` y `CompactLayerPropertiesEditor/*`                                                                     | `LayersPanel.tsx` + `PropertiesPanel.tsx`: capa activa, visibilidad, bloqueo, orden, renombrado, borrado, iluminación 2D, efectos y propiedades; panel completo tanto en escritorio como en Drawer.                                                                                |
| Instancias                | `InstancesEditor/InstancesList/*` y `CompactInstancePropertiesEditor/*`                                               | `InstancesPanel.tsx` + `PropertiesPanel.tsx`: buscar/seleccionar, capa, orden Z, visibilidad, bloqueo, duplicar/cortar/eliminar y alta; inspector de posición, tamaño, ángulo, capa, efectos y variables. La resolución objeto-instancia usa el `id` real.                         |
| Recursos                  | `ResourcesEditor/*`, `ResourcesList/*` y `ResourcePreview/*`                                                          | pestaña Recursos de `ProjectPropertiesDialog.tsx`: búsqueda/filtro, tabla, alta/renombrado/borrado, preview, metadatos, precarga e importación manual PNG/JPG/SVG y WAV/MP3/OGG; la tabla se desplaza en pantallas estrechas.                                                      |
| Preview/Play              | `MainFrame/Toolbar/PreviewAndShareButtons.js` y el flujo de preview                                                   | `TopToolbar.tsx` + `PreviewDialog.tsx`: botón Play fijo a la derecha incluso con toolbar estrecha, menú de preview, pausa, reinicio, debugger, tamaños de dispositivo, FPS y controles táctiles.                                                                                   |
| IA opcional               | Comparada con la separación editor/drawer upstream                                                                    | `QuickAutomationBar.tsx` es un Drawer superpuesto en móvil y popover en escritorio; `InlineAiPrompt.tsx` es contextual. Ambos terminan encima del canvas y debajo del dock/modal: nunca sustituyen ni recalculan el dock.                                                          |

Regresiones cubiertas en `tests/canvas-gestures.test.ts` y
`tests/mobile-editor-parity.test.ts`: arbitraje por cantidad de punteros, pan de dos
dedos, pinch anclado, límites `1/128…128`, zoom al cursor, encaje de la resolución,
dock permanente, separación de overlays e inspector por ID. Los controles de datos
siguen pasando por el reducer, por lo que Deshacer/Rehacer y el flujo contextual
Ctrl/⌘+K permanecen integrados.

Validación de la auditoría: **31/31 tests**, TypeScript estricto, ESLint sin warnings y
build cliente/SSR/Cloudflare completados. Rollup conserva únicamente su aviso conocido y
no bloqueante sobre `inlineDynamicImports`.

## 5. Fuera de alcance deliberado

Nexus Engine es un producto exclusivamente 2D: `3D` no forma parte de su alcance.
También quedan fuera por ahora `GameplayTests`, `VersionHistory`, `Leaderboard`,
`MarketingPlans`, `InAppTutorial`, el editor de extensiones JS
(`EventsFunctionsExtensionEditor`), las exportaciones nativas (Android/iOS/Electron)
y `HotReload` multi-ventana.
