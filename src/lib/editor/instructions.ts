// Instruction catalog for the events sheet.
//
// Names, sentences and parameter types follow GDevelop's own metadata (the same
// wording the app shows in Spanish). The Nexus runtime (`src/lib/runtime/engine.ts`)
// implements every `id` listed here; entries the runtime does not simulate yet are
// flagged `unsupported` so the UI can show GDevelop's warning styling instead of
// silently doing nothing.

export type ParamType =
  | "object"
  | "textObject"
  | "key"
  | "button"
  | "expression"
  | "number"
  | "string"
  | "yesno"
  | "operator"
  | "modop"
  | "layer"
  | "scene"
  | "varscene"
  | "varglobal"
  | "varobj"
  | "behavior"
  | "sound"
  | "animation"
  | "color"
  | "choices";

export interface InstructionParam {
  name: string;
  type: ParamType;
  label: string;
  defaultValue: string;
  /** for type === "choices" */
  choices?: string[];
}

export interface InstructionDef {
  id: string;
  kind: "condition" | "action";
  category: string;
  name: string;
  description: string;
  /** sentence template, {0}, {1}… replaced by the parameter chips */
  sentence: string;
  parameters: InstructionParam[];
  /** instruction needs a behavior on the object */
  behavior?: boolean;
  /** not simulated by the Nexus engine yet */
  unsupported?: boolean;
  helpPath?: string;
  /** used by the "special" event menu */
  isEvent?: boolean;
}

const P = (
  name: string,
  type: ParamType,
  label: string,
  defaultValue: string,
  extra: Partial<InstructionParam> = {},
): InstructionParam => ({ name, type, label, defaultValue, ...extra });

export const INSTRUCTION_CATEGORIES = [
  { id: "all", name: "Todos" },
  { id: "adv", name: "Avanzado" },
  { id: "scene", name: "Escena" },
  { id: "keyboard", name: "Teclado" },
  { id: "mouse", name: "Ratón y puntero" },
  { id: "sprite", name: "Sprite" },
  { id: "text", name: "Texto" },
  { id: "collision", name: "Colisiones" },
  { id: "variables", name: "Variables" },
  { id: "timers", name: "Temporizadores" },
  { id: "camera", name: "Cámara" },
  { id: "layers", name: "Capas" },
  { id: "audio", name: "Audio" },
  { id: "timescale", name: "Tiempo del juego" },
  { id: "platform", name: "Plataformas" },
  { id: "tween", name: "Interpolación" },
  { id: "flash", name: "Destello" },
  { id: "health", name: "Salud" },
  { id: "effects", name: "Efectos" },
] as const;

const OBJ = (value = "Jugador") => P("object", "object", "Objeto", value);

