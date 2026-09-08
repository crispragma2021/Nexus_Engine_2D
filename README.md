# Nexus Engine

**Nexus Engine** es un **motor de juegos 2D** orientado a crear, aprender y publicar juegos desde una experiencia visual. El editor combina escenas, objetos, capas, propiedades y eventos sin código sobre un runtime 2D propio.

## Estado del proyecto

La versión `v0.1.0` ofrece una primera experiencia funcional del editor visual 2D, un runtime propio en TypeScript, persistencia local de proyectos y una interfaz adaptada a escritorio y móvil. Nexus Engine está enfocado exclusivamente en juegos 2D.

## Características

- Editor de escenas y eventos inspirado en flujos de creación visual.
- Objetos, instancias, capas, grupos, comportamientos, variables y recursos.
- Automatización híbrida opcional: eventos visuales, sprites, máscaras y SFX generados siguen siendo editables con las herramientas manuales.
- Asistente **Nexus AI**: instrucción en lenguaje natural → plan de operaciones revisable, servido por el gateway [`/api/agent`](AGENT_ARCHITECTURE.md) sobre Gemini y con respaldo local determinista si no hay clave configurada.
- Importación tradicional de imágenes PNG/JPG/SVG y audio WAV/MP3/OGG.
- Runtime propio en TypeScript para previsualizar proyectos 2D.
- Guardado local en el dispositivo.
- Interfaz responsive con identidad visual Nexus Engine.
- PWA instalable con caché de shell y pantalla offline.
- Workflow para generar APK y App Bundle Android como Trusted Web Activity.

## Desarrollo local

Requisitos: Node.js 22.6 o superior y [Bun](https://bun.sh/).

```sh
bun install
bun run dev
```

Comandos de verificación:

```sh
bun run icons       # Regenera los iconos Nexus de forma determinista
bun run test        # Contratos del catálogo y del runtime 2D
bun run typecheck   # TypeScript sin emitir archivos
bun run lint        # ESLint
bun run build       # Build de Vite/TanStack Start
```

También se puede usar `npm install` y `npm run <comando>` cuando Bun no esté disponible.

## PWA y Android

El manifest PWA vive en [`public/manifest.webmanifest`](public/manifest.webmanifest) y el service worker en [`public/sw.js`](public/sw.js). El workflow [`.github/workflows/android-apk.yml`](.github/workflows/android-apk.yml) construye los artefactos Android al publicar un tag `v*`. Consulta [`docs/android-twa.md`](docs/android-twa.md) para configurar la keystore, los secretos de CI y Digital Asset Links.

## Variables de entorno

Copia `.env.example` a `.env` y completa únicamente los valores de tu entorno. `.env` está excluido de Git y nunca debe incluirse en un commit.

`GEMINI_API_KEY` es **solo del servidor** (gateway `/api/agent` del asistente Nexus AI): no uses variantes `VITE_*` para ella, porque se inyectarían en el bundle del cliente. En Vercel se configura como variable de entorno del proyecto. Sin esa clave el asistente responde `503` y el editor continúa con el planificador local.

## Licencia

Nexus Engine se distribuye bajo la [licencia MIT](LICENSE).
