# DIRECTIVA DE TRABAJO: ARENA.AI — INTEGRACION DEL SISTEMA DE ASSETS 2D (NEXUS ENGINE 2D)

## 1. CONTEXTO Y FILOSOFIA DE ARQUITECTURA
- **Motor:** Nexus Engine 2D (puerto 3000).
- **Comportamiento base:** Clon arquitectonico y funcional de la interfaz de objetos/sprites de GDevelop, adaptado a control web/movil responsivo.
- **Principio de no rotura:** Conservar integramente la estructura existente de entidades, animaciones (Idle, Animacion2, etc.), tiras de fotogramas (1, 2, 3, 4), gestion de puntos de origen/colision y tasa de refresco (Velocidad ms).

---

## 2. MODIFICACIONES EN LA UI DEL EDITOR DE SPRITES (Editar objeto — Sprite)

Junto a la barra de acciones de fotogramas, expandir la barra de herramientas incorporando 3 puntos de entrada claros:
[ Biblioteca Libre ]   [ Generar con IA ]   [ + Anadir fotograma ]

### A. Modulo 1: Generar con IA (Zero-Cost / Zero-Friction Pipeline)
1. Modal de Entrada:
   - Campo de texto para prompt descriptivo (personaje, item, efecto, tile o enemigo).
   - Selector de modo:
     - Estatico / Prop (1 frame limpio).
     - Secuencia / Animacion (tira de 4 a 8 frames horizontales).
   - Estilo predeterminado: Pixel Art / 2D Game Asset.
2. Pipeline de Inferencia:
   - Endpoint gratuito y sin registro (Pollinations Flux / Stable Diffusion API).
   - Inyeccion automatica de prompt engineering: aislamiento sobre fondo uniforme de alto contraste (#00FF00 o #FF00FF), vista lateral o cenital segun contexto, sin sombras difusas.
3. Procesamiento Client-side (Canvas HTML5):
   - Chroma Key automatico: Algoritmo que muestrea el pixel (0, 0) y sustituye los colores de fondo por transparencia (alpha = 0) con tolerancia configurable.
   - Grid Slicing: Division uniforme del ancho total entre el numero de frames solicitados.
4. Inyeccion en el Estado:
   - Mapeo directo de los blobs procesados a los fotogramas de la animacion activa en el motor.

### B. Modulo 2: Biblioteca Libre (Assets CC0 Integrados)
1. Integracion con catalogos CC0 / Dominio Publico:
   - Conector con el catalogo de assets gratuitos de Kenney.nl y OpenGameArt.
2. Explorador embebido:
   - Pestanas organizadas por categorias: Tilesets, Personajes, Items / Monedas, Efectos (VFX), UI.
   - Insercion en 1 toque directo al buffer de fotogramas del objeto.

### C. Modulo 3: Canvas de Edicion Rapida (Estilo Piskel / Max2D)
1. Modal de dibujo tactil sobre la celda seleccionada (soporte touchstart, touchmove, touchend).
2. Herramientas esenciales: Lapiz, Borrador, Relleno (Bucket), Selector de color y Papel cebolla (Onion Skin basico del fotograma anterior).

---

## 3. INTEGRIDAD Y FORMATO DE RESPUESTA DE ARENA.AI
- Respetar los archivos TypeScript/React existentes sin alterar el sistema de tipos de GDevelop.
- Asegurar que la persistencia en el serializador JSON del proyecto reconozca las nuevas URLs o Base64 sin perdidas.