export const INSTRUCTIONS: InstructionDef[] = [
  /* ------------------------------------------------------------ Avanzado */
  {
    id: "BuiltinCommonInstructions::Once",
    kind: "condition",
    category: "adv",
    name: "Disparar una sola vez mientras se cumplen las condiciones",
    description:
      "Se ejecuta solo la primera vez que todas las condiciones del evento son verdaderas.",
    sentence: "Disparar una sola vez mientras se cumplen todas las condiciones",
    parameters: [P("force", "choices", "Modo", "true", { choices: ["true", "false"] })],
    helpPath: "/ideas-glossary/understanding-events-and-actions/",
  },
  {
    id: "BuiltinCommonInstructions::Else",
    kind: "condition",
    category: "adv",
    name: "Si no (else)",
    description: "Solo se ejecuta si el evento anterior no se ha ejecutado.",
    sentence: "Si no",
    parameters: [],
  },
  {
    id: "BuiltinCommonInstructions::CompareValues",
    kind: "condition",
    category: "adv",
    name: "Comparar dos valores",
    description: "Compara el resultado de dos expresiones.",
    sentence: "{0} {1} {2}",
    parameters: [
      P("left", "expression", "Expresión", "0"),
      P("operator", "operator", "Comparación", "="),
      P("right", "expression", "Expresión", "0"),
    ],
  },
  {
    id: "BuiltinCommonInstructions::StrEqual",
    kind: "condition",
    category: "adv",
    name: "Comparar dos cadenas de texto",
    description: "Compara dos textos, sin distinguir mayúsculas y minúsculas opcionalmente.",
    sentence: "{0} {1} {2}",
    parameters: [
      P("left", "string", "Texto", '""'),
      P("operator", "operator", "Comparación", "="),
      P("right", "string", "Texto", '"hola"'),
    ],
  },
  {
    id: "BuiltinCommonInstructions::Or",
    kind: "condition",
    category: "adv",
    name: "Al menos una de las condiciones (O)",
    description: "Verdadero si al menos una de las sub-condiciones se cumple.",
    sentence: "Al menos una de las condiciones (O)",
    parameters: [],
    unsupported: true,
  },
  {
    id: "BuiltinCommonInstructions::And",
    kind: "condition",
    category: "adv",
    name: "Todas las condiciones (Y)",
    description: "Verdadero si todas las sub-condiciones se cumplen.",
    sentence: "Todas las condiciones (Y)",
    parameters: [],
    unsupported: true,
  },

  /* ------------------------------------------------------------- Escena */
  {
    id: "SceneJustBegins",
    kind: "condition",
    category: "scene",
    name: "Al principio de la escena",
    description: "Verdadero solo una vez, cuando la escena empieza.",
    sentence: "Al principio de la escena",
    parameters: [],
  },
  {
    id: "ChangeScene",
    kind: "action",
    category: "scene",
    name: "Cambiar de escena",
    description: "Detiene la escena actual y abre otra escena del proyecto.",
    sentence: "Ir a la escena {0}",
    parameters: [P("scene", "scene", "Escena", "Level 1")],
  },
  {
    id: "EndScene",
    kind: "action",
    category: "scene",
    name: "Salir de la escena",
    description: "Vuelve a la escena anterior o termina la partida.",
    sentence: "Salir de la escena",
    parameters: [],
  },
  {
    id: "PauseGame",
    kind: "action",
    category: "scene",
    name: "Pausar el juego",
    description: "Detiene la simulación hasta que se reanude.",
    sentence: "Pausar el juego",
    parameters: [],
  },
  {
    id: "SetTimeScale",
    kind: "action",
    category: "timescale",
    name: "Modificar la velocidad del tiempo",
    description: "Cambia la velocidad a la que avanza el tiempo de la escena.",
    sentence: "Cambiar la velocidad del tiempo: {1} {0}",
    parameters: [
      P("timeScale", "expression", "Nueva velocidad del tiempo", "1"),
      P("op", "modop", "Modificación", "set to"),
    ],
  },

  /* ------------------------------------------------------------- Teclado */
  {
    id: "KeyPressed",
    kind: "condition",
    category: "keyboard",
    name: "Tecla presionada",
    description: "Verdadero mientras la tecla indicada está pulsada.",
    sentence: "La tecla {0} está presionada",
    parameters: [P("key", "key", "Tecla", "Right")],
    helpPath: "/misc/getting-started/first-events/",
  },
  {
    id: "KeyReleased",
    kind: "condition",
    category: "keyboard",
    name: "Tecla soltada",
    description: "Verdadero el frame en que la tecla indicada se suelta.",
    sentence: "La tecla {0} se suelta",
    parameters: [P("key", "key", "Tecla", "Space")],
  },
  {
    id: "KeyNotPressed",
    kind: "condition",
    category: "keyboard",
    name: "Tecla no presionada",
    description: "Verdadero mientras la tecla indicada no está pulsada.",
    sentence: "La tecla {0} no está presionada",
    parameters: [P("key", "key", "Tecla", "Shift")],
  },

  /* ------------------------------------------------------- Ratón y puntero */
  {
    id: "SourisBouton",
    kind: "condition",
    category: "mouse",
    name: "Botón del ratón presionado o toque",
    description: "Hay un toque o el botón del ratón está presionado.",
    sentence: "Hay un toque o el botón {0} del ratón está presionado",
    parameters: [P("button", "choices", "Botón", "Left", { choices: ["Left", "Right", "Middle"] })],
  },
  {
    id: "SourisSurObjet",
    kind: "condition",
    category: "mouse",
    name: "Puntero sobre el objeto",
    description: "Verdadero cuando el puntero está encima del objeto.",
    sentence: "El cursor del ratón está sobre {0}",
    parameters: [OBJ(), P("considerAsTrigger", "yesno", "Considerado como disparador", "yes")],
  },

  /* ------------------------------------------------------------ Colisiones */
  {
    id: "Collision",
    kind: "condition",
    category: "collision",
    name: "Están en colisión",
    description: "Verdadero cuando dos objetos se solapan (según su máscara de colisión).",
    sentence: "{0} está en colisión con {1}",
    parameters: [
      OBJ(),
      P("object2", "object", "Objeto", "Moneda"),
      P("ignoreTouchingEdges", "yesno", "Ignorar bordes que se tocan", "no"),
    ],
  },
  {
    id: "Separation",
    kind: "condition",
    category: "collision",
    name: "Separados (no en colisión)",
    description: "Verdadero cuando dos objetos no se tocan.",
    sentence: "{0} está separado de {1}",
    parameters: [
      OBJ(),
      P("object2", "object", "Objeto", "Slime"),
      P("ignoreTouchingEdges", "yesno", "Ignorar bordes que se tocan", "no"),
    ],
  },

  /* -------------------------------------------------------------- Sprite */
  {
    id: "Create",
    kind: "action",
    category: "sprite",
    name: "Crear un objeto",
    description: "Crea una nueva instancia del objeto en la posición indicada.",
    sentence: "Crear objeto {0} en la posición {1};{2} (capa: {3})",
    parameters: [
      OBJ("Moneda"),
      P("x", "expression", "Posición en X del objeto", "Random(800)"),
      P("y", "expression", "Posición en Y del objeto", "0"),
      P("layer", "layer", "Capa", "Base layer"),
    ],
  },
  {
    id: "Delete",
    kind: "action",
    category: "sprite",
    name: "Suprimir un objeto",
    description: "Elimina las instancias del objeto seleccionadas por las condiciones.",
    sentence: "Eliminar {0}",
    parameters: [OBJ("Moneda")],
  },
  {
    id: "PosObj",
    kind: "action",
    category: "sprite",
    name: "Cambiar la posición",
    description: "Cambia la posición del objeto usando su origen.",
    sentence: "Cambiar la posición de {0}: {1};{2}",
    parameters: [
      OBJ(),
      P("x", "expression", "Nueva posición en X", "0"),
      P("y", "expression", "Nueva posición en Y", "0"),
      P("useCenterPosition", "yesno", "Usar la posición del centro", "no"),
    ],
  },
  {
    id: "ChangeX",
    kind: "action",
    category: "sprite",
    name: "Cambiar la coordenada X",
    description: "Modifica la posición horizontal del objeto.",
    sentence: "Cambiar la posición en X de {0}: {1} {2}",
    parameters: [
      OBJ(),
      P("op", "modop", "Modificación", "add"),
      P("value", "expression", "Valor", "5"),
    ],
  },
  {
    id: "ChangeY",
    kind: "action",
    category: "sprite",
    name: "Cambiar la coordenada Y",
    description: "Modifica la posición vertical del objeto.",
    sentence: "Cambiar la posición en Y de {0}: {1} {2}",
    parameters: [
      OBJ(),
      P("op", "modop", "Modificación", "add"),
      P("value", "expression", "Valor", "5"),
    ],
  },
  {
    id: "SetAngle",
    kind: "action",
    category: "sprite",
    name: "Cambiar el ángulo",
    description: "Rota el objeto (o cambia su ángulo de forma relativa).",
    sentence: "Cambiar el ángulo de {0}: {1} {2}",
    parameters: [
      OBJ(),
      P("op", "modop", "Modificación", "set to"),
      P("value", "expression", "Ángulo", "0"),
    ],
  },
  {
    id: "ChangeWidth",
    kind: "action",
    category: "sprite",
    name: "Cambiar el ancho",
    description: "Modifica el ancho del objeto (requiere tamaño personalizado).",
    sentence: "Cambiar el ancho de {0}: {1} {2}",
    parameters: [
      OBJ(),
      P("op", "modop", "Modificación", "set to"),
      P("value", "expression", "Ancho", "64"),
    ],
  },
  {
    id: "ChangeHeight",
    kind: "action",
    category: "sprite",
    name: "Cambiar la altura",
    description: "Modifica la altura del objeto (requiere tamaño personalizado).",
    sentence: "Cambiar la altura de {0}: {1} {2}",
    parameters: [
      OBJ(),
      P("op", "modop", "Modificación", "set to"),
      P("value", "expression", "Altura", "64"),
    ],
  },
  {
    id: "SetOpacity",
    kind: "action",
    category: "sprite",
    name: "Cambiar la opacidad",
    description: "0 es totalmente transparente, 255 es opaco (por defecto).",
    sentence: "Cambiar la opacidad de {0}: {1} {2}",
    parameters: [
      OBJ(),
      P("op", "modop", "Modificación", "set to"),
      P("value", "expression", "Opacidad", "255"),
    ],
  },
  {
    id: "Cache",
    kind: "action",
    category: "sprite",
    name: "Ocultar el objeto",
    description: "Deja de dibujar el objeto en pantalla.",
    sentence: "Ocultar {0}",
    parameters: [OBJ("Moneda")],
  },
  {
    id: "Montre",
    kind: "action",
    category: "sprite",
    name: "Mostrar el objeto",
    description: "Vuelve a dibujar el objeto en pantalla.",
    sentence: "Mostrar {0}",
    parameters: [OBJ("Moneda")],
  },
  {
    id: "ChangeZOrder",
    kind: "action",
    category: "sprite",
    name: "Cambiar el plano (Z)",
    description: "Cambia el orden de dibujado del objeto.",
    sentence: "Cambiar el plano (Z) de {0}: {1} {2}",
    parameters: [
      OBJ("Moneda"),
      P("op", "modop", "Modificación", "set to"),
      P("value", "expression", "Plano (Z)", "2"),
    ],
  },
  {
    id: "FlipX",
    kind: "action",
    category: "sprite",
    name: "Voltear horizontalmente",
    description: "Espeja la imagen del objeto a izquierda/derecha.",
    sentence: "Voltear {0} horizontalmente: {1}",
    parameters: [OBJ(), P("flip", "yesno", "Volteado", "yes")],
  },
  {
    id: "FlipY",
    kind: "action",
    category: "sprite",
    name: "Voltear verticalmente",
    description: "Espeja la imagen del objeto arriba/abajo.",
    sentence: "Voltear {0} verticalmente: {1}",
    parameters: [OBJ(), P("flip", "yesno", "Volteado", "yes")],
  },
  {
    id: "AddForceAngle",
    kind: "action",
    category: "sprite",
    name: "Añadir una fuerza (ángulo)",
    description: "Empuja el objeto en una dirección, con amortiguación por defecto.",
    sentence: "Añadir a {0} una fuerza, ángulo: {1} grados y velocidad: {2} píxeles/segundo",
    parameters: [
      OBJ("Slime"),
      P("angle", "expression", "Dirección del empuje (grados)", "180"),
      P("speed", "expression", "Velocidad", "80"),
      P("Damping", "yesno", "Aplicar amortiguación", "yes"),
      P("action", "choices", "Acción", "Or", { choices: ["Or", "Séparer les forces"] }),
    ],
  },
  {
    id: "AddForceXY",
    kind: "action",
    category: "sprite",
    name: "Añadir una fuerza (X/Y)",
    description: "Empuja el objeto con una fuerza en X y en Y.",
    sentence: "Añadir a {0} una fuerza de x: {1} e y: {2}",
    parameters: [
      OBJ(),
      P("x", "expression", "Fuerza en X", "150"),
      P("y", "expression", "Fuerza en Y", "0"),
      P("Damping", "yesno", "Aplicar amortiguación", "yes"),
    ],
  },
  {
    id: "AddForceToward",
    kind: "action",
    category: "sprite",
    name: "Añadir una fuerza hacia un objeto",
    description: "Empuja el objeto en dirección a otro objeto.",
    sentence: "Añadir a {0} una fuerza hacia {1}, velocidad: {2} píxeles/segundo",
    parameters: [
      OBJ("Slime"),
      P("target", "object", "Hacia el objeto", "Jugador"),
      P("speed", "expression", "Velocidad", "60"),
    ],
  },
  {
    id: "ChangeAnimation",
    kind: "action",
    category: "sprite",
    name: "Cambiar la animación (número)",
    description: "Cambia el número de animación actual del Sprite.",
    sentence: "Cambiar la animación de {0}: {1} {2}",
    parameters: [
      OBJ(),
      P("op", "modop", "Modificación", "set to"),
      P("value", "expression", "Número de animación", "1"),
    ],
  },
  {
    id: "ChangeAnimationName",
    kind: "action",
    category: "sprite",
    name: "Cambiar la animación (nombre)",
    description: "Cambia la animación actual del Sprite usando su nombre.",
    sentence: "Configurar animación de {0} hacia {1}",
    parameters: [OBJ(), P("animation", "animation", "Nombre de la animación", '"reposo"')],
  },
  {
    id: "SetSpriteSpeed",
    kind: "action",
    category: "sprite",
    name: "Cambiar la velocidad de la animación",
    description: "Multiplica la velocidad de reproducción de la animación.",
    sentence: "Cambiar la velocidad de la animación de {0} a {1}%",
    parameters: [OBJ(), P("speed", "expression", "Velocidad (%)", "100")],
  },
  {
    id: "PosX",
    kind: "condition",
    category: "sprite",
    name: "Comparar la posición en X",
    description: "Compara la coordenada X del objeto.",
    sentence: "La posición en X de {0} {1} {2}",
    parameters: [
      OBJ(),
      P("operator", "operator", "Comparación", ">"),
      P("value", "expression", "Posición en X", "600"),
    ],
  },
  {
    id: "PosY",
    kind: "condition",
    category: "sprite",
    name: "Comparar la posición en Y",
    description: "Compara la coordenada Y del objeto.",
    sentence: "La posición en Y de {0} {1} {2}",
    parameters: [
      OBJ(),
      P("operator", "operator", "Comparación", "<"),
      P("value", "expression", "Posición en Y", "100"),
    ],
  },
  {
    id: "Angle",
    kind: "condition",
    category: "sprite",
    name: "Comparar el ángulo",
    description: "Compara el ángulo del objeto.",
    sentence: "El ángulo de {0} {1} {2}",
    parameters: [
      OBJ(),
      P("operator", "operator", "Comparación", ">"),
      P("value", "expression", "Ángulo", "45"),
    ],
  },
  {
    id: "Visible",
    kind: "condition",
    category: "sprite",
    name: "El objeto está visible",
    description: "Verdadero cuando el objeto no está oculto.",
    sentence: "{0} está visible",
    parameters: [OBJ("Moneda")],
  },
  {
    id: "Opacity",
    kind: "condition",
    category: "sprite",
    name: "Comparar la opacidad",
    description: "Compara la opacidad (0-255) del objeto.",
    sentence: "La opacidad de {0} {1} {2}",
    parameters: [
      OBJ(),
      P("operator", "operator", "Comparación", "<"),
      P("value", "expression", "Opacidad", "128"),
    ],
  },
  {
    id: "AnimationNameIs",
    kind: "condition",
    category: "sprite",
    name: "La animación actual es",
    description: "Compara el nombre de la animación que se está reproduciendo.",
    sentence: "El nombre de la animación de {0} es {1}",
    parameters: [OBJ(), P("animation", "animation", "Nombre de la animación", '"correr"')],
  },

  /* --------------------------------------------------------------- Texto */
  {
    id: "TXT::SetText",
    kind: "action",
    category: "text",
    name: "Cambiar el texto",
    description: "Cambia el texto mostrado por el objeto de texto.",
    sentence: "Cambiar el texto de {0} a {1}",
    parameters: [
      P("object", "textObject", "Objeto de texto", "TextoPuntos"),
      P("text", "string", "Nuevo texto", '"Puntos: 0"'),
    ],
  },
  {
    id: "TXT::SetFontSize",
    kind: "action",
    category: "text",
    name: "Cambiar el tamaño del texto",
    description: "Cambia el tamaño de fuente del objeto de texto.",
    sentence: "Cambiar el tamaño de la fuente de {0} a {1}",
    parameters: [
      P("object", "textObject", "Objeto de texto", "TextoPuntos"),
      P("size", "expression", "Tamaño", "24"),
    ],
  },
  {
    id: "TXT::SetColor",
    kind: "action",
    category: "text",
    name: "Cambiar el color del texto",
    description: "Cambia el color del texto (R;G;B).",
    sentence: "Cambiar el color de la fuente de {0}: {1};{2};{3}",
    parameters: [
      P("object", "textObject", "Objeto de texto", "TextoPuntos"),
      P("r", "expression", "Rojo", "250"),
      P("g", "expression", "Verde", "250"),
      P("b", "expression", "Azul", "250"),
    ],
  },

  /* ------------------------------------------------------------- Variables */
  {
    id: "ModVarScene",
    kind: "action",
    category: "variables",
    name: "Cambiar el valor de una variable de escena",
    description: "Modifica una variable numérica de la escena.",
    sentence: "Cambiar la variable de escena {0}: {1} {2}",
    parameters: [
      P("variable", "varscene", "Variable", "Puntos"),
      P("op", "modop", "Modificación", "add"),
      P("value", "expression", "Valor", "1"),
    ],
  },
  {
    id: "ModVarSceneTxt",
    kind: "action",
    category: "variables",
    name: "Modificar el texto de una variable de escena",
    description: "Modifica una variable de texto de la escena.",
    sentence: "Modificar el texto de la variable de escena {0}: {1} {2}",
    parameters: [
      P("variable", "varscene", "Variable", "mensaje"),
      P("op", "choices", "Modificación", "set to", { choices: ["set to", "add"] }),
      P("value", "string", "Valor", '""'),
    ],
  },
  {
    id: "ToggleSceneVar",
    kind: "action",
    category: "variables",
    name: "Activar o desactivar una variable booleana de escena",
    description: "Cambia el valor verdadero/falso de una variable de escena.",
    sentence: "Pasar la variable de escena {0} a {1}",
    parameters: [
      P("variable", "varscene", "Variable", "empieza"),
      P("value", "yesno", "Nuevo valor", "yes"),
    ],
  },
  {
    id: "ModVarGlobal",
    kind: "action",
    category: "variables",
    name: "Cambiar el valor de una variable global",
    description: "Modifica una variable global (persiste entre escenas).",
    sentence: "Cambiar la variable global {0}: {1} {2}",
    parameters: [
      P("variable", "varglobal", "Variable", "MejorPuntuacion"),
      P("op", "modop", "Modificación", "add"),
      P("value", "expression", "Valor", "1"),
    ],
  },
  {
    id: "ModVarObjet",
    kind: "action",
    category: "variables",
    name: "Cambiar el valor de una variable de objeto",
    description: "Modifica la variable por defecto de un objeto.",
    sentence: "Cambiar la variable de objeto de {1}: {2} {0}: {3} {4}",
    parameters: [
      P("value", "expression", "Valor", "1"),
      OBJ(),
      P("variable", "varobj", "Variable", "Vidas"),
      P("op", "modop", "Modificación", "add"),
      P("zero", "number", "", "0"),
    ],
  },
  {
    id: "ModVarInstance",
    kind: "action",
    category: "variables",
    name: "Cambiar el valor de una variable de instancia",
    description: "Modifica una variable de la instancia seleccionada.",
    sentence: "Cambiar la variable de instancia de {1}: {2} {0}: {3} {4}",
    parameters: [
      P("value", "expression", "Valor", "1"),
      OBJ(),
      P("variable", "varobj", "Variable", "velocidad"),
      P("op", "modop", "Modificación", "add"),
      P("zero", "number", "", "0"),
    ],
  },
  {
    id: "CompareSceneVar",
    kind: "condition",
    category: "variables",
    name: "Comparar la variable de escena",
    description: "Compara el valor numérico de una variable de escena.",
    sentence: "La variable de escena {0} {1} {2}",
    parameters: [
      P("variable", "varscene", "Variable", "Puntos"),
      P("operator", "operator", "Comparación", "="),
      P("value", "expression", "Valor", "10"),
    ],
  },
  {
    id: "CompareGlobalVar",
    kind: "condition",
    category: "variables",
    name: "Comparar la variable global",
    description: "Compara el valor numérico de una variable global.",
    sentence: "La variable global {0} {1} {2}",
    parameters: [
      P("variable", "varglobal", "Variable", "MejorPuntuacion"),
      P("operator", "operator", "Comparación", ">="),
      P("value", "expression", "Valor", "100"),
    ],
  },
  {
    id: "CompareSceneVarString",
    kind: "condition",
    category: "variables",
    name: "Comparar el texto de una variable de escena",
    description: "Compara el contenido de texto de una variable de escena.",
    sentence: 'El texto de la variable de escena {0} es {1}: "{2}"',
    parameters: [
      P("variable", "varscene", "Variable", "mensaje"),
      P("operator", "operator", "Comparación", "="),
      P("value", "string", "Valor", '"¡Buena suerte!"'),
    ],
  },

  /* -------------------------------------------------------- Temporizadores */
  {
    id: "ResetTimer",
    kind: "action",
    category: "timers",
    name: "Reiniciar (o empezar) un temporizador de escena",
    description: "Vuelve a cero el temporizador indicado.",
    sentence: "Reiniciar el temporizador de escena {0}",
    parameters: [P("timer", "string", "Temporizador", "spawn")],
  },
  {
    id: "PauseTimer",
    kind: "action",
    category: "timers",
    name: "Pausar un temporizador de escena",
    description: "Congela el temporizador hasta que se reactive.",
    sentence: "Pausar el temporizador de escena {0}",
    parameters: [P("timer", "string", "Temporizador", "spawn")],
  },
  {
    id: "UnpauseTimer",
    kind: "action",
    category: "timers",
    name: "Reanudar un temporizador de escena",
    description: "Continúa un temporizador que estaba pausado.",
    sentence: "Reanudar el temporizador de escena {0}",
    parameters: [P("timer", "string", "Temporizador", "spawn")],
  },
  {
    id: "ValueOfTimer",
    kind: "condition",
    category: "timers",
    name: "Valor del temporizador de la escena",
    description: "Compara el tiempo transcurrido desde que se reinició el temporizador.",
    sentence: "El valor del temporizador de escena {0} {1} {2}",
    parameters: [
      P("timer", "string", "Temporizador", "spawn"),
      P("operator", "operator", "Comparación", ">"),
      P("seconds", "expression", "Tiempo (segundos)", "2"),
    ],
  },
  {
    id: "TimerRepeated",
    kind: "condition",
    category: "timers",
    name: "Repetir cada X segundos usando un temporizador",
    description: "Verdadero cada X segundos, usando un temporizador de escena.",
    sentence: "Repetir cada {1} segundos usando el temporizador {0}",
    parameters: [
      P("timer", "string", "Nombre del temporizador utilizado para el bucle", "slime_move"),
      P("seconds", "expression", "Intervalo (segundos)", "2"),
    ],
  },

  /* --------------------------------------------------------------- Cámara */
  {
    id: "CentreCamera",
    kind: "action",
    category: "camera",
    name: "Centrar la cámara en un objeto",
    description: "Mueve la cámara para que el objeto quede en el centro.",
    sentence: "Centrar la cámara en {0} (capa: {1})",
    parameters: [OBJ(), P("layer", "layer", "Capa", "Base layer")],
  },
  {
    id: "SetCameraZoom",
    kind: "action",
    category: "camera",
    name: "Cambiar el zoom de la cámara",
    description: "Ajusta el zoom de la cámara de una capa.",
    sentence: "Cambiar el zoom de la cámara a: {0} (capa: {1})",
    parameters: [
      P("zoom", "expression", "Nuevo zoom de la cámara", "2"),
      P("layer", "layer", "Capa", "Base layer"),
    ],
  },

  /* ---------------------------------------------------------------- Capas */
  {
    id: "HideLayer",
    kind: "action",
    category: "layers",
    name: "Ocultar una capa",
    description: "Deja de dibujar todos los objetos de la capa.",
    sentence: "Ocultar la capa {0}",
    parameters: [P("layer", "layer", "Capa", "Interfaz")],
  },
  {
    id: "ShowLayer",
    kind: "action",
    category: "layers",
    name: "Mostrar una capa",
    description: "Vuelve a dibujar la capa.",
    sentence: "Mostrar la capa {0}",
    parameters: [P("layer", "layer", "Capa", "Interfaz")],
  },
  {
    id: "SetLayerOpacity",
    kind: "action",
    category: "layers",
    name: "Cambiar la opacidad de la capa",
    description: "0 es transparente, 255 es opaco.",
    sentence: "Cambiar la opacidad de la capa {0}: {1} {2}",
    parameters: [
      P("layer", "layer", "Capa", "Interfaz"),
      P("op", "modop", "Modificación", "set to"),
      P("value", "expression", "Opacidad", "255"),
    ],
  },

  /* ---------------------------------------------------------------- Audio */
  {
    id: "PlaySound",
    kind: "action",
    category: "audio",
    name: "Reproducir un sonido",
    description: "Reproduce un archivo de audio del proyecto.",
    sentence: "Reproducir el sonido {0}, vol.: {1}, bucle: {2}",
    parameters: [
      P("file", "sound", "Recurso de audio", "coin.wav"),
      P("volume", "expression", "Volumen", "100"),
      P("loop", "yesno", "Bucle", "no"),
    ],
  },
  {
    id: "PlaySoundAtPosition",
    kind: "action",
    category: "audio",
    name: "Reproducir un sonido en una posición",
    description: "Reproduce un sonido con pan y volumen según la posición en pantalla.",
    sentence: "Reproducir el sonido {0} en la posición {1};{2}, vol.: {3}, bucle: {4}, ajuste: {5}",
    parameters: [
      P("file", "sound", "Recurso de audio", "coin.wav"),
      P("x", "expression", "X", "Jugador.X()"),
      P("y", "expression", "Y", "Jugador.Y()"),
      P("volume", "expression", "Volumen", "100"),
      P("loop", "yesno", "Bucle", "no"),
      P("adjustation", "expression", "Ajuste estéreo", "60"),
    ],
  },
  {
    id: "StopSound",
    kind: "action",
    category: "audio",
    name: "Parar la reproducción de un canal de sonido",
    description: "Detiene el audio que se está reproduciendo en el canal indicado.",
    sentence: "Parar el canal de sonido {0}",
    parameters: [P("channel", "number", "Canal", "0")],
  },

  /* ----------------------------------------------------------- Plataformas */
  {
    id: "PlatformBehavior::IsOnFloor",
    kind: "condition",
    category: "platform",
    name: "Está sobre el suelo",
    description: "Verdadero cuando el personaje está apoyado en una plataforma.",
    sentence: "{0} está sobre el suelo",
    parameters: [OBJ(), P("behavior", "behavior", "Comportamiento", "PlataformaCharacter")],
    behavior: true,
  },
  {
    id: "PlatformBehavior::IsJumping",
    kind: "condition",
    category: "platform",
    name: "Está saltando",
    description: "Verdadero mientras el personaje sube tras un salto.",
    sentence: "{0} está saltando",
    parameters: [OBJ(), P("behavior", "behavior", "Comportamiento", "PlataformaCharacter")],
    behavior: true,
  },
  {
    id: "PlatformBehavior::IsFalling",
    kind: "condition",
    category: "platform",
    name: "Está cayendo",
    description: "Verdadero cuando el personaje cae libremente.",
    sentence: "{0} está cayendo",
    parameters: [OBJ(), P("behavior", "behavior", "Comportamiento", "PlataformaCharacter")],
    behavior: true,
  },
  {
    id: "PlatformBehavior::SimulateControl",
    kind: "action",
    category: "platform",
    name: "Simular control",
    description: "Simula que el personaje pulsa una tecla de movimiento.",
    sentence: "Simular control {1} para {0} (mantener pulsado: {3})",
    parameters: [
      OBJ(),
      P("behavior", "behavior", "Comportamiento", "PlataformaCharacter"),
      P("key", "choices", "Control", "Right", {
        choices: ["Left", "Right", "Up", "Down", "Jump"],
      }),
      P("pressed", "yesno", "Presionado", "yes"),
    ],
    behavior: true,
  },
  {
    id: "PlatformBehavior::SimulateJumpKey",
    kind: "action",
    category: "platform",
    name: "Simular tecla de salto",
    description: "Hace saltar al personaje como si pulsara la tecla de salto.",
    sentence: "Simular tecla de salto para {0}",
    parameters: [OBJ(), P("behavior", "behavior", "Comportamiento", "PlataformaCharacter")],
    behavior: true,
  },
  {
    id: "PlatformBehavior::IgnoreControl",
    kind: "action",
    category: "platform",
    name: "Ignorar controles",
    description: "El personaje deja de responder a los controles simulados.",
    sentence: "Ignorar controles {0} (ignorar: {2})",
    parameters: [
      OBJ(),
      P("behavior", "behavior", "Comportamiento", "PlataformaCharacter"),
      P("ignore", "yesno", "Ignorar", "yes"),
    ],
    behavior: true,
  },
  {
    id: "PlatformBehavior::SetGravity",
    kind: "action",
    category: "platform",
    name: "Cambiar la gravedad",
    description: "Modifica la gravedad del personaje de plataformas.",
    sentence: "Cambiar la gravedad de {0} a {2} (comportamiento: {1})",
    parameters: [
      OBJ(),
      P("behavior", "behavior", "Comportamiento", "PlataformaCharacter"),
      P("gravity", "expression", "Gravedad", "1800"),
    ],
    behavior: true,
  },

  /* --------------------------------------------------------- Interpolación */
  {
    id: "Tween::CreateTween",
    kind: "action",
    category: "tween",
    name: "Añadir una interpolación (tween)",
    description: "Anima una posición, un tamaño o la opacidad durante una duración.",
    sentence:
      "Añadir una interpolación de tipo: {4}, para {0}, con el nombre: {1}, desde {2} hasta {3}, durante {5} segundos",
    parameters: [
      OBJ(),
      P("name", "string", "Nombre de la interpolación", "rebotar"),
      P("from", "expression", "Valor inicial", "0"),
      P("to", "expression", "Valor final", "100"),
      P("kind", "choices", "Tipo", "alpha", {
        choices: ["x", "y", "angle", "alpha", "size", "color"],
      }),
      P("duration", "expression", "Duración (segundos)", "0.5"),
      P("easing", "choices", "Suavidad", "easeInOutQuad", {
        choices: [
          "linear",
          "easeInQuad",
          "easeOutQuad",
          "easeInOutQuad",
          "easeInOutElastic",
          "linearStops",
        ],
      }),
    ],
  },
  {
    id: "Tween::RemoveTween",
    kind: "action",
    category: "tween",
    name: "Eliminar una interpolación",
    description: "Detiene y borra la interpolación indicada.",
    sentence: "Quitar interpolación de tipo: {2} para {0}, con el nombre: {1}",
    parameters: [
      OBJ(),
      P("name", "string", "Nombre de la interpolación", "rebotar"),
      P("kind", "choices", "Tipo", "alpha", {
        choices: ["x", "y", "angle", "alpha", "size", "color"],
      }),
    ],
  },
  {
    id: "Tween::TweenFinished",
    kind: "condition",
    category: "tween",
    name: "La interpolación ha terminado",
    description: "Verdadero cuando la interpolación llega a su valor final.",
    sentence: "Interpolación terminada de tipo: {2} para {0}, con el nombre: {1}",
    parameters: [
      OBJ(),
      P("name", "string", "Nombre de la interpolación", "rebotar"),
      P("kind", "choices", "Tipo", "alpha", {
        choices: ["x", "y", "angle", "alpha", "size", "color"],
      }),
    ],
  },

  /* --------------------------------------------------------------- Destello */
  {
    id: "Flash::Flash",
    kind: "action",
    category: "flash",
    name: "Hacer parpadear el objeto",
    description: "El objeto parpadea durante la duración configurada.",
    sentence: "Hacer parpadear {0} con el comportamiento: {1}",
    parameters: [OBJ("Slime"), P("behavior", "behavior", "Comportamiento", "Destello")],
    behavior: true,
  },
  {
    id: "Flash::StopFlash",
    kind: "action",
    category: "flash",
    name: "Parar el parpadeo del objeto",
    description: "Detiene el parpadeo inmediatamente.",
    sentence: "Parar el parpadeo de {0} con el comportamiento: {1}",
    parameters: [OBJ("Slime"), P("behavior", "behavior", "Comportamiento", "Destello")],
    behavior: true,
  },
  {
    id: "Flash::IsFlashEnabled",
    kind: "condition",
    category: "flash",
    name: "El objeto está parpadeando",
    description: "Verdadero mientras el objeto parpadea.",
    sentence: "{0} parpadea con el comportamiento: {1}",
    parameters: [OBJ("Slime"), P("behavior", "behavior", "Comportamiento", "Destello")],
    behavior: true,
  },

  /* ------------------------------------------------------------------ Salud */
  {
    id: "Health::RemoveHealth",
    kind: "action",
    category: "health",
    name: "Quitar salud",
    description: "Reduce los puntos de salud del objeto.",
    sentence: "Quitar {1} de salud a {0}, comportamiento: {2}",
    parameters: [
      OBJ("Slime"),
      P("health", "expression", "Salud a quitar", "1"),
      P("behavior", "behavior", "Comportamiento", "Salud"),
    ],
    behavior: true,
  },
  {
    id: "Health::AddHealth",
    kind: "action",
    category: "health",
    name: "Añadir salud",
    description: "Suma puntos de salud (con tope en la salud máxima).",
    sentence: "Añadir {1} de salud a {0}, comportamiento: {2}",
    parameters: [
      OBJ("Jugador"),
      P("health", "expression", "Salud a añadir", "10"),
      P("behavior", "behavior", "Comportamiento", "Salud"),
    ],
    behavior: true,
  },
  {
    id: "Health::SetHealth",
    kind: "action",
    category: "health",
    name: "Establecer la salud",
    description: "Pone la salud al valor indicado.",
    sentence: "Establecer la salud de {0} a {1} para el comportamiento {2}",
    parameters: [
      OBJ("Jugador"),
      P("health", "expression", "Valor", "100"),
      P("behavior", "behavior", "Comportamiento", "Salud"),
    ],
    behavior: true,
  },
  {
    id: "Health::IsDead",
    kind: "condition",
    category: "health",
    name: "La salud es 0",
    description: "Verdadero cuando la salud del objeto ha llegado a cero.",
    sentence: "{0} está muerto con el comportamiento: {1}",
    parameters: [OBJ("Slime"), P("behavior", "behavior", "Comportamiento", "Salud")],
    behavior: true,
  },
  {
    id: "Health::CompareHealth",
    kind: "condition",
    category: "health",
    name: "Comparar la salud",
    description: "Compara los puntos de salud del objeto.",
    sentence: "{0} tiene la salud {1} {2} con el comportamiento: {3}",
    parameters: [
      OBJ("Slime"),
      P("operator", "operator", "Comparación", "<="),
      P("value", "expression", "Salud", "1"),
      P("behavior", "behavior", "Comportamiento", "Salud"),
    ],
    behavior: true,
  },

  /* ---------------------------------------------------------------- Efectos */
  {
    id: "SetEffectParameter",
    kind: "action",
    category: "effects",
    name: "Cambiar el parámetro de un efecto",
    description: "Modifica un parámetro de un efecto aplicado al objeto.",
    sentence: "Cambiar el parámetro {2} del efecto {1} de {0} a {3}",
    parameters: [
      OBJ("Slime"),
      P("effect", "number", "Número del efecto (empezando por 1)", "1"),
      P("parameter", "string", "Nombre del parámetro", "r"),
      P("value", "expression", "Valor", "255"),
    ],
  },
];

