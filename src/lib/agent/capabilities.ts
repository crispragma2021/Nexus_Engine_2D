// Runtime capability matrix — the single source of truth for what the
// Nexus Engine TypeScript runtime actually executes.
//
// The agent validator consults this matrix before proposing or applying any
// operation, so the agent never invents behaviors, effects or instructions
// the runtime does not have (brief: "protección contra alucinaciones").
//
// Sources of truth (tests/agent-operations.test.ts asserts no drift):
//   - behaviors: `src/lib/editor/catalog.ts`, BEHAVIORS entries with a `runtime` field.
//     Entries without it (Physics2, Pathfinding) exist in the editor UI catalog but
//     the runtime does not simulate them — the agent must say so, not fake them.
//   - effects: `src/lib/editor/catalog.ts`, EFFECTS entries with `supported: true`.
//   - instructions: `src/lib/runtime/engine.ts`, the dispatch switch cases.
//   - object types: `src/lib/editor/catalog.ts`, isSpriteLike() ∪ isTextLike().

/** Behaviors the GameRuntime simulates (catalog `runtime:` field). */
export const SUPPORTED_BEHAVIOR_TYPES = [
  "PlatformBehavior::PlatformerObjectBehavior",
  "PlatformBehavior::PlatformBehavior",
  "AnchorBehavior::AnchorBehavior",
  "Flash::Flash",
  "Health::Health",
  "Tween::TweenBehavior",
  "DraggableBehavior::Draggable",
] as const;

export type SupportedBehaviorType = (typeof SUPPORTED_BEHAVIOR_TYPES)[number];

/** In the editor catalog but NOT simulated by the runtime (yet). */
export const CATALOG_ONLY_BEHAVIOR_TYPES = [
  "Physics2::Physics2Behavior",
  "PathfindingBehavior::PathfindingBehavior",
] as const;

/** Visual effects the renderer implements (catalog `supported: true`). */
export const SUPPORTED_EFFECT_TYPES = ["Tint", "ColorOverlay"] as const;

/**
 * Instruction typeIds handled by the runtime dispatch
 * (`src/lib/runtime/engine.ts`). Conditions and actions share the space;
 * the engine fails safely on anything else, and the agent refuses earlier.
 */
export const SUPPORTED_INSTRUCTION_TYPES = [
  // conditions
  "BuiltinCommonInstructions::Once",
  "SceneJustBegins",
  "BuiltinCommonInstructions::Else",
  "BuiltinCommonInstructions::CompareValues",
  "BuiltinCommonInstructions::StrEqual",
  "CompareSceneVar",
  "CompareSceneVarString",
  "CompareGlobalVar",
  "ValueOfTimer",
  "TimerRepeated",
  "KeyPressed",
  "KeyNotPressed",
  "KeyReleased",
  "SourisBouton",
  "SourisSurObjet",
  "Collision",
  "Separation",
  "OnFloor",
  "PlatformBehavior::IsOnFloor",
  "PlatformBehavior::IsJumping",
  "PlatformBehavior::IsFalling",
  "PosX",
  "PosY",
  "Angle",
  "Visible",
  "Opacity",
  "AnimationNameIs",
  "Health::IsDead",
  "Health::CompareHealth",
  "Flash::IsFlashEnabled",
  "Tween::TweenFinished",
  // actions
  "Create",
  "Delete",
  "PosObj",
  "ChangeX",
  "ChangeY",
  "SetAngle",
  "ChangeWidth",
  "ChangeHeight",
  "AddForceAngle",
  "AddForceXY",
  "AddForceToward",
  "FlipX",
  "FlipY",
  "SetOpacity",
  "Cache",
  "Montre",
  "ChangeZOrder",
  "ChangeAnimation",
  "ChangeAnimationName",
  "SetSpriteSpeed",
  "TXT::SetText",
  "TXT::SetFontSize",
  "TXT::SetColor",
  "ModVarScene",
  "ModVarSceneTxt",
  "ToggleSceneVar",
  "ModVarGlobal",
  "ModVarInstance",
  "ModVarObjet",
  "ResetTimer",
  "PauseTimer",
  "UnpauseTimer",
  "CentreCamera",
  "SetCameraZoom",
  "HideLayer",
  "ShowLayer",
  "SetLayerOpacity",
  "SetTimeScale",
  "PauseGame",
  "SetEffectParameter",
  "PlatformBehavior::SimulateControl",
  "PlatformBehavior::SimulateJumpKey",
  "PlatformBehavior::IgnoreControl",
  "PlatformBehavior::SetGravity",
  "Health::RemoveHealth",
  "Health::AddHealth",
  "Health::SetHealth",
  "Flash::Flash",
  "Flash::StopFlash",
  "Tween::CreateTween",
  "Tween::CreateTween2",
  "Tween::RemoveTween",
  "PlaySound",
  "PlaySoundAtPosition",
  "StopSound",
  "ChangeScene",
  "EndScene",
] as const;

