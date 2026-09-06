# Auditoría comparativa de UX: GDevelop oficial vs. Nexus Engine 2D

> Fase 1 — Auditoría y detección de faltantes.
> Se compara la experiencia de `newIDE/app` del repositorio oficial
> [4ian/GDevelop](https://github.com/4ian/GDevelop) contra el editor de
> **Nexus Engine 2D** (TanStack Start + Vite + React 19 + Tailwind CSS v4 + TypeScript).

## 1. Alcance de la comparación
Nexus Engine 2D implementa un equivalente visual del `MainFrame` de GDevelop: fila superior de pestañas, barra de acciones, workspace entre escena y hoja de eventos, y paneles laterales.

## 2. Sistema de navegación superior
- Botón regreso a Inicio: Se añade botón persistente "Volver al Inicio" en `ProjectTitlebar` hacia `/`.
- Selector Escena / Hoja de Eventos: Soportado vía `SceneSubTabs`.

## 3. Paneles de interfaz
- Barra de herramientas flotante: Se implementa `SceneViewToolbar` anclada sobre el canvas (Grid, Snap, Zoom, Reset, Fit).