export const instructionById = (id: string): InstructionDef | undefined =>
  INSTRUCTIONS.find((i) => i.id === id);

/** Event types offered by «Elige y agrega un evento». */
export const EVENT_TYPES: InstructionDef[] = [
  {
    id: "BuiltinCommonInstructions::Standard",
    kind: "action",
    category: "adv",
    name: "Nuevo evento (Si … Entonces …)",
    description: "El evento estándar: condiciones y acciones.",
    sentence: "Si … entonces …",
    parameters: [],
    isEvent: true,
  },
  {
    id: "BuiltinCommonInstructions::Group",
    kind: "action",
    category: "adv",
    name: "Grupo de eventos",
    description: "Agrupa eventos para organizarlos, con comentario y color propios.",
    sentence: "Grupo",
    parameters: [],
    isEvent: true,
  },
  {
    id: "BuiltinCommonInstructions::Comment",
    kind: "action",
    category: "adv",
    name: "Comentario",
    description: "Una línea de documentación, sin impacto en el juego.",
    sentence: "Comentario",
    parameters: [],
    isEvent: true,
  },
  {
    id: "BuiltinCommonInstructions::Link",
    kind: "action",
    category: "adv",
    name: "Enlazar eventos externos",
    description: "Ejecuta los eventos de otra lista de eventos del proyecto.",
    sentence: "Enlace a {0}",
    parameters: [P("link", "string", "Eventos externos", "Sistema de puntuación")],
    isEvent: true,
  },
  {
    id: "BuiltinCommonInstructions::Async",
    kind: "action",
    category: "adv",
    name: "Asincronía",
    description: "Agrupa eventos ejecutados sin bloquear el resto de la hoja.",
    sentence: "Asíncrono",
    parameters: [],
    isEvent: true,
    unsupported: true,
  },
];