export type SupportedInstructionType = (typeof SUPPORTED_INSTRUCTION_TYPES)[number];

/** Object types the agent may create (renderer-drawn: sprite-like + text-like). */
export const CREATABLE_OBJECT_TYPES = [
  "Sprite",
  "SpriteObject::SpriteSheet",
  "TiledSpriteObject::TiledSprite",
  "PanelSpriteObject::PanelSprite",
  "TextObject::Text",
  "BBTextObject::BBText",
  "BitmapTextObject::BitmapText",
] as const;

export const isSupportedBehavior = (type: string): boolean =>
  (SUPPORTED_BEHAVIOR_TYPES as readonly string[]).includes(type);

export const isCatalogOnlyBehavior = (type: string): boolean =>
  (CATALOG_ONLY_BEHAVIOR_TYPES as readonly string[]).includes(type);

export const isSupportedEffect = (type: string): boolean =>
  (SUPPORTED_EFFECT_TYPES as readonly string[]).includes(type);

export const isSupportedInstruction = (type: string): boolean =>
  (SUPPORTED_INSTRUCTION_TYPES as readonly string[]).includes(type);

export const isCreatableObjectType = (type: string): boolean =>
  (CREATABLE_OBJECT_TYPES as readonly string[]).includes(type);

/**
 * Default properties for the supported behaviors (mirrors the catalog defaults
// so agent-created objects behave out of the box). Values are strings, as the
 * project model stores behavior properties.
 */
export const BEHAVIOR_DEFAULT_PROPERTIES: Record<string, Record<string, string>> = {
  "PlatformBehavior::PlatformerObjectBehavior": {
    acceleration: "800",
    maxSpeed: "250",
    friction: "20",
    jumpSpeed: "600",
    jumpSustain: "300",
    canGoDownFromJumpthru: "yes",
    canGrabPlatforms: "no",
    gravity: "1800",
    maxFallingSpeed: "900",
  },
  "PlatformBehavior::PlatformBehavior": {
    platformType: "Normal platform",
    canBeGrabbed: "yes",
    yGrabOffset: "0",
  },
  "AnchorBehavior::AnchorBehavior": {},
  "Flash::Flash": {
    duration: "1",
  },
  "Health::Health": {
    initialHealth: "100",
    maxHealth: "100",
    invincibilityDuration: "1",
  },
  "Tween::TweenBehavior": {},
  "DraggableBehavior::Draggable": {
    canBeDragged: "yes",
    mouseButton: "Left",
  },
};

/**
 * Honest message for a capability the runtime does not have, following the
 * brief's example: never claim "done", explain and offer an alternative.
 */
export function unsupportedBehaviorMessage(type: string): string {
  if (isCatalogOnlyBehavior(type)) {
    return (
      `No puedo añadir el comportamiento «${type}» porque el runtime aún no lo simula. ` +
      "Puedo lograr el efecto con movimiento, colisiones, timers o tweens si quieres."
    );
  }
  return `No puedo añadir el comportamiento «${type}» porque no existe en el catálogo de comportamientos.`;
}

export function unsupportedInstructionMessage(type: string): string {
  return (
    `No puedo usar la instrucción «${type}» porque el runtime no la soporta. ` +
    `Instrucciones disponibles: ${SUPPORTED_INSTRUCTION_TYPES.length}.`
  );
}
