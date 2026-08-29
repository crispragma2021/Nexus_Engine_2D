# Nexus Engine

**Nexus Engine** es un **2D/3D Game Engine** orientado a crear, aprender y publicar juegos desde una experiencia visual. El editor combina escenas, objetos, capas, propiedades y eventos sin código con una base preparada para ampliar el runtime hacia experiencias 2D y 3D.

## Estado del proyecto

La versión `v0.1.0` ofrece una primera experiencia funcional del editor visual 2D, un runtime propio en TypeScript, persistencia local de proyectos y una interfaz adaptada a escritorio y móvil. La arquitectura mantiene separados el editor, el runtime y los catálogos para facilitar la evolución de las capacidades 3D.

## Características

- Editor de escenas y eventos inspirado en flujos de creación visual.
- Objetos, instancias, capas, grupos, comportamientos, variables y recursos.
- Runtime propio en TypeScript para previsualizar proyectos 2D.
- Guardado local en el dispositivo.
- Interfaz responsive con identidad visual Nexus Engine.
- PWA instalable con caché de shell y pantalla offline.
- Workflow para generar APK y App Bundle Android como Trusted Web Activity.

## Desarrollo local

Requisitos: Node.js 20 o superior y [Bun](https://bun.sh/).

```sh
bun install
bun run dev
```

Comandos de verificación:

```sh
bun run icons       # Regenera los iconos Nexus de forma determinista
bun run typecheck   # TypeScript sin emitir archivos
bun run lint        # ESLint
bun run build       # Build de Vite/TanStack Start
```

También se puede usar `npm install` y `npm run <comando>` cuando Bun no esté disponible.

## PWA y Android

El manifest PWA vive en [`public/manifest.webmanifest`](public/manifest.webmanifest) y el service worker en [`public/sw.js`](public/sw.js). El workflow [`.github/workflows/android-apk.yml`](.github/workflows/android-apk.yml) construye los artefactos Android al publicar un tag `v*`. Consulta [`docs/android-twa.md`](docs/android-twa.md) para configurar la keystore, los secretos de CI y Digital Asset Links.

## Variables de entorno

Copia `.env.example` a `.env` y completa únicamente los valores de tu entorno. `.env` está excluido de Git y nunca debe incluirse en un commit.

## Licencia

Nexus Engine se distribuye bajo la [licencia MIT](LICENSE).
