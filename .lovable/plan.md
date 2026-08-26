# Clon UI/UX de GDevelop 5 — Scene Editor + Events Editor

## Objetivo
Construir una app web funcional que replique fielmente la UI/UX del editor de GDevelop 5 (tema oscuro oficial), usable en navegador o WebView de tu app Android. Alcance: **Scene Editor** y **Events Editor**, con la shell del editor (toolbar, pestañas, Project Manager drawer). Sin backend: datos de proyecto simulados en memoria con interacción real.

## Lo que verá el usuario
Una sola pantalla de editor a pantalla completa (ruta `/`):

### 1. Shell del editor
- **Toolbar superior** (#25252E): botón hamburguesa que abre el **Project Manager** (drawer lateral con el árbol: Game settings, Scenes, External layouts, External events, Extensions, Resources), pestañas de escenas abiertas, deshacer/rehacer, controles de zoom (%, +/−), toggles de rejilla e imán (grid/snap), máscara, y botón de **Preview** (play) verde.
- **Sub-pestañas** por escena: `SCENE` | `EVENTS` (cambia entre los dos editores, como en GDevelop).

### 2. Scene Editor
- **Panel izquierdo**: lista de **Objects** (icono, nombre, buscador, botón "+ Add a new object") y **Object Groups**.
- **Canvas central**: fondo con rejilla, instancias arrastrables/seleccionables (marco de selección con handles), indicador de origen de la escena.
- **Panel derecho** (pestañas): **Properties** (posición X/Y, tamaño, ángulo, z-order, capa, variables de instancia), **Instances** (lista de instancias de la escena), **Layers** (lista de capas con visibilidad).
- Botones de la toolbar para mostrar/ocultar paneles; seleccionar una instancia rellena Properties; editar X/Y mueve la instancia en el canvas.
- **Diálogo "Add a new object"**: grid de tipos (Sprite, Tiled Sprite, Panel Sprite, Text, BBText, Bitmap Text, Particle Emitter, Shape Painter, Video, Tilemap…) con buscador, igual que el original.
- **Editor de objeto** (modal): para Sprite, lista de animaciones con frames, puntos y propiedades; campos editables.

### 3. Events Editor
- **Toolbar**: "Add a new empty event", añadir sub-evento, comentario, grupo, buscar en eventos, undo/redo.
- **Hoja de eventos**: filas con número de evento, columna de **condiciones** y columna de **acciones**, chips de objetos coloreados, sub-eventos indentados, eventos colapsables, comentarios en verde/amarillo.
- Enlaces "+ Add condition" / "+ Add action" que abren el **selector de instrucciones**: diálogo con buscador y lista categorizada de condiciones/acciones reales de GDevelop (Keyboard, Mouse, Scene, Sprite: position/angle/opacity…), con campos de parámetros tipados (object picker, expression, behavior, yes/no).
- Interacciones funcionales: añadir/editar/eliminar eventos, condiciones y acciones; mover; colapsar grupos.

## Datos
Proyecto de ejemplo en memoria (escena "Level 1", 3–4 objetos con instancias, capas Base/UI, y una hoja de eventos demo: "At the beginning of the scene", "Player is moving", colisiones, etc.). Todo el estado en React (context/reducer); sin persistencia ni backend.

## Diseño (fiel a GDevelop 5 Dark)
Tokens oficiales del tema (del repo de GDevelop):
- Ventana/canvas `#1D1D26`, toolbar/paneles `#25252E`, panel elevado `#32323B`, separadores `#494952`
- Primario púrpura `#7046EC`/`#4F28CD`, links `#DDD1FF`, hover `#C9B6FC`
- Texto `#FAFAFA` / secundario `#C5C5C9`, selección `#3E4452`
- Success `#45D9A1` (botón Preview), info `#6BAFFF`, warning `#FFBC57`, error `#FF8569`
- Tipografía compacta tipo sistema, iconografía Lucide equivalente a la de GDevelop, densidad alta (paneles estrechos, filas compactas)
- Modo oscuro único, tokens oklch en `src/styles.css`, componentes shadcn adaptados

## Técnico
- `src/routes/index.tsx`: reemplaza el placeholder con el editor completo (ruta `/`)
- `src/styles.css`: nuevos tokens semánticos del tema GDevelop (oklch)
- Componentes nuevos en `src/components/editor/`: `EditorShell`, `TopToolbar`, `ProjectManagerDrawer`, `SceneEditor` (`ObjectsPanel`, `SceneCanvas`, `PropertiesPanel`, `InstancesPanel`, `LayersPanel`), `EventsEditor` (`EventsToolbar`, `EventRow`, `InstructionItem`, `InstructionSelectorDialog`), `NewObjectDialog`, `ObjectEditorDialog`
- Estado: `src/lib/editor/` (tipos del modelo de proyecto + reducer/store en memoria)
- Head metadata propio en la ruta `/` (título/descripción del editor, og básicos); fuera og:image
- Sin servidor, sin Lovable Cloud: todo local

## Fuera de alcance (por ahora)
- Motor de juego real / preview jugable (el botón Preview es visual)
- Guardado de proyecto, exportación, recursos reales, extensiones instalables
- Conexión con tu backend Android (se puede añadir después vía API)