/** Render an instruction sentence, splitting around {n} placeholders. */
export function sentenceParts(def: InstructionDef): Array<{ text?: string; paramIndex?: number }> {
  const parts: Array<{ text?: string; paramIndex?: number }> = [];
  const regex = /\{(\d+)\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(def.sentence)) !== null) {
    if (m.index > last) parts.push({ text: def.sentence.slice(last, m.index) });
    parts.push({ paramIndex: Number(m[1]) });
    last = m.index + m[0].length;
  }
  if (last < def.sentence.length) parts.push({ text: def.sentence.slice(last) });
  return parts;
}

export const OPERATORS = ["=", "<", ">", "≤", "≥", "≠"] as const;
export const MODOPS = [
  { value: "set to", label: "establecer" },
  { value: "add", label: "añadir" },
  { value: "subtract", label: "restar" },
  { value: "multiply", label: "multiplicar" },
  { value: "divide", label: "dividir" },
] as const;

/** Search over the catalog, same fields the GDevelop selector looks at. */
export function searchInstructions(
  kind: "condition" | "action",
  query: string,
  category?: string,
): InstructionDef[] {
  const needle = query.trim().toLowerCase();
  return INSTRUCTIONS.filter((i) => {
    if (i.kind !== kind) return false;
    if (category && category !== "all" && i.category !== category) return false;
    if (!needle) return true;
    return (
      i.name.toLowerCase().includes(needle) ||
      i.description.toLowerCase().includes(needle) ||
      i.sentence.toLowerCase().includes(needle) ||
      categoryName(i.category).toLowerCase().includes(needle)
    );
  });
}

export const categoryName = (id: string): string =>
  INSTRUCTION_CATEGORIES.find((c) => c.id === id)?.name ?? id;
