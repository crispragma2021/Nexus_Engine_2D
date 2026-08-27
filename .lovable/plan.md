# Panel de objetos redimensionable en móvil

## Objetivo
En móvil, el panel deslizante inferior (donde se crean y listan todos los objetos/personajes del juego) actualmente tiene una altura fija de `65vh`. El usuario quiere poder **arrastrar con el dedo** el borde superior del panel para **achicarlo o agrandarlo**, igual que en la app real de GDevelop.

## Cambios

### `src/components/editor/MobileBottomBar.tsx`
- Reemplazar la altura fija `h-[65vh]` por un estado `heightVh` (entero, por defecto 65).
- Añadir un **handle de arrastre** en el borde superior del `SheetContent`: una barra visible tipo "pill" (`w-10 h-1.5 rounded-full bg-separator`) con `cursor-grab` y `touch-action: none`.
- El handle usa `onPointerDown` + captura del puntero + `onPointerMove` para calcular la nueva altura en función del movimiento vertical del dedo:
  - Convertir el `clientY` del puntero a porcentaje de viewport: `heightVh = round((window.innerHeight - clientY) / window.innerHeight * 100)`.
  - Limitar entre **25vh** (mínimo, no tapa casi nada) y **90vh** (máximo, deja ver el canvas + toolbar).
  - Persistir `heightVh` en `localStorage` (`gdevelop:panel-height`) para recordar el tamaño entre sesiones.
- Aplicar la altura con `style={{ height: `${heightVh}vh` }}` y **desactivar la animación de slide** mientras se arrastra (clase condicional que quita `data-[state=open]:animate-in` cuando se está redimensionando, o usar `transition-none` durante el drag).
- Doble toque rápido en el handle = reset a 65vh (alternativa de reinicio).

### Accesibilidad / detalles táctiles
- El handle mide al menos 44px de alto (zona táctil) aunque visualmente sea fino, para que sea fácil agarrar con el dedo.
- `touch-action: none` en el handle para que el navegador no haga scroll/zoom del canvas mientras se arrastra.
- La barra inferior de navegación sigue visible y funcional; el redimensionamiento solo afecta al sheet abierto.

## Fuera de alcance
- No se cambia el comportamiento del sheet en desktop (donde los paneles son laterales fijos).
- No se añade redimensionamiento a otros sheets, solo al de objetos/propiedades que ya abre el `MobileBottomBar`.

## Verificación
- Playwright a viewport móvil (412x915): abrir el panel de Objects, simular arrastre del handle hacia arriba y hacia abajo, y verificar que la altura cambia entre 25vh y 90vh y se conserva tras cerrar/reabrir.
- Capturar screenshots del panel en tamaño mínimo, medio y máximo.
