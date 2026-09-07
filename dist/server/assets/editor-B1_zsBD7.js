import { C as uid, S as newNameGenerator, _ as makeScene, b as toRuntimeScene, c as clearCurrentProject, d as listLocalProjects, f as saveLocalProject, g as createEmptyProject, h as BASE_LAYER_NAME, i as SheetTitle, m as BRAND, n as SheetContent, o as NexusMark, p as setCurrentProject, r as SheetDescription, s as cn, t as Sheet, u as getCurrentProject, v as migrateProject, w as DEFAULT_GRID, x as withScene, y as renameSceneInProject } from "./sheet-DaL3UsqW.js";
import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { toast } from "sonner";
import { Accessibility, Activity, AlertTriangle, Anchor, ArrowDownToLine, ArrowUp, ArrowUpToLine, BookOpen, Bot, Box, Boxes, Braces, Brush, Bug, Camera, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Clapperboard, ClipboardCopy, ClipboardPaste, Clock, Copy, Cpu, Crop, Crosshair, Dices, Ellipsis, Eraser, Eye, EyeOff, FileCode2, FilePlus2, FileText, FileType, Film, FolderOpen, Frame, FunctionSquare, Gamepad2, Globe, Grid2x2, Grid3x3, GripVertical, Hash, Heart, HelpCircle, History, Image as Image$1, Laptop, Layers, LayoutGrid, LayoutPanelTop, Lightbulb, Link2, List, ListTree, Lock, LogOut, Magnet, Maximize, Menu, MoreVertical, MousePointerClick, Music, PanelLeft, PanelRight, Paperclip, Pause, PenLine, PenTool, Pencil, PersonStanding, Play, Plus, Puzzle, RectangleHorizontal, Redo2, RotateCcw, Rows3, Ruler, Save, SaveAll, Scissors, ScrollText, Search, Send, Settings, Settings2, Share2, SlidersHorizontal, Smartphone, Sparkles, Spline, SquareDashed, SquareStack, TextQuote, Timer, ToggleLeft, ToggleRight, Trash2, Type, Undo2, UnfoldVertical, Unlock, Upload, Users, Variable, Video, Volume2, Waves, Wind, X, Zap, ZoomIn, ZoomOut } from "lucide-react";
import JSZip from "jszip";
//#region src/lib/editor/data.ts
var num = (name, value, children = []) => ({
	name,
	type: "number",
	value,
	children
});
var text = (name, value) => ({
	name,
	type: "string",
	value,
	children: [],
	previewAsString: true
});
var ins = (typeId, parameters = {}) => ({
	id: uid("in"),
	typeId,
	inverted: false,
	parameters
});
var event = (patch) => ({
	id: patch.id ?? uid("ev"),
	kind: "standard",
	conditions: [],
	actions: [],
	subEvents: [],
	collapsed: false,
	...patch
});
var comment = (commentText, background, textColor) => event({
	kind: "comment",
	comment: commentText,
	commentColors: {
		background,
		text: textColor
	}
});
function playerObject() {
	return {
		id: "obj_player",
		name: "Jugador",
		type: "Sprite",
		asset: "player.png",
		behaviors: [{
			name: "PlataformaCharacter",
			type: "PlatformBehavior::PlatformerObjectBehavior",
			properties: {
				acceleration: "1500",
				maxSpeed: "250",
				friction: "20",
				jumpSpeed: "600",
				jumpSustain: "300",
				gravity: "1800",
				maxFallingSpeed: "900",
				canGrabPlatforms: "no",
				canGoDownFromJumpthru: "yes"
			}
		}],
		effects: [],
		variables: [
			num("Vidas", "3"),
			num("Invulnerable", "0"),
			{
				name: "Estado",
				type: "structure",
				value: "",
				children: [text("actual", "reposo"), num("tick", "0")]
			}
		],
		animations: [
			{
				name: "reposo",
				loops: false,
				timeBetweenFrames: 0,
				images: [{
					image: "player.png",
					originX: 0,
					originY: 0,
					centerX: .5,
					centerY: .5,
					opacity: 255
				}],
				points: [{
					name: "cañón",
					x: 52,
					y: 18
				}, {
					name: "suelo",
					x: 32,
					y: 54
				}]
			},
			{
				name: "correr",
				loops: true,
				timeBetweenFrames: 8,
				images: [{
					image: "player.png",
					originX: 0,
					originY: 0,
					centerX: .5,
					centerY: .5,
					opacity: 255
				}, {
					image: "slime.png",
					originX: 0,
					originY: 0,
					centerX: .5,
					centerY: .5,
					opacity: 255
				}],
				points: [{
					name: "cañón",
					x: 52,
					y: 18
				}, {
					name: "suelo",
					x: 32,
					y: 54
				}]
			},
			{
				name: "saltar",
				loops: false,
				timeBetweenFrames: 0,
				images: [{
					image: "player.png",
					originX: 0,
					originY: 0,
					centerX: .5,
					centerY: .5,
					opacity: 255
				}],
				points: [{
					name: "cañón",
					x: 52,
					y: 18
				}]
			}
		]
	};
}
function simpleSprite(id, name, asset, patch = {}) {
	return {
		id,
		name,
		type: "Sprite",
		asset,
		behaviors: [],
		effects: [],
		variables: [],
		animations: [{
			name: "reposo",
			loops: true,
			timeBetweenFrames: 0,
			images: [{
				image: asset,
				originX: 0,
				originY: 0,
				centerX: .5,
				centerY: .5,
				opacity: 255
			}],
			points: []
		}],
		...patch
	};
}
function levelOneScene() {
	return makeScene("Level 1", {
		backgroundColor: "247;249;255",
		grid: {
			...DEFAULT_GRID,
			show: true,
			snap: true
		},
		layers: [{
			name: "Base layer",
			visible: true,
			camera: {
				x: 0,
				y: 0
			},
			effects: []
		}, {
			name: "Interfaz",
			visible: true,
			locked: false,
			camera: {
				x: 0,
				y: 0
			},
			effects: [],
			followBaseLayer: false
		}],
		activeLayer: "Base layer",
		objects: [
			playerObject(),
			{
				id: "obj_platform",
				name: "Plataforma",
				type: "TiledSpriteObject::TiledSprite",
				asset: "platform.png",
				behaviors: [{
					name: "Plataforma",
					type: "PlatformBehavior::PlatformBehavior",
					properties: {
						platformType: "Normal platform",
						canBeGrabbed: "yes",
						yGrabOffset: "0"
					}
				}],
				effects: [],
				variables: []
			},
			simpleSprite("obj_coin", "Moneda", "coin.png", {
				behaviors: [{
					name: "Interpolación",
					type: "Tween::TweenBehavior",
					properties: { tweenName: "0" }
				}],
				variables: [num("valor", "1")]
			}),
			simpleSprite("obj_slime", "Slime", "slime.png", {
				behaviors: [
					{
						name: "Destello",
						type: "Flash::Flash",
						properties: {
							flashDuration: "0.2",
							times: "5",
							halfTimes: "0.1"
						}
					},
					{
						name: "Salud",
						type: "Health::Health",
						properties: {
							health: "2",
							maxHealth: "2",
							minHealth: "0",
							shield: "0"
						}
					},
					{
						name: "Plataforma",
						type: "PlatformBehavior::PlatformBehavior",
						properties: {
							platformType: "Normal platform",
							canBeGrabbed: "no",
							yGrabOffset: "0"
						}
					}
				],
				effects: [{
					type: "Tint",
					name: "Tinte",
					parameters: {
						r: "255",
						g: "170",
						b: "90"
					}
				}],
				variables: [num("velocidad", "80")]
			}),
			{
				id: "obj_score",
				name: "TextoPuntos",
				type: "TextObject::Text",
				text: "Puntos: 0",
				textColor: "#1D1D26",
				textSize: 24,
				fontFamily: "PressStart2P.ttf",
				bold: true,
				alignment: "left",
				wrapping: false,
				behaviors: [{
					name: "Anclar",
					type: "AnchorBehavior::AnchorBehavior",
					properties: {
						anchor: "Left",
						relativeToWindow: "yes",
						relativeToBottomLeft: "yes"
					}
				}],
				effects: [],
				variables: []
			}
		],
		instances: [
			instance("inst_ground1", "obj_platform", 0, 520, 832, 80, 1),
			instance("inst_plat1", "obj_platform", 180, 400, 160, 32, 2),
			instance("inst_plat2", "obj_platform", 460, 320, 160, 32, 2),
			instance("inst_plat3", "obj_platform", 640, 420, 128, 32, 2),
			instance("inst_player", "obj_player", 90, 430, 72, 55, 5),
			instance("inst_coin1", "obj_coin", 220, 350, 34, 34, 3),
			instance("inst_coin2", "obj_coin", 500, 270, 34, 34, 3),
			instance("inst_coin3", "obj_coin", 680, 370, 34, 34, 3),
			instance("inst_coin4", "obj_coin", 560, 470, 34, 34, 3),
			instance("inst_slime1", "obj_slime", 380, 470, 52, 44, 4),
			instance("inst_slime2", "obj_slime", 660, 470, 52, 44, 4),
			{
				...instance("inst_score", "obj_score", 16, 12, 200, 34, 10),
				layer: "Interfaz"
			}
		],
		variables: [
			num("Puntos", "0"),
			num("Nivel", "1"),
			text("mensaje", "¡Buena suerte!"),
			{
				name: "Jugador",
				type: "structure",
				value: "",
				children: [
					num("vida", "3"),
					text("nombre", "Nexus"),
					num("monedas", "0")
				]
			}
		],
		groups: [{
			name: "Enemigos",
			objects: ["Slime"],
			behaviors: []
		}, {
			name: "Coleccionables",
			objects: ["Moneda"],
			behaviors: []
		}],
		events: levelOneEvents()
	});
}
function instance(id, objectId, x, y, width, height, zOrder) {
	return {
		id,
		objectId,
		x,
		y,
		angle: 0,
		width,
		height,
		zOrder,
		layer: "Base layer",
		locked: false,
		hiddenAtStart: false,
		customSize: true,
		variables: [],
		effects: []
	};
}
/** Event sheet, written the way GDevelop's platformer example does it. */
function levelOneEvents() {
	return [
		comment("CONFIGURACIÓN INICIAL", "255;230;109", "0;0;0"),
		event({
			conditions: [ins("BuiltinCommonInstructions::Once")],
			actions: [
				ins("ModVarScene", {
					variable: "Puntos",
					op: "set to",
					value: "0"
				}),
				ins("TXT::SetText", {
					object: "TextoPuntos",
					text: "\"Puntos: \" + ToString(Variable(Puntos))"
				}),
				ins("Montre", { object: "Jugador" })
			]
		}),
		comment("MOVIMIENTO DEL JUGADOR", "255;230;109", "0;0;0"),
		event({
			conditions: [ins("KeyPressed", { key: "Right" })],
			actions: [
				ins("PlatformBehavior::SimulateControl", {
					object: "Jugador",
					behavior: "PlataformaCharacter",
					key: "Right",
					pressed: "yes"
				}),
				ins("ChangeAnimationName", {
					object: "Jugador",
					animation: "\"correr\""
				}),
				ins("FlipX", {
					object: "Jugador",
					flip: "no"
				})
			]
		}),
		event({
			conditions: [ins("KeyNotPressed", { key: "Right" })],
			actions: [ins("PlatformBehavior::SimulateControl", {
				object: "Jugador",
				behavior: "PlataformaCharacter",
				key: "Right",
				pressed: "no"
			})]
		}),
		event({
			conditions: [ins("KeyPressed", { key: "Left" })],
			actions: [
				ins("PlatformBehavior::SimulateControl", {
					object: "Jugador",
					behavior: "PlataformaCharacter",
					key: "Left",
					pressed: "yes"
				}),
				ins("ChangeAnimationName", {
					object: "Jugador",
					animation: "\"correr\""
				}),
				ins("FlipX", {
					object: "Jugador",
					flip: "yes"
				})
			]
		}),
		event({
			conditions: [ins("KeyNotPressed", { key: "Left" })],
			actions: [ins("PlatformBehavior::SimulateControl", {
				object: "Jugador",
				behavior: "PlataformaCharacter",
				key: "Left",
				pressed: "no"
			})]
		}),
		event({
			conditions: [ins("KeyPressed", { key: "Space" })],
			actions: [ins("PlatformBehavior::SimulateJumpKey", {
				object: "Jugador",
				behavior: "PlataformaCharacter"
			}), ins("ChangeAnimationName", {
				object: "Jugador",
				animation: "\"saltar\""
			})]
		}),
		event({
			conditions: [
				ins("KeyNotPressed", { key: "Right" }),
				ins("KeyNotPressed", { key: "Left" }),
				ins("PlatformBehavior::IsOnFloor", {
					object: "Jugador",
					behavior: "PlataformaCharacter"
				})
			],
			actions: [ins("ChangeAnimationName", {
				object: "Jugador",
				animation: "\"reposo\""
			})]
		}),
		comment("MONEDAS Y ENEMIGOS", "255;230;109", "0;0;0"),
		event({
			kind: "group",
			groupName: "Recoger monedas",
			groupColor: "#7046EC",
			subEvents: [event({
				conditions: [ins("Collision", {
					object: "Jugador",
					object2: "Moneda",
					ignoreTouchingEdges: "no"
				})],
				actions: [
					ins("Delete", { object: "Moneda" }),
					ins("ModVarScene", {
						variable: "Puntos",
						op: "add",
						value: "1"
					}),
					ins("TXT::SetText", {
						object: "TextoPuntos",
						text: "\"Puntos: \" + ToString(Variable(Puntos))"
					}),
					ins("PlaySound", {
						file: "coin.wav",
						volume: "100",
						loop: "no"
					}),
					ins("ToggleSceneVar", {
						variable: "empieza",
						value: "yes"
					})
				]
			})]
		}),
		event({
			conditions: [ins("TimerRepeated", {
				timer: "slime_move",
				seconds: "2"
			})],
			actions: [ins("AddForceToward", {
				object: "Slime",
				target: "Jugador",
				speed: "60"
			})],
			subEvents: [event({
				conditions: [ins("Collision", {
					object: "Slime",
					object2: "Jugador",
					ignoreTouchingEdges: "yes"
				})],
				actions: [
					ins("Health::RemoveHealth", {
						object: "Slime",
						behavior: "Salud",
						health: "1"
					}),
					ins("Flash::Flash", {
						object: "Slime",
						behavior: "Destello"
					}),
					ins("PlaySound", {
						file: "hurt.wav",
						volume: "80",
						loop: "no"
					})
				]
			})]
		}),
		event({
			conditions: [ins("KeyPressed", { key: "Down" }), ins("Collision", {
				object: "Jugador",
				object2: "Slime",
				ignoreTouchingEdges: "yes"
			})],
			actions: [ins("Delete", { object: "Jugador" }), ins("ChangeScene", { scene: "Menú" })]
		})
	];
}
function menuScene() {
	return makeScene("Menú", {
		backgroundColor: "29;29;38",
		grid: {
			...makeScene("x").grid,
			show: false,
			snap: false
		},
		objects: [{
			id: "obj_title",
			name: "Titulo",
			type: "TextObject::Text",
			text: "NEXUS PLATFORMER",
			textColor: "#FAFAFA",
			textSize: 48,
			bold: true,
			alignment: "center",
			behaviors: [],
			effects: [],
			variables: []
		}, {
			id: "obj_hint",
			name: "Ayuda",
			type: "TextObject::Text",
			text: "Pulsa Espacio para jugar",
			textColor: "#C5C5C9",
			textSize: 20,
			behaviors: [],
			effects: [],
			variables: []
		}],
		instances: [instance("inst_title", "obj_title", 120, 240, 560, 60, 1), instance("inst_hint", "obj_hint", 240, 340, 320, 30, 2)],
		events: [event({
			conditions: [ins("KeyPressed", { key: "Space" })],
			actions: [ins("ChangeScene", { scene: "Level 1" })]
		})]
	});
}
function createDemoProject() {
	return {
		name: "Mi proyecto de plataformas",
		version: "1.0.0",
		firstLayoutName: "Level 1",
		scenes: [levelOneScene(), menuScene()],
		resources: [
			{
				name: "player.png",
				kind: "image",
				file: "player.png",
				size: 3.4
			},
			{
				name: "coin.png",
				kind: "image",
				file: "coin.png",
				size: 1.1
			},
			{
				name: "platform.png",
				kind: "image",
				file: "platform.png",
				size: .8
			},
			{
				name: "slime.png",
				kind: "image",
				file: "slime.png",
				size: 2.2
			},
			{
				name: "coin.wav",
				kind: "audio",
				file: "coin.wav",
				size: 12.4
			},
			{
				name: "hurt.wav",
				kind: "audio",
				file: "hurt.wav",
				size: 18.9
			},
			{
				name: "theme.ogg",
				kind: "audio",
				file: "theme.ogg",
				size: 780.5,
				alwaysLoaded: true
			},
			{
				name: "PressStart2P.ttf",
				kind: "font",
				file: "PressStart2P.ttf",
				size: 45.2
			}
		],
		globalVariables: [
			num("MejorPuntuacion", "128"),
			text("NombreJugador", "Nexus"),
			{
				name: "Opciones",
				type: "structure",
				value: "",
				children: [
					num("musica", "80"),
					num("sonido", "100"),
					{
						name: "controles",
						type: "structure",
						value: "",
						children: [text("salto", "Space")]
					}
				]
			}
		],
		extensions: [
			{
				name: "Plataformas",
				longName: "Platformer",
				icon: "platform",
				version: "1.5.6",
				loaded: true
			},
			{
				name: "Interpolación",
				longName: "Tween",
				icon: "tween",
				version: "1.1.2",
				loaded: true
			},
			{
				name: "Destello",
				longName: "Flash",
				icon: "flash",
				version: "1.0.1",
				loaded: true
			},
			{
				name: "Salud",
				longName: "Health",
				icon: "health",
				version: "1.0.0",
				loaded: true
			},
			{
				name: "Anclar",
				longName: "Anchor",
				icon: "anchor",
				version: "1.0.4",
				loaded: true
			},
			{
				name: "Efectos",
				longName: "Effects",
				icon: "effects",
				version: "1.2.0",
				loaded: true
			},
			{
				name: "Cámara",
				longName: "Camera",
				icon: "camera",
				version: "1.0.0",
				loaded: true
			}
		],
		externalEvents: [{
			name: "Sistema de puntuación",
			events: [event({
				conditions: [ins("BuiltinCommonInstructions::Once")],
				actions: [ins("ModVarGlobal", {
					variable: "MejorPuntuacion",
					op: "max",
					value: "Variable(Puntos)"
				})]
			})]
		}],
		externalLayouts: [{
			name: "Fila de monedas",
			instances: [
				instance("inst_el_coin1", "obj_coin", 100, 300, 34, 34, 3),
				instance("inst_el_coin2", "obj_coin", 150, 300, 34, 34, 3),
				instance("inst_el_coin3", "obj_coin", 200, 300, 34, 34, 3)
			]
		}],
		gameSettings: {
			author: "Nexus Studio",
			description: "Un plataformas hecho con Nexus Engine, sin escribir código.",
			version: "1.0.0",
			packageName: "com.nexusengine.platformer",
			orientation: "landscape",
			windowWidth: 800,
			windowHeight: 600,
			useWindowSizeAsBaseSize: true,
			magnification: 1,
			minFPS: 30,
			maxFPS: 65,
			adaptGameResolutionAtRuntime: true,
			scaleMode: "linear",
			windowMode: "default",
			startScene: "Level 1",
			pauseOnLostFocus: false,
			renderOutsideGameArea: false,
			loadingScreen: {
				displayBrandSplash: true,
				minDuration: 0,
				fadeInDuration: 0,
				fadeOutDuration: 0,
				backgroundColor: "#1D1D26"
			},
			watermark: { showOnMobile: false },
			projectUuid: "nexus-demo-0001",
			folderPolicy: "doNotUse"
		}
	};
}
//#endregion
//#region src/lib/editor/events.ts
/** Comment presets, matching GDevelop's comment color picker. */
var COMMENT_COLORS = [
	{
		id: "green",
		label: "Verde",
		background: "21;28;33",
		text: "152;195;121"
	},
	{
		id: "yellow",
		label: "Amarillo",
		background: "62;58;36",
		text: "229;192;123"
	},
	{
		id: "orange",
		label: "Naranja",
		background: "62;45;36",
		text: "209;154;105"
	},
	{
		id: "blue",
		label: "Azul",
		background: "26;38;56",
		text: "107;175;255"
	}
];
var GROUP_COLORS = [
	"#7046EC",
	"#4AB0E4",
	"#45D9A1",
	"#FFBC57",
	"#FF8569",
	"#C678DD"
];
function newEvent(kind, patch = {}) {
	return {
		id: uid("ev"),
		kind,
		conditions: [],
		actions: [],
		subEvents: [],
		collapsed: false,
		...kind === "comment" ? {
			comment: "",
			commentColors: {
				background: COMMENT_COLORS[0].background,
				text: COMMENT_COLORS[0].text
			}
		} : {},
		...kind === "group" ? {
			groupName: "Nuevo grupo",
			groupColor: GROUP_COLORS[0]
		} : {},
		...kind === "link" ? { linkToEventsName: "" } : {},
		...patch
	};
}
function newInstruction(typeId, parameters = {}) {
	return {
		id: uid("in"),
		typeId,
		inverted: false,
		parameters
	};
}
var MAX_COMMANDS = 12;
var MAX_COORDINATE$1 = 1e6;
var MAX_DIMENSION$1 = 1e5;
var AiPromptValidationError = class extends Error {
	constructor(message) {
		super(message);
		this.name = "AiPromptValidationError";
	}
};
var NAMED_COLORS = {
	negro: {
		r: 0,
		g: 0,
		b: 0
	},
	black: {
		r: 0,
		g: 0,
		b: 0
	},
	blanco: {
		r: 255,
		g: 255,
		b: 255
	},
	white: {
		r: 255,
		g: 255,
		b: 255
	},
	rojo: {
		r: 239,
		g: 68,
		b: 68
	},
	red: {
		r: 239,
		g: 68,
		b: 68
	},
	verde: {
		r: 34,
		g: 197,
		b: 94
	},
	green: {
		r: 34,
		g: 197,
		b: 94
	},
	azul: {
		r: 59,
		g: 130,
		b: 246
	},
	blue: {
		r: 59,
		g: 130,
		b: 246
	},
	amarillo: {
		r: 250,
		g: 204,
		b: 21
	},
	yellow: {
		r: 250,
		g: 204,
		b: 21
	},
	naranja: {
		r: 249,
		g: 115,
		b: 22
	},
	orange: {
		r: 249,
		g: 115,
		b: 22
	},
	morado: {
		r: 112,
		g: 70,
		b: 236
	},
	purpura: {
		r: 112,
		g: 70,
		b: 236
	},
	violeta: {
		r: 139,
		g: 92,
		b: 246
	},
	purple: {
		r: 112,
		g: 70,
		b: 236
	},
	rosa: {
		r: 236,
		g: 72,
		b: 153
	},
	pink: {
		r: 236,
		g: 72,
		b: 153
	},
	gris: {
		r: 107,
		g: 114,
		b: 128
	},
	gray: {
		r: 107,
		g: 114,
		b: 128
	},
	cyan: {
		r: 6,
		g: 182,
		b: 212
	},
	turquesa: {
		r: 20,
		g: 184,
		b: 166
	}
};
var normalize$2 = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
var unique = (values) => [...new Set(values)];
var numberOf = (value) => Number(value.replace(",", "."));
var instancesLabel = (count) => `${count} ${count === 1 ? "instancia" : "instancias"}`;
var objectsLabel = (count) => `${count} ${count === 1 ? "objeto" : "objetos"}`;
function validateAiPrompt(input) {
	if (typeof input !== "string") throw new AiPromptValidationError("La instrucción debe ser texto.");
	const prompt = input.trim().replace(/\s+/g, " ");
	if (prompt.length < 2) throw new AiPromptValidationError("Escribe una instrucción un poco más específica.");
	if (prompt.length > 600) throw new AiPromptValidationError(`La instrucción no puede superar 600 caracteres.`);
	if (hasDisallowedControlCharacters$2(prompt)) throw new AiPromptValidationError("La instrucción contiene caracteres no válidos.");
	return prompt;
}
/**
* Turns a short in-situ instruction into a small, allow-listed edit plan. The
* deterministic interpreter is also the safe fallback for a future remote AI:
* regardless of where commands come from, validateAiEditPlan is the trust
* boundary before anything reaches the editor store.
*/
function createAiEditPlan(input, context) {
	const prompt = validateAiPrompt(input);
	const normalized = normalize$2(prompt);
	const targets = resolveTargets(normalized, context);
	const commands = [];
	const changes = [];
	const needsInstances = () => requireInstances(targets.instanceIds);
	const needsObjects = () => requireObjects(targets.objectIds);
	const createText = /\b(?:crea|crear|anade|anadir|agrega|agregar|inserta|insertar)\b[^.]*\btexto\b/.test(normalized);
	if (createText) {
		const text = extractCreatedText(prompt) ?? "Nuevo texto";
		const color = parseColor(prompt) ?? NAMED_COLORS["blanco"];
		const textSize = extractTextSize(normalized) ?? 24;
		const position = context.cursorPosition ?? {
			x: 0,
			y: 0
		};
		commands.push({
			kind: "addText",
			name: "TextoIA",
			text,
			x: position.x,
			y: position.y,
			textColor: rgbToHex$1(color),
			textSize
		});
		changes.push("creé un texto en la posición del cursor");
	}
	if (/\b(?:duplica|duplicar|clona|clonar|copia otra)\b/.test(normalized)) {
		const ids = needsInstances();
		commands.push({
			kind: "duplicateInstances",
			ids
		});
		changes.push(`dupliqué ${instancesLabel(ids.length)}`);
	}
	if (/^(?:elimina|eliminar|borra|borrar|quita|quitar)(?:lo|la|los|las)?$/.test(normalized) || /\b(?:elimina|eliminar|borra|borrar|quita|quitar)\b[^.]*\b(?:instancia|instancias|objeto|objetos|seleccion|seleccionado|seleccionados)\b/.test(normalized)) {
		const ids = needsInstances();
		commands.push({
			kind: "deleteInstances",
			ids
		});
		changes.push(`eliminé ${instancesLabel(ids.length)}`);
	}
	const visibility = visibilityFrom(normalized);
	if (visibility !== null) {
		const ids = needsInstances();
		commands.push({
			kind: "updateInstances",
			ids,
			patch: { hiddenAtStart: !visibility }
		});
		changes.push(`${visibility ? "mostré" : "oculté"} ${instancesLabel(ids.length)}`);
	}
	const locked = lockFrom(normalized);
	if (locked !== null) {
		const ids = needsInstances();
		commands.push({
			kind: "updateInstances",
			ids,
			patch: { locked }
		});
		changes.push(`${locked ? "bloqueé" : "desbloqueé"} ${instancesLabel(ids.length)}`);
	}
	const absolutePosition = extractAbsolutePosition(normalized);
	if (absolutePosition) {
		const ids = needsInstances();
		commands.push({
			kind: "updateInstances",
			ids,
			patch: absolutePosition
		});
		changes.push(`coloqué ${instancesLabel(ids.length)} en ${absolutePosition.x}, ${absolutePosition.y}`);
	} else {
		const movement = extractRelativeMovement(normalized, context.scene);
		if (movement) {
			const ids = needsInstances();
			commands.push({
				kind: "translateInstances",
				ids,
				...movement
			});
			changes.push(`moví ${instancesLabel(ids.length)}`);
		}
	}
	const dimensions = extractDimensions(normalized);
	if (dimensions) {
		const ids = needsInstances();
		commands.push({
			kind: "updateInstances",
			ids,
			patch: dimensions
		});
		changes.push(`ajusté el tamaño de ${instancesLabel(ids.length)}`);
	} else {
		const factor = extractScale(normalized);
		if (factor !== null) {
			const ids = needsInstances();
			commands.push({
				kind: "scaleInstances",
				ids,
				factor
			});
			changes.push(`escalé ${instancesLabel(ids.length)}`);
		}
	}
	const angle = extractAngle(normalized);
	if (angle !== null) {
		const ids = needsInstances();
		commands.push({
			kind: "updateInstances",
			ids,
			patch: { angle }
		});
		changes.push(`giré ${instancesLabel(ids.length)} a ${angle}°`);
	}
	const renamedTo = extractNewName(prompt);
	if (renamedTo) {
		const ids = needsObjects();
		if (ids.length !== 1) throw new AiPromptValidationError("Selecciona un único objeto antes de renombrarlo.");
		commands.push({
			kind: "updateObjects",
			ids,
			patch: { name: renamedTo }
		});
		changes.push(`renombré el objeto como ${renamedTo}`);
	}
	const updatesText = !createText && /\b(?:texto|contenido|diga|escriba)\b/.test(normalized) ? extractUpdatedText(prompt) : null;
	if (updatesText) {
		const ids = textObjectIds(needsObjects(), context.scene);
		commands.push({
			kind: "updateObjects",
			ids,
			patch: { text: updatesText }
		});
		changes.push(`actualicé el contenido de ${objectsLabel(ids.length)}`);
	}
	const textSize = !createText ? extractTextSize(normalized) : null;
	if (textSize !== null) {
		const ids = textObjectIds(needsObjects(), context.scene);
		commands.push({
			kind: "updateObjects",
			ids,
			patch: { textSize }
		});
		changes.push(`cambié el tamaño del texto de ${objectsLabel(ids.length)}`);
	}
	if (!createText && /\bnegrita\b/.test(normalized)) {
		const ids = textObjectIds(needsObjects(), context.scene);
		const bold = !/\b(?:sin|quita|quitar|elimina|eliminar)\s+(?:la\s+)?negrita\b/.test(normalized);
		commands.push({
			kind: "updateObjects",
			ids,
			patch: { bold }
		});
		changes.push(`${bold ? "activé" : "quité"} la negrita`);
	}
	const color = parseColor(prompt);
	const changesBackground = /\b(?:fondo|background)\b/.test(normalized);
	if (color && changesBackground) {
		commands.push({
			kind: "updateScene",
			patch: { backgroundColor: rgbToGDevelop(color) }
		});
		changes.push("cambié el fondo de la escena");
	} else if (color && !createText && /\b(?:color|tinte|tono)\b/.test(normalized)) {
		const ids = needsObjects();
		const textIds = ids.filter((id) => isTextObject(context.scene.objects.find((o) => o.id === id)));
		const graphicIds = ids.filter((id) => !textIds.includes(id));
		if (textIds.length > 0) commands.push({
			kind: "updateObjects",
			ids: textIds,
			patch: { textColor: rgbToHex$1(color) }
		});
		if (graphicIds.length > 0) commands.push({
			kind: "tintObjects",
			ids: graphicIds,
			color
		});
		changes.push(`cambié el color de ${objectsLabel(ids.length)}`);
	}
	if (!createText && isCreateInstancePrompt(normalized)) {
		const object = explicitlyMentionedObject(normalized, context.scene) ?? (targets.objectIds.length === 1 ? context.scene.objects.find((item) => item.id === targets.objectIds[0]) : void 0);
		if (!object) throw new AiPromptValidationError("Indica el nombre de un objeto existente para añadirlo a la escena.");
		const position = context.cursorPosition ?? {
			x: 0,
			y: 0
		};
		commands.push({
			kind: "addInstance",
			objectId: object.id,
			x: position.x,
			y: position.y
		});
		changes.push(`añadí una instancia de ${object.name}`);
	}
	if (commands.length === 0) throw new AiPromptValidationError("No pude convertir esa instrucción en un cambio seguro. Prueba «mueve 32 px a la derecha», «tamaño 120x80», «oculta» o «fondo azul».");
	return validateAiEditPlan({
		commands,
		summary: `Listo: ${changes.join("; ")}.`
	}, context.scene);
}
function validateAiEditPlan(plan, scene) {
	if (!plan || !Array.isArray(plan.commands) || plan.commands.length === 0) throw new AiPromptValidationError("La IA no propuso ningún cambio.");
	if (plan.commands.length > MAX_COMMANDS) throw new AiPromptValidationError("La IA propuso demasiados cambios a la vez.");
	if (typeof plan.summary !== "string" || plan.summary.length > 500) throw new AiPromptValidationError("El resumen de la IA no es válido.");
	const instanceIds = new Set(scene.instances.map((instance) => instance.id));
	const objectIds = new Set(scene.objects.map((object) => object.id));
	for (const command of plan.commands) switch (command.kind) {
		case "updateInstances":
			validateIds(command.ids, instanceIds, "instancia");
			validateInstancePatch(command.patch);
			break;
		case "translateInstances":
			validateIds(command.ids, instanceIds, "instancia");
			validateCoordinate(command.dx, "desplazamiento X");
			validateCoordinate(command.dy, "desplazamiento Y");
			break;
		case "scaleInstances":
			validateIds(command.ids, instanceIds, "instancia");
			if (!Number.isFinite(command.factor) || command.factor < .05 || command.factor > 20) throw new AiPromptValidationError("La escala propuesta está fuera del rango permitido.");
			break;
		case "duplicateInstances":
		case "deleteInstances":
			validateIds(command.ids, instanceIds, "instancia");
			break;
		case "updateObjects":
			validateIds(command.ids, objectIds, "objeto");
			validateObjectPatch(command.patch, command.ids, scene);
			break;
		case "tintObjects":
			validateIds(command.ids, objectIds, "objeto");
			validateColor(command.color);
			break;
		case "updateScene":
			if (!isGDevelopColor$1(command.patch.backgroundColor)) throw new AiPromptValidationError("El color de fondo propuesto no es válido.");
			break;
		case "addInstance":
			validateIds([command.objectId], objectIds, "objeto");
			validateCoordinate(command.x, "posición X");
			validateCoordinate(command.y, "posición Y");
			break;
		case "addText":
			validateSafeText(command.name, "nombre", 80);
			validateSafeText(command.text, "texto", 2e3);
			validateCoordinate(command.x, "posición X");
			validateCoordinate(command.y, "posición Y");
			if (!/^#[0-9a-f]{6}$/i.test(command.textColor)) throw new AiPromptValidationError("El color del texto propuesto no es válido.");
			validateDimension(command.textSize, "tamaño del texto");
			break;
		default: assertNever(command);
	}
	return plan;
}
/** Applies one previously validated plan and returns a complete, immutable scene. */
function applyAiEditPlan(scene, plan) {
	validateAiEditPlan(plan, scene);
	let next = scene;
	let selection;
	for (const command of plan.commands) switch (command.kind) {
		case "updateInstances":
			next = {
				...next,
				instances: next.instances.map((instance) => command.ids.includes(instance.id) ? {
					...instance,
					...command.patch,
					...command.patch.width !== void 0 || command.patch.height !== void 0 ? { customSize: true } : {}
				} : instance)
			};
			break;
		case "translateInstances":
			next = {
				...next,
				instances: next.instances.map((instance) => command.ids.includes(instance.id) ? {
					...instance,
					x: clampCoordinate(instance.x + command.dx),
					y: clampCoordinate(instance.y + command.dy)
				} : instance)
			};
			break;
		case "scaleInstances":
			next = {
				...next,
				instances: next.instances.map((instance) => command.ids.includes(instance.id) ? {
					...instance,
					width: Math.min(MAX_DIMENSION$1, Math.max(1, Math.round(instance.width * command.factor))),
					height: Math.min(MAX_DIMENSION$1, Math.max(1, Math.round(instance.height * command.factor))),
					customSize: true
				} : instance)
			};
			break;
		case "duplicateInstances": {
			const copies = next.instances.filter((instance) => command.ids.includes(instance.id)).map((instance) => ({
				...instance,
				id: uid("inst"),
				x: clampCoordinate(instance.x + 20),
				y: clampCoordinate(instance.y + 20),
				locked: false
			}));
			next = {
				...next,
				instances: [...next.instances, ...copies]
			};
			selection = copies.map((instance) => instance.id);
			break;
		}
		case "deleteInstances":
			next = {
				...next,
				instances: next.instances.filter((instance) => !command.ids.includes(instance.id))
			};
			selection = [];
			break;
		case "updateObjects":
			next = applyObjectPatch(next, command.ids, command.patch);
			break;
		case "tintObjects":
			next = {
				...next,
				objects: next.objects.map((object) => {
					if (!command.ids.includes(object.id)) return object;
					const tint = {
						type: "Tint",
						name: "Tinte IA",
						parameters: {
							r: String(command.color.r),
							g: String(command.color.g),
							b: String(command.color.b)
						}
					};
					const tintIndex = object.effects.findIndex((effect) => effect.type === "Tint");
					return {
						...object,
						effects: tintIndex === -1 ? [...object.effects, tint] : object.effects.map((effect, index) => index === tintIndex ? tint : effect)
					};
				})
			};
			break;
		case "updateScene":
			next = {
				...next,
				...command.patch
			};
			break;
		case "addInstance": {
			const object = next.objects.find((item) => item.id === command.objectId);
			const instance = makeInstance(next, object, command.x, command.y);
			next = {
				...next,
				instances: [...next.instances, instance]
			};
			selection = [instance.id];
			break;
		}
		case "addText": {
			const objectId = uid("obj");
			const instanceId = uid("inst");
			const object = {
				id: objectId,
				name: uniqueObjectName(command.name, next.objects),
				type: "TextObject::Text",
				text: command.text,
				textColor: command.textColor,
				textSize: command.textSize,
				fontFamily: "Arial",
				bold: false,
				italic: false,
				alignment: "left",
				wrapping: false,
				behaviors: [],
				effects: [],
				variables: []
			};
			const instance = {
				id: instanceId,
				objectId,
				x: command.x,
				y: command.y,
				angle: 0,
				customSize: true,
				width: Math.max(160, Math.min(800, command.text.length * command.textSize * .6)),
				height: Math.max(32, command.textSize * 1.5),
				zOrder: next.instances.reduce((max, item) => Math.max(max, item.zOrder), 0) + 1,
				layer: next.activeLayer || next.layers[0]?.name || "Base layer",
				locked: false,
				hiddenAtStart: false,
				variables: [],
				effects: []
			};
			next = {
				...next,
				objects: [...next.objects, object],
				instances: [...next.instances, instance]
			};
			selection = [instanceId];
			break;
		}
		default: assertNever(command);
	}
	return {
		scene: next,
		...selection !== void 0 ? { selectedInstanceIds: selection } : {}
	};
}
function resolveTargets(normalizedPrompt, context) {
	const selectedInstances = unique(context.selectedInstanceIds).filter((id) => context.scene.instances.some((instance) => instance.id === id));
	const objectIdsFromInstances = selectedInstances.map((id) => context.scene.instances.find((instance) => instance.id === id)?.objectId).filter((id) => Boolean(id));
	const selectedObjects = unique(context.selectedObjectIds).filter((id) => context.scene.objects.some((object) => object.id === id));
	const mentionedObjects = context.scene.objects.filter((object) => normalizedPrompt.includes(normalize$2(object.name)));
	const objectIds = unique(selectedInstances.length > 0 ? objectIdsFromInstances : selectedObjects.length > 0 ? selectedObjects : mentionedObjects.map((object) => object.id));
	return {
		instanceIds: selectedInstances.length > 0 ? selectedInstances : context.scene.instances.filter((instance) => objectIds.includes(instance.objectId)).map((instance) => instance.id),
		objectIds
	};
}
function requireInstances(ids) {
	if (ids.length === 0) throw new AiPromptValidationError("Selecciona una instancia en el Canvas para modificarla.");
	return ids;
}
function requireObjects(ids) {
	if (ids.length === 0) throw new AiPromptValidationError("Selecciona un objeto o una instancia para modificarlo.");
	return ids;
}
function textObjectIds(ids, scene) {
	const textIds = ids.filter((id) => isTextObject(scene.objects.find((object) => object.id === id)));
	if (textIds.length === 0) throw new AiPromptValidationError("La selección no contiene ningún objeto de texto.");
	return textIds;
}
function isTextObject(object) {
	return Boolean(object && (object.type === "Text" || object.type === "TextObject::Text" || object.type === "BBTextObject::BBText" || object.type === "BitmapTextObject::BitmapText"));
}
function extractAbsolutePosition(value) {
	const byAxes = value.match(/\b(?:muev\w*|mov\w*|coloc\w*|posicion\w*)\b[^.]*?\bx\s*[:=]?\s*(-?\d+(?:[.,]\d+)?)[^.]*?\by\s*[:=]?\s*(-?\d+(?:[.,]\d+)?)/);
	const byPair = value.match(/\b(?:muev\w*|mov\w*|coloc\w*|posicion\w*)\b[^.]*?\b(?:a|en)\s*\(?\s*(-?\d+(?:[.,]\d+)?)\s*[,;]\s*(-?\d+(?:[.,]\d+)?)\s*\)?/);
	const match = byAxes ?? byPair;
	return match?.[1] && match[2] ? {
		x: numberOf(match[1]),
		y: numberOf(match[2])
	} : null;
}
function extractRelativeMovement(value, scene) {
	if (!/\b(?:muev\w*|mov\w*|desplaz\w*|sube|baja)\b/.test(value)) return null;
	const direction = value.match(/\b(derecha|izquierda|arriba|abajo)\b/)?.[1] ?? (value.includes("sube") ? "arriba" : value.includes("baja") ? "abajo" : null);
	if (!direction) return null;
	const after = value.match(new RegExp(`(?:${direction})\\s*(?:en\\s*)?(-?\\d+(?:[.,]\\d+)?)`));
	const before = value.match(new RegExp(`(-?\\d+(?:[.,]\\d+)?)\\s*(?:px|pixeles?)?\\s*(?:a\\s+la\\s+|hacia\\s+)?${direction}`));
	const amount = Math.abs(numberOf(after?.[1] ?? before?.[1] ?? "")) || (direction === "derecha" || direction === "izquierda" ? scene.grid.width : scene.grid.height);
	if (direction === "derecha") return {
		dx: amount,
		dy: 0
	};
	if (direction === "izquierda") return {
		dx: -amount,
		dy: 0
	};
	if (direction === "arriba") return {
		dx: 0,
		dy: -amount
	};
	return {
		dx: 0,
		dy: amount
	};
}
function extractDimensions(value) {
	const pair = value.match(/\b(?:tamano|redimension\w*|dimension\w*)\b[^.]*?(-?\d+(?:[.,]\d+)?)\s*[x×]\s*(-?\d+(?:[.,]\d+)?)/);
	if (pair?.[1] && pair[2]) return {
		width: numberOf(pair[1]),
		height: numberOf(pair[2])
	};
	const named = value.match(/\b(?:ancho|width)\s*[:=]?\s*(-?\d+(?:[.,]\d+)?)[^.]*?\b(?:alto|height)\s*[:=]?\s*(-?\d+(?:[.,]\d+)?)/);
	return named?.[1] && named[2] ? {
		width: numberOf(named[1]),
		height: numberOf(named[2])
	} : null;
}
function extractScale(value) {
	const explicit = value.match(/\b(?:escala|escal\w*)\b[^.]*?(-?\d+(?:[.,]\d+)?)\s*%/);
	if (explicit?.[1]) return numberOf(explicit[1]) / 100;
	if (/\b(?:mas grande|agranda|aumenta el tamano)\b/.test(value)) return 1.25;
	if (/\b(?:mas pequeno|reduce el tamano|encoge)\b/.test(value)) return .8;
	return null;
}
function extractAngle(value) {
	const match = value.match(/\b(?:gira\w*|rota\w*|angulo)\b[^.]*?(-?\d+(?:[.,]\d+)?)\s*(?:°|grados?)?/);
	return match?.[1] ? numberOf(match[1]) : null;
}
function visibilityFrom(value) {
	if (/\b(?:oculta\w*|esconde\w*|invisible)\b/.test(value)) return false;
	if (/\b(?:muestra\w*|visible|ensena\w*)\b/.test(value)) return true;
	return null;
}
function lockFrom(value) {
	if (/\b(?:desbloquea\w*|desbloquead\w*)\b/.test(value)) return false;
	if (/\b(?:bloquea\w*|bloquead\w*)\b/.test(value)) return true;
	return null;
}
function extractNewName(prompt) {
	return prompt.match(/\b(?:renombra(?:r)?|cambia(?:r)?\s+el\s+nombre|llama(?:r)?)(?:\s+[^,.;]+?)?\s+(?:a|como)\s+["“]?([^"”.,;]+)["”]?/iu)?.[1]?.trim() || null;
}
function extractCreatedText(prompt) {
	const quoted = prompt.match(/["“]([^"”]+)["”]/u);
	if (quoted?.[1]) return quoted[1].trim();
	return prompt.match(/\btexto\s+(?:que\s+diga|con\s+el\s+texto|con|:)?\s*(.+)$/iu)?.[1]?.replace(/\s+(?:de|con)\s+(?:color|tamaño|tamano)\b.*$/iu, "").trim() || null;
}
function extractUpdatedText(prompt) {
	const quoted = prompt.match(/["“]([^"”]+)["”]/u);
	if (quoted?.[1]) return quoted[1].trim();
	return prompt.match(/\b(?:texto|contenido)\b(?:\s+actual)?\s*(?:a|por|:|que\s+diga)\s*(.+)$/iu)?.[1]?.trim() || null;
}
function extractTextSize(value) {
	const match = value.match(/\b(?:tamano\s+(?:de\s+)?(?:fuente|letra|texto)|fuente\s+de)\b[^.]*?(-?\d+(?:[.,]\d+)?)/);
	return match?.[1] ? numberOf(match[1]) : null;
}
function parseColor(prompt) {
	const hex = prompt.match(/#([0-9a-f]{6}|[0-9a-f]{3})\b/i)?.[1];
	if (hex) {
		const expanded = hex.length === 3 ? [...hex].map((digit) => `${digit}${digit}`).join("") : hex;
		return {
			r: Number.parseInt(expanded.slice(0, 2), 16),
			g: Number.parseInt(expanded.slice(2, 4), 16),
			b: Number.parseInt(expanded.slice(4, 6), 16)
		};
	}
	const rgb = prompt.match(/rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/i);
	if (rgb?.[1] && rgb[2] && rgb[3]) {
		const color = {
			r: Number(rgb[1]),
			g: Number(rgb[2]),
			b: Number(rgb[3])
		};
		validateColor(color);
		return color;
	}
	const normalized = normalize$2(prompt);
	for (const [name, color] of Object.entries(NAMED_COLORS)) if (new RegExp(`\\b${name}\\b`).test(normalized)) return color;
	return null;
}
function isCreateInstancePrompt(value) {
	return /\b(?:crea|crear|anade|anadir|agrega|agregar|inserta|insertar)\b/.test(value) && (/\b(?:instancia|objeto|otro|otra|nuevo|nueva)\b/.test(value) || !/\b(?:color|fondo|texto)\b/.test(value));
}
function explicitlyMentionedObject(value, scene) {
	return scene.objects.slice().sort((a, b) => b.name.length - a.name.length).find((object) => value.includes(normalize$2(object.name)));
}
function validateIds(ids, allowed, label) {
	if (!Array.isArray(ids) || ids.length === 0 || ids.length > 500) throw new AiPromptValidationError(`La selección de ${label}s no es válida.`);
	if (ids.some((id) => typeof id !== "string" || !allowed.has(id))) throw new AiPromptValidationError(`La IA intentó modificar una ${label} inexistente.`);
}
function validateInstancePatch(patch) {
	const allowed = /* @__PURE__ */ new Set([
		"x",
		"y",
		"angle",
		"width",
		"height",
		"locked",
		"hiddenAtStart"
	]);
	const keys = Object.keys(patch);
	if (keys.length === 0 || keys.some((key) => !allowed.has(key))) throw new AiPromptValidationError("La modificación de instancia no está permitida.");
	if (patch.x !== void 0) validateCoordinate(patch.x, "posición X");
	if (patch.y !== void 0) validateCoordinate(patch.y, "posición Y");
	if (patch.angle !== void 0) validateCoordinate(patch.angle, "ángulo");
	if (patch.width !== void 0) validateDimension(patch.width, "ancho");
	if (patch.height !== void 0) validateDimension(patch.height, "alto");
	if (patch.locked !== void 0 && typeof patch.locked !== "boolean") throw new AiPromptValidationError("El estado de bloqueo no es válido.");
	if (patch.hiddenAtStart !== void 0 && typeof patch.hiddenAtStart !== "boolean") throw new AiPromptValidationError("El estado de visibilidad no es válido.");
}
function validateObjectPatch(patch, ids, scene) {
	const allowed = /* @__PURE__ */ new Set([
		"name",
		"text",
		"textColor",
		"textSize",
		"bold",
		"italic"
	]);
	const keys = Object.keys(patch);
	if (keys.length === 0 || keys.some((key) => !allowed.has(key))) throw new AiPromptValidationError("La modificación de objeto no está permitida.");
	if (patch.name !== void 0) {
		if (ids.length !== 1) throw new AiPromptValidationError("Solo se puede renombrar un objeto a la vez.");
		validateSafeText(patch.name, "nombre", 80);
		if (scene.objects.some((object) => object.name === patch.name && !ids.includes(object.id))) throw new AiPromptValidationError(`Ya existe un objeto llamado «${patch.name}».`);
	}
	if (patch.text !== void 0) validateSafeText(patch.text, "texto", 2e3);
	if (patch.textColor !== void 0 && !/^#[0-9a-f]{6}$/i.test(patch.textColor)) throw new AiPromptValidationError("El color de texto no es válido.");
	if (patch.textSize !== void 0) validateDimension(patch.textSize, "tamaño del texto");
	if (patch.bold !== void 0 && typeof patch.bold !== "boolean") throw new AiPromptValidationError("El estilo de negrita no es válido.");
	if (patch.italic !== void 0 && typeof patch.italic !== "boolean") throw new AiPromptValidationError("El estilo de cursiva no es válido.");
}
function validateSafeText(value, label, maxLength) {
	if (typeof value !== "string" || !value.trim() || value.length > maxLength) throw new AiPromptValidationError(`El ${label} propuesto no es válido.`);
	if (hasDisallowedControlCharacters$2(value)) throw new AiPromptValidationError(`El ${label} propuesto contiene caracteres no válidos.`);
}
function hasDisallowedControlCharacters$2(value) {
	for (let index = 0; index < value.length; index += 1) {
		const code = value.charCodeAt(index);
		if (code <= 8 || code === 11 || code === 12 || code >= 14 && code <= 31 || code === 127) return true;
	}
	return false;
}
function validateCoordinate(value, label) {
	if (!Number.isFinite(value) || Math.abs(value) > MAX_COORDINATE$1) throw new AiPromptValidationError(`La ${label} propuesta está fuera del rango permitido.`);
}
function clampCoordinate(value) {
	return Math.max(-1e6, Math.min(MAX_COORDINATE$1, value));
}
function validateDimension(value, label) {
	if (!Number.isFinite(value) || value < 1 || value > MAX_DIMENSION$1) throw new AiPromptValidationError(`El ${label} propuesto está fuera del rango permitido.`);
}
function validateColor(color) {
	if (![
		color.r,
		color.g,
		color.b
	].every((component) => Number.isInteger(component) && component >= 0 && component <= 255)) throw new AiPromptValidationError("El color propuesto no es válido.");
}
function isGDevelopColor$1(value) {
	const parts = value.split(";");
	return parts.length === 3 && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) >= 0 && Number(part) <= 255);
}
function rgbToHex$1(color) {
	return `#${[
		color.r,
		color.g,
		color.b
	].map((component) => component.toString(16).padStart(2, "0")).join("")}`;
}
function rgbToGDevelop(color) {
	return `${color.r};${color.g};${color.b}`;
}
function applyObjectPatch(scene, ids, patch) {
	const renamed = patch.name !== void 0 && ids.length === 1 ? scene.objects.find((object) => object.id === ids[0]) : void 0;
	const objects = scene.objects.map((object) => ids.includes(object.id) ? {
		...object,
		...patch
	} : object);
	if (!renamed || !patch.name || renamed.name === patch.name) return {
		...scene,
		objects
	};
	return {
		...scene,
		objects,
		groups: scene.groups.map((group) => ({
			...group,
			objects: group.objects.map((name) => name === renamed.name ? patch.name : name)
		})),
		events: scene.events.map((event) => renameObjectInEvent$2(event, renamed.name, patch.name))
	};
}
function renameObjectInEvent$2(event, from, to) {
	const renameParameters = (parameters) => Object.fromEntries(Object.entries(parameters).map(([key, value]) => [key, value === from ? to : value]));
	return {
		...event,
		conditions: event.conditions.map((instruction) => ({
			...instruction,
			parameters: renameParameters(instruction.parameters)
		})),
		actions: event.actions.map((instruction) => ({
			...instruction,
			parameters: renameParameters(instruction.parameters)
		})),
		subEvents: event.subEvents.map((child) => renameObjectInEvent$2(child, from, to))
	};
}
function makeInstance(scene, object, x, y) {
	const text = isTextObject(object);
	return {
		id: uid("inst"),
		objectId: object.id,
		x,
		y,
		angle: 0,
		customSize: false,
		width: text ? 160 : 64,
		height: text ? 32 : 64,
		zOrder: scene.instances.reduce((max, instance) => Math.max(max, instance.zOrder), 0) + 1,
		layer: scene.activeLayer || scene.layers[0]?.name || "Base layer",
		locked: false,
		hiddenAtStart: false,
		variables: [],
		effects: []
	};
}
function uniqueObjectName(base, objects) {
	const names = new Set(objects.map((object) => object.name));
	if (!names.has(base)) return base;
	let suffix = 2;
	while (names.has(`${base}${suffix}`)) suffix += 1;
	return `${base}${suffix}`;
}
function assertNever(value) {
	throw new AiPromptValidationError(`Comando de IA no permitido: ${String(value)}`);
}
//#endregion
//#region src/lib/editor/ai-logic.ts
var AiLogicValidationError = class extends Error {
	constructor(message) {
		super(message);
		this.name = "AiLogicValidationError";
	}
};
var SCHEMA = {
	SceneJustBegins: {
		slot: "condition",
		required: [],
		allowed: []
	},
	KeyPressed: {
		slot: "condition",
		required: ["key"],
		allowed: ["key"]
	},
	Collision: {
		slot: "condition",
		required: ["object", "object2"],
		allowed: [
			"object",
			"object2",
			"ignoreTouchingEdges"
		]
	},
	SourisBouton: {
		slot: "condition",
		required: ["button"],
		allowed: ["button"]
	},
	SourisSurObjet: {
		slot: "condition",
		required: ["object"],
		allowed: ["object", "considerAsTrigger"]
	},
	TimerRepeated: {
		slot: "condition",
		required: ["timer", "seconds"],
		allowed: ["timer", "seconds"]
	},
	CompareSceneVar: {
		slot: "condition",
		required: [
			"variable",
			"operator",
			"value"
		],
		allowed: [
			"variable",
			"operator",
			"value"
		]
	},
	ChangeX: {
		slot: "action",
		required: [
			"object",
			"op",
			"value"
		],
		allowed: [
			"object",
			"op",
			"value"
		]
	},
	ChangeY: {
		slot: "action",
		required: [
			"object",
			"op",
			"value"
		],
		allowed: [
			"object",
			"op",
			"value"
		]
	},
	Delete: {
		slot: "action",
		required: ["object"],
		allowed: ["object"]
	},
	Create: {
		slot: "action",
		required: [
			"object",
			"x",
			"y",
			"layer"
		],
		allowed: [
			"object",
			"x",
			"y",
			"layer"
		]
	},
	ChangeScene: {
		slot: "action",
		required: ["scene"],
		allowed: ["scene"]
	},
	PlaySound: {
		slot: "action",
		required: [
			"file",
			"volume",
			"loop"
		],
		allowed: [
			"file",
			"volume",
			"loop"
		]
	},
	ModVarScene: {
		slot: "action",
		required: [
			"variable",
			"op",
			"value"
		],
		allowed: [
			"variable",
			"op",
			"value"
		]
	},
	"TXT::SetText": {
		slot: "action",
		required: ["object", "text"],
		allowed: ["object", "text"]
	}
};
var KEY_ALIASES$1 = {
	espacio: "Space",
	space: "Space",
	enter: "Return",
	retorno: "Return",
	izquierda: "Left",
	left: "Left",
	derecha: "Right",
	right: "Right",
	arriba: "Up",
	up: "Up",
	abajo: "Down",
	down: "Down",
	escape: "Escape",
	esc: "Escape"
};
var generatedId = 0;
function compileIntentToEvents(input, context) {
	if (typeof input !== "string") throw new AiLogicValidationError("La intención debe ser texto.");
	const prompt = input.trim().replace(/\s+/g, " ");
	if (prompt.length < 4) throw new AiLogicValidationError("Describe la automatización con más detalle.");
	if (prompt.length > 600) throw new AiLogicValidationError("La intención supera 600 caracteres.");
	if (hasDisallowedControlCharacters$1(prompt)) throw new AiLogicValidationError("La intención contiene caracteres no válidos.");
	const normalized = normalize$1(prompt);
	const conditions = compileConditions(normalized, context);
	const actions = compileActions(prompt, normalized, context);
	return validateGeneratedEvents([{
		id: nextId$1("ev_ai"),
		kind: "standard",
		conditions,
		actions,
		subEvents: [],
		collapsed: false
	}], context);
}
function validateGeneratedEvents(input, context) {
	if (!Array.isArray(input) || input.length === 0 || input.length > 20) throw new AiLogicValidationError("La automatización debe generar entre 1 y 20 eventos.");
	const ids = /* @__PURE__ */ new Set();
	let instructionCount = 0;
	const validateEvent = (event, depth) => {
		if (!event || typeof event !== "object" || event.kind !== "standard") throw new AiLogicValidationError("La IA solo puede insertar eventos visuales estándar.");
		if (depth > 8) throw new AiLogicValidationError("La jerarquía de eventos es demasiado profunda.");
		validateId(event.id, ids, "evento");
		if (!Array.isArray(event.conditions) || !Array.isArray(event.actions) || !Array.isArray(event.subEvents)) throw new AiLogicValidationError("La estructura del evento no es válida.");
		if (event.actions.length === 0) throw new AiLogicValidationError("Un evento automatizado debe contener al menos una acción.");
		const validateInstruction = (instruction, expectedSlot) => {
			instructionCount += 1;
			if (instructionCount > 100) throw new AiLogicValidationError("La automatización contiene demasiadas instrucciones.");
			validateId(instruction.id, ids, "instrucción");
			const schema = SCHEMA[instruction.typeId];
			if (!schema || schema.slot !== expectedSlot) throw new AiLogicValidationError(`Instrucción no permitida: ${instruction.typeId}.`);
			if (!instruction.parameters || typeof instruction.parameters !== "object") throw new AiLogicValidationError(`Parámetros inválidos en ${instruction.typeId}.`);
			if (Object.keys(instruction.parameters).some((key) => !schema.allowed.includes(key))) throw new AiLogicValidationError(`Parámetro no permitido en ${instruction.typeId}.`);
			for (const required of schema.required) if (!String(instruction.parameters[required] ?? "").trim()) throw new AiLogicValidationError(`Falta el parámetro ${required} en ${instruction.typeId}.`);
			validateReferences(instruction, context);
			return {
				...instruction,
				inverted: instruction.inverted === true,
				parameters: { ...instruction.parameters }
			};
		};
		return {
			...event,
			conditions: event.conditions.map((instruction) => validateInstruction(instruction, "condition")),
			actions: event.actions.map((instruction) => validateInstruction(instruction, "action")),
			subEvents: event.subEvents.map((child) => validateEvent(child, depth + 1)),
			collapsed: event.collapsed === true
		};
	};
	return input.map((event) => validateEvent(event, 0));
}
/**
* Contrato paramétrico compartido entre el compilador determinista y el
* agente (tools.ts). Para instrucciones con entrada en el SCHEMA valida slot
* (condición/acción) y claves required/allowed; además, para cualquier
* instrucción que traiga referencias (object/object2/scene/file) comprueba que
* apunten a objetos/escenas/audios que existen en el proyecto.
*
* Devuelve un mensaje de error en español o null si la instrucción es válida.
*/
function instructionContractError(typeId, expectedSlot, parameters, refs) {
	const params = parameters ?? {};
	const schema = SCHEMA[typeId];
	if (schema) {
		if (schema.slot !== expectedSlot) return `La instrucción «${typeId}» debe ir en ${schema.slot === "condition" ? "condiciones" : "acciones"}.`;
		const disallowed = Object.keys(params).filter((key) => !schema.allowed.includes(key));
		if (disallowed.length > 0) return `Parámetro no permitido en ${typeId}: ${disallowed[0]}.`;
		for (const required of schema.required) if (!String(params[required] ?? "").trim()) return `Falta el parámetro ${required} en ${typeId}.`;
	}
	for (const key of ["object", "object2"]) {
		const value = params[key];
		if (value && !refs.objectNames.includes(value)) return `El objeto «${value}» no existe en la escena.`;
	}
	const scene = params["scene"];
	if (scene && refs.sceneNames && !refs.sceneNames.includes(scene)) return `La escena «${scene}» no existe.`;
	const file = params["file"];
	if (file && refs.audioResources && !refs.audioResources.includes(file)) return `El audio «${file}» no existe en los recursos.`;
	return null;
}
function compileConditions(normalized, context) {
	const every = normalized.match(/\bcada\s+(\d+(?:[.,]\d+)?)\s*(?:segundos?|s)\b/);
	if (every?.[1]) {
		const seconds = numeric(every[1]);
		if (!(seconds > 0 && seconds <= 86400)) throw new AiLogicValidationError("El intervalo debe estar entre 0 y 86400 segundos.");
		return [instruction("TimerRepeated", {
			timer: `ia_${String(seconds).replace(".", "_")}`,
			seconds: String(seconds)
		})];
	}
	if (/\b(?:al|cuando)\s+(?:comenzar|iniciar|empiece|empieza|inicio)\b|\binicio de la escena\b/.test(normalized)) return [instruction("SceneJustBegins")];
	if (/\b(?:colisiona|colisione|choque|toca|toque)\b/.test(normalized)) {
		const objects = mentionedObjects(normalized, context.objectNames);
		if (objects.length < 2) throw new AiLogicValidationError("Indica los dos objetos de la colisión.");
		return [instruction("Collision", {
			object: objects[0],
			object2: objects[1],
			ignoreTouchingEdges: "no"
		})];
	}
	if (/\b(?:clic|click|toque|tocar|puntero)\b/.test(normalized)) {
		const object = mentionedObjects(normalized, context.objectNames)[0];
		if (!object) throw new AiLogicValidationError("Indica el objeto que debe recibir el clic.");
		return [instruction("SourisSurObjet", {
			object,
			considerAsTrigger: "yes"
		}), instruction("SourisBouton", { button: "Left" })];
	}
	if (/\b(?:tecla|presione|presionar|pulse|pulsar)\b/.test(normalized)) return [instruction("KeyPressed", { key: keyFrom(normalized) })];
	const variable = normalized.match(/\b(?:variable\s+)?([a-z_][a-z0-9_]*)\s+(?:sea|es|llegue a)\s+(mayor|menor|igual)(?:\s+que|\s+a)?\s*(-?\d+(?:[.,]\d+)?)/);
	if (variable?.[1] && variable[2] && variable[3]) return [instruction("CompareSceneVar", {
		variable: variable[1],
		operator: variable[2] === "mayor" ? ">" : variable[2] === "menor" ? "<" : "=",
		value: String(numeric(variable[3]))
	})];
	throw new AiLogicValidationError("No pude identificar cuándo debe ejecutarse. Usa «al comenzar», «al presionar», «cada N segundos», «al hacer clic» o una colisión.");
}
function compileActions(original, normalized, context) {
	const variableChange = normalized.match(/\b(?:suma|sumar|anade|anadir|incrementa|incrementar)\s+(-?\d+(?:[.,]\d+)?)\s+(?:a\s+)?(?:la\s+)?variable\s+([a-z_][a-z0-9_]*)/);
	if (variableChange?.[1] && variableChange[2]) return [instruction("ModVarScene", {
		variable: variableChange[2],
		op: "add",
		value: String(numeric(variableChange[1]))
	})];
	const createMatch = normalized.match(/\b(?:crea|crear|genera|generar|anade|anadir)\b/);
	if (createMatch) {
		const object = objectAfter(normalized, createMatch.index ?? 0, context.objectNames);
		if (!object) throw new AiLogicValidationError("Indica qué objeto debe crearse.");
		const coordinates = normalized.match(/\b(?:en|posicion)\s*\(?\s*(-?\d+(?:[.,]\d+)?)\s*[,;]\s*(-?\d+(?:[.,]\d+)?)\s*\)?/);
		return [instruction("Create", {
			object,
			x: coordinates?.[1] ? String(numeric(coordinates[1])) : "0",
			y: coordinates?.[2] ? String(numeric(coordinates[2])) : "0",
			layer: context.activeLayer ?? "Base layer"
		})];
	}
	const deleteMatch = normalized.match(/\b(?:elimina|eliminar|borra|borrar|destruye|destruir)\b/);
	if (deleteMatch) {
		const object = objectAfter(normalized, deleteMatch.index ?? 0, context.objectNames);
		if (!object) throw new AiLogicValidationError("Indica qué objeto debe eliminarse.");
		return [instruction("Delete", { object })];
	}
	const sceneMatch = normalized.match(/\b(?:cambia|cambiar|ve|ir)\s+(?:a\s+)?(?:la\s+)?escena\b/);
	if (sceneMatch) {
		const scene = namedReferenceAfter(normalized, sceneMatch.index ?? 0, context.sceneNames ?? []);
		if (!scene) throw new AiLogicValidationError("Indica una escena existente como destino.");
		return [instruction("ChangeScene", { scene })];
	}
	const soundMatch = normalized.match(/\b(?:reproduce|reproducir|toca|tocar)\s+(?:el\s+)?(?:sonido|audio)\b/);
	if (soundMatch) {
		const known = namedReferenceAfter(normalized, soundMatch.index ?? 0, context.audioResources ?? []);
		const quoted = original.match(/["“]([^"”]+)["”]/u)?.[1];
		const file = known ?? quoted;
		if (!file) throw new AiLogicValidationError("Indica un recurso de audio existente.");
		return [instruction("PlaySound", {
			file,
			volume: "100",
			loop: "no"
		})];
	}
	const moveMatch = normalized.match(/\b(?:mueve|mover|desplaza|desplazar)\b/);
	if (moveMatch) {
		const object = objectAfter(normalized, moveMatch.index ?? 0, context.objectNames);
		if (!object) throw new AiLogicValidationError("Indica qué objeto debe moverse.");
		const amountMatch = normalized.match(/(-?\d+(?:[.,]\d+)?)\s*(?:px|pixeles?)?\b/);
		const amount = Math.abs(amountMatch?.[1] ? numeric(amountMatch[1]) : 10);
		if (!Number.isFinite(amount) || amount > 1e6) throw new AiLogicValidationError("La distancia indicada no es válida.");
		if (/\b(?:izquierda|left)\b/.test(normalized)) return [instruction("ChangeX", {
			object,
			op: "add",
			value: String(-amount)
		})];
		if (/\b(?:derecha|right)\b/.test(normalized)) return [instruction("ChangeX", {
			object,
			op: "add",
			value: String(amount)
		})];
		if (/\b(?:arriba|up)\b/.test(normalized)) return [instruction("ChangeY", {
			object,
			op: "add",
			value: String(-amount)
		})];
		if (/\b(?:abajo|down)\b/.test(normalized)) return [instruction("ChangeY", {
			object,
			op: "add",
			value: String(amount)
		})];
		throw new AiLogicValidationError("Indica si el movimiento es arriba, abajo, izquierda o derecha.");
	}
	throw new AiLogicValidationError("No pude identificar la acción. Prueba crear, mover, eliminar, reproducir audio o cambiar de escena.");
}
function validateReferences(instruction, context) {
	for (const key of ["object", "object2"]) {
		const value = instruction.parameters[key];
		if (value && !context.objectNames.includes(value)) throw new AiLogicValidationError(`El objeto «${value}» no existe en la escena.`);
	}
	const scene = instruction.parameters["scene"];
	if (scene && context.sceneNames && !context.sceneNames.includes(scene)) throw new AiLogicValidationError(`La escena «${scene}» no existe.`);
	const file = instruction.parameters["file"];
	if (file && context.audioResources && !context.audioResources.includes(file)) throw new AiLogicValidationError(`El audio «${file}» no existe en los recursos.`);
}
function validateId(id, ids, label) {
	if (typeof id !== "string" || !/^[A-Za-z0-9:_-]{2,120}$/.test(id) || ids.has(id)) throw new AiLogicValidationError(`Identificador de ${label} inválido o duplicado.`);
	ids.add(id);
}
function instruction(typeId, parameters = {}) {
	return {
		id: nextId$1("in_ai"),
		typeId,
		inverted: false,
		parameters
	};
}
function nextId$1(prefix) {
	generatedId += 1;
	return `${prefix}_${Date.now().toString(36)}_${generatedId.toString(36)}`;
}
function keyFrom(value) {
	for (const [alias, key] of Object.entries(KEY_ALIASES$1)) if (new RegExp(`\\b${alias}\\b`).test(value)) return key;
	const literal = value.match(/\b(?:tecla|presione|presionar|pulse|pulsar)\s+([a-z0-9])\b/)?.[1];
	if (literal) return literal.toUpperCase();
	throw new AiLogicValidationError("Indica la tecla que debe activarlo.");
}
function mentionedObjects(value, names) {
	return names.map((name) => ({
		name,
		index: value.indexOf(normalize$1(name))
	})).filter((entry) => entry.index >= 0).sort((a, b) => a.index - b.index).map((entry) => entry.name).filter((name, index, all) => all.indexOf(name) === index);
}
function objectAfter(value, index, names) {
	return namedReferenceAfter(value, index, names) ?? mentionedObjects(value, names)[0];
}
function namedReferenceAfter(value, index, names) {
	const suffix = value.slice(index);
	return names.map((name) => ({
		name,
		index: suffix.indexOf(normalize$1(name))
	})).filter((entry) => entry.index >= 0).sort((a, b) => a.index - b.index)[0]?.name;
}
function normalize$1(value) {
	return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
function numeric(value) {
	return Number(value.replace(",", "."));
}
function hasDisallowedControlCharacters$1(value) {
	for (let index = 0; index < value.length; index += 1) {
		const code = value.charCodeAt(index);
		if (code <= 8 || code === 11 || code === 12 || code >= 14 && code <= 31 || code === 127) return true;
	}
	return false;
}
//#endregion
//#region src/lib/agent/capabilities.ts
/** Behaviors the GameRuntime simulates (catalog `runtime:` field). */
var SUPPORTED_BEHAVIOR_TYPES = [
	"PlatformBehavior::PlatformerObjectBehavior",
	"PlatformBehavior::PlatformBehavior",
	"AnchorBehavior::AnchorBehavior",
	"Flash::Flash",
	"Health::Health",
	"Tween::TweenBehavior",
	"DraggableBehavior::Draggable"
];
/** In the editor catalog but NOT simulated by the runtime (yet). */
var CATALOG_ONLY_BEHAVIOR_TYPES = ["Physics2::Physics2Behavior", "PathfindingBehavior::PathfindingBehavior"];
/**
* Instruction typeIds handled by the runtime dispatch
* (`src/lib/runtime/engine.ts`). Conditions and actions share the space;
* the engine fails safely on anything else, and the agent refuses earlier.
*/
var SUPPORTED_INSTRUCTION_TYPES = [
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
	"EndScene"
];
/** Object types the agent may create (renderer-drawn: sprite-like + text-like). */
var CREATABLE_OBJECT_TYPES = [
	"Sprite",
	"SpriteObject::SpriteSheet",
	"TiledSpriteObject::TiledSprite",
	"PanelSpriteObject::PanelSprite",
	"TextObject::Text",
	"BBTextObject::BBText",
	"BitmapTextObject::BitmapText"
];
var isSupportedBehavior = (type) => SUPPORTED_BEHAVIOR_TYPES.includes(type);
var isCatalogOnlyBehavior = (type) => CATALOG_ONLY_BEHAVIOR_TYPES.includes(type);
var isSupportedInstruction = (type) => SUPPORTED_INSTRUCTION_TYPES.includes(type);
var isCreatableObjectType = (type) => CREATABLE_OBJECT_TYPES.includes(type);
/**
* Default properties for the supported behaviors (mirrors the catalog defaults
// so agent-created objects behave out of the box). Values are strings, as the
* project model stores behavior properties.
*/
var BEHAVIOR_DEFAULT_PROPERTIES = {
	"PlatformBehavior::PlatformerObjectBehavior": {
		acceleration: "800",
		maxSpeed: "250",
		friction: "20",
		jumpSpeed: "600",
		jumpSustain: "300",
		canGoDownFromJumpthru: "yes",
		canGrabPlatforms: "no",
		gravity: "1800",
		maxFallingSpeed: "900"
	},
	"PlatformBehavior::PlatformBehavior": {
		platformType: "Normal platform",
		canBeGrabbed: "yes",
		yGrabOffset: "0"
	},
	"AnchorBehavior::AnchorBehavior": {},
	"Flash::Flash": { duration: "1" },
	"Health::Health": {
		initialHealth: "100",
		maxHealth: "100",
		invincibilityDuration: "1"
	},
	"Tween::TweenBehavior": {},
	"DraggableBehavior::Draggable": {
		canBeDragged: "yes",
		mouseButton: "Left"
	}
};
/**
* Honest message for a capability the runtime does not have, following the
* brief's example: never claim "done", explain and offer an alternative.
*/
function unsupportedBehaviorMessage(type) {
	if (isCatalogOnlyBehavior(type)) return `No puedo añadir el comportamiento «${type}» porque el runtime aún no lo simula. Puedo lograr el efecto con movimiento, colisiones, timers o tweens si quieres.`;
	return `No puedo añadir el comportamiento «${type}» porque no existe en el catálogo de comportamientos.`;
}
function unsupportedInstructionMessage(type) {
	return `No puedo usar la instrucción «${type}» porque el runtime no la soporta. Instrucciones disponibles: ${SUPPORTED_INSTRUCTION_TYPES.length}.`;
}
var MAX_COORDINATE = 1e6;
var MAX_DIMENSION = 1e5;
/** Rejects control characters that would corrupt the project JSON. */
function hasDisallowedControlCharacters(value) {
	for (let index = 0; index < value.length; index += 1) {
		const code = value.charCodeAt(index);
		if (code <= 8 || code === 11 || code === 12 || code >= 14 && code <= 31 || code === 127) return true;
	}
	return false;
}
/** Validates a user/agent supplied name and returns a friendly error or null. */
function safeName(value, label, maxLength = 80) {
	if (typeof value !== "string" || value.trim().length === 0) return `El ${label} propuesto no es válido.`;
	const name = value.trim();
	if (name.length > maxLength) return `El ${label} no puede superar ${maxLength} caracteres.`;
	if (hasDisallowedControlCharacters(name)) return `El ${label} propuesto contiene caracteres no válidos.`;
	return null;
}
/** Validates text content (object text, scene descriptions…). */
function safeText(value, label, maxLength) {
	if (typeof value !== "string" || value.length > maxLength) return `El ${label} propuesto no es válido.`;
	if (hasDisallowedControlCharacters(value)) return `El ${label} propuesto contiene caracteres no válidos.`;
	return null;
}
/** Finite number inside a closed range. */
function inRange(value, label, min, max) {
	return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}
/** GDevelop "R;G;B" scene color, e.g. "230;235;255". */
function isGDevelopColor(value) {
	if (typeof value !== "string") return false;
	const parts = value.split(";");
	return parts.length === 3 && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) >= 0 && Number(part) <= 255);
}
/** "#RRGGBB" hex color. */
function isHexColor(value) {
	return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}
//#endregion
//#region src/lib/agent/tools.ts
var sceneOf = (project, sceneName) => project.scenes.find((scene) => scene.name === sceneName);
var requireScene = (project, sceneName) => {
	if (typeof sceneName !== "string" || sceneName.trim().length === 0) return null;
	return sceneOf(project, sceneName) ?? null;
};
var sceneError = (sceneName) => typeof sceneName === "string" && sceneName.trim().length > 0 ? null : "Falta indicar la escena.";
var requireObject = (scene, objectId) => {
	if (typeof objectId !== "string") return null;
	return scene.objects.find((object) => object.id === objectId) ?? null;
};
var requireInstance = (scene, instanceId) => {
	if (typeof instanceId !== "string") return null;
	return scene.instances.find((instance) => instance.id === instanceId) ?? null;
};
var requireObjectName = (scene, name) => {
	if (typeof name !== "string" || name.trim().length === 0) return null;
	return scene.objects.find((object) => object.name === name) ?? null;
};
var isRecord$2 = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
var ok = (project, changes = {}) => ({
	project,
	diagnostics: changes.diagnostics ?? [],
	created: changes.created ?? [],
	modified: changes.modified ?? [],
	deleted: changes.deleted ?? []
});
var defaultVariableValue = (type) => type === "boolean" ? "false" : type === "string" ? "" : "0";
var toInstruction = (payload) => ({
	id: payload.id ?? uid("inst"),
	typeId: payload.typeId,
	inverted: payload.inverted === true,
	parameters: payload.parameters ?? {}
});
var validateInstructions = (instructions, label, expectedSlot, scene, project) => {
	if (instructions === void 0) return null;
	if (!Array.isArray(instructions) || instructions.length > 50) return `${label}: lista de instrucciones no válida (máximo 50).`;
	const refs = {
		objectNames: scene?.objects.map((object) => object.name) ?? [],
		sceneNames: project.scenes.map((entry) => entry.name),
		audioResources: project.resources.filter((resource) => resource.kind === "audio").map((resource) => resource.name)
	};
	for (const item of instructions) {
		if (!isRecord$2(item) || typeof item["typeId"] !== "string") return `${label}: cada instrucción necesita un typeId.`;
		if (!isSupportedInstruction(item["typeId"])) return unsupportedInstructionMessage(item["typeId"]);
		if (item["parameters"] !== void 0 && !isRecord$2(item["parameters"])) return `${label}: los parámetros de «${item["typeId"]}» no son válidos.`;
		const contractError = instructionContractError(item["typeId"], expectedSlot, item["parameters"] ?? {}, refs);
		if (contractError) return `${label}: ${contractError}`;
	}
	return null;
};
var cloneEvent$1 = (event) => ({
	...event,
	id: uid("event"),
	conditions: event.conditions.map((instruction) => ({
		...instruction,
		id: uid("inst")
	})),
	actions: event.actions.map((instruction) => ({
		...instruction,
		id: uid("inst")
	})),
	subEvents: event.subEvents.map(cloneEvent$1)
});
var maxZOrder = (scene) => scene.instances.reduce((max, instance) => Math.max(max, instance.zOrder), 0) + 1;
var layerOf = (scene) => scene.activeLayer || scene.layers[0]?.name || "Base layer";
var TOOL_REGISTRY = {
	create_scene: {
		name: "create_scene",
		label: "Crear escena",
		description: "Crea una escena vacía con su capa base.",
		mutates: true,
		supported: true,
		validate: (payload, project) => {
			if (!isRecord$2(payload)) return "create_scene: payload no válido.";
			const p = payload;
			const error = safeName(p.name, "nombre de escena");
			if (error) return error;
			if (sceneOf(project, p.name.trim())) return `Ya existe una escena llamada «${p.name.trim()}».`;
			return null;
		},
		run: (project, payload) => {
			const name = payload.name.trim();
			return ok({
				...project,
				scenes: [...project.scenes, makeScene(name)]
			}, { created: [{
				kind: "scene",
				id: name,
				name
			}] });
		}
	},
	duplicate_scene: {
		name: "duplicate_scene",
		label: "Duplicar escena",
		description: "Copia una escena con objetos, instancias y eventos nuevos.",
		mutates: true,
		supported: true,
		validate: (payload, project) => {
			if (!isRecord$2(payload)) return "duplicate_scene: payload no válido.";
			const p = payload;
			if (!requireScene(project, p.sceneName)) return `No existe la escena «${String(p.sceneName)}».`;
			let error = null;
			if (p.newName !== void 0) {
				error = safeName(p.newName, "nuevo nombre de escena");
				if (!error) {
					const candidate = p.newName.trim();
					if (sceneOf(project, candidate)) error = `Ya existe una escena llamada «${candidate}».`;
				}
			}
			return error;
		},
		run: (project, payload) => {
			const p = payload;
			const source = requireScene(project, p.sceneName);
			const name = p.newName?.trim() ?? newNameGenerator(`${source.name} (copia)`, project.scenes.map((s) => s.name));
			const idMap = /* @__PURE__ */ new Map();
			const objects = source.objects.map((object) => {
				const nextId = uid("obj");
				idMap.set(object.id, nextId);
				return {
					...object,
					id: nextId
				};
			});
			const copy = {
				...source,
				name,
				objects,
				instances: source.instances.map((instance) => ({
					...instance,
					id: uid("inst"),
					objectId: idMap.get(instance.objectId) ?? instance.objectId
				})),
				events: source.events.map(cloneEvent$1)
			};
			return ok({
				...project,
				scenes: [...project.scenes, copy]
			}, { created: [{
				kind: "scene",
				id: name,
				name
			}] });
		}
	},
	update_scene: {
		name: "update_scene",
		label: "Modificar escena",
		description: "Cambia propiedades seguras de la escena (color de fondo).",
		mutates: true,
		supported: true,
		validate: (payload, project) => {
			if (!isRecord$2(payload)) return "update_scene: payload no válido.";
			const p = payload;
			const error = sceneError(p.sceneName);
			if (error) return error;
			if (!requireScene(project, p.sceneName)) return `No existe la escena «${String(p.sceneName)}».`;
			if (p.backgroundColor !== void 0 && !isGDevelopColor(p.backgroundColor)) return "El color de fondo debe tener el formato «R;G;B» (p. ej. «230;235;255»).";
			if (p.backgroundColor === void 0) return "update_scene: indica al menos una propiedad (backgroundColor).";
			return null;
		},
		run: (project, payload) => {
			const p = payload;
			return ok(withScene(project, p.sceneName, (scene) => ({
				...scene,
				...p.backgroundColor !== void 0 ? { backgroundColor: p.backgroundColor } : {}
			})), { modified: [{
				kind: "scene",
				id: p.sceneName,
				name: p.sceneName
			}] });
		}
	},
	create_object: {
		name: "create_object",
		label: "Crear objeto",
		description: "Crea una definición de objeto (Sprite, Texto, Mosaico…) en la escena. Usa tipos que el runtime dibuja.",
		mutates: true,
		supported: true,
		validate: (payload, project) => {
			if (!isRecord$2(payload)) return "create_object: payload no válido.";
			const p = payload;
			const sceneError = safeName(p.name, "nombre de objeto");
			if (sceneError) return sceneError;
			if (!isCreatableObjectType(String(p.type))) return `El tipo de objeto «${String(p.type)}» no está soportado por el runtime. Usa Sprite, Texto, Mosaico, Sprite de Panel, Hoja de sprites, Texto BBCode o Bitmap Text.`;
			const scene = requireScene(project, p.sceneName);
			if (!scene) return `No existe la escena «${String(p.sceneName)}».`;
			const name = p.name.trim();
			if (scene.objects.some((object) => object.name === name)) return `Ya existe un objeto llamado «${name}» en la escena.`;
			if ((String(p.type) === "TextObject::Text" || String(p.type) === "BBTextObject::BBText" || String(p.type) === "BitmapTextObject::BitmapText") && p.text !== void 0) return safeText(p.text, "texto", 2e3);
			return null;
		},
		run: (project, payload) => {
			const p = payload;
			const isText = p.type === "TextObject::Text" || p.type === "BBTextObject::BBText" || p.type === "BitmapTextObject::BitmapText";
			const object = {
				id: uid("obj"),
				name: p.name.trim(),
				type: p.type,
				behaviors: [],
				effects: [],
				variables: [],
				...isText ? {
					text: p.text ?? "Texto",
					textColor: "#ffffff",
					textSize: 24,
					fontFamily: "Arial",
					bold: false,
					italic: false,
					alignment: "left",
					wrapping: false
				} : {},
				...!isText && p.asset !== void 0 ? { asset: p.asset } : {}
			};
			return ok(withScene(project, p.sceneName, (scene) => ({
				...scene,
				objects: [...scene.objects, object]
			})), { created: [{
				kind: "object",
				id: object.id,
				name: object.name
			}] });
		}
	},
	update_object: {
		name: "update_object",
		label: "Modificar objeto",
		description: "Cambia propiedades seguras de un objeto: nombre (sincroniza eventos y grupos), texto, color, tamaño, negrita, cursiva.",
		mutates: true,
		supported: true,
		validate: (payload, project) => {
			if (!isRecord$2(payload)) return "update_object: payload no válido.";
			const p = payload;
			const scene = requireScene(project, p.sceneName);
			if (!scene) return `No existe la escena «${String(p.sceneName)}».`;
			const object = requireObject(scene, p.objectId);
			if (!object) return `No existe el objeto con id «${String(p.objectId)}».`;
			const patch = p.patch;
			if (!isRecord$2(patch) || Object.keys(patch).length === 0) return "update_object: el patch está vacío.";
			const allowed = /* @__PURE__ */ new Set([
				"name",
				"text",
				"textColor",
				"textSize",
				"bold",
				"italic"
			]);
			if (Object.keys(patch).some((key) => !allowed.has(key))) return "update_object: solo se permiten name, text, textColor, textSize, bold, italic.";
			if (patch.name !== void 0) {
				const error = safeName(patch.name, "nuevo nombre");
				if (error) return error;
				const candidate = patch.name.trim();
				if (scene.objects.some((item) => item.name === candidate && item.id !== object.id)) return `Ya existe un objeto llamado «${candidate}».`;
			}
			if (patch.text !== void 0 && safeText(patch.text, "texto", 2e3)) return safeText(patch.text, "texto", 2e3);
			if (patch.textColor !== void 0 && !isHexColor(patch.textColor)) return "textColor debe ser un color hexadecimal (#RRGGBB).";
			if (patch.textSize !== void 0 && !inRange(patch.textSize, "textSize", 4, 512)) return "textSize debe estar entre 4 y 512.";
			return null;
		},
		run: (project, payload) => {
			const p = payload;
			const oldName = sceneOf(project, p.sceneName)?.objects.find((item) => item.id === p.objectId)?.name;
			let renameFrom = null;
			let renameTo = null;
			if (p.patch.name && oldName && p.patch.name !== oldName) {
				renameFrom = oldName;
				renameTo = p.patch.name;
			}
			const next = withScene(project, p.sceneName, (scene) => {
				const objects = scene.objects.map((item) => item.id === p.objectId ? {
					...item,
					...p.patch
				} : item);
				if (renameFrom && renameTo) return {
					...scene,
					objects,
					groups: scene.groups.map((group) => ({
						...group,
						objects: group.objects.map((name) => name === renameFrom ? renameTo : name)
					})),
					events: scene.events.map((event) => renameObjectInEvent$1(event, renameFrom, renameTo))
				};
				return {
					...scene,
					objects
				};
			});
			const object = sceneOf(project, p.sceneName)?.objects.find((item) => item.id === p.objectId);
			return ok(next, { modified: [{
				kind: "object",
				id: p.objectId,
				name: object?.name ?? p.objectId
			}] });
		}
	},
	delete_object: {
		name: "delete_object",
		label: "Eliminar objeto",
		description: "Elimina la definición de objeto, sus instancias y referencias en grupos.",
		mutates: true,
		supported: true,
		validate: (payload, project) => {
			if (!isRecord$2(payload)) return "delete_object: payload no válido.";
			const p = payload;
			const scene = requireScene(project, p.sceneName);
			if (!scene) return `No existe la escena «${String(p.sceneName)}».`;
			if (!requireObject(scene, p.objectId)) return `No existe el objeto con id «${String(p.objectId)}».`;
			return null;
		},
		run: (project, payload) => {
			const p = payload;
			const target = requireObject(requireScene(project, p.sceneName), p.objectId);
			const next = withScene(project, p.sceneName, (scene) => ({
				...scene,
				objects: scene.objects.filter((item) => item.id !== p.objectId),
				instances: scene.instances.filter((instance) => instance.objectId !== p.objectId),
				groups: scene.groups.map((group) => ({
					...group,
					objects: group.objects.filter((name) => name !== target.name)
				}))
			}));
			const removedInstances = requireScene(project, p.sceneName).instances.filter((instance) => instance.objectId === p.objectId).length;
			return ok(next, { deleted: [{
				kind: "object",
				id: target.id,
				name: target.name
			}, ...removedInstances > 0 ? [{
				kind: "instance",
				id: p.objectId,
				name: `${removedInstances} instancias de ${target.name}`
			}] : []] });
		}
	},
	create_instance: {
		name: "create_instance",
		label: "Crear instancia",
		description: "Coloca una instancia de un objeto existente en la escena.",
		mutates: true,
		supported: true,
		validate: (payload, project) => {
			if (!isRecord$2(payload)) return "create_instance: payload no válido.";
			const p = payload;
			const scene = requireScene(project, p.sceneName);
			if (!scene) return `No existe la escena «${String(p.sceneName)}».`;
			if (!requireObject(scene, p.objectId)) return `No existe el objeto con id «${String(p.objectId)}».`;
			if (!inRange(p.x, "posición X", -1e6, 1e6)) return `x debe estar entre ${-MAX_COORDINATE} y ${MAX_COORDINATE}.`;
			if (!inRange(p.y, "posición Y", -1e6, 1e6)) return `y debe estar entre ${-MAX_COORDINATE} y ${MAX_COORDINATE}.`;
			if (p.width !== void 0 && !inRange(p.width, "ancho", 1, 1e5)) return `width debe estar entre 1 y ${MAX_DIMENSION}.`;
			if (p.height !== void 0 && !inRange(p.height, "alto", 1, 1e5)) return `height debe estar entre 1 y ${MAX_DIMENSION}.`;
			return null;
		},
		run: (project, payload) => {
			const p = payload;
			const scene = requireScene(project, p.sceneName);
			const object = requireObject(scene, p.objectId);
			const isText = object.type === "TextObject::Text" || object.type === "BBTextObject::BBText" || object.type === "BitmapTextObject::BitmapText";
			const instance = {
				id: uid("inst"),
				objectId: object.id,
				x: p.x,
				y: p.y,
				angle: 0,
				customSize: p.width !== void 0 || p.height !== void 0,
				width: p.width ?? (isText ? 160 : 64),
				height: p.height ?? (isText ? 32 : 64),
				zOrder: maxZOrder(scene),
				layer: layerOf(scene),
				locked: false,
				hiddenAtStart: false,
				variables: [],
				effects: []
			};
			return ok(withScene(project, p.sceneName, (current) => ({
				...current,
				instances: [...current.instances, instance]
			})), { created: [{
				kind: "instance",
				id: instance.id,
				name: `Instancia de ${object.name}`
			}] });
		}
	},
	move_instance: {
		name: "move_instance",
		label: "Mover instancia",
		description: "Mueve una instancia a una posición absoluta.",
		mutates: true,
		supported: true,
		validate: (payload, project) => {
			if (!isRecord$2(payload)) return "move_instance: payload no válido.";
			const p = payload;
			const scene = requireScene(project, p.sceneName);
			if (!scene) return `No existe la escena «${String(p.sceneName)}».`;
			if (!requireInstance(scene, p.instanceId)) return `No existe la instancia con id «${String(p.instanceId)}».`;
			if (!inRange(p.x, "posición X", -1e6, 1e6)) return `x debe estar entre ${-MAX_COORDINATE} y ${MAX_COORDINATE}.`;
			if (!inRange(p.y, "posición Y", -1e6, 1e6)) return `y debe estar entre ${-MAX_COORDINATE} y ${MAX_COORDINATE}.`;
			return null;
		},
		run: (project, payload) => {
			const p = payload;
			return ok(withScene(project, p.sceneName, (scene) => ({
				...scene,
				instances: scene.instances.map((instance) => instance.id === p.instanceId ? {
					...instance,
					x: p.x,
					y: p.y
				} : instance)
			})), { modified: [{
				kind: "instance",
				id: p.instanceId,
				name: p.instanceId
			}] });
		}
	},
	resize_instance: {
		name: "resize_instance",
		label: "Redimensionar instancia",
		description: "Cambia el tamaño de una instancia (activa el tamaño personalizado).",
		mutates: true,
		supported: true,
		validate: (payload, project) => {
			if (!isRecord$2(payload)) return "resize_instance: payload no válido.";
			const p = payload;
			const scene = requireScene(project, p.sceneName);
			if (!scene) return `No existe la escena «${String(p.sceneName)}».`;
			if (!requireInstance(scene, p.instanceId)) return `No existe la instancia con id «${String(p.instanceId)}».`;
			if (!inRange(p.width, "ancho", 1, 1e5)) return `width debe estar entre 1 y ${MAX_DIMENSION}.`;
			if (!inRange(p.height, "alto", 1, 1e5)) return `height debe estar entre 1 y ${MAX_DIMENSION}.`;
			return null;
		},
		run: (project, payload) => {
			const p = payload;
			return ok(withScene(project, p.sceneName, (scene) => ({
				...scene,
				instances: scene.instances.map((instance) => instance.id === p.instanceId ? {
					...instance,
					width: p.width,
					height: p.height,
					customSize: true
				} : instance)
			})), { modified: [{
				kind: "instance",
				id: p.instanceId,
				name: p.instanceId
			}] });
		}
	},
	assign_sprite: {
		name: "assign_sprite",
		label: "Asignar sprite",
		description: "Asigna un recurso existente (o placeholder vacío) como imagen del objeto, actualizando el primer frame de su animación.",
		mutates: true,
		supported: true,
		validate: (payload, project) => {
			if (!isRecord$2(payload)) return "assign_sprite: payload no válido.";
			const p = payload;
			const scene = requireScene(project, p.sceneName);
			if (!scene) return `No existe la escena «${String(p.sceneName)}».`;
			if (!requireObject(scene, p.objectId)) return `No existe el objeto con id «${String(p.objectId)}».`;
			const resource = p.resource;
			if (typeof resource !== "string") return "assign_sprite: resource debe ser un nombre.";
			if (resource.length > 0) {
				if (!(project.resources.some((entry) => entry.name === resource || entry.file === resource) || /^(?:data:|blob:|https?:\/\/)/i.test(resource))) return `El recurso «${resource}» no existe en el proyecto. Etapa 1 usa recursos existentes.`;
			}
			return null;
		},
		run: (project, payload) => {
			const p = payload;
			return ok(withScene(project, p.sceneName, (scene) => ({
				...scene,
				objects: scene.objects.map((object) => {
					if (object.id !== p.objectId) return object;
					const animations = object.animations ?? [];
					const first = animations[0];
					const nextAnimations = animations.length === 0 ? [{
						name: "Animación 1",
						loops: true,
						timeBetweenFrames: 1,
						images: [{
							image: p.resource,
							originX: 0,
							originY: 0,
							centerX: 32,
							centerY: 32,
							opacity: 100
						}],
						points: []
					}] : first ? animations.map((animation, index) => index === 0 ? {
						...animation,
						images: animation.images.map((image, index2) => index2 === 0 ? {
							...image,
							image: p.resource
						} : image)
					} : animation) : animations;
					return {
						...object,
						...p.resource.length > 0 ? { asset: p.resource } : {},
						...nextAnimations.length > 0 ? { animations: nextAnimations } : {}
					};
				})
			})), { modified: [{
				kind: "object",
				id: p.objectId,
				name: p.objectId
			}] });
		}
	},
	create_animation: {
		name: "create_animation",
		label: "Crear animación",
		description: "Añade una animación (un frame con el recurso indicado o el actual) a un objeto.",
		mutates: true,
		supported: true,
		validate: (payload, project) => {
			if (!isRecord$2(payload)) return "create_animation: payload no válido.";
			const p = payload;
			const scene = requireScene(project, p.sceneName);
			if (!scene) return `No existe la escena «${String(p.sceneName)}».`;
			const object = requireObject(scene, p.objectId);
			if (!object) return `No existe el objeto con id «${String(p.objectId)}».`;
			const error = safeName(p.name, "nombre de animación");
			if (error) return error;
			const name = p.name.trim();
			if ((object.animations ?? []).some((animation) => animation.name === name)) return `El objeto ya tiene una animación llamada «${name}».`;
			return null;
		},
		run: (project, payload) => {
			const p = payload;
			const object = requireObject(requireScene(project, p.sceneName), p.objectId);
			const resource = p.resource ?? object.asset ?? object.animations?.[0]?.images[0]?.image ?? "";
			const animation = {
				name: p.name.trim(),
				loops: true,
				timeBetweenFrames: 1,
				images: [{
					image: resource,
					originX: 0,
					originY: 0,
					centerX: 32,
					centerY: 32,
					opacity: 100
				}],
				points: []
			};
			return ok(withScene(project, p.sceneName, (current) => ({
				...current,
				objects: current.objects.map((item) => item.id === p.objectId ? {
					...item,
					animations: [...item.animations ?? [], animation]
				} : item)
			})), { created: [{
				kind: "animation",
				id: animation.name,
				name: `${object.name} · ${animation.name}`
			}] });
		}
	},
	add_behavior: {
		name: "add_behavior",
		label: "Añadir comportamiento",
		description: "Añade un comportamiento que el runtime SIMULA (plataformas, anclar, salud, destello, tween, arrastrable). Los demás se rechazan con explicación.",
		mutates: true,
		supported: true,
		validate: (payload, project) => {
			if (!isRecord$2(payload)) return "add_behavior: payload no válido.";
			const p = payload;
			const scene = requireScene(project, p.sceneName);
			if (!scene) return `No existe la escena «${String(p.sceneName)}».`;
			const object = requireObject(scene, p.objectId);
			if (!object) return `No existe el objeto con id «${String(p.objectId)}».`;
			const type = p.type;
			if (typeof type !== "string" || type.length === 0) return "add_behavior: indica el typeId del comportamiento.";
			if (!isSupportedBehavior(type)) return unsupportedBehaviorMessage(type);
			const name = typeof p.name === "string" && p.name.trim().length > 0 ? p.name.trim() : type.split("::").pop();
			if (object.behaviors.some((behavior) => behavior.name === name)) return `El objeto ya tiene un comportamiento llamado «${name}».`;
			if (p.properties !== void 0 && !isRecord$2(p.properties)) return "add_behavior: properties debe ser un objeto de pares clave/valor.";
			return null;
		},
		run: (project, payload) => {
			const p = payload;
			const object = requireObject(requireScene(project, p.sceneName), p.objectId);
			const behavior = {
				name: typeof p.name === "string" && p.name.trim().length > 0 ? p.name.trim() : p.type.split("::").pop(),
				type: p.type,
				properties: {
					...BEHAVIOR_DEFAULT_PROPERTIES[p.type] ?? {},
					...p.properties ?? {}
				}
			};
			return ok(withScene(project, p.sceneName, (current) => ({
				...current,
				objects: current.objects.map((item) => item.id === p.objectId ? {
					...item,
					behaviors: [...item.behaviors, behavior]
				} : item)
			})), { created: [{
				kind: "behavior",
				id: behavior.name,
				name: `${object.name} · ${behavior.name}`
			}] });
		}
	},
	remove_behavior: {
		name: "remove_behavior",
		label: "Quitar comportamiento",
		description: "Elimina un comportamiento de un objeto por su nombre de instancia.",
		mutates: true,
		supported: true,
		validate: (payload, project) => {
			if (!isRecord$2(payload)) return "remove_behavior: payload no válido.";
			const p = payload;
			const scene = requireScene(project, p.sceneName);
			if (!scene) return `No existe la escena «${String(p.sceneName)}».`;
			const object = requireObject(scene, p.objectId);
			if (!object) return `No existe el objeto con id «${String(p.objectId)}».`;
			if (!object.behaviors.some((behavior) => behavior.name === p.behaviorName)) return `El objeto no tiene un comportamiento llamado «${String(p.behaviorName)}».`;
			return null;
		},
		run: (project, payload) => {
			const p = payload;
			return ok(withScene(project, p.sceneName, (scene) => ({
				...scene,
				objects: scene.objects.map((item) => item.id === p.objectId ? {
					...item,
					behaviors: item.behaviors.filter((behavior) => behavior.name !== p.behaviorName)
				} : item)
			})), { deleted: [{
				kind: "behavior",
				id: p.behaviorName,
				name: p.behaviorName
			}] });
		}
	},
	create_variable: {
		name: "create_variable",
		label: "Crear variable",
		description: "Crea una variable de escena (o global) de tipo número, cadena o booleano.",
		mutates: true,
		supported: true,
		validate: (payload, project) => {
			if (!isRecord$2(payload)) return "create_variable: payload no válido.";
			const p = payload;
			const error = safeName(p.name, "nombre de variable");
			if (error) return error;
			if (p.type !== "number" && p.type !== "string" && p.type !== "boolean") return "create_variable: type debe ser number, string o boolean.";
			const name = p.name.trim();
			if ((p.scope === "global" ? "global" : "scene") === "global") {
				if (project.globalVariables.some((variable) => variable.name === name)) return `Ya existe una variable global llamada «${name}».`;
			} else {
				const scene = requireScene(project, p.sceneName);
				if (!scene) return `No existe la escena «${String(p.sceneName)}».`;
				if (scene.variables.some((variable) => variable.name === name)) return `La escena ya tiene una variable llamada «${name}».`;
			}
			return null;
		},
		run: (project, payload) => {
			const p = payload;
			const name = p.name.trim();
			const type = p.type;
			const variable = {
				name,
				type,
				value: p.value ?? defaultVariableValue(type),
				children: []
			};
			const scope = p.scope === "global" ? "global" : "scene";
			return ok(scope === "global" ? {
				...project,
				globalVariables: [...project.globalVariables, variable]
			} : withScene(project, p.sceneName, (scene) => ({
				...scene,
				variables: [...scene.variables, variable]
			})), { created: [{
				kind: "variable",
				id: name,
				name: `${name} (${scope === "global" ? "global" : "de escena"})`
			}] });
		}
	},
	create_event: {
		name: "create_event",
		label: "Crear evento",
		description: "Crea un evento estándar con condiciones/acciones cuyas instrucciones estén soportadas por el runtime (matriz de capacidades).",
		mutates: true,
		supported: true,
		validate: (payload, project) => {
			if (!isRecord$2(payload)) return "create_event: payload no válido.";
			const p = payload;
			const scene = requireScene(project, p.sceneName);
			if (!scene) return `No existe la escena «${String(p.sceneName)}».`;
			const conditionsError = validateInstructions(p.conditions, "create_event.conditions", "condition", scene, project);
			if (conditionsError) return conditionsError;
			const actionsError = validateInstructions(p.actions, "create_event.actions", "action", scene, project);
			if (actionsError) return actionsError;
			if (p.conditions === void 0 && p.actions === void 0) return "create_event: un evento necesita condiciones o acciones (o ambas).";
			return null;
		},
		run: (project, payload) => {
			const p = payload;
			const event = {
				id: uid("event"),
				kind: "standard",
				conditions: (p.conditions ?? []).map(toInstruction),
				actions: (p.actions ?? []).map(toInstruction),
				subEvents: [],
				collapsed: false
			};
			return ok(withScene(project, p.sceneName, (scene) => ({
				...scene,
				events: [...scene.events, event]
			})), { created: [{
				kind: "event",
				id: event.id,
				name: event.id
			}] });
		}
	},
	update_event: {
		name: "update_event",
		label: "Modificar evento",
		description: "Reemplaza las condiciones/acciones (o el estado) de un evento existente.",
		mutates: true,
		supported: true,
		validate: (payload, project) => {
			if (!isRecord$2(payload)) return "update_event: payload no válido.";
			const p = payload;
			const scene = requireScene(project, p.sceneName);
			if (!scene) return `No existe la escena «${String(p.sceneName)}».`;
			if (!findEvent$1(scene.events, p.eventId)) return `No existe el evento con id «${String(p.eventId)}».`;
			const conditionsError = validateInstructions(p.conditions, "update_event.conditions", "condition", scene, project);
			if (conditionsError) return conditionsError;
			const actionsError = validateInstructions(p.actions, "update_event.actions", "action", scene, project);
			if (actionsError) return actionsError;
			if (p.conditions === void 0 && p.actions === void 0 && p.disabled === void 0) return "update_event: indica qué cambiar (conditions, actions o disabled).";
			return null;
		},
		run: (project, payload) => {
			const p = payload;
			return ok(withScene(project, p.sceneName, (scene) => ({
				...scene,
				events: scene.events.map((event) => {
					if (event.id !== p.eventId) return event;
					return {
						...event,
						...p.conditions !== void 0 ? { conditions: p.conditions.map(toInstruction) } : {},
						...p.actions !== void 0 ? { actions: p.actions.map(toInstruction) } : {},
						...p.disabled !== void 0 ? { disabled: p.disabled } : {}
					};
				})
			})), { modified: [{
				kind: "event",
				id: p.eventId,
				name: p.eventId
			}] });
		}
	},
	add_collision: {
		name: "add_collision",
		label: "Añadir colisión",
		description: "Crea un evento con condición Collision entre dos objetos y, opcionalmente, destruye uno al tocarse.",
		mutates: true,
		supported: true,
		validate: (payload, project) => {
			if (!isRecord$2(payload)) return "add_collision: payload no válido.";
			const p = payload;
			const scene = requireScene(project, p.sceneName);
			if (!scene) return `No existe la escena «${String(p.sceneName)}».`;
			if (!requireObjectName(scene, p.objectA)) return `No existe el objeto «${String(p.objectA)}».`;
			if (!requireObjectName(scene, p.objectB)) return `No existe el objeto «${String(p.objectB)}».`;
			if (p.deleteTarget !== void 0 && p.deleteTarget !== "A" && p.deleteTarget !== "B" && p.deleteTarget !== "none") return "add_collision: deleteTarget debe ser A, B o none.";
			return null;
		},
		run: (project, payload) => {
			const p = payload;
			requireScene(project, p.sceneName);
			const event = {
				id: uid("event"),
				kind: "standard",
				conditions: [{
					id: uid("inst"),
					typeId: "Collision",
					inverted: false,
					parameters: {
						object: p.objectA,
						object2: p.objectB
					}
				}],
				actions: p.deleteTarget === "A" || p.deleteTarget === "B" ? [{
					id: uid("inst"),
					typeId: "Delete",
					inverted: false,
					parameters: { object: p.deleteTarget === "A" ? p.objectA : p.objectB }
				}] : [],
				subEvents: [],
				collapsed: false
			};
			const next = withScene(project, p.sceneName, (current) => ({
				...current,
				events: [...current.events, event]
			}));
			const targetName = p.deleteTarget === "A" ? p.objectA : p.deleteTarget === "B" ? p.objectB : null;
			return ok(next, { created: [{
				kind: "event",
				id: event.id,
				name: `Colisión ${p.objectA} ↔ ${p.objectB}${targetName ? ` (destruye ${targetName})` : ""}`
			}] });
		}
	},
	create_asset: unsupportedTool("create_asset", "Crear recurso", "Etapas 1-2 del brief: por ahora el agente usa recursos existentes y placeholders; la generación/importación de sprites llega con la etapa 2."),
	import_asset: unsupportedTool("import_asset", "Importar recurso", "Importar archivos locales requiere Nexusclaw (ejecutor local), aún no construido."),
	run_preview: unsupportedTool("run_preview", "Ejecutar vista previa", "La preview es una acción del editor (PreviewDialog), no una operación sobre el proyecto: la sesión del agente la disparará como acción de anfitrión."),
	inspect_diagnostics: unsupportedTool("inspect_diagnostics", "Inspeccionar diagnósticos", "Leer diagnósticos es una acción de anfitrión de la sesión del agente, no una mutación del proyecto."),
	undo_last_plan: unsupportedTool("undo_last_plan", "Deshacer último plan", "El undo lo gestiona la sesión del agente sobre sus snapshots (rollbackAppliedPlan), no como herramienta de proyecto."),
	restore_snapshot: unsupportedTool("restore_snapshot", "Restaurar snapshot", "La restauración de snapshots la gestiona la sesión del agente (modos snapshot/branch), no como herramienta de proyecto.")
};
var toolByName = (name) => TOOL_REGISTRY[name];
var TOOL_NAMES = Object.keys(TOOL_REGISTRY);
function unsupportedTool(name, label, reason) {
	return {
		name,
		label,
		description: reason,
		mutates: false,
		supported: false,
		unsupportedReason: reason,
		validate: () => null,
		run: (project) => ok(project)
	};
}
function findEvent$1(events, id) {
	if (typeof id !== "string") return null;
	for (const event of events) {
		if (event.id === id) return event;
		const found = findEvent$1(event.subEvents, id);
		if (found) return found;
	}
	return null;
}
function renameObjectInEvent$1(event, from, to) {
	const renameParameters = (parameters) => Object.fromEntries(Object.entries(parameters).map(([key, value]) => [key, value === from ? to : value]));
	return {
		...event,
		conditions: event.conditions.map((instruction) => ({
			...instruction,
			parameters: renameParameters(instruction.parameters)
		})),
		actions: event.actions.map((instruction) => ({
			...instruction,
			parameters: renameParameters(instruction.parameters)
		})),
		subEvents: event.subEvents.map((child) => renameObjectInEvent$1(child, from, to))
	};
}
function createOperation(type, payload, id = uid("op")) {
	return {
		id,
		version: 1,
		type,
		payload
	};
}
function createPlan(summary, operations, sceneName) {
	const plan = {
		id: uid("plan"),
		summary,
		operations
	};
	if (sceneName !== void 0) plan.sceneName = sceneName;
	return plan;
}
var failed = (project, diagnostic) => ({
	project,
	diagnostics: [diagnostic],
	created: [],
	modified: [],
	deleted: []
});
/**
* Executes one operation: registry lookup → capability/payload validation →
* pure transformation. Never throws; failures come back as diagnostics with
* the project left untouched.
*/
function applyOperation(project, operation) {
	if (!operation || typeof operation !== "object" || typeof operation.id !== "string" || operation.id.length === 0 || operation.version !== 1 || typeof operation.type !== "string" || operation.payload === null || typeof operation.payload !== "object") return failed(project, {
		code: "invalid-operation",
		severity: "error",
		message: "La operación no respeta el contrato ProjectOperation."
	});
	const tool = toolByName(operation.type);
	if (!tool) return failed(project, {
		code: "unknown-tool",
		severity: "error",
		message: `No existe la herramienta «${operation.type}».`,
		operationId: operation.id
	});
	if (!tool.supported) return failed(project, {
		code: "tool-unsupported",
		severity: "error",
		message: (tool.unsupportedReason ?? `La herramienta «${tool.name}» aún no está disponible.`) + " El agente no inventa capacidades que el runtime no tiene.",
		operationId: operation.id
	});
	const payloadError = tool.validate(operation.payload, project);
	if (payloadError) return failed(project, {
		code: "invalid-payload",
		severity: "error",
		message: payloadError,
		operationId: operation.id
	});
	try {
		const outcome = tool.run(project, operation.payload, operation);
		if (outcome.diagnostics.some((d) => d.severity === "error")) return failed(project, {
			...outcome.diagnostics[0],
			operationId: operation.id
		});
		return outcome;
	} catch (error) {
		return failed(project, {
			code: "tool-failed",
			severity: "error",
			message: error instanceof Error ? error.message : "La herramienta falló de forma inesperada.",
			operationId: operation.id
		});
	}
}
/**
* Executes a whole plan as one transaction. Atomic: the first failed operation
* aborts the plan and the original project is returned (no partial changes),
* exactly like the editor's undoable store actions.
*/
function applyPlan(project, plan) {
	if (!Array.isArray(plan.operations) || plan.operations.length === 0) return {
		plan,
		ok: false,
		project,
		records: [],
		diagnostics: [{
			code: "empty-plan",
			severity: "error",
			message: "El plan no contiene operaciones."
		}]
	};
	const records = [];
	const diagnostics = [];
	let current = project;
	for (const operation of plan.operations) {
		const before = current;
		const outcome = applyOperation(current, operation);
		diagnostics.push(...outcome.diagnostics);
		if (outcome.diagnostics.some((d) => d.severity === "error")) return {
			plan,
			ok: false,
			project,
			records,
			diagnostics
		};
		records.push({
			operation,
			before,
			after: outcome.project,
			diagnostics: outcome.diagnostics,
			created: outcome.created,
			modified: outcome.modified,
			deleted: outcome.deleted
		});
		current = outcome.project;
	}
	return {
		plan,
		ok: true,
		project: current,
		records,
		diagnostics
	};
}
/** The project state to restore when the user undoes a whole plan. */
function rollbackAppliedPlan(result) {
	const first = result.records[0];
	return first ? first.before : result.project;
}
var ENTITY_LABEL = {
	scene: "Escena",
	object: "Objeto",
	instance: "Instancia",
	variable: "Variable",
	event: "Evento",
	animation: "Animación",
	behavior: "Comportamiento",
	asset: "Recurso"
};
/**
* Human-readable diff of an applied plan, for the "show before applying" UI
* (AgentPanel) and for chat replies.
*/
function summarizePlan(result) {
	const lines = [];
	if (result.plan.summary) lines.push(result.plan.summary);
	if (!result.ok) {
		lines.push("Plan no aplicado (transacción abortada): el proyecto sigue intacto.", ...result.diagnostics.filter((d) => d.severity === "error").map((d) => `⚠ ${d.message}`));
		return lines;
	}
	for (const record of result.records) {
		for (const entity of record.created) lines.push(`${ENTITY_LABEL[entity.kind]} creada: «${entity.name}»`);
		for (const entity of record.modified) lines.push(`${ENTITY_LABEL[entity.kind]} modificada: «${entity.name}»`);
		for (const entity of record.deleted) lines.push(`${ENTITY_LABEL[entity.kind]} eliminada: «${entity.name}»`);
	}
	const warnings = result.diagnostics.filter((d) => d.severity === "warning");
	for (const warning of warnings) lines.push(`⚠ ${warning.message}`);
	if (lines.length === 1) lines.push("Plan aplicado sin cambios visibles.");
	return lines;
}
//#endregion
//#region src/lib/agent/validator.ts
var AgentValidationError = class extends Error {
	code;
	constructor(code, message) {
		super(message);
		this.name = "AgentValidationError";
		this.code = code;
	}
};
var okResult = () => ({
	ok: true,
	errors: [],
	diagnostics: []
});
var toDiagnostic = (error) => ({
	code: error.code === "invalid-plan" || error.code === "invalid-operation" ? "invalid-operation" : error.code,
	severity: "error",
	message: error.message
});
var isRecord$1 = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
/**
* Validates one operation: contract shape → tool exists → tool supported →
* payload valid against the CURRENT project (real ids, names, capabilities).
* This is the function that stops hallucinated ids and invented capabilities.
*/
function validateOperation(operation, project) {
	if (!isRecord$1(operation)) {
		const error = new AgentValidationError("invalid-operation", "La operación no es un objeto.");
		return {
			ok: false,
			errors: [error],
			diagnostics: [toDiagnostic(error)]
		};
	}
	const shape = operation;
	if (typeof shape.id !== "string" || shape.id.trim().length === 0 || shape.version !== 1 || typeof shape.type !== "string" || shape.type.trim().length === 0 || !isRecord$1(shape.payload)) {
		const error = new AgentValidationError("invalid-operation", `La operación no respeta el contrato ProjectOperation (id, version=1, type, payload).`);
		return {
			ok: false,
			errors: [error],
			diagnostics: [toDiagnostic(error)]
		};
	}
	const typed = shape;
	const tool = toolByName(typed.type);
	if (!tool) {
		const error = new AgentValidationError("unknown-tool", `No existe la herramienta «${typed.type}». Herramientas disponibles: ${TOOL_NAMES.join(", ")}.`);
		return {
			ok: false,
			errors: [error],
			diagnostics: [toDiagnostic(error)]
		};
	}
	if (!tool.supported) {
		const error = new AgentValidationError("tool-unsupported", tool.unsupportedReason ?? `La herramienta «${tool.name}» aún no está disponible.`);
		return {
			ok: false,
			errors: [error],
			diagnostics: [toDiagnostic(error)]
		};
	}
	const payloadError = tool.validate(typed.payload, project);
	if (payloadError) {
		const error = new AgentValidationError("invalid-payload", payloadError);
		return {
			ok: false,
			errors: [error],
			diagnostics: [toDiagnostic(error)]
		};
	}
	return okResult();
}
/**
* Validates a whole plan before it is shown to the user for approval:
* shape, size bounds, and a sequential dry run — each operation is validated
* against the state the previous operations of the plan produce (the model
* may create "Nivel 2" and then add variables to it). A failing operation
* does not stop the run, so one plan reports every error at once.
*/
function validatePlan(plan, project) {
	if (!isRecord$1(plan)) {
		const error = new AgentValidationError("invalid-plan", "El plan no es un objeto.");
		return {
			ok: false,
			errors: [error],
			diagnostics: [toDiagnostic(error)]
		};
	}
	const typed = plan;
	const errors = [];
	if (typeof typed.id !== "string" || typed.id.trim().length === 0) errors.push(new AgentValidationError("invalid-plan", "El plan necesita un id."));
	if (typeof typed.summary !== "string" || typed.summary.length > 500) errors.push(new AgentValidationError("invalid-plan", "El plan necesita un resumen de texto (máximo 500 caracteres)."));
	if (!Array.isArray(typed.operations)) {
		errors.push(new AgentValidationError("invalid-plan", "El plan necesita una lista de operaciones."));
		return {
			ok: false,
			errors,
			diagnostics: errors.map(toDiagnostic)
		};
	}
	if (typed.operations.length === 0) errors.push(new AgentValidationError("invalid-plan", "El plan no contiene operaciones."));
	if (typed.operations.length > 50) errors.push(new AgentValidationError("invalid-plan", `El plan propone demasiadas operaciones a la vez (máximo 50).`));
	const seenIds = /* @__PURE__ */ new Set();
	let working = project;
	for (const operation of typed.operations) {
		const operationId = isRecord$1(operation) && typeof operation.id === "string" ? operation.id : "";
		if (operationId !== "" && seenIds.has(operationId)) {
			errors.push(new AgentValidationError("invalid-operation", `Dos operaciones comparten el id «${operationId}».`));
			continue;
		}
		if (operationId !== "") seenIds.add(operationId);
		const result = validateOperation(operation, working);
		errors.push(...result.errors);
		if (result.ok) {
			const outcome = applyOperation(working, operation);
			if (!outcome.diagnostics.some((d) => d.severity === "error")) working = outcome.project;
		}
	}
	if (errors.length > 0) return {
		ok: false,
		errors,
		diagnostics: errors.map(toDiagnostic)
	};
	return okResult();
}
var AUTONOMY_MODES = [
	"Supervised",
	"SemiAutonomous",
	"Autonomous"
];
var SNAPSHOT_MODES = ["snapshot", "branch"];
var DEFAULT_AUTONOMY_MODE = "Supervised";
var DEFAULT_SNAPSHOT_MODE = "snapshot";
var now = () => (/* @__PURE__ */ new Date()).toISOString();
function makeAuditEntry(kind, label, planId, at = now()) {
	return planId === void 0 ? {
		at,
		kind,
		label
	} : {
		at,
		kind,
		label,
		planId
	};
}
function pushAudit(session, entry) {
	const audit = [...session.audit, entry];
	if (audit.length > 100) audit.splice(0, audit.length - 100);
	return {
		...session,
		audit
	};
}
function createAgentSession(project, at = now()) {
	return {
		version: 1,
		mode: DEFAULT_AUTONOMY_MODE,
		snapshotMode: DEFAULT_SNAPSHOT_MODE,
		baseline: project,
		applied: [],
		audit: [makeAuditEntry("session-start", `Sesión iniciada en «${project.name}» (modo ${DEFAULT_AUTONOMY_MODE}, snapshots).`, void 0, at)]
	};
}
function setAgentMode(session, mode, at = now()) {
	if (session.mode === mode) return session;
	return pushAudit({
		...session,
		mode
	}, makeAuditEntry("mode", `Modo de autonomía cambiado a ${mode}.`, void 0, at));
}
function setAgentSnapshotMode(session, mode, at = now()) {
	if (session.snapshotMode === mode) return session;
	return pushAudit({
		...session,
		snapshotMode: mode
	}, makeAuditEntry("mode", `Modo de restauración cambiado a ${mode}.`, void 0, at));
}
/**
* Tool types that remove content from the project. Renames and rewrites are
* not destructive: the data stays, just addressed differently.
*/
var DESTRUCTIVE_TOOL_TYPES = /* @__PURE__ */ new Set(["delete_object"]);
function planIsDestructive(plan) {
	return plan.operations.some((operation) => DESTRUCTIVE_TOOL_TYPES.has(operation.type));
}
/**
* Autonomy gating (brief): Supervised always shows the plan first;
* SemiAutonomous applies safe plans directly and still asks for destructive
* ones; Autonomous applies everything — but every case stays atomic,
* audited and one-click undoable, and nothing is ever published.
*/
function planRequiresApproval(plan, mode) {
	switch (mode) {
		case "Supervised": return true;
		case "SemiAutonomous": return planIsDestructive(plan);
		case "Autonomous": return false;
	}
}
/**
* The trust boundary of the whole pipeline: validate → dry-run → atomic apply.
* Never throws. On any failure the session keeps the same project and records
* the rejection with its diagnostics (the user sees exactly why).
*/
function evaluateAndApplyPlan(session, project, plan, at = now()) {
	const validation = validatePlan(plan, project);
	if (!validation.ok) {
		const first = validation.errors[0];
		const rejected = {
			plan,
			ok: false,
			project,
			records: [],
			diagnostics: validation.diagnostics
		};
		return {
			session: pushAudit(session, makeAuditEntry("rejected", `Plan rechazado: ${first ? first.message : "el plan no es válido."}`, plan.id, at)),
			result: rejected
		};
	}
	const result = applyPlan(project, plan);
	if (!result.ok) {
		const firstError = result.diagnostics.find((diagnostic) => diagnostic.severity === "error");
		return {
			session: pushAudit(session, makeAuditEntry("rejected", `Transacción abortada (proyecto intacto): ${firstError ? firstError.message : "error desconocido."}`, plan.id, at)),
			result
		};
	}
	const applied = [...session.applied, result];
	if (applied.length > 10) applied.splice(0, applied.length - 10);
	const summary = result.records.flatMap((record) => [
		...record.created,
		...record.modified,
		...record.deleted
	]).length;
	return {
		session: pushAudit({
			...session,
			applied
		}, makeAuditEntry("applied", `Plan aplicado (${result.records.length} operaciones, ${summary} entidades): ${plan.summary}`, plan.id, at)),
		result
	};
}
/** Undo the most recent applied plan using its recorded before-snapshot. */
function undoLastAgentPlan(session, at = now()) {
	const last = session.applied[session.applied.length - 1];
	if (!last) return {
		session,
		project: null
	};
	return {
		session: pushAudit({
			...session,
			applied: session.applied.slice(0, -1)
		}, makeAuditEntry("undone", `Plan deshecho: ${last.plan.summary}`, last.plan.id, at)),
		project: rollbackAppliedPlan(last)
	};
}
/** Restore the project to the session start (snapshot mode) and clear the
*  applied stack, which is invalidated by a full rollback. */
function restoreAgentBaseline(session, at = now()) {
	if (session.applied.length === 0) return {
		session,
		project: null
	};
	return {
		session: pushAudit({
			...session,
			applied: []
		}, makeAuditEntry("restored", "Proyecto restaurado al punto de partida de la sesión.")),
		project: session.baseline
	};
}
/**
* Appends a standalone audit entry (e.g. the deterministic in-situ editor
* surfacing an AI edit through its own pipeline). Does not create an applied
* plan: that edit is undone with the editor's regular undo.
*/
function withAuditEntry(session, entry) {
	return pushAudit(session, entry);
}
//#endregion
//#region src/lib/editor/store.tsx
var initialUI = {
	tab: "scene",
	dialog: null,
	openedTabs: [{
		id: "scene:Level 1",
		kind: "scene",
		label: "Level 1",
		sceneName: "Level 1"
	}],
	activeTabId: "scene:Level 1",
	rightTab: "properties",
	selectedInstanceIds: [],
	selectedObjectIds: [],
	selectedEventIds: [],
	selectedGroupName: null,
	selectedLayerName: null,
	selectedInstruction: null,
	showLeftPanel: true,
	showRightPanel: true,
	showObjectsPanel: true,
	showGroupsPanel: true,
	showPropertiesPanel: true,
	showInstancesPanel: true,
	showLayersPanel: true,
	zoom: 1,
	pan: {
		x: 0,
		y: 0
	},
	showHitMasks: false,
	windowMask: true,
	showHiddenInstances: true,
	projectManagerOpen: false,
	commandPaletteOpen: false,
	quickAutomationOpen: false,
	agentPanelOpen: false,
	inlineAi: null,
	previewOpen: false,
	previewWithDebugger: false,
	debuggerOpen: false,
	cursorClientPosition: null,
	cursorPosition: null
};
function patchScene(state, updater) {
	const project = withScene(state.project, state.activeSceneName, updater);
	if (project === state.project) return state;
	return {
		...state,
		project,
		dirty: true
	};
}
function mapEvents(events, fn) {
	const out = [];
	for (const e of events) {
		const mapped = fn(e);
		if (!mapped) continue;
		out.push({
			...mapped,
			subEvents: mapEvents(mapped.subEvents, fn)
		});
	}
	return out;
}
function insertSub(events, parentId, child) {
	return events.map((e) => e.id === parentId ? {
		...e,
		collapsed: false,
		subEvents: [...e.subEvents, child]
	} : {
		...e,
		subEvents: insertSub(e.subEvents, parentId, child)
	});
}
function siblingList(events, parentId, updater) {
	if (parentId === null) return updater(events);
	return events.map((e) => e.id === parentId ? {
		...e,
		subEvents: updater(e.subEvents)
	} : {
		...e,
		subEvents: siblingList(e.subEvents, parentId, updater)
	});
}
function findEvent(events, id) {
	for (const e of events) {
		if (e.id === id) return e;
		const found = findEvent(e.subEvents, id);
		if (found) return found;
	}
}
function parentOfEvent(events, id, parent = null) {
	for (const e of events) {
		if (e.id === id) return parent;
		const found = parentOfEvent(e.subEvents, id, e.id);
		if (found !== null) return found;
	}
	return null;
}
function variableAt(list, path) {
	let current;
	let level = list;
	for (const name of path) {
		current = level.find((v) => v.name === name);
		if (!current) return void 0;
		level = current.children;
	}
	return current;
}
function mapVariableTree(list, path, updater) {
	if (path.length === 0) return list.map(updater);
	const [head, ...rest] = path;
	return list.map((v) => v.name === head ? {
		...v,
		children: mapVariableTree(v.children, rest, updater)
	} : v);
}
function removeVariable(list, path) {
	if (path.length <= 1) {
		const name = path[0];
		return list.filter((v) => v.name !== name);
	}
	const [head, ...rest] = path;
	return list.map((v) => v.name === head ? {
		...v,
		children: removeVariable(v.children, rest)
	} : v);
}
function emptyVariableFor(parent) {
	const isIndex = parent?.type === "array";
	const size = parent ? parent.children.length : 0;
	return {
		name: isIndex ? String(size) : `Variable ${size + 1}`,
		type: "number",
		value: "0",
		children: []
	};
}
function sceneVariablesOf(scene, location) {
	switch (location.scope) {
		case "scene": return scene.variables;
		case "global": return [];
		case "object": return scene.objects.find((o) => o.id === location.objectId)?.variables ?? [];
		case "instance": return scene.instances.find((i) => i.id === location.objectId)?.variables ?? [];
	}
}
var MUTATING = /* @__PURE__ */ new Set([
	"addObject",
	"updateObject",
	"renameObject",
	"deleteObject",
	"duplicateObject",
	"setObjectGlobal",
	"addObjectAnimation",
	"updateObjectAnimation",
	"deleteObjectAnimation",
	"addObjectFrame",
	"updateObjectFrame",
	"deleteObjectFrame",
	"addObjectPoint",
	"updateObjectPoint",
	"deleteObjectPoint",
	"addBehavior",
	"updateBehavior",
	"deleteBehavior",
	"addEffect",
	"updateEffect",
	"deleteEffect",
	"moveEffect",
	"toggleEffect",
	"addInstance",
	"addInstances",
	"updateInstance",
	"deleteInstances",
	"duplicateInstances",
	"setInstancesZOrder",
	"toggleInstancesLock",
	"toggleInstancesVisibility",
	"addLayer",
	"updateLayer",
	"renameLayer",
	"deleteLayer",
	"moveLayer",
	"toggleLayerVisibility",
	"toggleLayerLock",
	"setActiveLayer",
	"addObjectGroup",
	"updateObjectGroup",
	"deleteObjectGroup",
	"addVariable",
	"updateVariable",
	"deleteVariable",
	"addVariableChild",
	"addEvent",
	"insertGeneratedEvents",
	"deleteEvent",
	"deleteEvents",
	"duplicateEvent",
	"updateEvent",
	"moveEvent",
	"toggleEventDisabled",
	"addInstruction",
	"updateInstruction",
	"deleteInstruction",
	"moveInstruction",
	"toggleInstructionInverted",
	"addResource",
	"addGeneratedAssetBundle",
	"updateResource",
	"deleteResource",
	"installExtension",
	"uninstallExtension",
	"addExternalEvents",
	"addExternalLayout",
	"updateGrid",
	"updateScene",
	"updateGameSettings",
	"renameProject",
	"addScene",
	"deleteScene",
	"renameScene",
	"duplicateScene",
	"applyAiEdit",
	"applyAgentPlan"
]);
function projectReducer(state, action) {
	const project = state.project;
	const scene = project.scenes.find((s) => s.name === state.activeSceneName) ?? project.scenes[0];
	if (!scene) return state;
	switch (action.type) {
		case "renameProject": return {
			...state,
			dirty: true,
			project: {
				...project,
				name: action.name
			}
		};
		case "updateGameSettings": {
			const gameSettings = {
				...project.gameSettings,
				...action.patch
			};
			let next = {
				...project,
				gameSettings
			};
			if (action.patch.startScene && action.patch.startScene !== project.firstLayoutName) next = {
				...next,
				firstLayoutName: action.patch.startScene
			};
			return {
				...state,
				dirty: true,
				project: next
			};
		}
		case "setActiveScene": {
			const id = `scene:${action.name}`;
			const openedTabs = state.ui.openedTabs.some((t) => t.id === id) ? state.ui.openedTabs : [...state.ui.openedTabs, {
				id,
				kind: "scene",
				label: action.name,
				sceneName: action.name
			}];
			return {
				...state,
				activeSceneName: action.name,
				ui: {
					...state.ui,
					openedTabs,
					activeTabId: id,
					selectedInstanceIds: [],
					selectedObjectIds: [],
					selectedLayerName: null,
					selectedGroupName: null
				}
			};
		}
		case "addScene": {
			const names = project.scenes.map((s) => s.name);
			const name = action.name ?? newNameGenerator("Nueva escena", names);
			const created = makeScene(name, {
				backgroundColor: "255;255;255",
				grid: {
					...DEFAULT_GRID,
					show: true
				}
			});
			return {
				...state,
				dirty: true,
				project: {
					...project,
					scenes: [...project.scenes, created]
				},
				activeSceneName: name,
				ui: {
					...state.ui,
					openedTabs: [...state.ui.openedTabs, {
						id: `scene:${name}`,
						kind: "scene",
						label: name,
						sceneName: name
					}],
					activeTabId: `scene:${name}`
				}
			};
		}
		case "deleteScene": {
			if (project.scenes.length <= 1) return state;
			const scenes = project.scenes.filter((s) => s.name !== action.name);
			const first = scenes[0];
			if (!first) return state;
			const openedTabs = state.ui.openedTabs.filter((t) => t.sceneName !== action.name);
			const activeSceneName = state.activeSceneName === action.name ? first.name : state.activeSceneName;
			return {
				...state,
				dirty: true,
				project: {
					...project,
					scenes,
					firstLayoutName: scenes.some((s) => s.name === project.firstLayoutName) ? project.firstLayoutName : first.name
				},
				activeSceneName,
				ui: {
					...state.ui,
					openedTabs,
					activeTabId: state.activeSceneName === action.name ? `scene:${first.name}` : state.ui.activeTabId
				}
			};
		}
		case "renameScene": {
			if (!action.to.trim() || action.to === action.from) return state;
			const renamed = renameSceneInProject(project, action.from, action.to.trim());
			const openedTabs = state.ui.openedTabs.map((t) => t.sceneName === action.from ? {
				...t,
				label: action.to.trim(),
				id: `scene:${action.to.trim()}`,
				sceneName: action.to.trim()
			} : t);
			return {
				...state,
				dirty: true,
				project: renamed,
				activeSceneName: action.to.trim(),
				ui: {
					...state.ui,
					openedTabs,
					activeTabId: state.activeSceneName === action.from ? `scene:${action.to.trim()}` : state.ui.activeTabId
				}
			};
		}
		case "duplicateScene": {
			const source = project.scenes.find((s) => s.name === action.name);
			if (!source) return state;
			const name = newNameGenerator(`${source.name} (copia)`, project.scenes.map((s) => s.name));
			const idMap = /* @__PURE__ */ new Map();
			const objects = source.objects.map((o) => {
				const nextId = uid("obj");
				idMap.set(o.id, nextId);
				return {
					...o,
					id: nextId
				};
			});
			const copy = {
				...source,
				name,
				objects,
				instances: source.instances.map((i) => ({
					...i,
					id: uid("inst"),
					objectId: idMap.get(i.objectId) ?? i.objectId
				})),
				events: source.events.map(cloneEvent)
			};
			return {
				...state,
				dirty: true,
				project: {
					...project,
					scenes: [...project.scenes, copy]
				}
			};
		}
		case "updateScene": return patchScene(state, (s) => ({
			...s,
			...action.patch
		}));
		case "updateGrid": return patchScene(state, (s) => ({
			...s,
			grid: {
				...s.grid,
				...action.patch
			}
		}));
		case "applyAiEdit":
			if (action.scene.name !== action.sceneName || !project.scenes.some((candidate) => candidate.name === action.sceneName)) return state;
			return {
				...state,
				dirty: true,
				project: {
					...project,
					scenes: project.scenes.map((candidate) => candidate.name === action.sceneName ? action.scene : candidate)
				},
				ui: action.selectedInstanceIds === void 0 ? state.ui : {
					...state.ui,
					selectedInstanceIds: action.selectedInstanceIds,
					selectedObjectIds: []
				}
			};
		case "addObject": {
			const id = action.object.id ?? uid("obj");
			const created = {
				behaviors: [],
				effects: [],
				variables: [],
				...action.object,
				id
			};
			return patchScene(state, (s) => ({
				...s,
				objects: [...s.objects, created]
			}));
		}
		case "updateObject": return patchScene(state, (s) => ({
			...s,
			objects: s.objects.map((o) => o.id === action.id ? {
				...o,
				...action.patch
			} : o)
		}));
		case "renameObject": {
			const old = scene.objects.find((o) => o.id === action.id);
			if (!old || old.name === action.name) return state;
			const nextName = action.name.trim();
			if (!nextName) return state;
			return patchScene(state, (s) => ({
				...s,
				objects: s.objects.map((o) => o.id === action.id ? {
					...o,
					name: nextName
				} : o),
				events: mapEvents(s.events, (e) => renameObjectInEvent(e, old.name, nextName)),
				groups: s.groups.map((g) => ({
					...g,
					objects: g.objects.map((n) => n === old.name ? nextName : n)
				}))
			}));
		}
		case "deleteObject": {
			const target = scene.objects.find((o) => o.id === action.id);
			return patchScene(state, (s) => ({
				...s,
				objects: s.objects.filter((o) => o.id !== action.id),
				instances: s.instances.filter((i) => i.objectId !== action.id),
				groups: s.groups.map((g) => ({
					...g,
					objects: target ? g.objects.filter((n) => n !== target.name) : g.objects
				}))
			}));
		}
		case "duplicateObject": {
			const source = scene.objects.find((o) => o.id === action.id);
			if (!source) return state;
			const name = newNameGenerator(`${source.name}Copy`, scene.objects.map((o) => o.name));
			const created = {
				...source,
				id: uid("obj"),
				name
			};
			return patchScene(state, (s) => ({
				...s,
				objects: [...s.objects, created]
			}));
		}
		case "setObjectGlobal": return patchScene(state, (s) => ({
			...s,
			objects: s.objects.map((o) => o.id === action.id ? {
				...o,
				isGlobal: action.isGlobal
			} : o)
		}));
		case "addObjectAnimation": return patchScene(state, (s) => ({
			...s,
			objects: s.objects.map((o) => o.id === action.objectId ? {
				...o,
				animations: [...o.animations ?? [], {
					name: newNameGenerator("Animación", (o.animations ?? []).map((a) => a.name)),
					loops: true,
					timeBetweenFrames: 1,
					images: [{
						image: o.asset ?? "",
						originX: 0,
						originY: 0,
						centerX: .5,
						centerY: .5,
						opacity: 255
					}],
					points: []
				}]
			} : o)
		}));
		case "updateObjectAnimation": return patchScene(state, (s) => ({
			...s,
			objects: s.objects.map((o) => o.id === action.objectId ? {
				...o,
				animations: (o.animations ?? []).map((a, i) => i === action.index ? {
					...a,
					...action.patch
				} : a)
			} : o)
		}));
		case "deleteObjectAnimation": return patchScene(state, (s) => ({
			...s,
			objects: s.objects.map((o) => o.id === action.objectId ? {
				...o,
				animations: (o.animations ?? []).filter((_, i) => i !== action.index)
			} : o)
		}));
		case "addObjectFrame": return patchScene(state, (s) => ({
			...s,
			objects: s.objects.map((o) => {
				if (o.id !== action.objectId) return o;
				const animations = [...o.animations ?? []];
				const current = animations[action.animationIndex];
				if (!current) return o;
				animations[action.animationIndex] = {
					...current,
					images: [...current.images, {
						image: current.images[current.images.length - 1]?.image ?? o.asset ?? "",
						originX: 0,
						originY: 0,
						centerX: .5,
						centerY: .5,
						opacity: 255
					}]
				};
				return {
					...o,
					animations
				};
			})
		}));
		case "updateObjectFrame": return patchScene(state, (s) => ({
			...s,
			objects: s.objects.map((o) => {
				if (o.id !== action.objectId) return o;
				const animations = [...o.animations ?? []];
				const current = animations[action.animationIndex];
				if (!current) return o;
				animations[action.animationIndex] = {
					...current,
					images: current.images.map((f, i) => i === action.frameIndex ? {
						...f,
						...action.patch
					} : f)
				};
				return {
					...o,
					animations
				};
			})
		}));
		case "deleteObjectFrame": return patchScene(state, (s) => ({
			...s,
			objects: s.objects.map((o) => {
				if (o.id !== action.objectId) return o;
				const animations = [...o.animations ?? []];
				const current = animations[action.animationIndex];
				if (!current || current.images.length <= 1) return o;
				animations[action.animationIndex] = {
					...current,
					images: current.images.filter((_, i) => i !== action.frameIndex)
				};
				return {
					...o,
					animations
				};
			})
		}));
		case "addObjectPoint": return patchScene(state, (s) => ({
			...s,
			objects: s.objects.map((o) => {
				if (o.id !== action.objectId) return o;
				const animations = [...o.animations ?? []];
				const current = animations[action.animationIndex];
				if (!current) return o;
				animations[action.animationIndex] = {
					...current,
					points: [...current.points, {
						name: newNameGenerator("nuevoPunto", current.points.map((p) => p.name)),
						x: 0,
						y: 0
					}]
				};
				return {
					...o,
					animations
				};
			})
		}));
		case "updateObjectPoint": return patchScene(state, (s) => ({
			...s,
			objects: s.objects.map((o) => {
				if (o.id !== action.objectId) return o;
				const animations = [...o.animations ?? []];
				const current = animations[action.animationIndex];
				if (!current) return o;
				animations[action.animationIndex] = {
					...current,
					points: current.points.map((p, i) => i === action.pointIndex ? {
						...p,
						...action.patch
					} : p)
				};
				return {
					...o,
					animations
				};
			})
		}));
		case "deleteObjectPoint": return patchScene(state, (s) => ({
			...s,
			objects: s.objects.map((o) => {
				if (o.id !== action.objectId) return o;
				const animations = [...o.animations ?? []];
				const current = animations[action.animationIndex];
				if (!current) return o;
				animations[action.animationIndex] = {
					...current,
					points: current.points.filter((_, i) => i !== action.pointIndex)
				};
				return {
					...o,
					animations
				};
			})
		}));
		case "addBehavior": return patchScene(state, (s) => ({
			...s,
			objects: s.objects.map((o) => o.id === action.objectId ? {
				...o,
				behaviors: [...o.behaviors, action.behavior]
			} : o)
		}));
		case "updateBehavior": return patchScene(state, (s) => ({
			...s,
			objects: s.objects.map((o) => o.id === action.objectId ? {
				...o,
				behaviors: o.behaviors.map((b) => b.name === action.behaviorName ? {
					...b,
					...action.patch
				} : b)
			} : o)
		}));
		case "deleteBehavior": return patchScene(state, (s) => ({
			...s,
			objects: s.objects.map((o) => o.id === action.objectId ? {
				...o,
				behaviors: o.behaviors.filter((b) => b.name !== action.behaviorName)
			} : o)
		}));
		case "addEffect": return patchScene(state, (s) => withEffects(s, action.target, (list) => [...list, action.effect]));
		case "updateEffect": return patchScene(state, (s) => withEffects(s, action.target, (list) => list.map((e, i) => i === action.index ? {
			...e,
			...action.patch
		} : e)));
		case "deleteEffect": return patchScene(state, (s) => withEffects(s, action.target, (list) => list.filter((_, i) => i !== action.index)));
		case "moveEffect": return patchScene(state, (s) => withEffects(s, action.target, (list) => swap(list, action.index, action.index + action.direction)));
		case "toggleEffect": return patchScene(state, (s) => withEffects(s, action.target, (list) => list.map((e, i) => i === action.index ? {
			...e,
			parameters: {
				...e.parameters,
				disabled: e.parameters["disabled"] === "yes" ? "no" : "yes"
			}
		} : e)));
		case "addInstance": {
			const obj = scene.objects.find((o) => o.id === action.objectId);
			if (!obj) return state;
			const isText = obj.type === "TextObject::Text" || obj.type === "Text";
			const inst = {
				id: uid("inst"),
				objectId: obj.id,
				x: Math.round(action.x),
				y: Math.round(action.y),
				angle: 0,
				customSize: false,
				width: isText ? 160 : 64,
				height: isText ? 32 : 64,
				zOrder: scene.instances.length + 1,
				layer: action.layer ?? scene.activeLayer ?? "Base layer",
				locked: false,
				hiddenAtStart: false,
				variables: [],
				effects: []
			};
			return patchScene(state, (s) => ({
				...s,
				instances: [...s.instances, inst]
			}));
		}
		case "addInstances": return patchScene(state, (s) => ({
			...s,
			instances: [...s.instances, ...action.instances]
		}));
		case "moveInstances": return patchScene(state, (s) => ({
			...s,
			instances: s.instances.map((i) => action.ids.includes(i.id) ? {
				...i,
				x: i.x + action.dx,
				y: i.y + action.dy
			} : i)
		}));
		case "setInstancesPositions": {
			const posMap = new Map(action.positions.map((p) => [p.id, p]));
			return patchScene(state, (s) => ({
				...s,
				instances: s.instances.map((i) => {
					const target = posMap.get(i.id);
					return target ? {
						...i,
						x: target.x,
						y: target.y
					} : i;
				})
			}));
		}
		case "updateInstance": return patchScene(state, (s) => ({
			...s,
			instances: s.instances.map((i) => i.id === action.id ? {
				...i,
				...action.patch
			} : i)
		}));
		case "deleteInstances": return patchScene(state, (s) => ({
			...s,
			instances: s.instances.filter((i) => !action.ids.includes(i.id))
		}));
		case "duplicateInstances": {
			const copies = scene.instances.filter((i) => action.ids.includes(i.id)).map((i) => ({
				...i,
				id: uid("inst"),
				x: i.x + 20,
				y: i.y + 20,
				locked: false
			}));
			if (copies.length === 0) return state;
			return {
				...patchScene(state, (s) => ({
					...s,
					instances: [...s.instances, ...copies]
				})),
				ui: {
					...state.ui,
					selectedInstanceIds: copies.map((c) => c.id)
				}
			};
		}
		case "setInstancesZOrder": {
			const max = scene.instances.reduce((acc, i) => Math.max(acc, i.zOrder), 0);
			const min = scene.instances.reduce((acc, i) => Math.min(acc, i.zOrder), 0);
			return patchScene(state, (s) => ({
				...s,
				instances: s.instances.map((i) => action.ids.includes(i.id) ? {
					...i,
					zOrder: action.mode === "front" ? max + 1 : action.mode === "back" ? min - 1 : action.value ?? i.zOrder
				} : i)
			}));
		}
		case "toggleInstancesLock": return patchScene(state, (s) => ({
			...s,
			instances: s.instances.map((i) => action.ids.includes(i.id) ? {
				...i,
				locked: !i.locked
			} : i)
		}));
		case "toggleInstancesVisibility": return patchScene(state, (s) => ({
			...s,
			instances: s.instances.map((i) => action.ids.includes(i.id) ? {
				...i,
				hiddenAtStart: !i.hiddenAtStart
			} : i)
		}));
		case "addLayer": {
			const name = action.name ?? newNameGenerator(action.isLightingLayer ? "Capa de luz" : "Nueva capa", scene.layers.map((l) => l.name));
			return patchScene(state, (s) => ({
				...s,
				layers: [...s.layers, {
					name,
					visible: true,
					camera: {
						x: 0,
						y: 0
					},
					effects: [],
					...action.isLightingLayer === void 0 ? {} : { isLightingLayer: action.isLightingLayer },
					followBaseLayer: !action.isLightingLayer && s.layers.length > 0,
					...action.isLightingLayer ? { ambientLightColor: "180;180;180" } : {}
				}]
			}));
		}
		case "updateLayer": return patchScene(state, (s) => ({
			...s,
			layers: s.layers.map((l) => l.name === action.name ? {
				...l,
				...action.patch
			} : l)
		}));
		case "renameLayer": return patchScene(state, (s) => ({
			...s,
			layers: s.layers.map((l) => l.name === action.from ? {
				...l,
				name: action.to
			} : l),
			instances: s.instances.map((i) => i.layer === action.from ? {
				...i,
				layer: action.to
			} : i),
			activeLayer: s.activeLayer === action.from ? action.to : s.activeLayer
		}));
		case "deleteLayer": return patchScene(state, (s) => ({
			...s,
			layers: s.layers.filter((l) => l.name !== action.name),
			instances: s.instances.filter((i) => i.layer !== action.name)
		}));
		case "moveLayer": return patchScene(state, (s) => ({
			...s,
			layers: swap(s.layers, s.layers.findIndex((l) => l.name === action.name), s.layers.findIndex((l) => l.name === action.name) + action.direction)
		}));
		case "toggleLayerVisibility": return patchScene(state, (s) => ({
			...s,
			layers: s.layers.map((l) => l.name === action.name ? {
				...l,
				visible: !l.visible
			} : l)
		}));
		case "toggleLayerLock": return patchScene(state, (s) => ({
			...s,
			layers: s.layers.map((l) => l.name === action.name ? {
				...l,
				locked: !l.locked
			} : l)
		}));
		case "setActiveLayer": return patchScene(state, (s) => ({
			...s,
			activeLayer: action.name
		}));
		case "addObjectGroup": {
			const name = action.name ?? newNameGenerator("Nuevo grupo", scene.groups.map((g) => g.name));
			return patchScene(state, (s) => ({
				...s,
				groups: [...s.groups, {
					name,
					objects: [],
					behaviors: []
				}]
			}));
		}
		case "updateObjectGroup": return patchScene(state, (s) => ({
			...s,
			groups: s.groups.map((g) => g.name === action.name ? {
				...g,
				...action.patch,
				name: action.patch.name?.trim() || g.name
			} : g)
		}));
		case "deleteObjectGroup": return patchScene(state, (s) => ({
			...s,
			groups: s.groups.filter((g) => g.name !== action.name)
		}));
		case "addVariable": {
			const list = action.location.scope === "global" ? project.globalVariables : sceneVariablesOf(scene, action.location);
			const parent = action.location.path && action.location.path.length > 0 ? variableAt(list, action.location.path) : void 0;
			const created = emptyVariableFor(parent);
			const nextList = parent === void 0 ? [...list, {
				...created,
				name: newNameGenerator("Variable", list.map((v) => v.name))
			}] : mapVariableTree(list, action.location.path, (v) => v === parent ? {
				...v,
				type: "structure",
				children: [...v.children, created]
			} : v);
			return writeVariableList(state, action.location, nextList);
		}
		case "addVariableChild": {
			const list = action.location.scope === "global" ? project.globalVariables : sceneVariablesOf(scene, action.location);
			const parent = variableAt(list, action.path);
			if (!parent) return state;
			const created = emptyVariableFor(parent);
			const nextList = mapVariableTree(list, action.path, (v) => v === parent ? {
				...v,
				type: "structure",
				children: [...v.children, created]
			} : v);
			return writeVariableList(state, action.location, nextList);
		}
		case "updateVariable": {
			const list = action.location.scope === "global" ? project.globalVariables : sceneVariablesOf(scene, action.location);
			const target = variableAt(list, action.path);
			if (!target) return state;
			const nextList = mapVariableTree(list, action.path, (v) => {
				if (v !== target) return v;
				const patch = { ...action.patch };
				if (patch.type && patch.type !== "number" && patch.type !== "string" && v.value === "0") patch.value = patch.type === "boolean" ? "false" : "";
				return {
					...v,
					...patch
				};
			});
			return writeVariableList(state, action.location, nextList);
		}
		case "deleteVariable": {
			const nextList = removeVariable(action.location.scope === "global" ? project.globalVariables : sceneVariablesOf(scene, action.location), action.path);
			return writeVariableList(state, action.location, nextList);
		}
		case "addEvent": {
			const ev = newEvent(action.kind);
			return patchScene(state, (s) => ({
				...s,
				events: action.parentId === null ? [...s.events, ev] : insertSub(s.events, action.parentId, ev)
			}));
		}
		case "insertGeneratedEvents": {
			if (action.events.length === 0) return state;
			const position = Math.max(0, Math.min(scene.events.length, action.position ?? scene.events.length));
			const next = patchScene(state, (s) => {
				const events = [...s.events];
				events.splice(position, 0, ...action.events);
				return {
					...s,
					events
				};
			});
			return {
				...next,
				ui: {
					...next.ui,
					tab: "events",
					selectedEventIds: action.events.map((event) => event.id),
					selectedInstanceIds: [],
					selectedObjectIds: []
				}
			};
		}
		case "deleteEvent":
		case "deleteEvents": {
			const ids = action.type === "deleteEvent" ? [action.id] : action.ids;
			return patchScene(state, (s) => ({
				...s,
				events: mapEvents(s.events, (e) => ids.includes(e.id) ? null : e)
			}));
		}
		case "duplicateEvent": {
			const source = findEvent(scene.events, action.id);
			if (!source) return state;
			const copy = cloneEvent(source);
			const parentId = parentOfEvent(scene.events, action.id);
			return patchScene(state, (s) => ({
				...s,
				events: siblingList(s.events, parentId, (list) => {
					const index = list.findIndex((e) => e.id === action.id);
					const next = [...list];
					next.splice(index + 1, 0, copy);
					return next;
				})
			}));
		}
		case "toggleCollapse": return patchScene(state, (s) => ({
			...s,
			events: mapEvents(s.events, (e) => e.id === action.id ? {
				...e,
				collapsed: !e.collapsed
			} : e)
		}));
		case "toggleEventDisabled": return patchScene(state, (s) => ({
			...s,
			events: mapEvents(s.events, (e) => e.id === action.id ? {
				...e,
				disabled: !e.disabled
			} : e)
		}));
		case "updateEvent": return patchScene(state, (s) => ({
			...s,
			events: mapEvents(s.events, (e) => e.id === action.id ? {
				...e,
				...action.patch
			} : e)
		}));
		case "moveEvent": {
			const parentId = parentOfEvent(scene.events, action.id);
			return patchScene(state, (s) => ({
				...s,
				events: siblingList(s.events, parentId, (list) => swap(list, list.findIndex((e) => e.id === action.id), list.findIndex((e) => e.id === action.id) + action.direction))
			}));
		}
		case "addInstruction": return patchScene(state, (s) => ({
			...s,
			events: mapEvents(s.events, (e) => e.id === action.eventId ? {
				...e,
				[action.slot]: [...e[action.slot], action.instruction]
			} : e)
		}));
		case "toggleInstructionInverted": return patchScene(state, (s) => ({
			...s,
			events: mapEvents(s.events, (e) => e.id === action.eventId ? {
				...e,
				[action.slot]: e[action.slot].map((ins) => ins.id === action.instructionId ? {
					...ins,
					inverted: !ins.inverted
				} : ins)
			} : e)
		}));
		case "updateInstruction": return patchScene(state, (s) => ({
			...s,
			events: mapEvents(s.events, (e) => e.id === action.eventId ? {
				...e,
				[action.slot]: e[action.slot].map((ins) => ins.id === action.instructionId ? {
					...ins,
					...action.patch
				} : ins)
			} : e)
		}));
		case "deleteInstruction": return patchScene(state, (s) => ({
			...s,
			events: mapEvents(s.events, (e) => e.id === action.eventId ? {
				...e,
				[action.slot]: e[action.slot].filter((i) => i.id !== action.instructionId)
			} : e)
		}));
		case "moveInstruction": return patchScene(state, (s) => ({
			...s,
			events: mapEvents(s.events, (e) => {
				if (e.id !== action.eventId) return e;
				const index = e[action.slot].findIndex((i) => i.id === action.instructionId);
				return {
					...e,
					[action.slot]: swap(e[action.slot], index, index + action.direction)
				};
			})
		}));
		case "addResource": return {
			...state,
			dirty: true,
			project: {
				...project,
				resources: [...project.resources, project.resources.some((r) => r.name === action.resource.name) ? {
					...action.resource,
					name: newNameGenerator(action.resource.name, project.resources.map((r) => r.name))
				} : action.resource]
			}
		};
		case "addGeneratedAssetBundle": {
			const resourceNames = project.resources.map((resource) => resource.name);
			const resourceName = project.resources.some((resource) => resource.name === action.resource.name) ? newNameGenerator(action.resource.name, resourceNames) : action.resource.name;
			const resource = {
				...action.resource,
				name: resourceName,
				file: action.resource.file === action.resource.name || !action.resource.file ? resourceName : action.resource.file
			};
			const objectName = scene.objects.some((object) => object.name === action.object.name) ? newNameGenerator(action.object.name, scene.objects.map((object) => object.name)) : action.object.name;
			const objectId = scene.objects.some((object) => object.id === action.object.id) ? uid("obj") : action.object.id;
			const rewriteResource = (name) => name === action.resource.name || name === action.resource.file ? resourceName : name;
			const object = {
				...action.object,
				id: objectId,
				name: objectName,
				...action.object.asset ? { asset: rewriteResource(action.object.asset) } : {},
				...action.object.animations ? { animations: action.object.animations.map((animation) => ({
					...animation,
					images: animation.images.map((frame) => ({
						...frame,
						image: rewriteResource(frame.image)
					}))
				})) } : {}
			};
			const instance = action.instance ? {
				...action.instance,
				id: scene.instances.some((candidate) => candidate.id === action.instance.id) ? uid("inst") : action.instance.id,
				objectId
			} : void 0;
			const nextProject = withScene({
				...project,
				resources: [...project.resources, resource]
			}, state.activeSceneName, (current) => ({
				...current,
				objects: [...current.objects, object],
				instances: instance ? [...current.instances, instance] : current.instances
			}));
			return {
				...state,
				dirty: true,
				project: nextProject,
				ui: {
					...state.ui,
					selectedObjectIds: instance ? [] : [objectId],
					selectedInstanceIds: instance ? [instance.id] : []
				}
			};
		}
		case "updateResource": {
			const current = project.resources.find((resource) => resource.name === action.name);
			if (!current) return state;
			const nextName = action.patch.name?.trim() || current.name;
			if (nextName !== current.name && project.resources.some((resource) => resource.name === nextName)) return state;
			const nextFile = action.patch.file ?? (current.file === current.name ? nextName : current.file);
			const resources = project.resources.map((resource) => resource.name === action.name ? {
				...resource,
				...action.patch,
				name: nextName,
				file: nextFile
			} : resource);
			const scenes = project.scenes.map((entry) => ({
				...entry,
				objects: entry.objects.map((object) => ({
					...object,
					...object.asset === current.name ? { asset: nextName } : {},
					...object.animations ? { animations: object.animations.map((animation) => ({
						...animation,
						images: animation.images.map((frame) => frame.image === current.name ? {
							...frame,
							image: nextName
						} : frame)
					})) } : {}
				})),
				events: entry.events.map((event) => renameResourceInEvent(event, current.name, nextName))
			}));
			return {
				...state,
				dirty: true,
				project: {
					...project,
					resources,
					scenes
				}
			};
		}
		case "deleteResource": return {
			...state,
			dirty: true,
			project: {
				...project,
				resources: project.resources.filter((r) => r.name !== action.name)
			}
		};
		case "installExtension":
			if (project.extensions.some((e) => e.name === action.extension.name)) return state;
			return {
				...state,
				dirty: true,
				project: {
					...project,
					extensions: [...project.extensions, action.extension]
				}
			};
		case "uninstallExtension": return {
			...state,
			dirty: true,
			project: {
				...project,
				extensions: project.extensions.filter((e) => e.name !== action.name)
			}
		};
		case "addExternalEvents": {
			const name = action.name ?? newNameGenerator("Nueva lista de eventos", project.externalEvents.map((e) => e.name));
			return {
				...state,
				dirty: true,
				project: {
					...project,
					externalEvents: [...project.externalEvents, {
						name,
						events: []
					}]
				}
			};
		}
		case "addExternalLayout": {
			const name = action.name ?? newNameGenerator("Nuevo diseño", project.externalLayouts.map((l) => l.name));
			return {
				...state,
				dirty: true,
				project: {
					...project,
					externalLayouts: [...project.externalLayouts, {
						name,
						instances: []
					}]
				}
			};
		}
		default: return state;
	}
}
function writeVariableList(state, location, list) {
	if (location.scope === "global") return {
		...state,
		dirty: true,
		project: {
			...state.project,
			globalVariables: list
		}
	};
	return patchScene(state, (s) => {
		if (location.scope === "scene") return {
			...s,
			variables: list
		};
		if (location.scope === "object") return {
			...s,
			objects: s.objects.map((o) => o.id === location.objectId ? {
				...o,
				variables: list
			} : o)
		};
		return {
			...s,
			instances: s.instances.map((i) => i.id === location.objectId ? {
				...i,
				variables: list
			} : i)
		};
	});
}
function swap(list, from, to) {
	if (from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
	const a = list[from];
	const b = list[to];
	if (a === void 0 || b === void 0) return list;
	const next = [...list];
	next[from] = b;
	next[to] = a;
	return next;
}
/** Applies an effects-list update on the layer/object/instance that owns the list. */
function withEffects(scene, target, updater) {
	if (target.kind === "object") return {
		...scene,
		objects: scene.objects.map((o) => o.id === target.id ? {
			...o,
			effects: updater(o.effects)
		} : o)
	};
	if (target.kind === "instance") return {
		...scene,
		instances: scene.instances.map((i) => i.id === target.id ? {
			...i,
			effects: updater(i.effects)
		} : i)
	};
	return {
		...scene,
		layers: scene.layers.map((l) => l.name === target.name ? {
			...l,
			effects: updater(l.effects)
		} : l)
	};
}
function renameResourceInEvent(event, from, to) {
	const fix = (list) => list.map((instruction) => ({
		...instruction,
		parameters: instruction.parameters["file"] === from ? {
			...instruction.parameters,
			file: to
		} : instruction.parameters
	}));
	return {
		...event,
		conditions: fix(event.conditions),
		actions: fix(event.actions),
		subEvents: event.subEvents.map((child) => renameResourceInEvent(child, from, to))
	};
}
function renameObjectInEvent(event, from, to) {
	const fix = (list) => list.map((i) => {
		const parameters = { ...i.parameters };
		for (const key of Object.keys(parameters)) if (parameters[key] === from) parameters[key] = to;
		return {
			...i,
			parameters
		};
	});
	return {
		...event,
		conditions: fix(event.conditions),
		actions: fix(event.actions),
		subEvents: event.subEvents.map((s) => renameObjectInEvent(s, from, to))
	};
}
function cloneEvent(event) {
	return {
		...event,
		id: uid("ev"),
		conditions: event.conditions.map((c) => ({
			...c,
			id: uid("in"),
			parameters: { ...c.parameters }
		})),
		actions: event.actions.map((a) => ({
			...a,
			id: uid("in"),
			parameters: { ...a.parameters }
		})),
		subEvents: event.subEvents.map(cloneEvent)
	};
}
function reducer(state, action) {
	switch (action.type) {
		case "ui": return {
			...state,
			ui: {
				...state.ui,
				...action.patch
			}
		};
		case "openDialog": return {
			...state,
			ui: {
				...state.ui,
				dialog: action.dialog,
				inlineAi: null,
				quickAutomationOpen: false
			}
		};
		case "closeDialog": return {
			...state,
			ui: {
				...state.ui,
				dialog: null
			}
		};
		case "openInlineAi": {
			const scene = state.project.scenes.find((candidate) => candidate.name === state.activeSceneName) ?? state.project.scenes[0];
			if (!scene) return state;
			const instanceIds = state.ui.selectedInstanceIds.filter((id) => scene.instances.some((instance) => instance.id === id));
			const objectIds = [...new Set(instanceIds.length > 0 ? instanceIds.map((id) => scene.instances.find((instance) => instance.id === id)?.objectId).filter((id) => Boolean(id)) : state.ui.selectedObjectIds.filter((id) => scene.objects.some((object) => object.id === id)))];
			const objects = objectIds.map((id) => scene.objects.find((object) => object.id === id)).filter((object) => Boolean(object));
			const targetName = instanceIds.length === 1 && objects.length === 1 ? objects[0].name : instanceIds.length > 1 && objects.length === 1 ? `${objects[0].name} (${instanceIds.length} instancias)` : instanceIds.length > 0 ? `${instanceIds.length} instancias` : objects.length === 1 ? objects[0].name : objects.length > 1 ? `${objects.length} objetos` : void 0;
			const inlineAi = {
				x: action.x,
				y: action.y,
				sceneName: scene.name,
				instanceIds,
				objectIds,
				cursorPosition: state.ui.cursorPosition ? { ...state.ui.cursorPosition } : null,
				...targetName ? { targetName } : {}
			};
			return {
				...state,
				ui: {
					...state.ui,
					inlineAi,
					commandPaletteOpen: false,
					quickAutomationOpen: false
				}
			};
		}
		case "closeInlineAi": return {
			...state,
			ui: {
				...state.ui,
				inlineAi: null
			}
		};
		case "markSaved": return {
			...state,
			dirty: false
		};
		case "selectInstances": return {
			...state,
			ui: {
				...state.ui,
				selectedInstanceIds: action.ids,
				...action.ids.length > 0 ? { selectedObjectIds: [] } : {}
			}
		};
		case "selectEvents": return {
			...state,
			ui: {
				...state.ui,
				selectedEventIds: action.ids
			}
		};
		case "openTab": {
			const id = action.tab.id ?? `${action.tab.kind}:${action.tab.label}`;
			const openedTabs = state.ui.openedTabs.some((t) => t.id === id) ? state.ui.openedTabs : [...state.ui.openedTabs, {
				...action.tab,
				id
			}];
			const activeSceneName = action.tab.kind === "scene" && action.tab.sceneName ? action.tab.sceneName : state.activeSceneName;
			return {
				...state,
				activeSceneName,
				ui: {
					...state.ui,
					openedTabs,
					activeTabId: id
				}
			};
		}
		case "closeTab": {
			const index = state.ui.openedTabs.findIndex((t) => t.id === action.id);
			if (index === -1) return state;
			const openedTabs = state.ui.openedTabs.filter((t) => t.id !== action.id);
			let activeTabId = state.ui.activeTabId;
			let activeSceneName = state.activeSceneName;
			if (state.ui.activeTabId === action.id) {
				const next = openedTabs[Math.max(0, index - 1)];
				activeTabId = next?.id ?? "";
				if (next?.sceneName) activeSceneName = next.sceneName;
			}
			return {
				...state,
				activeSceneName,
				ui: {
					...state.ui,
					openedTabs,
					activeTabId
				}
			};
		}
		case "setActiveTab": {
			const tab = state.ui.openedTabs.find((t) => t.id === action.id);
			if (!tab) return state;
			return {
				...state,
				activeSceneName: tab.sceneName ?? state.activeSceneName,
				ui: {
					...state.ui,
					activeTabId: action.id
				}
			};
		}
		case "loadProject": {
			const migrated = migrateProject(action.project) ?? createDemoProject();
			const first = migrated.scenes[0]?.name ?? "Level 1";
			return {
				project: migrated,
				activeSceneName: first,
				ui: {
					...initialUI,
					openedTabs: [{
						id: `scene:${first}`,
						kind: "scene",
						label: first,
						sceneName: first
					}],
					activeTabId: `scene:${first}`
				},
				agent: createAgentSession(migrated),
				past: [],
				future: [],
				dirty: false
			};
		}
		case "applyAgentPlan": {
			if (action.agent === state.agent && action.project === state.project) return state;
			let openedTabs = state.ui.openedTabs;
			let activeTabId = state.ui.activeTabId;
			let activeSceneName = state.activeSceneName;
			const sceneName = action.sceneName;
			if (sceneName && action.project.scenes.some((candidate) => candidate.name === sceneName) && sceneName !== state.activeSceneName) {
				const id = `scene:${sceneName}`;
				if (!state.ui.openedTabs.some((tab) => tab.id === id)) openedTabs = [...state.ui.openedTabs, {
					id,
					kind: "scene",
					label: sceneName,
					sceneName
				}];
				activeSceneName = sceneName;
				activeTabId = id;
			}
			return {
				...state,
				project: action.project,
				agent: action.agent,
				activeSceneName,
				dirty: action.project !== state.project ? true : state.dirty,
				ui: {
					...state.ui,
					openedTabs,
					activeTabId,
					selectedInstanceIds: [],
					selectedObjectIds: []
				},
				past: [...state.past, {
					project: state.project,
					sceneName: state.activeSceneName,
					agent: state.agent
				}].slice(-60),
				future: []
			};
		}
		case "agentAudit": return {
			...state,
			agent: withAuditEntry(state.agent, action.entry)
		};
		case "agentSetMode": return {
			...state,
			agent: setAgentMode(state.agent, action.mode)
		};
		case "agentSetSnapshotMode": return {
			...state,
			agent: setAgentSnapshotMode(state.agent, action.mode)
		};
		case "recordHistory": return {
			...state,
			past: [...state.past, {
				project: state.project,
				sceneName: state.activeSceneName,
				agent: state.agent
			}].slice(-60),
			future: [],
			dirty: true
		};
		case "undo": {
			const prev = state.past[state.past.length - 1];
			if (!prev) return state;
			return {
				...state,
				project: prev.project,
				activeSceneName: prev.sceneName,
				agent: prev.agent,
				past: state.past.slice(0, -1),
				future: [{
					project: state.project,
					sceneName: state.activeSceneName,
					agent: state.agent
				}, ...state.future].slice(0, 60),
				dirty: true
			};
		}
		case "redo": {
			const next = state.future[0];
			if (!next) return state;
			return {
				...state,
				project: next.project,
				activeSceneName: next.sceneName,
				agent: next.agent,
				past: [...state.past, {
					project: state.project,
					sceneName: state.activeSceneName,
					agent: state.agent
				}].slice(-60),
				future: state.future.slice(1),
				dirty: true
			};
		}
		default: {
			const nextProject = projectReducer(state, action);
			if (nextProject === state) return state;
			if (!(nextProject.project !== state.project || nextProject.ui !== state.ui)) return state;
			const record = MUTATING.has(action.type) && action.type !== "moveInstances" && action.type !== "setInstancesPositions";
			return {
				...nextProject,
				past: record ? [...state.past, {
					project: state.project,
					sceneName: state.activeSceneName,
					agent: state.agent
				}].slice(-60) : nextProject.past,
				future: record ? [] : nextProject.future
			};
		}
	}
}
var EditorContext = React.createContext(null);
function EditorProvider({ children }) {
	const [state, dispatch] = React.useReducer(reducer, void 0, () => {
		const project = createDemoProject();
		return {
			project,
			activeSceneName: project.scenes[0]?.name ?? "Level 1",
			ui: initialUI,
			agent: createAgentSession(project),
			past: [],
			future: [],
			dirty: false
		};
	});
	React.useEffect(() => {
		const current = getCurrentProject();
		if (current?.project) dispatch({
			type: "loadProject",
			project: current.project
		});
	}, []);
	const activeTab = state.ui.openedTabs.find((tab) => tab.id === state.ui.activeTabId);
	const applyInlineAiPrompt = React.useCallback(async (prompt, targetName) => {
		const session = state.ui.inlineAi;
		if (!session) throw new Error("El editor in-situ de IA ya no está abierto.");
		if (targetName !== session.targetName) throw new Error("La selección cambió mientras se preparaba la edición.");
		const targetScene = state.project.scenes.find((candidate) => candidate.name === session.sceneName);
		if (!targetScene) throw new Error("La escena que intentas editar ya no existe.");
		const plan = createAiEditPlan(prompt, {
			scene: targetScene,
			selectedInstanceIds: session.instanceIds,
			selectedObjectIds: session.objectIds,
			cursorPosition: session.cursorPosition
		});
		const applied = applyAiEditPlan(targetScene, plan);
		dispatch({
			type: "applyAiEdit",
			sceneName: session.sceneName,
			scene: applied.scene,
			...applied.selectedInstanceIds !== void 0 ? { selectedInstanceIds: applied.selectedInstanceIds } : {}
		});
		dispatch({
			type: "agentAudit",
			entry: makeAuditEntry("applied", `Edición in-situ IA: ${plan.summary}`)
		});
		return plan.summary;
	}, [state]);
	const value = React.useMemo(() => ({
		state,
		project: state.project,
		scene: state.project.scenes.find((s) => s.name === state.activeSceneName) ?? state.project.scenes[0],
		activeSceneName: state.activeSceneName,
		activeTabKind: activeTab?.kind ?? "scene",
		ui: state.ui,
		agent: state.agent,
		dispatch,
		applyInlineAiPrompt,
		canUndo: state.past.length > 0,
		canRedo: state.future.length > 0,
		dirty: state.dirty
	}), [
		state,
		activeTab,
		applyInlineAiPrompt
	]);
	return /* @__PURE__ */ jsx(EditorContext.Provider, {
		value,
		children
	});
}
function useEditor() {
	const ctx = React.useContext(EditorContext);
	if (!ctx) throw new Error("useEditor must be used inside EditorProvider");
	return ctx;
}
//#endregion
//#region src/lib/editor/exportWeb.ts
async function exportGameToZip(project) {
	const zip = new JSZip();
	zip.file("project.json", JSON.stringify(project, null, 2));
	const htmlTemplate = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${project.name || "Nexus Game"}</title>
  <style>
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #000; display: flex; align-items: center; justify-content: center; }
    canvas { display: block; max-width: 100%; max-height: 100%; aspect-ratio: 16/9; background: #fff; }
  </style>
</head>
<body>
  <canvas id="gameCanvas" width="1280" height="720"></canvas>
  <script>
    const project = ${JSON.stringify(project)};
    console.log("Juego iniciado:", project.name);
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#7046EC";
    ctx.font = "bold 32px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(project.name + " - Listo para jugar", canvas.width / 2, canvas.height / 2);
  <\/script>
</body>
</html>`;
	zip.file("index.html", htmlTemplate);
	return await zip.generateAsync({ type: "blob" });
}
//#endregion
//#region src/components/editor/ShareDialog.tsx
function ShareDialog({ open, onClose, initialTab = "publish" }) {
	const { project } = useEditor();
	const [tab, setTab] = React.useState(initialTab);
	const [exporting, setExporting] = React.useState(false);
	React.useEffect(() => {
		setTab(initialTab);
	}, [initialTab]);
	const downloadZip = async () => {
		if (exporting) return;
		setExporting(true);
		try {
			const blob = await exportGameToZip(project);
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `${project.name || "nexus-game"}.zip`;
			document.body.appendChild(link);
			link.click();
			link.remove();
			URL.revokeObjectURL(url);
			toast.success("Paquete web exportado (ZIP)");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "No se pudo exportar el juego.");
		} finally {
			setExporting(false);
		}
	};
	if (!open) return null;
	return /* @__PURE__ */ jsx("div", {
		className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4",
		children: /* @__PURE__ */ jsxs("div", {
			className: "flex flex-col w-full max-w-lg rounded-xl border border-[#323242] bg-[#1E1E28] text-[#E0E0E6] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh]",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "flex h-12 shrink-0 items-center justify-between border-b border-[#2C2C3A] px-4",
					children: [/* @__PURE__ */ jsx("span", {
						className: "font-semibold text-sm text-white",
						children: "Comparte tu juego"
					}), /* @__PURE__ */ jsx("button", {
						type: "button",
						onClick: onClose,
						className: "flex h-7 w-7 items-center justify-center rounded-md text-[#8E8E9E] hover:bg-[#2C2C3A] hover:text-white transition-colors",
						children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "grid grid-cols-2 gap-1 border-b border-[#2C2C3A] bg-[#181820] p-1.5 text-xs",
					children: [/* @__PURE__ */ jsx("button", {
						type: "button",
						onClick: () => setTab("publish"),
						className: `rounded-md py-2 transition-colors ${tab === "publish" ? "bg-[#2F2F3E] text-white shadow-xs font-semibold" : "text-[#8E8E9E] hover:text-white"}`,
						children: "Publicar"
					}), /* @__PURE__ */ jsx("button", {
						type: "button",
						onClick: () => setTab("invite"),
						className: `rounded-md py-2 transition-colors ${tab === "invite" ? "bg-[#2F2F3E] text-white shadow-xs font-semibold" : "text-[#8E8E9E] hover:text-white"}`,
						children: "Invitar"
					})]
				}),
				/* @__PURE__ */ jsx("div", {
					className: "flex-1 overflow-y-auto p-4 space-y-3",
					children: tab === "publish" ? /* @__PURE__ */ jsxs(Fragment, { children: [
						/* @__PURE__ */ jsxs("button", {
							type: "button",
							onClick: () => {
								navigator.clipboard?.writeText(window.location.href);
								toast.success("Enlace compartible listo");
							},
							className: "w-full text-left rounded-lg border border-[#2E2E3C] bg-[#242432] p-3 hover:bg-[#2B2B3C] transition-colors group",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-2",
									children: [
										/* @__PURE__ */ jsx("span", {
											className: "flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-xs",
											children: "G"
										}),
										/* @__PURE__ */ jsx("span", {
											className: "text-sm font-medium text-white",
											children: "gd.games"
										}),
										/* @__PURE__ */ jsx("span", {
											className: "rounded bg-[#18392B] px-1.5 py-0.5 text-[10px] font-medium text-[#4ADE80] border border-[#22583F]",
											children: "El más fácil"
										})
									]
								}), /* @__PURE__ */ jsx(ChevronRight, { className: "h-4 w-4 text-[#8E8E9E] group-hover:text-white" })]
							}), /* @__PURE__ */ jsx("p", {
								className: "mt-1.5 text-xs text-[#9E9EAA]",
								children: "Genera un enlace compartible a tu juego."
							})]
						}),
						/* @__PURE__ */ jsxs("button", {
							type: "button",
							onClick: downloadZip,
							disabled: exporting,
							className: "w-full text-left rounded-lg border border-[#2E2E3C] bg-[#242432] p-3 hover:bg-[#2B2B3C] transition-colors group disabled:opacity-50",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ jsx(Globe, { className: "h-4 w-4 text-[#8E8E9E]" }), /* @__PURE__ */ jsx("span", {
										className: "text-sm font-medium text-white",
										children: "Navegador"
									})]
								}), /* @__PURE__ */ jsx(ChevronRight, { className: "h-4 w-4 text-[#8E8E9E] group-hover:text-white" })]
							}), /* @__PURE__ */ jsx("p", {
								className: "mt-1.5 text-xs text-[#9E9EAA]",
								children: "Portales de juego (Itch.io, Poki, CrazyGames...)"
							})]
						}),
						/* @__PURE__ */ jsxs("button", {
							type: "button",
							disabled: true,
							className: "w-full text-left rounded-lg border border-[#2E2E3C] bg-[#242432] p-3 hover:bg-[#2B2B3C] transition-colors group disabled:cursor-not-allowed disabled:opacity-50",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ jsx(Laptop, { className: "h-4 w-4 text-[#8E8E9E]" }), /* @__PURE__ */ jsx("span", {
										className: "text-sm font-medium text-white",
										children: "Escritorio"
									})]
								}), /* @__PURE__ */ jsx(ChevronRight, { className: "h-4 w-4 text-[#8E8E9E] group-hover:text-white" })]
							}), /* @__PURE__ */ jsx("p", {
								className: "mt-1.5 text-xs text-[#9E9EAA]",
								children: "Windows, MacOS, Linux (Steam, MS Store...)"
							})]
						}),
						/* @__PURE__ */ jsxs("button", {
							type: "button",
							disabled: true,
							className: "w-full text-left rounded-lg border border-[#2E2E3C] bg-[#242432] p-3 hover:bg-[#2B2B3C] transition-colors group disabled:cursor-not-allowed disabled:opacity-50",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ jsx(Smartphone, { className: "h-4 w-4 text-[#8E8E9E]" }), /* @__PURE__ */ jsx("span", {
										className: "text-sm font-medium text-white",
										children: "Android"
									})]
								}), /* @__PURE__ */ jsx(ChevronRight, { className: "h-4 w-4 text-[#8E8E9E] group-hover:text-white" })]
							}), /* @__PURE__ */ jsx("p", {
								className: "mt-1.5 text-xs text-[#9E9EAA]",
								children: "Móviles y tabletas (Google Play Store...)"
							})]
						})
					] }) : /* @__PURE__ */ jsxs("div", {
						className: "flex flex-col items-center justify-center py-8 text-center space-y-3",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "flex h-12 w-12 items-center justify-center rounded-full bg-[#2A2A38] text-[#8E8E9E]",
								children: /* @__PURE__ */ jsx(Users, { className: "h-6 w-6" })
							}),
							/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", {
								className: "text-sm font-medium text-white",
								children: "Trabaja en equipo"
							}), /* @__PURE__ */ jsx("p", {
								className: "text-xs text-[#8E8E9E] max-w-xs mt-1",
								children: "Invita a colaboradores para editar escenas, scripts y recursos de forma compartida."
							})] }),
							/* @__PURE__ */ jsx("button", {
								type: "button",
								disabled: true,
								className: "rounded-md bg-[#7046EC] px-4 py-2 text-xs font-semibold text-white hover:bg-[#5E34D9] transition-colors disabled:cursor-not-allowed disabled:opacity-50",
								children: "Crear enlace de invitación"
							})
						]
					})
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "flex h-12 shrink-0 items-center justify-between border-t border-[#2C2C3A] px-4",
					children: [/* @__PURE__ */ jsx("button", {
						type: "button",
						onClick: downloadZip,
						disabled: exporting,
						className: "text-xs font-medium text-[#C8C8D4] hover:text-white transition-colors disabled:opacity-50",
						children: exporting ? "Exportando..." : "Exportar como ZIP"
					}), /* @__PURE__ */ jsx("button", {
						type: "button",
						onClick: onClose,
						className: "rounded-md bg-[#2F2F3E] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#3B3B4E] transition-colors",
						children: "Cerrar"
					})]
				})
			]
		})
	});
}
//#endregion
//#region src/lib/editor/i18n.ts
var S = {
	projectManager: "Gestor de proyecto",
	gameSettings: "Configuración del juego",
	home: "Inicio",
	save: "Guardar el proyecto",
	versionHistory: "Abrir el historial de versiones",
	preview: "Vista previa",
	previewUpdate: "Actualizar",
	share: "Compartir",
	previewWithDebugger: "Iniciar vista previa y depurador",
	previewInNewWindow: "Una nueva ventana",
	previewNetwork: "Iniciar vista previa por red (WiFi/LAN)",
	useThisSceneForPreviews: "Usa esta escena para iniciar todas las vistas previas",
	askAi: "Editar con IA in-situ",
	undo: "Deshacer",
	redo: "Rehacer",
	undoChanges: "Deshacer los últimos cambios",
	redoChanges: "Rehacer los últimos cambios",
	toggleLeftPanel: "Mostrar/ocultar el panel izquierdo",
	toggleRightPanel: "Mostrar/ocultar el panel derecho",
	toggleWindowMask: "Máscara de la ventana",
	toggleGrid: "Alternar cuadrícula",
	snapToGrid: "Ajustar a la cuadrícula",
	clearClipboard: "Vaciar el portapapeles",
	windowMask: "Máscara de la ventana",
	setupGrid: "Configurar cuadrícula",
	zoomIn: "Acercar",
	zoomOut: "Alejar",
	zoomReset: "Restablecer zoom",
	zoomToFit: "Ajustar zoom al contenido",
	zoomToFitSelection: "Ajustar zoom a la selección",
	displayCollisionMasks: "Mostrar máscaras de colisión",
	commandPalette: "Paleta de comandos",
	sceneTab: "Escena",
	eventsTab: "Eventos",
	objects: "Objetos",
	sceneObjects: "Objetos de escena",
	globalObjects: "Objetos Globales",
	objectGroups: "Grupos de objetos",
	sceneGroups: "Grupos de Escenas",
	globalGroups: "Grupos globales",
	addANewObject: "Añadir un nuevo objeto",
	addObjectSearch: "Buscar un nuevo tipo de objeto",
	noObjectYet: "Empezar añadiendo un nuevo objeto.",
	editObject: "Editar objeto",
	editObjectVariables: "Editar variables de objeto",
	editBehaviors: "Editar comportamientos",
	editEffects: "Editar efectos",
	swapAssets: "Intercambiar activos",
	setAsGlobalObject: "Establecer como objeto global",
	removeAsGlobalObject: "Quitar objeto global",
	newInstanceFolder: "Crear nueva carpeta...",
	addInstanceToScene: "Añadir instancia a la escena",
	selectInstancesOnScene: "Seleccionar instancias en la escena",
	removeObject: "Eliminar objeto",
	confirmRemoveObject: "¿Está seguro de que desea eliminar este objeto? Esto no se puede deshacer.",
	layers: "Capas",
	addALayer: "Añadir una capa",
	addLightingLayer: "Añadir capa de iluminación",
	layerWhereInstancesAreAdded: "Capa en la que se añaden instancias por defecto",
	displayEffectsInEditor: "Mostrar efectos/iluminación en el editor",
	disableEffectsInEditor: "Desactivar efectos/iluminación en el editor",
	instances: "Instancias",
	searchInstances: "Buscar instancias",
	showHiddenInstances: "Mostrar las instancias ocultas",
	hideHiddenInstances: "Ocultar las instancias ocultas",
	options: "Opciones",
	centerOnInstance: "Centrar la cámara en la selección",
	visibleWhenSceneStarts: "Visible cuando comienza la escena",
	hiddenWhenSceneStarts: "Oculto cuando comienza la escena",
	searchObjects: "Buscar objetos",
	closeInstancesPanel: "Cerrar panel de lista de instancias",
	closeLayersPanel: "Cerrar panel de lista de capas",
	properties: "Propiedades",
	behaviors: "Comportamientos",
	effects: "Efectos",
	addEffects: "Añadir un efecto",
	unsupportedEffect: "Este efecto no está implementado en el motor de vista previa",
	addABehavior: "Añadir un comportamiento",
	addNewAnimation: "Añadir una nueva animación",
	resource: "Recurso",
	color: "Color",
	addYourFirstBehavior: "Añade tu primer comportamiento",
	instanceProperties: "Propiedades de la instancia",
	position: "Posición",
	size: "Tamaño",
	customSize: "Personalizar tamaño",
	angle: "Ángulo",
	zOrder: "Plano (Z)",
	layer: "Capa",
	opacity: "Opacidad",
	hidden: "Oculto",
	visible: "Visible",
	locked: "Bloqueado",
	variables: "Variables",
	sceneVariables: "Variables de la escena",
	instanceVariables: "Variables de instancia",
	globalVariables: "Variables globales",
	addYourFirstInstanceVariable: "Añade tu primera variable de instancia",
	addYourFirstVariable: "Añade tu primera variable",
	addVariables: "Añadir una variable",
	editObjectQuick: "Editar el objeto",
	scenePropertiesTitle: "Propiedades de la escena",
	customWindowSize: "Usar un tamaño personalizado para la escena",
	magnification: "Ampliación",
	renderOutsideGameArea: "Mostrar lo que hay fuera del área de juego",
	adaptResolution: "Adaptar la resolución en tiempo de ejecución",
	stopSounds: "Detener los sonidos al cambiar de escena",
	gridHorizontal: "Ancho de la cuadrícula",
	gridVertical: "Alto de la cuadrícula",
	gridOffsetX: "Desplazamiento horizontal",
	gridOffsetY: "Desplazamiento vertical",
	gridKind: "Tipo de cuadrícula",
	gridColor: "Color de la cuadrícula",
	gridAlpha: "Opacidad de la cuadrícula",
	name: "Nombre",
	type: "Tipo",
	value: "Valor",
	background: "Color de fondo",
	sceneProperties: "Propiedades de la escena",
	bringToFront: "Traer al frente",
	sendToBack: "Enviar al fondo",
	duplicate: "Duplicar",
	copy: "Copiar",
	cut: "Cortar",
	paste: "Pegar",
	rename: "Renombrar",
	delete: "Eliminar",
	removeUnused: "Eliminar los no usados...",
	lock: "Bloquear",
	unlock: "Desbloquear",
	hide: "Oculto",
	show: "Mostrar",
	edit: "Editar",
	add: "Añadir",
	cancel: "Cancelar",
	ok: "Ok",
	close: "Cerrar",
	help: "Ayuda",
	back: "Atrás",
	apply: "Aplicar",
	yes: "Si",
	no: "No",
	addANewEmptyEvent: "Añadir un nuevo evento vacío",
	addASubEvent: "Añadir un subevento al evento seleccionado",
	addAComment: "Añadir un comentario",
	addAGroup: "Añadir un grupo de eventos",
	chooseAndAddEvent: "Elige y agrega un evento",
	addALocalVariable: "Añadir una variable local",
	deleteSelectedEvents: "Eliminar los eventos seleccionados",
	searchInEvents: "Buscar en eventos",
	openSettings: "Configuración abierta",
	addCondition: "Añadir condición",
	addAction: "Añadir acción",
	condition: "Condición",
	action: "Acción",
	instructionEditor: "Editor de instrucciones",
	instructionIfNot: "Añadir si …no",
	helpForThisCondition: "Ayuda para esta condición",
	helpForThisAction: "Ayuda para esta acción",
	disable: "Deshabilitar",
	enable: "Habilitar",
	addEvent: "Añadir un evento",
	firstEventTitle: "Añade tu primer evento",
	firstEventHelp: "Los eventos son las reglas del juego: condiciones que se comprueban y acciones que se ejecutan.",
	elseLabel: "Si no (else)",
	resources: "Recursos",
	searchResources: "Buscar recursos",
	resourcesAnyKind: "Recursos (cualquier tipo)",
	addANewResource: "Añadir un nuevo recurso",
	image: "Imagen",
	audio: "Audio",
	font: "Fuente",
	json: "Archivo JSON",
	video: "Vídeo",
	chooseResourceType: "Elige un tipo de recurso",
	extensions: "Extensiones",
	assetStore: "Tienda de recursos",
	install: "Instalar",
	installed: "Instalado",
	alreadyInstalled: "(ya instalado en el proyecto)",
	searchExtensions: "Buscar extensiones",
	categories: "Categorías",
	stop: "Detener",
	restart: "Reiniciar",
	pause: "Pausa",
	resume: "Continuar",
	debugger: "Depurador",
	inspector: "Inspector",
	profiler: "Perfiles",
	fps: "FPS",
	frameTime: "Tiempo de cuadro",
	objectsCount: "Objetos",
	memory: "Memoria",
	eventsSheet: "Hoja de eventos",
	externalEvents: "Eventos externos",
	externalLayouts: "Diseños externos",
	scenes: "Escenas",
	addANewScene: "Añadir una escena",
	removeScene: "Eliminar escena",
	confirmRemoveScene: "¿Está seguro de que desea eliminar esta escena? Esto no se puede deshacer.",
	renameScene: "Renombrar escena",
	duplicateScene: "Duplicar escena"
};
//#endregion
//#region src/lib/projects/save.ts
/** Persiste un proyecto en el dispositivo y actualiza la referencia activa. */
async function saveProjectEverywhere(project) {
	const current = getCurrentProject();
	const entry = saveLocalProject({
		id: current?.id ?? null,
		name: project.name,
		project
	});
	setCurrentProject({
		id: entry.id,
		project
	});
	return { local: true };
}
//#endregion
//#region src/components/editor/MainMenu.tsx
function MainMenu() {
	const [open, setOpen] = React.useState(false);
	const [showRecents, setShowRecents] = React.useState(false);
	const [saving, setSaving] = React.useState(false);
	const { project, dispatch } = useEditor();
	const navigate = useNavigate();
	const isEditor = useRouterState().location.pathname.startsWith("/editor");
	project?.name;
	const recents = React.useMemo(() => {
		if (!open || !showRecents) return [];
		return listLocalProjects().slice(0, 8);
	}, [open, showRecents]);
	const closeMenu = () => {
		setOpen(false);
		setShowRecents(false);
	};
	const onSave = async () => {
		setSaving(true);
		try {
			await saveProjectEverywhere(project);
			dispatch({ type: "markSaved" });
			toast.success("Proyecto guardado en este dispositivo");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "No se pudo guardar el proyecto.");
		} finally {
			setSaving(false);
		}
	};
	const onNewGame = () => {
		const next = createEmptyProject({
			name: "Nuevo juego",
			windowWidth: 1280,
			windowHeight: 720
		});
		try {
			const saved = saveLocalProject({
				name: next.name,
				project: next
			});
			setCurrentProject({
				id: saved.id,
				project: next
			});
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "No se pudo crear el proyecto.");
			return;
		}
		dispatch({
			type: "loadProject",
			project: next
		});
		toast.success(`Creado «${next.name}»`);
		closeMenu();
	};
	const openRecent = (entry) => {
		setCurrentProject({
			id: entry.id,
			project: entry.project
		});
		dispatch({
			type: "loadProject",
			project: entry.project
		});
		toast.success(`Abierto «${entry.name}»`);
		closeMenu();
	};
	const onCloseProject = () => {
		try {
			clearCurrentProject();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "No se pudo cerrar el proyecto.");
			return;
		}
		closeMenu();
		navigate({ to: "/" });
	};
	const openShare = (tab) => {
		dispatch({
			type: "openDialog",
			dialog: {
				name: "share",
				tab
			}
		});
		closeMenu();
	};
	return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("button", {
		type: "button",
		onClick: () => setOpen(true),
		className: "flex h-8 w-8 shrink-0 items-center justify-center rounded text-[#d1d1d6] hover:bg-[#32323B] hover:text-white transition-colors",
		title: "Menú principal",
		"aria-label": "Menú principal",
		children: /* @__PURE__ */ jsx(Menu, { className: "h-4 w-4" })
	}), open && /* @__PURE__ */ jsxs("div", {
		className: "fixed inset-0 z-50 flex",
		children: [/* @__PURE__ */ jsx("div", {
			className: "fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity",
			onClick: closeMenu
		}), /* @__PURE__ */ jsxs("div", {
			className: "relative flex w-72 flex-col bg-[#1C1C24] text-white shadow-2xl border-r border-[#2C2C38] animate-in slide-in-from-left duration-200",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex h-12 items-center justify-between border-b border-[#2C2C38] px-4",
				children: [/* @__PURE__ */ jsxs("button", {
					type: "button",
					onClick: () => {
						closeMenu();
						navigate({ to: "/" });
					},
					className: "flex items-center gap-1.5 text-xs font-semibold text-[#8E8E9A] hover:text-white transition-colors",
					children: [/* @__PURE__ */ jsx(ChevronLeft, { className: "h-4 w-4" }), /* @__PURE__ */ jsx("span", { children: "Atrás" })]
				}), /* @__PURE__ */ jsx("button", {
					type: "button",
					onClick: closeMenu,
					className: "rounded p-1 text-[#8E8E9A] hover:bg-[#2C2C38] hover:text-white transition-colors",
					children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
				})]
			}), /* @__PURE__ */ jsxs("div", {
				className: "flex-1 overflow-y-auto py-2 text-xs font-medium",
				children: [
					/* @__PURE__ */ jsxs("button", {
						type: "button",
						onClick: onNewGame,
						className: "flex w-full items-center gap-2.5 px-4 py-2 text-[#D2D2D9] hover:bg-[#2A2A38] hover:text-white",
						children: [/* @__PURE__ */ jsx(FilePlus2, { className: "h-4 w-4 text-[#8E8E9A]" }), /* @__PURE__ */ jsx("span", { children: "Crear un juego" })]
					}),
					/* @__PURE__ */ jsxs("button", {
						type: "button",
						onClick: () => {
							closeMenu();
							navigate({ to: "/" });
						},
						className: "flex w-full items-center gap-2.5 px-4 py-2 text-[#D2D2D9] hover:bg-[#2A2A38] hover:text-white",
						children: [/* @__PURE__ */ jsx(FolderOpen, { className: "h-4 w-4 text-[#8E8E9A]" }), /* @__PURE__ */ jsx("span", { children: "Abrir..." })]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "relative",
						children: [/* @__PURE__ */ jsxs("button", {
							type: "button",
							onClick: () => setShowRecents(!showRecents),
							className: "flex w-full items-center justify-between gap-2.5 px-4 py-2 text-[#D2D2D9] hover:bg-[#2A2A38] hover:text-white",
							children: [/* @__PURE__ */ jsxs("span", {
								className: "flex items-center gap-2.5",
								children: [/* @__PURE__ */ jsx(History, { className: "h-4 w-4 text-[#8E8E9A]" }), /* @__PURE__ */ jsx("span", { children: "Abrir recientes" })]
							}), /* @__PURE__ */ jsx(ChevronRight, { className: "h-4 w-4 text-[#8E8E9A]" })]
						}), showRecents && /* @__PURE__ */ jsx("div", {
							className: "bg-[#181820] py-1 border-y border-[#2C2C38]",
							children: recents.length === 0 ? /* @__PURE__ */ jsx("div", {
								className: "px-6 py-1.5 text-[12px] text-[#8E8E9A] italic",
								children: "Sin recientes"
							}) : recents.map((entry) => /* @__PURE__ */ jsx("button", {
								type: "button",
								onClick: () => openRecent(entry),
								className: "flex w-full items-center gap-1.5 px-6 py-1.5 text-left text-[12px] text-[#D2D2D9] hover:bg-[#2A2A38] hover:text-white",
								children: /* @__PURE__ */ jsx("span", {
									className: "min-w-0 flex-1 truncate",
									children: entry.name
								})
							}, entry.id))
						})]
					}),
					/* @__PURE__ */ jsx("div", { className: "my-1.5 border-t border-[#2C2C38]" }),
					/* @__PURE__ */ jsxs("button", {
						type: "button",
						disabled: !isEditor,
						onClick: onSave,
						className: `flex w-full items-center gap-2.5 px-4 py-2 ${isEditor ? "text-[#D2D2D9] hover:bg-[#2A2A38] hover:text-white" : "text-[#555562] cursor-not-allowed"}`,
						children: [/* @__PURE__ */ jsx(Save, { className: "h-4 w-4 text-[#8E8E9A]" }), /* @__PURE__ */ jsx("span", { children: saving ? "Guardando..." : "Guardar" })]
					}),
					/* @__PURE__ */ jsxs("button", {
						type: "button",
						disabled: !isEditor,
						onClick: () => {
							closeMenu();
							toast.info("Para guardar una copia, usa Exportar como ZIP.");
						},
						className: `flex w-full items-center gap-2.5 px-4 py-2 ${isEditor ? "text-[#D2D2D9] hover:bg-[#2A2A38] hover:text-white" : "text-[#555562] cursor-not-allowed"}`,
						children: [/* @__PURE__ */ jsx(SaveAll, { className: "h-4 w-4 text-[#8E8E9A]" }), /* @__PURE__ */ jsx("span", { children: "Guardar como..." })]
					}),
					/* @__PURE__ */ jsxs("button", {
						type: "button",
						disabled: !isEditor,
						onClick: () => {
							closeMenu();
							toast.info("El historial de versiones estará disponible pronto.");
						},
						className: `flex w-full items-center gap-2.5 px-4 py-2 ${isEditor ? "text-[#D2D2D9] hover:bg-[#2A2A38] hover:text-white" : "text-[#555562] cursor-not-allowed"}`,
						children: [/* @__PURE__ */ jsx(History, { className: "h-4 w-4 text-[#8E8E9A]" }), /* @__PURE__ */ jsx("span", { children: "Mostrar historial de versiones" })]
					}),
					/* @__PURE__ */ jsx("div", { className: "my-1.5 border-t border-[#2C2C38]" }),
					/* @__PURE__ */ jsxs("button", {
						type: "button",
						disabled: !isEditor,
						onClick: () => openShare("invite"),
						className: `flex w-full items-center gap-2.5 px-4 py-2 ${isEditor ? "text-[#D2D2D9] hover:bg-[#2A2A38] hover:text-white" : "text-[#555562] cursor-not-allowed"}`,
						children: [/* @__PURE__ */ jsx(Share2, { className: "h-4 w-4 text-[#8E8E9A]" }), /* @__PURE__ */ jsx("span", { children: "Invitar colaboradores" })]
					}),
					/* @__PURE__ */ jsxs("button", {
						type: "button",
						disabled: !isEditor,
						onClick: () => openShare("publish"),
						className: `flex w-full items-center gap-2.5 px-4 py-2 ${isEditor ? "text-[#D2D2D9] hover:bg-[#2A2A38] hover:text-white" : "text-[#555562] cursor-not-allowed"}`,
						children: [/* @__PURE__ */ jsx(Share2, { className: "h-4 w-4 text-[#8E8E9A]" }), /* @__PURE__ */ jsx("span", { children: "Exportar (web, móvil)" })]
					}),
					/* @__PURE__ */ jsx("div", { className: "my-1.5 border-t border-[#2C2C38]" }),
					/* @__PURE__ */ jsxs("button", {
						type: "button",
						disabled: !isEditor,
						onClick: onCloseProject,
						className: `flex w-full items-center gap-2.5 px-4 py-2 ${isEditor ? "text-[#D2D2D9] hover:bg-[#2A2A38] hover:text-white" : "text-[#555562] cursor-not-allowed"}`,
						children: [/* @__PURE__ */ jsx(LogOut, { className: "h-4 w-4 text-[#8E8E9A]" }), /* @__PURE__ */ jsx("span", { children: "Cerrar proyecto" })]
					}),
					/* @__PURE__ */ jsxs("button", {
						type: "button",
						onClick: () => {
							closeMenu();
							dispatch({
								type: "openDialog",
								dialog: { name: "projectProperties" }
							});
						},
						className: "flex w-full items-center gap-2.5 px-4 py-2 text-[#D2D2D9] hover:bg-[#2A2A38] hover:text-white",
						children: [/* @__PURE__ */ jsx(Settings, { className: "h-4 w-4 text-[#8E8E9A]" }), /* @__PURE__ */ jsx("span", { children: "Preferencias" })]
					})
				]
			})]
		})]
	})] });
}
//#endregion
//#region src/components/editor/gd/kit.tsx
function PanelHeader({ title, badge, actions, onClose, className }) {
	return /* @__PURE__ */ jsxs("div", {
		className: cn("flex h-9 shrink-0 items-center gap-1 border-b border-separator px-2", className),
		children: [
			/* @__PURE__ */ jsx("span", {
				className: "flex-1 truncate text-[11px] font-semibold uppercase tracking-wide text-muted-foreground md:text-[11px]",
				children: title
			}),
			badge ? /* @__PURE__ */ jsx("span", {
				className: "rounded-full bg-elevated px-1.5 py-0.5 text-[10px] tabular-nums text-text-secondary",
				children: badge
			}) : null,
			actions,
			onClose ? /* @__PURE__ */ jsx("button", {
				type: "button",
				"aria-label": "Cerrar panel",
				onClick: onClose,
				className: "-mr-1 flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-elevated hover:text-foreground",
				children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
			}) : null
		]
	});
}
/** Panel column: header + scrollable body + optional footer action. */
function Panel({ title, badge, actions, footer, onClose, children, className, bodyClassName }) {
	return /* @__PURE__ */ jsxs("section", {
		className: cn("flex min-h-0 w-full flex-col border-separator bg-toolbar text-foreground", className),
		children: [
			/* @__PURE__ */ jsx(PanelHeader, {
				title,
				badge,
				actions,
				onClose
			}),
			/* @__PURE__ */ jsx("div", {
				className: cn("min-h-0 flex-1 overflow-y-auto", bodyClassName),
				children
			}),
			footer ? /* @__PURE__ */ jsx("div", {
				className: "shrink-0 border-t border-separator p-2",
				children: footer
			}) : null
		]
	});
}
function SearchBar({ value, onChange, placeholder, icon, autoFocus, className }) {
	return /* @__PURE__ */ jsxs("div", {
		className: cn("flex items-center gap-2 rounded bg-search-bar px-2 text-[12px] text-foreground", className),
		children: [
			icon,
			/* @__PURE__ */ jsx("input", {
				autoFocus,
				value,
				onChange: (e) => onChange(e.target.value),
				placeholder,
				className: "h-8 w-full min-w-0 bg-transparent text-[12px] text-foreground outline-none placeholder:text-text-placeholder"
			}),
			value ? /* @__PURE__ */ jsx("button", {
				type: "button",
				"aria-label": "Borrar",
				onClick: () => onChange(""),
				className: "text-text-secondary hover:text-foreground",
				children: /* @__PURE__ */ jsx(X, { className: "h-3.5 w-3.5" })
			}) : null
		]
	});
}
function GdButton({ variant = "flat", primary, success, className, children, icon, size = "medium", ...rest }) {
	return /* @__PURE__ */ jsxs("button", {
		type: "button",
		...rest,
		className: cn("inline-flex shrink-0 items-center justify-center gap-1.5 rounded font-medium transition-colors disabled:pointer-events-none disabled:opacity-40", size === "small" ? "h-7 px-2 text-[11px]" : "h-9 md:h-8 px-3 text-[12.5px]", variant === "raised" && (primary ? "bg-primary text-primary-foreground hover:bg-[#5C36D6]" : success ? "bg-success text-window hover:opacity-90" : "bg-elevated text-foreground hover:bg-selection"), variant === "flat" && (primary ? "bg-primary/15 text-link hover:bg-primary/25" : "text-muted-foreground hover:bg-hover-bg hover:text-foreground"), variant === "text" && "text-link underline-offset-2 hover:underline", className),
		children: [icon, children]
	});
}
function IconButton({ label, active, className, children, ...rest }) {
	return /* @__PURE__ */ jsx("button", {
		type: "button",
		title: label,
		"aria-label": label,
		"aria-pressed": active,
		...rest,
		className: cn("flex h-9 w-9 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-hover-bg hover:text-foreground md:h-7 md:w-7", active && "bg-elevated text-link", rest.disabled && "pointer-events-none opacity-40", className),
		children
	});
}
function GdDialog({ open, onClose, title, children, footer, width = "max-w-3xl", helpPath }) {
	React.useEffect(() => {
		if (!open) return;
		const onKey = (e) => {
			if (e.key === "Escape") {
				e.stopPropagation();
				onClose();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open, onClose]);
	if (!open) return null;
	return /* @__PURE__ */ jsx("div", {
		className: "fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 md:items-center md:p-4",
		onMouseDown: (e) => e.target === e.currentTarget && onClose(),
		children: /* @__PURE__ */ jsxs("div", {
			role: "dialog",
			"aria-modal": "true",
			className: cn("flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-lg border border-separator bg-toolbar shadow-[0_14px_40px_rgba(0,0,0,0.45)] md:rounded-lg", width),
			children: [
				/* @__PURE__ */ jsxs("header", {
					className: "flex h-12 shrink-0 items-center gap-2 border-b border-separator px-4",
					children: [
						/* @__PURE__ */ jsx("h2", {
							className: "min-w-0 flex-1 truncate text-[14px] font-semibold text-foreground md:text-[13px]",
							children: title
						}),
						helpPath ? /* @__PURE__ */ jsx("a", {
							href: helpPath,
							target: "_blank",
							rel: "noreferrer",
							title: "Ayuda",
							className: "flex h-8 w-8 items-center justify-center rounded text-muted-foreground hover:bg-elevated hover:text-foreground",
							children: /* @__PURE__ */ jsx(HelpCircle, { className: "h-4 w-4" })
						}) : null,
						/* @__PURE__ */ jsx("button", {
							type: "button",
							"aria-label": "Cerrar",
							onClick: onClose,
							className: "flex h-8 w-8 items-center justify-center rounded text-muted-foreground hover:bg-elevated hover:text-foreground",
							children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
						})
					]
				}),
				/* @__PURE__ */ jsx("div", {
					className: "min-h-0 flex-1 overflow-y-auto",
					children
				}),
				footer ? /* @__PURE__ */ jsx("footer", {
					className: "flex shrink-0 items-center justify-end gap-2 border-t border-separator px-3 py-2",
					children: footer
				}) : null
			]
		})
	});
}
function GdMenu({ entries, onClose, anchor }) {
	const ref = React.useRef(null);
	const [position, setPosition] = React.useState(anchor);
	React.useLayoutEffect(() => {
		const el = ref.current;
		if (!el) return;
		const rect = el.getBoundingClientRect();
		setPosition({
			x: Math.max(4, Math.min(anchor.x, window.innerWidth - rect.width - 8)),
			y: Math.max(4, Math.min(anchor.y, window.innerHeight - rect.height - 8))
		});
	}, [anchor.x, anchor.y]);
	React.useEffect(() => {
		const dismiss = (e) => {
			if (ref.current && !ref.current.contains(e.target)) onClose();
		};
		const onKey = (e) => e.key === "Escape" && onClose();
		window.addEventListener("mousedown", dismiss);
		window.addEventListener("keydown", onKey);
		return () => {
			window.removeEventListener("mousedown", dismiss);
			window.removeEventListener("keydown", onKey);
		};
	}, [onClose]);
	return /* @__PURE__ */ jsx("div", {
		ref,
		className: "fixed z-[60] min-w-48 overflow-hidden rounded-md border border-separator bg-toolbar py-1 shadow-[0_10px_30px_rgba(0,0,0,0.5)]",
		style: {
			left: position.x,
			top: position.y
		},
		role: "menu",
		children: entries.map((entry) => /* @__PURE__ */ jsxs(React.Fragment, { children: [entry.separatorBefore ? /* @__PURE__ */ jsx("div", { className: "my-1 h-px bg-separator" }) : null, /* @__PURE__ */ jsxs("button", {
			type: "button",
			role: "menuitem",
			disabled: entry.disabled,
			onClick: () => {
				entry.onSelect?.();
				onClose();
			},
			className: cn("flex w-full items-center gap-2 px-3 py-[6px] text-left text-[12.5px] text-foreground hover:bg-list-hover disabled:pointer-events-none disabled:opacity-40", entry.danger && "text-destructive"),
			children: [/* @__PURE__ */ jsx("span", {
				className: "flex w-4 shrink-0 justify-center",
				children: entry.checked ? /* @__PURE__ */ jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-success" }) : entry.icon
			}), /* @__PURE__ */ jsx("span", {
				className: "truncate",
				children: entry.label
			})]
		})] }, entry.id))
	});
}
/** Hook for the right-click menus used across panels and the canvas. */
function useContextMenu() {
	const [state, setState] = React.useState(null);
	const open = (event, entries) => {
		event.preventDefault();
		event.stopPropagation();
		setState({
			anchor: {
				x: event.clientX,
				y: event.clientY
			},
			entries
		});
	};
	return {
		open,
		menu: state ? /* @__PURE__ */ jsx(GdMenu, {
			entries: state.entries,
			anchor: state.anchor,
			onClose: () => setState(null)
		}) : null,
		isOpen: state !== null
	};
}
function FieldRow({ label, children, hint }) {
	return /* @__PURE__ */ jsxs("label", {
		className: "flex items-center gap-2 px-3 py-1 text-[12.5px]",
		children: [
			/* @__PURE__ */ jsx("span", {
				className: "w-28 shrink-0 truncate text-[12.5px] text-text-secondary",
				title: typeof label === "string" ? label : void 0,
				children: label
			}),
			/* @__PURE__ */ jsx("span", {
				className: "flex min-w-0 flex-1 items-center gap-2",
				children
			}),
			hint
		]
	});
}
var underlineField = "h-8 min-w-0 flex-1 border-b border-input bg-transparent px-1 text-[12.5px] text-foreground outline-none focus:border-link-hover";
function TextField({ value, onChange, placeholder, type = "text", align }) {
	return /* @__PURE__ */ jsx("input", {
		type,
		value,
		placeholder,
		onChange: (e) => onChange(e.target.value),
		className: cn(underlineField, align === "center" && "text-center tabular-nums")
	});
}
function NumberField({ value, onChange, step = 1 }) {
	return /* @__PURE__ */ jsx("input", {
		type: "number",
		step,
		value: Number.isFinite(value) ? value : 0,
		onChange: (e) => onChange(Number(e.target.value)),
		className: cn(underlineField, "tabular-nums")
	});
}
function ChoiceField({ value, options, onChange, labels }) {
	return /* @__PURE__ */ jsx("select", {
		value,
		onChange: (e) => onChange(e.target.value),
		className: cn(underlineField, "appearance-none pr-6"),
		children: options.map((option) => /* @__PURE__ */ jsx("option", {
			value: option,
			className: "bg-toolbar",
			children: labels?.[option] ?? option
		}, option))
	});
}
/** GDevelop's on/off switch, sized for the properties panel. */
function ToggleField({ checked, onChange, label }) {
	return /* @__PURE__ */ jsx("button", {
		type: "button",
		role: "switch",
		"aria-checked": checked,
		"aria-label": label,
		onClick: () => onChange(!checked),
		className: cn("relative h-[18px] w-[34px] shrink-0 rounded-full transition-colors", checked ? "bg-[#9979f1]" : "bg-[#606166]"),
		children: /* @__PURE__ */ jsx("span", { className: cn("absolute top-[2px] h-[14px] w-[14px] rounded-full bg-[#FAFAFA] transition-all", checked ? "left-[18px]" : "left-[2px]") })
	});
}
function ColorField({ value, onChange }) {
	const toHex = (rgb) => {
		const [r = "0", g = "0", b = "0"] = rgb.split(";");
		const n = (v) => Math.max(0, Math.min(255, Number(v) || 0));
		return `#${[
			n(r),
			n(g),
			n(b)
		].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
	};
	const fromHex = (hex) => {
		const clean = hex.replace("#", "");
		if (clean.length !== 6) return value;
		return [
			0,
			2,
			4
		].map((i) => parseInt(clean.slice(i, i + 2), 16)).join(";");
	};
	return /* @__PURE__ */ jsxs("span", {
		className: "flex min-w-0 flex-1 items-center gap-2",
		children: [/* @__PURE__ */ jsx("input", {
			value,
			onChange: (e) => onChange(e.target.value),
			className: cn(underlineField, "tabular-nums")
		}), /* @__PURE__ */ jsx("input", {
			type: "color",
			value: toHex(value),
			onChange: (e) => onChange(fromHex(e.target.value)),
			"aria-label": "Selector de color",
			className: "h-7 w-9 shrink-0 cursor-pointer rounded border border-separator bg-window p-0.5"
		})]
	});
}
/** Section used inside the properties editor (collapsible, chevron button). */
function PropertySection({ title, children, defaultOpen = true, right }) {
	const [open, setOpen] = React.useState(defaultOpen);
	return /* @__PURE__ */ jsxs("div", {
		className: "border-b border-separator py-1.5",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex items-center gap-2 px-2",
			children: [
				/* @__PURE__ */ jsx("button", {
					type: "button",
					"aria-expanded": open,
					onClick: () => setOpen((o) => !o),
					className: "flex h-8 w-8 items-center justify-center rounded-md border border-separator text-muted-foreground hover:text-foreground",
					children: open ? /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx(ChevronRight, { className: "h-4 w-4" })
				}),
				/* @__PURE__ */ jsx("span", {
					className: "flex-1 truncate text-[13px] font-semibold text-foreground",
					children: title
				}),
				right
			]
		}), open ? /* @__PURE__ */ jsx("div", {
			className: "mt-1",
			children
		}) : null]
	});
}
//#endregion
//#region src/components/editor/ProjectTitlebar.tsx
function ProjectTitlebar() {
	useNavigate();
	const { ui, dispatch, project, activeSceneName, dirty } = useEditor();
	const [menu, setMenu] = useState(null);
	const [saving, setSaving] = useState(false);
	const onSave = async () => {
		setSaving(true);
		try {
			const result = await saveProjectEverywhere(project);
			dispatch({ type: "markSaved" });
			if (result.local) window.alert?.("Guardado en este dispositivo");
		} catch (error) {
			window.alert?.(error instanceof Error ? error.message : "No se pudo guardar el proyecto.");
		} finally {
			setSaving(false);
		}
	};
	const plusEntries = [
		...project.scenes.map((scene) => ({
			id: `scene:${scene.name}`,
			label: scene.name,
			checked: scene.name === activeSceneName,
			onSelect: () => dispatch({
				type: "openTab",
				tab: {
					kind: "scene",
					label: scene.name,
					sceneName: scene.name
				}
			})
		})),
		{
			id: "sep-scenes",
			label: "",
			separatorBefore: true
		},
		{
			id: "add-scene",
			label: S.addANewScene,
			icon: /* @__PURE__ */ jsx(Plus, { className: "h-3.5 w-3.5" }),
			onSelect: () => dispatch({ type: "addScene" })
		},
		{
			id: "resources",
			label: S.resources,
			onSelect: () => dispatch({
				type: "openDialog",
				dialog: { name: "resources" }
			})
		},
		{
			id: "global-variables",
			label: S.globalVariables,
			onSelect: () => dispatch({
				type: "openDialog",
				dialog: {
					name: "variables",
					scope: "global"
				}
			})
		},
		{
			id: "game-settings",
			label: S.gameSettings,
			onSelect: () => dispatch({
				type: "openDialog",
				dialog: { name: "projectProperties" }
			})
		},
		{
			id: "home",
			label: S.home,
			onSelect: () => dispatch({
				type: "openTab",
				tab: {
					kind: "home",
					label: S.home
				}
			})
		}
	];
	return /* @__PURE__ */ jsxs("div", {
		className: "flex h-8 shrink-0 items-stretch gap-0 overflow-hidden bg-toolbar pl-1 text-foreground",
		children: [
			/* @__PURE__ */ jsx(MainMenu, {}),
			/* @__PURE__ */ jsx("span", {
				className: "mr-1 flex min-w-0 max-w-24 shrink-0 items-center truncate border-r border-[#2c2c36] pl-0.5 pr-2 text-[12px] font-medium text-foreground md:max-w-48",
				title: project.name,
				children: project.name
			}),
			/* @__PURE__ */ jsx("button", {
				type: "button",
				"aria-label": S.projectManager,
				title: S.projectManager,
				onClick: () => dispatch({
					type: "ui",
					patch: { projectManagerOpen: true }
				}),
				className: "mr-1 flex w-9 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-elevated hover:text-foreground",
				children: /* @__PURE__ */ jsx(Ellipsis, { className: "h-4 w-4" })
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex min-w-0 flex-1 items-stretch gap-px overflow-x-auto [&::-webkit-scrollbar]:h-0",
				children: [ui.openedTabs.map((tab) => {
					const active = tab.id === ui.activeTabId;
					return /* @__PURE__ */ jsxs("div", {
						onClick: () => dispatch({
							type: "setActiveTab",
							id: tab.id
						}),
						className: cn("group flex shrink-0 cursor-pointer items-center gap-1 rounded-t px-1 text-[12px] md:text-[12px]", active ? "bg-tab text-[#f6f2ff]" : "text-tab-inactive hover:bg-[#3c3c46] hover:text-foreground"),
						style: {
							borderTop: active ? "1px solid #7f7f85" : "1px solid transparent",
							borderLeft: active ? "1px solid #7f7f85" : "1px solid transparent",
							borderRight: active ? "1px solid #7f7f85" : "1px solid transparent"
						},
						title: tab.label,
						children: [
							/* @__PURE__ */ jsx(GripVertical, { className: "ml-0.5 h-3 w-3 shrink-0 opacity-30" }),
							tab.kind === "home" ? /* @__PURE__ */ jsx(NexusMark, { className: "h-4 w-4 rounded-sm" }) : null,
							/* @__PURE__ */ jsx("span", {
								className: "max-w-40 truncate px-1 py-1.5",
								children: tab.label
							}),
							tab.kind !== "home" || project.scenes.length > 1 ? /* @__PURE__ */ jsx("button", {
								type: "button",
								"aria-label": "Cerrar pestaña",
								onClick: (event) => {
									event.stopPropagation();
									dispatch({
										type: "closeTab",
										id: tab.id
									});
								},
								className: cn("grid h-5 w-5 place-items-center rounded-sm text-[#c9c9cd] opacity-0 hover:bg-[#25252e] group-hover:opacity-100", active && "opacity-70"),
								children: /* @__PURE__ */ jsx(X, { className: "h-3 w-3" })
							}) : null
						]
					}, tab.id);
				}), /* @__PURE__ */ jsx("button", {
					type: "button",
					"aria-label": "Añadir pestaña",
					title: "Añadir pestaña",
					onClick: (event) => {
						const rect = event.currentTarget.getBoundingClientRect();
						setMenu({
							x: rect.left,
							y: rect.bottom + 2
						});
					},
					className: "my-1 flex h-6 w-6 shrink-0 items-center justify-center self-start rounded text-muted-foreground hover:bg-elevated hover:text-foreground",
					children: /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" })
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex shrink-0 items-center gap-1 px-1",
				children: [/* @__PURE__ */ jsxs("button", {
					type: "button",
					onClick: () => void onSave(),
					title: S.save,
					"aria-label": S.save,
					className: "flex h-6 items-center gap-1 rounded px-1.5 text-[11px] text-muted-foreground hover:bg-elevated hover:text-foreground",
					children: [/* @__PURE__ */ jsx(Save, { className: cn("h-3.5 w-3.5", saving && "animate-pulse") }), /* @__PURE__ */ jsxs("span", {
						className: "hidden lg:inline",
						children: [dirty ? /* @__PURE__ */ jsx("span", { className: "mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#FFBC57] align-middle" }) : null, dirty ? "Sin guardar" : "Guardado"]
					})]
				}), /* @__PURE__ */ jsxs("a", {
					href: "https://gdevelop.io",
					target: "_blank",
					rel: "noreferrer",
					title: `${BRAND.name} — ${BRAND.tagline}`,
					className: "ml-1 hidden h-6 items-center gap-1 rounded px-1 text-[11px] text-muted-foreground hover:bg-elevated hover:text-foreground md:flex",
					children: [/* @__PURE__ */ jsx(HelpCircle, { className: "h-3.5 w-3.5" }), BRAND.name]
				})]
			}),
			menu ? /* @__PURE__ */ jsx(GdMenu, {
				entries: plusEntries,
				anchor: menu,
				onClose: () => setMenu(null)
			}) : null
		]
	});
}
//#endregion
//#region src/lib/editor/clipboard.ts
var clipboard = null;
function copyObjects(objects) {
	if (objects.length === 0) return;
	clipboard = {
		kind: "objects",
		objects: objects.map((o) => ({
			...structuredCloneSafe(o),
			isGlobal: false
		}))
	};
}
function copyInstances(instances) {
	if (instances.length === 0) return;
	clipboard = {
		kind: "instances",
		instances: instances.map((i) => structuredCloneSafe(i))
	};
}
function cutObjects(scene, ids) {
	copyObjects(scene.objects.filter((o) => ids.includes(o.id)));
}
function cutInstances(scene, ids) {
	copyInstances(scene.instances.filter((i) => ids.includes(i.id)));
}
function hasClipboard() {
	return clipboard !== null;
}
function clipboardSummary() {
	if (!clipboard) return "";
	if (clipboard.kind === "objects") return clipboard.objects.map((o) => o.name).join(", ");
	const first = clipboard.instances[0];
	return clipboard.instances.length === 1 && first ? sceneObjectName(first) : `${clipboard.instances.length} instancias`;
}
function sceneObjectName(instance) {
	return instance.objectId;
}
/** Returns the new entities to insert into the scene. */
function pasteInto(scene) {
	if (!clipboard) return {
		objects: [],
		instances: []
	};
	if (clipboard.kind === "objects") {
		const taken = scene.objects.map((o) => o.name);
		const objects = clipboard.objects.map((object) => ({
			...structuredCloneSafe(object),
			id: uid("obj"),
			name: newNameGenerator(object.name, taken)
		}));
		for (const object of objects) taken.push(object.name);
		return {
			objects,
			instances: []
		};
	}
	return {
		objects: [],
		instances: clipboard.instances.map((instance) => ({
			...structuredCloneSafe(instance),
			id: uid("inst"),
			x: instance.x + 32,
			y: instance.y + 32
		}))
	};
}
function structuredCloneSafe(value) {
	if (typeof structuredClone === "function") return structuredClone(value);
	return JSON.parse(JSON.stringify(value));
}
function clearClipboard() {
	clipboard = null;
}
//#endregion
//#region src/lib/editor/canvas-gestures.ts
var CANVAS_MIN_ZOOM = 1 / 128;
function clampCanvasZoom(zoom) {
	return Math.min(128, Math.max(CANVAS_MIN_ZOOM, zoom));
}
function midpoint(a, b) {
	return {
		x: (a.x + b.x) / 2,
		y: (a.y + b.y) / 2
	};
}
function pointDistance(a, b) {
	return Math.hypot(a.x - b.x, a.y - b.y);
}
/**
* Offset contributed by the editor itself before the user's pan is applied.
* Large game windows are kept centered in the available viewport, matching the
* scene editor projection used by SceneCanvas.
*/
function centeredWindowOffset(viewport, gameWindow, scale, centerWindow) {
	if (!centerWindow) return {
		x: 0,
		y: 0
	};
	return {
		x: (viewport.width - gameWindow.width * scale) / 2,
		y: (viewport.height - gameWindow.height * scale) / 2
	};
}
/** Return whether SceneCanvas uses its centered-window projection. */
function shouldCenterGameWindow(viewport, gameWindow, magnification, padding = 32) {
	return Math.min((viewport.width - padding) / Math.max(1, gameWindow.width * magnification), (viewport.height - padding) / Math.max(1, gameWindow.height * magnification)) < 1;
}
/**
* Zoom that leaves the complete game window visible with a small editor margin.
* The result is the UI zoom (before a scene magnification is applied).
*/
function fitGameWindowZoom(viewport, gameWindow, magnification, padding = 48) {
	const usableWidth = Math.max(1, viewport.width - padding);
	const usableHeight = Math.max(1, viewport.height - padding);
	return clampCanvasZoom(Math.min(usableWidth / Math.max(1, gameWindow.width), usableHeight / Math.max(1, gameWindow.height), magnification) / Math.max(Number.EPSILON, magnification));
}
/**
* Resolve a two-pointer gesture from its initial snapshot. The scene point that
* was below the initial midpoint stays below the current midpoint. Consequently
* moving both fingers pans, changing their distance zooms, and doing both works
* in one gesture without jumps.
*/
function resolveTwoPointerGesture(start, points) {
	const startCenter = midpoint(start.points[0], start.points[1]);
	const currentCenter = midpoint(points[0], points[1]);
	const startDistance = Math.max(1, pointDistance(start.points[0], start.points[1]));
	const currentDistance = Math.max(1, pointDistance(points[0], points[1]));
	const zoom = clampCanvasZoom(start.zoom * (currentDistance / startDistance));
	const scale = zoom * start.magnification;
	const worldAnchor = {
		x: (startCenter.x - start.transform.offsetX) / start.transform.scale,
		y: (startCenter.y - start.transform.offsetY) / start.transform.scale
	};
	const wantedOffset = {
		x: currentCenter.x - worldAnchor.x * scale,
		y: currentCenter.y - worldAnchor.y * scale
	};
	const centeredOffset = centeredWindowOffset(start.viewport, start.gameWindow, scale, start.centerWindow);
	return {
		zoom,
		pan: {
			x: wantedOffset.x - centeredOffset.x,
			y: wantedOffset.y - centeredOffset.y
		}
	};
}
/** Zoom around a screen-space point while keeping its scene position fixed. */
function resolveZoomAtPoint(point, nextZoom, options) {
	const zoom = clampCanvasZoom(nextZoom);
	const scale = zoom * options.magnification;
	const worldAnchor = {
		x: (point.x - options.transform.offsetX) / options.transform.scale,
		y: (point.y - options.transform.offsetY) / options.transform.scale
	};
	const wantedOffset = {
		x: point.x - worldAnchor.x * scale,
		y: point.y - worldAnchor.y * scale
	};
	const centeredOffset = centeredWindowOffset(options.viewport, options.gameWindow, scale, options.centerWindow);
	return {
		zoom,
		pan: {
			x: wantedOffset.x - centeredOffset.x,
			y: wantedOffset.y - centeredOffset.y
		}
	};
}
//#endregion
//#region src/components/editor/TopToolbar.tsx
var ZOOM_BUTTON_FACTOR$1 = 2 ** (2 / 16);
var Sep = () => /* @__PURE__ */ jsx("div", { className: "mx-1 h-5 w-px shrink-0 bg-separator" });
function TopToolbar() {
	const { ui, dispatch, scene, canUndo, canRedo } = useEditor();
	const [previewMenu, setPreviewMenu] = useState(null);
	const isEvents = ui.tab === "events";
	const tab = ui.openedTabs.find((t) => t.id === ui.activeTabId);
	const isProjectTab = !!tab && tab.kind !== "scene";
	const onPaste = () => {
		if (!hasClipboard()) return;
		const { objects, instances } = pasteInto(scene);
		for (const object of objects) dispatch({
			type: "addObject",
			object
		});
		if (instances.length > 0) dispatch({
			type: "addInstances",
			instances
		});
		if (objects.length === 0 && instances.length === 0) window.alert?.("El portapapeles está vacío");
	};
	const previewEntries = [
		{
			id: "preview",
			label: S.preview,
			icon: /* @__PURE__ */ jsx(Play, { className: "h-3.5 w-3.5" }),
			onSelect: () => dispatch({
				type: "ui",
				patch: {
					previewOpen: true,
					previewWithDebugger: false
				}
			})
		},
		{
			id: "debugger",
			label: S.previewWithDebugger,
			icon: /* @__PURE__ */ jsx(Clock, { className: "h-3.5 w-3.5" }),
			onSelect: () => dispatch({
				type: "ui",
				patch: {
					previewOpen: true,
					previewWithDebugger: true
				}
			})
		},
		{
			id: "new-window",
			label: S.previewInNewWindow,
			onSelect: () => dispatch({
				type: "ui",
				patch: { previewOpen: true }
			})
		},
		{
			id: "use-scene",
			label: S.useThisSceneForPreviews,
			separatorBefore: true,
			disabled: isProjectTab,
			onSelect: () => dispatch({
				type: "updateGameSettings",
				patch: { startScene: scene.name }
			})
		}
	];
	return /* @__PURE__ */ jsxs("div", {
		className: "flex h-10 shrink-0 items-center gap-0.5 border-b border-separator bg-toolbar px-2 text-[13px]",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto [&::-webkit-scrollbar]:h-0",
				children: [
					/* @__PURE__ */ jsx(IconButton, {
						label: `${S.undo} (Ctrl+Z)`,
						disabled: !canUndo,
						onClick: () => dispatch({ type: "undo" }),
						children: /* @__PURE__ */ jsx(Undo2, { className: "h-4 w-4" })
					}),
					/* @__PURE__ */ jsx(IconButton, {
						label: `${S.redo} (Ctrl+Shift+Z)`,
						disabled: !canRedo,
						onClick: () => dispatch({ type: "redo" }),
						children: /* @__PURE__ */ jsx(Redo2, { className: "h-4 w-4" })
					}),
					!isEvents && /* @__PURE__ */ jsxs(Fragment, { children: [
						/* @__PURE__ */ jsx(Sep, {}),
						/* @__PURE__ */ jsx(IconButton, {
							label: `${S.copy} (Ctrl+C)`,
							onClick: () => {
								const ids = ui.selectedInstanceIds.length ? ui.selectedInstanceIds : ui.selectedObjectIds;
								if (ui.selectedInstanceIds.length) copyInstances(scene.instances.filter((i) => ids.includes(i.id)));
								else copyObjects(scene.objects.filter((o) => ui.selectedObjectIds.includes(o.id)));
							},
							children: /* @__PURE__ */ jsx(Copy, { className: "h-4 w-4" })
						}),
						/* @__PURE__ */ jsx(IconButton, {
							label: `${S.cut} (Ctrl+X)`,
							onClick: () => {
								if (ui.selectedInstanceIds.length) {
									copyInstances(scene.instances.filter((i) => ui.selectedInstanceIds.includes(i.id)));
									dispatch({
										type: "deleteInstances",
										ids: ui.selectedInstanceIds
									});
								} else if (ui.selectedObjectIds.length) {
									copyObjects(scene.objects.filter((o) => ui.selectedObjectIds.includes(o.id)));
									for (const id of ui.selectedObjectIds) dispatch({
										type: "deleteObject",
										id
									});
								}
							},
							children: /* @__PURE__ */ jsx(Scissors, { className: "h-4 w-4" })
						}),
						/* @__PURE__ */ jsx(IconButton, {
							label: `${S.paste} (Ctrl+V)${hasClipboard() ? `: ${clipboardSummary()}` : ""}`,
							disabled: !hasClipboard(),
							onClick: onPaste,
							children: /* @__PURE__ */ jsx(ClipboardPaste, { className: "h-4 w-4" })
						}),
						/* @__PURE__ */ jsx(IconButton, {
							label: `${S.duplicate} (Ctrl+D)`,
							disabled: !ui.selectedInstanceIds.length && !ui.selectedObjectIds.length,
							onClick: () => {
								if (ui.selectedInstanceIds.length) dispatch({
									type: "duplicateInstances",
									ids: ui.selectedInstanceIds
								});
								else for (const id of ui.selectedObjectIds) dispatch({
									type: "duplicateObject",
									id
								});
							},
							children: /* @__PURE__ */ jsx(ClipboardCopy, { className: "h-4 w-4" })
						}),
						/* @__PURE__ */ jsx(IconButton, {
							label: S.clearClipboard,
							disabled: !hasClipboard(),
							onClick: clearClipboard,
							children: /* @__PURE__ */ jsx(Eraser, { className: "h-4 w-4" })
						})
					] }),
					!isEvents && !isProjectTab && /* @__PURE__ */ jsxs(Fragment, { children: [
						/* @__PURE__ */ jsxs("div", {
							className: "hidden md:contents",
							children: [
								/* @__PURE__ */ jsx(Sep, {}),
								/* @__PURE__ */ jsx(IconButton, {
									label: ui.showLeftPanel ? "Ocultar panel de objetos" : "Mostrar panel de objetos",
									active: ui.showLeftPanel,
									onClick: () => dispatch({
										type: "ui",
										patch: { showLeftPanel: !ui.showLeftPanel }
									}),
									children: /* @__PURE__ */ jsx(PanelLeft, { className: "h-4 w-4" })
								}),
								/* @__PURE__ */ jsx(IconButton, {
									label: ui.showRightPanel ? "Ocultar panel derecho" : "Mostrar panel derecho",
									active: ui.showRightPanel,
									onClick: () => dispatch({
										type: "ui",
										patch: { showRightPanel: !ui.showRightPanel }
									}),
									children: /* @__PURE__ */ jsx(PanelRight, { className: "h-4 w-4" })
								})
							]
						}),
						/* @__PURE__ */ jsx(Sep, {}),
						/* @__PURE__ */ jsx(IconButton, {
							label: S.toggleGrid,
							active: scene.grid.show,
							onClick: () => dispatch({
								type: "updateGrid",
								patch: { show: !scene.grid.show }
							}),
							children: /* @__PURE__ */ jsx(Grid3x3, { className: "h-4 w-4" })
						}),
						/* @__PURE__ */ jsx(IconButton, {
							label: S.snapToGrid,
							active: scene.grid.snap,
							onClick: () => dispatch({
								type: "updateGrid",
								patch: { snap: !scene.grid.snap }
							}),
							children: /* @__PURE__ */ jsx(Magnet, { className: "h-4 w-4" })
						}),
						/* @__PURE__ */ jsx(Sep, {}),
						/* @__PURE__ */ jsx(IconButton, {
							label: S.zoomOut,
							onClick: () => dispatch({
								type: "ui",
								patch: { zoom: clampCanvasZoom(ui.zoom / ZOOM_BUTTON_FACTOR$1) }
							}),
							children: /* @__PURE__ */ jsx(ZoomOut, { className: "h-4 w-4" })
						}),
						/* @__PURE__ */ jsxs("button", {
							type: "button",
							title: S.zoomReset,
							onClick: () => dispatch({
								type: "ui",
								patch: {
									zoom: 1,
									pan: {
										x: 0,
										y: 0
									}
								}
							}),
							className: "h-8 w-14 shrink-0 rounded px-1 text-center text-[12px] tabular-nums text-muted-foreground hover:bg-hover-bg hover:text-foreground",
							children: [Math.round(ui.zoom * 100), "%"]
						}),
						/* @__PURE__ */ jsx(IconButton, {
							label: S.zoomIn,
							onClick: () => dispatch({
								type: "ui",
								patch: { zoom: clampCanvasZoom(ui.zoom * ZOOM_BUTTON_FACTOR$1) }
							}),
							children: /* @__PURE__ */ jsx(ZoomIn, { className: "h-4 w-4" })
						})
					] }),
					/* @__PURE__ */ jsx("div", { className: "min-w-2 flex-1" }),
					/* @__PURE__ */ jsx(IconButton, {
						label: "Asistente Agente (Automatización IA)",
						active: ui.quickAutomationOpen,
						onClick: () => dispatch({
							type: "ui",
							patch: {
								quickAutomationOpen: !ui.quickAutomationOpen,
								inlineAi: null
							}
						}),
						children: /* @__PURE__ */ jsx(Bot, { className: "h-4 w-4 text-[#A996FF]" })
					}),
					/* @__PURE__ */ jsx(Sep, {}),
					!isEvents && !isProjectTab && /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(IconButton, {
						label: S.sceneProperties,
						onClick: () => dispatch({
							type: "openDialog",
							dialog: { name: "sceneProperties" }
						}),
						children: /* @__PURE__ */ jsx(SquareStack, { className: "h-4 w-4" })
					}), /* @__PURE__ */ jsxs("button", {
						type: "button",
						onClick: () => dispatch({
							type: "openDialog",
							dialog: { name: "newObject" }
						}),
						className: "flex h-8 shrink-0 items-center gap-1.5 rounded bg-primary px-3 text-[12px] font-medium text-primary-foreground hover:bg-[#5C36D6]",
						children: [/* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }), /* @__PURE__ */ jsx("span", {
							className: "hidden sm:inline",
							children: S.addANewObject
						})]
					})] })
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "z-10 flex shrink-0 items-center bg-toolbar pl-1 shadow-[-8px_0_12px_rgba(37,37,46,0.95)]",
				children: [
					/* @__PURE__ */ jsx(Sep, {}),
					/* @__PURE__ */ jsxs("button", {
						type: "button",
						"aria-label": "Compartir",
						title: S.share,
						onClick: () => dispatch({
							type: "openDialog",
							dialog: {
								name: "share",
								tab: "publish"
							}
						}),
						className: "flex h-8 shrink-0 items-center gap-1.5 rounded bg-[#7046EC] px-2 text-[12px] font-semibold text-white hover:opacity-90 sm:px-3",
						children: [/* @__PURE__ */ jsx(Globe, { className: "h-4 w-4" }), /* @__PURE__ */ jsx("span", {
							className: "hidden sm:inline",
							children: S.share
						})]
					}),
					/* @__PURE__ */ jsx(IconButton, {
						label: "Vista previa en dispositivo",
						className: "hidden sm:flex",
						onClick: () => dispatch({
							type: "ui",
							patch: { previewOpen: true }
						}),
						children: /* @__PURE__ */ jsx(Smartphone, { className: "h-4 w-4" })
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "flex shrink-0 items-center",
						children: [/* @__PURE__ */ jsxs("button", {
							type: "button",
							onClick: () => dispatch({
								type: "ui",
								patch: {
									previewOpen: true,
									previewWithDebugger: false
								}
							}),
							className: "flex h-8 items-center gap-1.5 rounded-l bg-success px-2 text-[12px] font-semibold text-[#1D1D26] hover:opacity-90 sm:px-3",
							children: [/* @__PURE__ */ jsx(Play, { className: "h-3.5 w-3.5 fill-current" }), /* @__PURE__ */ jsx("span", {
								className: "hidden sm:inline",
								children: S.preview
							})]
						}), /* @__PURE__ */ jsx("button", {
							type: "button",
							"aria-label": S.previewWithDebugger,
							onClick: (event) => {
								const rect = event.currentTarget.getBoundingClientRect();
								setPreviewMenu({
									x: rect.right - 190,
									y: rect.bottom + 4
								});
							},
							className: "flex h-8 items-center rounded-r bg-success/85 px-1 text-[#1D1D26] hover:bg-success",
							children: /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4" })
						})]
					})
				]
			}),
			previewMenu ? /* @__PURE__ */ jsx(GdMenu, {
				entries: previewEntries,
				anchor: previewMenu,
				onClose: () => setPreviewMenu(null)
			}) : null
		]
	});
}
//#endregion
//#region src/lib/editor/catalog.ts
/** Project files shipped with the sample (GDevelop resolves resources by name). */
var PROJECT_ASSETS = {
	"player.png": "/assets/player-DcY_BZxo.png",
	"coin.png": "/assets/coin-BsuEKTAo.png",
	"platform.png": "/assets/platform-BC-gWH6r.png",
	"slime.png": "/assets/slime-BatW9Gbb.png"
};
var resolveAsset = (name, resources = []) => {
	if (!name) return void 0;
	const resource = resources.find((entry) => entry.name === name || entry.file === name);
	if (resource?.url) return resource.url;
	const file = resource?.file || name;
	if (/^(?:data:|blob:|https?:\/\/)/i.test(file)) return file;
	return PROJECT_ASSETS[file] ?? PROJECT_ASSETS[name];
};
var OBJECT_TYPES = [
	{
		typeId: "Sprite",
		name: "Sprite",
		description: "Objeto que puede moverse y rotar, con animaciones",
		icon: "sprite",
		category: "graphics"
	},
	{
		typeId: "TiledSpriteObject::TiledSprite",
		name: "Mosaico",
		description: "Muestra una imagen repetida sobre un área",
		icon: "tiled",
		category: "graphics"
	},
	{
		typeId: "PanelSpriteObject::PanelSprite",
		name: "Sprite de Panel",
		description: "Panel escalable en 9 regiones (nine-patch), ideal para menús",
		icon: "panel",
		category: "graphics"
	},
	{
		typeId: "PrimitiveDrawing::Drawer",
		name: "Pintor de Formas",
		description: "Dibuja formas simples (líneas, círculos, rectángulos) en pantalla",
		icon: "shapes",
		category: "graphics"
	},
	{
		typeId: "SpriteObject::SpriteSheet",
		name: "Hoja de sprites",
		description: "Varias animaciones desde una sola imagen, recortada automáticamente",
		icon: "sheet",
		category: "graphics"
	},
	{
		typeId: "TextObject::Text",
		name: "Texto",
		description: "Muestra un texto en el juego",
		icon: "text",
		category: "text"
	},
	{
		typeId: "BBTextObject::BBText",
		name: "Texto enriquecido (BBCode)",
		description: "Texto con etiquetas de formato: negrita, color, tamaño…",
		icon: "bbtext",
		category: "text"
	},
	{
		typeId: "BitmapTextObject::BitmapText",
		name: "Texto de mapa de bits",
		description: "Texto dibujado con una fuente de imagen (retro / píxel)",
		icon: "bitmap",
		category: "text"
	},
	{
		typeId: "ParticleEmitter",
		name: "Editor de Partículas",
		description: "Muestra una gran cantidad de partículas para efectos visuales",
		icon: "particles",
		category: "graphics"
	},
	{
		typeId: "TileMap",
		name: "Mapa de teselas (Tilemap)",
		description: "Pinta el nivel con un conjunto de teselas",
		icon: "tilemap",
		category: "graphics"
	},
	{
		typeId: "VideoObject::Video",
		name: "Vídeo",
		description: "Reproduce un vídeo en la escena",
		icon: "video",
		category: "graphics",
		installable: true
	},
	{
		typeId: "Spine",
		name: "Spine",
		description: "Animaciones óseas exportadas desde Spine",
		icon: "spine",
		category: "graphics",
		installable: true
	},
	{
		typeId: "CustomObject",
		name: "Objeto personalizado",
		description: "Crea tu propio objeto con comportamientos, efectos y eventos",
		icon: "custom",
		category: "utility"
	}
];
/** Legacy-friendly aliases so a project saved with plain names keeps working. */
var OBJECT_TYPE_ALIASES = {
	Sprite: "Sprite",
	"Tiled Sprite": "TiledSpriteObject::TiledSprite",
	Text: "TextObject::Text",
	"Panel Sprite": "PanelSpriteObject::PanelSprite",
	BBText: "BBTextObject::BBText",
	"Bitmap Text": "BitmapTextObject::BitmapText",
	"Shape Painter": "PrimitiveDrawing::Drawer",
	Tilemap: "TileMap",
	Video: "VideoObject::Video"
};
var objectTypeId = (type) => OBJECT_TYPE_ALIASES[type] ?? type;
var objectTypeByTypeId = (typeId) => {
	const id = objectTypeId(typeId);
	return OBJECT_TYPES.find((t) => t.typeId === id) ?? OBJECT_TYPES.find((t) => t.typeId === typeId);
};
var objectTypeLabel = (type) => objectTypeByTypeId(type)?.name ?? type;
var isSpriteLike = (type) => {
	const id = objectTypeId(type);
	return id === "Sprite" || id === "SpriteObject::SpriteSheet" || id === "TiledSpriteObject::TiledSprite" || id === "PanelSpriteObject::PanelSprite";
};
var isTextLike = (type) => {
	const id = objectTypeId(type);
	return id === "TextObject::Text" || id === "Text" || id === "BBTextObject::BBText" || id === "BitmapTextObject::BitmapText";
};
var BEHAVIORS = [
	{
		typeId: "PlatformBehavior::PlatformerObjectBehavior",
		name: "Objeto que se desplaza sobre plataformas",
		description: "Personaje de plataformas: corre, salta, se desliza por las paredes y cae con gravedad.",
		icon: "platformer",
		helpPath: "/events-behaviors/standard-behaviors/platformer/",
		runtime: "platformer",
		properties: [
			{
				key: "acceleration",
				label: "Aceleración",
				type: "number",
				value: "800"
			},
			{
				key: "maxSpeed",
				label: "Velocidad máxima",
				type: "number",
				value: "250"
			},
			{
				key: "friction",
				label: "Fricción cuando nada la empuja",
				type: "number",
				value: "20"
			},
			{
				key: "jumpSpeed",
				label: "Velocidad de salto",
				type: "number",
				value: "600"
			},
			{
				key: "jumpSustain",
				label: "Poder de salto (mantener la tecla)",
				type: "number",
				value: "300"
			},
			{
				key: "canGoDownFromJumpthru",
				label: "Puede bajar por plataformas de un vía",
				type: "yesno",
				value: "yes"
			},
			{
				key: "canGrabPlatforms",
				label: "Puede agarrarse a las plataformas",
				type: "yesno",
				value: "no"
			},
			{
				key: "gravity",
				label: "Gravedad",
				type: "number",
				value: "1800"
			},
			{
				key: "maxFallingSpeed",
				label: "Velocidad máxima de caída",
				type: "number",
				value: "900"
			}
		]
	},
	{
		typeId: "PlatformBehavior::PlatformBehavior",
		name: "Plataforma",
		description: "Objeto sólido que puede sostener otros objetos, con plataformas móviles.",
		icon: "platform",
		helpPath: "/events-behaviors/standard-behaviors/platformer/",
		runtime: "platform",
		properties: [
			{
				key: "platformType",
				label: "Tipo de plataforma",
				type: "choices",
				value: "Normal platform",
				choices: [
					"Normal platform",
					"Deletable platform",
					"One-way platform"
				]
			},
			{
				key: "canBeGrabbed",
				label: "Puede ser agarrada",
				type: "yesno",
				value: "yes"
			},
			{
				key: "yGrabOffset",
				label: "Compensación de agarre (Y)",
				type: "number",
				value: "0"
			}
		]
	},
	{
		typeId: "AnchorBehavior::AnchorBehavior",
		name: "Anclar",
		description: "Mantiene el objeto anclado a los bordes de la pantalla al redimensionar.",
		icon: "anchor",
		helpPath: "/events-behaviors/standard-behaviors/anchor/",
		runtime: "anchor",
		properties: [
			{
				key: "relativeToWindow",
				label: "Relativo a la ventana",
				type: "yesno",
				value: "yes"
			},
			{
				key: "relativeToBottomLeft",
				label: "Relativo a la esquina inferior izquierda",
				type: "yesno",
				value: "yes"
			},
			{
				key: "anchor",
				label: "Ancla",
				type: "choices",
				value: "All",
				choices: [
					"Left",
					"Right",
					"Top",
					"Bottom",
					"All"
				]
			}
		]
	},
	{
		typeId: "Flash::Flash",
		name: "Destello",
		description: "Hace parpadear el objeto (útil tras recibir un golpe).",
		icon: "flash",
		helpPath: "/events-behaviors/standard-behaviors/flash/",
		runtime: "flash",
		properties: [
			{
				key: "flashDuration",
				label: "Duración del destello (s)",
				type: "number",
				value: "0.2"
			},
			{
				key: "times",
				label: "Número de parpadeos",
				type: "number",
				value: "5"
			},
			{
				key: "halfTimes",
				label: "Media duración de un parpadeo",
				type: "number",
				value: "0.1"
			}
		]
	},
	{
		typeId: "Health::Health",
		name: "Salud",
		description: "Puntos de salud (vida), escudo y daño, con acciones y expresiones.",
		icon: "health",
		helpPath: "/extensions/health/",
		runtime: "health",
		properties: [
			{
				key: "health",
				label: "Salud",
				type: "number",
				value: "100"
			},
			{
				key: "maxHealth",
				label: "Salud máxima",
				type: "number",
				value: "100"
			},
			{
				key: "minHealth",
				label: "Salud mínima",
				type: "number",
				value: "0"
			},
			{
				key: "shield",
				label: "Escudo",
				type: "number",
				value: "0"
			},
			{
				key: "invulnerabilityDuration",
				label: "Invulnerabilidad (s)",
				type: "number",
				value: "0"
			}
		]
	},
	{
		typeId: "Tween::TweenBehavior",
		name: "Interpolación",
		description: "Mueve objetos en trayectorias con easing durante una duración dada.",
		icon: "tween",
		helpPath: "/events-behaviors/standard-behaviors/tween/",
		runtime: "tween",
		properties: [{
			key: "tweenName",
			label: "Nombre de la interpolación",
			type: "number",
			value: "0"
		}]
	},
	{
		typeId: "DraggableBehavior::Draggable",
		name: "Arrastrable",
		description: "Permite mover el objeto con el ratón o el dedo.",
		icon: "drag",
		helpPath: "/extensions/drag-drop/",
		runtime: "draggable",
		properties: [{
			key: "canBeDragged",
			label: "Puede ser arrastrado",
			type: "yesno",
			value: "yes"
		}, {
			key: "mouseButton",
			label: "Botón del ratón",
			type: "choices",
			value: "Left",
			choices: [
				"Left",
				"Right",
				"Middle"
			]
		}]
	},
	{
		typeId: "Physics2::Physics2Behavior",
		name: "Motor de física 2.0",
		description: "Simulación realista con cuerpo dinámico, estático o cinemático.",
		icon: "physics",
		helpPath: "/extensions/physics-2-0/",
		properties: [
			{
				key: "bodyType",
				label: "Tipo de cuerpo",
				type: "choices",
				value: "Dynamic",
				choices: [
					"Dynamic",
					"Static",
					"Kinematic"
				]
			},
			{
				key: "mass",
				label: "Masa",
				type: "number",
				value: "1"
			},
			{
				key: "friction",
				label: "Fricción",
				type: "number",
				value: "0.5"
			},
			{
				key: "restitution",
				label: "Restitución (rebote)",
				type: "number",
				value: "0.1"
			},
			{
				key: "density",
				label: "Densidad",
				type: "number",
				value: "1"
			}
		]
	},
	{
		typeId: "PathfindingBehavior::PathfindingBehavior",
		name: "Personaje con búsqueda de caminos",
		description: "Calcula trayectorias evitando obstáculos en una cuadrícula.",
		icon: "pathfinding",
		helpPath: "/extensions/pathfinding/",
		properties: [
			{
				key: "speed",
				label: "Velocidad",
				type: "number",
				value: "150"
			},
			{
				key: "allowDiagonals",
				label: "Permitir diagonales",
				type: "yesno",
				value: "yes"
			},
			{
				key: "cellWidth",
				label: "Ancho de celda",
				type: "number",
				value: "32"
			},
			{
				key: "cellHeight",
				label: "Altura de celda",
				type: "number",
				value: "32"
			}
		]
	}
];
var behaviorByTypeId = (typeId) => BEHAVIORS.find((b) => b.typeId === typeId);
/** Behavior name as shown in the properties panel (short form). */
var behaviorShortName = (typeId) => {
	const entry = behaviorByTypeId(typeId);
	if (!entry) return typeId.split("::").pop() ?? typeId;
	if (entry.runtime === "platformer") return "Plataformas (personaje)";
	if (entry.runtime === "platform") return "Plataformas";
	return entry.name;
};
var EFFECTS = [
	{
		typeId: "Tint",
		name: "Tinte",
		description: "Colorea el objeto con un tinte multiplicativo.",
		parameters: [
			{
				key: "r",
				label: "Rojo",
				value: "255"
			},
			{
				key: "g",
				label: "Verde",
				value: "255"
			},
			{
				key: "b",
				label: "Azul",
				value: "255"
			}
		],
		supported: true
	},
	{
		typeId: "ColorOverlay",
		name: "Superposición de color",
		description: "Sustituye el color del objeto por uno plano.",
		parameters: [
			{
				key: "r",
				label: "Rojo",
				value: "255"
			},
			{
				key: "g",
				label: "Verde",
				value: "80"
			},
			{
				key: "b",
				label: "Azul",
				value: "40"
			},
			{
				key: "alpha",
				label: "Opacidad",
				value: "255"
			}
		],
		supported: true
	},
	{
		typeId: "Blur",
		name: "Desenfoque (Kawase, rápido)",
		description: "Desenfoque Gaussiano de la imagen renderizada.",
		parameters: [{
			key: "blur",
			label: "Intensidad del desenfoque",
			value: "8"
		}, {
			key: "quality",
			label: "Número de pasadas",
			value: "1"
		}],
		supported: false
	},
	{
		typeId: "DropShadow",
		name: "Sombra paralela",
		description: "Sombra desplazada detrás del objeto.",
		parameters: [
			{
				key: "blur",
				label: "Desenfoque de la sombra",
				value: "2"
			},
			{
				key: "distance",
				label: "Distancia",
				value: "5"
			},
			{
				key: "alpha",
				label: "Opacidad",
				value: "0.5"
			},
			{
				key: "color",
				label: "Color de la sombra",
				value: "#000000"
			}
		],
		supported: false
	},
	{
		typeId: "Outline",
		name: "Contorno",
		description: "Añade un contorno alrededor del objeto.",
		parameters: [
			{
				key: "thickness",
				label: "Grosor",
				value: "1"
			},
			{
				key: "color",
				label: "Color del contorno",
				value: "#FFFFFF"
			},
			{
				key: "alpha",
				label: "Opacidad",
				value: "1"
			}
		],
		supported: false
	},
	{
		typeId: "Glow",
		name: "Resplandor",
		description: "Brillo difuso sobre las zonas claras del objeto.",
		parameters: [
			{
				key: "outerBlur",
				label: "Desenfoque exterior",
				value: "2"
			},
			{
				key: "innerStrength",
				label: "Fuerza interior",
				value: "0.5"
			},
			{
				key: "color",
				label: "Color del resplandor",
				value: "#FFFFFF"
			}
		],
		supported: false
	},
	{
		typeId: "Pixelate",
		name: "Pixelización",
		description: "Reduce la resolución visible del objeto (efecto retro).",
		parameters: [{
			key: "size",
			label: "Tamaño del píxel",
			value: "4"
		}],
		supported: false
	},
	{
		typeId: "Brightness",
		name: "Brillo",
		description: "Ajusta el brillo de la imagen.",
		parameters: [{
			key: "brightness",
			label: "Brillo",
			value: "0"
		}],
		supported: false
	},
	{
		typeId: "Sepia",
		name: "Sepia",
		description: "Tono sepia sobre el objeto.",
		parameters: [{
			key: "amount",
			label: "Cantidad",
			value: "1"
		}],
		supported: false
	},
	{
		typeId: "BlackAndWhite",
		name: "Blanco y negro",
		description: "Elimina el color del objeto.",
		parameters: [],
		supported: false
	},
	{
		typeId: "Night",
		name: "Noche",
		description: "Oscurece y enfría los colores (modo noche).",
		parameters: [{
			key: "intensity",
			label: "Intensidad",
			value: "0.2"
		}, {
			key: "redTint",
			label: "Tinte rojo",
			value: "0.1"
		}],
		supported: false
	},
	{
		typeId: "Godray",
		name: "Rayos de luz",
		description: "Rayos volumétricos desde un punto de luz.",
		parameters: [
			{
				key: "exposure",
				label: "Exposición",
				value: "0.01"
			},
			{
				key: "decay",
				label: "Decaimiento",
				value: "0.95"
			},
			{
				key: "density",
				label: "Densidad",
				value: "0.5"
			}
		],
		supported: false
	}
];
var effectByTypeId = (typeId) => EFFECTS.find((e) => e.typeId === typeId);
var RESOURCE_KINDS = [
	{
		kind: "image",
		name: "Imagen",
		description: "PNG, JPG, GIF o WebP para sprites y fondos",
		icon: "image",
		extensions: "*.png, *.jpg, *.jpeg, *.gif, *.webp"
	},
	{
		kind: "audio",
		name: "Audio",
		description: "Efectos de sonido y música (.ogg, .mp3, .m4a)",
		icon: "audio",
		extensions: "*.ogg, *.mp3, *.m4a, *.wav"
	},
	{
		kind: "font",
		name: "Fuente",
		description: "Tipos de letra personalizados (.ttf, .otf, .woff)",
		icon: "font",
		extensions: "*.ttf, *.otf, *.woff, *.woff2"
	},
	{
		kind: "json",
		name: "Archivo JSON",
		description: "Datos estructurados para tu juego",
		icon: "json",
		extensions: "*.json"
	},
	{
		kind: "video",
		name: "Vídeo",
		description: "Clip de vídeo para la escena",
		icon: "video",
		extensions: "*.mp4, *.webm"
	}
];
var INSTALLED_EXTENSIONS = [
	{
		name: "Plataformas (platformer)",
		longName: "Platformer",
		icon: "platform",
		version: "1.5.6"
	},
	{
		name: "Física 2.0",
		longName: "Physics Engine 2.0",
		icon: "physics",
		version: "1.1.0"
	},
	{
		name: "Interpolación (tween)",
		longName: "Tween",
		icon: "tween",
		version: "1.1.2"
	},
	{
		name: "Anclar",
		longName: "Anchor",
		icon: "anchor",
		version: "1.0.4"
	},
	{
		name: "Destello",
		longName: "Flash",
		icon: "flash",
		version: "1.0.1"
	},
	{
		name: "Salud",
		longName: "Health",
		icon: "health",
		version: "1.0.0"
	},
	{
		name: "Efectos visuales",
		longName: "Effects",
		icon: "effects",
		version: "1.2.0"
	},
	{
		name: "Cámara",
		longName: "Camera",
		icon: "camera",
		version: "1.0.0"
	}
];
var KEYS = [
	..."abcdefghijklmnopqrstuvwxyz".split("").map((letter) => ({
		name: letter,
		label: letter.toUpperCase()
	})),
	...[..."0123456789"].map((digit) => ({
		name: digit,
		label: digit
	})),
	{
		name: "Space",
		label: "Espacio"
	},
	{
		name: "Return",
		label: "Intro"
	},
	{
		name: "Numpad0",
		label: "0 (teclado numérico)"
	},
	{
		name: "Numpad1",
		label: "1 (teclado numérico)"
	},
	{
		name: "Numpad2",
		label: "2 (teclado numérico)"
	},
	{
		name: "Escape",
		label: "Escape"
	},
	{
		name: "Tab",
		label: "Tabulador"
	},
	{
		name: "Backspace",
		label: "Retroceso"
	},
	{
		name: "Delete",
		label: "Supr"
	},
	{
		name: "Insert",
		label: "Insertar"
	},
	{
		name: "Home",
		label: "Inicio"
	},
	{
		name: "End",
		label: "Fin"
	},
	{
		name: "PageUp",
		label: "Re pág"
	},
	{
		name: "PageDown",
		label: "Av pág"
	},
	{
		name: "Up",
		label: "Flecha arriba"
	},
	{
		name: "Down",
		label: "Flecha abajo"
	},
	{
		name: "Left",
		label: "Flecha izquierda"
	},
	{
		name: "Right",
		label: "Flecha derecha"
	},
	{
		name: "LShift",
		label: "Shift izquierdo"
	},
	{
		name: "Control",
		label: "Control"
	},
	{
		name: "Alt",
		label: "Alt"
	},
	{
		name: "Comma",
		label: "Coma"
	},
	{
		name: "SemiColon",
		label: "Punto y coma"
	},
	{
		name: "Plus",
		label: "Más"
	},
	{
		name: "Minus",
		label: "Menos"
	},
	{
		name: "Slash",
		label: "Barra"
	}
];
var MOUSE_BUTTONS = [
	{
		name: "Left",
		label: "Botón izquierdo"
	},
	{
		name: "Right",
		label: "Botón derecho"
	},
	{
		name: "Middle",
		label: "Botón central"
	}
];
//#endregion
//#region src/lib/editor/dnd.ts
var DND_OBJECT = "application/x-nexus-object";
var DND_RESOURCE = "application/x-nexus-resource";
function readDropPayload(event) {
	const objectId = event.dataTransfer.getData(DND_OBJECT);
	if (objectId) return {
		kind: "object",
		value: objectId
	};
	const resourceId = event.dataTransfer.getData(DND_RESOURCE);
	if (resourceId) return {
		kind: "resource",
		value: resourceId
	};
	const plain = event.dataTransfer.getData("text/plain");
	if (plain) return {
		kind: "object",
		value: plain
	};
	const file = event.dataTransfer.files?.[0];
	if (file) return {
		kind: "resource",
		value: file.name
	};
	return null;
}
//#endregion
//#region src/components/editor/gd/icons.tsx
var MAP = {
	sprite: PersonStanding,
	tiled: LayoutGrid,
	panel: LayoutPanelTop,
	shapes: PenTool,
	sheet: Rows3,
	text: Type,
	bbtext: FileType,
	bitmap: Frame,
	particles: Sparkles,
	tilemap: Grid2x2,
	video: Video,
	spine: Spline,
	custom: Puzzle,
	image: Image$1,
	audio: Music,
	font: Type,
	json: FileType,
	platformer: PersonStanding,
	platform: RectangleHorizontal,
	anchor: Anchor,
	flash: Zap,
	health: Heart,
	tween: Waves,
	drag: MousePointerClick,
	physics: Dices,
	pathfinding: Accessibility,
	camera: Camera,
	effects: Brush,
	light: Lightbulb,
	grid: Grid3x3,
	timer: Timer,
	layer: Layers,
	layers: Layers,
	gamepad: Gamepad2,
	clapperboard: Clapperboard,
	stack: SquareStack,
	film: Film,
	puzzle: Puzzle,
	wind: Wind,
	crop: Crop,
	cursor: MousePointerClick
};
function CatalogIcon({ name, className }) {
	const Icon = MAP[name] ?? Puzzle;
	return /* @__PURE__ */ jsx(Icon, {
		className,
		"aria-hidden": true
	});
}
/** Object type -> icon key (used by the object list, instances and the sheet). */
function iconForObjectType(type) {
	if (type === "Sprite") return "sprite";
	if (type.includes("TiledSprite")) return "tiled";
	if (type.includes("PanelSprite")) return "panel";
	if (type.includes("PrimitiveDrawing")) return "shapes";
	if (type.includes("SpriteSheet")) return "sheet";
	if (type.includes("BitmapText")) return "bitmap";
	if (type.includes("BBText")) return "bbtext";
	if (type.includes("Text")) return "text";
	if (type.includes("Particle")) return "particles";
	if (type.includes("TileMap") || type.includes("Tilemap")) return "tilemap";
	if (type.includes("Video")) return "video";
	if (type.includes("Spine")) return "spine";
	return "custom";
}
var BEHAVIOR_ICON = {
	"PlatformBehavior::PlatformerObjectBehavior": "platformer",
	"PlatformBehavior::PlatformBehavior": "platform",
	"AnchorBehavior::AnchorBehavior": "anchor",
	"Flash::Flash": "flash",
	"Health::Health": "health",
	"Tween::TweenBehavior": "tween",
	"DraggableBehavior::Draggable": "drag",
	"Physics2::Physics2Behavior": "physics",
	"PathfindingBehavior::PathfindingBehavior": "pathfinding"
};
/** Instruction category -> icon key, for the instruction selector list. */
var CATEGORY_ICON = {
	adv: "puzzle",
	scene: "clapperboard",
	keyboard: "gamepad",
	mouse: "cursor",
	sprite: "sprite",
	text: "text",
	collision: "crop",
	variables: "stack",
	timers: "timer",
	camera: "camera",
	layers: "layers",
	audio: "audio",
	timescale: "wind",
	platform: "platform",
	tween: "tween",
	flash: "flash",
	health: "health",
	effects: "effects"
};
//#endregion
//#region src/components/editor/ObjectsPanel.tsx
function ObjectRow({ object, instancesCount, selected, onRename }) {
	const { ui, dispatch, scene } = useEditor();
	const [editing, setEditing] = React.useState(false);
	const [draft, setDraft] = React.useState(object.name);
	const { open, menu } = useContextMenu();
	React.useEffect(() => setDraft(object.name), [object.name]);
	const isHidden = object.instancesHidden;
	const entries = () => [
		{
			id: "edit",
			label: S.editObject,
			icon: /* @__PURE__ */ jsx(Pencil, { className: "h-3.5 w-3.5" }),
			onSelect: () => dispatch({
				type: "openDialog",
				dialog: {
					name: "objectEditor",
					objectId: object.id
				}
			})
		},
		{
			id: "rename",
			label: S.rename,
			onSelect: () => {
				setDraft(object.name);
				setEditing(true);
			}
		},
		{
			id: "instances",
			label: `${S.addInstanceToScene} (${instancesCount})`,
			disabled: instancesCount === 0,
			onSelect: () => {
				dispatch({
					type: "selectInstances",
					ids: []
				});
				dispatch({
					type: "ui",
					patch: {
						tab: "scene",
						rightTab: "instances",
						selectedObjectIds: [object.id]
					}
				});
			}
		},
		{
			id: "behaviors",
			label: S.editBehaviors,
			icon: /* @__PURE__ */ jsx(Settings2, { className: "h-3.5 w-3.5" }),
			onSelect: () => dispatch({
				type: "openDialog",
				dialog: {
					name: "behaviors",
					objectId: object.id
				}
			})
		},
		{
			id: "effects",
			label: S.effects,
			icon: /* @__PURE__ */ jsx(SquareStack, { className: "h-3.5 w-3.5" }),
			onSelect: () => dispatch({
				type: "openDialog",
				dialog: {
					name: "effects",
					targetKind: "object",
					targetId: object.id
				}
			})
		},
		{
			id: "variables",
			label: S.variables,
			icon: /* @__PURE__ */ jsx(Variable, { className: "h-3.5 w-3.5" }),
			onSelect: () => dispatch({
				type: "ui",
				patch: { rightTab: "properties" }
			})
		},
		{
			id: "hide",
			label: isHidden ? S.show : S.hide,
			icon: isHidden ? /* @__PURE__ */ jsx(Eye, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ jsx(EyeOff, { className: "h-3.5 w-3.5" }),
			onSelect: () => dispatch({
				type: "updateObject",
				id: object.id,
				patch: { instancesHidden: !isHidden }
			})
		},
		{
			id: "global",
			label: object.isGlobal ? S.removeAsGlobalObject : S.setAsGlobalObject,
			onSelect: () => dispatch({
				type: "setObjectGlobal",
				id: object.id,
				isGlobal: !object.isGlobal
			})
		},
		{
			id: "duplicate",
			label: S.duplicate,
			separatorBefore: true,
			onSelect: () => dispatch({
				type: "duplicateObject",
				id: object.id
			})
		},
		{
			id: "copy",
			label: S.copy,
			onSelect: () => copyObjects([object])
		},
		{
			id: "cut",
			label: S.cut,
			onSelect: () => {
				cutObjects(scene, [object.id]);
				dispatch({
					type: "deleteObject",
					id: object.id
				});
			}
		},
		{
			id: "delete",
			label: S.delete,
			danger: true,
			separatorBefore: true,
			icon: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" }),
			onSelect: () => {
				if (window.confirm(S.confirmRemoveObject)) dispatch({
					type: "deleteObject",
					id: object.id
				});
			}
		}
	];
	return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsxs("div", {
		role: "button",
		tabIndex: 0,
		draggable: !editing,
		onDragStart: (event) => {
			event.dataTransfer.setData(DND_OBJECT, object.name);
			event.dataTransfer.setData("text/plain", object.name);
			event.dataTransfer.effectAllowed = "copy";
		},
		onContextMenu: (event) => open(event, entries()),
		onClick: () => dispatch({
			type: "ui",
			patch: {
				selectedObjectIds: [object.id],
				selectedInstanceIds: []
			}
		}),
		onDoubleClick: () => {
			setDraft(object.name);
			setEditing(true);
		},
		onKeyDown: (event) => {
			if (event.key === "Enter") dispatch({
				type: "openDialog",
				dialog: {
					name: "objectEditor",
					objectId: object.id
				}
			});
		},
		className: cn("group mx-1 flex cursor-grab items-center gap-1.5 rounded px-1.5 py-[5px] text-[12.5px] text-foreground hover:bg-list-hover", selected && "bg-selection", isHidden && "opacity-60"),
		children: [
			/* @__PURE__ */ jsx(ObjectGlyph, { object }),
			editing ? /* @__PURE__ */ jsx("input", {
				autoFocus: true,
				value: draft,
				onChange: (event) => setDraft(event.target.value),
				onBlur: () => {
					setEditing(false);
					if (draft.trim() && draft !== object.name) onRename(draft.trim());
				},
				onKeyDown: (event) => {
					if (event.key === "Enter") event.currentTarget.blur();
					if (event.key === "Escape") {
						setDraft(object.name);
						setEditing(false);
					}
				},
				className: "h-5 min-w-0 flex-1 rounded border border-link bg-window px-1 text-[12.5px] outline-none"
			}) : /* @__PURE__ */ jsx("span", {
				className: "min-w-0 flex-1 truncate",
				children: object.name
			}),
			/* @__PURE__ */ jsx("span", {
				className: "hidden shrink-0 text-[10px] text-text-secondary group-hover:inline",
				children: instancesCount > 0 ? instancesCount : ""
			}),
			/* @__PURE__ */ jsx("button", {
				type: "button",
				"aria-label": `${S.editObject}: ${object.name}`,
				onClick: (event) => {
					event.stopPropagation();
					open(event, entries());
				},
				className: "shrink-0 rounded p-0.5 text-text-secondary opacity-0 hover:bg-toolbar hover:text-foreground group-hover:opacity-100",
				children: /* @__PURE__ */ jsx(MoreVertical, { className: "h-3.5 w-3.5" })
			})
		]
	}), menu] });
}
function ObjectGlyph({ object }) {
	const { project } = useEditor();
	const url = resolveAsset((object.animations?.[0])?.images?.[0]?.image ?? object.asset, project.resources);
	if (isTextLike(object.type)) return /* @__PURE__ */ jsx(Type, { className: "h-4 w-4 shrink-0 text-[#8AD6FF]" });
	if (url) return /* @__PURE__ */ jsx("img", {
		src: url,
		alt: "",
		className: "h-4 w-4 shrink-0 bg-[#1D1D26] object-contain [image-rendering:pixelated]",
		draggable: false
	});
	return /* @__PURE__ */ jsx(CatalogIcon, {
		name: iconForObjectType(object.type),
		className: "h-4 w-4 shrink-0 text-[#C9B6FC]"
	});
}
function ObjectsPanel({ onClose } = {}) {
	const { scene, ui, dispatch } = useEditor();
	const [query, setQuery] = React.useState("");
	const [openSections, setOpenSections] = React.useState({
		scene: true,
		global: false,
		groups: true
	});
	const matches = (object) => {
		if (!query) return true;
		const needle = query.toLowerCase();
		return object.name.toLowerCase().includes(needle) || objectTypeLabel(object.type).toLowerCase().includes(needle);
	};
	const sceneObjects = scene.objects.filter((o) => !o.isGlobal && matches(o));
	const globalObjects = scene.objects.filter((o) => o.isGlobal && matches(o));
	const groups = (scene.groups ?? []).filter((group) => !query || group.name.toLowerCase().includes(query.toLowerCase()));
	const instancesOf = (id) => scene.instances.filter((i) => i.objectId === id).length;
	return /* @__PURE__ */ jsxs(Panel, {
		title: S.objects,
		badge: scene.objects.length,
		className: "min-w-0 flex-1 border-r border-separator",
		actions: /* @__PURE__ */ jsx("button", {
			type: "button",
			"aria-label": "Contraer",
			onClick: () => {
				if (onClose) onClose();
				else dispatch({
					type: "ui",
					patch: { showLeftPanel: false }
				});
			},
			className: "grid h-6 w-6 place-items-center rounded text-text-secondary hover:bg-elevated hover:text-foreground",
			children: /* @__PURE__ */ jsx(ChevronRight, { className: "h-3.5 w-3.5" })
		}),
		footer: /* @__PURE__ */ jsx(GdButton, {
			variant: "raised",
			primary: true,
			className: "w-full",
			icon: /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
			onClick: () => dispatch({
				type: "openDialog",
				dialog: { name: "newObject" }
			}),
			children: S.addANewObject
		}),
		children: [
			/* @__PURE__ */ jsx("div", {
				className: "px-2 pb-1.5 pt-1",
				children: /* @__PURE__ */ jsx(SearchBar, {
					value: query,
					onChange: setQuery,
					placeholder: S.searchObjects,
					icon: /* @__PURE__ */ jsx(Boxes, { className: "h-3.5 w-3.5 text-text-secondary" })
				})
			}),
			/* @__PURE__ */ jsxs(Section$1, {
				title: S.sceneObjects,
				open: openSections.scene,
				onToggle: () => setOpenSections((s) => ({
					...s,
					scene: !s.scene
				})),
				children: [sceneObjects.length === 0 ? /* @__PURE__ */ jsx("p", {
					className: "px-3 py-2 text-[12.5px] text-text-secondary",
					children: S.noObjectYet
				}) : null, sceneObjects.map((object) => /* @__PURE__ */ jsx(ObjectRow, {
					object,
					instancesCount: instancesOf(object.id),
					selected: ui.selectedObjectIds.includes(object.id),
					onRename: (name) => dispatch({
						type: "renameObject",
						id: object.id,
						name
					})
				}, object.id))]
			}),
			globalObjects.length > 0 ? /* @__PURE__ */ jsx(Section$1, {
				title: S.globalObjects,
				open: openSections.global,
				onToggle: () => setOpenSections((s) => ({
					...s,
					global: !s.global
				})),
				children: globalObjects.map((object) => /* @__PURE__ */ jsx(ObjectRow, {
					object,
					instancesCount: instancesOf(object.id),
					selected: ui.selectedObjectIds.includes(object.id),
					onRename: (name) => dispatch({
						type: "renameObject",
						id: object.id,
						name
					})
				}, object.id))
			}) : null,
			/* @__PURE__ */ jsxs(Section$1, {
				title: S.objectGroups,
				open: openSections.groups,
				onToggle: () => setOpenSections((s) => ({
					...s,
					groups: !s.groups
				})),
				right: /* @__PURE__ */ jsx("button", {
					type: "button",
					"aria-label": S.objectGroups,
					title: S.objectGroups,
					onClick: () => dispatch({ type: "addObjectGroup" }),
					className: "grid h-5 w-5 place-items-center rounded text-text-secondary hover:bg-elevated hover:text-foreground",
					children: /* @__PURE__ */ jsx(Plus, { className: "h-3.5 w-3.5" })
				}),
				children: [groups.length === 0 ? /* @__PURE__ */ jsx("p", {
					className: "px-3 py-1 text-[12px] text-text-placeholder",
					children: "—"
				}) : null, groups.map((group) => /* @__PURE__ */ jsxs("div", {
					className: cn("mx-1 flex items-center gap-1.5 rounded px-1.5 py-[5px] text-[12.5px] hover:bg-list-hover", ui.selectedGroupName === group.name && "bg-selection"),
					onClick: () => dispatch({
						type: "ui",
						patch: { selectedGroupName: group.name }
					}),
					children: [
						/* @__PURE__ */ jsx(SquareStack, { className: "h-4 w-4 shrink-0 text-[#A483FF]" }),
						/* @__PURE__ */ jsx("span", {
							className: "min-w-0 flex-1 truncate",
							children: group.name
						}),
						/* @__PURE__ */ jsx("span", {
							className: "text-[10px] text-text-secondary",
							children: group.objects.length
						}),
						/* @__PURE__ */ jsx("button", {
							type: "button",
							"aria-label": S.delete,
							onClick: (event) => {
								event.stopPropagation();
								dispatch({
									type: "deleteObjectGroup",
									name: group.name
								});
							},
							className: "shrink-0 text-text-secondary opacity-0 hover:text-destructive group-hover:opacity-100",
							children: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" })
						})
					]
				}, group.name))]
			})
		]
	});
}
function Section$1({ title, open, onToggle, right, children }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "mb-1",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex items-center gap-1 px-1.5 py-1",
			children: [/* @__PURE__ */ jsxs("button", {
				type: "button",
				"aria-expanded": open,
				onClick: onToggle,
				className: "flex min-w-0 flex-1 items-center gap-1 rounded px-1 py-0.5 text-left text-[11px] font-semibold uppercase tracking-wide text-text-secondary hover:bg-list-hover hover:text-foreground",
				children: [open ? /* @__PURE__ */ jsx(ChevronDown, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ jsx(ChevronRight, { className: "h-3.5 w-3.5" }), /* @__PURE__ */ jsx("span", {
					className: "truncate",
					children: title
				})]
			}), right]
		}), open ? /* @__PURE__ */ jsx("div", { children }) : null]
	});
}
//#endregion
//#region src/components/editor/LayersPanel.tsx
function LayersPanel({ onClose } = {}) {
	const { scene, ui, dispatch } = useEditor();
	const [menu, setMenu] = React.useState(null);
	const [rowMenu, setRowMenu] = React.useState(null);
	const addEntries = [
		{
			id: "layer",
			label: S.addALayer,
			icon: /* @__PURE__ */ jsx(Layers, { className: "h-3.5 w-3.5" }),
			onSelect: () => dispatch({ type: "addLayer" })
		},
		{
			id: "lighting",
			label: S.addLightingLayer,
			icon: /* @__PURE__ */ jsx(Lightbulb, { className: "h-3.5 w-3.5" }),
			onSelect: () => dispatch({
				type: "addLayer",
				isLightingLayer: true
			})
		},
		{
			id: "effects",
			label: S.effects,
			separatorBefore: true,
			icon: /* @__PURE__ */ jsx(SquareStack, { className: "h-3.5 w-3.5" }),
			onSelect: () => dispatch({
				type: "openDialog",
				dialog: {
					name: "effects",
					targetKind: "layer",
					targetId: scene.activeLayer
				}
			})
		},
		{
			id: "properties",
			label: S.sceneProperties,
			onSelect: () => dispatch({
				type: "openDialog",
				dialog: { name: "sceneProperties" }
			})
		}
	];
	const rowEntries = (layer) => {
		const isBase = layer.name === BASE_LAYER_NAME;
		return [
			{
				id: "rename",
				label: S.rename,
				disabled: isBase,
				onSelect: () => {
					const name = window.prompt(S.rename, layer.name);
					if (name && name !== layer.name) dispatch({
						type: "renameLayer",
						from: layer.name,
						to: name
					});
				}
			},
			{
				id: "effects",
				label: S.effects,
				onSelect: () => dispatch({
					type: "openDialog",
					dialog: {
						name: "effects",
						targetKind: "layer",
						targetId: layer.name
					}
				})
			},
			{
				id: "lock",
				label: layer.locked ? S.unlock : S.lock,
				icon: layer.locked ? /* @__PURE__ */ jsx(Unlock, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ jsx(Lock, { className: "h-3.5 w-3.5" }),
				onSelect: () => dispatch({
					type: "toggleLayerLock",
					name: layer.name
				})
			},
			{
				id: "up",
				label: "Subir capa",
				separatorBefore: true,
				disabled: isBase,
				onSelect: () => dispatch({
					type: "moveLayer",
					name: layer.name,
					direction: -1
				})
			},
			{
				id: "down",
				label: "Bajar capa",
				disabled: isBase,
				onSelect: () => dispatch({
					type: "moveLayer",
					name: layer.name,
					direction: 1
				})
			},
			{
				id: "delete",
				label: S.delete,
				danger: true,
				separatorBefore: true,
				disabled: isBase,
				icon: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" }),
				onSelect: () => dispatch({
					type: "deleteLayer",
					name: layer.name
				})
			}
		];
	};
	return /* @__PURE__ */ jsxs(Panel, {
		title: S.layers,
		badge: scene.layers.length,
		className: "min-h-0 flex-1",
		actions: /* @__PURE__ */ jsxs(Fragment, { children: [
			/* @__PURE__ */ jsx("button", {
				type: "button",
				title: ui.showHitMasks ? S.disableEffectsInEditor : S.displayEffectsInEditor,
				"aria-label": S.displayEffectsInEditor,
				"aria-pressed": ui.showHitMasks,
				onClick: () => dispatch({
					type: "ui",
					patch: { showHitMasks: !ui.showHitMasks }
				}),
				className: cn("grid h-6 w-6 place-items-center rounded hover:bg-elevated", ui.showHitMasks ? "text-link" : "text-text-secondary"),
				children: /* @__PURE__ */ jsx(SquareStack, { className: "h-3.5 w-3.5" })
			}),
			/* @__PURE__ */ jsx("button", {
				type: "button",
				"aria-label": S.addALayer,
				onClick: (event) => {
					const rect = event.currentTarget.getBoundingClientRect();
					setMenu({
						x: rect.left,
						y: rect.bottom + 2
					});
				},
				className: "grid h-6 w-6 place-items-center rounded text-text-secondary hover:bg-elevated hover:text-foreground",
				children: /* @__PURE__ */ jsx(Plus, { className: "h-3.5 w-3.5" })
			}),
			onClose ? /* @__PURE__ */ jsx("button", {
				type: "button",
				"aria-label": S.closeLayersPanel,
				onClick: onClose,
				className: "grid h-6 w-6 place-items-center rounded text-[14px] text-text-secondary hover:bg-elevated hover:text-foreground",
				children: "×"
			}) : null
		] }),
		children: [
			scene.layers.map((layer) => {
				layer.name;
				const isActive = scene.activeLayer === layer.name;
				const instances = scene.instances.filter((i) => i.layer === layer.name).length;
				return /* @__PURE__ */ jsxs("div", {
					onClick: () => {
						dispatch({
							type: "setActiveLayer",
							name: layer.name
						});
						dispatch({
							type: "ui",
							patch: {
								selectedLayerName: layer.name,
								selectedInstanceIds: [],
								selectedObjectIds: []
							}
						});
					},
					className: cn("group mx-1 flex cursor-pointer items-center gap-1 rounded px-1 py-[5px] text-[12.5px] hover:bg-list-hover", isActive && "bg-selection"),
					children: [
						/* @__PURE__ */ jsx("button", {
							type: "button",
							"aria-label": layer.visible ? S.hide : S.show,
							title: layer.visible ? S.visibleWhenSceneStarts : S.hiddenWhenSceneStarts,
							onClick: (event) => {
								event.stopPropagation();
								dispatch({
									type: "toggleLayerVisibility",
									name: layer.name
								});
							},
							className: "shrink-0 text-text-secondary hover:text-foreground",
							children: layer.visible ? /* @__PURE__ */ jsx(Eye, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ jsx(EyeOff, { className: "h-3.5 w-3.5" })
						}),
						/* @__PURE__ */ jsx("button", {
							type: "button",
							"aria-label": layer.locked ? S.unlock : S.lock,
							onClick: (event) => {
								event.stopPropagation();
								dispatch({
									type: "toggleLayerLock",
									name: layer.name
								});
							},
							className: cn("shrink-0 hover:text-foreground", layer.locked ? "text-[#FFBC57]" : "text-text-placeholder opacity-40 group-hover:opacity-100"),
							children: layer.locked ? /* @__PURE__ */ jsx(Lock, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ jsx(Unlock, { className: "h-3.5 w-3.5" })
						}),
						/* @__PURE__ */ jsxs("span", {
							className: "min-w-0 flex-1 truncate text-foreground",
							children: [layer.isLightingLayer ? /* @__PURE__ */ jsx(Lightbulb, { className: "mr-1 inline h-3.5 w-3.5 text-[#FFBC57]" }) : null, layer.name]
						}),
						layer.effects.length > 0 ? /* @__PURE__ */ jsx("span", {
							title: `${S.effects}: ${layer.effects.length}`,
							className: "shrink-0 rounded bg-elevated px-1 text-[10px] text-text-secondary",
							children: layer.effects.length
						}) : null,
						/* @__PURE__ */ jsx("span", {
							className: "hidden shrink-0 text-[10px] text-text-secondary group-hover:inline",
							children: instances
						}),
						/* @__PURE__ */ jsx("button", {
							type: "button",
							"aria-label": `${layer.name}: ${S.options}`,
							onClick: (event) => {
								event.stopPropagation();
								const rect = event.currentTarget.getBoundingClientRect();
								setRowMenu({
									x: rect.right - 170,
									y: rect.bottom + 2,
									layer
								});
							},
							className: "shrink-0 rounded p-0.5 text-text-secondary opacity-0 hover:bg-toolbar hover:text-foreground group-hover:opacity-100",
							children: /* @__PURE__ */ jsx(MoreVertical, { className: "h-3.5 w-3.5" })
						})
					]
				}, layer.name);
			}),
			menu ? /* @__PURE__ */ jsx(GdMenu, {
				entries: addEntries,
				anchor: menu,
				onClose: () => setMenu(null)
			}) : null,
			rowMenu ? /* @__PURE__ */ jsx(GdMenu, {
				entries: rowEntries(rowMenu.layer),
				anchor: rowMenu,
				onClose: () => setRowMenu(null)
			}) : null
		]
	});
}
//#endregion
//#region src/components/editor/InstancesPanel.tsx
function InstancesPanel({ onClose } = {}) {
	const { scene, ui, dispatch, project } = useEditor();
	const [query, setQuery] = React.useState("");
	const [settings, setSettings] = React.useState(null);
	const [rowMenu, setRowMenu] = React.useState(null);
	const objectById = (id) => scene.objects.find((o) => o.id === id);
	const rows = scene.instances.map((instance, index) => {
		return {
			instance,
			index,
			object: scene.objects.find((o) => o.id === instance.objectId)
		};
	}).filter(({ instance, object }) => {
		if (!query) return true;
		const needle = query.toLowerCase();
		return (object?.name ?? instance.objectId).toLowerCase().includes(needle) || instance.layer.toLowerCase().includes(needle);
	}).sort((a, b) => a.instance.zOrder - b.instance.zOrder || a.index - b.index);
	const entriesFor = (instanceId) => {
		const instance = scene.instances.find((i) => i.id === instanceId);
		if (!instance) return [];
		return [
			{
				id: "front",
				label: S.bringToFront,
				icon: /* @__PURE__ */ jsx(ArrowUpToLine, { className: "h-3.5 w-3.5" }),
				onSelect: () => dispatch({
					type: "setInstancesZOrder",
					ids: [instanceId],
					mode: "front"
				})
			},
			{
				id: "back",
				label: S.sendToBack,
				icon: /* @__PURE__ */ jsx(ArrowDownToLine, { className: "h-3.5 w-3.5" }),
				onSelect: () => dispatch({
					type: "setInstancesZOrder",
					ids: [instanceId],
					mode: "back"
				})
			},
			{
				id: "duplicate",
				label: S.duplicate,
				icon: /* @__PURE__ */ jsx(Copy, { className: "h-3.5 w-3.5" }),
				separatorBefore: true,
				onSelect: () => dispatch({
					type: "duplicateInstances",
					ids: [instanceId]
				})
			},
			{
				id: "copy",
				label: S.copy,
				onSelect: () => copyInstances([instance])
			},
			{
				id: "cut",
				label: S.cut,
				icon: /* @__PURE__ */ jsx(Scissors, { className: "h-3.5 w-3.5" }),
				onSelect: () => {
					cutInstances(scene, [instanceId]);
					dispatch({
						type: "deleteInstances",
						ids: [instanceId]
					});
				}
			},
			{
				id: "hide",
				label: instance.hiddenAtStart ? S.show : S.hide,
				icon: instance.hiddenAtStart ? /* @__PURE__ */ jsx(Eye, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ jsx(EyeOff, { className: "h-3.5 w-3.5" }),
				onSelect: () => dispatch({
					type: "toggleInstancesVisibility",
					ids: [instanceId]
				})
			},
			{
				id: "lock",
				label: instance.locked ? S.unlock : S.lock,
				icon: instance.locked ? /* @__PURE__ */ jsx(Unlock, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ jsx(Lock, { className: "h-3.5 w-3.5" }),
				onSelect: () => dispatch({
					type: "toggleInstancesLock",
					ids: [instanceId]
				})
			},
			{
				id: "delete",
				label: S.delete,
				danger: true,
				separatorBefore: true,
				icon: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" }),
				onSelect: () => dispatch({
					type: "deleteInstances",
					ids: [instanceId]
				})
			}
		];
	};
	return /* @__PURE__ */ jsxs(Panel, {
		title: S.instances,
		badge: scene.instances.length,
		className: "min-h-0 flex-1",
		actions: /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("button", {
			type: "button",
			"aria-label": S.openSettings,
			title: "Mostrar instancias ocultas",
			onClick: (event) => {
				const rect = event.currentTarget.getBoundingClientRect();
				setSettings({
					x: rect.right - 190,
					y: rect.bottom + 2
				});
			},
			className: "grid h-6 w-6 place-items-center rounded text-text-secondary hover:bg-elevated hover:text-foreground",
			children: /* @__PURE__ */ jsx(Settings, { className: "h-3.5 w-3.5" })
		}), /* @__PURE__ */ jsx("button", {
			type: "button",
			"aria-label": S.closeInstancesPanel,
			onClick: () => {
				if (onClose) onClose();
				else dispatch({
					type: "ui",
					patch: { showInstancesPanel: false }
				});
			},
			className: "grid h-6 w-6 place-items-center rounded text-[14px] leading-none text-text-secondary hover:bg-elevated hover:text-foreground",
			children: "×"
		})] }),
		footer: /* @__PURE__ */ jsx(GdButton, {
			variant: "raised",
			primary: true,
			className: "w-full",
			icon: /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
			disabled: scene.objects.length === 0,
			onClick: () => {
				const source = scene.objects.find((o) => o.id === ui.selectedObjectIds[0]) ?? scene.objects[0];
				if (!source) return;
				dispatch({
					type: "addInstance",
					objectId: source.id,
					x: Math.round(scene.layers[0]?.camera.x ?? 0) + 100,
					y: Math.round(scene.layers[0]?.camera.y ?? 0) + 100
				});
			},
			children: S.addInstanceToScene
		}),
		children: [
			/* @__PURE__ */ jsx("div", {
				className: "px-2 pb-1.5 pt-1",
				children: /* @__PURE__ */ jsx(SearchBar, {
					value: query,
					onChange: setQuery,
					placeholder: S.searchInstances
				})
			}),
			rows.length === 0 ? /* @__PURE__ */ jsx("p", {
				className: "px-3 py-2 text-[12.5px] text-text-secondary",
				children: scene.instances.length === 0 ? S.noObjectYet : "Sin resultados"
			}) : null,
			rows.map(({ instance }) => {
				const object = objectById(instance.objectId);
				const selected = ui.selectedInstanceIds.includes(instance.id);
				const image = resolveAsset(object?.animations?.[0]?.images?.[0]?.image ?? object?.asset, project.resources);
				return /* @__PURE__ */ jsxs("div", {
					onClick: (event) => dispatch({
						type: "selectInstances",
						ids: event.shiftKey ? [.../* @__PURE__ */ new Set([...ui.selectedInstanceIds, instance.id])] : [instance.id]
					}),
					className: cn("group mx-1 flex cursor-pointer items-center gap-1.5 rounded px-1.5 py-[5px] text-[12.5px] hover:bg-list-hover", selected && "bg-selection", instance.hiddenAtStart && "opacity-60"),
					children: [
						image && object && !isTextLike(object.type) ? /* @__PURE__ */ jsx("img", {
							src: image,
							alt: "",
							draggable: false,
							className: "h-4 w-4 shrink-0 bg-[#1D1D26] object-contain [image-rendering:pixelated]"
						}) : /* @__PURE__ */ jsx(CatalogIcon, {
							name: object ? iconForObjectType(object.type) : "sprite",
							className: "h-4 w-4 shrink-0 text-[#C9B6FC]"
						}),
						/* @__PURE__ */ jsx("span", {
							className: "min-w-0 flex-1 truncate text-foreground",
							children: object?.name ?? instance.objectId
						}),
						/* @__PURE__ */ jsx("span", {
							className: "hidden shrink-0 text-[10px] text-text-secondary md:inline",
							children: instance.layer
						}),
						instance.locked ? /* @__PURE__ */ jsx(Lock, { className: "h-3 w-3 shrink-0 text-[#FFBC57]" }) : null,
						instance.hiddenAtStart ? /* @__PURE__ */ jsx(EyeOff, { className: "h-3 w-3 shrink-0 text-text-secondary" }) : null,
						/* @__PURE__ */ jsx("button", {
							type: "button",
							"aria-label": `Opciones de ${object?.name ?? instance.objectId}`,
							onClick: (event) => {
								event.stopPropagation();
								const rect = event.currentTarget.getBoundingClientRect();
								setRowMenu({
									x: rect.right - 180,
									y: rect.bottom + 2,
									instanceId: instance.id
								});
							},
							className: "shrink-0 rounded p-0.5 text-text-secondary opacity-0 hover:bg-toolbar hover:text-foreground group-hover:opacity-100",
							children: /* @__PURE__ */ jsx(MoreVertical, { className: "h-3.5 w-3.5" })
						})
					]
				}, instance.id);
			}),
			settings ? /* @__PURE__ */ jsx(GdMenu, {
				anchor: settings,
				onClose: () => setSettings(null),
				entries: [{
					id: "hidden",
					label: S.showHiddenInstances,
					checked: ui.showHiddenInstances,
					onSelect: () => dispatch({
						type: "ui",
						patch: { showHiddenInstances: !ui.showHiddenInstances }
					})
				}, {
					id: "layers",
					label: S.closeLayersPanel,
					onSelect: () => dispatch({
						type: "ui",
						patch: { showLayersPanel: false }
					})
				}]
			}) : null,
			rowMenu ? /* @__PURE__ */ jsx(GdMenu, {
				entries: entriesFor(rowMenu.instanceId),
				anchor: rowMenu,
				onClose: () => setRowMenu(null)
			}) : null
		]
	});
}
//#endregion
//#region src/components/editor/GroupsPanel.tsx
function GroupsPanel({ standalone = false, onClose } = {}) {
	const { scene, ui, dispatch } = useEditor();
	const [open, setOpen] = React.useState(true);
	const [expanded, setExpanded] = React.useState(null);
	const groups = scene.groups ?? [];
	return /* @__PURE__ */ jsxs("div", {
		className: cn("border-separator bg-toolbar", standalone ? "flex min-h-0 flex-1 flex-col" : "shrink-0 border-t"),
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex items-center gap-1 px-2 py-1.5",
			children: [
				/* @__PURE__ */ jsxs("button", {
					type: "button",
					"aria-expanded": open,
					onClick: () => setOpen((value) => !value),
					className: "flex min-w-0 flex-1 items-center gap-1 rounded px-1 py-0.5 text-left text-[11px] font-semibold uppercase tracking-wide text-text-secondary hover:bg-list-hover hover:text-foreground",
					children: [
						/* @__PURE__ */ jsx("span", {
							className: "text-[10px]",
							children: open ? "▾" : "▸"
						}),
						/* @__PURE__ */ jsx("span", {
							className: "truncate",
							children: S.objectGroups
						}),
						/* @__PURE__ */ jsx("span", {
							className: "ml-1 rounded bg-elevated px-1 text-[10px] tabular-nums",
							children: groups.length
						})
					]
				}),
				/* @__PURE__ */ jsx("button", {
					type: "button",
					"aria-label": S.objectGroups,
					title: S.objectGroups,
					onClick: () => dispatch({ type: "addObjectGroup" }),
					className: "grid h-6 w-6 place-items-center rounded text-text-secondary hover:bg-elevated hover:text-foreground",
					children: /* @__PURE__ */ jsx(Plus, { className: "h-3.5 w-3.5" })
				}),
				onClose ? /* @__PURE__ */ jsx("button", {
					type: "button",
					"aria-label": "Cerrar grupos de objetos",
					onClick: onClose,
					className: "grid h-6 w-6 place-items-center rounded text-[14px] text-text-secondary hover:bg-elevated hover:text-foreground",
					children: "×"
				}) : null
			]
		}), open ? /* @__PURE__ */ jsxs("div", {
			className: cn("pb-2", standalone && "min-h-0 flex-1 overflow-y-auto"),
			children: [groups.length === 0 ? /* @__PURE__ */ jsx("p", {
				className: "px-3 py-1 text-[12px] text-text-placeholder",
				children: "Aún no hay grupos de objetos."
			}) : null, groups.map((group) => {
				const isExpanded = expanded === group.name;
				return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("div", {
					className: cn("group mx-1 flex items-center gap-1.5 rounded px-1.5 py-[5px] text-[12.5px] hover:bg-list-hover", ui.selectedGroupName === group.name && "bg-selection"),
					onClick: () => dispatch({
						type: "ui",
						patch: { selectedGroupName: group.name }
					}),
					children: [
						/* @__PURE__ */ jsx(SquareStack, { className: "h-4 w-4 shrink-0 text-[#A483FF]" }),
						/* @__PURE__ */ jsx("input", {
							value: group.name,
							"aria-label": S.name,
							onClick: (event) => event.stopPropagation(),
							onChange: (event) => dispatch({
								type: "updateObjectGroup",
								name: group.name,
								patch: { name: event.target.value }
							}),
							className: "h-5 min-w-0 flex-1 rounded border border-transparent bg-transparent px-0.5 outline-none hover:border-separator focus:border-[var(--brand-light)]"
						}),
						/* @__PURE__ */ jsxs("button", {
							type: "button",
							"aria-label": "Objetos del grupo",
							onClick: (event) => {
								event.stopPropagation();
								setExpanded(isExpanded ? null : group.name);
							},
							className: "shrink-0 text-[10px] text-text-secondary hover:text-foreground",
							children: [
								group.objects.length,
								" ",
								isExpanded ? "▴" : "▾"
							]
						}),
						/* @__PURE__ */ jsx("button", {
							type: "button",
							"aria-label": S.delete,
							onClick: (event) => {
								event.stopPropagation();
								dispatch({
									type: "deleteObjectGroup",
									name: group.name
								});
							},
							className: "shrink-0 text-text-secondary opacity-0 hover:text-destructive group-hover:opacity-100",
							children: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" })
						})
					]
				}), isExpanded ? /* @__PURE__ */ jsx("div", {
					className: "mb-1 ml-6 border-l border-separator pl-2",
					children: scene.objects.map((object) => {
						const member = group.objects.includes(object.name);
						return /* @__PURE__ */ jsxs("button", {
							type: "button",
							onClick: () => dispatch({
								type: "updateObjectGroup",
								name: group.name,
								patch: { objects: member ? group.objects.filter((name) => name !== object.name) : [...group.objects, object.name] }
							}),
							className: cn("flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left text-[12px] hover:bg-list-hover", member ? "text-foreground" : "text-text-placeholder"),
							children: [/* @__PURE__ */ jsx("span", {
								className: "grid h-3.5 w-3.5 shrink-0 place-items-center rounded-[2px] border border-separator",
								children: member ? /* @__PURE__ */ jsx(Check, { className: "h-2.5 w-2.5 text-success" }) : null
							}), /* @__PURE__ */ jsx("span", {
								className: "min-w-0 flex-1 truncate",
								children: object.name
							})]
						}, object.id);
					})
				}) : null] }, group.name);
			})]
		}) : null]
	});
}
//#endregion
//#region src/lib/runtime/renderer.ts
var imageCache = /* @__PURE__ */ new Map();
function getImage(src) {
	if (!src) return void 0;
	const cached = imageCache.get(src);
	if (cached) return cached.complete && cached.naturalWidth > 0 ? cached : void 0;
	const image = new Image();
	image.src = src;
	imageCache.set(src, image);
}
var isTextType = (type) => type === "Text" || type.includes("Text") || type.includes("BBText");
function renderScene(ctx, state, options) {
	const { width, height, background, resolve, showHitMasks } = options;
	const scale = options.scale ?? 1;
	ctx.save();
	ctx.translate(options.offsetX ?? 0, options.offsetY ?? 0);
	ctx.scale(scale, scale);
	ctx.fillStyle = background;
	ctx.fillRect(0, 0, width, height);
	const objects = [...state.objects].filter((object) => !object.destroyed && !object.hidden && !object.flash.hidden).sort((a, b) => a.zOrder - b.zOrder);
	for (const object of objects) {
		const layer = state.layers[object.layer];
		if (layer && !layer.visible) continue;
		const ownCamera = !!layer && layer.followBaseLayer === false;
		const camX = ownCamera ? layer?.cameraX ?? 0 : state.camera.x;
		const camY = ownCamera ? layer?.cameraY ?? 0 : state.camera.y;
		const zoom = ownCamera ? layer?.cameraZoom ?? 1 : state.camera.zoom ?? 1;
		const layerAlpha = (layer?.opacity ?? 255) / 255;
		const centerWorldX = camX + width / 2;
		const centerWorldY = camY + height / 2;
		const viewX = (object.x - centerWorldX) * zoom + width / 2;
		const viewY = (object.y - centerWorldY) * zoom + height / 2;
		const viewW = object.width * zoom;
		const viewH = object.height * zoom;
		ctx.save();
		ctx.globalAlpha = Math.max(0, Math.min(1, object.opacity / 255)) * layerAlpha;
		const cx = viewX + viewW / 2;
		const cy = viewY + viewH / 2;
		ctx.translate(cx, cy);
		if (object.angle) ctx.rotate(object.angle * Math.PI / 180);
		if (object.flipX) ctx.scale(-1, 1);
		if (object.flipY) ctx.scale(1, -1);
		if (isTextType(object.type)) {
			ctx.fillStyle = object.textColor;
			ctx.font = `${object.bold ? "700 " : ""}${Math.max(1, object.textSize * zoom)}px ${object.fontFamily ? `"${object.fontFamily.replace(/\.[a-z]+$/i, "")}", ` : ""}ui-sans-serif, system-ui, sans-serif`;
			ctx.textBaseline = "middle";
			ctx.textAlign = object.alignment === "center" ? "center" : object.alignment === "right" ? "right" : "left";
			const anchorX = object.alignment === "center" ? 0 : object.alignment === "right" ? viewW / 2 : -viewW / 2;
			ctx.fillText(object.text, anchorX, 0);
			ctx.restore();
			continue;
		}
		const image = getImage(resolve?.(object.asset) ?? object.asset);
		if (image) {
			ctx.imageSmoothingEnabled = false;
			if (object.type === "TiledSpriteObject::TiledSprite" || object.type === "Tiled Sprite") drawTiled(ctx, image, viewW, viewH);
			else ctx.drawImage(image, -viewW / 2, -viewH / 2, viewW, viewH);
			applyTint(ctx, object.tint, object.colorOverlay, viewW, viewH);
		} else {
			ctx.fillStyle = object.tint ? `rgb(${object.tint[0]}, ${object.tint[1]}, ${object.tint[2]})` : "rgba(112,70,236,0.65)";
			ctx.fillRect(-viewW / 2, -viewH / 2, viewW, viewH);
		}
		if (showHitMasks) {
			ctx.globalAlpha = .75;
			ctx.strokeStyle = "#FF85ED";
			ctx.lineWidth = 1;
			const mask = object.hitBox;
			if (mask) {
				const referenceWidth = Math.max(1, mask.referenceWidth ?? object.width);
				const referenceHeight = Math.max(1, mask.referenceHeight ?? object.height);
				const sourcePoints = mask.kind === "polygon" && mask.vertices.length >= 3 ? mask.vertices : [
					{
						x: mask.x,
						y: mask.y
					},
					{
						x: mask.x + mask.width,
						y: mask.y
					},
					{
						x: mask.x + mask.width,
						y: mask.y + mask.height
					},
					{
						x: mask.x,
						y: mask.y + mask.height
					}
				];
				ctx.beginPath();
				sourcePoints.forEach((point, index) => {
					const x = point.x / referenceWidth * viewW - viewW / 2;
					const y = point.y / referenceHeight * viewH - viewH / 2;
					if (index === 0) ctx.moveTo(x, y);
					else ctx.lineTo(x, y);
				});
				ctx.closePath();
				ctx.stroke();
			} else ctx.strokeRect(-viewW / 2, -viewH / 2, viewW, viewH);
		}
		ctx.restore();
	}
	ctx.restore();
}
function drawTiled(ctx, image, width, height) {
	const tileW = image.naturalWidth || width;
	const tileH = image.naturalHeight || height;
	ctx.save();
	ctx.beginPath();
	ctx.rect(-width / 2, -height / 2, width, height);
	ctx.clip();
	for (let x = -width / 2; x < width / 2; x += tileW) for (let y = -height / 2; y < height / 2; y += tileH) ctx.drawImage(image, x, y, tileW, tileH);
	ctx.restore();
}
/**
* Tint multiplies the pixels, color overlay replaces them — same visual result as
* GDevelop's "Tinte" and "Superposición de color" effects, done with composite ops.
*/
function applyTint(ctx, tint, overlay, width, height) {
	if (!tint && !overlay) return;
	ctx.save();
	ctx.globalCompositeOperation = tint ? "multiply" : "source-atop";
	if (tint) {
		ctx.globalAlpha = 1;
		ctx.fillStyle = `rgb(${tint[0]}, ${tint[1]}, ${tint[2]})`;
		ctx.fillRect(-width / 2, -height / 2, width, height);
	}
	if (overlay) {
		ctx.globalCompositeOperation = "source-atop";
		ctx.globalAlpha = Math.max(0, Math.min(1, overlay[3] / 255));
		ctx.fillStyle = `rgb(${overlay[0]}, ${overlay[1]}, ${overlay[2]})`;
		ctx.fillRect(-width / 2, -height / 2, width, height);
	}
	ctx.restore();
}
//#endregion
//#region src/components/editor/SceneViewToolbar.tsx
var ZOOM_BUTTON_FACTOR = 2 ** (2 / 16);
function SceneViewToolbar({ onFit }) {
	const { ui, dispatch, scene } = useEditor();
	const zoomOut = () => dispatch({
		type: "ui",
		patch: { zoom: clampCanvasZoom(ui.zoom / ZOOM_BUTTON_FACTOR) }
	});
	const zoomIn = () => dispatch({
		type: "ui",
		patch: { zoom: clampCanvasZoom(ui.zoom * ZOOM_BUTTON_FACTOR) }
	});
	const resetView = () => dispatch({
		type: "ui",
		patch: {
			zoom: 1,
			pan: {
				x: 0,
				y: 0
			}
		}
	});
	return /* @__PURE__ */ jsxs("div", {
		"data-scene-view-toolbar": "floating",
		className: "pointer-events-auto absolute left-2 top-2 z-10 hidden items-center gap-0.5 rounded-md border border-separator bg-toolbar/90 p-0.5 shadow-lg backdrop-blur sm:flex",
		children: [
			/* @__PURE__ */ jsx("button", {
				type: "button",
				title: S.toggleGrid,
				"aria-label": S.toggleGrid,
				"data-grid-toggle": true,
				onClick: () => dispatch({
					type: "updateGrid",
					patch: { show: !scene.grid.show }
				}),
				className: cn("grid h-7 w-7 place-items-center rounded text-muted-foreground hover:bg-elevated hover:text-foreground", scene.grid.show && "text-[#8AD6FF]"),
				children: /* @__PURE__ */ jsx(Grid3x3, { className: "h-4 w-4" })
			}),
			/* @__PURE__ */ jsx("button", {
				type: "button",
				title: S.snapToGrid,
				"aria-label": S.snapToGrid,
				"data-snap-toggle": true,
				onClick: () => dispatch({
					type: "updateGrid",
					patch: { snap: !scene.grid.snap }
				}),
				className: cn("grid h-7 w-7 place-items-center rounded text-muted-foreground hover:bg-elevated hover:text-foreground", scene.grid.snap && "text-[#8AD6FF]"),
				children: /* @__PURE__ */ jsx(Magnet, { className: "h-4 w-4" })
			}),
			/* @__PURE__ */ jsx("div", { className: "mx-0.5 h-4 w-px bg-separator" }),
			/* @__PURE__ */ jsx("button", {
				type: "button",
				title: S.zoomOut,
				"aria-label": S.zoomOut,
				"data-zoom-out": true,
				onClick: zoomOut,
				className: "grid h-7 w-7 place-items-center rounded text-muted-foreground hover:bg-elevated hover:text-foreground",
				children: /* @__PURE__ */ jsx(ZoomOut, { className: "h-4 w-4" })
			}),
			/* @__PURE__ */ jsxs("button", {
				type: "button",
				title: `${S.zoomReset} (100%)`,
				"aria-label": S.zoomReset,
				"data-zoom-reset": true,
				onClick: resetView,
				className: "h-7 w-12 shrink-0 rounded px-1 text-center text-[11.5px] tabular-nums text-muted-foreground hover:bg-elevated hover:text-foreground",
				children: [Math.round(ui.zoom * 100), "%"]
			}),
			/* @__PURE__ */ jsx("button", {
				type: "button",
				title: S.zoomIn,
				"aria-label": S.zoomIn,
				"data-zoom-in": true,
				onClick: zoomIn,
				className: "grid h-7 w-7 place-items-center rounded text-muted-foreground hover:bg-elevated hover:text-foreground",
				children: /* @__PURE__ */ jsx(ZoomIn, { className: "h-4 w-4" })
			}),
			/* @__PURE__ */ jsx("div", { className: "mx-0.5 h-4 w-px bg-separator" }),
			/* @__PURE__ */ jsx("button", {
				type: "button",
				title: S.zoomToFit,
				"aria-label": S.zoomToFit,
				"data-fit-view": true,
				onClick: onFit,
				className: "grid h-7 w-7 place-items-center rounded text-muted-foreground hover:bg-elevated hover:text-foreground",
				children: /* @__PURE__ */ jsx(Maximize, { className: "h-4 w-4" })
			})
		]
	});
}
//#endregion
//#region src/components/editor/SceneCanvas.tsx
var HANDLE = 7;
var WHEEL_ZOOM_FACTOR = 1.7 ** (1 / 16);
var rgb = (value) => {
	const parts = value.split(";").map((part) => Math.max(0, Math.min(255, Number(part) || 0)));
	return `rgb(${parts[0] ?? 0}, ${parts[1] ?? 0}, ${parts[2] ?? 0})`;
};
/** Editor projection of the scene into the runtime shape the renderer consumes. */
function buildEditorState(scene, options) {
	const layers = {};
	const baseName = scene.layers[0]?.name;
	for (const layer of scene.layers) {
		const follows = !(layer.name === baseName) && layer.followBaseLayer !== false;
		layers[layer.name] = {
			name: layer.name,
			visible: layer.visible,
			cameraX: follows ? 0 : layer.camera.x,
			cameraY: follows ? 0 : layer.camera.y,
			cameraZoom: 1,
			opacity: 255,
			followBaseLayer: follows
		};
	}
	const byInstance = /* @__PURE__ */ new Map();
	const objects = [];
	for (const instance of scene.instances) {
		const def = scene.objects.find((o) => o.id === instance.objectId);
		if (!def) continue;
		if (instance.hiddenAtStart && !options.showHidden) continue;
		const animation = def.animations?.[0];
		const object = {
			id: instance.id,
			name: def.name,
			type: def.type,
			...def.asset ? { asset: def.asset } : {},
			...animation?.images[0]?.hitBox ? { hitBox: animation.images[0].hitBox } : {},
			x: instance.x,
			y: instance.y,
			width: instance.width,
			height: instance.height,
			angle: instance.angle,
			zOrder: instance.zOrder,
			layer: instance.layer,
			opacity: 255,
			hidden: def.instancesHidden === true,
			flipX: false,
			flipY: false,
			text: def.text ?? "",
			textColor: hexOf(def.textColor),
			textSize: def.textSize ?? 24,
			bold: def.bold ?? false,
			alignment: def.alignment ?? "left",
			animationIndex: 0,
			timeBetweenFrames: animation?.timeBetweenFrames ?? 0,
			animationSpeedScale: 1,
			animationName: "",
			frameIndex: 0,
			frameTimer: 0,
			behaviors: def.behaviors.map((b) => b.name),
			behaviorTypes: Object.fromEntries(def.behaviors.map((b) => [b.name, b.type])),
			behaviorProps: Object.fromEntries(def.behaviors.map((b) => [b.name, b.properties])),
			controls: {
				left: false,
				right: false,
				up: false,
				down: false,
				jump: false
			},
			ignoreControls: false,
			onFloor: false,
			jumping: false,
			falling: false,
			vx: 0,
			vy: 0,
			gravity: 0,
			maxFallingSpeed: 0,
			friction: 0,
			health: 0,
			maxHealth: 0,
			flash: {
				active: false,
				elapsed: 0,
				duration: 0,
				half: 0,
				hidden: false
			},
			tweens: {},
			tint: tintOf(instance.effects.length ? instance.effects : def.effects),
			colorOverlay: null,
			variables: {},
			destroyed: false
		};
		const image = animation?.images?.[0]?.image ?? def.asset;
		if (image) object.asset = image;
		byInstance.set(instance.id, object);
		objects.push(object);
	}
	const base = layers[scene.layers[0]?.name ?? "Base layer"];
	return {
		byInstance,
		state: {
			objects,
			layers,
			variables: {},
			globalVariables: {},
			timers: {},
			pausedTimers: {},
			camera: {
				x: base?.cameraX ?? 0,
				y: base?.cameraY ?? 0
			},
			time: 0,
			timeScale: 1,
			frame: 0,
			sceneName: scene.name,
			logs: [],
			paused: false,
			stats: {
				objectsCount: objects.length,
				instructionsCount: 0,
				eventsCount: 0,
				frameTimeMs: 0
			}
		}
	};
}
var hexOf = (value) => {
	if (!value) return "#FAFAFA";
	if (value.startsWith("#")) return value;
	return `#${value.split(";").map((p) => Number(p) || 0).map((p) => Math.max(0, Math.min(255, p)).toString(16).padStart(2, "0")).join("")}`;
};
function tintOf(effects) {
	const tint = effects.find((effect) => effect.type === "Tint" && effect.parameters["disabled"] !== "yes");
	if (!tint) return null;
	return [
		Number(tint.parameters["r"] ?? 255),
		Number(tint.parameters["g"] ?? 255),
		Number(tint.parameters["b"] ?? 255)
	];
}
function SceneCanvas() {
	const { scene, ui, dispatch, project } = useEditor();
	const wrapRef = useRef(null);
	const canvasRef = useRef(null);
	const activeTouchPointers = useRef(/* @__PURE__ */ new Map());
	const activeGesture = useRef(null);
	const touchSequenceTransformed = useRef(false);
	const touchSequenceSelection = useRef([]);
	const didInitialFit = useRef(false);
	const [size, setSize] = useState({
		width: 800,
		height: 600
	});
	const [hover, setHover] = useState(null);
	const [drag, setDrag] = useState(null);
	const { open, menu } = useContextMenu();
	const uiViewRef = useRef({
		zoom: ui.zoom,
		pan: ui.pan
	});
	uiViewRef.current = {
		zoom: ui.zoom,
		pan: ui.pan
	};
	const windowSize = useMemo(() => {
		const width = scene.useCustomWindowSize ? scene.customWindowWidth ?? project.gameSettings.windowWidth : project.gameSettings.windowWidth;
		const height = scene.useCustomWindowSize ? scene.customWindowHeight ?? project.gameSettings.windowHeight : project.gameSettings.windowHeight;
		return {
			width: width || 800,
			height: height || 600
		};
	}, [
		scene.useCustomWindowSize,
		scene.customWindowWidth,
		scene.customWindowHeight,
		project.gameSettings.windowWidth,
		project.gameSettings.windowHeight
	]);
	const magnification = scene.magnification && scene.magnification > 0 ? scene.magnification : 1;
	const centerWindow = useMemo(() => shouldCenterGameWindow(size, windowSize, magnification), [
		size,
		windowSize,
		magnification
	]);
	const view = useMemo(() => {
		const scale = ui.zoom * magnification;
		const centeredX = (size.width - windowSize.width * scale) / 2;
		const centeredY = (size.height - windowSize.height * scale) / 2;
		return {
			scale,
			offsetX: (centerWindow ? centeredX : 0) + ui.pan.x,
			offsetY: (centerWindow ? centeredY : 0) + ui.pan.y
		};
	}, [
		size.width,
		size.height,
		ui.zoom,
		ui.pan.x,
		ui.pan.y,
		windowSize.width,
		windowSize.height,
		magnification,
		centerWindow
	]);
	const toWorld = useCallback((point) => ({
		x: (point.x - view.offsetX) / view.scale,
		y: (point.y - view.offsetY) / view.scale
	}), [
		view.offsetX,
		view.offsetY,
		view.scale
	]);
	const editorView = useMemo(() => buildEditorState(scene, { showHidden: ui.showHiddenInstances }), [scene, ui.showHiddenInstances]);
	const snapValue = useCallback((value, step) => scene.grid.snap ? Math.round(value / step) * step : value, [scene.grid.snap]);
	useEffect(() => {
		didInitialFit.current = false;
	}, [scene.name]);
	useEffect(() => {
		const canvas = canvasRef.current;
		const wrap = wrapRef.current;
		if (!canvas || !wrap) return;
		const observer = new ResizeObserver(() => {
			const rect = wrap.getBoundingClientRect();
			const nextSize = {
				width: Math.max(120, Math.floor(rect.width)),
				height: Math.max(120, Math.floor(rect.height))
			};
			setSize(nextSize);
			if (!didInitialFit.current) {
				didInitialFit.current = true;
				const current = uiViewRef.current;
				if (Math.abs(current.zoom - 1) < 1e-4 && current.pan.x === 0 && current.pan.y === 0) {
					const zoom = fitGameWindowZoom(nextSize, windowSize, magnification);
					if (zoom < .99) dispatch({
						type: "ui",
						patch: {
							zoom,
							pan: {
								x: 0,
								y: 0
							}
						}
					});
				}
			}
		});
		observer.observe(wrap);
		return () => observer.disconnect();
	}, [
		dispatch,
		magnification,
		scene.name,
		windowSize
	]);
	const draw = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const dpr = Math.min(2, window.devicePixelRatio || 1);
		if (canvas.width !== size.width * dpr || canvas.height !== size.height * dpr) {
			canvas.width = size.width * dpr;
			canvas.height = size.height * dpr;
		}
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, size.width, size.height);
		ctx.fillStyle = "#F5F5F7";
		ctx.fillRect(0, 0, size.width, size.height);
		drawEditorBackdrop(ctx, size, view);
		ctx.save();
		ctx.translate(view.offsetX, view.offsetY);
		ctx.scale(view.scale, view.scale);
		renderScene(ctx, editorView.state, {
			width: windowSize.width,
			height: windowSize.height,
			background: rgb(scene.backgroundColor),
			resolve: (name) => resolveAsset(name, project.resources),
			scale: 1,
			offsetX: 0,
			offsetY: 0,
			showHitMasks: ui.showHitMasks
		});
		drawGrid(ctx, scene, windowSize);
		ctx.restore();
		ctx.save();
		ctx.translate(view.offsetX, view.offsetY);
		ctx.scale(view.scale, view.scale);
		for (const id of ui.selectedInstanceIds) {
			const object = editorView.byInstance.get(id);
			if (!object) continue;
			drawSelection(ctx, object, view.scale);
		}
		if (drag?.kind === "marquee") {
			const a = toWorld(drag.start);
			const b = toWorld(drag.current);
			ctx.save();
			ctx.strokeStyle = "#6868E8";
			ctx.fillStyle = "rgba(104,104,232,0.18)";
			ctx.lineWidth = 1 / view.scale;
			const rect = {
				x: Math.min(a.x, b.x),
				y: Math.min(a.y, b.y),
				w: Math.abs(b.x - a.x),
				h: Math.abs(b.y - a.y)
			};
			ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
			ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
			ctx.restore();
		}
		ctx.restore();
		ctx.save();
		const frameLeft = view.offsetX;
		const frameTop = view.offsetY;
		const frameWidth = windowSize.width * view.scale;
		const frameHeight = windowSize.height * view.scale;
		ctx.strokeStyle = "#8AD6FF";
		ctx.lineWidth = 2;
		ctx.shadowColor = "rgba(0,0,0,0.9)";
		ctx.shadowBlur = 4;
		ctx.strokeRect(frameLeft - 1, frameTop - 1, frameWidth + 2, frameHeight + 2);
		ctx.shadowBlur = 0;
		const frameLabel = `JUEGO · ${windowSize.width}×${windowSize.height}`;
		ctx.font = "600 10px ui-sans-serif, system-ui, sans-serif";
		const labelWidth = Math.ceil(ctx.measureText(frameLabel).width) + 12;
		const labelX = Math.max(4, Math.min(size.width - labelWidth - 4, frameLeft));
		const labelY = frameTop >= 22 ? frameTop - 20 : Math.max(4, frameTop + 4);
		ctx.fillStyle = "rgba(220,224,230,0.95)";
		ctx.fillRect(labelX, labelY, labelWidth, 17);
		ctx.strokeStyle = "rgba(138,214,255,0.75)";
		ctx.lineWidth = 1;
		ctx.strokeRect(labelX + .5, labelY + .5, labelWidth - 1, 16);
		ctx.fillStyle = "#2563EB";
		ctx.textBaseline = "middle";
		ctx.fillText(frameLabel, labelX + 6, labelY + 8.5);
		ctx.restore();
		if (hover) {
			const world = toWorld(hover);
			const hit = hitTest(editorView.state.objects, world.x, world.y);
			if (hit && !ui.selectedInstanceIds.includes(hit.id)) {
				ctx.save();
				ctx.translate(view.offsetX, view.offsetY);
				ctx.scale(view.scale, view.scale);
				ctx.strokeStyle = "rgba(74,176,228,0.55)";
				ctx.lineWidth = 1 / view.scale;
				ctx.strokeRect(hit.x, hit.y, hit.width, hit.height);
				ctx.restore();
			}
		}
	}, [
		size,
		view,
		scene,
		windowSize,
		ui.showHitMasks,
		ui.selectedInstanceIds,
		ui.windowMask,
		hover,
		drag,
		editorView,
		project.gameSettings.renderOutsideGameArea,
		project.resources,
		toWorld
	]);
	useEffect(() => {
		draw();
	}, [draw]);
	const handleAt = useCallback((point) => {
		if (ui.selectedInstanceIds.length !== 1) return null;
		const object = editorView.byInstance.get(ui.selectedInstanceIds[0]);
		if (!object) return null;
		const box = {
			x: view.offsetX + object.x * view.scale,
			y: view.offsetY + object.y * view.scale,
			w: object.width * view.scale,
			h: object.height * view.scale
		};
		const points = {
			nw: {
				x: box.x,
				y: box.y
			},
			n: {
				x: box.x + box.w / 2,
				y: box.y
			},
			ne: {
				x: box.x + box.w,
				y: box.y
			},
			e: {
				x: box.x + box.w,
				y: box.y + box.h / 2
			},
			se: {
				x: box.x + box.w,
				y: box.y + box.h
			},
			s: {
				x: box.x + box.w / 2,
				y: box.y + box.h
			},
			sw: {
				x: box.x,
				y: box.y + box.h
			},
			w: {
				x: box.x,
				y: box.y + box.h / 2
			},
			rotate: {
				x: box.x + box.w / 2,
				y: box.y - 24
			}
		};
		for (const [id, position] of Object.entries(points)) if (Math.abs(point.x - position.x) <= HANDLE && Math.abs(point.y - position.y) <= HANDLE) return id;
		return null;
	}, [
		editorView,
		ui.selectedInstanceIds,
		view
	]);
	const localPoint = (event) => {
		const rect = event.currentTarget.getBoundingClientRect();
		return {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top
		};
	};
	const startTwoPointerGesture = () => {
		const pair = [...activeTouchPointers.current.entries()].slice(0, 2);
		const first = pair[0];
		const second = pair[1];
		if (!first || !second) return;
		activeGesture.current = {
			pointerIds: [first[0], second[0]],
			start: {
				points: [first[1], second[1]],
				zoom: ui.zoom,
				magnification,
				pan: { ...ui.pan },
				transform: { ...view },
				viewport: { ...size },
				gameWindow: { ...windowSize },
				centerWindow
			}
		};
		touchSequenceTransformed.current = true;
		dispatch({
			type: "selectInstances",
			ids: touchSequenceSelection.current
		});
		setDrag(null);
		setHover(null);
	};
	const onPointerDown = (event) => {
		const point = localPoint(event);
		if (event.pointerType === "touch") {
			if (activeTouchPointers.current.size === 0) {
				touchSequenceTransformed.current = false;
				touchSequenceSelection.current = [...ui.selectedInstanceIds];
			}
			activeTouchPointers.current.set(event.pointerId, point);
			event.currentTarget.setPointerCapture(event.pointerId);
			if (activeTouchPointers.current.size >= 2) {
				startTwoPointerGesture();
				event.preventDefault();
				return;
			}
		}
		if (event.button === 1 || event.button === 0 && event.altKey) {
			setDrag({
				kind: "pan",
				start: {
					x: event.clientX,
					y: event.clientY
				},
				origin: { ...ui.pan }
			});
			event.currentTarget.setPointerCapture(event.pointerId);
			return;
		}
		if (event.button !== 0) return;
		const handle = handleAt(point);
		const world = toWorld(point);
		dispatch({
			type: "ui",
			patch: {
				cursorClientPosition: {
					x: event.clientX,
					y: event.clientY
				},
				cursorPosition: {
					x: Math.round(world.x),
					y: Math.round(world.y)
				}
			}
		});
		if (handle && ui.selectedInstanceIds.length === 1) {
			const id = ui.selectedInstanceIds[0];
			const object = editorView.byInstance.get(id);
			const instance = scene.instances.find((candidate) => candidate.id === id);
			const layer = instance ? scene.layers.find((candidate) => candidate.name === instance.layer) : void 0;
			if (instance?.locked || layer?.locked) return;
			if (handle === "rotate" && object) {
				const center = {
					x: object.x + object.width / 2,
					y: object.y + object.height / 2
				};
				setDrag({
					kind: "rotate",
					id,
					center,
					originAngle: object.angle,
					start: Math.atan2(world.y - center.y, world.x - center.x) * 180 / Math.PI
				});
				event.currentTarget.setPointerCapture(event.pointerId);
				return;
			}
			if (object) {
				setDrag({
					kind: "resize",
					handle,
					start: point,
					origin: {
						x: object.x,
						y: object.y,
						width: object.width,
						height: object.height
					}
				});
				event.currentTarget.setPointerCapture(event.pointerId);
				return;
			}
		}
		const hit = hitTest(editorView.state.objects, world.x, world.y);
		if (!hit) {
			if (!event.shiftKey) dispatch({
				type: "selectInstances",
				ids: []
			});
			setDrag({
				kind: "marquee",
				start: point,
				current: point,
				additive: event.shiftKey
			});
			event.currentTarget.setPointerCapture(event.pointerId);
			return;
		}
		const sourceInstance = scene.instances.find((instance) => instance.id === hit.id);
		const sourceLayer = sourceInstance ? scene.layers.find((layer) => layer.name === sourceInstance.layer) : void 0;
		if (sourceInstance?.locked || sourceLayer?.locked) {
			dispatch({
				type: "selectInstances",
				ids: [hit.id]
			});
			return;
		}
		let ids = ui.selectedInstanceIds;
		if (event.shiftKey) {
			ids = ids.includes(hit.id) ? ids.filter((i) => i !== hit.id) : [...ids, hit.id];
			dispatch({
				type: "selectInstances",
				ids
			});
			return;
		}
		if (!ids.includes(hit.id)) {
			ids = [hit.id];
			dispatch({
				type: "selectInstances",
				ids
			});
		}
		const origin = /* @__PURE__ */ new Map();
		for (const id of ids) {
			const object = editorView.byInstance.get(id);
			const instance = scene.instances.find((candidate) => candidate.id === id);
			const layer = instance ? scene.layers.find((candidate) => candidate.name === instance.layer) : void 0;
			if (object && !instance?.locked && !layer?.locked) origin.set(id, {
				x: object.x,
				y: object.y
			});
		}
		setDrag({
			kind: "move",
			start: world,
			origin,
			dragged: false
		});
		event.currentTarget.setPointerCapture(event.pointerId);
	};
	const onPointerMove = (event) => {
		const point = localPoint(event);
		if (event.pointerType === "touch" && activeTouchPointers.current.has(event.pointerId)) {
			activeTouchPointers.current.set(event.pointerId, point);
			const gesture = activeGesture.current;
			if (gesture) {
				const first = activeTouchPointers.current.get(gesture.pointerIds[0]);
				const second = activeTouchPointers.current.get(gesture.pointerIds[1]);
				if (first && second) {
					const next = resolveTwoPointerGesture(gesture.start, [first, second]);
					dispatch({
						type: "ui",
						patch: next
					});
				}
				event.preventDefault();
				return;
			}
			if (touchSequenceTransformed.current) return;
		}
		if (event.pointerType !== "touch") setHover(point);
		dispatch({
			type: "ui",
			patch: {
				cursorClientPosition: {
					x: event.clientX,
					y: event.clientY
				},
				cursorPosition: {
					x: Math.round(toWorld(point).x),
					y: Math.round(toWorld(point).y)
				}
			}
		});
		if (!drag) return;
		if (drag.kind === "pan") {
			dispatch({
				type: "ui",
				patch: { pan: {
					x: drag.origin.x + (event.clientX - drag.start.x),
					y: drag.origin.y + (event.clientY - drag.start.y)
				} }
			});
			return;
		}
		const world = toWorld(point);
		if (drag.kind === "marquee") {
			setDrag({
				...drag,
				current: point
			});
			return;
		}
		if (drag.kind === "move") {
			const totalDx = world.x - drag.start.x;
			const totalDy = world.y - drag.start.y;
			if (!drag.dragged) {
				if (Math.hypot(totalDx, totalDy) < 3 / view.scale) return;
				dispatch({ type: "recordHistory" });
				setDrag({
					...drag,
					dragged: true
				});
			}
			const positions = Array.from(drag.origin.entries()).map(([id, initialPos]) => ({
				id,
				x: snapValue(initialPos.x + totalDx, scene.grid.width),
				y: snapValue(initialPos.y + totalDy, scene.grid.height)
			}));
			if (positions.length > 0) dispatch({
				type: "setInstancesPositions",
				positions
			});
			return;
		}
		if (drag.kind === "rotate") {
			const angle = Math.atan2(world.y - drag.center.y, world.x - drag.center.x) * 180 / Math.PI;
			const next = drag.originAngle + (angle - drag.start);
			dispatch({
				type: "updateInstance",
				id: drag.id,
				patch: { angle: Math.round(event.shiftKey ? Math.round(next / 15) * 15 : next) }
			});
			return;
		}
		if (drag.kind === "resize") {
			const id = ui.selectedInstanceIds[0];
			if (!id) return;
			const dx = (point.x - drag.start.x) / view.scale;
			const dy = (point.y - drag.start.y) / view.scale;
			const origin = drag.origin;
			let x = origin.x;
			let y = origin.y;
			let width = origin.width;
			let height = origin.height;
			if (drag.handle.includes("w")) {
				x = snapValue(origin.x + dx, scene.grid.width);
				width = Math.max(4, origin.width + (origin.x - x));
			}
			if (drag.handle.includes("e")) width = Math.max(4, snapValue(origin.width + dx, scene.grid.width));
			if (drag.handle.includes("n")) {
				y = snapValue(origin.y + dy, scene.grid.height);
				height = Math.max(4, origin.height + (origin.y - y));
			}
			if (drag.handle.includes("s")) height = Math.max(4, snapValue(origin.height + dy, scene.grid.height));
			dispatch({
				type: "updateInstance",
				id,
				patch: {
					x,
					y,
					width,
					height,
					customSize: true
				}
			});
		}
	};
	const onPointerUp = (event) => {
		if (event.pointerType === "touch") {
			const transformed = touchSequenceTransformed.current;
			activeTouchPointers.current.delete(event.pointerId);
			if (activeGesture.current || transformed) {
				activeGesture.current = null;
				setDrag(null);
				if (activeTouchPointers.current.size >= 2) startTwoPointerGesture();
				if (activeTouchPointers.current.size === 0) touchSequenceTransformed.current = false;
				try {
					event.currentTarget.releasePointerCapture(event.pointerId);
				} catch {}
				return;
			}
			if (activeTouchPointers.current.size === 0) touchSequenceTransformed.current = false;
		}
		if (drag?.kind === "marquee") {
			const a = toWorld(drag.start);
			const b = toWorld(drag.current);
			const box = {
				x: Math.min(a.x, b.x),
				y: Math.min(a.y, b.y),
				w: Math.abs(b.x - a.x),
				h: Math.abs(b.y - a.y)
			};
			const ids = editorView.state.objects.filter((object) => object.x < box.x + box.w && object.x + object.width > box.x && object.y < box.y + box.h && object.y + object.height > box.y).map((object) => object.id);
			if (ids.length > 0 || !drag.additive) dispatch({
				type: "selectInstances",
				ids: drag.additive ? [.../* @__PURE__ */ new Set([...ui.selectedInstanceIds, ...ids])] : ids
			});
		}
		setDrag(null);
		try {
			event.currentTarget.releasePointerCapture(event.pointerId);
		} catch {}
	};
	const onPointerCancel = (event) => {
		activeTouchPointers.current.delete(event.pointerId);
		activeGesture.current = null;
		setDrag(null);
		setHover(null);
		if (activeTouchPointers.current.size === 0) touchSequenceTransformed.current = false;
		try {
			event.currentTarget.releasePointerCapture(event.pointerId);
		} catch {}
	};
	const onWheel = (event) => {
		if (event.ctrlKey || event.metaKey) {
			event.preventDefault();
			const rect = event.currentTarget.getBoundingClientRect();
			const next = resolveZoomAtPoint({
				x: event.clientX - rect.left,
				y: event.clientY - rect.top
			}, ui.zoom * (event.deltaY < 0 ? WHEEL_ZOOM_FACTOR : 1 / WHEEL_ZOOM_FACTOR), {
				zoom: ui.zoom,
				magnification,
				pan: ui.pan,
				transform: view,
				viewport: size,
				gameWindow: windowSize,
				centerWindow
			});
			dispatch({
				type: "ui",
				patch: next
			});
			return;
		}
		if (event.shiftKey) {
			dispatch({
				type: "ui",
				patch: { pan: {
					x: ui.pan.x - event.deltaY,
					y: ui.pan.y
				} }
			});
			return;
		}
		dispatch({
			type: "ui",
			patch: { pan: {
				x: ui.pan.x - event.deltaX,
				y: ui.pan.y - event.deltaY
			} }
		});
	};
	const onDoubleClick = (event) => {
		const world = toWorld(localPoint(event));
		const hit = hitTest(editorView.state.objects, world.x, world.y);
		if (!hit) return;
		const object = scene.objects.find((o) => o.name === hit.name);
		if (object) dispatch({
			type: "openDialog",
			dialog: {
				name: "objectEditor",
				objectId: object.id
			}
		});
	};
	const onDrop = (event) => {
		event.preventDefault();
		const payload = readDropPayload(event);
		if (!payload) return;
		const world = toWorld({
			x: event.nativeEvent.offsetX,
			y: event.nativeEvent.offsetY
		});
		if (payload.kind === "object") {
			const object = scene.objects.find((o) => o.name === payload.value);
			if (!object) return;
			dispatch({
				type: "addInstance",
				objectId: object.id,
				x: snapValue(world.x, scene.grid.width),
				y: snapValue(world.y, scene.grid.height)
			});
			return;
		}
		const name = payload.value.replace(/\.[a-z0-9]+$/i, "");
		const existing = scene.objects.find((o) => o.name === name);
		dispatch({
			type: "addObject",
			object: {
				name: existing ? uniqueName(name, scene.objects.map((o) => o.name)) : name,
				type: "Sprite",
				asset: payload.value,
				animations: [],
				effects: [],
				behaviors: [],
				variables: []
			}
		});
	};
	const contextMenuEntries = (event) => {
		const world = toWorld(localPoint(event));
		const hit = hitTest(editorView.state.objects, world.x, world.y);
		const selected = ui.selectedInstanceIds;
		if (hit && !selected.includes(hit.id)) dispatch({
			type: "selectInstances",
			ids: [hit.id]
		});
		const instances = selected.map((id) => scene.instances.find((i) => i.id === id)).filter((i) => !!i);
		return [
			{
				id: "front",
				label: S.bringToFront,
				disabled: instances.length === 0,
				onSelect: () => dispatch({
					type: "setInstancesZOrder",
					ids: selected,
					mode: "front"
				})
			},
			{
				id: "back",
				label: S.sendToBack,
				disabled: instances.length === 0,
				onSelect: () => dispatch({
					type: "setInstancesZOrder",
					ids: selected,
					mode: "back"
				})
			},
			{
				id: "duplicate",
				label: S.duplicate,
				disabled: instances.length === 0,
				separatorBefore: true,
				onSelect: () => dispatch({
					type: "duplicateInstances",
					ids: selected
				})
			},
			{
				id: "copy",
				label: S.copy,
				disabled: instances.length === 0,
				onSelect: () => copyInstances(instances)
			},
			{
				id: "cut",
				label: S.cut,
				disabled: instances.length === 0,
				onSelect: () => {
					cutInstances(scene, selected);
					dispatch({
						type: "deleteInstances",
						ids: selected
					});
				}
			},
			{
				id: "paste",
				label: S.paste,
				disabled: !hasClipboard(),
				onSelect: () => {
					const { instances: next } = pasteInto(scene);
					if (next.length) dispatch({
						type: "addInstances",
						instances: next
					});
				}
			},
			{
				id: "hide",
				label: instances.every((i) => i.hiddenAtStart) ? S.show : S.hide,
				disabled: instances.length === 0,
				separatorBefore: true,
				onSelect: () => dispatch({
					type: "toggleInstancesVisibility",
					ids: selected
				})
			},
			{
				id: "lock",
				label: instances.every((i) => i.locked) ? S.unlock : S.lock,
				disabled: instances.length === 0,
				onSelect: () => dispatch({
					type: "toggleInstancesLock",
					ids: selected
				})
			},
			{
				id: "delete",
				label: S.delete,
				danger: true,
				disabled: instances.length === 0,
				separatorBefore: true,
				onSelect: () => dispatch({
					type: "deleteInstances",
					ids: selected
				})
			},
			{
				id: "objects",
				label: S.addANewObject,
				separatorBefore: true,
				onSelect: () => dispatch({
					type: "openDialog",
					dialog: { name: "newObject" }
				})
			}
		];
	};
	const fitWindow = () => dispatch({
		type: "ui",
		patch: {
			zoom: fitGameWindowZoom(size, windowSize, magnification),
			pan: {
				x: 0,
				y: 0
			}
		}
	});
	const cursor = drag?.kind === "move" ? "grabbing" : drag?.kind === "pan" ? "move" : hover && handleAt(hover) ? handleCursor(handleAt(hover)) : "default";
	return /* @__PURE__ */ jsxs("div", {
		className: "relative flex min-h-0 min-w-0 flex-1 flex-col bg-[#F5F5F7]",
		children: [
			/* @__PURE__ */ jsxs("div", {
				ref: wrapRef,
				className: "relative min-h-0 flex-1 overflow-hidden",
				onDragOver: (event) => {
					if (event.dataTransfer.types.includes("application/x-nexus-object") || event.dataTransfer.types.includes("application/x-nexus-resource")) {
						event.preventDefault();
						event.dataTransfer.dropEffect = "copy";
					}
				},
				onDrop,
				children: [/* @__PURE__ */ jsx("canvas", {
					ref: canvasRef,
					"aria-label": "Editor de escena 2D: un dedo interactúa; dos dedos desplazan y amplían",
					"data-touch-controls": "one-finger-interaction two-finger-pan pinch-zoom",
					style: {
						width: size.width,
						height: size.height,
						cursor
					},
					className: "absolute inset-0 block touch-none select-none",
					onPointerDown,
					onPointerMove,
					onPointerUp,
					onPointerCancel,
					onPointerLeave: (event) => {
						if (event.pointerType !== "touch") setHover(null);
					},
					onWheel,
					onDoubleClick,
					onContextMenu: (event) => open(event, contextMenuEntries(event))
				}), /* @__PURE__ */ jsx(SceneViewToolbar, { onFit: fitWindow })]
			}),
			/* @__PURE__ */ jsx(StatusBar, { onFitWindow: fitWindow }),
			menu
		]
	});
}
function StatusBar({ onFitWindow }) {
	const { ui, scene, project } = useEditor();
	const { width, height } = useMemo(() => {
		return {
			width: scene.useCustomWindowSize ? scene.customWindowWidth ?? project.gameSettings.windowWidth : project.gameSettings.windowWidth,
			height: scene.useCustomWindowSize ? scene.customWindowHeight ?? project.gameSettings.windowHeight : project.gameSettings.windowHeight
		};
	}, [scene, project.gameSettings]);
	return /* @__PURE__ */ jsxs("div", {
		className: "flex h-6 shrink-0 items-center gap-3 border-t border-separator bg-toolbar px-2 text-[11px] tabular-nums text-text-secondary",
		children: [
			/* @__PURE__ */ jsx("span", {
				className: "w-24",
				children: ui.cursorPosition ? `${ui.cursorPosition.x};${ui.cursorPosition.y}` : "—"
			}),
			/* @__PURE__ */ jsxs("span", {
				className: "hidden sm:inline",
				children: [
					"Ventana: ",
					width,
					"×",
					height
				]
			}),
			/* @__PURE__ */ jsx("button", {
				type: "button",
				onClick: onFitWindow,
				className: "rounded px-1 text-[#8AD6FF] hover:bg-elevated hover:text-foreground",
				title: "Encajar la ventana del juego",
				children: "Encajar"
			}),
			/* @__PURE__ */ jsxs("span", {
				className: "hidden lg:inline",
				children: [
					"Capa: ",
					scene.activeLayer,
					" · ",
					S.instances,
					": ",
					scene.instances.length
				]
			}),
			/* @__PURE__ */ jsx("span", {
				className: "hidden text-[10px] text-text-placeholder sm:inline md:hidden",
				children: "1 dedo: editar · 2: mover/zoom"
			}),
			/* @__PURE__ */ jsxs("span", {
				className: "ml-auto",
				children: [Math.round(ui.zoom * 100), "%"]
			}),
			/* @__PURE__ */ jsxs("span", {
				className: cn("hidden sm:inline", scene.grid.show ? "text-[#8AD6FF]" : ""),
				children: [
					scene.grid.width,
					"×",
					scene.grid.height
				]
			}),
			/* @__PURE__ */ jsx("span", {
				className: "hidden lg:inline",
				children: ui.showHiddenInstances ? "Ocultas visibles" : "Ocultas ocultas"
			})
		]
	});
}
function hitTest(objects, x, y) {
	let best;
	for (const object of objects) {
		if (object.hidden) continue;
		if (x >= object.x && x <= object.x + object.width && y >= object.y && y <= object.y + object.height) {
			if (!best || object.zOrder >= best.zOrder) best = object;
		}
	}
	return best;
}
function drawSelection(ctx, object, scale) {
	ctx.save();
	ctx.translate(object.x + object.width / 2, object.y + object.height / 2);
	if (object.angle) ctx.rotate(object.angle * Math.PI / 180);
	ctx.translate(-object.width / 2, -object.height / 2);
	ctx.strokeStyle = "#4AB0E4";
	ctx.lineWidth = 1 / scale;
	ctx.setLineDash([3 / scale, 2 / scale]);
	ctx.strokeRect(0, 0, object.width, object.height);
	ctx.setLineDash([]);
	ctx.beginPath();
	ctx.moveTo(object.width / 2, 0);
	ctx.lineTo(object.width / 2, -24 / scale);
	ctx.stroke();
	const handles = [
		{
			x: 0,
			y: 0
		},
		{
			x: object.width / 2,
			y: 0
		},
		{
			x: object.width,
			y: 0
		},
		{
			x: object.width,
			y: object.height / 2
		},
		{
			x: object.width,
			y: object.height
		},
		{
			x: object.width / 2,
			y: object.height
		},
		{
			x: 0,
			y: object.height
		},
		{
			x: 0,
			y: object.height / 2
		}
	];
	const size = HANDLE / scale;
	ctx.fillStyle = "#FFFFFF";
	ctx.strokeStyle = "#20202A";
	for (const handle of handles) {
		ctx.fillRect(handle.x - size / 2, handle.y - size / 2, size, size);
		ctx.strokeRect(handle.x - size / 2, handle.y - size / 2, size, size);
	}
	ctx.beginPath();
	ctx.arc(object.width / 2, -24 / scale, size * .7, 0, Math.PI * 2);
	ctx.fill();
	ctx.stroke();
	ctx.restore();
}
function positiveModulo(value, divisor) {
	return (value % divisor + divisor) % divisor;
}
function drawEditorBackdrop(ctx, size, view) {
	let worldStep = 64;
	while (worldStep * view.scale < 22) worldStep *= 2;
	while (worldStep * view.scale > 88) worldStep /= 2;
	const screenStep = Math.max(12, worldStep * view.scale);
	const startX = positiveModulo(view.offsetX, screenStep);
	const startY = positiveModulo(view.offsetY, screenStep);
	ctx.save();
	ctx.fillStyle = "rgba(158,180,255,0.16)";
	for (let x = startX; x <= size.width; x += screenStep) for (let y = startY; y <= size.height; y += screenStep) ctx.fillRect(Math.round(x) - .5, Math.round(y) - .5, 1.5, 1.5);
	ctx.restore();
}
function drawGrid(ctx, scene, windowSize) {
	if (!scene.grid.show) return;
	const { width: cellW, height: cellH, offsetX, offsetY, alpha, kind } = scene.grid;
	const color = scene.grid.color.startsWith("#") ? scene.grid.color : `rgb(${scene.grid.color.split(";").join(",")})`;
	ctx.save();
	ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
	ctx.strokeStyle = color;
	ctx.lineWidth = 1;
	ctx.beginPath();
	if (kind === "isometric") {
		const step = Math.max(4, cellW);
		for (let x = -windowSize.height - offsetX; x < windowSize.width + step; x += step) {
			ctx.moveTo(x, -offsetY);
			ctx.lineTo(x + windowSize.height, windowSize.height - offsetY);
			ctx.moveTo(x, -offsetY);
			ctx.lineTo(x - windowSize.height, windowSize.height - offsetY);
		}
	} else {
		for (let x = -offsetX; x <= windowSize.width; x += Math.max(2, cellW)) {
			ctx.moveTo(x, 0);
			ctx.lineTo(x, windowSize.height);
		}
		for (let y = -offsetY; y <= windowSize.height; y += Math.max(2, cellH)) {
			ctx.moveTo(0, y);
			ctx.lineTo(windowSize.width, y);
		}
	}
	ctx.stroke();
	ctx.restore();
}
function handleCursor(handle) {
	switch (handle) {
		case "n":
		case "s": return "ns-resize";
		case "e":
		case "w": return "ew-resize";
		case "ne":
		case "sw": return "nesw-resize";
		case "nw":
		case "se": return "nwse-resize";
		case "rotate": return "grab";
	}
}
function uniqueName(base, taken) {
	let candidate = `${base}2`;
	let index = 2;
	while (taken.includes(candidate)) {
		index += 1;
		candidate = `${base}${index}`;
	}
	return candidate;
}
//#endregion
//#region src/components/editor/gd/ExpressionField.tsx
var EXPRESSION_KINDS = [
	"number",
	"expression",
	"string",
	"behavior",
	"animation",
	"sound",
	"image",
	"varobj",
	"textObject",
	"layer",
	"scene",
	"key",
	"relation"
];
function ExpressionField({ value, onChange, kind = "string", choices, choiceLabels, placeholder, autoFocus, error }) {
	const canBeExpression = EXPRESSION_KINDS.includes(kind);
	const looksLikeExpression = /[()+*/"]|\b(Variable|Random|TimeDelta)\b/.test(value);
	const [expression, setExpression] = React.useState(canBeExpression && (kind !== "string" || looksLikeExpression));
	React.useEffect(() => {
		if (kind === "number") setExpression(true);
	}, [kind]);
	if (choices && choices.length > 0) return /* @__PURE__ */ jsx("select", {
		value,
		onChange: (event) => onChange(event.target.value),
		className: cn("h-7 min-w-0 flex-1 rounded border border-separator bg-transparent px-1 text-[12.5px] text-foreground outline-none hover:bg-[#1D1D26] focus:border-[var(--brand-light)]", error && "border-[#FE6C46]"),
		children: choices.map((choice) => /* @__PURE__ */ jsx("option", {
			value: choice,
			className: "bg-[#25252E]",
			children: choiceLabels?.[choice] ?? choice
		}, choice))
	});
	if (kind === "yesno") return /* @__PURE__ */ jsx("div", {
		className: "flex h-7 items-center gap-1",
		children: ["yes", "no"].map((option) => /* @__PURE__ */ jsx("button", {
			type: "button",
			onClick: () => onChange(option),
			className: cn("h-6 rounded px-2 text-[12px]", value === option ? "bg-[var(--brand)] text-[#F6F2FF]" : "text-text-secondary hover:bg-[#1D1D26]"),
			children: option === "yes" ? "Sí" : "No"
		}, option))
	});
	if (kind === "color") {
		const toHex = (raw) => {
			const [r = "0", g = "0", b = "0"] = raw.split(";");
			const n = (v) => Math.max(0, Math.min(255, Number(v) || 0));
			return `#${[
				n(r),
				n(g),
				n(b)
			].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
		};
		return /* @__PURE__ */ jsxs("span", {
			className: "flex min-w-0 flex-1 items-center gap-1",
			children: [/* @__PURE__ */ jsx("input", {
				value,
				onChange: (event) => onChange(event.target.value),
				placeholder: "255;255;255",
				className: cn("h-7 min-w-0 flex-1 rounded border border-separator bg-transparent px-1 text-[12.5px] tabular-nums text-foreground outline-none focus:border-[var(--brand-light)]", error && "border-[#FE6C46]")
			}), /* @__PURE__ */ jsx("input", {
				type: "color",
				value: toHex(value),
				onChange: (event) => {
					const clean = event.target.value.replace("#", "");
					onChange([
						0,
						2,
						4
					].map((i) => parseInt(clean.slice(i, i + 2), 16)).join(";"));
				},
				"aria-label": "Color",
				className: "h-7 w-9 shrink-0 cursor-pointer rounded border border-separator bg-[#1D1D26] p-0.5"
			})]
		});
	}
	return /* @__PURE__ */ jsxs("span", {
		className: "flex min-w-0 flex-1 items-stretch gap-1",
		children: [/* @__PURE__ */ jsx("input", {
			autoFocus,
			value,
			placeholder: placeholder ?? (expression ? "Expresión" : "Texto"),
			onChange: (event) => onChange(event.target.value),
			className: cn("h-7 min-w-0 flex-1 rounded border bg-[#1D1D26] px-1.5 font-mono text-[12.5px] text-foreground outline-none", expression ? "border-[#3E4452]" : "border-separator", "focus:border-[var(--brand-light)]", error && "border-[#FE6C46] bg-[rgba(254,108,70,0.15)]")
		}), canBeExpression ? /* @__PURE__ */ jsx("button", {
			type: "button",
			title: expression ? "Editar como texto" : "Editar como expresión",
			"aria-label": expression ? "Editar como texto" : "Editar como expresión",
			onClick: () => setExpression((e) => !e),
			className: cn("grid h-7 w-7 shrink-0 place-items-center rounded border border-separator text-text-secondary hover:bg-[#1D1D26] hover:text-foreground", expression && "border-[var(--brand)] text-[var(--brand-light)]"),
			children: expression ? /* @__PURE__ */ jsx(FunctionSquare, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ jsx(Type, { className: "h-3.5 w-3.5" })
		}) : null]
	});
}
//#endregion
//#region src/components/editor/gd/EffectsList.tsx
var asNumber$1 = (value, fallback = 0) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
};
function EffectsList({ api, compact, showAddButton = true }) {
	const [picking, setPicking] = React.useState(false);
	const [open, setOpen] = React.useState(api.effects.length === 1 ? 0 : null);
	return /* @__PURE__ */ jsxs("div", {
		className: cn(compact ? "" : "px-2"),
		children: [
			api.effects.length === 0 ? /* @__PURE__ */ jsx("p", {
				className: "px-2 py-2 text-[12.5px] text-text-secondary",
				children: "Sin efectos en este objeto."
			}) : null,
			api.effects.map((effect, index) => {
				const definition = effectByTypeId(effect.type);
				const disabled = effect.parameters["disabled"] === "yes";
				const expanded = open === index;
				return /* @__PURE__ */ jsxs("div", {
					className: "my-1 overflow-hidden rounded border border-[#32323B] bg-[#25252E]",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-1 px-2 py-1.5",
						children: [
							/* @__PURE__ */ jsx("button", {
								type: "button",
								"aria-label": expanded ? "Contraer" : "Expandir",
								onClick: () => setOpen(expanded ? null : index),
								className: "grid h-5 w-5 place-items-center rounded text-text-secondary hover:bg-[#32323B] hover:text-foreground",
								children: expanded ? /* @__PURE__ */ jsx(ChevronDown, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ jsx(ChevronUp, { className: "h-3.5 w-3.5" })
							}),
							/* @__PURE__ */ jsx(EffectGlyph, { type: effect.type }),
							/* @__PURE__ */ jsx("span", {
								className: cn("min-w-0 flex-1 truncate text-[13px]", disabled && "line-through opacity-60"),
								children: effect.name || definition?.name || effect.type
							}),
							/* @__PURE__ */ jsx("button", {
								type: "button",
								"aria-label": disabled ? S.enable : S.disable,
								title: disabled ? S.enable : S.disable,
								onClick: () => api.update(index, { parameters: {
									...effect.parameters,
									disabled: disabled ? "no" : "yes"
								} }),
								className: cn("h-6 rounded px-1.5 text-[11px]", disabled ? "text-[#FFBC57] hover:bg-[#32323B]" : "text-[#0ECD7A] hover:bg-[#32323B]"),
								children: disabled ? S.enable : S.visible
							}),
							/* @__PURE__ */ jsx("button", {
								type: "button",
								"aria-label": "Subir",
								onClick: () => api.move(index, -1),
								className: "grid h-6 w-6 place-items-center rounded text-text-secondary hover:bg-[#32323B] hover:text-foreground",
								children: /* @__PURE__ */ jsx(ChevronUp, { className: "h-3.5 w-3.5" })
							}),
							/* @__PURE__ */ jsx("button", {
								type: "button",
								"aria-label": "Bajar",
								onClick: () => api.move(index, 1),
								className: "grid h-6 w-6 place-items-center rounded text-text-secondary hover:bg-[#32323B] hover:text-foreground",
								children: /* @__PURE__ */ jsx(ChevronDown, { className: "h-3.5 w-3.5" })
							}),
							/* @__PURE__ */ jsx("button", {
								type: "button",
								"aria-label": S.delete,
								onClick: () => api.remove(index),
								className: "grid h-6 w-6 place-items-center rounded text-text-secondary hover:bg-[#32323B] hover:text-destructive",
								children: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" })
							})
						]
					}), expanded ? /* @__PURE__ */ jsx("div", {
						className: "border-t border-[#32323B] px-2 py-1.5",
						children: definition && definition.parameters.length > 0 ? definition.parameters.map((parameter) => {
							const value = effect.parameters[parameter.key] ?? parameter.value;
							const isNumeric = /^[-\d.]*\d$/.test(String(value).trim());
							return /* @__PURE__ */ jsxs("label", {
								className: "flex items-center gap-2 py-1",
								children: [
									/* @__PURE__ */ jsx("span", {
										className: "w-40 shrink-0 truncate text-[12px] text-text-secondary",
										title: parameter.label,
										children: parameter.label
									}),
									/* @__PURE__ */ jsx(ExpressionField, {
										value: String(value),
										kind: isNumeric ? "number" : "string",
										onChange: (next) => api.update(index, { parameters: {
											...effect.parameters,
											[parameter.key]: next
										} })
									}),
									isNumeric ? /* @__PURE__ */ jsx("input", {
										type: "range",
										min: 0,
										max: 255,
										value: asNumber$1(String(value), 0),
										onChange: (event) => api.update(index, { parameters: {
											...effect.parameters,
											[parameter.key]: event.target.value
										} }),
										className: "h-1 w-24 shrink-0 accent-[var(--brand)]",
										"aria-label": `${parameter.label} (slider)`
									}) : null,
									/* @__PURE__ */ jsx("button", {
										type: "button",
										title: "Restablecer",
										"aria-label": "Restablecer",
										onClick: () => api.update(index, { parameters: {
											...effect.parameters,
											[parameter.key]: parameter.value
										} }),
										className: "grid h-6 w-6 shrink-0 place-items-center rounded text-text-secondary hover:bg-[#32323B] hover:text-foreground",
										children: /* @__PURE__ */ jsx(RotateCcw, { className: "h-3 w-3" })
									})
								]
							}, parameter.key);
						}) : /* @__PURE__ */ jsx("p", {
							className: "py-1 text-[12px] text-text-placeholder",
							children: "Este efecto no tiene parámetros configurables."
						})
					}) : null]
				}, `${effect.type}-${index}`);
			}),
			showAddButton ? /* @__PURE__ */ jsx(GdButton, {
				variant: "raised",
				className: "my-2 w-full",
				icon: /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
				onClick: () => setPicking(true),
				children: S.addEffects
			}) : null,
			/* @__PURE__ */ jsx(EffectPickerDialog, {
				open: picking,
				onClose: () => setPicking(false),
				api
			})
		]
	});
}
function EffectGlyph({ type }) {
	const definition = effectByTypeId(type);
	return /* @__PURE__ */ jsx("span", {
		title: definition?.supported === false ? S.unsupportedEffect : void 0,
		className: cn("h-3.5 w-3.5 shrink-0 rounded-sm", definition && !definition.supported ? "bg-[#FE6C46]" : "bg-[#A483FF]"),
		"aria-hidden": true
	});
}
function EffectPickerDialog({ open, onClose, api }) {
	const [query, setQuery] = React.useState("");
	const [selected, setSelected] = React.useState(null);
	const filtered = EFFECTS.filter((effect) => !query || effect.name.toLowerCase().includes(query.toLowerCase()) || effect.typeId.toLowerCase().includes(query.toLowerCase()));
	const current = filtered.find((effect) => effect.typeId === selected) ?? null;
	return /* @__PURE__ */ jsx(GdDialog, {
		open,
		onClose,
		title: S.addEffects,
		width: "max-w-2xl",
		footer: /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(GdButton, {
			onClick: onClose,
			children: S.cancel
		}), /* @__PURE__ */ jsx(GdButton, {
			variant: "raised",
			primary: true,
			disabled: !current,
			onClick: () => {
				if (!current) return;
				const parameters = {};
				for (const parameter of current.parameters) parameters[parameter.key] = parameter.value;
				api.add({
					type: current.typeId,
					name: current.name,
					parameters
				});
				setSelected(null);
				setQuery("");
				onClose();
			},
			children: S.add
		})] }),
		children: /* @__PURE__ */ jsxs("div", {
			className: "grid gap-0 md:grid-cols-[minmax(0,1fr)_240px]",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "border-b border-separator p-2 md:border-b-0 md:border-r",
				children: [/* @__PURE__ */ jsx("input", {
					autoFocus: true,
					value: query,
					onChange: (event) => setQuery(event.target.value),
					placeholder: S.searchExtensions,
					className: "mb-2 h-8 w-full rounded bg-[#1D1D26] px-2 text-[12.5px] outline-none"
				}), /* @__PURE__ */ jsx("div", {
					className: "max-h-[45vh] overflow-y-auto",
					children: filtered.map((effect) => /* @__PURE__ */ jsxs("button", {
						type: "button",
						onClick: () => setSelected(effect.typeId),
						className: cn("flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12.5px] hover:bg-list-hover", selected === effect.typeId && "bg-selection"),
						children: [
							/* @__PURE__ */ jsx(EffectGlyph, { type: effect.typeId }),
							/* @__PURE__ */ jsx("span", {
								className: "min-w-0 flex-1 truncate",
								children: effect.name
							}),
							!effect.supported ? /* @__PURE__ */ jsx("span", {
								title: S.unsupportedEffect,
								className: "shrink-0 rounded bg-[rgba(254,108,70,0.4)] px-1 text-[10px] text-[#FFB4A2]",
								children: "alpha"
							}) : null
						]
					}, effect.typeId))
				})]
			}), /* @__PURE__ */ jsx("div", {
				className: "p-3",
				children: current ? /* @__PURE__ */ jsxs(Fragment, { children: [
					/* @__PURE__ */ jsx("h3", {
						className: "text-[13px] font-semibold",
						children: current.name
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-1 text-[11px] text-text-secondary",
						children: current.typeId
					}),
					/* @__PURE__ */ jsx("p", {
						className: "mt-2 text-[12px] leading-snug text-muted-foreground",
						children: current.description
					}),
					/* @__PURE__ */ jsxs("p", {
						className: "mt-3 text-[11px] text-text-secondary",
						children: [current.parameters.length, " parámetro(s)"]
					})
				] }) : /* @__PURE__ */ jsx("p", {
					className: "text-[12px] text-text-placeholder",
					children: "Selecciona un efecto de la lista para ver su descripción."
				})
			})]
		})
	});
}
//#endregion
//#region src/components/editor/gd/VariablesEditor.tsx
var TYPES = [
	"number",
	"string",
	"boolean",
	"structure",
	"array"
];
var VARIABLE_LABEL = {
	number: "Número",
	string: "Cadena",
	boolean: "Booleano",
	structure: "Estructura",
	array: "Array"
};
function TypeIcon({ type }) {
	const className = "h-3.5 w-3.5 shrink-0";
	switch (type) {
		case "number": return /* @__PURE__ */ jsx(Hash, { className: cn(className, "text-[#0ECD7A]") });
		case "string": return /* @__PURE__ */ jsx(TextQuote, { className: cn(className, "text-[#E0D01F]") });
		case "boolean": return /* @__PURE__ */ jsx(ToggleRight, { className: cn(className, "text-[#A483FF]") });
		case "structure": return /* @__PURE__ */ jsx(Braces, { className: cn(className, "text-[#8AD6FF]") });
		case "array": return /* @__PURE__ */ jsx(ListTree, { className: cn(className, "text-[#FF85ED]") });
	}
}
function VariablesEditor({ api, emptyLabel, className }) {
	const [expanded, setExpanded] = React.useState({});
	const renderRows = (list, path) => list.map((variable) => {
		const rowPath = [...path, variable.name];
		const key = rowPath.join(".");
		const isOpen = expanded[key] ?? variable.children.length > 0;
		const isContainer = variable.type === "structure" || variable.type === "array";
		return /* @__PURE__ */ jsxs(React.Fragment, { children: [/* @__PURE__ */ jsxs("div", {
			className: "flex items-center gap-1 py-[3px] pr-2 text-[12.5px]",
			style: { paddingLeft: 6 + path.length * 14 },
			children: [
				isContainer ? /* @__PURE__ */ jsx("button", {
					type: "button",
					"aria-label": isOpen ? "Contraer" : "Expandir",
					"aria-expanded": isOpen,
					onClick: () => setExpanded((state) => ({
						...state,
						[key]: !isOpen
					})),
					className: "grid h-5 w-5 shrink-0 place-items-center rounded text-text-secondary hover:bg-list-hover hover:text-foreground",
					children: /* @__PURE__ */ jsx("span", {
						className: "text-[10px]",
						children: isOpen ? "▾" : "▸"
					})
				}) : /* @__PURE__ */ jsx("span", { className: "h-5 w-5 shrink-0" }),
				/* @__PURE__ */ jsx(TypeIcon, { type: variable.type }),
				/* @__PURE__ */ jsx("input", {
					value: variable.name,
					"aria-label": S.name,
					onChange: (event) => api.update(rowPath, { name: event.target.value }),
					className: "h-6 w-28 shrink-0 rounded border border-transparent bg-transparent px-1 text-[12.5px] text-foreground outline-none hover:border-separator focus:border-[var(--brand-light)] focus:bg-[#1D1D26]"
				}),
				/* @__PURE__ */ jsx("select", {
					value: variable.type,
					"aria-label": S.type,
					onChange: (event) => api.update(rowPath, { type: event.target.value }),
					className: "h-6 w-24 shrink-0 rounded border border-separator bg-transparent px-1 text-[11.5px] text-text-secondary outline-none focus:border-[var(--brand-light)]",
					children: TYPES.map((type) => /* @__PURE__ */ jsx("option", {
						value: type,
						className: "bg-[#25252E]",
						children: VARIABLE_LABEL[type]
					}, type))
				}),
				variable.type === "boolean" ? /* @__PURE__ */ jsxs("button", {
					type: "button",
					"aria-label": S.value,
					onClick: () => api.update(rowPath, { value: variable.value === "true" ? "false" : "true" }),
					className: "flex h-6 items-center gap-1 rounded px-1 text-[12px] text-foreground hover:bg-list-hover",
					children: [variable.value === "true" ? /* @__PURE__ */ jsx(ToggleRight, { className: "h-4 w-4 text-[#0ECD7A]" }) : /* @__PURE__ */ jsx(ToggleLeft, { className: "h-4 w-4 text-text-secondary" }), variable.value === "true" ? S.yes : S.no]
				}) : isContainer ? /* @__PURE__ */ jsxs("span", {
					className: "text-[11px] text-text-placeholder",
					children: [variable.children.length, " elemento(s)"]
				}) : /* @__PURE__ */ jsx("input", {
					value: variable.value,
					"aria-label": S.value,
					type: variable.type === "number" ? "number" : "text",
					onChange: (event) => api.update(rowPath, { value: event.target.value }),
					className: "h-6 min-w-0 flex-1 rounded border border-separator bg-[#1D1D26] px-1 text-[12.5px] tabular-nums text-foreground outline-none focus:border-[var(--brand-light)]"
				}),
				isContainer ? /* @__PURE__ */ jsx("button", {
					type: "button",
					"aria-label": S.addVariables,
					title: S.addVariables,
					onClick: () => api.add(rowPath),
					className: "grid h-6 w-6 shrink-0 place-items-center rounded text-text-secondary hover:bg-list-hover hover:text-foreground",
					children: /* @__PURE__ */ jsx(Plus, { className: "h-3.5 w-3.5" })
				}) : null,
				/* @__PURE__ */ jsx("button", {
					type: "button",
					"aria-label": `${S.delete}: ${variable.name}`,
					onClick: () => api.remove(rowPath),
					className: "grid h-6 w-6 shrink-0 place-items-center rounded text-text-secondary hover:bg-list-hover hover:text-destructive",
					children: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" })
				})
			]
		}), isContainer && isOpen ? renderRows(variable.children, rowPath) : null] }, key);
	});
	return /* @__PURE__ */ jsxs("div", {
		className: cn("pb-1", className),
		children: [api.variables.length === 0 ? /* @__PURE__ */ jsx("p", {
			className: "px-3 py-1.5 text-[12.5px] text-text-secondary",
			children: emptyLabel ?? S.addYourFirstVariable
		}) : renderRows(api.variables, []), /* @__PURE__ */ jsx("div", {
			className: "px-2 py-1",
			children: /* @__PURE__ */ jsx(GdButton, {
				variant: "raised",
				primary: true,
				size: "small",
				icon: /* @__PURE__ */ jsx(Plus, { className: "h-3.5 w-3.5" }),
				onClick: () => api.add([]),
				children: S.addVariables
			})
		})]
	});
}
//#endregion
//#region src/components/editor/PropertiesPanel.tsx
function PropertiesPanel() {
	const { scene, ui, dispatch } = useEditor();
	const selectedInstance = ui.selectedInstanceIds.length === 1 ? scene.instances.find((i) => i.id === ui.selectedInstanceIds[0]) : void 0;
	const selectedObject = ui.selectedObjectIds.length === 1 ? scene.objects.find((o) => o.id === ui.selectedObjectIds[0]) : void 0;
	const selectedLayer = ui.selectedLayerName ? scene.layers.find((l) => l.name === ui.selectedLayerName) : void 0;
	const objectOfInstance = selectedInstance ? scene.objects.find((o) => o.id === selectedInstance.objectId) : void 0;
	const title = selectedInstance ? S.instanceProperties : selectedObject ? `${S.properties}: ${selectedObject.name}` : selectedLayer ? `${S.layer}: ${selectedLayer.name}` : S.sceneProperties;
	return /* @__PURE__ */ jsx(Panel, {
		title,
		className: "min-h-0 flex-1 border-l border-separator",
		bodyClassName: "pb-3",
		children: selectedInstance && objectOfInstance ? /* @__PURE__ */ jsx(InstanceProperties, {
			instanceId: selectedInstance.id,
			objectId: objectOfInstance.id,
			count: ui.selectedInstanceIds.length
		}) : selectedObject ? /* @__PURE__ */ jsx(ObjectProperties, { objectId: selectedObject.id }) : selectedLayer ? /* @__PURE__ */ jsx(LayerProperties, { name: selectedLayer.name }) : /* @__PURE__ */ jsx(SceneQuickProperties, {})
	});
}
function InstanceProperties({ instanceId, objectId, count }) {
	const { scene, dispatch } = useEditor();
	const instance = scene.instances.find((i) => i.id === instanceId);
	const object = scene.objects.find((o) => o.id === objectId);
	if (!instance || !object) return null;
	const patch = (next) => dispatch({
		type: "updateInstance",
		id: instanceId,
		patch: next
	});
	const instanceLocation = {
		scope: "instance",
		objectId: instanceId
	};
	const variablesApi = {
		variables: instance.variables,
		add: (path) => path.length === 0 ? dispatch({
			type: "addVariable",
			location: instanceLocation
		}) : dispatch({
			type: "addVariableChild",
			location: instanceLocation,
			path
		}),
		update: (path, patch) => dispatch({
			type: "updateVariable",
			location: instanceLocation,
			path,
			patch
		}),
		remove: (path) => dispatch({
			type: "deleteVariable",
			location: instanceLocation,
			path
		})
	};
	const effectsApi = {
		effects: instance.effects,
		add: (effect) => dispatch({
			type: "addEffect",
			target: {
				kind: "instance",
				id: instanceId
			},
			effect
		}),
		update: (index, next) => dispatch({
			type: "updateEffect",
			target: {
				kind: "instance",
				id: instanceId
			},
			index,
			patch: next
		}),
		remove: (index) => dispatch({
			type: "deleteEffect",
			target: {
				kind: "instance",
				id: instanceId
			},
			index
		}),
		move: (index, direction) => dispatch({
			type: "moveEffect",
			target: {
				kind: "instance",
				id: instanceId
			},
			index,
			direction
		})
	};
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsxs(PropertySection, {
			title: S.position,
			children: [/* @__PURE__ */ jsx(FieldRow, {
				label: "X",
				children: /* @__PURE__ */ jsx(NumberField, {
					value: instance.x,
					onChange: (x) => patch({ x: Math.round(x) })
				})
			}), /* @__PURE__ */ jsx(FieldRow, {
				label: "Y",
				children: /* @__PURE__ */ jsx(NumberField, {
					value: instance.y,
					onChange: (y) => patch({ y: Math.round(y) })
				})
			})]
		}),
		/* @__PURE__ */ jsxs(PropertySection, {
			title: S.size,
			children: [/* @__PURE__ */ jsx(FieldRow, {
				label: S.customSize,
				children: /* @__PURE__ */ jsx(ToggleField, {
					checked: instance.customSize,
					label: S.customSize,
					onChange: (customSize) => patch({ customSize })
				})
			}), instance.customSize ? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(FieldRow, {
				label: "Ancho",
				children: /* @__PURE__ */ jsx(NumberField, {
					value: instance.width,
					onChange: (width) => patch({ width: Math.max(1, Math.round(width)) })
				})
			}), /* @__PURE__ */ jsx(FieldRow, {
				label: "Alto",
				children: /* @__PURE__ */ jsx(NumberField, {
					value: instance.height,
					onChange: (height) => patch({ height: Math.max(1, Math.round(height)) })
				})
			})] }) : /* @__PURE__ */ jsxs("p", {
				className: "px-3 py-1 text-[12px] text-text-placeholder",
				children: [
					"Tamaño original del recurso (deshaz «",
					S.customSize,
					"» para cambiarlo)."
				]
			})]
		}),
		/* @__PURE__ */ jsxs(PropertySection, {
			title: S.angle,
			children: [/* @__PURE__ */ jsx(FieldRow, {
				label: S.angle,
				children: /* @__PURE__ */ jsx(NumberField, {
					value: instance.angle,
					onChange: (angle) => patch({ angle })
				})
			}), /* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-1 px-3 pb-1",
				children: [[
					0,
					90,
					180,
					270
				].map((angle) => /* @__PURE__ */ jsxs("button", {
					type: "button",
					onClick: () => patch({ angle }),
					className: "h-6 rounded border border-separator px-1.5 text-[11px] text-text-secondary hover:bg-list-hover hover:text-foreground",
					children: [angle, "°"]
				}, angle)), /* @__PURE__ */ jsx("button", {
					type: "button",
					"aria-label": "Restablecer ángulo",
					onClick: () => patch({ angle: 0 }),
					className: "grid h-6 w-6 place-items-center rounded border border-separator text-text-secondary hover:bg-list-hover hover:text-foreground",
					children: /* @__PURE__ */ jsx(RotateCcw, { className: "h-3 w-3" })
				})]
			})]
		}),
		/* @__PURE__ */ jsxs(PropertySection, {
			title: `${S.zOrder} / ${S.layer}`,
			children: [/* @__PURE__ */ jsx(FieldRow, {
				label: S.zOrder,
				children: /* @__PURE__ */ jsx(NumberField, {
					value: instance.zOrder,
					onChange: (zOrder) => patch({ zOrder: Math.round(zOrder) })
				})
			}), /* @__PURE__ */ jsx(FieldRow, {
				label: S.layer,
				children: /* @__PURE__ */ jsx(ChoiceField, {
					value: instance.layer,
					options: scene.layers.map((l) => l.name),
					onChange: (layer) => patch({ layer })
				})
			})]
		}),
		/* @__PURE__ */ jsxs(PropertySection, {
			title: `${S.opacity} / ${S.hidden}`,
			children: [
				/* @__PURE__ */ jsxs(FieldRow, {
					label: S.opacity,
					children: [/* @__PURE__ */ jsx("input", {
						type: "range",
						min: 0,
						max: 255,
						value: 255,
						disabled: true,
						className: "h-1 min-w-0 flex-1 accent-[var(--brand)]",
						"aria-label": S.opacity
					}), /* @__PURE__ */ jsx("span", {
						className: "w-8 shrink-0 text-right text-[12px] tabular-nums text-text-secondary",
						children: "255"
					})]
				}),
				/* @__PURE__ */ jsx(FieldRow, {
					label: S.hiddenWhenSceneStarts,
					children: /* @__PURE__ */ jsx(ToggleField, {
						checked: instance.hiddenAtStart,
						label: S.hiddenWhenSceneStarts,
						onChange: (hiddenAtStart) => patch({ hiddenAtStart })
					})
				}),
				/* @__PURE__ */ jsx(FieldRow, {
					label: S.locked,
					children: /* @__PURE__ */ jsx(ToggleField, {
						checked: instance.locked,
						label: S.locked,
						onChange: (locked) => patch({ locked })
					})
				})
			]
		}),
		count > 1 ? /* @__PURE__ */ jsxs("p", {
			className: "px-3 py-2 text-[12px] text-text-secondary",
			children: [count, " instancias seleccionadas — las propiedades de arriba pertenecen a la instancia activa."]
		}) : null,
		/* @__PURE__ */ jsx(BehaviorSection, { objectId }),
		/* @__PURE__ */ jsx(PropertySection, {
			title: `${S.effects} (${instance.effects.length})`,
			children: /* @__PURE__ */ jsx(EffectsList, {
				api: effectsApi,
				compact: true
			})
		}),
		/* @__PURE__ */ jsx(PropertySection, {
			title: S.instanceVariables,
			children: /* @__PURE__ */ jsx(VariablesEditor, {
				api: variablesApi,
				emptyLabel: S.addYourFirstInstanceVariable
			})
		})
	] });
}
function ObjectProperties({ objectId }) {
	const { scene, dispatch, project } = useEditor();
	const object = scene.objects.find((o) => o.id === objectId);
	if (!object) return null;
	const objectLocation = {
		scope: "object",
		objectId
	};
	const variablesApi = {
		variables: object.variables,
		add: (path) => path.length === 0 ? dispatch({
			type: "addVariable",
			location: objectLocation
		}) : dispatch({
			type: "addVariableChild",
			location: objectLocation,
			path
		}),
		update: (path, patch) => dispatch({
			type: "updateVariable",
			location: objectLocation,
			path,
			patch
		}),
		remove: (path) => dispatch({
			type: "deleteVariable",
			location: objectLocation,
			path
		})
	};
	const effectsApi = {
		effects: object.effects,
		add: (effect) => dispatch({
			type: "addEffect",
			target: {
				kind: "object",
				id: objectId
			},
			effect
		}),
		update: (index, patch) => dispatch({
			type: "updateEffect",
			target: {
				kind: "object",
				id: objectId
			},
			index,
			patch
		}),
		remove: (index) => dispatch({
			type: "deleteEffect",
			target: {
				kind: "object",
				id: objectId
			},
			index
		}),
		move: (index, direction) => dispatch({
			type: "moveEffect",
			target: {
				kind: "object",
				id: objectId
			},
			index,
			direction
		})
	};
	const instances = scene.instances.filter((i) => i.objectId === object.id);
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsxs("div", {
			className: "flex items-center gap-2 px-3 py-2",
			children: [(() => {
				const image = resolveAsset(object.animations?.[0]?.images?.[0]?.image ?? object.asset, project.resources);
				return image ? /* @__PURE__ */ jsx("img", {
					src: image,
					alt: "",
					className: "h-8 w-8 shrink-0 rounded bg-[#1D1D26] object-contain p-0.5 [image-rendering:pixelated]"
				}) : /* @__PURE__ */ jsx(CatalogIcon, {
					name: iconForObjectType(object.type),
					className: "h-7 w-7 shrink-0 text-[#C9B6FC]"
				});
			})(), /* @__PURE__ */ jsxs("div", {
				className: "min-w-0 flex-1",
				children: [/* @__PURE__ */ jsx("div", {
					className: "truncate text-[13px] font-semibold",
					children: object.name
				}), /* @__PURE__ */ jsxs("div", {
					className: "truncate text-[11px] text-text-secondary",
					children: [
						objectTypeLabel(object.type),
						" · ",
						instances.length,
						" instancia(s)"
					]
				})]
			})]
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "grid grid-cols-2 gap-1 px-2 pb-1",
			children: [/* @__PURE__ */ jsx(GdButton, {
				variant: "raised",
				primary: true,
				size: "small",
				icon: /* @__PURE__ */ jsx(Pencil, { className: "h-3.5 w-3.5" }),
				onClick: () => dispatch({
					type: "openDialog",
					dialog: {
						name: "objectEditor",
						objectId
					}
				}),
				children: S.editObject
			}), /* @__PURE__ */ jsx(GdButton, {
				variant: "raised",
				size: "small",
				icon: /* @__PURE__ */ jsx(Settings2, { className: "h-3.5 w-3.5" }),
				onClick: () => dispatch({
					type: "openDialog",
					dialog: {
						name: "behaviors",
						objectId
					}
				}),
				children: S.behaviors
			})]
		}),
		/* @__PURE__ */ jsxs(PropertySection, {
			title: `${S.behaviors} (${object.behaviors.length})`,
			children: [
				object.behaviors.length === 0 ? /* @__PURE__ */ jsx("p", {
					className: "px-3 py-1 text-[12.5px] text-text-secondary",
					children: S.addYourFirstBehavior
				}) : null,
				object.behaviors.map((behavior) => {
					const definition = behaviorByTypeId(behavior.type);
					return /* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2 px-3 py-1 text-[12.5px]",
						children: [
							/* @__PURE__ */ jsx(CatalogIcon, {
								name: BEHAVIOR_ICON[behavior.type] ?? "puzzle",
								className: "h-4 w-4 shrink-0 text-[#8AD6FF]"
							}),
							/* @__PURE__ */ jsx("span", {
								className: "min-w-0 flex-1 truncate",
								children: behavior.name
							}),
							/* @__PURE__ */ jsx("span", {
								className: "shrink-0 text-[10px] text-text-secondary",
								children: definition?.name ?? behaviorShortName(behavior.type)
							})
						]
					}, behavior.name);
				}),
				/* @__PURE__ */ jsx("div", {
					className: "px-3 pb-1",
					children: /* @__PURE__ */ jsx(GdButton, {
						variant: "raised",
						size: "small",
						icon: /* @__PURE__ */ jsx(Plus, { className: "h-3.5 w-3.5" }),
						onClick: () => dispatch({
							type: "openDialog",
							dialog: {
								name: "behaviors",
								objectId
							}
						}),
						children: S.addABehavior
					})
				})
			]
		}),
		/* @__PURE__ */ jsx(PropertySection, {
			title: `${S.effects} (${object.effects.length})`,
			children: /* @__PURE__ */ jsx(EffectsList, {
				api: effectsApi,
				compact: true
			})
		}),
		/* @__PURE__ */ jsx(PropertySection, {
			title: `${S.variables} (${object.variables.length})`,
			children: /* @__PURE__ */ jsx(VariablesEditor, { api: variablesApi })
		})
	] });
}
function BehaviorSection({ objectId }) {
	const { scene, dispatch } = useEditor();
	const object = scene.objects.find((o) => o.id === objectId);
	if (!object) return null;
	return /* @__PURE__ */ jsxs(PropertySection, {
		title: `${S.behaviors} (${object.behaviors.length})`,
		children: [object.behaviors.length === 0 ? /* @__PURE__ */ jsx("p", {
			className: "px-3 py-1 text-[12.5px] text-text-secondary",
			children: S.addYourFirstBehavior
		}) : null, object.behaviors.map((behavior) => {
			const definition = BEHAVIORS.find((b) => b.typeId === behavior.type);
			return /* @__PURE__ */ jsxs("div", {
				className: "px-3 py-1",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-2 text-[12.5px]",
					children: [
						/* @__PURE__ */ jsx(CatalogIcon, {
							name: BEHAVIOR_ICON[behavior.type] ?? "puzzle",
							className: "h-4 w-4 shrink-0 text-[#8AD6FF]"
						}),
						/* @__PURE__ */ jsx("span", {
							className: "min-w-0 flex-1 truncate",
							children: behavior.name
						}),
						/* @__PURE__ */ jsx("button", {
							type: "button",
							"aria-label": S.editBehaviors,
							onClick: () => dispatch({
								type: "openDialog",
								dialog: {
									name: "behaviors",
									objectId
								}
							}),
							className: "shrink-0 text-text-secondary hover:text-foreground",
							children: /* @__PURE__ */ jsx(Pencil, { className: "h-3.5 w-3.5" })
						}),
						/* @__PURE__ */ jsx("button", {
							type: "button",
							"aria-label": S.delete,
							onClick: () => dispatch({
								type: "deleteBehavior",
								objectId,
								behaviorName: behavior.name
							}),
							className: "shrink-0 text-text-secondary hover:text-destructive",
							children: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" })
						})
					]
				}), definition ? definition.properties.filter((property) => property.type !== "yesno").slice(0, 6).map((property) => /* @__PURE__ */ jsx(FieldRow, {
					label: property.label,
					children: /* @__PURE__ */ jsx(ExpressionLikeField, {
						value: behavior.properties[property.key] ?? property.value,
						numeric: property.type === "number",
						onChange: (value) => dispatch({
							type: "updateBehavior",
							objectId,
							behaviorName: behavior.name,
							patch: { properties: {
								...behavior.properties,
								[property.key]: value
							} }
						})
					})
				}, property.key)) : null]
			}, behavior.name);
		})]
	});
}
function ExpressionLikeField({ value, numeric, onChange }) {
	return /* @__PURE__ */ jsx("input", {
		value,
		onChange: (event) => onChange(event.target.value),
		className: cn("h-7 min-w-0 flex-1 rounded border border-separator bg-[#1D1D26] px-1.5 text-[12.5px] text-foreground outline-none focus:border-[var(--brand-light)]", numeric && "tabular-nums")
	});
}
function LayerProperties({ name }) {
	const { scene, dispatch } = useEditor();
	const layer = scene.layers.find((l) => l.name === name);
	if (!layer) return null;
	const isBase = layer.name === BASE_LAYER_NAME;
	const effectsApi = {
		effects: layer.effects,
		add: (effect) => dispatch({
			type: "addEffect",
			target: {
				kind: "layer",
				name
			},
			effect
		}),
		update: (index, patch) => dispatch({
			type: "updateEffect",
			target: {
				kind: "layer",
				name
			},
			index,
			patch
		}),
		remove: (index) => dispatch({
			type: "deleteEffect",
			target: {
				kind: "layer",
				name
			},
			index
		}),
		move: (index, direction) => dispatch({
			type: "moveEffect",
			target: {
				kind: "layer",
				name
			},
			index,
			direction
		})
	};
	const instances = scene.instances.filter((i) => i.layer === layer.name);
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsxs("div", {
			className: "flex items-center gap-2 px-3 py-2",
			children: [/* @__PURE__ */ jsx(SquareStack, { className: "h-5 w-5 shrink-0 text-[#C9B6FC]" }), /* @__PURE__ */ jsxs("div", {
				className: "min-w-0 flex-1",
				children: [/* @__PURE__ */ jsx("div", {
					className: "truncate text-[13px] font-semibold",
					children: layer.name
				}), /* @__PURE__ */ jsxs("div", {
					className: "text-[11px] text-text-secondary",
					children: [
						instances.length,
						" instancia(s)",
						isBase ? " · capa base" : ""
					]
				})]
			})]
		}),
		/* @__PURE__ */ jsxs(PropertySection, {
			title: `${S.position} (cámara)`,
			children: [/* @__PURE__ */ jsx(FieldRow, {
				label: "X",
				children: /* @__PURE__ */ jsx(NumberField, {
					value: layer.camera.x,
					onChange: (x) => dispatch({
						type: "updateLayer",
						name,
						patch: { camera: {
							...layer.camera,
							x
						} }
					})
				})
			}), /* @__PURE__ */ jsx(FieldRow, {
				label: "Y",
				children: /* @__PURE__ */ jsx(NumberField, {
					value: layer.camera.y,
					onChange: (y) => dispatch({
						type: "updateLayer",
						name,
						patch: { camera: {
							...layer.camera,
							y
						} }
					})
				})
			})]
		}),
		/* @__PURE__ */ jsxs(PropertySection, {
			title: S.properties,
			children: [
				/* @__PURE__ */ jsx(FieldRow, {
					label: S.visible,
					children: /* @__PURE__ */ jsx(ToggleField, {
						checked: layer.visible,
						label: S.visible,
						onChange: (visible) => dispatch({
							type: "updateLayer",
							name,
							patch: { visible }
						})
					})
				}),
				/* @__PURE__ */ jsx(FieldRow, {
					label: S.locked,
					children: /* @__PURE__ */ jsx(ToggleField, {
						checked: !!layer.locked,
						label: S.locked,
						onChange: (locked) => dispatch({
							type: "updateLayer",
							name,
							patch: { locked }
						})
					})
				}),
				!isBase ? /* @__PURE__ */ jsx(FieldRow, {
					label: "Usar la cámara de la capa base",
					children: /* @__PURE__ */ jsx(ToggleField, {
						checked: layer.followBaseLayer !== false,
						label: "followBaseLayer",
						onChange: (followBaseLayer) => dispatch({
							type: "updateLayer",
							name,
							patch: { followBaseLayer }
						})
					})
				}) : null,
				layer.isLightingLayer ? /* @__PURE__ */ jsx(FieldRow, {
					label: "Luz ambiental",
					children: /* @__PURE__ */ jsx(ColorField, {
						value: layer.ambientLightColor ?? "180;180;180",
						onChange: (ambientLightColor) => dispatch({
							type: "updateLayer",
							name,
							patch: { ambientLightColor }
						})
					})
				}) : null
			]
		}),
		/* @__PURE__ */ jsx(PropertySection, {
			title: `${S.effects} (${layer.effects.length})`,
			children: /* @__PURE__ */ jsx(EffectsList, {
				api: effectsApi,
				compact: true
			})
		})
	] });
}
function SceneQuickProperties() {
	const { scene, dispatch, project } = useEditor();
	const sceneLocation = { scope: "scene" };
	const variablesApi = {
		variables: scene.variables,
		add: (path) => path.length === 0 ? dispatch({
			type: "addVariable",
			location: sceneLocation
		}) : dispatch({
			type: "addVariableChild",
			location: sceneLocation,
			path
		}),
		update: (path, patch) => dispatch({
			type: "updateVariable",
			location: { scope: "scene" },
			path,
			patch
		}),
		remove: (path) => dispatch({
			type: "deleteVariable",
			location: { scope: "scene" },
			path
		})
	};
	const layerNames = scene.layers.map((l) => l.name);
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsxs(PropertySection, {
			title: S.sceneProperties,
			children: [
				/* @__PURE__ */ jsx(FieldRow, {
					label: "Nombre",
					children: /* @__PURE__ */ jsx(TextField, {
						value: scene.name,
						onChange: (name) => name && dispatch({
							type: "renameScene",
							from: scene.name,
							to: name
						})
					})
				}),
				/* @__PURE__ */ jsx(FieldRow, {
					label: S.background,
					children: /* @__PURE__ */ jsx(ColorField, {
						value: scene.backgroundColor,
						onChange: (backgroundColor) => dispatch({
							type: "updateScene",
							patch: { backgroundColor }
						})
					})
				}),
				/* @__PURE__ */ jsx(FieldRow, {
					label: S.layerWhereInstancesAreAdded,
					children: /* @__PURE__ */ jsx(ChoiceField, {
						value: scene.activeLayer,
						options: layerNames.length ? layerNames : [BASE_LAYER_NAME],
						onChange: (activeLayer) => dispatch({
							type: "updateScene",
							patch: { activeLayer }
						})
					})
				}),
				/* @__PURE__ */ jsx(FieldRow, {
					label: S.customWindowSize,
					children: /* @__PURE__ */ jsx(ToggleField, {
						checked: !!scene.useCustomWindowSize,
						label: S.customWindowSize,
						onChange: (useCustomWindowSize) => dispatch({
							type: "updateScene",
							patch: { useCustomWindowSize }
						})
					})
				}),
				scene.useCustomWindowSize ? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(FieldRow, {
					label: "Ancho",
					children: /* @__PURE__ */ jsx(NumberField, {
						value: scene.customWindowWidth ?? project.gameSettings.windowWidth,
						onChange: (customWindowWidth) => dispatch({
							type: "updateScene",
							patch: { customWindowWidth: Math.max(1, Math.round(customWindowWidth)) }
						})
					})
				}), /* @__PURE__ */ jsx(FieldRow, {
					label: "Alto",
					children: /* @__PURE__ */ jsx(NumberField, {
						value: scene.customWindowHeight ?? project.gameSettings.windowHeight,
						onChange: (customWindowHeight) => dispatch({
							type: "updateScene",
							patch: { customWindowHeight: Math.max(1, Math.round(customWindowHeight)) }
						})
					})
				})] }) : /* @__PURE__ */ jsxs("p", {
					className: "px-3 py-1 text-[12px] text-text-placeholder",
					children: [
						project.gameSettings.windowWidth,
						" × ",
						project.gameSettings.windowHeight,
						" (configuración del juego)"
					]
				}),
				/* @__PURE__ */ jsx("div", {
					className: "px-3 pt-1",
					children: /* @__PURE__ */ jsx(GdButton, {
						variant: "raised",
						size: "small",
						icon: /* @__PURE__ */ jsx(Film, { className: "h-3.5 w-3.5" }),
						onClick: () => dispatch({
							type: "openDialog",
							dialog: { name: "sceneProperties" }
						}),
						children: S.sceneProperties
					})
				})
			]
		}),
		/* @__PURE__ */ jsxs(PropertySection, {
			title: "Cuadrícula",
			children: [
				/* @__PURE__ */ jsx(FieldRow, {
					label: S.visible,
					children: /* @__PURE__ */ jsx(ToggleField, {
						checked: scene.grid.show,
						label: S.toggleGrid,
						onChange: (show) => dispatch({
							type: "updateGrid",
							patch: { show }
						})
					})
				}),
				/* @__PURE__ */ jsx(FieldRow, {
					label: S.snapToGrid,
					children: /* @__PURE__ */ jsx(ToggleField, {
						checked: scene.grid.snap,
						label: S.snapToGrid,
						onChange: (snap) => dispatch({
							type: "updateGrid",
							patch: { snap }
						})
					})
				}),
				/* @__PURE__ */ jsx(FieldRow, {
					label: S.gridHorizontal,
					children: /* @__PURE__ */ jsx(NumberField, {
						value: scene.grid.width,
						onChange: (width) => dispatch({
							type: "updateGrid",
							patch: { width: Math.max(1, width) }
						})
					})
				}),
				/* @__PURE__ */ jsx(FieldRow, {
					label: S.gridVertical,
					children: /* @__PURE__ */ jsx(NumberField, {
						value: scene.grid.height,
						onChange: (height) => dispatch({
							type: "updateGrid",
							patch: { height: Math.max(1, height) }
						})
					})
				}),
				/* @__PURE__ */ jsx(FieldRow, {
					label: S.gridColor,
					children: /* @__PURE__ */ jsx(ColorField, {
						value: scene.grid.color,
						onChange: (color) => dispatch({
							type: "updateGrid",
							patch: { color }
						})
					})
				}),
				/* @__PURE__ */ jsx(FieldRow, {
					label: S.gridAlpha,
					children: /* @__PURE__ */ jsx(NumberField, {
						value: scene.grid.alpha,
						onChange: (alpha) => dispatch({
							type: "updateGrid",
							patch: { alpha: Math.max(0, Math.min(1, alpha)) }
						})
					})
				})
			]
		}),
		/* @__PURE__ */ jsx(PropertySection, {
			title: `${S.sceneVariables} (${scene.variables.length})`,
			children: /* @__PURE__ */ jsx(VariablesEditor, { api: variablesApi })
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "flex items-center gap-2 px-3 py-2 text-[11.5px] text-text-secondary",
			children: [
				/* @__PURE__ */ jsx(Film, { className: "h-3.5 w-3.5" }),
				scene.instances.length,
				" instancias · ",
				scene.objects.length,
				" objetos · ",
				scene.events.length,
				" ",
				"eventos",
				/* @__PURE__ */ jsxs("span", {
					className: "ml-auto flex items-center gap-1",
					children: [
						/* @__PURE__ */ jsx(Variable, { className: "h-3.5 w-3.5" }),
						project.globalVariables.length,
						/* @__PURE__ */ jsx(Lock, { className: "h-3.5 w-3.5" }),
						scene.instances.filter((i) => i.locked).length
					]
				})
			]
		})
	] });
}
//#endregion
//#region src/lib/editor/instructions.ts
var P = (name, type, label, defaultValue, extra = {}) => ({
	name,
	type,
	label,
	defaultValue,
	...extra
});
var INSTRUCTION_CATEGORIES = [
	{
		id: "all",
		name: "Todos"
	},
	{
		id: "adv",
		name: "Avanzado"
	},
	{
		id: "scene",
		name: "Escena"
	},
	{
		id: "keyboard",
		name: "Teclado"
	},
	{
		id: "mouse",
		name: "Ratón y puntero"
	},
	{
		id: "sprite",
		name: "Sprite"
	},
	{
		id: "text",
		name: "Texto"
	},
	{
		id: "collision",
		name: "Colisiones"
	},
	{
		id: "variables",
		name: "Variables"
	},
	{
		id: "timers",
		name: "Temporizadores"
	},
	{
		id: "camera",
		name: "Cámara"
	},
	{
		id: "layers",
		name: "Capas"
	},
	{
		id: "audio",
		name: "Audio"
	},
	{
		id: "timescale",
		name: "Tiempo del juego"
	},
	{
		id: "platform",
		name: "Plataformas"
	},
	{
		id: "tween",
		name: "Interpolación"
	},
	{
		id: "flash",
		name: "Destello"
	},
	{
		id: "health",
		name: "Salud"
	},
	{
		id: "effects",
		name: "Efectos"
	}
];
var OBJ = (value = "Jugador") => P("object", "object", "Objeto", value);
var INSTRUCTIONS = [
	{
		id: "BuiltinCommonInstructions::Once",
		kind: "condition",
		category: "adv",
		name: "Disparar una sola vez mientras se cumplen las condiciones",
		description: "Se ejecuta solo la primera vez que todas las condiciones del evento son verdaderas.",
		sentence: "Disparar una sola vez mientras se cumplen todas las condiciones",
		parameters: [P("force", "choices", "Modo", "true", { choices: ["true", "false"] })],
		helpPath: "/ideas-glossary/understanding-events-and-actions/"
	},
	{
		id: "BuiltinCommonInstructions::Else",
		kind: "condition",
		category: "adv",
		name: "Si no (else)",
		description: "Solo se ejecuta si el evento anterior no se ha ejecutado.",
		sentence: "Si no",
		parameters: []
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
			P("right", "expression", "Expresión", "0")
		]
	},
	{
		id: "BuiltinCommonInstructions::StrEqual",
		kind: "condition",
		category: "adv",
		name: "Comparar dos cadenas de texto",
		description: "Compara dos textos, sin distinguir mayúsculas y minúsculas opcionalmente.",
		sentence: "{0} {1} {2}",
		parameters: [
			P("left", "string", "Texto", "\"\""),
			P("operator", "operator", "Comparación", "="),
			P("right", "string", "Texto", "\"hola\"")
		]
	},
	{
		id: "BuiltinCommonInstructions::Or",
		kind: "condition",
		category: "adv",
		name: "Al menos una de las condiciones (O)",
		description: "Verdadero si al menos una de las sub-condiciones se cumple.",
		sentence: "Al menos una de las condiciones (O)",
		parameters: [],
		unsupported: true
	},
	{
		id: "BuiltinCommonInstructions::And",
		kind: "condition",
		category: "adv",
		name: "Todas las condiciones (Y)",
		description: "Verdadero si todas las sub-condiciones se cumplen.",
		sentence: "Todas las condiciones (Y)",
		parameters: [],
		unsupported: true
	},
	{
		id: "SceneJustBegins",
		kind: "condition",
		category: "scene",
		name: "Al principio de la escena",
		description: "Verdadero solo una vez, cuando la escena empieza.",
		sentence: "Al principio de la escena",
		parameters: []
	},
	{
		id: "ChangeScene",
		kind: "action",
		category: "scene",
		name: "Cambiar de escena",
		description: "Detiene la escena actual y abre otra escena del proyecto.",
		sentence: "Ir a la escena {0}",
		parameters: [P("scene", "scene", "Escena", "Level 1")]
	},
	{
		id: "EndScene",
		kind: "action",
		category: "scene",
		name: "Salir de la escena",
		description: "Vuelve a la escena anterior o termina la partida.",
		sentence: "Salir de la escena",
		parameters: []
	},
	{
		id: "PauseGame",
		kind: "action",
		category: "scene",
		name: "Pausar el juego",
		description: "Detiene la simulación hasta que se reanude.",
		sentence: "Pausar el juego",
		parameters: []
	},
	{
		id: "SetTimeScale",
		kind: "action",
		category: "timescale",
		name: "Modificar la velocidad del tiempo",
		description: "Cambia la velocidad a la que avanza el tiempo de la escena.",
		sentence: "Cambiar la velocidad del tiempo: {1} {0}",
		parameters: [P("timeScale", "expression", "Nueva velocidad del tiempo", "1"), P("op", "modop", "Modificación", "set to")]
	},
	{
		id: "KeyPressed",
		kind: "condition",
		category: "keyboard",
		name: "Tecla presionada",
		description: "Verdadero mientras la tecla indicada está pulsada.",
		sentence: "La tecla {0} está presionada",
		parameters: [P("key", "key", "Tecla", "Right")],
		helpPath: "/misc/getting-started/first-events/"
	},
	{
		id: "KeyReleased",
		kind: "condition",
		category: "keyboard",
		name: "Tecla soltada",
		description: "Verdadero el frame en que la tecla indicada se suelta.",
		sentence: "La tecla {0} se suelta",
		parameters: [P("key", "key", "Tecla", "Space")]
	},
	{
		id: "KeyNotPressed",
		kind: "condition",
		category: "keyboard",
		name: "Tecla no presionada",
		description: "Verdadero mientras la tecla indicada no está pulsada.",
		sentence: "La tecla {0} no está presionada",
		parameters: [P("key", "key", "Tecla", "Shift")]
	},
	{
		id: "SourisBouton",
		kind: "condition",
		category: "mouse",
		name: "Botón del ratón presionado o toque",
		description: "Hay un toque o el botón del ratón está presionado.",
		sentence: "Hay un toque o el botón {0} del ratón está presionado",
		parameters: [P("button", "choices", "Botón", "Left", { choices: [
			"Left",
			"Right",
			"Middle"
		] })]
	},
	{
		id: "SourisSurObjet",
		kind: "condition",
		category: "mouse",
		name: "Puntero sobre el objeto",
		description: "Verdadero cuando el puntero está encima del objeto.",
		sentence: "El cursor del ratón está sobre {0}",
		parameters: [OBJ(), P("considerAsTrigger", "yesno", "Considerado como disparador", "yes")]
	},
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
			P("ignoreTouchingEdges", "yesno", "Ignorar bordes que se tocan", "no")
		]
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
			P("ignoreTouchingEdges", "yesno", "Ignorar bordes que se tocan", "no")
		]
	},
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
			P("layer", "layer", "Capa", "Base layer")
		]
	},
	{
		id: "Delete",
		kind: "action",
		category: "sprite",
		name: "Suprimir un objeto",
		description: "Elimina las instancias del objeto seleccionadas por las condiciones.",
		sentence: "Eliminar {0}",
		parameters: [OBJ("Moneda")]
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
			P("useCenterPosition", "yesno", "Usar la posición del centro", "no")
		]
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
			P("value", "expression", "Valor", "5")
		]
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
			P("value", "expression", "Valor", "5")
		]
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
			P("value", "expression", "Ángulo", "0")
		]
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
			P("value", "expression", "Ancho", "64")
		]
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
			P("value", "expression", "Altura", "64")
		]
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
			P("value", "expression", "Opacidad", "255")
		]
	},
	{
		id: "Cache",
		kind: "action",
		category: "sprite",
		name: "Ocultar el objeto",
		description: "Deja de dibujar el objeto en pantalla.",
		sentence: "Ocultar {0}",
		parameters: [OBJ("Moneda")]
	},
	{
		id: "Montre",
		kind: "action",
		category: "sprite",
		name: "Mostrar el objeto",
		description: "Vuelve a dibujar el objeto en pantalla.",
		sentence: "Mostrar {0}",
		parameters: [OBJ("Moneda")]
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
			P("value", "expression", "Plano (Z)", "2")
		]
	},
	{
		id: "FlipX",
		kind: "action",
		category: "sprite",
		name: "Voltear horizontalmente",
		description: "Espeja la imagen del objeto a izquierda/derecha.",
		sentence: "Voltear {0} horizontalmente: {1}",
		parameters: [OBJ(), P("flip", "yesno", "Volteado", "yes")]
	},
	{
		id: "FlipY",
		kind: "action",
		category: "sprite",
		name: "Voltear verticalmente",
		description: "Espeja la imagen del objeto arriba/abajo.",
		sentence: "Voltear {0} verticalmente: {1}",
		parameters: [OBJ(), P("flip", "yesno", "Volteado", "yes")]
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
			P("action", "choices", "Acción", "Or", { choices: ["Or", "Séparer les forces"] })
		]
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
			P("Damping", "yesno", "Aplicar amortiguación", "yes")
		]
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
			P("speed", "expression", "Velocidad", "60")
		]
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
			P("value", "expression", "Número de animación", "1")
		]
	},
	{
		id: "ChangeAnimationName",
		kind: "action",
		category: "sprite",
		name: "Cambiar la animación (nombre)",
		description: "Cambia la animación actual del Sprite usando su nombre.",
		sentence: "Configurar animación de {0} hacia {1}",
		parameters: [OBJ(), P("animation", "animation", "Nombre de la animación", "\"reposo\"")]
	},
	{
		id: "SetSpriteSpeed",
		kind: "action",
		category: "sprite",
		name: "Cambiar la velocidad de la animación",
		description: "Multiplica la velocidad de reproducción de la animación.",
		sentence: "Cambiar la velocidad de la animación de {0} a {1}%",
		parameters: [OBJ(), P("speed", "expression", "Velocidad (%)", "100")]
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
			P("value", "expression", "Posición en X", "600")
		]
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
			P("value", "expression", "Posición en Y", "100")
		]
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
			P("value", "expression", "Ángulo", "45")
		]
	},
	{
		id: "Visible",
		kind: "condition",
		category: "sprite",
		name: "El objeto está visible",
		description: "Verdadero cuando el objeto no está oculto.",
		sentence: "{0} está visible",
		parameters: [OBJ("Moneda")]
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
			P("value", "expression", "Opacidad", "128")
		]
	},
	{
		id: "AnimationNameIs",
		kind: "condition",
		category: "sprite",
		name: "La animación actual es",
		description: "Compara el nombre de la animación que se está reproduciendo.",
		sentence: "El nombre de la animación de {0} es {1}",
		parameters: [OBJ(), P("animation", "animation", "Nombre de la animación", "\"correr\"")]
	},
	{
		id: "TXT::SetText",
		kind: "action",
		category: "text",
		name: "Cambiar el texto",
		description: "Cambia el texto mostrado por el objeto de texto.",
		sentence: "Cambiar el texto de {0} a {1}",
		parameters: [P("object", "textObject", "Objeto de texto", "TextoPuntos"), P("text", "string", "Nuevo texto", "\"Puntos: 0\"")]
	},
	{
		id: "TXT::SetFontSize",
		kind: "action",
		category: "text",
		name: "Cambiar el tamaño del texto",
		description: "Cambia el tamaño de fuente del objeto de texto.",
		sentence: "Cambiar el tamaño de la fuente de {0} a {1}",
		parameters: [P("object", "textObject", "Objeto de texto", "TextoPuntos"), P("size", "expression", "Tamaño", "24")]
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
			P("b", "expression", "Azul", "250")
		]
	},
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
			P("value", "expression", "Valor", "1")
		]
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
			P("value", "string", "Valor", "\"\"")
		]
	},
	{
		id: "ToggleSceneVar",
		kind: "action",
		category: "variables",
		name: "Activar o desactivar una variable booleana de escena",
		description: "Cambia el valor verdadero/falso de una variable de escena.",
		sentence: "Pasar la variable de escena {0} a {1}",
		parameters: [P("variable", "varscene", "Variable", "empieza"), P("value", "yesno", "Nuevo valor", "yes")]
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
			P("value", "expression", "Valor", "1")
		]
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
			P("zero", "number", "", "0")
		]
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
			P("zero", "number", "", "0")
		]
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
			P("value", "expression", "Valor", "10")
		]
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
			P("value", "expression", "Valor", "100")
		]
	},
	{
		id: "CompareSceneVarString",
		kind: "condition",
		category: "variables",
		name: "Comparar el texto de una variable de escena",
		description: "Compara el contenido de texto de una variable de escena.",
		sentence: "El texto de la variable de escena {0} es {1}: \"{2}\"",
		parameters: [
			P("variable", "varscene", "Variable", "mensaje"),
			P("operator", "operator", "Comparación", "="),
			P("value", "string", "Valor", "\"¡Buena suerte!\"")
		]
	},
	{
		id: "ResetTimer",
		kind: "action",
		category: "timers",
		name: "Reiniciar (o empezar) un temporizador de escena",
		description: "Vuelve a cero el temporizador indicado.",
		sentence: "Reiniciar el temporizador de escena {0}",
		parameters: [P("timer", "string", "Temporizador", "spawn")]
	},
	{
		id: "PauseTimer",
		kind: "action",
		category: "timers",
		name: "Pausar un temporizador de escena",
		description: "Congela el temporizador hasta que se reactive.",
		sentence: "Pausar el temporizador de escena {0}",
		parameters: [P("timer", "string", "Temporizador", "spawn")]
	},
	{
		id: "UnpauseTimer",
		kind: "action",
		category: "timers",
		name: "Reanudar un temporizador de escena",
		description: "Continúa un temporizador que estaba pausado.",
		sentence: "Reanudar el temporizador de escena {0}",
		parameters: [P("timer", "string", "Temporizador", "spawn")]
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
			P("seconds", "expression", "Tiempo (segundos)", "2")
		]
	},
	{
		id: "TimerRepeated",
		kind: "condition",
		category: "timers",
		name: "Repetir cada X segundos usando un temporizador",
		description: "Verdadero cada X segundos, usando un temporizador de escena.",
		sentence: "Repetir cada {1} segundos usando el temporizador {0}",
		parameters: [P("timer", "string", "Nombre del temporizador utilizado para el bucle", "slime_move"), P("seconds", "expression", "Intervalo (segundos)", "2")]
	},
	{
		id: "CentreCamera",
		kind: "action",
		category: "camera",
		name: "Centrar la cámara en un objeto",
		description: "Mueve la cámara para que el objeto quede en el centro.",
		sentence: "Centrar la cámara en {0} (capa: {1})",
		parameters: [OBJ(), P("layer", "layer", "Capa", "Base layer")]
	},
	{
		id: "SetCameraZoom",
		kind: "action",
		category: "camera",
		name: "Cambiar el zoom de la cámara",
		description: "Ajusta el zoom de la cámara de una capa.",
		sentence: "Cambiar el zoom de la cámara a: {0} (capa: {1})",
		parameters: [P("zoom", "expression", "Nuevo zoom de la cámara", "2"), P("layer", "layer", "Capa", "Base layer")]
	},
	{
		id: "HideLayer",
		kind: "action",
		category: "layers",
		name: "Ocultar una capa",
		description: "Deja de dibujar todos los objetos de la capa.",
		sentence: "Ocultar la capa {0}",
		parameters: [P("layer", "layer", "Capa", "Interfaz")]
	},
	{
		id: "ShowLayer",
		kind: "action",
		category: "layers",
		name: "Mostrar una capa",
		description: "Vuelve a dibujar la capa.",
		sentence: "Mostrar la capa {0}",
		parameters: [P("layer", "layer", "Capa", "Interfaz")]
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
			P("value", "expression", "Opacidad", "255")
		]
	},
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
			P("loop", "yesno", "Bucle", "no")
		]
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
			P("adjustation", "expression", "Ajuste estéreo", "60")
		]
	},
	{
		id: "StopSound",
		kind: "action",
		category: "audio",
		name: "Parar la reproducción de un canal de sonido",
		description: "Detiene el audio que se está reproduciendo en el canal indicado.",
		sentence: "Parar el canal de sonido {0}",
		parameters: [P("channel", "number", "Canal", "0")]
	},
	{
		id: "PlatformBehavior::IsOnFloor",
		kind: "condition",
		category: "platform",
		name: "Está sobre el suelo",
		description: "Verdadero cuando el personaje está apoyado en una plataforma.",
		sentence: "{0} está sobre el suelo",
		parameters: [OBJ(), P("behavior", "behavior", "Comportamiento", "PlataformaCharacter")],
		behavior: true
	},
	{
		id: "PlatformBehavior::IsJumping",
		kind: "condition",
		category: "platform",
		name: "Está saltando",
		description: "Verdadero mientras el personaje sube tras un salto.",
		sentence: "{0} está saltando",
		parameters: [OBJ(), P("behavior", "behavior", "Comportamiento", "PlataformaCharacter")],
		behavior: true
	},
	{
		id: "PlatformBehavior::IsFalling",
		kind: "condition",
		category: "platform",
		name: "Está cayendo",
		description: "Verdadero cuando el personaje cae libremente.",
		sentence: "{0} está cayendo",
		parameters: [OBJ(), P("behavior", "behavior", "Comportamiento", "PlataformaCharacter")],
		behavior: true
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
			P("key", "choices", "Control", "Right", { choices: [
				"Left",
				"Right",
				"Up",
				"Down",
				"Jump"
			] }),
			P("pressed", "yesno", "Presionado", "yes")
		],
		behavior: true
	},
	{
		id: "PlatformBehavior::SimulateJumpKey",
		kind: "action",
		category: "platform",
		name: "Simular tecla de salto",
		description: "Hace saltar al personaje como si pulsara la tecla de salto.",
		sentence: "Simular tecla de salto para {0}",
		parameters: [OBJ(), P("behavior", "behavior", "Comportamiento", "PlataformaCharacter")],
		behavior: true
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
			P("ignore", "yesno", "Ignorar", "yes")
		],
		behavior: true
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
			P("gravity", "expression", "Gravedad", "1800")
		],
		behavior: true
	},
	{
		id: "Tween::CreateTween",
		kind: "action",
		category: "tween",
		name: "Añadir una interpolación (tween)",
		description: "Anima una posición, un tamaño o la opacidad durante una duración.",
		sentence: "Añadir una interpolación de tipo: {4}, para {0}, con el nombre: {1}, desde {2} hasta {3}, durante {5} segundos",
		parameters: [
			OBJ(),
			P("name", "string", "Nombre de la interpolación", "rebotar"),
			P("from", "expression", "Valor inicial", "0"),
			P("to", "expression", "Valor final", "100"),
			P("kind", "choices", "Tipo", "alpha", { choices: [
				"x",
				"y",
				"angle",
				"alpha",
				"size",
				"color"
			] }),
			P("duration", "expression", "Duración (segundos)", "0.5"),
			P("easing", "choices", "Suavidad", "easeInOutQuad", { choices: [
				"linear",
				"easeInQuad",
				"easeOutQuad",
				"easeInOutQuad",
				"easeInOutElastic",
				"linearStops"
			] })
		]
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
			P("kind", "choices", "Tipo", "alpha", { choices: [
				"x",
				"y",
				"angle",
				"alpha",
				"size",
				"color"
			] })
		]
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
			P("kind", "choices", "Tipo", "alpha", { choices: [
				"x",
				"y",
				"angle",
				"alpha",
				"size",
				"color"
			] })
		]
	},
	{
		id: "Flash::Flash",
		kind: "action",
		category: "flash",
		name: "Hacer parpadear el objeto",
		description: "El objeto parpadea durante la duración configurada.",
		sentence: "Hacer parpadear {0} con el comportamiento: {1}",
		parameters: [OBJ("Slime"), P("behavior", "behavior", "Comportamiento", "Destello")],
		behavior: true
	},
	{
		id: "Flash::StopFlash",
		kind: "action",
		category: "flash",
		name: "Parar el parpadeo del objeto",
		description: "Detiene el parpadeo inmediatamente.",
		sentence: "Parar el parpadeo de {0} con el comportamiento: {1}",
		parameters: [OBJ("Slime"), P("behavior", "behavior", "Comportamiento", "Destello")],
		behavior: true
	},
	{
		id: "Flash::IsFlashEnabled",
		kind: "condition",
		category: "flash",
		name: "El objeto está parpadeando",
		description: "Verdadero mientras el objeto parpadea.",
		sentence: "{0} parpadea con el comportamiento: {1}",
		parameters: [OBJ("Slime"), P("behavior", "behavior", "Comportamiento", "Destello")],
		behavior: true
	},
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
			P("behavior", "behavior", "Comportamiento", "Salud")
		],
		behavior: true
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
			P("behavior", "behavior", "Comportamiento", "Salud")
		],
		behavior: true
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
			P("behavior", "behavior", "Comportamiento", "Salud")
		],
		behavior: true
	},
	{
		id: "Health::IsDead",
		kind: "condition",
		category: "health",
		name: "La salud es 0",
		description: "Verdadero cuando la salud del objeto ha llegado a cero.",
		sentence: "{0} está muerto con el comportamiento: {1}",
		parameters: [OBJ("Slime"), P("behavior", "behavior", "Comportamiento", "Salud")],
		behavior: true
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
			P("behavior", "behavior", "Comportamiento", "Salud")
		],
		behavior: true
	},
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
			P("value", "expression", "Valor", "255")
		]
	}
];
var instructionById = (id) => INSTRUCTIONS.find((i) => i.id === id);
P("link", "string", "Eventos externos", "Sistema de puntuación");
/** Render an instruction sentence, splitting around {n} placeholders. */
function sentenceParts(def) {
	const parts = [];
	const regex = /\{(\d+)\}/g;
	let last = 0;
	let m;
	while ((m = regex.exec(def.sentence)) !== null) {
		if (m.index > last) parts.push({ text: def.sentence.slice(last, m.index) });
		parts.push({ paramIndex: Number(m[1]) });
		last = m.index + m[0].length;
	}
	if (last < def.sentence.length) parts.push({ text: def.sentence.slice(last) });
	return parts;
}
var OPERATORS = [
	"=",
	"<",
	">",
	"≤",
	"≥",
	"≠"
];
var MODOPS = [
	{
		value: "set to",
		label: "establecer"
	},
	{
		value: "add",
		label: "añadir"
	},
	{
		value: "subtract",
		label: "restar"
	},
	{
		value: "multiply",
		label: "multiplicar"
	},
	{
		value: "divide",
		label: "dividir"
	}
];
/** Search over the catalog, same fields the GDevelop selector looks at. */
function searchInstructions(kind, query, category) {
	const needle = query.trim().toLowerCase();
	return INSTRUCTIONS.filter((i) => {
		if (i.kind !== kind) return false;
		if (category && category !== "all" && i.category !== category) return false;
		if (!needle) return true;
		return i.name.toLowerCase().includes(needle) || i.description.toLowerCase().includes(needle) || i.sentence.toLowerCase().includes(needle) || categoryName(i.category).toLowerCase().includes(needle);
	});
}
var categoryName = (id) => INSTRUCTION_CATEGORIES.find((c) => c.id === id)?.name ?? id;
//#endregion
//#region src/components/editor/EventsEditor.tsx
var PARAM_COLOR = {
	number: "#0ECD7A",
	expression: "#0ECD7A",
	string: "#E0D01F",
	yesno: "#E0D01F",
	choices: "#A483FF",
	object: "#A483FF",
	color: "#FF85ED",
	key: "#FF85ED",
	button: "#FF85ED",
	sound: "#FF85ED",
	operator: "#FF85ED",
	modop: "#FF85ED",
	behavior: "#9AA5CE",
	animation: "#9AA5CE",
	varobj: "#8AD6FF",
	textObject: "#8AD6FF",
	varscene: "#8AD6FF",
	varglobal: "#8AD6FF",
	layer: "#8AD6FF",
	scene: "#8AD6FF"
};
var rgbTriplet = (value) => value.startsWith("#") ? value : `rgb(${value.split(";").map((part) => Math.max(0, Math.min(255, Number(part) || 0))).join(",")})`;
function EventsEditor() {
	const { scene, ui, dispatch } = useEditor();
	const [query, setQuery] = React.useState("");
	const [addMenu, setAddMenu] = React.useState(null);
	const [settings, setSettings] = React.useState(null);
	const [showDisabledOnly, setShowDisabledOnly] = React.useState(false);
	const selectedIds = ui.selectedEventIds;
	const selectedParent = selectedIds.length === 1 ? selectedIds[0] ?? null : null;
	const addEntries = [
		{
			id: "event",
			label: S.addEvent,
			icon: /* @__PURE__ */ jsx(Plus, { className: "h-3.5 w-3.5" }),
			onSelect: () => dispatch({
				type: "addEvent",
				parentId: null,
				kind: "standard"
			})
		},
		{
			id: "subevent",
			label: S.addASubEvent,
			icon: /* @__PURE__ */ jsx(UnfoldVertical, { className: "h-3.5 w-3.5" }),
			disabled: !selectedParent,
			onSelect: () => dispatch({
				type: "addEvent",
				parentId: selectedParent,
				kind: "standard"
			})
		},
		{
			id: "else",
			label: S.elseLabel,
			separatorBefore: true,
			disabled: !selectedParent,
			onSelect: () => {
				if (!selectedParent) return;
				dispatch({
					type: "addEvent",
					parentId: selectedParent,
					kind: "else"
				});
			}
		},
		{
			id: "comment",
			label: S.addAComment,
			icon: /* @__PURE__ */ jsx(Type, { className: "h-3.5 w-3.5" }),
			onSelect: () => dispatch({
				type: "addEvent",
				parentId: null,
				kind: "comment"
			})
		},
		{
			id: "group",
			label: S.addAGroup,
			icon: /* @__PURE__ */ jsx(SquareStack, { className: "h-3.5 w-3.5" }),
			onSelect: () => dispatch({
				type: "addEvent",
				parentId: null,
				kind: "group"
			})
		},
		{
			id: "link",
			label: S.externalEvents,
			icon: /* @__PURE__ */ jsx(Link2, { className: "h-3.5 w-3.5" }),
			separatorBefore: true,
			onSelect: () => dispatch({
				type: "addEvent",
				parentId: null,
				kind: "link"
			})
		}
	];
	const settingsEntries = [
		{
			id: "disabled",
			label: showDisabledOnly ? "Mostrar todos los eventos" : "Mostrar solo los desactivados",
			checked: showDisabledOnly,
			onSelect: () => setShowDisabledOnly((value) => !value)
		},
		{
			id: "vars",
			label: S.sceneVariables,
			icon: /* @__PURE__ */ jsx(Variable, { className: "h-3.5 w-3.5" }),
			onSelect: () => dispatch({
				type: "openDialog",
				dialog: {
					name: "variables",
					scope: "scene"
				}
			})
		},
		{
			id: "properties",
			label: S.sceneProperties,
			icon: /* @__PURE__ */ jsx(Settings2, { className: "h-3.5 w-3.5" }),
			onSelect: () => dispatch({
				type: "openDialog",
				dialog: { name: "sceneProperties" }
			})
		}
	];
	const filtered = query ? scene.events.filter((event) => eventMatches(event, query)) : scene.events;
	return /* @__PURE__ */ jsxs("div", {
		className: "flex min-h-0 min-w-0 flex-1 flex-col bg-[#1d1f24]",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex h-11 shrink-0 items-center gap-1 overflow-x-auto border-b border-[#1a1c20] bg-[#22252c] px-2 [&::-webkit-scrollbar]:h-0",
				children: [
					/* @__PURE__ */ jsxs("button", {
						type: "button",
						onClick: (event) => {
							const rect = event.currentTarget.getBoundingClientRect();
							setAddMenu({
								x: rect.left,
								y: rect.bottom + 2
							});
						},
						className: "flex h-8 items-center gap-1.5 rounded bg-primary px-3 text-[12px] font-medium text-primary-foreground hover:bg-[#5C36D6]",
						children: [
							/* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
							S.addEvent,
							/* @__PURE__ */ jsx(ChevronDown, { className: "h-3.5 w-3.5 opacity-70" })
						]
					}),
					/* @__PURE__ */ jsx(GdButton, {
						size: "small",
						icon: /* @__PURE__ */ jsx(Type, { className: "h-3.5 w-3.5" }),
						title: S.addAComment,
						onClick: () => dispatch({
							type: "addEvent",
							parentId: selectedParent,
							kind: "comment"
						}),
						children: /* @__PURE__ */ jsx("span", {
							className: "hidden lg:inline",
							children: "Comentario"
						})
					}),
					/* @__PURE__ */ jsx(GdButton, {
						size: "small",
						icon: /* @__PURE__ */ jsx(SquareStack, { className: "h-3.5 w-3.5" }),
						title: S.addAGroup,
						onClick: () => dispatch({
							type: "addEvent",
							parentId: selectedParent,
							kind: "group"
						}),
						children: /* @__PURE__ */ jsx("span", {
							className: "hidden lg:inline",
							children: "Grupo"
						})
					}),
					/* @__PURE__ */ jsx("div", { className: "mx-1 h-5 w-px bg-separator" }),
					/* @__PURE__ */ jsx(GdButton, {
						size: "small",
						icon: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" }),
						title: S.deleteSelectedEvents,
						disabled: selectedIds.length === 0,
						onClick: () => {
							dispatch({
								type: "deleteEvents",
								ids: selectedIds
							});
							dispatch({
								type: "selectEvents",
								ids: []
							});
						},
						children: /* @__PURE__ */ jsx("span", {
							className: "hidden xl:inline",
							children: S.deleteSelectedEvents
						})
					}),
					selectedIds.length > 0 ? /* @__PURE__ */ jsx(GdButton, {
						size: "small",
						icon: /* @__PURE__ */ jsx(Copy, { className: "h-3.5 w-3.5" }),
						title: S.duplicate,
						onClick: () => {
							for (const id of selectedIds) dispatch({
								type: "duplicateEvent",
								id
							});
						}
					}) : null,
					/* @__PURE__ */ jsx("div", {
						className: "ml-auto flex w-28 items-center sm:w-56",
						children: /* @__PURE__ */ jsx(SearchBar, {
							value: query,
							onChange: setQuery,
							placeholder: S.searchInEvents,
							icon: /* @__PURE__ */ jsx(Search, { className: "h-3.5 w-3.5 text-text-secondary" }),
							className: "h-8"
						})
					}),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						"aria-label": S.openSettings,
						onClick: (event) => {
							const rect = event.currentTarget.getBoundingClientRect();
							setSettings({
								x: rect.right - 220,
								y: rect.bottom + 2
							});
						},
						className: "grid h-8 w-8 shrink-0 place-items-center rounded text-text-secondary hover:bg-elevated hover:text-foreground",
						children: /* @__PURE__ */ jsx(Settings2, { className: "h-4 w-4" })
					})
				]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "min-h-0 flex-1 overflow-auto bg-[var(--ev-tree)] p-2",
				children: filtered.length === 0 ? /* @__PURE__ */ jsx(EmptyEvents, {
					query,
					onAdd: () => dispatch({
						type: "addEvent",
						parentId: null,
						kind: "standard"
					})
				}) : /* @__PURE__ */ jsxs("div", {
					className: "flex flex-col",
					children: [filtered.map((event) => /* @__PURE__ */ jsx(EventRow, {
						event,
						depth: 0,
						query,
						showDisabledOnly
					}, event.id)), /* @__PURE__ */ jsxs("button", {
						type: "button",
						onClick: () => dispatch({
							type: "addEvent",
							parentId: null,
							kind: "standard"
						}),
						className: "mt-1 self-start rounded px-1.5 py-0.5 text-[12px] text-[#c9b6fc] opacity-80 hover:bg-[rgba(0,0,0,0.15)] hover:opacity-100",
						children: ["+ ", S.addANewEmptyEvent]
					})]
				})
			}),
			addMenu ? /* @__PURE__ */ jsx(GdMenu, {
				entries: addEntries,
				anchor: addMenu,
				onClose: () => setAddMenu(null)
			}) : null,
			settings ? /* @__PURE__ */ jsx(GdMenu, {
				entries: settingsEntries,
				anchor: settings,
				onClose: () => setSettings(null)
			}) : null
		]
	});
}
function eventMatches(event, query) {
	const needle = query.toLowerCase();
	if (event.comment?.toLowerCase().includes(needle)) return true;
	if (event.groupName?.toLowerCase().includes(needle)) return true;
	const match = (instruction) => {
		const def = instructionById(instruction.typeId);
		if (def && (def.name.toLowerCase().includes(needle) || def.sentence.toLowerCase().includes(needle))) return true;
		return Object.values(instruction.parameters).some((value) => value.toLowerCase().includes(needle));
	};
	return event.conditions.some(match) || event.actions.some(match) || event.subEvents.some((child) => eventMatches(child, query));
}
function EmptyEvents({ query, onAdd }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "flex h-full min-h-64 flex-col items-center justify-center gap-2 text-center",
		children: [
			/* @__PURE__ */ jsx("h2", {
				className: "text-[15px] font-semibold text-foreground",
				children: query ? `Sin resultados para «${query}»` : S.firstEventTitle
			}),
			/* @__PURE__ */ jsx("p", {
				className: "max-w-md text-[12.5px] text-text-secondary",
				children: S.firstEventHelp
			}),
			!query ? /* @__PURE__ */ jsx(GdButton, {
				variant: "raised",
				primary: true,
				className: "mt-2",
				icon: /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
				onClick: onAdd,
				children: S.addANewEmptyEvent
			}) : null
		]
	});
}
function EventRow({ event, depth, query, showDisabledOnly }) {
	const { ui, dispatch } = useEditor();
	const { open, menu } = useContextMenu();
	const [editing, setEditing] = React.useState(false);
	const selected = ui.selectedEventIds.includes(event.id);
	const isSubEvent = depth > 0;
	const entries = () => [
		{
			id: "condition",
			label: S.addCondition,
			icon: /* @__PURE__ */ jsx(Plus, { className: "h-3.5 w-3.5" }),
			disabled: event.kind !== "standard",
			onSelect: () => dispatch({
				type: "openDialog",
				dialog: {
					name: "instruction",
					eventId: event.id,
					slot: "conditions",
					instructionId: null
				}
			})
		},
		{
			id: "action",
			label: S.addAction,
			icon: /* @__PURE__ */ jsx(Plus, { className: "h-3.5 w-3.5" }),
			disabled: event.kind !== "standard",
			onSelect: () => dispatch({
				type: "openDialog",
				dialog: {
					name: "instruction",
					eventId: event.id,
					slot: "actions",
					instructionId: null
				}
			})
		},
		{
			id: "subevent",
			label: S.addASubEvent,
			disabled: event.kind === "comment",
			onSelect: () => dispatch({
				type: "addEvent",
				parentId: event.id,
				kind: "standard"
			})
		},
		{
			id: "else",
			label: S.elseLabel,
			disabled: isSubEvent || event.kind === "comment",
			onSelect: () => dispatch({
				type: "addEvent",
				parentId: event.id,
				kind: "else"
			})
		},
		{
			id: "disable",
			label: event.disabled ? S.enable : S.disable,
			icon: event.disabled ? /* @__PURE__ */ jsx(Eye, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ jsx(EyeOff, { className: "h-3.5 w-3.5" }),
			onSelect: () => dispatch({
				type: "toggleEventDisabled",
				id: event.id
			})
		},
		{
			id: "duplicate",
			label: S.duplicate,
			separatorBefore: true,
			onSelect: () => dispatch({
				type: "duplicateEvent",
				id: event.id
			})
		},
		{
			id: "delete",
			label: S.delete,
			danger: true,
			icon: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" }),
			onSelect: () => {
				dispatch({
					type: "deleteEvent",
					id: event.id
				});
				dispatch({
					type: "selectEvents",
					ids: ui.selectedEventIds.filter((id) => id !== event.id)
				});
			}
		}
	];
	if (showDisabledOnly && !event.disabled) return /* @__PURE__ */ jsx(Fragment, { children: event.subEvents.map((child) => /* @__PURE__ */ jsx(EventRow, {
		event: child,
		depth,
		query,
		showDisabledOnly: true
	}, child.id)) });
	if (event.kind === "comment") {
		const colors = event.commentColors ?? {
			background: COMMENT_COLORS[0].background,
			text: COMMENT_COLORS[0].text
		};
		return /* @__PURE__ */ jsxs("div", {
			className: cn("mb-px", isSubEvent && "pl-6"),
			style: { paddingLeft: isSubEvent ? 24 + depth * 0 : void 0 },
			children: [
				/* @__PURE__ */ jsxs("div", {
					onClick: () => dispatch({
						type: "selectEvents",
						ids: [event.id]
					}),
					onDoubleClick: () => setEditing(true),
					onContextMenu: (event2) => open(event2, entries()),
					className: cn("flex items-start gap-2 rounded px-2 py-1.5 text-[13px] leading-snug", selected && "outline-dashed outline-1 outline-[#4AB0E4]", event.disabled && "opacity-60"),
					style: {
						background: rgbTriplet(colors.background),
						color: rgbTriplet(colors.text),
						minHeight: 27
					},
					children: [
						/* @__PURE__ */ jsx("button", {
							type: "button",
							"aria-label": S.edit,
							onClick: (e) => {
								e.stopPropagation();
								setEditing(true);
							},
							className: "mt-0.5 shrink-0 opacity-60 hover:opacity-100",
							children: /* @__PURE__ */ jsx(Pencil, { className: "h-3.5 w-3.5" })
						}),
						editing ? /* @__PURE__ */ jsx("textarea", {
							autoFocus: true,
							defaultValue: event.comment ?? "",
							rows: 3,
							onBlur: (e) => {
								setEditing(false);
								dispatch({
									type: "updateEvent",
									id: event.id,
									patch: { comment: e.target.value }
								});
							},
							onKeyDown: (e) => {
								if (e.key === "Escape") setEditing(false);
								if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) e.target.blur();
							},
							className: "min-h-16 w-full resize-y rounded bg-[rgba(0,0,0,0.25)] p-1 text-[13px] outline-none"
						}) : /* @__PURE__ */ jsx("span", {
							className: cn("min-w-0 flex-1 whitespace-pre-wrap", !event.comment && "italic opacity-60"),
							children: event.comment || "Haz doble clic para escribir un comentario…"
						}),
						/* @__PURE__ */ jsx("span", {
							className: "mt-0.5 flex shrink-0 gap-0.5",
							children: [
								"#2d3e2c",
								"#3e3a24",
								"#3e2d24",
								"#1a2638"
							].map((color, index) => /* @__PURE__ */ jsx("button", {
								type: "button",
								"aria-label": `Color de comentario ${index + 1}`,
								onClick: (e) => {
									e.stopPropagation();
									dispatch({
										type: "updateEvent",
										id: event.id,
										patch: { commentColors: {
											background: color,
											text: [
												"#98c379",
												"#e5c07b",
												"#d19a69",
												"#6bafff"
											][index] ?? "#98c379"
										} }
									});
								},
								className: cn("h-3 w-3 rounded-full border border-[rgba(255,255,255,0.25)]", colors.background === color && "ring-1 ring-white/70"),
								style: { background: color }
							}, color))
						})
					]
				}),
				event.subEvents.length > 0 ? /* @__PURE__ */ jsx(SubEvents, {
					events: event.subEvents,
					parentId: event.id,
					depth: depth + 1,
					query,
					showDisabledOnly
				}) : null,
				menu
			]
		});
	}
	if (event.kind === "group") return /* @__PURE__ */ jsxs("div", {
		className: cn("mb-px", isSubEvent && "pl-6"),
		children: [
			/* @__PURE__ */ jsxs("div", {
				onClick: (e) => dispatch({
					type: "selectEvents",
					ids: e.shiftKey ? toggle(ui.selectedEventIds, event.id) : [event.id]
				}),
				onContextMenu: (e) => open(e, entries()),
				className: cn("flex items-center gap-2 rounded bg-[#2b2f37] px-2 py-1.5", selected && "outline-dashed outline-1 outline-[#4AB0E4]", event.disabled && "opacity-60"),
				children: [
					/* @__PURE__ */ jsx("button", {
						type: "button",
						"aria-label": event.collapsed ? "Expandir" : "Contraer",
						onClick: (e) => {
							e.stopPropagation();
							dispatch({
								type: "toggleCollapse",
								id: event.id
							});
						},
						className: "grid h-4 w-4 shrink-0 place-items-center rounded bg-[#282C34] text-text-secondary hover:text-foreground",
						children: event.collapsed ? /* @__PURE__ */ jsx(ChevronRight, { className: "h-3 w-3" }) : /* @__PURE__ */ jsx(ChevronDown, { className: "h-3 w-3" })
					}),
					/* @__PURE__ */ jsx("input", {
						value: event.groupName ?? "",
						"aria-label": "Nombre del grupo",
						onClick: (e) => e.stopPropagation(),
						onChange: (e) => dispatch({
							type: "updateEvent",
							id: event.id,
							patch: { groupName: e.target.value }
						}),
						className: "h-6 w-48 rounded border border-transparent bg-transparent px-1 text-[13px] font-semibold text-foreground outline-none hover:border-separator focus:border-[var(--brand-light)] focus:bg-[#1d1f24]"
					}),
					/* @__PURE__ */ jsx("span", {
						className: "flex shrink-0 gap-1",
						children: [
							"#61AFFE",
							"#98c379",
							"#e5c07b",
							"#d19a69",
							"#c678dd"
						].map((color) => /* @__PURE__ */ jsx("button", {
							type: "button",
							"aria-label": `Color del grupo ${color}`,
							onClick: (e) => {
								e.stopPropagation();
								dispatch({
									type: "updateEvent",
									id: event.id,
									patch: { groupColor: color }
								});
							},
							className: cn("h-3 w-3 rounded-full", (event.groupColor ?? "#61AFFE") === color && "ring-1 ring-white/70"),
							style: { background: color }
						}, color))
					}),
					/* @__PURE__ */ jsxs("span", {
						className: "ml-auto shrink-0 text-[11px] text-text-secondary",
						children: [event.subEvents.length, " subevento(s)"]
					})
				]
			}),
			!event.collapsed ? /* @__PURE__ */ jsx(SubEvents, {
				events: event.subEvents,
				parentId: event.id,
				depth: depth + 1,
				query,
				showDisabledOnly
			}) : null,
			menu
		]
	});
	if (event.kind === "link") return /* @__PURE__ */ jsxs("div", {
		className: cn("mb-px", isSubEvent && "pl-6"),
		children: [/* @__PURE__ */ jsxs("div", {
			onClick: () => dispatch({
				type: "selectEvents",
				ids: [event.id]
			}),
			onContextMenu: (e) => open(e, entries()),
			className: cn("flex items-center gap-2 rounded bg-[var(--ev-link-container)] px-2 py-1.5 text-[13px]", selected && "outline-dashed outline-1 outline-[#4AB0E4]"),
			children: [
				/* @__PURE__ */ jsx(Link2, { className: "h-4 w-4 shrink-0 text-[#C678DD]" }),
				/* @__PURE__ */ jsxs("span", {
					className: "text-[#c678dd]",
					children: [S.externalEvents, ":"]
				}),
				/* @__PURE__ */ jsx("input", {
					value: event.linkToEventsName ?? "",
					"aria-label": "Nombre de los eventos externos",
					placeholder: "nombre",
					onClick: (e) => e.stopPropagation(),
					onChange: (e) => dispatch({
						type: "updateEvent",
						id: event.id,
						patch: { linkToEventsName: e.target.value }
					}),
					className: "h-6 w-56 rounded border border-transparent bg-transparent px-1 text-[12.5px] text-foreground outline-none hover:border-separator focus:border-[var(--brand-light)]"
				}),
				/* @__PURE__ */ jsx("span", {
					className: "ml-auto shrink-0 text-[11px] text-text-secondary",
					children: event.linkToEventsName ? "enlazado" : "sin destino"
				})
			]
		}), menu]
	});
	const isElse = event.kind === "else";
	return /* @__PURE__ */ jsxs("div", {
		className: cn("mb-px flex flex-col", isSubEvent && "pl-6"),
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: cn("flex min-w-[600px] items-stretch sm:min-w-0", isSubEvent && "relative"),
				onClick: (e) => dispatch({
					type: "selectEvents",
					ids: e.shiftKey || e.ctrlKey || e.metaKey ? toggle(ui.selectedEventIds, event.id) : [event.id]
				}),
				onContextMenu: (e) => open(e, entries()),
				children: [/* @__PURE__ */ jsx("div", {
					title: "Arrastra para mover",
					className: "flex w-2.5 shrink-0 cursor-grab items-center justify-center rounded-l-[2px] bg-[var(--ev-move-handle)] hover:bg-[var(--ev-move-handle-hover)]",
					children: /* @__PURE__ */ jsx("span", { className: "h-3 w-px bg-[rgba(255,255,255,0.35)]" })
				}), /* @__PURE__ */ jsx("div", {
					className: cn("flex min-w-0 flex-1 flex-col rounded-r-[2px] bg-[var(--ev-row)]", event.disabled && "opacity-60"),
					children: /* @__PURE__ */ jsxs("div", {
						className: "flex min-w-0 items-stretch border border-[var(--ev-ca-border)]",
						children: [
							/* @__PURE__ */ jsx(InstructionList, {
								event,
								slot: "conditions",
								query,
								isElse,
								selected
							}),
							/* @__PURE__ */ jsx("div", { className: "w-px shrink-0 bg-[var(--ev-ca-border)]" }),
							/* @__PURE__ */ jsx(InstructionList, {
								event,
								slot: "actions",
								query,
								isElse,
								selected
							})
						]
					})
				})]
			}),
			(event.subEvents.length > 0 || selected) && !event.collapsed ? /* @__PURE__ */ jsxs("div", {
				className: "relative",
				children: [
					/* @__PURE__ */ jsx("div", {
						className: "absolute bottom-0 left-0 top-0 w-6 border-b border-l border-l-[var(--ev-line)]",
						"aria-hidden": true
					}),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						"aria-label": event.collapsed ? "Expandir subeventos" : "Contraer subeventos",
						onClick: () => dispatch({
							type: "toggleCollapse",
							id: event.id
						}),
						className: "absolute left-1 top-0 z-10 grid h-4 w-4 -translate-y-1/2 place-items-center rounded bg-[#282C34] text-text-secondary hover:text-foreground",
						children: event.collapsed ? /* @__PURE__ */ jsx(ChevronRight, { className: "h-3 w-3" }) : /* @__PURE__ */ jsx(ChevronDown, { className: "h-3 w-3" })
					}),
					/* @__PURE__ */ jsx(SubEvents, {
						events: event.subEvents,
						parentId: event.id,
						depth: depth + 1,
						query,
						showDisabledOnly
					})
				]
			}) : null,
			event.subEvents.length > 0 && event.collapsed ? /* @__PURE__ */ jsxs("button", {
				type: "button",
				onClick: () => dispatch({
					type: "toggleCollapse",
					id: event.id
				}),
				className: "ml-6 mt-px self-start rounded bg-[#282C34] px-1.5 py-0.5 text-[11px] text-text-secondary hover:text-foreground",
				children: [event.subEvents.length, " subevento(s) oculto(s)"]
			}) : null,
			menu
		]
	});
}
function toggle(ids, id) {
	return ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id];
}
function SubEvents({ events, parentId, depth, query, showDisabledOnly }) {
	const { dispatch } = useEditor();
	return /* @__PURE__ */ jsxs("div", {
		className: "relative pl-6",
		children: [
			/* @__PURE__ */ jsx("div", {
				className: "absolute bottom-0 left-0 top-0 w-6 border-b border-l border-l-[var(--ev-line)]",
				"aria-hidden": true
			}),
			events.map((event) => /* @__PURE__ */ jsx(EventRow, {
				event,
				depth,
				query,
				showDisabledOnly
			}, event.id)),
			/* @__PURE__ */ jsxs("button", {
				type: "button",
				onClick: () => dispatch({
					type: "addEvent",
					parentId,
					kind: "standard"
				}),
				className: "mb-px ml-6 rounded px-1.5 py-0.5 text-[11.5px] text-[#c9b6fc] opacity-70 hover:bg-[rgba(0,0,0,0.15)] hover:opacity-100",
				children: ["+ ", S.addASubEvent]
			})
		]
	});
}
function InstructionList({ event, slot, query, isElse, selected }) {
	const { ui, dispatch } = useEditor();
	const list = event[slot];
	const isConditions = slot === "conditions";
	const emptyLabel = isConditions ? isElse ? "Si no…" : "Dejar vacío: siempre" : "";
	const openEditor = (instruction) => {
		dispatch({
			type: "ui",
			patch: { selectedInstruction: {
				eventId: event.id,
				slot,
				instructionId: instruction?.id ?? ""
			} }
		});
		dispatch({
			type: "openDialog",
			dialog: {
				name: "instruction",
				eventId: event.id,
				slot,
				instructionId: instruction?.id ?? null
			}
		});
	};
	return /* @__PURE__ */ jsxs("div", {
		className: cn("min-w-0 flex-1", isConditions ? "bg-[var(--ev-conditions)]" : "bg-[var(--ev-actions)]"),
		children: [list.length === 0 ? /* @__PURE__ */ jsx("button", {
			type: "button",
			onClick: (e) => {
				e.stopPropagation();
				openEditor(null);
			},
			className: cn("flex w-full items-center px-2 py-1 text-left text-[12.5px]", emptyLabel ? "text-text-placeholder" : "text-[#c9b6fc]"),
			children: emptyLabel || `+ ${S.addAction}`
		}) : list.map((instruction, index) => /* @__PURE__ */ jsx(InstructionRow, {
			event,
			instruction,
			slot,
			index,
			query,
			isSelectedEvent: selected,
			onOpen: () => openEditor(instruction)
		}, instruction.id)), list.length > 0 ? /* @__PURE__ */ jsxs("button", {
			type: "button",
			onClick: (e) => {
				e.stopPropagation();
				openEditor(list[list.length - 1] ?? null);
			},
			className: cn("w-full px-1.5 py-0.5 text-left text-[11.5px] opacity-65 hover:bg-[rgba(0,0,0,0.15)] hover:opacity-100", ui.selectedInstruction?.eventId === event.id && ui.selectedInstruction?.slot === slot ? "text-[#c9b6fc] opacity-100" : "text-[#c9b6fc]"),
			children: ["+ ", isConditions ? S.addCondition : S.addAction]
		}) : null]
	});
}
function InstructionRow({ event, instruction, slot, index, query, isSelectedEvent, onOpen }) {
	const { dispatch, ui } = useEditor();
	const def = instructionById(instruction.typeId);
	const isSelected = ui.selectedInstruction?.eventId === event.id && ui.selectedInstruction?.slot === slot && ui.selectedInstruction?.instructionId === instruction.id;
	const isConditions = slot === "conditions";
	const parts = def ? sentenceParts(def) : [{ text: instruction.typeId }];
	const missing = def ? def.parameters.some((parameter) => !instruction.parameters[parameter.name] && !parameter.defaultValue) : false;
	return /* @__PURE__ */ jsxs("div", {
		className: cn("group flex items-start gap-1 border px-1.5 py-1 text-[12.5px] leading-[18px] text-[var(--ev-row-text)]", "border-transparent", isSelected ? "border-[#4AB0E4] border-dashed" : "hover:bg-[var(--ev-selectable)]", isSelectedEvent && !isSelected && "bg-[rgba(0,0,0,0.12)]", instruction.disabled && "opacity-60"),
		onClick: (e) => {
			e.stopPropagation();
			dispatch({
				type: "ui",
				patch: { selectedInstruction: {
					eventId: event.id,
					slot,
					instructionId: instruction.id
				} }
			});
		},
		onDoubleClick: (e) => {
			e.stopPropagation();
			onOpen();
		},
		children: [
			/* @__PURE__ */ jsxs("span", {
				className: "mt-0.5 flex w-4 shrink-0 justify-center text-[11px] text-text-secondary",
				children: [index + 1, "."]
			}),
			/* @__PURE__ */ jsxs("p", {
				className: cn("min-w-0 flex-1 flex-wrap", instruction.disabled && "line-through"),
				children: [
					isConditions && instruction.inverted ? /* @__PURE__ */ jsx("span", {
						className: "mr-1 rounded bg-[rgba(254,108,70,0.35)] px-1 text-[11px] font-semibold text-[#FFB4A2]",
						children: "no"
					}) : null,
					def ? parts.map((part, partIndex) => "paramIndex" in part && part.paramIndex !== void 0 ? /* @__PURE__ */ jsx(ParamChip, {
						instruction,
						def,
						paramIndex: part.paramIndex,
						query,
						onOpen
					}, `${part.paramIndex}-${partIndex}`) : /* @__PURE__ */ jsx("span", { children: /* @__PURE__ */ jsx(Highlight, {
						text: part.text ?? "",
						query
					}) }, partIndex)) : /* @__PURE__ */ jsxs("span", {
						className: "text-[#FFB4A2]",
						children: ["Instrucción desconocida: ", instruction.typeId]
					}),
					def?.unsupported ? /* @__PURE__ */ jsx("span", {
						title: S.unsupportedEffect,
						className: "ml-1 rounded bg-[var(--ev-warning)] px-1 text-[10px] text-[#FFBC57]",
						children: "simulación limitada"
					}) : null,
					missing && def ? /* @__PURE__ */ jsx("span", {
						title: "Faltan parámetros",
						className: "ml-1 inline-flex",
						children: /* @__PURE__ */ jsx(AlertTriangle, { className: "h-3.5 w-3.5 align-[-3px] text-[#FFBC57]" })
					}) : null
				]
			}),
			/* @__PURE__ */ jsxs("span", {
				className: "flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100",
				children: [
					isConditions ? /* @__PURE__ */ jsx(MiniButton, {
						label: instruction.inverted ? "Quitar «no»" : "Añadir «no»",
						onClick: () => dispatch({
							type: "toggleInstructionInverted",
							eventId: event.id,
							slot,
							instructionId: instruction.id
						}),
						children: "±"
					}) : null,
					/* @__PURE__ */ jsx(MiniButton, {
						label: `Subir`,
						onClick: () => dispatch({
							type: "moveInstruction",
							eventId: event.id,
							slot,
							instructionId: instruction.id,
							direction: -1
						}),
						children: "↑"
					}),
					/* @__PURE__ */ jsx(MiniButton, {
						label: `Bajar`,
						onClick: () => dispatch({
							type: "moveInstruction",
							eventId: event.id,
							slot,
							instructionId: instruction.id,
							direction: 1
						}),
						children: "↓"
					}),
					/* @__PURE__ */ jsx(MiniButton, {
						label: S.delete,
						onClick: () => dispatch({
							type: "deleteInstruction",
							eventId: event.id,
							slot,
							instructionId: instruction.id
						}),
						children: /* @__PURE__ */ jsx(Trash2, { className: "h-3 w-3" })
					})
				]
			})
		]
	});
}
function MiniButton({ label, onClick, children }) {
	return /* @__PURE__ */ jsx("button", {
		type: "button",
		title: label,
		"aria-label": label,
		onClick: (event) => {
			event.stopPropagation();
			onClick();
		},
		className: "grid h-4 w-4 place-items-center rounded bg-[#282C34] text-[10px] text-text-secondary hover:bg-[#32323B] hover:text-foreground",
		children
	});
}
function ParamChip({ instruction, def, paramIndex, query, onOpen }) {
	const parameter = def.parameters[paramIndex];
	const raw = instruction.parameters[parameter?.name ?? String(paramIndex)] ?? "";
	const display = displayParam(parameter?.type, raw, parameter?.choices);
	const color = PARAM_COLOR[parameter?.type ?? "string"] ?? "#E0D01F";
	return /* @__PURE__ */ jsxs("button", {
		type: "button",
		onClick: (event) => {
			event.stopPropagation();
			onOpen();
		},
		className: "mx-[1px] inline-flex max-w-full items-center rounded px-[3px] align-baseline hover:brightness-125",
		style: {
			color,
			background: "rgba(0,0,0,0.22)"
		},
		title: raw || "Sin valor",
		children: [/* @__PURE__ */ jsx("span", {
			className: "truncate",
			children: display || "…"
		}), query && raw.toLowerCase().includes(query.toLowerCase()) ? /* @__PURE__ */ jsx("span", { className: "ml-1 h-1 w-1 rounded-full bg-[#FC6421]" }) : null]
	});
}
function displayParam(type, raw, choices) {
	if (!raw) return "";
	if (type === "yesno") return raw === "yes" ? "Sí" : "No";
	if (type === "key") return raw.length === 1 ? raw.toUpperCase() : raw;
	if (type === "choices" || choices && choices.length > 0) return raw;
	if (type === "object" || type === "varobj" || type === "textObject" || type === "layer" || type === "scene") return raw;
	return raw;
}
function Highlight({ text, query }) {
	if (!query) return /* @__PURE__ */ jsx(Fragment, { children: text });
	const lower = text.toLowerCase();
	const needle = query.toLowerCase();
	const parts = [];
	let cursor = 0;
	let index = lower.indexOf(needle);
	let key = 0;
	while (index >= 0) {
		if (index > cursor) parts.push(/* @__PURE__ */ jsx("span", { children: text.slice(cursor, index) }, key++));
		parts.push(/* @__PURE__ */ jsx("span", {
			className: "rounded-[1px] bg-[rgba(252,100,33,0.25)]",
			children: text.slice(index, index + needle.length)
		}, key++));
		cursor = index + needle.length;
		index = lower.indexOf(needle, cursor);
	}
	parts.push(/* @__PURE__ */ jsx("span", { children: text.slice(cursor) }, key++));
	return /* @__PURE__ */ jsx(Fragment, { children: parts });
}
//#endregion
//#region src/components/editor/HomeTab.tsx
function HomeTab() {
	const { project, dispatch, scene } = useEditor();
	const settings = project.gameSettings;
	const cards = [
		{
			id: "scenes",
			icon: /* @__PURE__ */ jsx(Layers, { className: "h-4 w-4" }),
			label: S.scenes,
			value: project.scenes.length,
			onClick: () => dispatch({ type: "addScene" }),
			action: S.addANewScene
		},
		{
			id: "objects",
			icon: /* @__PURE__ */ jsx(Grid2x2, { className: "h-4 w-4" }),
			label: S.objects,
			value: project.scenes.reduce((total, entry) => total + entry.objects.length, 0),
			onClick: () => dispatch({
				type: "openDialog",
				dialog: { name: "newObject" }
			}),
			action: S.addANewObject
		},
		{
			id: "resources",
			icon: /* @__PURE__ */ jsx(Image$1, { className: "h-4 w-4" }),
			label: S.resources,
			value: project.resources.length,
			onClick: () => dispatch({
				type: "openDialog",
				dialog: { name: "resources" }
			}),
			action: S.addANewResource
		},
		{
			id: "variables",
			icon: /* @__PURE__ */ jsx(Variable, { className: "h-4 w-4" }),
			label: S.globalVariables,
			value: project.globalVariables.length,
			onClick: () => dispatch({
				type: "openDialog",
				dialog: {
					name: "variables",
					scope: "global"
				}
			}),
			action: S.addVariables
		},
		{
			id: "extensions",
			icon: /* @__PURE__ */ jsx(Puzzle, { className: "h-4 w-4" }),
			label: S.extensions,
			value: project.extensions.length,
			onClick: () => dispatch({
				type: "openDialog",
				dialog: { name: "projectProperties" }
			}),
			action: S.install
		},
		{
			id: "settings",
			icon: /* @__PURE__ */ jsx(Settings, { className: "h-4 w-4" }),
			label: S.gameSettings,
			value: `${settings.windowWidth}×${settings.windowHeight}`,
			onClick: () => dispatch({
				type: "openDialog",
				dialog: { name: "projectProperties" }
			}),
			action: S.gameSettings
		}
	];
	return /* @__PURE__ */ jsx("div", {
		className: "min-h-0 flex-1 overflow-y-auto bg-window",
		children: /* @__PURE__ */ jsxs("div", {
			className: "mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-10",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "flex items-start gap-3",
					children: [
						/* @__PURE__ */ jsx("span", {
							className: "grid h-12 w-12 shrink-0 place-items-center rounded-lg text-[20px] font-black text-white shadow-[0_8px_24px_rgba(112,70,236,0.35)]",
							style: { background: "linear-gradient(140deg, var(--brand), var(--brand-dark))" },
							"aria-hidden": true,
							children: "N"
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ jsx("h1", {
								className: "truncate text-[20px] font-semibold text-foreground",
								children: project.name
							}), /* @__PURE__ */ jsxs("p", {
								className: "mt-0.5 text-[12.5px] text-text-secondary",
								children: [
									BRAND.name,
									" · ",
									BRAND.tagline
								]
							})]
						}),
						/* @__PURE__ */ jsx("div", {
							className: "ml-auto flex shrink-0 gap-2",
							children: /* @__PURE__ */ jsx(GdButton, {
								variant: "raised",
								primary: true,
								icon: /* @__PURE__ */ jsx(Play, { className: "h-4 w-4 fill-current" }),
								onClick: () => dispatch({
									type: "ui",
									patch: { previewOpen: true }
								}),
								children: S.preview
							})
						})
					]
				}),
				settings.description ? /* @__PURE__ */ jsx("p", {
					className: "mt-3 max-w-2xl text-[12.5px] leading-relaxed text-text-secondary",
					children: settings.description
				}) : null,
				/* @__PURE__ */ jsx("h2", {
					className: "mt-6 text-[11px] font-semibold uppercase tracking-wide text-text-secondary",
					children: S.scenes
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3",
					children: [project.scenes.map((entry) => /* @__PURE__ */ jsxs("button", {
						type: "button",
						onClick: () => dispatch({
							type: "openTab",
							tab: {
								kind: "scene",
								label: entry.name,
								sceneName: entry.name
							}
						}),
						className: cn("group rounded-lg border border-separator bg-toolbar p-3 text-left hover:border-[var(--brand)]", entry.name === scene.name && "border-[var(--brand)]"),
						children: [/* @__PURE__ */ jsxs("span", {
							className: "flex items-center gap-2",
							children: [
								/* @__PURE__ */ jsx(Layers, { className: "h-4 w-4 shrink-0 text-[#C9B6FC]" }),
								/* @__PURE__ */ jsx("span", {
									className: "min-w-0 flex-1 truncate text-[13px] font-medium text-foreground",
									children: entry.name
								}),
								entry.name === project.firstLayoutName ? /* @__PURE__ */ jsx("span", {
									className: "shrink-0 rounded bg-[rgba(14,205,122,0.15)] px-1 text-[10px] text-success",
									children: "inicio"
								}) : null
							]
						}), /* @__PURE__ */ jsxs("span", {
							className: "mt-2 flex gap-2 text-[11px] text-text-secondary",
							children: [
								/* @__PURE__ */ jsxs("span", { children: [entry.objects.length, " objetos"] }),
								/* @__PURE__ */ jsxs("span", { children: [entry.instances.length, " instancias"] }),
								/* @__PURE__ */ jsxs("span", { children: [entry.events.length, " eventos"] }),
								/* @__PURE__ */ jsxs("span", { children: [entry.layers.length, " capas"] })
							]
						})]
					}, entry.name)), /* @__PURE__ */ jsxs("button", {
						type: "button",
						onClick: () => dispatch({ type: "addScene" }),
						className: "flex min-h-[68px] items-center justify-center gap-1.5 rounded-lg border border-dashed border-separator p-3 text-[12.5px] text-text-secondary hover:border-[var(--brand)] hover:text-foreground",
						children: [
							/* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
							" ",
							S.addANewScene
						]
					})]
				}),
				/* @__PURE__ */ jsx("h2", {
					className: "mt-6 text-[11px] font-semibold uppercase tracking-wide text-text-secondary",
					children: "Proyecto"
				}),
				/* @__PURE__ */ jsx("div", {
					className: "mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3",
					children: cards.map((card) => /* @__PURE__ */ jsxs("div", {
						className: "rounded-lg border border-separator bg-toolbar p-3 hover:border-[var(--brand)]",
						children: [/* @__PURE__ */ jsxs("span", {
							className: "flex items-center gap-2 text-[12px] text-text-secondary",
							children: [
								card.icon,
								/* @__PURE__ */ jsx("span", {
									className: "min-w-0 flex-1 truncate",
									children: card.label
								}),
								/* @__PURE__ */ jsx("span", {
									className: "shrink-0 text-[15px] font-semibold tabular-nums text-foreground",
									children: card.value
								})
							]
						}), /* @__PURE__ */ jsxs("button", {
							type: "button",
							onClick: card.onClick,
							className: "mt-2 flex items-center gap-1 text-[11.5px] text-link hover:text-link-hover",
							children: [
								/* @__PURE__ */ jsx(Plus, { className: "h-3 w-3" }),
								" ",
								card.action
							]
						})]
					}, card.id))
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-6 flex flex-wrap items-center gap-2 rounded-lg border border-separator bg-toolbar p-3 text-[12px] text-text-secondary",
					children: [
						/* @__PURE__ */ jsx(Sparkles, { className: "h-4 w-4 shrink-0 text-[#FFBC57]" }),
						"Consejo: selecciona un objeto en la lista de la izquierda y arrástralo hasta la escena para crear una instancia; luego abre la hoja de",
						" ",
						/* @__PURE__ */ jsx("span", {
							className: "text-foreground",
							children: S.eventsTab
						}),
						" para añadirle comportamiento.",
						/* @__PURE__ */ jsxs("a", {
							href: "https://gdevelop.io/docs",
							target: "_blank",
							rel: "noreferrer",
							className: "ml-auto flex items-center gap-1 text-link hover:text-link-hover",
							children: [/* @__PURE__ */ jsx(BookOpen, { className: "h-3.5 w-3.5" }), " Documentación"]
						})
					]
				})
			]
		})
	});
}
//#endregion
//#region src/components/editor/MobileBottomBar.tsx
var ITEMS = [
	{
		key: "objects",
		label: S.objects,
		icon: Box
	},
	{
		key: "groups",
		label: S.objectGroups,
		icon: Boxes
	},
	{
		key: "properties",
		label: S.properties,
		icon: PenLine
	},
	{
		key: "instances",
		label: S.instances,
		icon: ListTree
	},
	{
		key: "layers",
		label: S.layers,
		icon: Layers
	}
];
var MIN_VH = 25;
var MAX_VH = 90;
var DEFAULT_VH = 65;
var STORAGE_KEY = "nexus-engine:mobile-panel-height";
var LEGACY_STORAGE_KEY = "gdevelop:panel-height";
function clampVh(value) {
	return Math.min(MAX_VH, Math.max(MIN_VH, Math.round(value)));
}
function readStoredHeight() {
	if (typeof window === "undefined") return DEFAULT_VH;
	const raw = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
	if (!raw) return DEFAULT_VH;
	const value = Number(raw);
	return Number.isFinite(value) ? clampVh(value) : DEFAULT_VH;
}
function MobileBottomBar() {
	const { dispatch } = useEditor();
	const [open, setOpen] = React.useState(null);
	const [heightVh, setHeightVh] = React.useState(DEFAULT_VH);
	const [dragging, setDragging] = React.useState(false);
	const dragState = React.useRef(null);
	const heightRef = React.useRef(heightVh);
	heightRef.current = heightVh;
	React.useEffect(() => {
		setHeightVh(readStoredHeight());
	}, []);
	const onMove = React.useCallback((event) => {
		const start = dragState.current;
		if (!start) return;
		event.preventDefault();
		const nextHeightPx = start.startVh / 100 * window.innerHeight - (event.clientY - start.startY);
		setHeightVh(clampVh(nextHeightPx / window.innerHeight * 100));
	}, []);
	const endDrag = React.useCallback(() => {
		if (!dragState.current) return;
		dragState.current = null;
		setDragging(false);
		window.removeEventListener("pointermove", onMove);
		window.removeEventListener("pointerup", endDrag);
		window.removeEventListener("pointercancel", endDrag);
		window.localStorage.setItem(STORAGE_KEY, String(clampVh(heightRef.current)));
	}, [onMove]);
	React.useEffect(() => () => {
		window.removeEventListener("pointermove", onMove);
		window.removeEventListener("pointerup", endDrag);
		window.removeEventListener("pointercancel", endDrag);
	}, [endDrag, onMove]);
	const onHandlePointerDown = (event) => {
		event.preventDefault();
		setDragging(true);
		dragState.current = {
			startY: event.clientY,
			startVh: heightRef.current
		};
		window.addEventListener("pointermove", onMove, { passive: false });
		window.addEventListener("pointerup", endDrag);
		window.addEventListener("pointercancel", endDrag);
	};
	const resetHeight = () => {
		setHeightVh(DEFAULT_VH);
		window.localStorage.setItem(STORAGE_KEY, String(DEFAULT_VH));
	};
	const select = (key) => {
		if (key === "properties" || key === "instances" || key === "layers") dispatch({
			type: "ui",
			patch: {
				rightTab: key,
				...key === "properties" ? { showPropertiesPanel: true } : {},
				...key === "instances" ? { showInstancesPanel: true } : {},
				...key === "layers" ? { showLayersPanel: true } : {}
			}
		});
		setOpen((current) => current === key ? null : key);
	};
	const closePanel = React.useCallback(() => setOpen(null), []);
	const title = ITEMS.find((item) => item.key === open)?.label ?? S.properties;
	return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("nav", {
		"aria-label": "Herramientas del editor de escena",
		"data-editor-mobile-dock": "permanent",
		className: "fixed inset-x-0 bottom-0 z-40 flex h-[var(--mobile-editor-dock-height)] items-stretch border-t border-separator bg-toolbar pb-[env(safe-area-inset-bottom)] md:hidden",
		children: ITEMS.map(({ key, label, icon: Icon }) => /* @__PURE__ */ jsxs("button", {
			type: "button",
			"aria-label": label,
			"aria-controls": "mobile-editor-drawer",
			"aria-expanded": open === key,
			"aria-pressed": open === key,
			onClick: () => select(key),
			className: cn("relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 text-[8px] font-medium uppercase tracking-tight transition-colors", open === key ? "bg-[#32323B] text-link" : "text-muted-foreground active:bg-elevated"),
			children: [
				/* @__PURE__ */ jsx("span", {
					"aria-hidden": true,
					className: cn("absolute inset-x-2 top-0 h-0.5 rounded-full bg-transparent", open === key && "bg-[#8AD6FF]")
				}),
				/* @__PURE__ */ jsx(Icon, { className: "h-5 w-5 shrink-0" }),
				/* @__PURE__ */ jsx("span", {
					className: "w-full truncate",
					children: label
				})
			]
		}, key))
	}), /* @__PURE__ */ jsx(Sheet, {
		open: open !== null,
		modal: false,
		onOpenChange: (value) => !value && closePanel(),
		children: /* @__PURE__ */ jsxs(SheetContent, {
			id: "mobile-editor-drawer",
			side: "bottom",
			hideCloseButton: true,
			overlayClassName: "bottom-[var(--mobile-editor-dock-height)] z-20 bg-black/55 md:hidden",
			className: cn("bottom-[var(--mobile-editor-dock-height)] z-30 flex max-h-[calc(100dvh-var(--mobile-editor-dock-height)-2rem)] flex-col gap-0 border-separator bg-toolbar p-0 text-foreground md:hidden", dragging && "transition-none data-[state=open]:animate-none"),
			style: { height: `min(${heightVh}dvh, calc(100dvh - var(--mobile-editor-dock-height) - 2rem))` },
			children: [
				/* @__PURE__ */ jsx(SheetTitle, {
					className: "sr-only",
					children: title
				}),
				/* @__PURE__ */ jsx(SheetDescription, {
					className: "sr-only",
					children: "Panel superpuesto del editor. Arrastra el control superior para cambiar su altura."
				}),
				/* @__PURE__ */ jsx("div", {
					role: "separator",
					"aria-orientation": "horizontal",
					"aria-label": "Cambiar la altura del panel",
					onPointerDown: onHandlePointerDown,
					onDoubleClick: resetHeight,
					className: cn("flex h-9 shrink-0 cursor-grab touch-none select-none items-center justify-center border-b border-separator", dragging && "cursor-grabbing"),
					children: /* @__PURE__ */ jsx("span", { className: "h-1.5 w-10 rounded-full bg-muted-foreground/50" })
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "flex min-h-0 flex-1 overflow-hidden [&>div]:min-h-0 [&>div]:w-full [&>section]:h-full [&>section]:w-full [&>section]:border-0",
					children: [
						open === "objects" ? /* @__PURE__ */ jsx(ObjectsPanel, { onClose: closePanel }) : null,
						open === "groups" ? /* @__PURE__ */ jsx(GroupsPanel, {
							standalone: true,
							onClose: closePanel
						}) : null,
						open === "properties" ? /* @__PURE__ */ jsx(PropertiesPanel, {}) : null,
						open === "instances" ? /* @__PURE__ */ jsx(InstancesPanel, { onClose: closePanel }) : null,
						open === "layers" ? /* @__PURE__ */ jsx(LayersPanel, { onClose: closePanel }) : null
					]
				})
			]
		})
	})] });
}
//#endregion
//#region src/components/editor/NewObjectDialog.tsx
function NewObjectDialog() {
	const { scene, project, dispatch, ui } = useEditor();
	const open = ui.dialog?.name === "newObject";
	const [query, setQuery] = React.useState("");
	const [selectedId, setSelectedId] = React.useState(OBJECT_TYPES[0]?.typeId ?? "Sprite");
	const [autoName, setAutoName] = React.useState(true);
	const [name, setName] = React.useState("");
	const selected = OBJECT_TYPES.find((type) => type.typeId === selectedId) ?? OBJECT_TYPES[0];
	const taken = scene.objects.map((object) => object.name);
	const suggested = selected ? newNameGenerator(sanitizeName(selected.name), taken) : "Objeto";
	const finalName = (name.trim() || suggested).trim();
	React.useEffect(() => {
		if (!open) {
			setQuery("");
			setName("");
			setAutoName(true);
			setSelectedId(OBJECT_TYPES[0]?.typeId ?? "Sprite");
		}
	}, [open]);
	const results = OBJECT_TYPES.filter((type) => !query || type.name.toLowerCase().includes(query.toLowerCase()) || type.description.toLowerCase().includes(query.toLowerCase()));
	const create = () => {
		if (!selected) return;
		const firstImage = project.resources.filter((resource) => resource.kind === "image")[0]?.name;
		const id = `obj-${Math.random().toString(36).slice(2, 9)}`;
		dispatch({
			type: "addObject",
			object: {
				id,
				name: finalName,
				type: objectTypeId(selected.typeId),
				...isSpriteLike(selected.typeId) && firstImage ? { asset: firstImage } : {},
				...isSpriteLike(selected.typeId) ? { animations: [{
					name: "Idle",
					images: firstImage ? [{
						image: firstImage,
						originX: 0,
						originY: 0,
						centerX: 0,
						centerY: 0,
						opacity: 255
					}] : [],
					timeBetweenFrames: 0,
					loops: true,
					points: []
				}] } : {},
				...isTextLike(selected.typeId) ? {
					text: "Texto",
					textSize: 32,
					textColor: "250;250;250",
					alignment: "left"
				} : {},
				behaviors: [],
				effects: [],
				variables: []
			}
		});
		dispatch({ type: "closeDialog" });
		if (isSpriteLike(selected.typeId) || isTextLike(selected.typeId)) dispatch({
			type: "openDialog",
			dialog: {
				name: "objectEditor",
				objectId: id
			}
		});
	};
	return /* @__PURE__ */ jsx(GdDialog, {
		open,
		onClose: () => dispatch({ type: "closeDialog" }),
		title: S.addObjectSearch,
		width: "max-w-3xl",
		footer: /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(GdButton, {
			onClick: () => dispatch({ type: "closeDialog" }),
			children: S.cancel
		}), /* @__PURE__ */ jsx(GdButton, {
			variant: "raised",
			primary: true,
			disabled: !selected,
			onClick: create,
			children: `Crear un objeto «${selected?.name ?? ""}»`
		})] }),
		children: /* @__PURE__ */ jsxs("div", {
			className: "grid md:grid-cols-[minmax(0,1fr)_260px]",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "border-b border-separator md:border-b-0 md:border-r",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-2 border-b border-separator px-2 py-1.5",
					children: [/* @__PURE__ */ jsx(Search, { className: "h-3.5 w-3.5 shrink-0 text-text-secondary" }), /* @__PURE__ */ jsx("input", {
						autoFocus: true,
						value: query,
						onChange: (event) => setQuery(event.target.value),
						placeholder: S.addObjectSearch,
						className: "h-7 w-full min-w-0 bg-transparent text-[12.5px] outline-none placeholder:text-text-placeholder"
					})]
				}), /* @__PURE__ */ jsx("div", {
					className: "max-h-[46vh] overflow-y-auto",
					children: results.map((type) => /* @__PURE__ */ jsxs("button", {
						type: "button",
						onClick: () => setSelectedId(type.typeId),
						onDoubleClick: create,
						className: cn("flex w-full items-center gap-2 border-b border-separator/60 px-2.5 py-2 text-left hover:bg-list-hover", selectedId === type.typeId && "bg-[#3D4D51]"),
						children: [
							/* @__PURE__ */ jsx(CatalogIcon, {
								name: type.icon,
								className: cn("h-5 w-5 shrink-0", selectedId === type.typeId ? "text-[#E5C07B]" : "text-[#C9B6FC]")
							}),
							/* @__PURE__ */ jsxs("span", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ jsx("span", {
									className: cn("block truncate text-[13px]", selectedId === type.typeId ? "text-[#E5C07B]" : "text-foreground"),
									children: type.name
								}), /* @__PURE__ */ jsx("span", {
									className: "block truncate text-[11px] text-text-secondary",
									children: type.description
								})]
							}),
							type.installable ? /* @__PURE__ */ jsx("span", {
								className: "shrink-0 rounded bg-elevated px-1 text-[10px] text-text-secondary",
								children: "extensión"
							}) : null
						]
					}, type.typeId))
				})]
			}), /* @__PURE__ */ jsxs("div", {
				className: "p-3",
				children: [
					/* @__PURE__ */ jsx("label", {
						className: "block text-[11px] uppercase tracking-wide text-text-secondary",
						children: S.name
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "mt-1 flex items-center gap-1",
						children: [/* @__PURE__ */ jsx("input", {
							value: autoName ? suggested : name,
							onChange: (event) => {
								setAutoName(false);
								setName(event.target.value);
							},
							className: cn("h-8 min-w-0 flex-1 rounded border px-2 text-[12.5px] outline-none", taken.includes(finalName) ? "border-[#FE6C46] bg-[rgba(254,108,70,0.15)]" : "border-separator bg-[#1D1D26] focus:border-[var(--brand-light)]")
						}), autoName ? null : /* @__PURE__ */ jsx("button", {
							type: "button",
							onClick: () => {
								setAutoName(true);
								setName("");
							},
							className: "h-8 shrink-0 rounded px-1.5 text-[11px] text-text-secondary hover:bg-elevated",
							title: "Usar el nombre sugerido",
							children: "auto"
						})]
					}),
					taken.includes(finalName) ? /* @__PURE__ */ jsx("p", {
						className: "mt-1 text-[11px] text-[#FFB4A2]",
						children: "Ya existe un objeto con este nombre."
					}) : null,
					selected ? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("div", {
						className: "mt-3 flex h-24 items-center justify-center rounded border border-separator bg-[#101017]",
						children: isSpriteLike(selected.typeId) && project.resources[0] ? /* @__PURE__ */ jsx("img", {
							src: resolveAsset(project.resources[0].file, project.resources) ?? project.resources[0].file,
							alt: "",
							className: "max-h-20 max-w-full object-contain [image-rendering:pixelated]"
						}) : /* @__PURE__ */ jsx(CatalogIcon, {
							name: selected.icon,
							className: "h-9 w-9 text-[#C9B6FC]"
						})
					}), /* @__PURE__ */ jsx("p", {
						className: "mt-2 text-[12px] leading-snug text-text-secondary",
						children: selected.description
					})] }) : null
				]
			})]
		})
	});
}
var sanitizeName = (label) => label.replace(/[^\p{L}\p{N}]+/gu, "").slice(0, 24).replace(/^./, (first) => first.toUpperCase());
//#endregion
//#region src/components/editor/ObjectEditorDialog.tsx
function ObjectEditorDialog() {
	const { scene, project, dispatch, ui } = useEditor();
	const objectId = ui.dialog?.name === "objectEditor" ? ui.dialog.objectId : null;
	const object = objectId ? scene.objects.find((o) => o.id === objectId) : void 0;
	const [panel, setPanel] = React.useState("sprites");
	const [animationIndex, setAnimationIndex] = React.useState(0);
	const [frameIndex, setFrameIndex] = React.useState(0);
	React.useEffect(() => {
		setAnimationIndex(0);
		setFrameIndex(0);
		setPanel("sprites");
	}, [objectId]);
	const close = () => dispatch({ type: "closeDialog" });
	if (!object || !objectId) return null;
	const animations = object.animations ?? [];
	const animation = animations[animationIndex];
	const hasAnimations = isSpriteLike(object.type);
	const patchObject = (patch) => dispatch({
		type: "updateObject",
		id: object.id,
		patch
	});
	return /* @__PURE__ */ jsx(GdDialog, {
		open: true,
		onClose: close,
		title: `${S.editObject} — ${object.name}`,
		width: "max-w-[min(1180px,97vw)]",
		helpPath: "https://gdevelop.io/docs/getting-started/assets/object",
		footer: /* @__PURE__ */ jsxs(Fragment, { children: [
			/* @__PURE__ */ jsx(GdButton, {
				onClick: () => {
					close();
					dispatch({
						type: "openDialog",
						dialog: {
							name: "behaviors",
							objectId
						}
					});
				},
				icon: /* @__PURE__ */ jsx(Settings2, { className: "h-4 w-4" }),
				children: S.behaviors
			}),
			/* @__PURE__ */ jsx(GdButton, {
				onClick: () => {
					close();
					dispatch({
						type: "openDialog",
						dialog: {
							name: "effects",
							targetKind: "object",
							targetId: objectId
						}
					});
				},
				icon: /* @__PURE__ */ jsx(SquareDashed, { className: "h-4 w-4" }),
				children: S.effects
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "ml-auto flex gap-2",
				children: [/* @__PURE__ */ jsx(GdButton, {
					onClick: close,
					children: S.cancel
				}), /* @__PURE__ */ jsx(GdButton, {
					variant: "raised",
					primary: true,
					onClick: close,
					children: S.ok
				})]
			})
		] }),
		children: /* @__PURE__ */ jsxs("div", {
			className: "grid grid-cols-1 md:grid-cols-[190px_minmax(0,1fr)_280px]",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "flex flex-col border-b border-separator md:border-b-0 md:border-r",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-1 border-b border-separator px-1 py-1",
							children: [/* @__PURE__ */ jsx("button", {
								type: "button",
								"aria-label": "Volver",
								title: "Volver a la escena",
								onClick: close,
								className: "grid h-7 w-7 place-items-center rounded text-text-secondary hover:bg-elevated hover:text-foreground",
								children: /* @__PURE__ */ jsx(ChevronLeft, { className: "h-4 w-4" })
							}), /* @__PURE__ */ jsx("span", {
								className: "truncate text-[12px] font-semibold uppercase tracking-wide text-text-secondary",
								children: objectTypeLabel(object.type)
							})]
						}),
						/* @__PURE__ */ jsx("div", {
							className: "flex gap-1 border-b border-separator px-1 py-1",
							children: [
								{
									id: "sprites",
									label: hasAnimations ? "Sprites" : "Contenido",
									icon: Film
								},
								{
									id: "points",
									label: "Puntos",
									icon: Crosshair
								},
								{
									id: "masks",
									label: "Máscaras",
									icon: Ruler
								}
							].map((tab) => /* @__PURE__ */ jsxs("button", {
								type: "button",
								onClick: () => setPanel(tab.id),
								className: cn("flex flex-1 items-center justify-center gap-1 rounded px-1 py-1 text-[11px]", panel === tab.id ? "bg-[#494952] text-[#F6F2FF]" : "text-text-secondary hover:bg-list-hover"),
								title: tab.label,
								children: [/* @__PURE__ */ jsx(tab.icon, { className: "h-3.5 w-3.5" }), /* @__PURE__ */ jsx("span", {
									className: "hidden lg:inline",
									children: tab.label
								})]
							}, tab.id))
						}),
						/* @__PURE__ */ jsx("div", {
							className: "min-h-0 flex-1 overflow-y-auto p-1",
							children: hasAnimations ? /* @__PURE__ */ jsxs(Fragment, { children: [animations.map((entry, index) => /* @__PURE__ */ jsxs("div", {
								className: cn("group mb-px flex cursor-pointer items-center gap-1 rounded px-1.5 py-1.5 text-[12.5px] hover:bg-list-hover", animationIndex === index && "bg-selection"),
								onClick: () => {
									setAnimationIndex(index);
									setFrameIndex(0);
								},
								children: [/* @__PURE__ */ jsx("span", {
									className: "min-w-0 flex-1 truncate",
									children: entry.name
								}), /* @__PURE__ */ jsx("button", {
									type: "button",
									"aria-label": S.delete,
									onClick: (event) => {
										event.stopPropagation();
										dispatch({
											type: "deleteObjectAnimation",
											objectId,
											index
										});
										setAnimationIndex((value) => Math.max(0, value - 1));
									},
									className: "shrink-0 text-text-secondary opacity-0 hover:text-destructive group-hover:opacity-100",
									children: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" })
								})]
							}, `${entry.name}-${index}`)), /* @__PURE__ */ jsx(GdButton, {
								variant: "raised",
								primary: true,
								size: "small",
								className: "mt-1 w-full",
								icon: /* @__PURE__ */ jsx(Plus, { className: "h-3.5 w-3.5" }),
								onClick: () => {
									dispatch({
										type: "addObjectAnimation",
										objectId
									});
									setAnimationIndex(Math.max(0, animations.length));
								},
								children: S.addNewAnimation
							})] }) : /* @__PURE__ */ jsx("p", {
								className: "p-2 text-[12px] text-text-secondary",
								children: "Este tipo de objeto no usa animaciones. Edita sus propiedades a la derecha."
							})
						})
					]
				}),
				/* @__PURE__ */ jsx("div", {
					className: "min-h-[300px] p-2",
					children: hasAnimations ? animation ? /* @__PURE__ */ jsxs(Fragment, { children: [
						/* @__PURE__ */ jsxs("div", {
							className: "mb-2 flex items-center gap-2",
							children: [
								/* @__PURE__ */ jsxs("span", {
									className: "text-[12px] font-semibold uppercase tracking-wide text-text-secondary",
									children: [animation.name, " — fotogramas"]
								}),
								/* @__PURE__ */ jsx("span", {
									className: "text-[11px] text-text-placeholder",
									children: animation.images.length
								}),
								/* @__PURE__ */ jsx(GdButton, {
									size: "small",
									variant: "raised",
									className: "ml-auto",
									icon: /* @__PURE__ */ jsx(Plus, { className: "h-3.5 w-3.5" }),
									onClick: () => {
										dispatch({
											type: "addObjectFrame",
											objectId,
											animationIndex
										});
										setFrameIndex(animation.images.length);
									},
									children: "Añadir fotograma"
								})
							]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex min-h-32 flex-wrap gap-2 rounded border border-separator bg-[#101017] p-2",
							children: [animation.images.length === 0 ? /* @__PURE__ */ jsx("p", {
								className: "p-2 text-[12px] text-text-placeholder",
								children: "Añade fotogramas para que el sprite se dibuje."
							}) : null, animation.images.map((image, index) => {
								const url = resolveAsset(image.image, project.resources);
								return /* @__PURE__ */ jsxs("button", {
									type: "button",
									onClick: () => setFrameIndex(index),
									className: cn("group relative flex h-20 w-20 flex-col items-center justify-center gap-1 rounded border bg-[#1D1D26] p-1", frameIndex === index ? "border-[#4AB0E4]" : "border-separator hover:border-[var(--brand-light)]"),
									title: image.image,
									children: [
										url ? /* @__PURE__ */ jsx("img", {
											src: url,
											alt: "",
											className: "max-h-12 max-w-full object-contain [image-rendering:pixelated]",
											draggable: false
										}) : /* @__PURE__ */ jsx(Image$1, { className: "h-6 w-6 text-text-placeholder" }),
										/* @__PURE__ */ jsxs("span", {
											className: "w-full truncate text-[10px] text-text-secondary",
											children: [
												index + 1,
												". ",
												image.image
											]
										}),
										/* @__PURE__ */ jsx("span", {
											role: "button",
											tabIndex: -1,
											"aria-label": S.delete,
											onClick: (event) => {
												event.stopPropagation();
												dispatch({
													type: "deleteObjectFrame",
													objectId,
													animationIndex,
													frameIndex: index
												});
												setFrameIndex((value) => Math.max(0, Math.min(value, animation.images.length - 2)));
											},
											className: "absolute right-0.5 top-0.5 hidden h-4 w-4 place-items-center rounded bg-[#25252E] text-text-secondary group-hover:grid hover:text-destructive",
											children: /* @__PURE__ */ jsx(Trash2, { className: "h-3 w-3" })
										})
									]
								}, `${image.image}-${index}`);
							})]
						}),
						panel === "points" ? /* @__PURE__ */ jsx(PointsEditor, {
							objectId,
							animationIndex,
							points: animation.points
						}) : null,
						panel === "masks" ? /* @__PURE__ */ jsx(MaskEditor, {
							frame: animation.images[frameIndex],
							animationIndex,
							objectId,
							frameIndex
						}) : null
					] }) : /* @__PURE__ */ jsxs("div", {
						className: "flex h-full min-h-40 flex-col items-center justify-center gap-2",
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-[12.5px] text-text-secondary",
							children: "El objeto todavía no tiene ninguna animación."
						}), /* @__PURE__ */ jsx(GdButton, {
							variant: "raised",
							primary: true,
							icon: /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
							onClick: () => dispatch({
								type: "addObjectAnimation",
								objectId
							}),
							children: S.addNewAnimation
						})]
					}) : isTextLike(object.type) ? /* @__PURE__ */ jsxs("div", {
						className: "rounded border border-[#32323B] bg-[#25252E] p-3",
						children: [
							/* @__PURE__ */ jsx("label", {
								className: "block text-[11px] uppercase tracking-wide text-text-secondary",
								children: "Texto"
							}),
							/* @__PURE__ */ jsx("textarea", {
								value: object.text ?? "",
								rows: 4,
								onChange: (event) => patchObject({ text: event.target.value }),
								className: "mt-1 w-full rounded border border-separator bg-[#1D1D26] p-2 text-[16px] text-foreground outline-none focus:border-[var(--brand-light)]"
							}),
							/* @__PURE__ */ jsx("div", {
								className: "mt-3 flex items-end justify-center rounded border border-separator bg-[#101017] p-6",
								children: /* @__PURE__ */ jsx("span", {
									style: {
										fontSize: Math.max(6, object.textSize ?? 24),
										color: hexFromTriplet(object.textColor),
										fontWeight: object.bold ? 700 : 400,
										fontStyle: object.italic ? "italic" : "normal"
									},
									children: object.text || "Texto"
								})
							})
						]
					}) : /* @__PURE__ */ jsxs("div", {
						className: "flex h-full min-h-40 items-center justify-center p-6 text-center text-[12.5px] text-text-secondary",
						children: [
							"Este objeto no tiene vista previa editable en el editor de ",
							S.home,
							"."
						]
					})
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "border-l border-separator p-1",
					children: [
						/* @__PURE__ */ jsxs(PropertySection, {
							title: S.name,
							children: [
								/* @__PURE__ */ jsx(FieldRow, {
									label: S.name,
									children: /* @__PURE__ */ jsx(TextField, {
										value: object.name,
										onChange: (name) => name && dispatch({
											type: "renameObject",
											id: object.id,
											name
										})
									})
								}),
								/* @__PURE__ */ jsx(FieldRow, {
									label: S.type,
									children: /* @__PURE__ */ jsx(ChoiceField, {
										value: object.type,
										options: OBJECT_TYPES.map((type) => type.typeId),
										labels: Object.fromEntries(OBJECT_TYPES.map((type) => [type.typeId, type.name])),
										onChange: (type) => patchObject({ type })
									})
								}),
								!hasAnimations ? /* @__PURE__ */ jsx(FieldRow, {
									label: S.resource,
									children: /* @__PURE__ */ jsx(ChoiceField, {
										value: object.asset ?? "",
										options: ["", ...project.resources.filter((r) => r.kind === "image").map((r) => r.name)],
										onChange: (asset) => patchObject({ asset })
									})
								}) : null
							]
						}),
						isTextLike(object.type) ? /* @__PURE__ */ jsxs(PropertySection, {
							title: "Texto",
							children: [
								/* @__PURE__ */ jsx(FieldRow, {
									label: "Tamaño",
									children: /* @__PURE__ */ jsx(NumberField, {
										value: object.textSize ?? 24,
										onChange: (textSize) => patchObject({ textSize: Math.max(1, textSize) })
									})
								}),
								/* @__PURE__ */ jsx(FieldRow, {
									label: S.color,
									children: /* @__PURE__ */ jsx(ColorField, {
										value: object.textColor ?? "250;250;250",
										onChange: (textColor) => patchObject({ textColor })
									})
								}),
								/* @__PURE__ */ jsx(FieldRow, {
									label: "Alineación",
									children: /* @__PURE__ */ jsx(ChoiceField, {
										value: object.alignment ?? "left",
										options: [
											"left",
											"center",
											"right"
										],
										labels: {
											left: "Izquierda",
											center: "Centro",
											right: "Derecha"
										},
										onChange: (alignment) => patchObject({ alignment })
									})
								}),
								/* @__PURE__ */ jsx(FieldRow, {
									label: "Negrita",
									children: /* @__PURE__ */ jsx(ToggleField, {
										checked: !!object.bold,
										onChange: (bold) => patchObject({ bold }),
										label: "Negrita"
									})
								}),
								/* @__PURE__ */ jsx(FieldRow, {
									label: "Cursiva",
									children: /* @__PURE__ */ jsx(ToggleField, {
										checked: !!object.italic,
										onChange: (italic) => patchObject({ italic }),
										label: "Cursiva"
									})
								}),
								/* @__PURE__ */ jsx(FieldRow, {
									label: "Ajuste de línea",
									children: /* @__PURE__ */ jsx(ToggleField, {
										checked: !!object.wrapping,
										onChange: (wrapping) => patchObject({ wrapping }),
										label: "Ajuste de línea"
									})
								})
							]
						}) : null,
						hasAnimations && animation ? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsxs(PropertySection, {
							title: "Animación",
							children: [
								/* @__PURE__ */ jsx(FieldRow, {
									label: "Nombre",
									children: /* @__PURE__ */ jsx(TextField, {
										value: animation.name,
										onChange: (name) => dispatch({
											type: "updateObjectAnimation",
											objectId,
											index: animationIndex,
											patch: { name }
										})
									})
								}),
								/* @__PURE__ */ jsx(FieldRow, {
									label: "Velocidad (ms)",
									children: /* @__PURE__ */ jsx(NumberField, {
										value: animation.timeBetweenFrames,
										onChange: (timeBetweenFrames) => dispatch({
											type: "updateObjectAnimation",
											objectId,
											index: animationIndex,
											patch: { timeBetweenFrames: Math.max(0, timeBetweenFrames) }
										})
									})
								}),
								/* @__PURE__ */ jsx(FieldRow, {
									label: "Repetir",
									children: /* @__PURE__ */ jsx(ToggleField, {
										checked: animation.loops,
										label: "Repetir",
										onChange: (loops) => dispatch({
											type: "updateObjectAnimation",
											objectId,
											index: animationIndex,
											patch: { loops }
										})
									})
								})
							]
						}), animation.images[frameIndex] ? /* @__PURE__ */ jsxs(PropertySection, {
							title: `Fotograma ${frameIndex + 1}`,
							children: [
								/* @__PURE__ */ jsx(FieldRow, {
									label: S.resource,
									children: /* @__PURE__ */ jsx(ChoiceField, {
										value: animation.images[frameIndex]?.image ?? "",
										options: project.resources.filter((r) => r.kind === "image").map((r) => r.name),
										onChange: (image) => dispatch({
											type: "updateObjectFrame",
											objectId,
											animationIndex,
											frameIndex,
											patch: { image }
										})
									})
								}),
								/* @__PURE__ */ jsx(FieldRow, {
									label: "Origen X",
									children: /* @__PURE__ */ jsx(NumberField, {
										value: animation.images[frameIndex]?.originX ?? 0,
										onChange: (originX) => dispatch({
											type: "updateObjectFrame",
											objectId,
											animationIndex,
											frameIndex,
											patch: { originX }
										})
									})
								}),
								/* @__PURE__ */ jsx(FieldRow, {
									label: "Origen Y",
									children: /* @__PURE__ */ jsx(NumberField, {
										value: animation.images[frameIndex]?.originY ?? 0,
										onChange: (originY) => dispatch({
											type: "updateObjectFrame",
											objectId,
											animationIndex,
											frameIndex,
											patch: { originY }
										})
									})
								}),
								/* @__PURE__ */ jsx(FieldRow, {
									label: "Centro X",
									children: /* @__PURE__ */ jsx(NumberField, {
										value: animation.images[frameIndex]?.centerX ?? 0,
										onChange: (centerX) => dispatch({
											type: "updateObjectFrame",
											objectId,
											animationIndex,
											frameIndex,
											patch: { centerX }
										})
									})
								}),
								/* @__PURE__ */ jsx(FieldRow, {
									label: "Centro Y",
									children: /* @__PURE__ */ jsx(NumberField, {
										value: animation.images[frameIndex]?.centerY ?? 0,
										onChange: (centerY) => dispatch({
											type: "updateObjectFrame",
											objectId,
											animationIndex,
											frameIndex,
											patch: { centerY }
										})
									})
								}),
								/* @__PURE__ */ jsx(FieldRow, {
									label: S.opacity,
									children: /* @__PURE__ */ jsx(NumberField, {
										value: animation.images[frameIndex]?.opacity ?? 255,
										onChange: (opacity) => dispatch({
											type: "updateObjectFrame",
											objectId,
											animationIndex,
											frameIndex,
											patch: { opacity: Math.max(0, Math.min(255, opacity)) }
										})
									})
								})
							]
						}) : null] }) : null
					]
				})
			]
		})
	});
}
function PointsEditor({ objectId, animationIndex, points }) {
	const { dispatch } = useEditor();
	return /* @__PURE__ */ jsxs("div", {
		className: "mt-3 rounded border border-separator",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-2 border-b border-separator bg-[#25252E] px-2 py-1",
				children: [/* @__PURE__ */ jsx("span", {
					className: "flex-1 text-[11px] font-semibold uppercase tracking-wide text-[#D6DEEC]",
					children: "Puntos personalizados"
				}), /* @__PURE__ */ jsx(GdButton, {
					size: "small",
					variant: "raised",
					icon: /* @__PURE__ */ jsx(Plus, { className: "h-3.5 w-3.5" }),
					onClick: () => dispatch({
						type: "addObjectPoint",
						objectId,
						animationIndex
					}),
					children: "Añadir punto"
				})]
			}),
			points.length === 0 ? /* @__PURE__ */ jsx("p", {
				className: "px-2 py-1.5 text-[12px] text-text-secondary",
				children: "Añade puntos (origen, centro, o los que quieras) para colocar instancias o dirigir proyectiles."
			}) : null,
			points.map((point, index) => /* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-1 px-2 py-1",
				children: [
					/* @__PURE__ */ jsx("input", {
						value: point.name,
						"aria-label": "Nombre del punto",
						onChange: (event) => dispatch({
							type: "updateObjectPoint",
							objectId,
							animationIndex,
							pointIndex: index,
							patch: { name: event.target.value }
						}),
						className: "h-7 w-32 rounded border border-separator bg-[#1D1D26] px-1 text-[12px] outline-none focus:border-[var(--brand-light)]"
					}),
					/* @__PURE__ */ jsx("span", {
						className: "text-[11px] text-text-secondary",
						children: "X"
					}),
					/* @__PURE__ */ jsx("input", {
						type: "number",
						value: point.x,
						"aria-label": "X del punto",
						onChange: (event) => dispatch({
							type: "updateObjectPoint",
							objectId,
							animationIndex,
							pointIndex: index,
							patch: { x: Number(event.target.value) }
						}),
						className: "h-7 w-16 rounded border border-separator bg-[#1D1D26] px-1 text-[12px] tabular-nums outline-none focus:border-[var(--brand-light)]"
					}),
					/* @__PURE__ */ jsx("span", {
						className: "text-[11px] text-text-secondary",
						children: "Y"
					}),
					/* @__PURE__ */ jsx("input", {
						type: "number",
						value: point.y,
						"aria-label": "Y del punto",
						onChange: (event) => dispatch({
							type: "updateObjectPoint",
							objectId,
							animationIndex,
							pointIndex: index,
							patch: { y: Number(event.target.value) }
						}),
						className: "h-7 w-16 rounded border border-separator bg-[#1D1D26] px-1 text-[12px] tabular-nums outline-none focus:border-[var(--brand-light)]"
					}),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						"aria-label": S.delete,
						onClick: () => dispatch({
							type: "updateObjectAnimation",
							objectId,
							index: animationIndex,
							patch: { points: points.filter((_, i) => i !== index) }
						}),
						className: "ml-auto grid h-6 w-6 place-items-center rounded text-text-secondary hover:text-destructive",
						children: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" })
					})
				]
			}, `${point.name}-${index}`))
		]
	});
}
function MaskEditor({ frame, objectId, animationIndex, frameIndex }) {
	const { dispatch, project } = useEditor();
	const url = resolveAsset(frame?.image, project.resources);
	if (!frame) return /* @__PURE__ */ jsx("p", {
		className: "mt-3 rounded border border-separator p-2 text-[12px] text-text-secondary",
		children: "Selecciona un fotograma para editar su máscara de colisión."
	});
	const hitBox = frame.hitBox;
	const update = (patch) => {
		if (!hitBox) return;
		const next = {
			...hitBox,
			...patch,
			source: "manual"
		};
		next.width = Math.max(1, Number.isFinite(next.width) ? next.width : hitBox.width);
		next.height = Math.max(1, Number.isFinite(next.height) ? next.height : hitBox.height);
		if (next.referenceWidth !== void 0) next.referenceWidth = Math.max(1, next.referenceWidth);
		if (next.referenceHeight !== void 0) next.referenceHeight = Math.max(1, next.referenceHeight);
		if (next.kind === "rectangle") next.vertices = [
			{
				x: next.x,
				y: next.y
			},
			{
				x: next.x + next.width,
				y: next.y
			},
			{
				x: next.x + next.width,
				y: next.y + next.height
			},
			{
				x: next.x,
				y: next.y + next.height
			}
		];
		dispatch({
			type: "updateObjectFrame",
			objectId,
			animationIndex,
			frameIndex,
			patch: { hitBox: next }
		});
	};
	const enable = () => {
		dispatch({
			type: "updateObjectFrame",
			objectId,
			animationIndex,
			frameIndex,
			patch: { hitBox: {
				kind: "rectangle",
				x: 0,
				y: 0,
				width: 64,
				height: 64,
				referenceWidth: 64,
				referenceHeight: 64,
				vertices: [
					{
						x: 0,
						y: 0
					},
					{
						x: 64,
						y: 0
					},
					{
						x: 64,
						y: 64
					},
					{
						x: 0,
						y: 64
					}
				],
				source: "manual"
			} }
		});
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "mt-3 rounded border border-separator",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex items-center border-b border-separator bg-[#25252E] px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#D6DEEC]",
			children: [
				"Máscara de colisión editable",
				hitBox?.source === "detected" ? /* @__PURE__ */ jsx("span", {
					className: "ml-2 rounded bg-[#3D4D51] px-1.5 py-0.5 text-[9px] normal-case text-[#8AD6FF]",
					children: "sugerida automáticamente"
				}) : null,
				/* @__PURE__ */ jsx("button", {
					type: "button",
					onClick: () => hitBox ? dispatch({
						type: "updateObjectFrame",
						objectId,
						animationIndex,
						frameIndex,
						patch: { hitBox: void 0 }
					}) : enable(),
					className: "ml-auto rounded bg-elevated px-2 py-0.5 text-[10px] normal-case text-foreground hover:bg-selection",
					children: hitBox ? "Usar caja completa" : "Crear máscara personalizada"
				})
			]
		}), /* @__PURE__ */ jsxs("div", {
			className: "flex flex-wrap items-start gap-3 p-2",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "relative grid h-36 w-36 shrink-0 place-items-center overflow-hidden rounded border border-separator bg-[#101017] p-2",
				children: [url ? /* @__PURE__ */ jsx("img", {
					src: url,
					alt: "",
					className: "max-h-full max-w-full object-contain [image-rendering:pixelated]"
				}) : /* @__PURE__ */ jsx("div", {
					className: "grid h-20 w-20 place-items-center text-[11px] text-text-placeholder",
					children: "sin imagen"
				}), hitBox ? /* @__PURE__ */ jsx("svg", {
					viewBox: `0 0 ${hitBox.referenceWidth ?? Math.max(1, hitBox.x + hitBox.width)} ${hitBox.referenceHeight ?? Math.max(1, hitBox.y + hitBox.height)}`,
					preserveAspectRatio: "xMidYMid meet",
					className: "pointer-events-none absolute inset-2 h-[calc(100%_-_1rem)] w-[calc(100%_-_1rem)]",
					"aria-hidden": "true",
					children: /* @__PURE__ */ jsx("polygon", {
						points: (hitBox.kind === "polygon" && hitBox.vertices.length >= 3 ? hitBox.vertices : [
							{
								x: hitBox.x,
								y: hitBox.y
							},
							{
								x: hitBox.x + hitBox.width,
								y: hitBox.y
							},
							{
								x: hitBox.x + hitBox.width,
								y: hitBox.y + hitBox.height
							},
							{
								x: hitBox.x,
								y: hitBox.y + hitBox.height
							}
						]).map((point) => `${point.x},${point.y}`).join(" "),
						fill: "rgba(255,133,237,0.15)",
						stroke: "#FF85ED",
						vectorEffect: "non-scaling-stroke"
					})
				}) : null]
			}), /* @__PURE__ */ jsx("div", {
				className: "min-w-60 flex-1 text-[12px] text-text-secondary",
				children: !hitBox ? /* @__PURE__ */ jsx("p", { children: "El motor usa la caja completa. Crea una máscara para ajustar manualmente las dimensiones o sus vértices; los resultados generados por IA aparecen aquí también." }) : /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsxs("div", {
					className: "grid grid-cols-2 gap-2 sm:grid-cols-3",
					children: [/* @__PURE__ */ jsxs("label", {
						className: "text-[11px]",
						children: ["Forma", /* @__PURE__ */ jsxs("select", {
							value: hitBox.kind,
							onChange: (event) => update({ kind: event.target.value }),
							className: "mt-0.5 h-7 w-full rounded border border-separator bg-[#1D1D26] px-1 text-foreground",
							children: [/* @__PURE__ */ jsx("option", {
								value: "rectangle",
								children: "Rectángulo"
							}), /* @__PURE__ */ jsx("option", {
								value: "polygon",
								children: "Polígono convexo"
							})]
						})]
					}), [
						["x", "X"],
						["y", "Y"],
						["width", "Ancho"],
						["height", "Alto"],
						["referenceWidth", "Ancho fuente"],
						["referenceHeight", "Alto fuente"]
					].map(([key, label]) => /* @__PURE__ */ jsxs("label", {
						className: "text-[11px]",
						children: [label, /* @__PURE__ */ jsx("input", {
							type: "number",
							min: key === "width" || key === "height" ? 1 : void 0,
							value: hitBox[key] ?? (key.includes("Width") ? hitBox.width : hitBox.height),
							onChange: (event) => update({ [key]: Number(event.target.value) }),
							className: "mt-0.5 h-7 w-full rounded border border-separator bg-[#1D1D26] px-1 tabular-nums text-foreground outline-none focus:border-[var(--brand-light)]"
						})]
					}, key))]
				}), hitBox.kind === "polygon" ? /* @__PURE__ */ jsxs("div", {
					className: "mt-2 rounded border border-separator p-1.5",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "mb-1 flex items-center text-[10.5px] font-medium uppercase tracking-wide text-[#D6DEEC]",
						children: ["Vértices", /* @__PURE__ */ jsxs("button", {
							type: "button",
							onClick: () => update({ vertices: [...hitBox.vertices, {
								x: ((hitBox.vertices.at(-1)?.x ?? hitBox.x) + (hitBox.vertices[0]?.x ?? hitBox.x + hitBox.width)) / 2,
								y: ((hitBox.vertices.at(-1)?.y ?? hitBox.y) + (hitBox.vertices[0]?.y ?? hitBox.y)) / 2
							}] }),
							className: "ml-auto flex items-center gap-1 rounded bg-elevated px-1.5 py-0.5 normal-case text-foreground",
							children: [/* @__PURE__ */ jsx(Plus, { className: "h-3 w-3" }), " Añadir"]
						})]
					}), /* @__PURE__ */ jsx("div", {
						className: "grid max-h-28 gap-1 overflow-y-auto sm:grid-cols-2",
						children: hitBox.vertices.map((point, index) => /* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-1",
							children: [
								/* @__PURE__ */ jsx("span", {
									className: "w-4 text-[10px] text-text-placeholder",
									children: index + 1
								}),
								/* @__PURE__ */ jsx("input", {
									type: "number",
									"aria-label": `X del vértice ${index + 1}`,
									value: point.x,
									onChange: (event) => update({ vertices: hitBox.vertices.map((candidate, pointIndex) => pointIndex === index ? {
										...candidate,
										x: Number(event.target.value)
									} : candidate) }),
									className: "h-6 min-w-0 flex-1 rounded border border-separator bg-[#101017] px-1 text-foreground"
								}),
								/* @__PURE__ */ jsx("input", {
									type: "number",
									"aria-label": `Y del vértice ${index + 1}`,
									value: point.y,
									onChange: (event) => update({ vertices: hitBox.vertices.map((candidate, pointIndex) => pointIndex === index ? {
										...candidate,
										y: Number(event.target.value)
									} : candidate) }),
									className: "h-6 min-w-0 flex-1 rounded border border-separator bg-[#101017] px-1 text-foreground"
								}),
								/* @__PURE__ */ jsx("button", {
									type: "button",
									disabled: hitBox.vertices.length <= 3,
									onClick: () => update({ vertices: hitBox.vertices.filter((_, pointIndex) => pointIndex !== index) }),
									className: "text-text-secondary hover:text-destructive disabled:opacity-30",
									children: /* @__PURE__ */ jsx(Trash2, { className: "h-3 w-3" })
								})
							]
						}, index))
					})]
				}) : null] })
			})]
		})]
	});
}
var hexFromTriplet = (value) => {
	if (!value) return "#FAFAFA";
	if (value.startsWith("#")) return value;
	return `#${value.split(";").map((part) => Math.max(0, Math.min(255, Number(part) || 0))).map((part) => part.toString(16).padStart(2, "0")).join("")}`;
};
//#endregion
//#region src/components/editor/BehaviorsDialog.tsx
function BehaviorsDialog() {
	const { scene, dispatch, ui } = useEditor();
	const objectId = ui.dialog?.name === "behaviors" ? ui.dialog.objectId : null;
	const object = objectId ? scene.objects.find((o) => o.id === objectId) : void 0;
	const [picking, setPicking] = React.useState(false);
	const close = () => dispatch({ type: "closeDialog" });
	if (!object || !objectId) return null;
	return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(GdDialog, {
		open: true,
		onClose: close,
		title: `${S.behaviors} — ${object.name}`,
		width: "max-w-3xl",
		helpPath: "https://gdevelop.io/docs/getting-started/assets/behavior",
		footer: /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(GdButton, {
			variant: "raised",
			primary: true,
			icon: /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
			onClick: () => setPicking(true),
			children: S.addABehavior
		}), /* @__PURE__ */ jsx(GdButton, {
			variant: "raised",
			onClick: close,
			children: S.ok
		})] }),
		children: /* @__PURE__ */ jsxs("div", {
			className: "p-2",
			children: [object.behaviors.length === 0 ? /* @__PURE__ */ jsx("p", {
				className: "px-1 py-2 text-[12.5px] text-text-secondary",
				children: S.addYourFirstBehavior
			}) : null, object.behaviors.map((behavior) => /* @__PURE__ */ jsx(BehaviorCard, {
				objectId,
				behavior,
				onRemove: () => dispatch({
					type: "deleteBehavior",
					objectId,
					behaviorName: behavior.name
				})
			}, behavior.name))]
		})
	}), /* @__PURE__ */ jsx(BehaviorTypePicker, {
		open: picking,
		onClose: () => setPicking(false),
		onPick: (typeId) => {
			const definition = behaviorByTypeId(typeId);
			if (!definition) return;
			const properties = {};
			for (const property of definition.properties) properties[property.key] = property.value;
			dispatch({
				type: "addBehavior",
				objectId,
				behavior: {
					name: newNameGenerator(behaviorShortKey(definition.name), object.behaviors.map((b) => b.name)),
					type: definition.typeId,
					properties
				}
			});
			setPicking(false);
		},
		installed: object.behaviors.map((behavior) => behavior.type)
	})] });
}
var behaviorShortKey = (name) => name.replace(/[^\p{L}\p{N}]/gu, "").slice(0, 18).replace(/^./, (first) => first.toUpperCase());
function BehaviorCard({ objectId, behavior, onRemove }) {
	const { dispatch } = useEditor();
	const definition = behaviorByTypeId(behavior.type);
	const [open, setOpen] = React.useState(true);
	return /* @__PURE__ */ jsxs("div", {
		className: "mb-2 overflow-hidden rounded border border-[#32323B] bg-[#25252E]",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex items-center gap-2 px-2 py-1.5",
			children: [
				/* @__PURE__ */ jsx("button", {
					type: "button",
					"aria-expanded": open,
					"aria-label": open ? "Contraer" : "Expandir",
					onClick: () => setOpen((value) => !value),
					className: "grid h-5 w-5 place-items-center rounded text-[11px] text-text-secondary hover:bg-list-hover",
					children: open ? "▾" : "▸"
				}),
				/* @__PURE__ */ jsx(CatalogIcon, {
					name: BEHAVIOR_ICON[behavior.type] ?? "puzzle",
					className: "h-4 w-4 shrink-0 text-[#8AD6FF]"
				}),
				/* @__PURE__ */ jsx("input", {
					value: behavior.name,
					"aria-label": S.name,
					onChange: (event) => dispatch({
						type: "updateBehavior",
						objectId,
						behaviorName: behavior.name,
						patch: { name: event.target.value }
					}),
					className: "h-7 w-40 rounded border border-transparent bg-transparent px-1 text-[13px] font-semibold outline-none hover:border-separator focus:border-[var(--brand-light)] focus:bg-[#1D1D26]"
				}),
				/* @__PURE__ */ jsx("span", {
					className: "min-w-0 flex-1 truncate text-[11px] text-text-secondary",
					children: definition?.name ?? behavior.type
				}),
				/* @__PURE__ */ jsx("button", {
					type: "button",
					"aria-label": S.delete,
					onClick: onRemove,
					className: "grid h-6 w-6 shrink-0 place-items-center rounded text-text-secondary hover:bg-list-hover hover:text-destructive",
					children: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" })
				})
			]
		}), open ? /* @__PURE__ */ jsxs("div", {
			className: "border-t border-[#32323B] px-2 py-1",
			children: [definition?.description ? /* @__PURE__ */ jsx("p", {
				className: "py-1 text-[11.5px] leading-snug text-text-secondary",
				children: definition.description
			}) : null, (definition?.properties ?? []).map((property) => {
				const current = behavior.properties[property.key] ?? property.value;
				return /* @__PURE__ */ jsxs("label", {
					className: "flex items-center gap-2 py-1",
					children: [/* @__PURE__ */ jsx("span", {
						className: "w-44 shrink-0 truncate text-[12px] text-text-secondary",
						title: property.label,
						children: property.label
					}), property.type === "yesno" ? /* @__PURE__ */ jsx("span", {
						className: "flex gap-1",
						children: ["yes", "no"].map((option) => /* @__PURE__ */ jsx("button", {
							type: "button",
							onClick: () => dispatch({
								type: "updateBehavior",
								objectId,
								behaviorName: behavior.name,
								patch: { properties: {
									...behavior.properties,
									[property.key]: option
								} }
							}),
							className: cn("h-6 rounded px-2 text-[12px]", current === option ? "bg-[var(--brand)] text-[#F6F2FF]" : "text-text-secondary hover:bg-list-hover"),
							children: option === "yes" ? S.yes : S.no
						}, option))
					}) : property.type === "choices" ? /* @__PURE__ */ jsx("select", {
						value: current,
						onChange: (event) => dispatch({
							type: "updateBehavior",
							objectId,
							behaviorName: behavior.name,
							patch: { properties: {
								...behavior.properties,
								[property.key]: event.target.value
							} }
						}),
						className: "h-7 min-w-0 flex-1 rounded border border-separator bg-[#1D1D26] px-1 text-[12.5px] outline-none focus:border-[var(--brand-light)]",
						children: (property.choices ?? []).map((choice) => /* @__PURE__ */ jsx("option", {
							value: choice,
							children: choice
						}, choice))
					}) : /* @__PURE__ */ jsx("input", {
						value: current,
						type: "text",
						inputMode: property.type === "number" ? "decimal" : "text",
						onChange: (event) => dispatch({
							type: "updateBehavior",
							objectId,
							behaviorName: behavior.name,
							patch: { properties: {
								...behavior.properties,
								[property.key]: event.target.value
							} }
						}),
						className: cn("h-7 min-w-0 flex-1 rounded border border-separator bg-[#1D1D26] px-1.5 text-[12.5px] text-foreground outline-none focus:border-[var(--brand-light)]", property.type === "number" && "tabular-nums")
					})]
				}, property.key);
			})]
		}) : null]
	});
}
function BehaviorTypePicker({ open, onClose, onPick, installed }) {
	const [query, setQuery] = React.useState("");
	const results = BEHAVIORS.filter((behavior) => !query || behavior.name.toLowerCase().includes(query.toLowerCase()) || behavior.description.toLowerCase().includes(query.toLowerCase()));
	return /* @__PURE__ */ jsx(GdDialog, {
		open,
		onClose,
		title: S.addABehavior,
		width: "max-w-2xl",
		footer: /* @__PURE__ */ jsx(GdButton, {
			onClick: onClose,
			children: S.cancel
		}),
		children: /* @__PURE__ */ jsxs("div", {
			className: "p-2",
			children: [/* @__PURE__ */ jsx(SearchBar, {
				value: query,
				onChange: setQuery,
				placeholder: "Buscar un comportamiento",
				autoFocus: true
			}), /* @__PURE__ */ jsx("div", {
				className: "mt-2 max-h-[50vh] overflow-y-auto",
				children: results.map((behavior) => {
					const already = installed.includes(behavior.typeId);
					return /* @__PURE__ */ jsxs("button", {
						type: "button",
						disabled: already,
						onClick: () => onPick(behavior.typeId),
						className: cn("flex w-full items-center gap-2 rounded px-2 py-2 text-left hover:bg-list-hover disabled:opacity-50 disabled:hover:bg-transparent", already && "cursor-not-allowed"),
						children: [
							/* @__PURE__ */ jsx(CatalogIcon, {
								name: BEHAVIOR_ICON[behavior.typeId] ?? "puzzle",
								className: "h-5 w-5 shrink-0 text-[#C9B6FC]"
							}),
							/* @__PURE__ */ jsxs("span", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ jsx("span", {
									className: "block truncate text-[13px] text-foreground",
									children: behavior.name
								}), /* @__PURE__ */ jsx("span", {
									className: "block truncate text-[11.5px] text-text-secondary",
									children: behavior.description
								})]
							}),
							already ? /* @__PURE__ */ jsx("span", {
								className: "shrink-0 text-[11px] text-text-secondary",
								children: S.alreadyInstalled
							}) : null
						]
					}, behavior.typeId);
				})
			})]
		})
	});
}
//#endregion
//#region src/components/editor/EffectsListDialog.tsx
function EffectsListDialog() {
	const { scene, dispatch, ui } = useEditor();
	const dialog = ui.dialog?.name === "effects" ? ui.dialog : null;
	const target = dialog ? dialog.targetKind === "layer" ? {
		kind: "layer",
		name: dialog.targetId
	} : {
		kind: dialog.targetKind,
		id: dialog.targetId
	} : null;
	const effects = target ? target.kind === "object" ? scene.objects.find((o) => o.id === target.id)?.effects ?? [] : target.kind === "instance" ? scene.instances.find((i) => i.id === target.id)?.effects ?? [] : scene.layers.find((l) => l.name === target.name)?.effects ?? [] : [];
	const label = target?.kind === "object" ? scene.objects.find((o) => o.id === target.id)?.name : target?.kind === "instance" ? (() => {
		const instance = scene.instances.find((i) => i.id === target.id);
		return scene.objects.find((o) => o.id === instance?.objectId)?.name ?? instance?.objectId;
	})() : target?.name;
	const api = {
		effects,
		add: (effect) => target && dispatch({
			type: "addEffect",
			target,
			effect
		}),
		update: (index, patch) => target && dispatch({
			type: "updateEffect",
			target,
			index,
			patch
		}),
		remove: (index) => target && dispatch({
			type: "deleteEffect",
			target,
			index
		}),
		move: (index, direction) => target && dispatch({
			type: "moveEffect",
			target,
			index,
			direction
		})
	};
	return /* @__PURE__ */ jsx(GdDialog, {
		open: !!dialog && !!target,
		onClose: () => dispatch({ type: "closeDialog" }),
		title: `${S.effects}${label ? ` — ${label}` : ""}`,
		width: "max-w-3xl",
		helpPath: "https://gdevelop.io/docs/game-design/effects-in-gdevelop",
		footer: /* @__PURE__ */ jsx(GdButton, {
			variant: "raised",
			primary: true,
			onClick: () => dispatch({ type: "closeDialog" }),
			children: S.ok
		}),
		children: /* @__PURE__ */ jsx(EffectsList, { api })
	});
}
//#endregion
//#region src/components/editor/ScenePropertiesDialog.tsx
function ScenePropertiesDialog() {
	const { scene, dispatch, ui, project } = useEditor();
	const open = ui.dialog?.name === "sceneProperties";
	const [name, setName] = React.useState(scene.name);
	React.useEffect(() => setName(scene.name), [scene.name, open]);
	const close = () => dispatch({ type: "closeDialog" });
	return /* @__PURE__ */ jsx(GdDialog, {
		open,
		onClose: close,
		title: S.sceneProperties,
		width: "max-w-2xl",
		helpPath: "https://gdevelop.io/docs/getting-started/levels/scene-properties",
		footer: /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(GdButton, {
			onClick: close,
			children: S.cancel
		}), /* @__PURE__ */ jsx(GdButton, {
			variant: "raised",
			primary: true,
			onClick: () => {
				if (name && name !== scene.name) dispatch({
					type: "renameScene",
					from: scene.name,
					to: name
				});
				close();
			},
			children: S.ok
		})] }),
		children: /* @__PURE__ */ jsxs("div", {
			className: "p-2",
			children: [
				/* @__PURE__ */ jsxs(PropertySection, {
					title: S.name,
					children: [/* @__PURE__ */ jsx(FieldRow, {
						label: "Nombre de la escena",
						children: /* @__PURE__ */ jsx("input", {
							value: name,
							onChange: (event) => setName(event.target.value),
							className: "h-8 min-w-0 flex-1 rounded border border-separator bg-[#1D1D26] px-2 text-[12.5px] outline-none focus:border-[var(--brand-light)]"
						})
					}), /* @__PURE__ */ jsx(FieldRow, {
						label: S.background,
						children: /* @__PURE__ */ jsx(ColorField, {
							value: scene.backgroundColor,
							onChange: (backgroundColor) => dispatch({
								type: "updateScene",
								patch: { backgroundColor }
							})
						})
					})]
				}),
				/* @__PURE__ */ jsxs(PropertySection, {
					title: "Pantalla",
					children: [
						/* @__PURE__ */ jsx(FieldRow, {
							label: S.customWindowSize,
							children: /* @__PURE__ */ jsx(ToggleField, {
								checked: !!scene.useCustomWindowSize,
								label: S.customWindowSize,
								onChange: (useCustomWindowSize) => dispatch({
									type: "updateScene",
									patch: { useCustomWindowSize }
								})
							})
						}),
						scene.useCustomWindowSize ? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(FieldRow, {
							label: "Ancho",
							children: /* @__PURE__ */ jsx(NumberField, {
								value: scene.customWindowWidth ?? project.gameSettings.windowWidth,
								onChange: (customWindowWidth) => dispatch({
									type: "updateScene",
									patch: { customWindowWidth: Math.max(1, Math.round(customWindowWidth)) }
								})
							})
						}), /* @__PURE__ */ jsx(FieldRow, {
							label: "Alto",
							children: /* @__PURE__ */ jsx(NumberField, {
								value: scene.customWindowHeight ?? project.gameSettings.windowHeight,
								onChange: (customWindowHeight) => dispatch({
									type: "updateScene",
									patch: { customWindowHeight: Math.max(1, Math.round(customWindowHeight)) }
								})
							})
						})] }) : /* @__PURE__ */ jsx(FieldRow, {
							label: "Resolución del juego",
							children: /* @__PURE__ */ jsxs("span", {
								className: "text-[12.5px] tabular-nums text-text-secondary",
								children: [
									project.gameSettings.windowWidth,
									" × ",
									project.gameSettings.windowHeight
								]
							})
						}),
						/* @__PURE__ */ jsx(FieldRow, {
							label: S.magnification,
							children: /* @__PURE__ */ jsx(NumberField, {
								value: scene.magnification ?? 1,
								step: .25,
								onChange: (magnification) => dispatch({
									type: "updateScene",
									patch: { magnification: Math.max(.1, Math.min(8, magnification)) }
								})
							})
						}),
						/* @__PURE__ */ jsx(FieldRow, {
							label: S.adaptResolution,
							children: /* @__PURE__ */ jsx(ToggleField, {
								checked: scene.adaptResolutionAtRuntime !== false,
								label: S.adaptResolution,
								onChange: (adaptResolutionAtRuntime) => dispatch({
									type: "updateScene",
									patch: { adaptResolutionAtRuntime }
								})
							})
						}),
						/* @__PURE__ */ jsx(FieldRow, {
							label: S.stopSounds,
							children: /* @__PURE__ */ jsx(ToggleField, {
								checked: !!scene.stopSoundsOnSceneChange,
								label: S.stopSounds,
								onChange: (stopSoundsOnSceneChange) => dispatch({
									type: "updateScene",
									patch: { stopSoundsOnSceneChange }
								})
							})
						})
					]
				}),
				/* @__PURE__ */ jsxs(PropertySection, {
					title: "Cuadrícula",
					children: [
						/* @__PURE__ */ jsx(FieldRow, {
							label: "Tipo",
							children: /* @__PURE__ */ jsx(ChoiceField, {
								value: scene.grid.kind,
								options: ["rectangular", "isometric"],
								labels: {
									rectangular: "Rectangular",
									isometric: "Isométrica"
								},
								onChange: (kind) => dispatch({
									type: "updateGrid",
									patch: { kind }
								})
							})
						}),
						/* @__PURE__ */ jsx(FieldRow, {
							label: S.visible,
							children: /* @__PURE__ */ jsx(ToggleField, {
								checked: scene.grid.show,
								onChange: (show) => dispatch({
									type: "updateGrid",
									patch: { show }
								}),
								label: S.toggleGrid
							})
						}),
						/* @__PURE__ */ jsx(FieldRow, {
							label: S.snapToGrid,
							children: /* @__PURE__ */ jsx(ToggleField, {
								checked: scene.grid.snap,
								onChange: (snap) => dispatch({
									type: "updateGrid",
									patch: { snap }
								}),
								label: S.snapToGrid
							})
						}),
						/* @__PURE__ */ jsx(FieldRow, {
							label: S.gridHorizontal,
							children: /* @__PURE__ */ jsx(NumberField, {
								value: scene.grid.width,
								onChange: (width) => dispatch({
									type: "updateGrid",
									patch: { width: Math.max(1, width) }
								})
							})
						}),
						/* @__PURE__ */ jsx(FieldRow, {
							label: S.gridVertical,
							children: /* @__PURE__ */ jsx(NumberField, {
								value: scene.grid.height,
								onChange: (height) => dispatch({
									type: "updateGrid",
									patch: { height: Math.max(1, height) }
								})
							})
						}),
						/* @__PURE__ */ jsx(FieldRow, {
							label: S.gridOffsetX,
							children: /* @__PURE__ */ jsx(NumberField, {
								value: scene.grid.offsetX,
								onChange: (offsetX) => dispatch({
									type: "updateGrid",
									patch: { offsetX }
								})
							})
						}),
						/* @__PURE__ */ jsx(FieldRow, {
							label: S.gridOffsetY,
							children: /* @__PURE__ */ jsx(NumberField, {
								value: scene.grid.offsetY,
								onChange: (offsetY) => dispatch({
									type: "updateGrid",
									patch: { offsetY }
								})
							})
						}),
						/* @__PURE__ */ jsx(FieldRow, {
							label: S.gridColor,
							children: /* @__PURE__ */ jsx(ColorField, {
								value: scene.grid.color,
								onChange: (color) => dispatch({
									type: "updateGrid",
									patch: { color }
								})
							})
						}),
						/* @__PURE__ */ jsx(FieldRow, {
							label: S.gridAlpha,
							children: /* @__PURE__ */ jsx(NumberField, {
								value: scene.grid.alpha,
								step: .05,
								onChange: (alpha) => dispatch({
									type: "updateGrid",
									patch: { alpha: Math.max(0, Math.min(1, alpha)) }
								})
							})
						})
					]
				})
			]
		})
	});
}
//#endregion
//#region src/lib/audio/sfxr.ts
var SFXR_SAMPLE_RATE = 44100;
var SFXR_PRESETS = {
	jump: {
		waveform: "square",
		frequency: 260,
		attack: .005,
		sustain: .12,
		decay: .18,
		pitchJump: 12,
		distortion: .08
	},
	coin: {
		waveform: "square",
		frequency: 880,
		attack: .002,
		sustain: .06,
		decay: .2,
		pitchJump: 7,
		distortion: .03
	},
	laser: {
		waveform: "saw",
		frequency: 920,
		attack: .002,
		sustain: .09,
		decay: .22,
		pitchJump: -24,
		distortion: .22
	},
	explosion: {
		waveform: "noise",
		frequency: 90,
		attack: .002,
		sustain: .2,
		decay: .55,
		pitchJump: -10,
		distortion: .5
	},
	hit: {
		waveform: "noise",
		frequency: 170,
		attack: .001,
		sustain: .045,
		decay: .14,
		pitchJump: -6,
		distortion: .35
	}
};
var WAVEFORMS = /* @__PURE__ */ new Set([
	"square",
	"saw",
	"sine",
	"noise"
]);
function normalizeSfxrParameters(input) {
	return {
		waveform: WAVEFORMS.has(input.waveform) ? input.waveform : "square",
		frequency: clamp$1(finite(input.frequency, 440), 20, 8e3),
		attack: clamp$1(finite(input.attack, .005), 0, 2),
		decay: clamp$1(finite(input.decay, .2), .005, 4),
		sustain: clamp$1(finite(input.sustain, .1), 0, 4),
		pitchJump: clamp$1(finite(input.pitchJump, 0), -60, 60),
		distortion: clamp$1(finite(input.distortion, 0), 0, 1)
	};
}
/** Generate mono PCM samples without requiring a browser or AudioContext. */
function synthesizeSfxr(input, sampleRate = SFXR_SAMPLE_RATE) {
	const parameters = normalizeSfxrParameters(input);
	const rate = Math.round(clamp$1(finite(sampleRate, SFXR_SAMPLE_RATE), 8e3, 192e3));
	const duration = Math.max(.01, parameters.attack + parameters.sustain + parameters.decay);
	const length = Math.max(1, Math.ceil(duration * rate));
	const samples = new Float32Array(length);
	let phase = 0;
	let noiseState = 2654435769;
	const distortionDrive = 1 + parameters.distortion * 24;
	const distortionScale = Math.tanh(distortionDrive) || 1;
	for (let index = 0; index < length; index += 1) {
		const time = index / rate;
		const progress = length <= 1 ? 1 : index / (length - 1);
		const semitones = parameters.pitchJump * progress;
		const frequency = parameters.frequency * 2 ** (semitones / 12);
		phase = (phase + frequency / rate) % 1;
		let sample;
		switch (parameters.waveform) {
			case "sine":
				sample = Math.sin(phase * Math.PI * 2);
				break;
			case "saw":
				sample = phase * 2 - 1;
				break;
			case "noise":
				noiseState ^= noiseState << 13;
				noiseState ^= noiseState >>> 17;
				noiseState ^= noiseState << 5;
				sample = (noiseState >>> 0) / 4294967295 * 2 - 1;
				break;
			default: sample = phase < .5 ? 1 : -1;
		}
		const envelope = envelopeAt(time, parameters);
		const distorted = Math.tanh(sample * distortionDrive) / distortionScale;
		samples[index] = clamp$1(distorted * envelope * .92, -1, 1);
	}
	return samples;
}
function envelopeAt(time, parameters) {
	if (parameters.attack > 0 && time < parameters.attack) return time / parameters.attack;
	const sustainEnd = parameters.attack + parameters.sustain;
	if (time <= sustainEnd) return 1;
	return clamp$1(1 - (time - sustainEnd) / parameters.decay, 0, 1);
}
/** Encode mono PCM as a browser-compatible 16-bit WAV file. */
function encodeSfxrWav(samples, sampleRate = SFXR_SAMPLE_RATE) {
	const rate = Math.round(clamp$1(finite(sampleRate, SFXR_SAMPLE_RATE), 8e3, 192e3));
	const output = new Uint8Array(44 + samples.length * 2);
	const view = new DataView(output.buffer);
	writeAscii(output, 0, "RIFF");
	view.setUint32(4, output.length - 8, true);
	writeAscii(output, 8, "WAVE");
	writeAscii(output, 12, "fmt ");
	view.setUint32(16, 16, true);
	view.setUint16(20, 1, true);
	view.setUint16(22, 1, true);
	view.setUint32(24, rate, true);
	view.setUint32(28, rate * 2, true);
	view.setUint16(32, 2, true);
	view.setUint16(34, 16, true);
	writeAscii(output, 36, "data");
	view.setUint32(40, samples.length * 2, true);
	for (let index = 0; index < samples.length; index += 1) {
		const sample = clamp$1(samples[index] ?? 0, -1, 1);
		view.setInt16(44 + index * 2, sample < 0 ? sample * 32768 : sample * 32767, true);
	}
	return output;
}
function sfxrToDataUrl(parameters) {
	return `data:audio/wav;base64,${base64(encodeSfxrWav(synthesizeSfxr(parameters)))}`;
}
function serializeSfxrMetadata(parameters, preset) {
	return JSON.stringify({
		generator: "sfxr",
		version: 1,
		...preset ? { preset } : {},
		parameters: normalizeSfxrParameters(parameters)
	});
}
function parseSfxrMetadata(metadata) {
	if (!metadata) return null;
	try {
		const parsed = JSON.parse(metadata);
		if (parsed.generator !== "sfxr" || !parsed.parameters) return null;
		return normalizeSfxrParameters(parsed.parameters);
	} catch {
		return null;
	}
}
/** Play a generated effect through Web Audio. The caller owns the returned context. */
function playSfxr(parameters, context) {
	const AudioContextConstructor = globalThis.AudioContext;
	if (!context && !AudioContextConstructor) throw new Error("Web Audio no está disponible en este navegador.");
	const audioContext = context ?? new AudioContextConstructor();
	const samples = synthesizeSfxr(parameters, audioContext.sampleRate);
	const buffer = audioContext.createBuffer(1, samples.length, audioContext.sampleRate);
	buffer.copyToChannel(new Float32Array(samples), 0);
	const source = audioContext.createBufferSource();
	source.buffer = buffer;
	source.connect(audioContext.destination);
	if (audioContext.state === "suspended") audioContext.resume();
	source.start();
	return {
		context: audioContext,
		source,
		stop: () => {
			try {
				source.stop();
			} catch {}
		}
	};
}
function writeAscii(output, offset, value) {
	for (let index = 0; index < value.length; index += 1) output[offset + index] = value.charCodeAt(index);
}
function base64(bytes) {
	const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	let result = "";
	for (let index = 0; index < bytes.length; index += 3) {
		const first = bytes[index] ?? 0;
		const second = bytes[index + 1] ?? 0;
		const third = bytes[index + 2] ?? 0;
		const value = first << 16 | second << 8 | third;
		result += alphabet[value >>> 18 & 63];
		result += alphabet[value >>> 12 & 63];
		result += index + 1 < bytes.length ? alphabet[value >>> 6 & 63] : "=";
		result += index + 2 < bytes.length ? alphabet[value & 63] : "=";
	}
	return result;
}
function finite(value, fallback) {
	return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
function clamp$1(value, min, max) {
	return Math.min(max, Math.max(min, value));
}
//#endregion
//#region src/components/editor/ProjectPropertiesDialog.tsx
var TABS$1 = [
	{
		id: "game",
		label: S.gameSettings,
		icon: Boxes
	},
	{
		id: "resources",
		label: S.resources,
		icon: Image$1
	},
	{
		id: "extensions",
		label: S.extensions,
		icon: Puzzle
	},
	{
		id: "variables",
		label: S.globalVariables,
		icon: Variable
	}
];
function ProjectPropertiesDialog() {
	const { project, dispatch, ui } = useEditor();
	const dialog = ui.dialog;
	const openProject = dialog?.name === "projectProperties";
	const openResources = dialog?.name === "resources";
	const open = openProject || openResources;
	const [tab, setTab] = React.useState("game");
	React.useEffect(() => {
		if (open) setTab(openResources ? "resources" : "game");
	}, [open, openResources]);
	const settings = project.gameSettings;
	const patch = (next) => dispatch({
		type: "updateGameSettings",
		patch: next
	});
	return /* @__PURE__ */ jsx(GdDialog, {
		open,
		onClose: () => dispatch({ type: "closeDialog" }),
		title: openResources ? S.resources : S.gameSettings,
		width: "max-w-[min(1000px,96vw)]",
		helpPath: "https://gdevelop.io/docs/getting-started/project-manager",
		footer: /* @__PURE__ */ jsx(GdButton, {
			variant: "raised",
			primary: true,
			onClick: () => dispatch({ type: "closeDialog" }),
			children: S.ok
		}),
		children: /* @__PURE__ */ jsxs("div", {
			className: "grid grid-cols-1 md:grid-cols-[170px_minmax(0,1fr)]",
			children: [/* @__PURE__ */ jsx("nav", {
				className: "flex gap-1 overflow-x-auto border-b border-separator p-1 md:flex-col md:overflow-visible md:border-b-0 md:border-r",
				children: TABS$1.map((entry) => /* @__PURE__ */ jsxs("button", {
					type: "button",
					onClick: () => setTab(entry.id),
					className: cn("flex shrink-0 items-center gap-2 rounded px-2 py-1.5 text-left text-[12.5px] text-text-secondary hover:bg-list-hover hover:text-foreground", tab === entry.id && "bg-[#494952] text-[#F6F2FF]"),
					children: [/* @__PURE__ */ jsx(entry.icon, { className: "h-4 w-4 shrink-0" }), /* @__PURE__ */ jsx("span", {
						className: "truncate",
						children: entry.label
					})]
				}, entry.id))
			}), /* @__PURE__ */ jsxs("div", {
				className: "max-h-[62vh] min-w-0 overflow-y-auto p-2",
				children: [
					tab === "game" ? /* @__PURE__ */ jsxs(Fragment, { children: [
						/* @__PURE__ */ jsxs(PropertySection, {
							title: "Juego",
							children: [
								/* @__PURE__ */ jsx(FieldRow, {
									label: "Nombre del juego",
									children: /* @__PURE__ */ jsx(TextField, {
										value: project.name,
										onChange: (name) => dispatch({
											type: "renameProject",
											name
										})
									})
								}),
								/* @__PURE__ */ jsx(FieldRow, {
									label: "Autor",
									children: /* @__PURE__ */ jsx(TextField, {
										value: settings.author,
										onChange: (author) => patch({ author })
									})
								}),
								/* @__PURE__ */ jsx(FieldRow, {
									label: "Descripción",
									children: /* @__PURE__ */ jsx(TextField, {
										value: settings.description,
										onChange: (description) => patch({ description })
									})
								}),
								/* @__PURE__ */ jsx(FieldRow, {
									label: "Versión",
									children: /* @__PURE__ */ jsx(TextField, {
										value: settings.version,
										onChange: (version) => patch({ version })
									})
								}),
								/* @__PURE__ */ jsx(FieldRow, {
									label: "Nombre del paquete",
									children: /* @__PURE__ */ jsx(TextField, {
										value: settings.packageName,
										onChange: (packageName) => patch({ packageName })
									})
								}),
								/* @__PURE__ */ jsx(FieldRow, {
									label: "Escena que se abre al empezar el juego",
									children: /* @__PURE__ */ jsx(ChoiceField, {
										value: project.firstLayoutName,
										options: project.scenes.map((scene) => scene.name),
										onChange: (startScene) => patch({ startScene })
									})
								})
							]
						}),
						/* @__PURE__ */ jsxs(PropertySection, {
							title: "Gráficos",
							children: [
								/* @__PURE__ */ jsx(FieldRow, {
									label: "Ancho del juego",
									children: /* @__PURE__ */ jsx(NumberField, {
										value: settings.windowWidth,
										onChange: (windowWidth) => patch({ windowWidth: Math.max(1, Math.round(windowWidth)) })
									})
								}),
								/* @__PURE__ */ jsx(FieldRow, {
									label: "Alto del juego",
									children: /* @__PURE__ */ jsx(NumberField, {
										value: settings.windowHeight,
										onChange: (windowHeight) => patch({ windowHeight: Math.max(1, Math.round(windowHeight)) })
									})
								}),
								/* @__PURE__ */ jsx(FieldRow, {
									label: "Usar el tamaño de la ventana como tamaño base",
									children: /* @__PURE__ */ jsx(ToggleField, {
										checked: settings.useWindowSizeAsBaseSize,
										label: "useWindowSizeAsBaseSize",
										onChange: (useWindowSizeAsBaseSize) => patch({ useWindowSizeAsBaseSize })
									})
								}),
								/* @__PURE__ */ jsx(FieldRow, {
									label: "Adaptar la resolución en el juego",
									children: /* @__PURE__ */ jsx(ToggleField, {
										checked: settings.adaptGameResolutionAtRuntime,
										label: "adaptGameResolutionAtRuntime",
										onChange: (adaptGameResolutionAtRuntime) => patch({ adaptGameResolutionAtRuntime })
									})
								}),
								/* @__PURE__ */ jsx(FieldRow, {
									label: "Modo de escala",
									children: /* @__PURE__ */ jsx(ChoiceField, {
										value: settings.scaleMode,
										options: ["nearest", "linear"],
										labels: {
											nearest: "Nítido (nearest)",
											linear: "Suave (linear)"
										},
										onChange: (scaleMode) => patch({ scaleMode })
									})
								}),
								/* @__PURE__ */ jsx(FieldRow, {
									label: "Modo de ventana",
									children: /* @__PURE__ */ jsx(ChoiceField, {
										value: settings.windowMode,
										options: [
											"default",
											"fullscreen",
											"resizable"
										],
										labels: {
											default: "Ventana",
											fullscreen: "Pantalla completa",
											resizable: "Redimensionable"
										},
										onChange: (windowMode) => patch({ windowMode })
									})
								}),
								/* @__PURE__ */ jsx(FieldRow, {
									label: "Orientación",
									children: /* @__PURE__ */ jsx(ChoiceField, {
										value: settings.orientation,
										options: [
											"landscape",
											"portrait",
											"any"
										],
										labels: {
											landscape: "Horizontal",
											portrait: "Vertical",
											any: "Cualquiera"
										},
										onChange: (orientation) => patch({ orientation })
									})
								}),
								/* @__PURE__ */ jsx(FieldRow, {
									label: S.renderOutsideGameArea,
									children: /* @__PURE__ */ jsx(ToggleField, {
										checked: settings.renderOutsideGameArea,
										label: S.renderOutsideGameArea,
										onChange: (renderOutsideGameArea) => patch({ renderOutsideGameArea })
									})
								}),
								/* @__PURE__ */ jsx(FieldRow, {
									label: "FPS mínimos",
									children: /* @__PURE__ */ jsx(NumberField, {
										value: settings.minFPS,
										onChange: (minFPS) => patch({ minFPS: Math.max(10, Math.round(minFPS)) })
									})
								}),
								/* @__PURE__ */ jsx(FieldRow, {
									label: "FPS máximos",
									children: /* @__PURE__ */ jsx(NumberField, {
										value: settings.maxFPS,
										onChange: (maxFPS) => patch({ maxFPS: Math.max(15, Math.round(maxFPS)) })
									})
								})
							]
						}),
						/* @__PURE__ */ jsxs(PropertySection, {
							title: "Pantalla de carga",
							children: [
								/* @__PURE__ */ jsx(FieldRow, {
									label: "Mostrar la pantalla de inicio de Nexus",
									children: /* @__PURE__ */ jsx(ToggleField, {
										checked: settings.loadingScreen.displayBrandSplash,
										label: "displayBrandSplash",
										onChange: (displayBrandSplash) => patch({ loadingScreen: {
											...settings.loadingScreen,
											displayBrandSplash
										} })
									})
								}),
								/* @__PURE__ */ jsx(FieldRow, {
									label: "Duración mínima (s)",
									children: /* @__PURE__ */ jsx(NumberField, {
										value: settings.loadingScreen.minDuration,
										step: .1,
										onChange: (minDuration) => patch({ loadingScreen: {
											...settings.loadingScreen,
											minDuration: Math.max(0, minDuration)
										} })
									})
								}),
								/* @__PURE__ */ jsx(FieldRow, {
									label: S.background,
									children: /* @__PURE__ */ jsx(ColorField, {
										value: settings.loadingScreen.backgroundColor,
										onChange: (backgroundColor) => patch({ loadingScreen: {
											...settings.loadingScreen,
											backgroundColor
										} })
									})
								})
							]
						}),
						/* @__PURE__ */ jsxs(PropertySection, {
							title: "Comportamiento",
							children: [/* @__PURE__ */ jsx(FieldRow, {
								label: "Pausar el juego cuando la ventana pierde el foco",
								children: /* @__PURE__ */ jsx(ToggleField, {
									checked: settings.pauseOnLostFocus,
									label: "pauseOnLostFocus",
									onChange: (pauseOnLostFocus) => patch({ pauseOnLostFocus })
								})
							}), /* @__PURE__ */ jsx(FieldRow, {
								label: "Política de carpetas",
								children: /* @__PURE__ */ jsx(ChoiceField, {
									value: settings.folderPolicy,
									options: ["doNotUse", "automatic"],
									labels: {
										doNotUse: "Sin carpetas",
										automatic: "Automática"
									},
									onChange: (folderPolicy) => patch({ folderPolicy })
								})
							})]
						})
					] }) : null,
					tab === "resources" ? /* @__PURE__ */ jsx(ResourcesTab, {}) : null,
					tab === "extensions" ? /* @__PURE__ */ jsx(ExtensionsTab, {}) : null,
					tab === "variables" ? /* @__PURE__ */ jsx(GlobalVariablesTab, {}) : null
				]
			})]
		})
	});
}
function ResourcesTab() {
	const { project, dispatch } = useEditor();
	const [query, setQuery] = React.useState("");
	const [kind, setKind] = React.useState("all");
	const [selectedName, setSelectedName] = React.useState(null);
	const imageInput = React.useRef(null);
	const audioInput = React.useRef(null);
	const rows = project.resources.filter((resource) => (kind === "all" || resource.kind === kind) && (!query || resource.name.toLowerCase().includes(query.toLowerCase())));
	const selected = project.resources.find((resource) => resource.name === selectedName);
	const add = (next) => dispatch({
		type: "addResource",
		resource: next
	});
	const importFiles = async (files, resourceKind) => {
		if (!files) return;
		const claimedNames = new Set(project.resources.map((resource) => resource.name));
		for (const file of Array.from(files)) try {
			validateImportedFile(file, resourceKind);
			const name = uniqueResourceName(file.name, [...claimedNames]);
			claimedNames.add(name);
			add({
				name,
				kind: resourceKind,
				file: name,
				url: await fileToDataUrl(file),
				alwaysLoaded: true,
				size: Math.max(.01, file.size / 1024),
				editorMetadata: { source: "manual" }
			});
			setSelectedName(name);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "No se pudo importar el archivo.");
		}
	};
	const addPreset = (preset) => {
		const parameters = { ...SFXR_PRESETS[preset] };
		const name = uniqueResourceName(`${preset}.wav`, project.resources.map((resource) => resource.name));
		add({
			name,
			kind: "audio",
			file: name,
			url: sfxrToDataUrl(parameters),
			metadata: serializeSfxrMetadata(parameters, preset),
			editorMetadata: {
				source: "procedural",
				generation: {
					provider: "procedural",
					model: "sfxr",
					generatedAt: (/* @__PURE__ */ new Date()).toISOString()
				},
				sfx: { ...parameters }
			},
			alwaysLoaded: true
		});
		setKind("audio");
		setSelectedName(name);
		try {
			playSfxr(parameters);
		} catch {}
	};
	return /* @__PURE__ */ jsxs("div", { children: [
		/* @__PURE__ */ jsx("input", {
			ref: imageInput,
			type: "file",
			accept: ".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml",
			multiple: true,
			className: "hidden",
			onChange: (event) => {
				importFiles(event.target.files, "image");
				event.target.value = "";
			}
		}),
		/* @__PURE__ */ jsx("input", {
			ref: audioInput,
			type: "file",
			accept: ".wav,.mp3,.ogg,audio/wav,audio/mpeg,audio/ogg",
			multiple: true,
			className: "hidden",
			onChange: (event) => {
				importFiles(event.target.files, "audio");
				event.target.value = "";
			}
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "flex flex-wrap items-center gap-2 pb-2",
			children: [/* @__PURE__ */ jsx(SearchBar, {
				value: query,
				onChange: setQuery,
				placeholder: S.searchResources,
				className: "min-w-40 flex-1"
			}), /* @__PURE__ */ jsxs("div", {
				className: "flex shrink-0 gap-1",
				children: [
					/* @__PURE__ */ jsxs("button", {
						type: "button",
						onClick: () => imageInput.current?.click(),
						className: "flex h-8 items-center gap-1 rounded bg-primary px-2 text-[11.5px] font-medium text-primary-foreground hover:bg-[#5C36D6]",
						title: "Importar PNG, JPG o SVG",
						children: [/* @__PURE__ */ jsx(Upload, { className: "h-3.5 w-3.5" }), "Imagen"]
					}),
					/* @__PURE__ */ jsxs("button", {
						type: "button",
						onClick: () => audioInput.current?.click(),
						className: "flex h-8 items-center gap-1 rounded bg-primary px-2 text-[11.5px] font-medium text-primary-foreground hover:bg-[#5C36D6]",
						title: "Importar WAV, MP3 u OGG",
						children: [/* @__PURE__ */ jsx(Volume2, { className: "h-3.5 w-3.5" }), "Audio"]
					}),
					RESOURCE_KINDS.map((entry) => /* @__PURE__ */ jsxs("button", {
						type: "button",
						onClick: () => add({
							name: `recurso-${project.resources.length + 1}.${entry.extensions.split(",")[0]?.trim().replace("*.", "") ?? "png"}`,
							kind: entry.kind,
							file: "",
							alwaysLoaded: true,
							metadata: ""
						}),
						className: "flex h-8 items-center gap-1 rounded bg-elevated px-2 text-[11.5px] text-foreground hover:bg-selection",
						title: entry.description,
						children: [/* @__PURE__ */ jsx(Plus, { className: "h-3.5 w-3.5" }), entry.name]
					}, entry.kind))
				]
			})]
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "mb-2 flex flex-wrap items-center gap-1 rounded border border-separator bg-[#1D1D26] p-1.5 text-[11.5px]",
			children: [
				/* @__PURE__ */ jsx("span", {
					className: "mr-1 text-text-secondary",
					children: "SFX instantáneo:"
				}),
				Object.keys(SFXR_PRESETS).map((preset) => /* @__PURE__ */ jsx("button", {
					type: "button",
					onClick: () => addPreset(preset),
					className: "rounded bg-elevated px-2 py-1 capitalize text-foreground hover:bg-selection",
					children: preset
				}, preset)),
				/* @__PURE__ */ jsx("span", {
					className: "ml-auto text-[10.5px] text-text-placeholder",
					children: "WAV editable · frecuencia, ataque, caída, sustain, salto tonal y distorsión"
				})
			]
		}),
		/* @__PURE__ */ jsx("div", {
			className: "flex gap-1 pb-2 text-[11.5px]",
			children: ["all", ...RESOURCE_KINDS.map((entry) => entry.kind)].map((option) => /* @__PURE__ */ jsx("button", {
				type: "button",
				onClick: () => setKind(option),
				className: cn("rounded px-2 py-0.5", kind === option ? "bg-[var(--brand)] text-[#F6F2FF]" : "text-text-secondary hover:bg-list-hover"),
				children: option === "all" ? S.resourcesAnyKind : RESOURCE_KINDS.find((entry) => entry.kind === option)?.name
			}, option))
		}),
		/* @__PURE__ */ jsx("div", {
			className: "overflow-x-auto rounded border border-separator",
			children: /* @__PURE__ */ jsxs("table", {
				className: "w-full min-w-[720px] table-fixed text-[12px]",
				children: [/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", {
					className: "bg-[#25252E] text-left text-[#D6DEEC]",
					children: [
						/* @__PURE__ */ jsx("th", { className: "w-8 px-2 py-1" }),
						/* @__PURE__ */ jsx("th", {
							className: "px-2 py-1 font-medium",
							children: S.name
						}),
						/* @__PURE__ */ jsx("th", {
							className: "w-24 px-2 py-1 font-medium",
							children: S.type
						}),
						/* @__PURE__ */ jsx("th", {
							className: "px-2 py-1 font-medium",
							children: "Archivo"
						}),
						/* @__PURE__ */ jsx("th", {
							className: "w-16 px-2 py-1 font-medium",
							children: "Precargado"
						}),
						/* @__PURE__ */ jsx("th", { className: "w-10 px-2 py-1" })
					]
				}) }), /* @__PURE__ */ jsxs("tbody", { children: [rows.map((resource, index) => /* @__PURE__ */ jsxs("tr", {
					onClick: () => setSelectedName(resource.name),
					className: cn("cursor-pointer", index % 2 === 0 ? "bg-[#1D1D26]" : "bg-[#23232A]", selectedName === resource.name && "outline outline-1 -outline-offset-1 outline-[#4AB0E4]"),
					children: [
						/* @__PURE__ */ jsx("td", {
							className: "px-2 py-1",
							children: /* @__PURE__ */ jsx("span", {
								className: "grid h-6 w-6 place-items-center rounded bg-[#101017]",
								children: resource.kind === "image" && resolveAsset(resource.file || resource.name, project.resources) ? /* @__PURE__ */ jsx("img", {
									src: resolveAsset(resource.file || resource.name, project.resources),
									alt: "",
									className: "h-5 w-5 object-contain [image-rendering:pixelated]"
								}) : /* @__PURE__ */ jsx(CatalogIcon, {
									name: resource.kind,
									className: "h-3.5 w-3.5 text-[#C9B6FC]"
								})
							})
						}),
						/* @__PURE__ */ jsx("td", {
							className: "truncate px-2 py-1 text-foreground",
							children: /* @__PURE__ */ jsx("input", {
								value: resource.name,
								onChange: (event) => {
									const name = event.target.value;
									if (!name.trim() || project.resources.some((candidate) => candidate.name !== resource.name && candidate.name === name.trim())) return;
									dispatch({
										type: "updateResource",
										name: resource.name,
										patch: { name }
									});
									setSelectedName(name.trim());
								},
								className: "h-6 w-full rounded border border-transparent bg-transparent px-1 outline-none hover:border-separator focus:border-[var(--brand-light)]"
							})
						}),
						/* @__PURE__ */ jsx("td", {
							className: "px-2 py-1 text-text-secondary",
							children: resource.kind
						}),
						/* @__PURE__ */ jsx("td", {
							className: "truncate px-2 py-1",
							children: /* @__PURE__ */ jsx("input", {
								value: resource.file,
								placeholder: "archivo.png",
								onChange: (event) => dispatch({
									type: "updateResource",
									name: resource.name,
									patch: { file: event.target.value }
								}),
								className: "h-6 w-full rounded border border-transparent bg-transparent px-1 font-mono text-[11.5px] outline-none hover:border-separator focus:border-[var(--brand-light)]"
							})
						}),
						/* @__PURE__ */ jsx("td", {
							className: "px-2 py-1",
							children: /* @__PURE__ */ jsx("input", {
								type: "checkbox",
								checked: resource.alwaysLoaded,
								onChange: (event) => dispatch({
									type: "updateResource",
									name: resource.name,
									patch: { alwaysLoaded: event.target.checked }
								}),
								className: "h-3.5 w-3.5 accent-[var(--brand)]"
							})
						}),
						/* @__PURE__ */ jsx("td", {
							className: "px-2 py-1 text-right",
							children: /* @__PURE__ */ jsx("button", {
								type: "button",
								"aria-label": S.delete,
								onClick: () => dispatch({
									type: "deleteResource",
									name: resource.name
								}),
								className: "text-text-secondary hover:text-destructive",
								children: "×"
							})
						})
					]
				}, resource.name)), rows.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", {
					colSpan: 6,
					className: "px-2 py-2 text-center text-text-placeholder",
					children: S.addANewResource
				}) }) : null] })]
			})
		}),
		selected ? /* @__PURE__ */ jsx(ResourceInspector, {
			resource: selected,
			onUpdate: (patch) => dispatch({
				type: "updateResource",
				name: selected.name,
				patch
			})
		}, selected.name) : null
	] });
}
function ResourceInspector({ resource, onUpdate }) {
	const parsed = parseSfxrMetadata(resource.metadata);
	const [parameters, setParameters] = React.useState(parsed);
	const provenance = resource.editorMetadata?.source ?? "manual";
	const setNumber = (key, value) => {
		if (!parameters) return;
		setParameters({
			...parameters,
			[key]: value
		});
	};
	const save = () => {
		if (!parameters) return;
		onUpdate({
			url: sfxrToDataUrl(parameters),
			metadata: serializeSfxrMetadata(parameters),
			editorMetadata: {
				source: "procedural",
				generation: resource.editorMetadata?.generation ?? {
					provider: "procedural",
					model: "sfxr"
				},
				sfx: { ...parameters }
			}
		});
		toast.success(`SFX «${resource.name}» actualizado como WAV estándar.`);
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "mt-2 rounded border border-separator bg-[#1D1D26] p-2",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-center gap-2 text-[11.5px]",
				children: [
					/* @__PURE__ */ jsxs("strong", {
						className: "text-foreground",
						children: ["Inspector: ", resource.name]
					}),
					/* @__PURE__ */ jsx("span", {
						className: "rounded bg-elevated px-1.5 py-0.5 text-text-secondary",
						children: provenance === "manual" ? "Importado manualmente" : provenance === "generated" ? "Generado con IA" : "Generado proceduralmente"
					}),
					resource.size ? /* @__PURE__ */ jsxs("span", {
						className: "text-text-placeholder",
						children: [resource.size.toFixed(1), " KB"]
					}) : null
				]
			}),
			resource.editorMetadata?.generation ? /* @__PURE__ */ jsxs("div", {
				className: "mt-2 grid gap-1 rounded border border-separator p-1.5 text-[10.5px] text-text-secondary sm:grid-cols-2",
				children: [
					/* @__PURE__ */ jsxs("span", { children: [
						"Proveedor:",
						" ",
						/* @__PURE__ */ jsx("strong", {
							className: "text-foreground",
							children: resource.editorMetadata.generation.provider
						})
					] }),
					/* @__PURE__ */ jsxs("span", { children: [
						"Modelo:",
						" ",
						/* @__PURE__ */ jsx("strong", {
							className: "text-foreground",
							children: resource.editorMetadata.generation.model ?? "—"
						})
					] }),
					resource.editorMetadata.generation.prompt ? /* @__PURE__ */ jsxs("label", {
						className: "sm:col-span-2",
						children: ["Instrucción de origen", /* @__PURE__ */ jsx("input", {
							value: resource.editorMetadata.generation.prompt,
							onChange: (event) => onUpdate({ editorMetadata: {
								...resource.editorMetadata,
								generation: {
									...resource.editorMetadata.generation,
									prompt: event.target.value
								}
							} }),
							className: "mt-0.5 h-7 w-full rounded border border-separator bg-[#101017] px-2 text-foreground outline-none focus:border-[var(--brand-light)]"
						})]
					}) : null
				]
			}) : null,
			parameters ? /* @__PURE__ */ jsxs("div", {
				className: "mt-2",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "grid gap-2 sm:grid-cols-2 lg:grid-cols-3",
					children: [/* @__PURE__ */ jsxs("label", {
						className: "text-[11px] text-text-secondary",
						children: ["Forma de onda", /* @__PURE__ */ jsxs("select", {
							value: parameters.waveform,
							onChange: (event) => setParameters({
								...parameters,
								waveform: event.target.value
							}),
							className: "mt-0.5 h-7 w-full rounded border border-separator bg-[#25252E] px-1 text-foreground",
							children: [
								/* @__PURE__ */ jsx("option", {
									value: "square",
									children: "Cuadrada"
								}),
								/* @__PURE__ */ jsx("option", {
									value: "saw",
									children: "Sierra"
								}),
								/* @__PURE__ */ jsx("option", {
									value: "sine",
									children: "Seno"
								}),
								/* @__PURE__ */ jsx("option", {
									value: "noise",
									children: "Ruido"
								})
							]
						})]
					}), [
						[
							"frequency",
							"Frecuencia (Hz)",
							20,
							8e3,
							1
						],
						[
							"attack",
							"Ataque (s)",
							0,
							2,
							.001
						],
						[
							"decay",
							"Caída (s)",
							.005,
							4,
							.005
						],
						[
							"sustain",
							"Sustain (s)",
							0,
							4,
							.005
						],
						[
							"pitchJump",
							"Salto tonal (semitonos)",
							-60,
							60,
							1
						],
						[
							"distortion",
							"Distorsión",
							0,
							1,
							.01
						]
					].map(([key, label, min, max, step]) => /* @__PURE__ */ jsxs("label", {
						className: "text-[11px] text-text-secondary",
						children: [label, /* @__PURE__ */ jsx("input", {
							type: "number",
							value: parameters[key],
							min,
							max,
							step,
							onChange: (event) => setNumber(key, Number(event.target.value)),
							className: "mt-0.5 h-7 w-full rounded border border-separator bg-[#25252E] px-1 text-foreground outline-none focus:border-[var(--brand-light)]"
						})]
					}, key))]
				}), /* @__PURE__ */ jsxs("div", {
					className: "mt-2 flex justify-end gap-1",
					children: [/* @__PURE__ */ jsx(GdButton, {
						size: "small",
						onClick: () => {
							try {
								playSfxr(parameters);
							} catch (error) {
								toast.error(error instanceof Error ? error.message : "No se pudo reproducir el SFX.");
							}
						},
						children: "Probar"
					}), /* @__PURE__ */ jsx(GdButton, {
						size: "small",
						variant: "raised",
						primary: true,
						onClick: save,
						children: "Aplicar parámetros"
					})]
				})]
			}) : /* @__PURE__ */ jsx("p", {
				className: "mt-1 text-[11px] text-text-secondary",
				children: "Recurso estándar editable. Puedes cambiar su nombre, archivo y precarga arriba o reemplazarlo mediante los controles de importación manual."
			})
		]
	});
}
function validateImportedFile(file, kind) {
	const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
	if (!(kind === "image" ? [
		"png",
		"jpg",
		"jpeg",
		"svg"
	] : [
		"wav",
		"mp3",
		"ogg"
	]).includes(extension)) throw new Error(kind === "image" ? "Formato no admitido. Usa PNG, JPG o SVG." : "Formato no admitido. Usa WAV, MP3 u OGG.");
	if (file.size <= 0 || file.size > 20971520) throw new Error("El recurso debe tener contenido y no superar 20 MB.");
}
function fileToDataUrl(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result));
		reader.onerror = () => reject(/* @__PURE__ */ new Error(`No se pudo leer ${file.name}.`));
		reader.readAsDataURL(file);
	});
}
function uniqueResourceName(base, taken) {
	if (!taken.includes(base)) return base;
	const dot = base.lastIndexOf(".");
	const stem = dot > 0 ? base.slice(0, dot) : base;
	const extension = dot > 0 ? base.slice(dot) : "";
	let index = 2;
	while (taken.includes(`${stem}-${index}${extension}`)) index += 1;
	return `${stem}-${index}${extension}`;
}
function ExtensionsTab() {
	const { project, dispatch } = useEditor();
	const [query, setQuery] = React.useState("");
	const installed = new Set(project.extensions.map((extension) => extension.name));
	const rows = INSTALLED_EXTENSIONS.filter((extension) => !query || extension.name.toLowerCase().includes(query.toLowerCase()));
	return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(SearchBar, {
		value: query,
		onChange: setQuery,
		placeholder: S.searchExtensions
	}), /* @__PURE__ */ jsx("div", {
		className: "mt-2 grid gap-1 md:grid-cols-2",
		children: rows.map((extension) => {
			const isInstalled = installed.has(extension.name);
			return /* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-2 rounded border border-separator bg-[#1D1D26] p-2",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "grid h-8 w-8 shrink-0 place-items-center rounded bg-[#25252E]",
						children: /* @__PURE__ */ jsx(CatalogIcon, {
							name: extension.icon,
							className: "h-4 w-4 text-[#C9B6FC]"
						})
					}),
					/* @__PURE__ */ jsxs("span", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ jsx("span", {
							className: "block truncate text-[12.5px] text-foreground",
							children: extension.name
						}), /* @__PURE__ */ jsxs("span", {
							className: "block truncate text-[11px] text-text-secondary",
							children: [
								extension.longName,
								" · v",
								extension.version
							]
						})]
					}),
					/* @__PURE__ */ jsx(GdButton, {
						size: "small",
						variant: "raised",
						className: isInstalled ? "opacity-70" : void 0,
						onClick: () => isInstalled ? dispatch({
							type: "uninstallExtension",
							name: extension.name
						}) : dispatch({
							type: "installExtension",
							extension: {
								name: extension.name,
								longName: extension.name,
								version: "1.0.0"
							}
						}),
						children: isInstalled ? S.installed : S.install
					})
				]
			}, extension.name);
		})
	})] });
}
function GlobalVariablesTab() {
	const { project, dispatch } = useEditor();
	const location = { scope: "global" };
	const api = {
		variables: project.globalVariables,
		add: (path) => path.length === 0 ? dispatch({
			type: "addVariable",
			location
		}) : dispatch({
			type: "addVariableChild",
			location,
			path
		}),
		update: (path, patch) => dispatch({
			type: "updateVariable",
			location,
			path,
			patch
		}),
		remove: (path) => dispatch({
			type: "deleteVariable",
			location,
			path
		})
	};
	return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", {
		className: "px-1 pb-1 text-[13px] font-semibold",
		children: S.globalVariables
	}), /* @__PURE__ */ jsx(VariablesEditor, { api })] });
}
function VariablesDialog() {
	const { scene, project, dispatch, ui } = useEditor();
	const dialog = ui.dialog?.name === "variables" ? ui.dialog : null;
	const isGlobal = dialog?.scope === "global";
	const location = { scope: isGlobal ? "global" : "scene" };
	const api = {
		variables: isGlobal ? project.globalVariables : scene.variables,
		add: (path) => path.length === 0 ? dispatch({
			type: "addVariable",
			location
		}) : dispatch({
			type: "addVariableChild",
			location,
			path
		}),
		update: (path, patch) => dispatch({
			type: "updateVariable",
			location,
			path,
			patch
		}),
		remove: (path) => dispatch({
			type: "deleteVariable",
			location,
			path
		})
	};
	return /* @__PURE__ */ jsx(GdDialog, {
		open: !!dialog,
		onClose: () => dispatch({ type: "closeDialog" }),
		title: isGlobal ? S.globalVariables : S.sceneVariables,
		width: "max-w-2xl",
		helpPath: "https://gdevelop.io/docs/getting-started/game-basics/variables",
		footer: /* @__PURE__ */ jsx(GdButton, {
			variant: "raised",
			primary: true,
			onClick: () => dispatch({ type: "closeDialog" }),
			children: S.ok
		}),
		children: /* @__PURE__ */ jsx("div", {
			className: "p-2",
			children: /* @__PURE__ */ jsx(VariablesEditor, { api })
		})
	});
}
//#endregion
//#region src/components/editor/InstructionSelectorDialog.tsx
var PARAM_TO_EXPRESSION = {
	number: "number",
	expression: "number",
	string: "string",
	yesno: "yesno",
	choices: "choices",
	key: "key",
	button: "choices",
	operator: "choices",
	modop: "choices",
	color: "color",
	sound: "sound",
	animation: "animation",
	behavior: "behavior",
	object: "object",
	textObject: "textObject",
	varobj: "varobj",
	varscene: "varobj",
	varglobal: "varglobal",
	layer: "layer",
	scene: "scene"
};
function InstructionSelectorDialog() {
	const { ui, dispatch, scene, project } = useEditor();
	const dialog = ui.dialog?.name === "instruction" ? ui.dialog : null;
	const open = !!dialog;
	const kind = dialog?.slot === "conditions" ? "condition" : "action";
	const editing = React.useMemo(() => {
		if (!dialog?.instructionId) return null;
		return findEventById(scene.events, dialog.eventId)?.[dialog.slot].find((i) => i.id === dialog.instructionId) ?? null;
	}, [dialog, scene.events]);
	const [category, setCategory] = React.useState("all");
	const [query, setQuery] = React.useState("");
	const [selectedId, setSelectedId] = React.useState(null);
	const [parameters, setParameters] = React.useState({});
	const [inverted, setInverted] = React.useState(false);
	React.useEffect(() => {
		if (!open) return;
		setQuery("");
		setCategory("all");
		if (editing) {
			setSelectedId(editing.typeId);
			setParameters({ ...editing.parameters });
			setInverted(editing.inverted);
		} else {
			setSelectedId(null);
			setParameters({});
			setInverted(false);
		}
	}, [
		open,
		editing,
		dialog?.eventId,
		dialog?.slot
	]);
	const results = searchInstructions(kind, query, category);
	const def = (selectedId ? instructionById(selectedId) : void 0) ?? null;
	const close = () => dispatch({ type: "closeDialog" });
	const submit = () => {
		if (!dialog || !def) return;
		if (!editing) dispatch({
			type: "addInstruction",
			eventId: dialog.eventId,
			slot: dialog.slot,
			instruction: {
				...newInstruction(def.id, defaultsFor(def)),
				inverted: kind === "condition" ? inverted : false
			}
		});
		else dispatch({
			type: "updateInstruction",
			eventId: dialog.eventId,
			slot: dialog.slot,
			instructionId: editing.id,
			patch: {
				typeId: def.id,
				parameters,
				...kind === "condition" ? { inverted } : {}
			}
		});
		close();
	};
	const objectNameForBehaviors = parameters["object"] || def?.parameters.find((parameter) => parameter.type === "object")?.defaultValue || scene.objects[0]?.name || "";
	return /* @__PURE__ */ jsx(GdDialog, {
		open,
		onClose: close,
		title: `${S.instructionEditor} — ${kind === "condition" ? S.condition : S.action}`,
		width: "max-w-[min(1080px,96vw)]",
		helpPath: def?.helpPath,
		footer: /* @__PURE__ */ jsxs(Fragment, { children: [
			kind === "condition" ? /* @__PURE__ */ jsxs("label", {
				className: "mr-auto flex items-center gap-2 text-[12.5px] text-text-secondary",
				children: [/* @__PURE__ */ jsx("input", {
					type: "checkbox",
					checked: inverted,
					onChange: (event) => setInverted(event.target.checked),
					className: "h-3.5 w-3.5 accent-[var(--brand)]"
				}), S.instructionIfNot]
			}) : null,
			/* @__PURE__ */ jsx(GdButton, {
				onClick: close,
				children: S.cancel
			}),
			/* @__PURE__ */ jsx(GdButton, {
				variant: "raised",
				primary: true,
				disabled: !def,
				onClick: submit,
				children: editing ? S.apply : S.add
			})
		] }),
		children: /* @__PURE__ */ jsxs("div", {
			className: "grid h-[min(70vh,620px)] grid-cols-1 md:grid-cols-[150px_minmax(0,320px)_minmax(0,1fr)]",
			children: [
				/* @__PURE__ */ jsx("div", {
					className: "hidden flex-col overflow-y-auto border-r border-separator bg-[#22242B] py-1 md:flex",
					children: INSTRUCTION_CATEGORIES.map((entry) => /* @__PURE__ */ jsxs("button", {
						type: "button",
						onClick: () => setCategory(entry.id),
						className: cn("flex items-center gap-2 px-2.5 py-1.5 text-left text-[12.5px] text-text-secondary hover:bg-list-hover hover:text-foreground", category === entry.id && "bg-[#494952] text-[#F6F2FF]"),
						children: [
							/* @__PURE__ */ jsx(CatalogIcon, {
								name: CATEGORY_ICON[entry.id] ?? "puzzle",
								className: "h-3.5 w-3.5 shrink-0 opacity-80"
							}),
							/* @__PURE__ */ jsx("span", {
								className: "min-w-0 flex-1 truncate",
								children: entry.name
							}),
							category === entry.id ? /* @__PURE__ */ jsx(ChevronRight, { className: "h-3 w-3 opacity-60" }) : null
						]
					}, entry.id))
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "flex min-h-0 flex-col border-b border-separator md:border-b-0 md:border-r",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2 border-b border-separator px-2 py-1.5",
						children: [/* @__PURE__ */ jsx(Search, { className: "h-3.5 w-3.5 shrink-0 text-text-secondary" }), /* @__PURE__ */ jsx("input", {
							autoFocus: true,
							value: query,
							onChange: (event) => setQuery(event.target.value),
							placeholder: kind === "condition" ? S.addCondition : S.addAction,
							className: "h-7 w-full min-w-0 bg-transparent text-[12.5px] outline-none placeholder:text-text-placeholder"
						})]
					}), /* @__PURE__ */ jsxs("div", {
						className: "min-h-0 flex-1 overflow-y-auto",
						children: [results.length === 0 ? /* @__PURE__ */ jsx("p", {
							className: "p-3 text-[12.5px] text-text-secondary",
							children: "Sin resultados."
						}) : null, results.map((instruction) => /* @__PURE__ */ jsxs("button", {
							type: "button",
							onClick: () => {
								setSelectedId(instruction.id);
								setParameters(defaultsFor(instruction));
							},
							className: cn("flex w-full flex-col items-start gap-0.5 border-b border-separator/60 px-2.5 py-1.5 text-left hover:bg-list-hover", selectedId === instruction.id && "bg-[#3D4D51]"),
							children: [/* @__PURE__ */ jsx("span", {
								className: cn("text-[12.5px] leading-tight", selectedId === instruction.id ? "text-[#E5C07B]" : "text-foreground"),
								children: instruction.name
							}), /* @__PURE__ */ jsx("span", {
								className: "line-clamp-2 text-[11px] leading-tight text-text-secondary",
								children: instruction.description
							})]
						}, instruction.id))]
					})]
				}),
				/* @__PURE__ */ jsx("div", {
					className: "flex min-h-0 flex-col",
					children: !def ? /* @__PURE__ */ jsxs("div", {
						className: "flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center",
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-[13px] font-semibold text-foreground",
							children: S.chooseAndAddEvent
						}), /* @__PURE__ */ jsxs("p", {
							className: "max-w-xs text-[12px] text-text-secondary",
							children: [
								"Selecciona ",
								kind === "condition" ? "una condición" : "una acción",
								" en la lista para editar sus parámetros."
							]
						})]
					}) : /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsxs("div", {
						className: "border-b border-separator p-3",
						children: [
							/* @__PURE__ */ jsx("h3", {
								className: "text-[13px] font-semibold text-foreground",
								children: def.name
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-1 text-[12px] leading-snug text-text-secondary",
								children: def.description
							}),
							def.unsupported ? /* @__PURE__ */ jsxs("p", {
								className: "mt-2 flex items-start gap-1.5 rounded bg-[var(--ev-warning)] px-2 py-1.5 text-[11.5px] text-[#FFBC57]",
								children: [/* @__PURE__ */ jsx(AlertTriangle, { className: "mt-0.5 h-3.5 w-3.5 shrink-0" }), "Esta instrucción no está simulada por el motor de vista previa de Nexus Engine."]
							}) : null
						]
					}), /* @__PURE__ */ jsxs("div", {
						className: "min-h-0 flex-1 overflow-y-auto p-3",
						children: [/* @__PURE__ */ jsx("div", {
							className: "rounded border border-[#32323B] bg-[#25252E] p-3 text-[13px] leading-8 text-[var(--ev-row-text)]",
							children: sentenceParts(def).map((part, index) => "paramIndex" in part && part.paramIndex !== void 0 ? /* @__PURE__ */ jsx(InlineParam, {
								def,
								paramIndex: part.paramIndex,
								value: parameters[def.parameters[part.paramIndex]?.name ?? ""] ?? "",
								onChange: (next) => {
									const name = def.parameters[part.paramIndex ?? 0]?.name ?? String(part.paramIndex);
									setParameters((state) => ({
										...state,
										[name]: next
									}));
								},
								scene,
								project,
								objectName: objectNameForBehaviors
							}, index) : /* @__PURE__ */ jsx("span", { children: part.text }, index))
						}), /* @__PURE__ */ jsxs("div", {
							className: "mt-3 overflow-hidden rounded border border-separator",
							children: [/* @__PURE__ */ jsx("div", {
								className: "bg-[#25252E] px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#D6DEEC]",
								children: "Parámetros"
							}), /* @__PURE__ */ jsx("table", {
								className: "w-full table-fixed text-[12px]",
								children: /* @__PURE__ */ jsxs("tbody", { children: [def.parameters.map((parameter, index) => /* @__PURE__ */ jsxs("tr", {
									className: cn(index % 2 === 0 ? "bg-[#1D1D26]" : "bg-[#23232A]"),
									children: [
										/* @__PURE__ */ jsx("th", {
											className: "w-40 truncate px-2 py-1 text-left font-normal text-text-secondary",
											children: parameter.label
										}),
										/* @__PURE__ */ jsx("td", {
											className: "truncate px-2 py-1 text-left text-foreground",
											children: parameters[parameter.name] || /* @__PURE__ */ jsx("span", {
												className: "text-text-placeholder",
												children: "—"
											})
										}),
										/* @__PURE__ */ jsx("td", {
											className: "w-24 px-2 py-1 text-right text-[10px] uppercase text-text-placeholder",
											children: parameter.type
										})
									]
								}, parameter.name)), def.parameters.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", {
									className: "px-2 py-1 text-text-secondary",
									children: "Sin parámetros"
								}) }) : null] })
							})]
						})]
					})] })
				})
			]
		})
	});
}
var defaultsFor = (def) => {
	const out = {};
	for (const parameter of def.parameters) out[parameter.name] = parameter.defaultValue;
	return out;
};
function findEventById(events, id) {
	for (const event of events) {
		if (event.id === id) return event;
		const found = findEventById(event.subEvents, id);
		if (found) return found;
	}
}
function InlineParam({ def, paramIndex, value, onChange, scene, project, objectName }) {
	const parameter = def.parameters[paramIndex];
	if (!parameter) return null;
	const kind = PARAM_TO_EXPRESSION[parameter.type] ?? "string";
	const objectChoices = [...scene.objects.map((object) => object.name), ...(scene.groups ?? []).map((group) => group.name)];
	const choicesFor = () => {
		switch (parameter.type) {
			case "object":
			case "textObject": return objectChoices;
			case "layer": return scene.layers.map((layer) => layer.name);
			case "scene": return project.scenes.map((entry) => entry.name);
			case "behavior": return (scene.objects.find((entry) => entry.name === objectName)?.behaviors ?? []).map((behavior) => behavior.name);
			case "animation": return (scene.objects.find((entry) => entry.name === objectName)?.animations ?? []).map((animation) => animation.name);
			case "key": return KEYS.map((entry) => entry.name);
			case "button": return MOUSE_BUTTONS.map((entry) => entry.name);
			case "operator": return OPERATORS;
			case "modop": return MODOPS.map((modop) => modop.value);
			case "sound": return project.resources.filter((r) => r.kind === "audio").map((r) => r.name);
			case "varobj": return [...scene.variables.map((variable) => variable.name), ...(scene.objects.find((entry) => entry.name === objectName)?.variables ?? []).map((variable) => variable.name)];
			case "varglobal": return project.globalVariables.map((variable) => variable.name);
			case "choices": return parameter.choices ?? [];
			default: return parameter.choices;
		}
	};
	const labels = parameter.type === "modop" ? Object.fromEntries(MODOPS.map((modop) => [modop.value, modop.label])) : parameter.type === "key" ? Object.fromEntries(KEYS.map((entry) => [entry.name, entry.label])) : parameter.type === "button" ? Object.fromEntries(MOUSE_BUTTONS.map((entry) => [entry.name, entry.label])) : void 0;
	return /* @__PURE__ */ jsxs("span", {
		className: "mx-1 inline-flex min-w-40 items-center gap-1 align-middle",
		children: [/* @__PURE__ */ jsxs("span", {
			className: "shrink-0 text-[11px] text-text-secondary",
			children: [parameter.label, ":"]
		}), /* @__PURE__ */ jsx(ExpressionField, {
			value,
			kind,
			choices: choicesFor(),
			choiceLabels: labels,
			onChange
		})]
	});
}
//#endregion
//#region src/lib/runtime/expression.ts
var isDigit = (c) => c >= "0" && c <= "9";
var isIdentStart = (c) => /[A-Za-z_]/.test(c);
var isIdent = (c) => /[A-Za-z0-9_.]/.test(c);
/**
* Functions whose first argument is a *variable name* written without quotes,
* exactly like in GDevelop: `Variable(lives)`, `GlobalVariable(score)`.
*/
var NAME_ARGUMENT_FUNCTIONS = /* @__PURE__ */ new Set([
	"variable",
	"variableasnumber",
	"variablestring",
	"variableasstring",
	"variablechildcount",
	"globalvariable",
	"globalvariableasnumber",
	"globalvariableasstring",
	"globalvariablestring",
	"globalvariablechildcount",
	"objectvariable",
	"objectvariableasnumber",
	"objectvariablestring",
	"objectvariablechildcount"
]);
/** Object accessors that take the object name as their first argument. */
var OBJECT_ACCESSOR_FUNCTIONS = {
	objectx: "x",
	objecty: "y",
	objectcenterx: "centerx",
	objectcentery: "centery",
	centerx: "centerx",
	centery: "centery",
	objectangle: "angle",
	objectwidth: "width",
	objectheight: "height",
	objectopacity: "opacity",
	objectdepth: "zorder",
	objectvisible: "visible",
	visible: "visible",
	hidden: "hidden",
	flippedx: "flipped",
	animationname: "animationname",
	currentframe: "currentframe",
	objecttimelelife: "timelife"
};
function tokenize(input) {
	const tokens = [];
	let i = 0;
	while (i < input.length) {
		const c = input[i];
		if (c === " " || c === "	" || c === "\n") {
			i++;
			continue;
		}
		if (c === "\"") {
			let out = "";
			i++;
			while (i < input.length && input[i] !== "\"") {
				out += input[i];
				i++;
			}
			i++;
			tokens.push({
				kind: "str",
				value: out
			});
			continue;
		}
		if (isDigit(c) || c === "." && isDigit(input[i + 1] ?? "")) {
			let out = "";
			while (i < input.length && (isDigit(input[i]) || input[i] === ".")) {
				out += input[i];
				i++;
			}
			tokens.push({
				kind: "num",
				value: out
			});
			continue;
		}
		if (isIdentStart(c)) {
			let out = "";
			while (i < input.length && isIdent(input[i])) {
				out += input[i];
				i++;
			}
			tokens.push({
				kind: "ident",
				value: out
			});
			continue;
		}
		tokens.push({
			kind: "op",
			value: c
		});
		i++;
	}
	return tokens;
}
var Parser = class {
	tokens;
	ctx;
	pos = 0;
	constructor(tokens, ctx) {
		this.tokens = tokens;
		this.ctx = ctx;
	}
	peek() {
		return this.tokens[this.pos];
	}
	eat(value) {
		const token = this.tokens[this.pos];
		if (!token) return void 0;
		if (value !== void 0 && token.value !== value) return void 0;
		this.pos++;
		return token;
	}
	parseExpression() {
		let left = this.parseTerm();
		for (;;) {
			const token = this.peek();
			if (!token || token.kind !== "op" || token.value !== "+" && token.value !== "-") break;
			this.pos++;
			const right = this.parseTerm();
			if (token.value === "+") left = typeof left === "string" || typeof right === "string" ? `${asString(left)}${asString(right)}` : left + right;
			else left = asNumber(left) - asNumber(right);
		}
		return left;
	}
	parseTerm() {
		let left = this.parseUnary();
		for (;;) {
			const token = this.peek();
			if (!token || token.kind !== "op" || token.value !== "*" && token.value !== "/" && token.value !== "%") break;
			this.pos++;
			const right = asNumber(this.parseUnary());
			const l = asNumber(left);
			if (token.value === "*") left = l * right;
			else if (token.value === "/") left = right === 0 ? 0 : l / right;
			else left = right === 0 ? 0 : l % right;
		}
		return left;
	}
	parseUnary() {
		if (this.peek()?.value === "-") {
			this.pos++;
			return -asNumber(this.parseUnary());
		}
		if (this.peek()?.value === "+") {
			this.pos++;
			return this.parseUnary();
		}
		return this.parsePrimary();
	}
	parsePrimary() {
		const token = this.eat();
		if (!token) return 0;
		if (token.kind === "num") return Number(token.value);
		if (token.kind === "str") return token.value;
		if (token.kind === "op" && token.value === "(") {
			const value = this.parseExpression();
			this.eat(")");
			return value;
		}
		if (token.kind === "ident") {
			const args = [];
			if (this.peek()?.value === "(") {
				this.pos++;
				const nameArgument = NAME_ARGUMENT_FUNCTIONS.has(token.value.toLowerCase());
				while (this.peek() && this.peek().value !== ")") {
					const name = this.tryParseNameArgument(nameArgument);
					args.push(name === null ? this.parseExpression() : name);
					if (this.peek()?.value === ",") this.pos++;
				}
				this.eat(")");
			}
			return this.callIdentifier(token.value, args);
		}
		return 0;
	}
	/**
	* Reads an argument written as a bare name. `Variable(score)` always means the
	* variable called *score*; the other functions use it for object names, which
	* only counts when the name is not a scene variable — so `Max(1, Puntos)`
	* keeps evaluating `Puntos` as an expression.
	*/
	tryParseNameArgument(alwaysName) {
		const token = this.peek();
		if (!token || token.kind !== "ident") return null;
		const next = this.tokens[this.pos + 1];
		if (next && next.value !== "," && next.value !== ")") return null;
		if (!alwaysName && this.ctx.variables[token.value] !== void 0) return null;
		this.pos++;
		return token.value;
	}
	/** Reads an object property expression (`Player.X()`, `ObjectY(Player)` ...). */
	readObjectProperty(target, property, args) {
		const ctx = this.ctx;
		switch (property.toLowerCase()) {
			case "x": return target.x;
			case "livescount": return target.health;
			case "visible": return target.hidden ? 0 : 1;
			case "hidden": return target.hidden ? 1 : 0;
			case "flipped": return target.flipX ? 1 : 0;
			case "animationnam":
			case "animationname": return target.animationName;
			case "timelife": return ctx.time;
			case "currentframe": return target.frameIndex;
			case "y": return target.y;
			case "angle": return target.angle;
			case "width": return target.width;
			case "height": return target.height;
			case "opacity": return target.opacity;
			case "zorder": return target.zOrder;
			case "centerx": return target.x + target.width / 2;
			case "centery": return target.y + target.height / 2;
			case "variable": return Number(target.variables[asString(args[0] ?? "")] ?? 0);
			case "variablestring": return target.variables[asString(args[0] ?? "")] ?? "";
			case "lives": return target.health;
			default: return 0;
		}
	}
	callIdentifier(rawName, args) {
		const ctx = this.ctx;
		const name = rawName;
		const accessor = OBJECT_ACCESSOR_FUNCTIONS[name.toLowerCase()];
		if (accessor) {
			const target = pickFirst(ctx, asString(args[0] ?? ""));
			return target ? this.readObjectProperty(target, accessor, args) : 0;
		}
		if (name.includes(".")) {
			const [objectName = "", rawProp = ""] = name.split(".");
			const target = pickFirst(ctx, objectName);
			if (!target) return 0;
			return this.readObjectProperty(target, rawProp, args);
		}
		switch (name.toLowerCase()) {
			case "variable":
			case "variableasnumber": return Number(ctx.variables[asString(args[0] ?? "")] ?? 0);
			case "variablestring":
			case "variableasstring": return ctx.variables[asString(args[0] ?? "")] ?? "";
			case "globalvariable": return Number(ctx.globalVariables?.[asString(args[0] ?? "")] ?? 0);
			case "globalvariablestring": return ctx.globalVariables?.[asString(args[0] ?? "")] ?? "";
			case "scene": return ctx.sceneName ?? "";
			case "camerax": return ctx.camera?.x ?? 0;
			case "cameray": return ctx.camera?.y ?? 0;
			case "mousex": return ctx.pointer?.x ?? 0;
			case "mousey": return ctx.pointer?.y ?? 0;
			case "randominrange": return asNumber(args[0] ?? 0) + Math.floor(Math.random() * (asNumber(args[1] ?? 0) - asNumber(args[0] ?? 0) + 1));
			case "timerelapsedtime":
			case "tolowercase": return asString(args[0] ?? "").toLowerCase();
			case "touppercase": return asString(args[0] ?? "").toUpperCase();
			case "strlen": return asString(args[0] ?? "").length;
			case "tostring": return asString(args[0] ?? "");
			case "tonumber": return asNumber(args[0] ?? 0);
			case "random": return Math.floor(Math.random() * (asNumber(args[0] ?? 0) + 1));
			case "randomfloat": return Math.random() * asNumber(args[0] ?? 1);
			case "timedelta": return ctx.delta;
			case "timefromstart": return ctx.time;
			case "abs": return Math.abs(asNumber(args[0] ?? 0));
			case "floor": return Math.floor(asNumber(args[0] ?? 0));
			case "ceil": return Math.ceil(asNumber(args[0] ?? 0));
			case "round": return Math.round(asNumber(args[0] ?? 0));
			case "min": return Math.min(asNumber(args[0] ?? 0), asNumber(args[1] ?? 0));
			case "max": return Math.max(asNumber(args[0] ?? 0), asNumber(args[1] ?? 0));
			case "cos": return Math.cos(asNumber(args[0] ?? 0) * Math.PI / 180);
			case "sin": return Math.sin(asNumber(args[0] ?? 0) * Math.PI / 180);
			case "sqrt": return Math.sqrt(Math.abs(asNumber(args[0] ?? 0)));
			default: return ctx.variables[name] ?? 0;
		}
	}
};
function pickFirst(ctx, objectName) {
	const picked = ctx.picked[objectName];
	if (picked && picked.length > 0) return picked[0];
	return ctx.objects.find((o) => o.name === objectName && !o.destroyed);
}
function asNumber(value, fallback = 0) {
	if (value === void 0 || value === null || value === "") return fallback;
	if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
	if (typeof value === "boolean") return value ? 1 : 0;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
}
function asString(value) {
	if (typeof value === "string") return value;
	return Number.isInteger(value) ? String(value) : String(Math.round(value * 1e3) / 1e3);
}
/** Evaluates an expression, returning a number or a string. */
function evaluate(source, ctx) {
	if (!source) return 0;
	try {
		return new Parser(tokenize(source), ctx).parseExpression();
	} catch {
		return 0;
	}
}
var evalNumber = (source, ctx) => asNumber(evaluate(source, ctx));
var evalString = (source, ctx) => {
	const trimmed = source.trim();
	if (trimmed && !/["+]/.test(trimmed) && !/^[\d.\s-]+$/.test(trimmed)) return trimmed;
	return asString(evaluate(source, ctx));
};
//#endregion
//#region src/lib/runtime/types.ts
/** Physics constants for the built-in platformer behavior (GDevelop defaults). */
var PHYSICS = {
	gravity: 1800,
	maxFallSpeed: 900,
	jumpSpeed: 600,
	jumpSustain: 300,
	acceleration: 800,
	maxSpeed: 250,
	friction: 20,
	damping: .86
};
//#endregion
//#region src/lib/runtime/engine.ts
var runtimeIdCounter = 0;
var nextId = () => `rt_${++runtimeIdCounter}`;
var GameRuntime = class GameRuntime {
	state;
	width;
	height;
	scene;
	project;
	options;
	onceFlags = /* @__PURE__ */ new Set();
	keys = /* @__PURE__ */ new Set();
	keysReleased = /* @__PURE__ */ new Set();
	keysPressedOnce = /* @__PURE__ */ new Set();
	mouse = /* @__PURE__ */ new Set();
	reportedDiagnostics = /* @__PURE__ */ new Set();
	activeExternalEvents = /* @__PURE__ */ new Set();
	pointer = {
		x: 0,
		y: 0
	};
	constructor(scene, options = {}, project = null) {
		this.options = options;
		this.project = project;
		this.scene = scene;
		this.width = scene.windowWidth;
		this.height = scene.windowHeight;
		this.state = this.createState();
	}
	/** Convenience for the preview: run one scene of a whole project. */
	static forProject(project, scene, options = {}) {
		return new GameRuntime(toRuntimeSceneFromProject(project, scene), options, project);
	}
	createState() {
		const layers = {};
		const baseName = this.scene.layers[0]?.name;
		for (const layer of this.scene.layers) {
			const isBase = layer.name === baseName;
			const follows = !isBase && layer.followBaseLayer !== false;
			layers[layer.name] = {
				name: layer.name,
				visible: layer.visible,
				cameraX: follows ? 0 : layer.camera?.x ?? 0,
				cameraY: follows ? 0 : layer.camera?.y ?? 0,
				cameraZoom: 1,
				opacity: 255,
				followBaseLayer: !isBase && follows
			};
		}
		const fallbackLayer = this.scene.layers[0]?.name ?? "Base layer";
		if (!layers[fallbackLayer]) layers[fallbackLayer] = {
			name: fallbackLayer,
			visible: true,
			cameraX: 0,
			cameraY: 0,
			cameraZoom: 1,
			opacity: 255,
			followBaseLayer: false
		};
		const objects = this.scene.instances.map((instance) => {
			const def = this.scene.objects.find((o) => o.id === instance.objectId);
			return this.createRuntimeObject(def, {
				x: instance.x,
				y: instance.y,
				angle: instance.angle,
				zOrder: instance.zOrder,
				layer: instance.layer,
				width: instance.width,
				height: instance.height,
				hidden: instance.hiddenAtStart ?? false,
				effects: instance.effects,
				variables: [...def?.variables ?? [], ...instance.variables ?? []],
				useInstanceSize: true
			});
		});
		return {
			objects,
			layers,
			variables: flattenVariables(this.scene.sceneVariables),
			globalVariables: flattenVariables(this.scene.globalVariables),
			timers: {},
			pausedTimers: {},
			camera: {
				x: 0,
				y: 0
			},
			time: 0,
			timeScale: 1,
			frame: 0,
			sceneName: this.scene.name,
			logs: [],
			paused: false,
			stats: {
				objectsCount: objects.length,
				instructionsCount: 0,
				eventsCount: 0,
				frameTimeMs: 0
			}
		};
	}
	createRuntimeObject(def, patch) {
		const first = (def?.animations ?? [])[0];
		const frame = first?.images[0];
		const behaviors = def?.behaviors ?? [];
		const behaviorTypes = {};
		const behaviorProps = {};
		let platformer = null;
		for (const behavior of behaviors) {
			behaviorTypes[behavior.name] = behavior.type;
			behaviorProps[behavior.name] = behavior.properties;
			if (behavior.type === "PlatformBehavior::PlatformerObjectBehavior") platformer = behavior.properties;
		}
		const healthBehavior = behaviors.find((b) => b.type === "Health::Health");
		const flashBehavior = behaviors.find((b) => b.type === "Flash::Flash");
		const object = {
			id: nextId(),
			name: def?.name ?? "Desconocido",
			type: def?.type ?? "Sprite",
			...def?.asset ? { asset: def.asset } : {},
			...frame?.hitBox ? { hitBox: frame.hitBox } : {},
			x: patch.x,
			y: patch.y,
			width: patch.width,
			height: patch.height,
			angle: patch.angle,
			zOrder: patch.zOrder,
			layer: patch.layer,
			opacity: 255,
			hidden: patch.hidden,
			flipX: false,
			flipY: false,
			text: def?.text ?? "",
			textColor: def?.textColor ?? "#FAFAFA",
			textSize: def?.textSize ?? 24,
			bold: def?.bold ?? false,
			...def?.fontFamily ? { fontFamily: def.fontFamily } : {},
			alignment: def?.alignment ?? "left",
			animationIndex: 0,
			animationName: first?.name ?? "",
			timeBetweenFrames: first?.timeBetweenFrames ?? 0,
			animationSpeedScale: 1,
			frameIndex: 0,
			frameTimer: 0,
			behaviors: behaviors.map((b) => b.name),
			behaviorTypes,
			behaviorProps,
			controls: {
				left: false,
				right: false,
				up: false,
				down: false,
				jump: false
			},
			ignoreControls: false,
			onFloor: false,
			jumping: false,
			falling: false,
			vx: 0,
			vy: 0,
			gravity: asNumber(platformer?.["gravity"], PHYSICS.gravity),
			maxFallingSpeed: asNumber(platformer?.["maxFallingSpeed"], PHYSICS.maxFallSpeed),
			friction: asNumber(platformer?.["friction"], PHYSICS.friction),
			health: asNumber(healthBehavior?.properties["health"], 100),
			maxHealth: asNumber(healthBehavior?.properties["maxHealth"], 100),
			flash: {
				active: false,
				elapsed: 0,
				duration: asNumber(flashBehavior?.properties["flashDuration"], .2),
				half: asNumber(flashBehavior?.properties["halfTimes"], .1),
				hidden: false
			},
			tweens: {},
			tint: null,
			colorOverlay: null,
			variables: flattenVariables(patch.variables),
			destroyed: false
		};
		if (frame && !patch.useInstanceSize) object.asset = frame.image;
		else if (frame) object.asset = frame.image;
		for (const effect of patch.effects ?? []) {
			if (effect.parameters["disabled"] === "yes") continue;
			if (effect.type === "Tint") object.tint = [
				asNumber(effect.parameters["r"], 255),
				asNumber(effect.parameters["g"], 255),
				asNumber(effect.parameters["b"], 255)
			];
			else if (effect.type === "ColorOverlay") object.colorOverlay = [
				asNumber(effect.parameters["r"], 255),
				asNumber(effect.parameters["g"], 255),
				asNumber(effect.parameters["b"], 255),
				asNumber(effect.parameters["alpha"], 255)
			];
		}
		return object;
	}
	reset() {
		this.onceFlags.clear();
		this.keys.clear();
		this.keysReleased.clear();
		this.keysPressedOnce.clear();
		this.mouse.clear();
		this.reportedDiagnostics.clear();
		this.activeExternalEvents.clear();
		this.state = this.createState();
	}
	/** GDevelop reloads the whole scene on ChangeScene. */
	loadScene(name) {
		if (!this.project) return false;
		const scene = this.project.scenes.find((s) => s.name === name);
		if (!scene) return false;
		this.scene = toRuntimeSceneFromProject(this.project, scene);
		this.width = this.scene.windowWidth;
		this.height = this.scene.windowHeight;
		const keepGlobals = this.state.globalVariables;
		const keys = new Set(this.keys);
		this.reset();
		this.state.globalVariables = keepGlobals;
		for (const key of keys) this.keys.add(key);
		return true;
	}
	pressKey(key) {
		const normalized = normalizeKey(key);
		if (!this.keys.has(normalized)) this.keysPressedOnce.add(normalized);
		this.keys.add(normalized);
	}
	releaseKey(key) {
		const normalized = normalizeKey(key);
		this.keys.delete(normalized);
		this.keysReleased.add(normalized);
	}
	pressMouse(button = "Left") {
		this.mouse.add(button);
	}
	releaseMouse(button = "Left") {
		this.mouse.delete(button);
	}
	movePointer(x, y) {
		this.pointer.x = x;
		this.pointer.y = y;
	}
	isKeyPressed(key) {
		return this.keys.has(normalizeKey(key));
	}
	step(deltaSeconds) {
		const startedAt = nowMs();
		const raw = Math.min(deltaSeconds, 1 / 20);
		if (this.state.paused) {
			this.state.frame += 1;
			return;
		}
		const delta = raw * (this.state.timeScale || 1);
		this.state.time += delta;
		this.state.frame += 1;
		for (const name of Object.keys(this.state.timers)) {
			if (this.state.pausedTimers[name]) continue;
			this.state.timers[name] = (this.state.timers[name] ?? 0) + delta;
		}
		this.state.stats.instructionsCount = 0;
		this.state.stats.eventsCount = 0;
		this.runEvents(this.scene.events, {}, delta);
		this.updateAnimations(delta);
		this.updateTweens(delta);
		this.updateFlash(delta);
		this.simulatePhysics(delta);
		const baseLayer = this.state.layers[this.baseLayerName()];
		if (baseLayer) {
			this.state.camera.x = baseLayer.cameraX;
			this.state.camera.y = baseLayer.cameraY;
			this.state.camera.zoom = baseLayer.cameraZoom;
		}
		this.state.objects = this.state.objects.filter((object) => !object.destroyed);
		this.state.stats.objectsCount = this.state.objects.length;
		this.keysReleased.clear();
		this.keysPressedOnce.clear();
		this.state.stats.frameTimeMs = nowMs() - startedAt;
	}
	ctx(picked, delta) {
		return {
			variables: this.state.variables,
			globalVariables: this.state.globalVariables,
			objects: this.state.objects,
			picked,
			timers: this.state.timers,
			time: this.state.time,
			delta,
			camera: this.state.camera,
			pointer: this.pointer
		};
	}
	live(name) {
		const members = this.groupMembers(name);
		if (members) {
			const out = [];
			for (const member of members) for (const object of this.state.objects) if (object.name === member && !object.destroyed && !out.includes(object)) out.push(object);
			return out;
		}
		return this.state.objects.filter((o) => o.name === name && !o.destroyed);
	}
	/** Object groups behave like an object that owns the instances of its members. */
	groupMembers(name) {
		const group = this.scene.groups?.find((g) => g.name === name);
		return group ? group.objects : null;
	}
	pickList(picked, name) {
		const existing = picked[name];
		if (existing) return existing.filter((o) => !o.destroyed);
		const all = this.live(name);
		picked[name] = all;
		return all;
	}
	runEvents(events, inherited, delta) {
		let previousEventRan = null;
		for (const event of events) {
			if (event.disabled) {
				previousEventRan = null;
				continue;
			}
			if (event.kind === "comment") continue;
			const picked = {};
			for (const [key, value] of Object.entries(inherited)) picked[key] = [...value];
			if (event.kind === "group") {
				this.runEvents(event.subEvents, picked, delta);
				previousEventRan = null;
				continue;
			}
			if (event.kind === "link") {
				previousEventRan = this.runExternalEvents(event, picked, delta);
				if (previousEventRan) this.state.stats.eventsCount += 1;
				continue;
			}
			if (event.kind === "else") {
				if (previousEventRan !== false) {
					previousEventRan = null;
					continue;
				}
				previousEventRan = true;
				for (const action of event.actions) {
					if (action.disabled) continue;
					this.runAction(action, picked, delta, event.id);
					this.state.stats.instructionsCount += 1;
				}
				this.runEvents(event.subEvents, picked, delta);
				continue;
			}
			const activeConditions = event.conditions.filter((condition) => !condition.disabled);
			const conditionsPass = activeConditions.every((condition) => {
				if (condition.typeId === "BuiltinCommonInstructions::Else") return previousEventRan === false;
				const result = this.evalCondition(condition, picked, delta, event.id);
				this.state.stats.instructionsCount += 1;
				if (result === null) return false;
				return condition.inverted ? !result : result;
			});
			if (activeConditions.length > 0 && !conditionsPass) {
				previousEventRan = false;
				continue;
			}
			previousEventRan = true;
			this.state.stats.eventsCount += 1;
			for (const action of event.actions) {
				if (action.disabled) continue;
				this.runAction(action, picked, delta, event.id);
				this.state.stats.instructionsCount += 1;
			}
			this.runEvents(event.subEvents, picked, delta);
		}
	}
	runExternalEvents(event, picked, delta) {
		const name = event.linkToEventsName?.trim() ?? "";
		const externalEvents = this.project?.externalEvents.find((entry) => entry.name === name);
		if (!name || !externalEvents) {
			this.reportInvalidExternalEventsLink(event.id, name, "no existe");
			return false;
		}
		if (this.activeExternalEvents.has(name)) {
			this.reportInvalidExternalEventsLink(event.id, name, "crearía una referencia circular");
			return false;
		}
		this.activeExternalEvents.add(name);
		try {
			this.runEvents(externalEvents.events, picked, delta);
		} finally {
			this.activeExternalEvents.delete(name);
		}
		return true;
	}
	evalCondition(instruction, picked, delta, eventId) {
		const p = instruction.parameters;
		const ctx = this.ctx(picked, delta);
		switch (instruction.typeId) {
			case "BuiltinCommonInstructions::Once":
			case "SceneJustBegins": {
				const key = `${eventId}:${instruction.id}`;
				if (this.onceFlags.has(key)) return false;
				this.onceFlags.add(key);
				return true;
			}
			case "BuiltinCommonInstructions::Else": return true;
			case "BuiltinCommonInstructions::CompareValues": return compare(evalNumber(p["left"] ?? "0", ctx), p["operator"] ?? "=", evalNumber(p["right"] ?? "0", ctx));
			case "BuiltinCommonInstructions::StrEqual": return compareStrings(evalString(p["left"] ?? "", ctx), p["operator"] ?? "=", evalString(p["right"] ?? "", ctx));
			case "CompareSceneVar": return compare(asNumber(this.state.variables[p["variable"] ?? ""] ?? 0), p["operator"] ?? "=", evalNumber(p["value"] ?? "0", ctx));
			case "CompareSceneVarString": return compareStrings(evalString(String(this.state.variables[p["variable"] ?? ""] ?? ""), ctx), p["operator"] ?? "=", evalString(p["value"] ?? "", ctx));
			case "CompareGlobalVar": return compare(asNumber(this.state.globalVariables[p["variable"] ?? ""] ?? 0), p["operator"] ?? "=", evalNumber(p["value"] ?? "0", ctx));
			case "ValueOfTimer": {
				const name = p["timer"] ?? "";
				const value = this.state.timers[name];
				if (value === void 0) {
					this.state.timers[name] = 0;
					return false;
				}
				return compare(value, p["operator"] ?? ">", evalNumber(p["seconds"] ?? "0", ctx));
			}
			case "TimerRepeated": {
				const name = p["timer"] ?? "";
				const limit = evalNumber(p["seconds"] ?? "0", ctx);
				const value = this.state.timers[name];
				if (value === void 0) {
					this.state.timers[name] = 0;
					return false;
				}
				if (value < limit) return false;
				this.state.timers[name] = 0;
				return true;
			}
			case "KeyPressed": return this.keys.has(normalizeKey(p["key"] ?? ""));
			case "KeyNotPressed": return !this.keys.has(normalizeKey(p["key"] ?? ""));
			case "KeyReleased": return this.keysReleased.has(normalizeKey(p["key"] ?? "")) || this.keysPressedOnce.has(normalizeKey(p["key"] ?? ""));
			case "SourisBouton": return this.mouse.has(p["button"] ?? "Left");
			case "SourisSurObjet": {
				const list = this.pickList(picked, p["object"] ?? "").filter((object) => pointInObject(object, this.pointer.x, this.pointer.y));
				picked[p["object"] ?? ""] = list;
				return list.length > 0;
			}
			case "Collision": {
				const [hitA, hitB] = this.collisions(p["object"] ?? "", p["object2"] ?? "", p["ignoreTouchingEdges"] === "yes");
				picked[p["object"] ?? ""] = hitA;
				picked[p["object2"] ?? ""] = hitB;
				return hitA.length > 0;
			}
			case "Separation": {
				const [hitA, hitB] = this.collisions(p["object"] ?? "", p["object2"] ?? "", p["ignoreTouchingEdges"] === "yes");
				const colliding = new Set(hitA);
				const list = this.pickList(picked, p["object"] ?? "").filter((o) => !colliding.has(o));
				picked[p["object"] ?? ""] = list;
				return list.length > 0;
			}
			case "OnFloor":
			case "PlatformBehavior::IsOnFloor": {
				const list = this.pickList(picked, p["object"] ?? "").filter((o) => o.onFloor);
				picked[p["object"] ?? ""] = list;
				return list.length > 0;
			}
			case "PlatformBehavior::IsJumping": {
				const list = this.pickList(picked, p["object"] ?? "").filter((o) => o.jumping);
				picked[p["object"] ?? ""] = list;
				return list.length > 0;
			}
			case "PlatformBehavior::IsFalling": {
				const list = this.pickList(picked, p["object"] ?? "").filter((o) => o.falling && !o.onFloor);
				picked[p["object"] ?? ""] = list;
				return list.length > 0;
			}
			case "PosX": return this.filterObjects(picked, p["object"] ?? "", (object) => compare(object.x, p["operator"] ?? "=", evalNumber(p["value"] ?? "0", ctx)));
			case "PosY": return this.filterObjects(picked, p["object"] ?? "", (object) => compare(object.y, p["operator"] ?? "=", evalNumber(p["value"] ?? "0", ctx)));
			case "Angle": return this.filterObjects(picked, p["object"] ?? "", (object) => compare(object.angle, p["operator"] ?? "=", evalNumber(p["value"] ?? "0", ctx)));
			case "Visible": return this.filterObjects(picked, p["object"] ?? "", (object) => !object.hidden);
			case "Opacity": return this.filterObjects(picked, p["object"] ?? "", (object) => compare(object.opacity, p["operator"] ?? "=", evalNumber(p["value"] ?? "0", ctx)));
			case "AnimationNameIs": {
				const wanted = evalString(p["animation"] ?? "", ctx);
				return this.filterObjects(picked, p["object"] ?? "", (o) => o.animationName === wanted);
			}
			case "Health::IsDead": return this.filterObjects(picked, p["object"] ?? "", (o) => o.health <= 0);
			case "Health::CompareHealth": return this.filterObjects(picked, p["object"] ?? "", (o) => compare(o.health, p["operator"] ?? "=", evalNumber(p["value"] ?? "0", ctx)));
			case "Flash::IsFlashEnabled": return this.filterObjects(picked, p["object"] ?? "", (o) => o.flash.active);
			case "Tween::TweenFinished": {
				const name = p["name"] ?? "0";
				return this.filterObjects(picked, p["object"] ?? "", (o) => !!o.tweens[name]?.done);
			}
			default:
				this.reportUnsupportedInstruction("condition", instruction, eventId);
				return null;
		}
	}
	collisions(objectA, objectB, ignoreTouchingEdges) {
		const a = this.pickListFor(objectA);
		const b = this.pickListFor(objectB);
		const hitA = [];
		const hitB = [];
		const pad = ignoreTouchingEdges ? 1 : 0;
		for (const objA of a) for (const objB of b) if (objA !== objB && overlaps(objA, objB, pad)) {
			if (!hitA.includes(objA)) hitA.push(objA);
			if (!hitB.includes(objB)) hitB.push(objB);
		}
		return [hitA, hitB];
	}
	pickListFor(name) {
		return this.live(name);
	}
	filterObjects(picked, name, predicate) {
		const list = this.pickList(picked, name).filter(predicate);
		picked[name] = list;
		return list.length > 0;
	}
	targetsOf(picked, name) {
		return this.pickList(picked, name);
	}
	runAction(instruction, picked, delta, eventId) {
		const p = instruction.parameters;
		const ctx = this.ctx(picked, delta);
		const targets = () => this.targetsOf(picked, p["object"] ?? "");
		switch (instruction.typeId) {
			case "Create": {
				const def = this.scene.objects.find((o) => o.name === p["object"]);
				if (!def) break;
				const template = this.scene.instances.find((i) => i.objectId === def.id);
				const created = this.createRuntimeObject(def, {
					x: evalNumber(p["x"] ?? "0", ctx),
					y: evalNumber(p["y"] ?? "0", ctx),
					angle: 0,
					zOrder: template?.zOrder ?? 1,
					layer: p["layer"] || this.scene.layers[0]?.name || "Base layer",
					width: template?.width ?? 64,
					height: template?.height ?? 64,
					hidden: false,
					effects: def.effects,
					variables: def.variables,
					useInstanceSize: false
				});
				this.state.objects.push(created);
				picked[def.name] = [created];
				break;
			}
			case "Delete":
				for (const object of targets()) object.destroyed = true;
				break;
			case "PosObj": {
				const x = evalNumber(p["x"] ?? "0", ctx);
				const y = evalNumber(p["y"] ?? "0", ctx);
				const useCenter = p["useCenterPosition"] === "yes";
				for (const object of targets()) {
					object.x = useCenter ? x - object.width / 2 : x;
					object.y = useCenter ? y - object.height / 2 : y;
				}
				break;
			}
			case "ChangeX":
				for (const object of targets()) object.x = applyModOp(object.x, p["op"] ?? "set to", evalNumber(p["value"] ?? "0", ctx));
				break;
			case "ChangeY":
				for (const object of targets()) object.y = applyModOp(object.y, p["op"] ?? "set to", evalNumber(p["value"] ?? "0", ctx));
				break;
			case "SetAngle":
				for (const object of targets()) object.angle = normalizeAngle(applyModOp(object.angle, p["op"] ?? "set to", evalNumber(p["value"] ?? "0", ctx)));
				break;
			case "ChangeWidth":
				for (const object of targets()) object.width = Math.max(1, applyModOp(object.width, p["op"] ?? "set to", evalNumber(p["value"] ?? "0", ctx)));
				break;
			case "ChangeHeight":
				for (const object of targets()) object.height = Math.max(1, applyModOp(object.height, p["op"] ?? "set to", evalNumber(p["value"] ?? "0", ctx)));
				break;
			case "AddForceAngle": {
				const angle = evalNumber(p["angle"] ?? "0", ctx) * Math.PI / 180;
				const speed = evalNumber(p["speed"] ?? "0", ctx);
				for (const object of targets()) {
					object.vx += Math.cos(angle) * speed;
					object.vy += Math.sin(angle) * speed;
				}
				break;
			}
			case "AddForceXY":
				for (const object of targets()) {
					object.vx += evalNumber(p["x"] ?? "0", ctx);
					object.vy += evalNumber(p["y"] ?? "0", ctx);
				}
				break;
			case "AddForceToward": {
				const target = this.live(p["target"] ?? "")[0];
				const speed = evalNumber(p["speed"] ?? "0", ctx);
				if (!target) break;
				for (const object of targets()) {
					const dx = target.x + target.width / 2 - (object.x + object.width / 2);
					const dy = target.y + target.height / 2 - (object.y + object.height / 2);
					const length = Math.hypot(dx, dy) || 1;
					object.vx += dx / length * speed;
					object.vy += dy / length * speed;
				}
				break;
			}
			case "FlipX": {
				const flip = (p["flip"] ?? "yes") === "yes";
				for (const object of targets()) object.flipX = flip;
				break;
			}
			case "FlipY": {
				const flip = (p["flip"] ?? "yes") === "yes";
				for (const object of targets()) object.flipY = flip;
				break;
			}
			case "SetOpacity":
				for (const object of targets()) object.opacity = clamp(applyModOp(object.opacity, p["op"] ?? "set to", evalNumber(p["value"] ?? "0", ctx)), 0, 255);
				break;
			case "Cache":
				for (const object of targets()) object.hidden = true;
				break;
			case "Montre":
				for (const object of targets()) object.hidden = false;
				break;
			case "ChangeZOrder":
				for (const object of targets()) object.zOrder = applyModOp(object.zOrder, p["op"] ?? "set to", evalNumber(p["value"] ?? "0", ctx));
				break;
			case "ChangeAnimation": {
				const value = Math.round(applyModOp(0, p["op"] ?? "set to", evalNumber(p["value"] ?? "0", ctx)));
				for (const object of targets()) {
					const animations = this.scene.objects.find((o) => o.name === object.name)?.animations ?? [];
					const index = clamp(value, 0, Math.max(0, animations.length - 1));
					if (object.animationIndex === index) continue;
					object.animationIndex = index;
					const animation = animations[index];
					if (animation) {
						object.animationName = animation.name;
						object.timeBetweenFrames = animation.timeBetweenFrames;
						object.frameIndex = 0;
						const frame = animation.images[0];
						if (frame?.image) object.asset = frame.image;
						if (frame?.hitBox) object.hitBox = frame.hitBox;
						else delete object.hitBox;
					}
				}
				break;
			}
			case "ChangeAnimationName": {
				const wanted = evalString(p["animation"] ?? "", ctx);
				for (const object of targets()) {
					const def = this.scene.objects.find((o) => o.name === object.name);
					const index = (def?.animations ?? []).findIndex((a) => a.name === wanted);
					if (index < 0 || index === object.animationIndex) continue;
					const animation = def?.animations?.[index];
					object.animationIndex = index;
					if (animation) {
						object.animationName = animation.name;
						object.timeBetweenFrames = animation.timeBetweenFrames;
						object.frameIndex = 0;
						const frame = animation.images[0];
						if (frame?.image) object.asset = frame.image;
						if (frame?.hitBox) object.hitBox = frame.hitBox;
						else delete object.hitBox;
					}
				}
				break;
			}
			case "SetSpriteSpeed":
				for (const object of targets()) object.animationSpeedScale = Math.max(.05, evalNumber(p["speed"] ?? "100", ctx) / 100);
				break;
			case "TXT::SetText": {
				const text = evalString(p["text"] ?? "", ctx);
				for (const object of targets()) object.text = text;
				break;
			}
			case "TXT::SetFontSize":
				for (const object of targets()) object.textSize = Math.max(1, evalNumber(p["size"] ?? "12", ctx));
				break;
			case "TXT::SetColor":
				for (const object of targets()) object.textColor = rgbToHex(evalNumber(p["r"] ?? "255", ctx), evalNumber(p["g"] ?? "255", ctx), evalNumber(p["b"] ?? "255", ctx));
				break;
			case "ModVarScene": {
				const name = p["variable"] ?? "";
				const current = asNumber(this.state.variables[name] ?? 0);
				this.state.variables[name] = String(applyModOp(current, p["op"] ?? "set to", evalNumber(p["value"] ?? "0", ctx)));
				break;
			}
			case "ModVarSceneTxt": {
				const name = p["variable"] ?? "";
				const next = evalString(p["value"] ?? "", ctx);
				this.state.variables[name] = p["op"] === "add" ? String(this.state.variables[name] ?? "") + next : next;
				break;
			}
			case "ToggleSceneVar": {
				const name = p["variable"] ?? "";
				this.state.variables[name] = p["value"] === "no" ? "false" : "true";
				break;
			}
			case "ModVarGlobal": {
				const name = p["variable"] ?? "";
				const current = asNumber(this.state.globalVariables[name] ?? 0);
				const op = p["op"] ?? "set to";
				const value = evalNumber(p["value"] ?? "0", ctx);
				this.state.globalVariables[name] = String(op === "max" ? Math.max(current, value) : applyModOp(current, op, value));
				break;
			}
			case "ModVarInstance": {
				const name = p["variable"] ?? "";
				const list = this.targetsOf(picked, p["object"] ?? p["instance"] ?? "");
				for (const object of list) object.variables[name] = String(applyModOp(asNumber(object.variables[name] ?? 0), p["op"] ?? "set to", evalNumber(p["value"] ?? "0", ctx)));
				break;
			}
			case "ModVarObjet": {
				const name = p["variable"] ?? "";
				for (const object of targets()) object.variables[name] = String(applyModOp(asNumber(object.variables[name] ?? 0), p["op"] ?? "set to", evalNumber(p["value"] ?? "0", ctx)));
				break;
			}
			case "ResetTimer":
				this.state.timers[p["timer"] ?? ""] = 0;
				break;
			case "PauseTimer":
				this.state.pausedTimers[p["timer"] ?? ""] = true;
				break;
			case "UnpauseTimer":
				delete this.state.pausedTimers[p["timer"] ?? ""];
				break;
			case "CentreCamera": {
				const layer = this.state.layers[p["layer"] ?? this.baseLayerName()];
				const target = targets()[0];
				if (!target || !layer) break;
				layer.cameraX = target.x + target.width / 2 - this.width / 2;
				layer.cameraY = target.y + target.height / 2 - this.height / 2;
				this.state.camera.x = layer.cameraX;
				this.state.camera.y = layer.cameraY;
				break;
			}
			case "SetCameraZoom": {
				const layer = this.state.layers[p["layer"] ?? this.baseLayerName()];
				const zoom = clamp(applyModOp(layer?.cameraZoom ?? 1, p["op"] ?? p["operator"] ?? "set to", evalNumber(p["zoom"] ?? p["factor"] ?? "1", ctx)), .1, 8);
				if (layer) {
					layer.cameraZoom = zoom;
					if (layer === this.state.layers[this.baseLayerName()]) this.state.camera.zoom = zoom;
				}
				break;
			}
			case "HideLayer": {
				const layer = this.state.layers[p["layer"] ?? ""];
				if (layer) layer.visible = false;
				break;
			}
			case "ShowLayer": {
				const layer = this.state.layers[p["layer"] ?? ""];
				if (layer) layer.visible = true;
				break;
			}
			case "SetLayerOpacity": {
				const layer = this.state.layers[p["layer"] ?? ""];
				if (layer) layer.opacity = clamp(applyModOp(layer.opacity, p["op"] ?? "set to", evalNumber(p["value"] ?? "255", ctx)), 0, 255);
				break;
			}
			case "SetTimeScale":
				this.state.timeScale = Math.max(0, applyModOp(this.state.timeScale, p["op"] ?? "set to", evalNumber(p["timeScale"] ?? "1", ctx)));
				break;
			case "PauseGame":
				this.state.paused = true;
				this.log("Game paused");
				break;
			case "SetEffectParameter": {
				const effectIndex = Math.max(1, evalNumber(p["effect"] ?? "1", ctx)) - 1;
				const key = p["parameter"] ?? "r";
				const value = evalNumber(p["value"] ?? "0", ctx);
				for (const object of targets()) {
					const effect = this.scene.objects.find((o) => o.name === object.name)?.effects?.[effectIndex];
					if (!effect) continue;
					if (effect.type === "Tint") {
						const next = [...object.tint ?? [
							255,
							255,
							255
						]];
						if (key === "r") next[0] = value;
						if (key === "g") next[1] = value;
						if (key === "b") next[2] = value;
						object.tint = next;
					} else if (effect.type === "ColorOverlay") {
						const next = [...object.colorOverlay ?? [
							255,
							255,
							255,
							255
						]];
						if (key === "r") next[0] = value;
						if (key === "g") next[1] = value;
						if (key === "b") next[2] = value;
						if (key === "alpha") next[3] = value;
						object.colorOverlay = next;
					}
				}
				break;
			}
			case "PlatformBehavior::SimulateControl": {
				const control = (p["key"] ?? "Right").toLowerCase();
				const pressed = (p["pressed"] ?? "yes") === "yes";
				for (const object of targets()) switch (control) {
					case "left":
						object.controls.left = pressed;
						break;
					case "right":
						object.controls.right = pressed;
						break;
					case "up":
						object.controls.up = pressed;
						break;
					case "down":
						object.controls.down = pressed;
						break;
					case "jump":
						object.controls.jump = pressed;
						if (pressed) this.jump(object);
				}
				break;
			}
			case "PlatformBehavior::SimulateJumpKey":
				for (const object of targets()) this.jump(object);
				break;
			case "PlatformBehavior::IgnoreControl":
				for (const object of targets()) object.ignoreControls = (p["ignore"] ?? "yes") === "yes";
				break;
			case "PlatformBehavior::SetGravity":
				for (const object of targets()) object.gravity = evalNumber(p["gravity"] ?? "1800", ctx);
				break;
			case "Flash::Flash":
				for (const object of targets()) {
					object.flash.active = true;
					object.flash.elapsed = 0;
				}
				break;
			case "Flash::StopFlash":
				for (const object of targets()) {
					object.flash.active = false;
					object.flash.hidden = false;
				}
				break;
			case "Health::RemoveHealth":
				for (const object of targets()) object.health = Math.max(0, object.health - evalNumber(p["health"] ?? "1", ctx));
				break;
			case "Health::AddHealth":
				for (const object of targets()) object.health = Math.min(object.maxHealth, object.health + evalNumber(p["health"] ?? "1", ctx));
				break;
			case "Health::SetHealth":
				for (const object of targets()) object.health = clamp(evalNumber(p["health"] ?? "100", ctx), 0, object.maxHealth);
				break;
			case "Tween::CreateTween":
			case "Tween::CreateTween2": {
				const name = p["name"] ?? "0";
				const kind = p["kind"] ?? "alpha";
				for (const object of targets()) object.tweens[`${kind}:${name}`] = {
					kind,
					from: evalNumber(p["from"] ?? "0", ctx),
					to: evalNumber(p["to"] ?? "0", ctx),
					elapsed: 0,
					duration: Math.max(1e-4, evalNumber(p["duration"] ?? "1", ctx)),
					easing: p["easing"] ?? "easeInOutQuad",
					done: false
				};
				break;
			}
			case "Tween::RemoveTween": {
				const name = p["name"] ?? "0";
				const kind = p["kind"] ?? "alpha";
				for (const object of targets()) delete object.tweens[`${kind}:${name}`];
				break;
			}
			case "PlaySound":
				this.options.onPlaySound?.(p["file"] ?? "", evalNumber(p["volume"] ?? "100", ctx) / 100, (p["loop"] ?? "no") === "yes");
				this.log(`Sonido: ${p["file"] ?? ""}`);
				break;
			case "PlaySoundAtPosition": {
				const file = p["file"] ?? "";
				const volume = evalNumber(p["volume"] ?? "100", ctx) / 100;
				const loop = (p["loop"] ?? "no") === "yes";
				const x = evalNumber(p["x"] ?? "0", ctx);
				const y = evalNumber(p["y"] ?? "0", ctx);
				const stereoAdjustment = evalNumber(p["adjustation"] ?? "60", ctx);
				if (this.options.onPlaySoundAtPosition) this.options.onPlaySoundAtPosition(file, volume, loop, x, y, stereoAdjustment);
				else this.options.onPlaySound?.(file, volume, loop);
				this.log(`Sonido posicional: ${file} (${Math.round(x)}, ${Math.round(y)})`);
				break;
			}
			case "StopSound":
				this.options.onStopSound?.(evalNumber(p["channel"] ?? "0", ctx));
				break;
			case "ChangeScene": {
				const scene = p["scene"] ?? this.state.sceneName;
				this.state.sceneName = scene;
				const loaded = this.loadScene(scene);
				this.options.onChangeScene?.(scene);
				this.log(loaded ? `Escena cambiada a "${scene}"` : `Escena desconocida: ${scene}`);
				break;
			}
			case "EndScene":
				this.state.paused = true;
				this.log("Fin de la escena");
				break;
			default: this.reportUnsupportedInstruction("action", instruction, eventId);
		}
	}
	baseLayerName() {
		return this.scene.layers[0]?.name ?? "Base layer";
	}
	jump(object) {
		if (!object.onFloor || object.ignoreControls) return;
		object.vy = -asNumber(this.platformerProps(object)["jumpSpeed"], PHYSICS.jumpSpeed);
		object.onFloor = false;
		object.jumping = true;
	}
	/** Properties of the platformer behavior, whatever its instance name is. */
	platformerProps(object) {
		for (const name of object.behaviors) if (object.behaviorTypes[name] === "PlatformBehavior::PlatformerObjectBehavior") return object.behaviorProps[name] ?? {};
		return {};
	}
	updateAnimations(delta) {
		for (const object of this.state.objects) {
			if (object.destroyed) continue;
			const animation = this.scene.objects.find((o) => o.name === object.name)?.animations?.[object.animationIndex];
			if (!animation || animation.images.length <= 1) continue;
			const stepMs = Math.max(0, animation.timeBetweenFrames) / Math.max(.05, object.animationSpeedScale);
			object.frameTimer += delta * 1e3;
			if (stepMs === 0) object.frameIndex = (object.frameIndex + 1) % animation.images.length;
			else while (object.frameTimer >= stepMs) {
				object.frameTimer -= stepMs;
				object.frameIndex += 1;
				if (object.frameIndex >= animation.images.length) {
					object.frameIndex = animation.loops ? 0 : animation.images.length - 1;
					if (!animation.loops) break;
				}
			}
			const frame = animation.images[object.frameIndex];
			if (frame?.image) object.asset = frame.image;
			if (frame?.hitBox) object.hitBox = frame.hitBox;
			else delete object.hitBox;
		}
	}
	updateTweens(delta) {
		for (const object of this.state.objects) {
			if (object.destroyed) continue;
			for (const [key, tween] of Object.entries(object.tweens)) {
				if (tween.done) continue;
				tween.elapsed += delta;
				const progress = clamp(tween.elapsed / tween.duration, 0, 1);
				const value = tween.from + (tween.to - tween.from) * ease(tween.easing, progress);
				switch (tween.kind) {
					case "x":
						object.x = value;
						break;
					case "y":
						object.y = value;
						break;
					case "angle":
						object.angle = value;
						break;
					case "alpha":
						object.opacity = clamp(value, 0, 255);
						break;
					case "size":
						object.width = Math.max(1, value);
						object.height = Math.max(1, value);
				}
				if (progress >= 1) {
					tween.done = true;
					delete object.tweens[key];
				}
			}
		}
	}
	updateFlash(delta) {
		for (const object of this.state.objects) {
			if (!object.flash.active || object.destroyed) continue;
			object.flash.elapsed += delta;
			const half = Math.max(.016, object.flash.half);
			const blinking = Math.floor(object.flash.elapsed / half) % 2 === 1;
			object.flash.hidden = blinking;
			if (object.flash.elapsed >= object.flash.duration * 5) {
				object.flash.active = false;
				object.flash.hidden = false;
			}
		}
	}
	simulatePhysics(delta) {
		const platforms = this.state.objects.filter((object) => !object.destroyed && this.hasBehavior(object, "PlatformBehavior::PlatformBehavior"));
		for (const object of this.state.objects) {
			if (object.destroyed) continue;
			const isCharacter = this.hasBehavior(object, "PlatformBehavior::PlatformerObjectBehavior");
			if (isCharacter) {
				const props = this.platformerProps(object);
				const acceleration = asNumber(props["acceleration"], PHYSICS.acceleration);
				const maxSpeed = asNumber(props["maxSpeed"], PHYSICS.maxSpeed);
				const friction = asNumber(props["friction"], PHYSICS.friction);
				const useDefaults = !object.ignoreControls;
				const left = object.controls.left || useDefaults && this.isKeyPressed("Left");
				const right = object.controls.right || useDefaults && this.isKeyPressed("Right");
				if (left) object.vx -= acceleration * delta;
				if (right) object.vx += acceleration * delta;
				if (useDefaults && this.isKeyPressed("Shift")) this.jump(object);
				object.vx = clamp(object.vx, -maxSpeed, maxSpeed);
				if (!left && !right) {
					object.vx -= object.vx * Math.min(1, friction * delta);
					if (Math.abs(object.vx) < 2) object.vx = 0;
				}
				object.vy = Math.min(object.vy + object.gravity * delta, object.maxFallingSpeed);
				if (object.vy > 0) object.jumping = false;
			} else {
				object.vx *= Math.pow(PHYSICS.damping, delta * 60);
				object.vy *= Math.pow(PHYSICS.damping, delta * 60);
				if (Math.abs(object.vx) < 1) object.vx = 0;
				if (Math.abs(object.vy) < 1) object.vy = 0;
			}
			object.falling = isCharacter && !object.onFloor && object.vy > 0;
			object.x += object.vx * delta;
			object.y += object.vy * delta;
			if (isCharacter) {
				object.onFloor = false;
				for (const platform of platforms) {
					if (!overlaps(object, platform, 0)) continue;
					const previousBottom = object.y + object.height - object.vy * delta;
					const isOneWay = this.platformProps(platform)["platformType"] === "One-way platform";
					if (object.vy >= 0 && previousBottom <= platform.y + (isOneWay ? 4 : 8)) {
						object.y = platform.y - object.height;
						object.vy = 0;
						object.onFloor = true;
					}
				}
				if (object.y + object.height > this.height) {
					object.y = this.height - object.height;
					object.vy = 0;
					object.onFloor = true;
				}
			}
			object.x = clamp(object.x, -object.width, this.width);
			object.y = clamp(object.y, -object.height * 2, this.height + object.height);
		}
	}
	hasBehavior(object, type) {
		return Object.values(object.behaviorTypes).includes(type);
	}
	platformProps(object) {
		for (const name of object.behaviors) if (object.behaviorTypes[name] === "PlatformBehavior::PlatformBehavior") return object.behaviorProps[name] ?? {};
		return {};
	}
	reportUnsupportedInstruction(kind, instruction, eventId) {
		const key = `unsupported:${kind}:${instruction.typeId}`;
		if (this.reportedDiagnostics.has(key)) return;
		this.reportedDiagnostics.add(key);
		const message = `${kind === "condition" ? "Condición" : "Acción"} no soportada por el runtime 2D: ${instruction.typeId}`;
		this.log(`⚠ ${message}`);
		this.options.onDiagnostic?.({
			code: "unsupported-instruction",
			severity: "warning",
			message,
			frame: this.state.frame,
			eventId,
			typeId: instruction.typeId,
			instructionId: instruction.id
		});
	}
	reportInvalidExternalEventsLink(eventId, name, reason) {
		const target = name || "(sin destino)";
		const key = `external-events:${eventId}:${target}:${reason}`;
		if (this.reportedDiagnostics.has(key)) return;
		this.reportedDiagnostics.add(key);
		const message = `No se pudo ejecutar el enlace a eventos externos ${target}: ${reason}.`;
		this.log(`⚠ ${message}`);
		this.options.onDiagnostic?.({
			code: "invalid-external-events-link",
			severity: "error",
			message,
			frame: this.state.frame,
			eventId
		});
	}
	log(message) {
		this.state.logs.push({
			time: this.state.time,
			message
		});
		if (this.state.logs.length > 80) this.state.logs.shift();
	}
};
function toRuntimeSceneFromProject(project, scene) {
	return {
		name: scene.name,
		backgroundColor: scene.backgroundColor,
		windowWidth: scene.useCustomWindowSize && scene.customWindowWidth ? scene.customWindowWidth : project.gameSettings.windowWidth,
		windowHeight: scene.useCustomWindowSize && scene.customWindowHeight ? scene.customWindowHeight : project.gameSettings.windowHeight,
		layers: scene.layers,
		objects: scene.objects,
		instances: scene.instances,
		events: scene.events,
		sceneVariables: scene.variables,
		globalVariables: project.globalVariables,
		groups: scene.groups ?? [],
		scenes: project.scenes.map((s) => s.name)
	};
}
/** Nested variables are flattened with dotted keys, like GDevelop's expressions. */
function flattenVariables(list, prefix = "") {
	const out = {};
	for (const variable of list) {
		const key = prefix ? `${prefix}.${variable.name}` : variable.name;
		if (variable.type === "structure" || variable.type === "array") {
			Object.assign(out, flattenVariables(variable.children, key));
			out[key] = variable.value;
		} else out[key] = variable.value;
	}
	return out;
}
function overlaps(a, b, pad) {
	const polygonA = collisionPolygon(a);
	const polygonB = collisionPolygon(b);
	for (const polygon of [polygonA, polygonB]) for (let index = 0; index < polygon.length; index += 1) {
		const current = polygon[index];
		const next = polygon[(index + 1) % polygon.length];
		const axis = {
			x: -(next.y - current.y),
			y: next.x - current.x
		};
		const length = Math.hypot(axis.x, axis.y);
		if (length < 1e-9) continue;
		axis.x /= length;
		axis.y /= length;
		const projectionA = projectPolygon(polygonA, axis);
		const projectionB = projectPolygon(polygonB, axis);
		if (projectionA.max - pad <= projectionB.min + pad || projectionB.max - pad <= projectionA.min + pad) return false;
	}
	return true;
}
function collisionPolygon(object) {
	const mask = object.hitBox;
	const source = mask?.kind === "polygon" && mask.vertices.length >= 3 ? mask.vertices : mask ? [
		{
			x: mask.x,
			y: mask.y
		},
		{
			x: mask.x + mask.width,
			y: mask.y
		},
		{
			x: mask.x + mask.width,
			y: mask.y + mask.height
		},
		{
			x: mask.x,
			y: mask.y + mask.height
		}
	] : [
		{
			x: 0,
			y: 0
		},
		{
			x: object.width,
			y: 0
		},
		{
			x: object.width,
			y: object.height
		},
		{
			x: 0,
			y: object.height
		}
	];
	const referenceWidth = Math.max(1, mask?.referenceWidth ?? object.width);
	const referenceHeight = Math.max(1, mask?.referenceHeight ?? object.height);
	const centerX = object.x + object.width / 2;
	const centerY = object.y + object.height / 2;
	const radians = object.angle * Math.PI / 180;
	const cosine = Math.cos(radians);
	const sine = Math.sin(radians);
	return source.map((point) => {
		let localX = point.x / referenceWidth * object.width;
		let localY = point.y / referenceHeight * object.height;
		if (object.flipX) localX = object.width - localX;
		if (object.flipY) localY = object.height - localY;
		const dx = localX - object.width / 2;
		const dy = localY - object.height / 2;
		return {
			x: centerX + dx * cosine - dy * sine,
			y: centerY + dx * sine + dy * cosine
		};
	});
}
function projectPolygon(points, axis) {
	let min = Number.POSITIVE_INFINITY;
	let max = Number.NEGATIVE_INFINITY;
	for (const point of points) {
		const value = point.x * axis.x + point.y * axis.y;
		min = Math.min(min, value);
		max = Math.max(max, value);
	}
	return {
		min,
		max
	};
}
function pointInObject(object, x, y) {
	const polygon = collisionPolygon(object);
	let inside = false;
	for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
		const a = polygon[index];
		const b = polygon[previous];
		if (a.y > y !== b.y > y && x < (b.x - a.x) * (y - a.y) / (b.y - a.y || 1) + a.x) inside = !inside;
	}
	return inside;
}
function compare(left, operator, right) {
	switch (operator) {
		case ">": return left > right;
		case "<": return left < right;
		case ">=":
		case "≥": return left >= right;
		case "<=":
		case "≤": return left <= right;
		case "!=":
		case "≠": return left !== right;
		default: return left === right;
	}
}
function compareStrings(left, operator, right) {
	switch (operator) {
		case "!=":
		case "≠": return left !== right;
		default: return left === right;
	}
}
function applyModOp(current, op, value) {
	switch (op) {
		case "add": return current + value;
		case "subtract": return current - value;
		case "multiply": return current * value;
		case "divide": return value === 0 ? current : current / value;
		case "max": return Math.max(current, value);
		case "min": return Math.min(current, value);
		default: return value;
	}
}
var clamp = (value, min, max) => Math.min(Math.max(value, min), max);
var normalizeAngle = (angle) => (angle % 360 + 360) % 360;
function ease(kind, t) {
	switch (kind) {
		case "linear":
		case "linearStops": return t;
		case "easeInQuad": return t * t;
		case "easeOutQuad": return 1 - (1 - t) * (1 - t);
		case "easeInOutElastic": return t === 0 || t === 1 ? t : -(Math.pow(2, 10 * (t - 1)) * Math.sin((t * 10 - .75) * (2 * Math.PI / 3))) / 2 + (t < .5 ? 0 : 1);
		default: return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
	}
}
var rgbToHex = (r, g, b) => `#${[
	r,
	g,
	b
].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join("")}`;
var nowMs = () => typeof performance !== "undefined" ? performance.now() : Date.now();
var KEY_ALIASES = {
	arrowleft: "Left",
	arrowright: "Right",
	arrowup: "Up",
	arrowdown: "Down",
	" ": "Space",
	spacebar: "Space",
	escape: "Escape",
	enter: "Return",
	controlleft: "Control",
	shiftleft: "Shift"
};
/** Maps a DOM `KeyboardEvent.key` onto GDevelop's key names. */
function normalizeKey(key) {
	const lower = key.toLowerCase();
	if (KEY_ALIASES[lower]) return KEY_ALIASES[lower];
	if (lower.length === 1) return lower;
	return key.charAt(0).toUpperCase() + key.slice(1);
}
//#endregion
//#region src/components/editor/DebuggerPanel.tsx
var TABS = [
	{
		id: "inspector",
		label: S.inspector,
		icon: Activity
	},
	{
		id: "debugger",
		label: S.debugger,
		icon: Bug
	},
	{
		id: "profiler",
		label: S.profiler,
		icon: ScrollText
	}
];
function DebuggerPanel({ runtime, className }) {
	const [tab, setTab] = React.useState("inspector");
	const [, setPulse] = React.useState(0);
	React.useEffect(() => {
		const id = window.setInterval(() => setPulse((value) => value + 1), 250);
		return () => window.clearInterval(id);
	}, []);
	const state = runtime.state;
	return /* @__PURE__ */ jsxs("aside", {
		className: cn("flex min-h-0 flex-col bg-[#1B1D22] text-[12px] text-foreground", className),
		children: [/* @__PURE__ */ jsx("div", {
			className: "flex shrink-0 gap-1 border-b border-separator p-1",
			children: TABS.map((entry) => /* @__PURE__ */ jsxs("button", {
				type: "button",
				onClick: () => setTab(entry.id),
				className: cn("flex flex-1 items-center justify-center gap-1 rounded px-1 py-1 text-[11.5px]", tab === entry.id ? "bg-[#494952] text-[#F6F2FF]" : "text-text-secondary hover:bg-list-hover"),
				children: [/* @__PURE__ */ jsx(entry.icon, { className: "h-3.5 w-3.5" }), /* @__PURE__ */ jsx("span", {
					className: "truncate",
					children: entry.label
				})]
			}, entry.id))
		}), /* @__PURE__ */ jsxs("div", {
			className: "min-h-0 flex-1 overflow-y-auto",
			children: [
				tab === "inspector" ? /* @__PURE__ */ jsx(Inspector, { state }) : null,
				tab === "debugger" ? /* @__PURE__ */ jsx(EventsDebug, { state }) : null,
				tab === "profiler" ? /* @__PURE__ */ jsx(Profiler, { state }) : null
			]
		})]
	});
}
function Row({ label, value }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "flex items-baseline gap-2 border-b border-separator/50 px-2 py-1",
		children: [/* @__PURE__ */ jsx("span", {
			className: "min-w-0 flex-1 truncate text-text-secondary",
			children: label
		}), /* @__PURE__ */ jsx("span", {
			className: "shrink-0 tabular-nums text-foreground",
			children: value
		})]
	});
}
function Inspector({ state }) {
	return /* @__PURE__ */ jsxs("div", { children: [
		/* @__PURE__ */ jsx("h4", {
			className: "bg-[#25252E] px-2 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-[#D6DEEC]",
			children: S.sceneVariables
		}),
		Object.keys(state.variables).length === 0 ? /* @__PURE__ */ jsx("p", {
			className: "px-2 py-1.5 text-text-placeholder",
			children: "Sin variables de escena."
		}) : null,
		Object.entries(state.variables).map(([name, value]) => /* @__PURE__ */ jsx(Row, {
			label: name,
			value
		}, name)),
		/* @__PURE__ */ jsx("h4", {
			className: "mt-2 bg-[#25252E] px-2 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-[#D6DEEC]",
			children: S.globalVariables
		}),
		Object.keys(state.globalVariables).length === 0 ? /* @__PURE__ */ jsx("p", {
			className: "px-2 py-1.5 text-text-placeholder",
			children: "Sin variables globales."
		}) : null,
		Object.entries(state.globalVariables).map(([name, value]) => /* @__PURE__ */ jsx(Row, {
			label: name,
			value
		}, name)),
		/* @__PURE__ */ jsxs("h4", {
			className: "mt-2 bg-[#25252E] px-2 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-[#D6DEEC]",
			children: [
				S.instances,
				" (",
				state.objects.length,
				")"
			]
		}),
		state.objects.slice(0, 40).map((object) => /* @__PURE__ */ jsxs("details", {
			className: "border-b border-separator/50",
			children: [/* @__PURE__ */ jsxs("summary", {
				className: "flex cursor-pointer items-center gap-2 px-2 py-1 hover:bg-list-hover",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "min-w-0 flex-1 truncate",
						children: object.name
					}),
					/* @__PURE__ */ jsxs("span", {
						className: "shrink-0 text-[10.5px] text-text-secondary",
						children: [
							Math.round(object.x),
							",",
							Math.round(object.y)
						]
					}),
					object.hidden ? /* @__PURE__ */ jsx("span", {
						className: "shrink-0 rounded bg-elevated px-1 text-[9.5px] text-[#FFBC57]",
						children: "oculto"
					}) : null
				]
			}), /* @__PURE__ */ jsxs("div", {
				className: "bg-[#16181D]",
				children: [
					/* @__PURE__ */ jsx(Row, {
						label: "capa",
						value: object.layer
					}),
					/* @__PURE__ */ jsx(Row, {
						label: "z",
						value: object.zOrder
					}),
					/* @__PURE__ */ jsx(Row, {
						label: "ángulo",
						value: `${Math.round(object.angle)}°`
					}),
					/* @__PURE__ */ jsx(Row, {
						label: "tamaño",
						value: `${Math.round(object.width)}×${Math.round(object.height)}`
					}),
					/* @__PURE__ */ jsx(Row, {
						label: "animación",
						value: `${object.animationName} #${object.frameIndex}`
					}),
					/* @__PURE__ */ jsx(Row, {
						label: "opacidad",
						value: object.opacity
					}),
					/* @__PURE__ */ jsx(Row, {
						label: "velocidad",
						value: `${Math.round(object.vx)}, ${Math.round(object.vy)}`
					}),
					object.behaviors.length > 0 ? /* @__PURE__ */ jsx(Row, {
						label: "comportamientos",
						value: object.behaviors.join(", ")
					}) : null,
					Object.keys(object.variables).length > 0 ? Object.entries(object.variables).map(([name, value]) => /* @__PURE__ */ jsx(Row, {
						label: `var ${name}`,
						value
					}, name)) : null
				]
			})]
		}, object.id))
	] });
}
function EventsDebug({ state }) {
	return /* @__PURE__ */ jsxs("div", { children: [
		/* @__PURE__ */ jsx("h4", {
			className: "bg-[#25252E] px-2 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-[#D6DEEC]",
			children: "Consola"
		}),
		state.logs.length === 0 ? /* @__PURE__ */ jsx("p", {
			className: "px-2 py-1.5 text-text-placeholder",
			children: "Sin mensajes todavía."
		}) : null,
		[...state.logs].reverse().map((log, index) => /* @__PURE__ */ jsxs("div", {
			className: "flex gap-2 border-b border-separator/50 px-2 py-1",
			children: [/* @__PURE__ */ jsxs("span", {
				className: "shrink-0 tabular-nums text-text-placeholder",
				children: [log.time.toFixed(2), "s"]
			}), /* @__PURE__ */ jsx("span", {
				className: "min-w-0 flex-1 break-words",
				children: log.message
			})]
		}, `${log.time}-${index}`)),
		/* @__PURE__ */ jsx("h4", {
			className: "mt-2 bg-[#25252E] px-2 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-[#D6DEEC]",
			children: "Timers"
		}),
		Object.keys(state.timers).length === 0 ? /* @__PURE__ */ jsx("p", {
			className: "px-2 py-1.5 text-text-placeholder",
			children: "Ningún temporizador creado."
		}) : null,
		Object.entries(state.timers).map(([name, value]) => /* @__PURE__ */ jsx(Row, {
			label: name,
			value: `${value.toFixed(2)}s`
		}, name))
	] });
}
function Profiler({ state }) {
	const ms = state.stats.frameTimeMs;
	return /* @__PURE__ */ jsxs("div", { children: [
		/* @__PURE__ */ jsx("h4", {
			className: "bg-[#25252E] px-2 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-[#D6DEEC]",
			children: S.profiler
		}),
		/* @__PURE__ */ jsx(Row, {
			label: S.frameTime,
			value: `${ms.toFixed(2)} ms`
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "px-2 py-1.5",
			children: [/* @__PURE__ */ jsx("div", {
				className: "h-1.5 overflow-hidden rounded bg-[#1D1D26]",
				children: /* @__PURE__ */ jsx("div", {
					className: cn("h-full", ms > 16.6 ? "bg-[#FF8569]" : ms > 8 ? "bg-[#FFBC57]" : "bg-[#0ECD7A]"),
					style: { width: `${Math.min(100, ms / 16.6 * 100)}%` }
				})
			}), /* @__PURE__ */ jsx("p", {
				className: "mt-1 text-[10.5px] text-text-placeholder",
				children: "Presupuesto por cuadro: 16,6 ms (60 FPS)"
			})]
		}),
		/* @__PURE__ */ jsx(Row, {
			label: S.objectsCount,
			value: state.stats.objectsCount
		}),
		/* @__PURE__ */ jsx(Row, {
			label: S.eventsSheet,
			value: state.stats.eventsCount
		}),
		/* @__PURE__ */ jsx(Row, {
			label: "Instrucciones ejecutadas",
			value: state.stats.instructionsCount
		}),
		/* @__PURE__ */ jsx(Row, {
			label: "Cuadro",
			value: state.frame
		}),
		/* @__PURE__ */ jsx(Row, {
			label: "Tiempo",
			value: `${state.time.toFixed(2)}s`
		}),
		/* @__PURE__ */ jsx(Row, {
			label: "Escala de tiempo",
			value: state.timeScale.toFixed(2)
		}),
		/* @__PURE__ */ jsx(Row, {
			label: "Cámara",
			value: `${Math.round(state.camera.x)}, ${Math.round(state.camera.y)}`
		})
	] });
}
//#endregion
//#region src/components/editor/PreviewDialog.tsx
var SCREENS = [
	{
		id: "window",
		label: "Tamaño de la ventana del juego",
		width: 0,
		height: 0
	},
	{
		id: "desktop",
		label: "Escritorio (1920×1080)",
		width: 1920,
		height: 1080
	},
	{
		id: "phone",
		label: "Móvil (414×736)",
		width: 414,
		height: 736
	},
	{
		id: "tablet",
		label: "Tablet (1024×768)",
		width: 1024,
		height: 768
	}
];
var TOUCH_BUTTONS = [
	{
		key: "Left",
		label: "◀"
	},
	{
		key: "Right",
		label: "▶"
	},
	{
		key: "Up",
		label: "▲"
	},
	{
		key: "Space",
		label: "A"
	}
];
function PreviewDialog() {
	const { project, scene, ui, dispatch } = useEditor();
	const open = ui.previewOpen;
	const canvasRef = React.useRef(null);
	const runtimeRef = React.useRef(null);
	const rafRef = React.useRef(null);
	const playingAudioRef = React.useRef(/* @__PURE__ */ new Set());
	const [paused, setPaused] = React.useState(false);
	const [fps, setFps] = React.useState(0);
	const [screen, setScreen] = React.useState("window");
	const [screenMenu, setScreenMenu] = React.useState(null);
	const [showDebugger, setShowDebugger] = React.useState(ui.previewWithDebugger);
	const [status, setStatus] = React.useState("");
	const [tick, setTick] = React.useState(0);
	const stopAudio = React.useCallback(() => {
		for (const audio of playingAudioRef.current) {
			audio.pause();
			audio.currentTime = 0;
		}
		playingAudioRef.current.clear();
	}, []);
	const close = () => {
		stopAudio();
		dispatch({
			type: "ui",
			patch: {
				previewOpen: false,
				previewWithDebugger: false
			}
		});
	};
	const start = React.useCallback(() => {
		stopAudio();
		const runtime = new GameRuntime(toRuntimeScene(project, scene), {
			onPlaySound: (file, volume, loop) => {
				const url = resolveAsset(file, project.resources);
				if (!url) {
					setStatus(`⚠ No se encontró el audio «${file}».`);
					return;
				}
				const audio = new Audio(url);
				audio.volume = Math.max(0, Math.min(1, volume));
				audio.loop = loop;
				playingAudioRef.current.add(audio);
				audio.addEventListener("ended", () => playingAudioRef.current.delete(audio), { once: true });
				audio.play().catch(() => {
					playingAudioRef.current.delete(audio);
					setStatus(`⚠ El navegador bloqueó la reproducción de «${file}».`);
				});
				setStatus(`♪ ${file}${loop ? " (bucle)" : ""} · ${Math.round(volume * 100)}%`);
			},
			onStopSound: (channel) => {
				stopAudio();
				setStatus(`■ canal ${channel} detenido`);
			},
			onChangeScene: (name) => setStatus(`Escena → ${name}`),
			onDiagnostic: (diagnostic) => setStatus(`⚠ ${diagnostic.message}`)
		}, project);
		runtimeRef.current = runtime;
		setTick((value) => value + 1);
		return runtime;
	}, [
		project,
		scene,
		stopAudio
	]);
	React.useEffect(() => {
		if (!open) {
			if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
			rafRef.current = null;
			runtimeRef.current = null;
			stopAudio();
			setPaused(false);
			setStatus("");
			return;
		}
		setShowDebugger(ui.previewWithDebugger);
		const runtime = start();
		const onKeyDown = (event) => {
			if (event.repeat) return;
			event.preventDefault();
			runtime.pressKey(event.key);
		};
		const onKeyUp = (event) => {
			event.preventDefault();
			runtime.releaseKey(event.key);
		};
		window.addEventListener("keydown", onKeyDown, { passive: false });
		window.addEventListener("keyup", onKeyUp);
		let last = performance.now();
		let frames = 0;
		let fpsClock = last;
		const loop = (now) => {
			rafRef.current = requestAnimationFrame(loop);
			const delta = Math.min(.1, (now - last) / 1e3);
			last = now;
			frames += 1;
			if (now - fpsClock > 500) {
				setFps(Math.round(frames * 1e3 / (now - fpsClock)));
				frames = 0;
				fpsClock = now;
				setTick((value) => value + 1);
			}
			const current = runtimeRef.current;
			if (!current) return;
			if (!paused) current.step(delta);
			const canvas = canvasRef.current;
			const ctx = canvas?.getContext("2d");
			if (!canvas || !ctx) return;
			const state = current.state;
			const backgroundColor = project.scenes.find((entry) => entry.name === state.sceneName)?.backgroundColor ?? "#000000";
			const dpr = window.devicePixelRatio || 1;
			const wantedWidth = Math.max(1, Math.floor(canvas.clientWidth * dpr));
			const wantedHeight = Math.max(1, Math.floor(canvas.clientHeight * dpr));
			if (canvas.width !== wantedWidth || canvas.height !== wantedHeight) {
				canvas.width = wantedWidth;
				canvas.height = wantedHeight;
			}
			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			renderScene(ctx, state, {
				width: current.width,
				height: current.height,
				background: `rgb(${backgroundColor.split(";").join(",")})`,
				resolve: (name) => resolveAsset(name, project.resources),
				scale: wantedWidth / (current.width || 1)
			});
		};
		rafRef.current = requestAnimationFrame(loop);
		return () => {
			if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
			rafRef.current = null;
			stopAudio();
			window.removeEventListener("keydown", onKeyDown);
			window.removeEventListener("keyup", onKeyUp);
		};
	}, [
		open,
		start,
		paused,
		project,
		stopAudio,
		ui.previewWithDebugger
	]);
	const runtime = runtimeRef.current;
	const size = SCREENS.find((entry) => entry.id === screen);
	const aspect = size && size.width ? `${size.width} / ${size.height}` : runtime ? `${runtime.width} / ${runtime.height}` : `${project.gameSettings.windowWidth} / ${project.gameSettings.windowHeight}`;
	const screenEntries = SCREENS.map((entry) => ({
		id: entry.id,
		label: entry.label,
		checked: screen === entry.id,
		onSelect: () => setScreen(entry.id)
	}));
	const touch = (key, pressed) => {
		const current = runtimeRef.current;
		if (!current) return;
		if (pressed) current.pressKey(key);
		else current.releaseKey(key);
	};
	return /* @__PURE__ */ jsxs("div", {
		className: cn("fixed inset-0 z-50 flex flex-col bg-[#0D0D12]", !open && "pointer-events-none invisible"),
		onMouseDown: (event) => {
			if (event.target === event.currentTarget) close();
		},
		children: [
			/* @__PURE__ */ jsxs("header", {
				className: "flex h-11 shrink-0 items-center gap-1 overflow-hidden border-b border-separator bg-toolbar px-2 sm:gap-2",
				children: [
					/* @__PURE__ */ jsxs("span", {
						className: "flex min-w-0 flex-1 items-center gap-1.5 truncate text-[12.5px] font-semibold text-foreground",
						children: [
							/* @__PURE__ */ jsx(Play, { className: "h-3.5 w-3.5 fill-current text-success" }),
							S.preview,
							/* @__PURE__ */ jsxs("span", {
								className: "hidden truncate font-normal text-text-secondary sm:inline",
								children: ["— ", runtime?.state.sceneName ?? scene.name]
							})
						]
					}),
					/* @__PURE__ */ jsxs("span", {
						className: "ml-1 hidden rounded bg-elevated px-1.5 py-0.5 text-[11px] tabular-nums text-text-secondary sm:inline",
						children: [fps, " FPS"]
					}),
					status ? /* @__PURE__ */ jsx("span", {
						className: "hidden max-w-72 truncate text-[11.5px] text-[#8AD6FF] lg:inline",
						children: status
					}) : null,
					/* @__PURE__ */ jsxs("div", {
						className: "ml-auto flex items-center gap-1",
						children: [
							/* @__PURE__ */ jsx(GdButton, {
								size: "small",
								variant: "raised",
								icon: paused ? /* @__PURE__ */ jsx(Play, { className: "h-3.5 w-3.5" }) : /* @__PURE__ */ jsx(Pause, { className: "h-3.5 w-3.5" }),
								onClick: () => setPaused((value) => !value),
								children: /* @__PURE__ */ jsx("span", {
									className: "hidden sm:inline",
									children: paused ? S.resume : S.pause
								})
							}),
							/* @__PURE__ */ jsx(GdButton, {
								size: "small",
								variant: "raised",
								icon: /* @__PURE__ */ jsx(RotateCcw, { className: "h-3.5 w-3.5" }),
								onClick: () => {
									start();
									setPaused(false);
								},
								children: /* @__PURE__ */ jsx("span", {
									className: "hidden sm:inline",
									children: S.restart
								})
							}),
							/* @__PURE__ */ jsx(GdButton, {
								size: "small",
								variant: "raised",
								icon: /* @__PURE__ */ jsx(Bug, { className: "h-3.5 w-3.5" }),
								className: showDebugger ? "bg-[#3D4D51] text-[#E5C07B]" : void 0,
								onClick: () => setShowDebugger((value) => !value),
								children: /* @__PURE__ */ jsx("span", {
									className: "hidden sm:inline",
									children: S.debugger
								})
							}),
							/* @__PURE__ */ jsx("button", {
								type: "button",
								"aria-label": "Tamaño de pantalla",
								onClick: (event) => {
									const rect = event.currentTarget.getBoundingClientRect();
									setScreenMenu({
										x: rect.right - 230,
										y: rect.bottom + 2
									});
								},
								className: "grid h-8 w-8 place-items-center rounded text-text-secondary hover:bg-elevated hover:text-foreground",
								children: /* @__PURE__ */ jsx(Smartphone, { className: "h-4 w-4" })
							}),
							/* @__PURE__ */ jsx("button", {
								type: "button",
								"aria-label": S.close,
								onClick: close,
								className: "grid h-8 w-8 place-items-center rounded text-text-secondary hover:bg-elevated hover:text-foreground",
								children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
							})
						]
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "relative flex min-h-0 flex-1",
				children: [/* @__PURE__ */ jsx("div", {
					className: "flex min-w-0 flex-1 items-center justify-center p-3",
					children: /* @__PURE__ */ jsxs("div", {
						className: "relative flex max-h-full w-full max-w-[min(100%,1400px)] items-center justify-center",
						style: aspect ? { aspectRatio: aspect } : void 0,
						children: [/* @__PURE__ */ jsx("canvas", {
							ref: canvasRef,
							tabIndex: 0,
							onMouseDown: (event) => {
								event.currentTarget.focus();
								runtimeRef.current?.pressMouse(event.button === 2 ? "Right" : "Left");
							},
							onMouseUp: () => runtimeRef.current?.releaseMouse("Left"),
							onMouseMove: (event) => {
								const rect = event.currentTarget.getBoundingClientRect();
								const current = runtimeRef.current;
								if (!current) return;
								const scaleX = current.width / rect.width;
								const scaleY = current.height / rect.height;
								current.movePointer((event.clientX - rect.left) * scaleX, (event.clientY - rect.top) * scaleY);
							},
							className: "max-h-[calc(100vh-190px)] w-full rounded bg-black shadow-[0_0_0_1px_rgba(255,255,255,0.08)] outline-none focus:shadow-[0_0_0_2px_var(--brand)]"
						}), /* @__PURE__ */ jsxs("div", {
							className: "pointer-events-none absolute bottom-1 right-2 text-[10px] tabular-nums text-[#6a6a75]",
							children: [
								runtime ? `${runtime.width}×${runtime.height}` : "",
								" · ",
								tick % 2 === 0 ? "●" : "○"
							]
						})]
					})
				}), showDebugger && runtime ? /* @__PURE__ */ jsx(DebuggerPanel, {
					runtime,
					className: "absolute inset-y-0 right-0 z-10 w-full border-l border-separator sm:static sm:w-[320px] sm:shrink-0"
				}) : null]
			}),
			/* @__PURE__ */ jsxs("footer", {
				className: "flex h-14 shrink-0 items-center gap-2 border-t border-separator bg-toolbar px-3",
				children: [
					/* @__PURE__ */ jsx(Gamepad2, { className: "h-4 w-4 shrink-0 text-text-secondary" }),
					/* @__PURE__ */ jsx("div", {
						className: "flex gap-1.5",
						children: TOUCH_BUTTONS.map((button) => /* @__PURE__ */ jsx("button", {
							type: "button",
							onPointerDown: () => touch(button.key, true),
							onPointerUp: () => touch(button.key, false),
							onPointerLeave: () => touch(button.key, false),
							className: "grid h-10 w-12 select-none place-items-center rounded border border-separator bg-elevated text-[15px] text-foreground active:bg-[var(--brand)] active:text-[#F6F2FF]",
							title: `Tecla ${normalizeKey(button.key)}`,
							children: button.label
						}, button.key))
					}),
					/* @__PURE__ */ jsx("p", {
						className: "ml-2 hidden text-[11.5px] text-text-secondary md:block",
						children: "Las teclas del juego se capturan aquí: flechas para mover, Espacio/↑ para saltar. Haz clic en el juego para capturar el ratón."
					}),
					/* @__PURE__ */ jsx("span", {
						className: "ml-auto text-[11.5px] text-text-secondary",
						children: "Cierra con la × para volver a editar"
					})
				]
			}),
			screenMenu ? /* @__PURE__ */ jsx(GdMenu, {
				entries: screenEntries,
				anchor: screenMenu,
				onClose: () => setScreenMenu(null)
			}) : null
		]
	});
}
//#endregion
//#region src/components/editor/ProjectManagerDrawer.tsx
function Section({ icon, label, children, defaultOpen, leaf, action }) {
	const [open, setOpen] = React.useState(!!defaultOpen);
	return /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("div", {
		className: "flex items-center gap-1",
		children: [/* @__PURE__ */ jsxs("button", {
			type: "button",
			onClick: () => !leaf && setOpen((o) => !o),
			className: "flex min-w-0 flex-1 items-center gap-1.5 rounded px-2 py-1.5 text-left text-[13px] text-foreground hover:bg-elevated",
			children: [
				leaf ? /* @__PURE__ */ jsx("span", { className: "w-3.5" }) : open ? /* @__PURE__ */ jsx(ChevronDown, { className: "h-3.5 w-3.5 shrink-0 text-muted-foreground" }) : /* @__PURE__ */ jsx(ChevronRight, { className: "h-3.5 w-3.5 shrink-0 text-muted-foreground" }),
				/* @__PURE__ */ jsx("span", {
					className: "shrink-0 text-link",
					children: icon
				}),
				/* @__PURE__ */ jsx("span", {
					className: "truncate",
					children: label
				})
			]
		}), action]
	}), open && children ? /* @__PURE__ */ jsx("div", {
		className: "ml-5 border-l border-separator pl-2",
		children
	}) : null] });
}
function ProjectManagerDrawer() {
	const { ui, project, dispatch, activeSceneName } = useEditor();
	const [query, setQuery] = React.useState("");
	const [menu, setMenu] = React.useState(null);
	if (!ui.projectManagerOpen) return null;
	const close = () => dispatch({
		type: "ui",
		patch: { projectManagerOpen: false }
	});
	const needle = query.trim().toLowerCase();
	const scenes = project.scenes.filter((scene) => !needle || scene.name.toLowerCase().includes(needle));
	const resources = project.resources.filter((r) => !needle || r.name.toLowerCase().includes(needle));
	const sceneEntries = (name) => [
		{
			id: "rename",
			label: S.renameScene,
			icon: /* @__PURE__ */ jsx(Pencil, { className: "h-3.5 w-3.5" }),
			onSelect: () => {
				const next = window.prompt(S.renameScene, name);
				if (next && next !== name) dispatch({
					type: "renameScene",
					from: name,
					to: next
				});
			}
		},
		{
			id: "duplicate",
			label: S.duplicateScene,
			onSelect: () => dispatch({
				type: "duplicateScene",
				name
			})
		},
		{
			id: "delete",
			label: S.removeScene,
			danger: true,
			icon: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" }),
			disabled: project.scenes.length <= 1,
			onSelect: () => {
				if (window.confirm(S.confirmRemoveScene)) dispatch({
					type: "deleteScene",
					name
				});
			}
		}
	];
	return /* @__PURE__ */ jsxs("div", {
		className: "fixed inset-0 z-50 flex",
		children: [
			/* @__PURE__ */ jsxs("aside", {
				className: "flex h-full w-[300px] flex-col border-r border-separator bg-toolbar shadow-2xl",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex h-11 shrink-0 items-center justify-between border-b border-separator px-3",
						children: [/* @__PURE__ */ jsx("span", {
							className: "truncate text-[13px] font-semibold",
							children: S.projectManager
						}), /* @__PURE__ */ jsx("button", {
							type: "button",
							"aria-label": S.close,
							onClick: close,
							className: "rounded p-1 text-muted-foreground hover:bg-elevated hover:text-foreground",
							children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
						})]
					}),
					/* @__PURE__ */ jsx("div", {
						className: "border-b border-separator p-2",
						children: /* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-2 rounded bg-search-bar px-2 py-1.5",
							children: [/* @__PURE__ */ jsx(Search, { className: "h-3.5 w-3.5 shrink-0 text-text-secondary" }), /* @__PURE__ */ jsx("input", {
								value: query,
								onChange: (event) => setQuery(event.target.value),
								placeholder: "Buscar en el proyecto",
								className: "h-6 w-full min-w-0 bg-transparent text-[12.5px] outline-none placeholder:text-text-placeholder"
							})]
						})
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "min-h-0 flex-1 overflow-y-auto p-1",
						children: [
							/* @__PURE__ */ jsx(Section, {
								icon: /* @__PURE__ */ jsx(Settings, { className: "h-4 w-4" }),
								label: S.gameSettings,
								leaf: true
							}),
							/* @__PURE__ */ jsx("div", {
								className: "-mt-1 mb-1 flex justify-end pr-1",
								children: /* @__PURE__ */ jsx("button", {
									type: "button",
									onClick: () => dispatch({
										type: "openDialog",
										dialog: { name: "projectProperties" }
									}),
									className: "rounded px-1.5 py-0.5 text-[11px] text-text-secondary hover:bg-elevated hover:text-foreground",
									children: "Abrir"
								})
							}),
							/* @__PURE__ */ jsx(Section, {
								icon: /* @__PURE__ */ jsx(Layers, { className: "h-4 w-4" }),
								label: S.scenes,
								defaultOpen: true,
								action: /* @__PURE__ */ jsx("button", {
									type: "button",
									"aria-label": S.addANewScene,
									title: S.addANewScene,
									onClick: () => dispatch({ type: "addScene" }),
									className: "mr-1 grid h-6 w-6 place-items-center rounded text-text-secondary hover:bg-elevated hover:text-foreground",
									children: /* @__PURE__ */ jsx(Plus, { className: "h-3.5 w-3.5" })
								}),
								children: scenes.map((scene) => /* @__PURE__ */ jsxs("div", {
									className: cn("group flex items-center gap-1 rounded px-2 py-1 text-[12.5px] hover:bg-elevated", scene.name === activeSceneName && "bg-selection"),
									children: [/* @__PURE__ */ jsxs("button", {
										type: "button",
										onClick: () => dispatch({
											type: "openTab",
											tab: {
												kind: "scene",
												label: scene.name,
												sceneName: scene.name
											}
										}),
										className: "min-w-0 flex-1 truncate text-left text-foreground",
										children: [scene.name, scene.name === project.firstLayoutName ? /* @__PURE__ */ jsx("span", {
											className: "ml-1 text-[10px] text-success",
											children: "★"
										}) : null]
									}), /* @__PURE__ */ jsx("button", {
										type: "button",
										"aria-label": `${S.options}: ${scene.name}`,
										onClick: (event) => {
											const rect = event.currentTarget.getBoundingClientRect();
											setMenu({
												x: rect.right - 170,
												y: rect.bottom + 2,
												scene: scene.name
											});
										},
										className: "shrink-0 rounded p-0.5 text-text-secondary opacity-0 hover:text-foreground group-hover:opacity-100",
										children: /* @__PURE__ */ jsx(MoreVertical, { className: "h-3.5 w-3.5" })
									})]
								}, scene.name))
							}),
							/* @__PURE__ */ jsxs(Section, {
								icon: /* @__PURE__ */ jsx(FileCode2, { className: "h-4 w-4" }),
								label: S.externalLayouts,
								action: /* @__PURE__ */ jsx("button", {
									type: "button",
									"aria-label": S.externalLayouts,
									onClick: () => dispatch({ type: "addExternalLayout" }),
									className: "mr-1 grid h-6 w-6 place-items-center rounded text-text-secondary hover:bg-elevated hover:text-foreground",
									children: /* @__PURE__ */ jsx(Plus, { className: "h-3.5 w-3.5" })
								}),
								children: [project.externalLayouts.length === 0 ? /* @__PURE__ */ jsx("p", {
									className: "px-2 py-1 text-[12px] text-text-placeholder",
									children: "Ninguno todavía."
								}) : null, project.externalLayouts.map((layout) => /* @__PURE__ */ jsx("div", {
									className: "px-2 py-1 text-[12.5px] text-muted-foreground",
									children: layout.name
								}, layout.name))]
							}),
							/* @__PURE__ */ jsxs(Section, {
								icon: /* @__PURE__ */ jsx(FileCode2, { className: "h-4 w-4" }),
								label: S.externalEvents,
								action: /* @__PURE__ */ jsx("button", {
									type: "button",
									"aria-label": S.externalEvents,
									onClick: () => dispatch({ type: "addExternalEvents" }),
									className: "mr-1 grid h-6 w-6 place-items-center rounded text-text-secondary hover:bg-elevated hover:text-foreground",
									children: /* @__PURE__ */ jsx(Plus, { className: "h-3.5 w-3.5" })
								}),
								children: [project.externalEvents.length === 0 ? /* @__PURE__ */ jsx("p", {
									className: "px-2 py-1 text-[12px] text-text-placeholder",
									children: "Ninguno todavía."
								}) : null, project.externalEvents.map((events) => /* @__PURE__ */ jsx("div", {
									className: "px-2 py-1 text-[12.5px] text-muted-foreground",
									children: events.name
								}, events.name))]
							}),
							/* @__PURE__ */ jsx(Section, {
								icon: /* @__PURE__ */ jsx(Variable, { className: "h-4 w-4" }),
								label: S.globalVariables,
								leaf: true,
								action: /* @__PURE__ */ jsx("button", {
									type: "button",
									"aria-label": S.globalVariables,
									onClick: () => dispatch({
										type: "openDialog",
										dialog: {
											name: "variables",
											scope: "global"
										}
									}),
									className: "mr-1 grid h-6 w-6 place-items-center rounded text-text-secondary hover:bg-elevated hover:text-foreground",
									children: /* @__PURE__ */ jsx(Plus, { className: "h-3.5 w-3.5" })
								})
							}),
							/* @__PURE__ */ jsxs(Section, {
								icon: /* @__PURE__ */ jsx(Puzzle, { className: "h-4 w-4" }),
								label: S.extensions,
								defaultOpen: true,
								children: [project.extensions.map((extension) => /* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-1 px-2 py-1 text-[12.5px] text-muted-foreground",
									children: [
										/* @__PURE__ */ jsx("span", {
											className: "min-w-0 flex-1 truncate",
											children: extension.name
										}),
										/* @__PURE__ */ jsxs("span", {
											className: "shrink-0 text-[10px]",
											children: ["v", extension.version ?? "1.0.0"]
										}),
										/* @__PURE__ */ jsx("button", {
											type: "button",
											"aria-label": S.delete,
											onClick: () => dispatch({
												type: "uninstallExtension",
												name: extension.name
											}),
											className: "shrink-0 text-text-secondary hover:text-destructive",
											children: /* @__PURE__ */ jsx(Trash2, { className: "h-3 w-3" })
										})
									]
								}, extension.name)), /* @__PURE__ */ jsxs("button", {
									type: "button",
									onClick: () => dispatch({
										type: "openDialog",
										dialog: { name: "projectProperties" }
									}),
									className: "flex items-center gap-1 px-2 py-1 text-[12.5px] text-link hover:text-link-hover",
									children: [
										/* @__PURE__ */ jsx(Plus, { className: "h-3 w-3" }),
										" ",
										S.extensions
									]
								})]
							}),
							/* @__PURE__ */ jsxs(Section, {
								icon: /* @__PURE__ */ jsx(Image$1, { className: "h-4 w-4" }),
								label: S.resources,
								defaultOpen: true,
								action: /* @__PURE__ */ jsx("button", {
									type: "button",
									"aria-label": S.addANewResource,
									onClick: () => dispatch({
										type: "openDialog",
										dialog: { name: "resources" }
									}),
									className: "mr-1 grid h-6 w-6 place-items-center rounded text-text-secondary hover:bg-elevated hover:text-foreground",
									children: /* @__PURE__ */ jsx(Plus, { className: "h-3.5 w-3.5" })
								}),
								children: [resources.map((resource) => /* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-1.5 px-2 py-1 text-[12.5px] text-muted-foreground",
									children: [resource.kind === "image" && resolveAsset(resource.file || resource.name, resources) ? /* @__PURE__ */ jsx("img", {
										src: resolveAsset(resource.file || resource.name, resources),
										alt: "",
										className: "h-4 w-4 shrink-0 bg-[#1D1D26] object-contain [image-rendering:pixelated]"
									}) : /* @__PURE__ */ jsx(Image$1, { className: "h-3.5 w-3.5 shrink-0 text-link" }), /* @__PURE__ */ jsx("span", {
										className: "min-w-0 flex-1 truncate",
										children: resource.name
									})]
								}, resource.name)), resources.length === 0 ? /* @__PURE__ */ jsx("p", {
									className: "px-2 py-1 text-[12px] text-text-placeholder",
									children: S.addANewResource
								}) : null]
							})
						]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "flex shrink-0 items-center gap-1 border-t border-separator p-2 text-[11px] text-text-secondary",
						children: [
							/* @__PURE__ */ jsx(Copy, { className: "h-3.5 w-3.5" }),
							project.scenes.length,
							" escenas · ",
							project.resources.length,
							" recursos ·",
							" ",
							project.extensions.length,
							" extensiones"
						]
					})
				]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "flex-1 bg-black/50",
				onClick: close
			}),
			menu ? /* @__PURE__ */ jsx(GdMenu, {
				entries: sceneEntries(menu.scene),
				anchor: menu,
				onClose: () => setMenu(null)
			}) : null
		]
	});
}
//#endregion
//#region src/components/editor/InlineAiPrompt.tsx
var InlineAiPrompt = ({ x, y, targetName, onApply, onClose }) => {
	const [prompt, setPrompt] = useState("");
	const [loading, setLoading] = useState(false);
	const containerRef = useRef(null);
	const inputRef = useRef(null);
	useEffect(() => {
		inputRef.current?.focus();
		const handleKeyDown = (event) => {
			if (event.key === "Escape") onClose();
		};
		const handlePointerDown = (event) => {
			if (!containerRef.current?.contains(event.target)) onClose();
		};
		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("pointerdown", handlePointerDown, true);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("pointerdown", handlePointerDown, true);
		};
	}, [onClose]);
	const handleSubmit = async (event) => {
		event.preventDefault();
		if (!prompt.trim() || loading) return;
		setLoading(true);
		try {
			await onApply(prompt, targetName);
			onClose();
		} catch (error) {
			console.error(error);
			setLoading(false);
		}
	};
	return /* @__PURE__ */ jsx("div", {
		ref: containerRef,
		role: "dialog",
		"aria-label": targetName ? `Editar ${targetName} con IA` : "Editar con IA",
		style: {
			"--inline-ai-x": `${x}px`,
			"--inline-ai-y": `${y}px`
		},
		"data-ai-overlay": "contextual-popover",
		className: "fixed bottom-[calc(var(--mobile-editor-dock-height)+0.75rem)] left-1/2 z-[35] -translate-x-1/2 animate-in duration-200 fade-in zoom-in md:bottom-auto md:left-[var(--inline-ai-x)] md:top-[var(--inline-ai-y)] md:-translate-y-full md:pb-3",
		children: /* @__PURE__ */ jsxs("form", {
			onSubmit: handleSubmit,
			className: "flex w-72 max-w-[calc(100vw-1rem)] items-center rounded-full border border-zinc-700/80 bg-zinc-900 p-1 shadow-2xl backdrop-blur-xl md:w-96",
			children: [
				/* @__PURE__ */ jsx("div", {
					className: "ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10",
					children: /* @__PURE__ */ jsx(Sparkles, {
						className: "h-4 w-4 text-emerald-400",
						"aria-hidden": "true"
					})
				}),
				/* @__PURE__ */ jsx("input", {
					ref: inputRef,
					type: "text",
					value: prompt,
					onChange: (event) => setPrompt(event.target.value),
					disabled: loading,
					maxLength: 600,
					autoComplete: "off",
					"aria-label": targetName ? `Modificar ${targetName}` : "Instrucción para la IA",
					placeholder: targetName ? `Modificar ${targetName}...` : "Escribe una instrucción...",
					className: "flex-1 border-none bg-transparent px-2 text-sm text-zinc-100 outline-none placeholder-zinc-500 disabled:opacity-50"
				}),
				/* @__PURE__ */ jsx("button", {
					type: "submit",
					disabled: !prompt.trim() || loading,
					"aria-label": loading ? "Aplicando edición" : "Aplicar edición",
					className: "mr-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white transition-colors hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600",
					children: loading ? /* @__PURE__ */ jsx("div", {
						className: "h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white",
						"aria-hidden": "true"
					}) : /* @__PURE__ */ jsx(ArrowUp, {
						className: "h-4 w-4",
						"aria-hidden": "true"
					})
				})
			]
		})
	});
};
var normalize = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
/** Words skipped before a name ("el objeto X") — includes category words. */
var SKIP_WORDS = /* @__PURE__ */ new Set([
	"el",
	"la",
	"los",
	"las",
	"un",
	"una",
	"uno",
	"objeto",
	"instancia",
	"escena",
	"variable",
	"comportamiento",
	"con",
	"de",
	"del",
	"que",
	"se",
	"por",
	"nuevo",
	"nueva"
]);
/** Words that stop a name ("... a X", "... en X", "... y ..."). */
var STOP_WORDS = /* @__PURE__ */ new Set([
	"a",
	"al",
	"en",
	"de",
	"del",
	"como",
	"tipo",
	"y",
	"con",
	"llamada",
	"llamado",
	"nombre",
	"global",
	"booleana",
	"booleano",
	"numerica",
	"que",
	"diga"
]);
/** Splits the substring after the first anchor match into tokens and walks
*  them: skip leading filler words, then collect up to three name tokens
*  until a stop word or the end. */
function extractName(text, anchor) {
	const start = anchor.exec(text);
	if (!start) return null;
	const tokens = text.slice(start.index + start[0].length).split(/[\s.,;]+/).map((token) => token.trim()).filter(Boolean);
	const name = [];
	let skipping = true;
	for (const raw of tokens) {
		const token = raw.toLowerCase();
		if (!/^[\p{L}\p{N} _-]+$/u.test(raw)) break;
		if (skipping) {
			if (SKIP_WORDS.has(token)) continue;
			if (STOP_WORDS.has(token)) return null;
			skipping = false;
		} else if (STOP_WORDS.has(token)) break;
		name.push(raw);
		if (name.length === 3) break;
	}
	return name.length > 0 ? name.join(" ") : null;
}
/** The object referenced after the last "a X" / "de X" of the prompt. */
function objectAtTail(text) {
	return text.match(/(?:a|de)\s+([a-z0-9áéíóúñ_-]{2,40}(?:\s[a-z0-9áéíóúñ_-]{2,40})?)\s*[.,]?\s*$/i)?.[1]?.trim() ?? null;
}
var firstInstanceByName = (scene, objectName) => {
	if (!scene || !objectName) return null;
	const object = scene.objects.find((candidate) => candidate.name === objectName);
	if (!object) return null;
	return scene.instances.find((instance) => instance.objectId === object.id) ?? null;
};
var objectNameOfInstance = (scene, instanceId) => {
	if (!scene) return "";
	const instance = scene.instances.find((candidate) => candidate.id === instanceId);
	return instance ? scene.objects.find((object) => object.id === instance.objectId)?.name ?? "" : "";
};
/**
* Converts already-compiled GDEvents (e.g. the deterministic compiler of
* QuickAutomationBar) into a plan of create_event operations, so every AI
* surface funnels through the same trust boundary (validatePlan → applyPlan).
* create_event handles flat events; subEvents are not expressible in this
* tool and are dropped (the in-editor compilers emit flat events).
*/
function eventsToAgentPlan(events, sceneName, summary) {
	const operations = events.map((event) => createOperation("create_event", {
		sceneName,
		conditions: event.conditions.map((instruction) => ({
			typeId: instruction.typeId,
			parameters: { ...instruction.parameters },
			inverted: instruction.inverted
		})),
		actions: event.actions.map((instruction) => ({
			typeId: instruction.typeId,
			parameters: { ...instruction.parameters },
			inverted: instruction.inverted
		}))
	}));
	return createPlan(summary ?? (events.length === 1 ? "Crear evento automatizado" : `Crear ${events.length} eventos automatizados`), operations, sceneName);
}
function planFromInstruction(prompt, context) {
	if (typeof prompt !== "string") return {
		plan: null,
		reason: "Escribe una instrucción de texto para el agente."
	};
	const text = prompt.trim().replace(/\s+/g, " ");
	if (text.length < 4) return {
		plan: null,
		reason: "Describe lo que quieres con un poco más de detalle."
	};
	if (text.length > 600) return {
		plan: null,
		reason: `La instrucción no puede superar 600 caracteres.`
	};
	if (hasDisallowedControlCharacters(text)) return {
		plan: null,
		reason: "La instrucción contiene caracteres no válidos."
	};
	const normalized = normalize(text);
	const { project } = context;
	const operations = [];
	const summaryParts = [];
	let targetSceneName = context.activeSceneName;
	let createdSceneName = null;
	const hasEventTrigger = /\b(?:al presionar|al pulsar|presiona|pulsar|tecla|cuando|al comenzar|inicio de la escena|clic|click|cada\s+\d+\s+segundos)\b/.test(normalized);
	const wantsNewScene = /(?:crea|crear|anade|anadir|agrega|agregar|genera|generar)\b[^.]*?\bescena\b/.test(normalized) && !normalized.match(/(?:duplica|duplicar|clona|clonar)\b/);
	if (wantsNewScene) {
		const name = extractName(text, /escena/) ?? newNameGenerator("Nueva escena", project.scenes.map((scene) => scene.name));
		operations.push(createOperation("create_scene", { name }));
		summaryParts.push(`Crear escena «${name}»`);
		createdSceneName = name;
	}
	if (/(?:duplica|duplicar|clona|clonar)\b[^.]*?\bescena\b/.test(normalized) && !wantsNewScene) {
		const name = extractName(text, /escena/);
		if (!name) return {
			plan: null,
			reason: "Indica qué escena quieres duplicar."
		};
		const asMatch = normalized.match(/(?:como|nombre)\s+([a-z0-9 _-]{2,40})/);
		operations.push(createOperation("duplicate_scene", {
			sceneName: name,
			...asMatch?.[1] ? { newName: asMatch[1].trim() } : {}
		}));
		summaryParts.push(`Duplicar escena «${name}»`);
	}
	const explicitScene = normalized.match(/\ben\s+la\s+escena\s+([a-z0-9 _-]{2,40})/);
	if (explicitScene) {
		const name = explicitScene[1].trim();
		const found = project.scenes.find((scene) => scene.name.toLowerCase() === name);
		if (found) targetSceneName = found.name;
		else if (createdSceneName && name.toLowerCase() === createdSceneName.toLowerCase()) targetSceneName = createdSceneName;
		else return {
			plan: null,
			reason: `No existe la escena «${name}».`
		};
	} else if (createdSceneName) {
		if (operations.length === 1 || normalized.includes(createdSceneName.toLowerCase())) targetSceneName = createdSceneName;
	}
	const activeScene = project.scenes.find((candidate) => candidate.name === context.activeSceneName) ?? project.scenes[0] ?? null;
	const lookupScene = targetSceneName === createdSceneName ? activeScene : activeScene;
	const objectByName = (name) => lookupScene ? lookupScene.objects.find((object) => object.name === name) ?? null : null;
	const wantsObject = /(?:crea|crear|anade|anadir|agrega|agregar|genera|generar)\b[^.]*?\b(objeto|texto)\b/.test(normalized);
	if (wantsObject && !wantsNewScene) {
		const name = extractName(text, /objeto|texto/);
		if (!name) return {
			plan: null,
			reason: "Indica el nombre del objeto que quieres crear."
		};
		let type = "Sprite";
		if (/\btexto\b/.test(normalized)) type = "TextObject::Text";
		else if (/\bspritesheet\b|\bhoja de sprites\b/.test(normalized)) type = "SpriteObject::SpriteSheet";
		if (!isCreatableObjectType(type)) return {
			plan: null,
			reason: `El tipo de objeto «${type}» no está disponible en el editor.`
		};
		const payload = {
			sceneName: targetSceneName,
			name,
			type
		};
		if (type === "TextObject::Text") payload["text"] = text.match(/["“]([^"”]+)["”]/u)?.[1] ?? "Texto";
		operations.push(createOperation("create_object", payload));
		summaryParts.push(`Crear objeto «${name}» (${type === "TextObject::Text" ? "texto" : "sprite"})`);
	}
	const wantsRename = /\brenombra\b|\bcambia el nombre\b/.test(normalized);
	if (wantsRename && !wantsObject) {
		const from = extractName(text, /renombra|cambia el nombre/);
		const to = text.match(/(?:\ba|\bcomo)\s+(?:["“])?([^"”.,;]{2,60}?)(?:["”])?(?:\s*[.,;]|$)/i)?.[1]?.trim();
		const object = objectByName(from);
		if (!object) return {
			plan: null,
			reason: from ? `No existe el objeto «${from}».` : "Indica qué objeto renombrar y su nuevo nombre."
		};
		if (!to || to === object.name) return {
			plan: null,
			reason: "Indica el nuevo nombre después de «a»."
		};
		operations.push(createOperation("update_object", {
			sceneName: targetSceneName,
			objectId: object.id,
			patch: { name: to }
		}));
		summaryParts.push(`Renombrar «${object.name}» a «${to}»`);
	}
	if (/\b(?:elimina|eliminar|borra|borrar|quita|quitar)\b/.test(normalized) && !wantsRename && !wantsObject) {
		const name = extractName(text, /elimina|eliminar|borra|borrar|quita|quitar/);
		const object = objectByName(name);
		if (!object) return {
			plan: null,
			reason: name ? `No existe el objeto «${name}».` : "Indica qué objeto quieres eliminar."
		};
		operations.push(createOperation("delete_object", {
			sceneName: targetSceneName,
			objectId: object.id
		}));
		summaryParts.push(`Eliminar objeto «${object.name}»`);
	}
	const wantsInstance = /\binstancia\b/.test(normalized) && /(?:crea|crear|pon|poner|anade|anadir|agrega|agregar|coloca|colocar)\b/.test(normalized);
	if (wantsInstance) {
		const name = extractName(text, /instancia/);
		const object = objectByName(name);
		if (!object) return {
			plan: null,
			reason: name ? `No existe el objeto «${name}» del que crear una instancia.` : "Indica el objeto del que quieres una instancia («añade una instancia de Moneda»)."
		};
		const pairMatch = normalized.match(/\ben\s*\(?\s*(-?\d+(?:[.,]\d+)?)[,;]\s*(-?\d+(?:[.,]\d+)?)/);
		const pair = pairMatch ? {
			x: Number(pairMatch[1].replace(",", ".")),
			y: Number(pairMatch[2].replace(",", "."))
		} : context.cursorPosition ?? null;
		const center = {
			x: Math.round(project.gameSettings.windowWidth / 2),
			y: Math.round(project.gameSettings.windowHeight / 2)
		};
		operations.push(createOperation("create_instance", {
			sceneName: targetSceneName,
			objectId: object.id,
			x: pair ? Math.round(pair.x) : center.x,
			y: pair ? Math.round(pair.y) : center.y
		}));
		summaryParts.push(`Añadir instancia de «${object.name}»`);
	}
	const wantsMove = /\b(?:mueve|mover|desplaza|desplazar)\b/.test(normalized);
	if (wantsMove && !wantsInstance && !hasEventTrigger) {
		const name = extractName(text, /mueve|mover|desplaza|desplazar/);
		const instance = firstInstanceByName(lookupScene, name);
		if (!instance) return {
			plan: null,
			reason: name ? `No hay ninguna instancia de «${name}» en la escena.` : "Indica qué instancia quieres mover («mueve Moneda a 200,100»)."
		};
		let x = null;
		let y = null;
		const absolute = normalized.match(/\ba\s*\(?\s*(-?\d+(?:[.,]\d+)?)[,;]\s*(-?\d+(?:[.,]\d+)?)/);
		if (absolute?.[1] && absolute[2]) {
			x = Number(absolute[1].replace(",", "."));
			y = Number(absolute[2].replace(",", "."));
		} else {
			const relative = normalized.match(/(-?\d+(?:[.,]\d+)?)\s*(?:px|pixeles?)?\s+(?:a la |hacia )?(derecha|izquierda|arriba|abajo)|\b(derecha|izquierda|arriba|abajo)\s+(?:en |por )?(-?\d+(?:[.,]\d+)?)\s*(?:px|pixeles?)?/);
			if (relative) {
				const axis = relative[2] ?? relative[3];
				const amount = Math.abs(Number((relative[1] ?? relative[4] ?? "0").replace(",", "."))) || 32;
				if (axis === "derecha") x = instance.x + amount;
				else if (axis === "izquierda") x = instance.x - amount;
				else if (axis === "arriba") y = instance.y - amount;
				else if (axis === "abajo") y = instance.y + amount;
			}
		}
		if (x === null || y === null) return {
			plan: null,
			reason: "Indica a dónde moverla: «a 200,100» o «32 a la derecha»."
		};
		operations.push(createOperation("move_instance", {
			sceneName: targetSceneName,
			instanceId: instance.id,
			x: Math.round(x),
			y: Math.round(y)
		}));
		summaryParts.push(`Mover instancia de «${objectNameOfInstance(lookupScene, instance.id)}»`);
	}
	if (/(\d+)\s*[x×]\s*(\d+)/.test(normalized) && /(?:tamano|tamaño|haz|hacer|redimensiona|redimensionar|dimension)\b/.test(normalized) && !wantsMove && !wantsInstance) {
		const sizeMatch = normalized.match(/(\d+)\s*[x×]\s*(\d+)/);
		const name = extractName(text, /haz|hacer|redimensiona|redimensionar|tamano|de/);
		const instance = firstInstanceByName(lookupScene, name);
		if (!instance) return {
			plan: null,
			reason: name ? `No hay ninguna instancia de «${name}» en la escena.` : "Indica qué instancia quieres redimensionar («haz Moneda de tamaño 48x48»)."
		};
		operations.push(createOperation("resize_instance", {
			sceneName: targetSceneName,
			instanceId: instance.id,
			width: Number(sizeMatch[1]),
			height: Number(sizeMatch[2])
		}));
		summaryParts.push(`Redimensionar instancia a ${sizeMatch[1]}×${sizeMatch[2]}`);
	}
	const wantsAddBehavior = /(?:anade|anadir|agrega|agregar|pon|poner|dale|dar)\b[^.]*?\bcomportamiento\b/.test(normalized);
	const wantsRemoveBehavior = /(?:quita|quitar|elimina|eliminar|retira|retirar)\b[^.]*?\bcomportamiento\b/.test(normalized);
	const BEHAVIOR_ALIASES = [
		[/platformer|jugador|personaje|player/, "PlatformBehavior::PlatformerObjectBehavior"],
		[/plataforma|platform/, "PlatformBehavior::PlatformBehavior"],
		[/ancla|anchor/, "AnchorBehavior::AnchorBehavior"],
		[/destello|flash/, "Flash::Flash"],
		[/vida|salud|health/, "Health::Health"],
		[/tween/, "Tween::TweenBehavior"],
		[/arrastrable|drag/, "DraggableBehavior::Draggable"]
	];
	if (wantsAddBehavior || wantsRemoveBehavior) {
		const behaviorAt = normalized.indexOf("comportamiento");
		let behaviorSegment = behaviorAt >= 0 ? normalized.slice(behaviorAt + 14) : normalized;
		const tailRef = behaviorSegment.match(/(?:\s+a\s+|\s+de\s+)[a-z0-9 _-]+\s*$/);
		if (tailRef?.index !== void 0) behaviorSegment = behaviorSegment.slice(0, tailRef.index);
		const type = BEHAVIOR_ALIASES.find(([pattern]) => pattern.test(behaviorSegment))?.[1];
		const object = objectByName(objectAtTail(text));
		if (!type || !object) return {
			plan: null,
			reason: "Indica el comportamiento (plataforma, platformer, ancla, flash, vida, tween o arrastrable) y el objeto («añade el comportamiento plataforma a Jugador»)."
		};
		if (wantsAddBehavior) {
			if (!isSupportedBehavior(type)) return {
				plan: null,
				reason: `El comportamiento «${type}» no está soportado por el runtime.`
			};
			if (object.behaviors.some((behavior) => behavior.type === type)) return {
				plan: null,
				reason: `«${object.name}» ya tiene ese comportamiento.`
			};
			const defaults = BEHAVIOR_DEFAULT_PROPERTIES[type];
			operations.push(createOperation("add_behavior", {
				sceneName: targetSceneName,
				objectId: object.id,
				...defaults ? { properties: { ...defaults } } : {},
				type
			}));
			summaryParts.push(`Añadir comportamiento a «${object.name}»`);
		} else {
			const behavior = object.behaviors.find((candidate) => candidate.type === type);
			if (!behavior) return {
				plan: null,
				reason: `«${object.name}» no tiene ese comportamiento.`
			};
			operations.push(createOperation("remove_behavior", {
				sceneName: targetSceneName,
				objectId: object.id,
				behaviorName: behavior.name
			}));
			summaryParts.push(`Quitar comportamiento de «${object.name}»`);
		}
	}
	if (/(?:crea|crear|anade|anadir|agrega|agregar)\b[^.]*?\bvariable\b/.test(normalized) || /\bvariables?\s+[a-z0-9_]{2,40}\b/.test(normalized)) {
		const name = extractName(text.replace(/\bglobal\b|\bbooleana\b|\bbooleano\b|\bnumérica\b|\bnumerica\b/gi, " "), /variable/);
		if (!name) return {
			plan: null,
			reason: "Indica el nombre de la variable (por ejemplo «puntos»)."
		};
		let type = "number";
		if (/\b(texto|cadena|string|literal)\b/.test(normalized)) type = "string";
		else if (/\b(boolean|booleana|booleano|flag|bandera)\b/.test(normalized)) type = "boolean";
		const scope = /\bglobal\b/.test(normalized) ? "global" : void 0;
		const valueMatch = normalized.match(/(?:con valor|valor)\s+(-?\d+(?:[.,]\d+)?)/);
		operations.push(createOperation("create_variable", {
			sceneName: targetSceneName,
			name,
			type,
			...valueMatch?.[1] ? { value: valueMatch[1].replace(",", ".") } : {},
			...scope ? { scope } : {}
		}));
		summaryParts.push(`Crear variable «${name}»`);
	}
	if (normalized.search(/\b(colisiona|colisione|choca|choque|toca|toque)\b[^.]*?\bcon\b/) >= 0 && !wantsAddBehavior && !wantsRemoveBehavior) {
		const mentions = lookupScene ? lookupScene.objects.map((object) => ({
			object,
			index: normalized.indexOf(normalize(object.name))
		})).filter((entry) => entry.index >= 0).sort((a, b) => a.index - b.index) : [];
		const picked = [];
		for (const { object } of mentions) {
			const name = object.name;
			if (!picked.some((chosen) => chosen !== name && (chosen.includes(name) || name.includes(chosen))) && !picked.includes(name)) picked.push(name);
			if (picked.length === 2) break;
		}
		if (picked.length < 2) return {
			plan: null,
			reason: "Indica los dos objetos de la colisión («cuando Jugador colisiona con Moneda, destruye Moneda»)."
		};
		const a = picked[0];
		const b = picked[1];
		if (!a || !b) return {
			plan: null,
			reason: "Indica los dos objetos de la colisión («cuando Jugador colisiona con Moneda, destruye Moneda»)."
		};
		let deleteTarget = "none";
		const destroyAt = normalized.search(/\b(destruye|destruir|elimina|eliminar|borra)\b/);
		if (destroyAt >= 0) {
			const mentioned = normalized.slice(destroyAt).match(/\b(?:destruye|destruir|elimina|eliminar|borra)\s+([a-z0-9 _-]+)/)?.[1]?.toLowerCase();
			if (mentioned) {
				if (a.toLowerCase().includes(mentioned) || mentioned.includes(a.toLowerCase())) deleteTarget = "A";
				else if (b.toLowerCase().includes(mentioned) || mentioned.includes(b.toLowerCase())) deleteTarget = "B";
			}
		}
		operations.push(createOperation("add_collision", {
			sceneName: targetSceneName,
			objectA: a,
			objectB: b,
			...deleteTarget !== "none" ? { deleteTarget } : {}
		}));
		summaryParts.push(`Colisión «${a}» ↔ «${b}»${deleteTarget !== "none" ? ` (destruye ${deleteTarget === "A" ? a : b})` : ""}`);
	}
	if (operations.length === 0 && lookupScene && /\b(colisiona|al presionar|tecla|cuando|al comenzar|inicio de la escena|cada\s+\d+\s+segundos|clic|click|reproduce|mover|crea|elimina)\b/.test(normalized)) try {
		const eventPlan = eventsToAgentPlan(compileIntentToEvents(text, {
			objectNames: lookupScene.objects.map((object) => object.name),
			sceneNames: project.scenes.map((entry) => entry.name),
			audioResources: project.resources.filter((resource) => resource.kind === "audio").map((resource) => resource.name),
			activeLayer: lookupScene.activeLayer
		}), targetSceneName);
		operations.push(...eventPlan.operations);
		summaryParts.push(eventPlan.summary);
	} catch (error) {
		return {
			plan: null,
			reason: error instanceof Error ? error.message : "No pude interpretar la automatización."
		};
	}
	if (operations.length === 0) return {
		plan: null,
		reason: "No pude convertir esa instrucción en un plan seguro. Prueba «crea la escena Nivel 2», «añade una instancia de Moneda en 200,100», «añade el comportamiento plataforma a Jugador», «crea la variable puntos» o «cuando Jugador colisiona con Moneda, destruye Moneda». Para automatizaciones complejas usa la barra de automatización (Ctrl/⌘K)."
	};
	return { plan: createPlan(summaryParts.join(" · "), operations, targetSceneName !== context.activeSceneName ? targetSceneName : void 0) };
}
//#endregion
//#region src/components/editor/hooks/use-agent-commit.ts
function useAgentCommit() {
	const { project, agent, activeSceneName, dispatch } = useEditor();
	return {
		planFromPrompt: React.useCallback((prompt) => planFromInstruction(prompt, {
			project,
			activeSceneName
		}), [project, activeSceneName]),
		needsApproval: React.useCallback((plan) => planRequiresApproval(plan, agent.mode), [agent.mode]),
		commit: React.useCallback((plan) => {
			const outcome = evaluateAndApplyPlan(agent, project, plan);
			dispatch({
				type: "applyAgentPlan",
				project: outcome.result.ok ? outcome.result.project : project,
				agent: outcome.session,
				...outcome.result.ok && plan.sceneName ? { sceneName: plan.sceneName } : {}
			});
			const lines = summarizePlan(outcome.result);
			const error = outcome.result.ok ? void 0 : outcome.result.diagnostics.filter((diagnostic) => diagnostic.severity === "error").map((diagnostic) => diagnostic.message).join(" · ") || "El plan no se pudo aplicar.";
			return {
				ok: outcome.result.ok,
				lines,
				...error ? { error } : {}
			};
		}, [
			agent,
			project,
			dispatch
		]),
		undoPlan: React.useCallback(() => {
			const outcome = undoLastAgentPlan(agent);
			if (!outcome.project) return false;
			dispatch({
				type: "applyAgentPlan",
				project: outcome.project,
				agent: outcome.session
			});
			return true;
		}, [agent, dispatch]),
		restoreBaseline: React.useCallback(() => {
			const outcome = restoreAgentBaseline(agent);
			if (!outcome.project) return false;
			dispatch({
				type: "applyAgentPlan",
				project: outcome.project,
				agent: outcome.session
			});
			return true;
		}, [agent, dispatch]),
		audit: React.useCallback((kind, label, planId) => {
			dispatch({
				type: "agentAudit",
				entry: makeAuditEntry(kind, label, planId)
			});
		}, [dispatch])
	};
}
//#endregion
//#region src/components/editor/QuickAutomationBar.tsx
function QuickAutomationBar() {
	const { project, scene, ui, dispatch } = useEditor();
	const { needsApproval, commit, audit } = useAgentCommit();
	const [prompt, setPrompt] = React.useState("");
	const [busy, setBusy] = React.useState(false);
	const [pendingPlan, setPendingPlan] = React.useState(null);
	const [attachments, setAttachments] = React.useState([]);
	const [showAttachMenu, setShowAttachMenu] = React.useState(false);
	const inputRef = React.useRef(null);
	const fileInputRef = React.useRef(null);
	const [fileFilter, setFileFilter] = React.useState("*/*");
	const open = ui.quickAutomationOpen;
	const close = React.useCallback(() => {
		setPrompt("");
		setAttachments([]);
		setShowAttachMenu(false);
		if (pendingPlan) audit("cancelled", `Plan de evento descartado al cerrar: ${pendingPlan.summary}`, pendingPlan.id);
		setPendingPlan(null);
		dispatch({
			type: "ui",
			patch: { quickAutomationOpen: false }
		});
	}, [
		audit,
		dispatch,
		pendingPlan
	]);
	const handleTriggerFileSelect = (accept) => {
		setFileFilter(accept);
		setShowAttachMenu(false);
		setTimeout(() => {
			fileInputRef.current?.click();
		}, 50);
	};
	const handleFileChange = async (e) => {
		const files = Array.from(e.target.files || []);
		if (!files.length) return;
		for (const file of files) {
			const ext = file.name.split(".").pop()?.toLowerCase() || "";
			let type = "doc";
			if ([
				"png",
				"jpg",
				"jpeg",
				"webp"
			].includes(ext)) type = "image";
			else if ([
				"mp3",
				"wav",
				"ogg"
			].includes(ext)) type = "audio";
			let content = "";
			if (type === "doc" && (ext === "txt" || ext === "md")) content = await file.text();
			setAttachments((prev) => [...prev, {
				name: file.name,
				type,
				content,
				file
			}]);
			toast.success(`Adjuntado: ${file.name}`);
		}
		if (fileInputRef.current) fileInputRef.current.value = "";
	};
	const removeAttachment = (index) => {
		setAttachments((prev) => prev.filter((_, i) => i !== index));
	};
	const submit = async (e) => {
		e.preventDefault();
		const cleanPrompt = prompt.trim();
		if (!cleanPrompt && attachments.length === 0) return;
		setBusy(true);
		try {
			let combinedPrompt = cleanPrompt;
			const docTexts = attachments.filter((a) => a.content).map((a) => `[Documento: ${a.name}]\n${a.content}`).join("\n\n");
			if (docTexts) combinedPrompt = `${docTexts}\n\nInstrucción: ${cleanPrompt}`;
			const objectNames = (scene.objects || []).map((o) => o.name);
			const generated = compileIntentToEvents(combinedPrompt, { objectNames });
			if (generated.length === 0) {
				toast.info("Describe los cambios para la escena, personajes o narrativa.");
				setBusy(false);
				return;
			}
			const plan = eventsToAgentPlan(generated, scene.name);
			if (needsApproval(plan)) setPendingPlan(plan);
			else {
				commit(plan);
				setPrompt("");
				setAttachments([]);
			}
		} catch (err) {
			toast.error("Error al procesar la instrucción del asistente.");
		} finally {
			setBusy(false);
		}
	};
	if (!open) return /* @__PURE__ */ jsxs("button", {
		type: "button",
		onClick: () => dispatch({
			type: "ui",
			patch: { quickAutomationOpen: true }
		}),
		className: "fixed right-3 bottom-[calc(var(--mobile-editor-dock-height)+0.75rem)] z-[25] flex h-11 w-11 items-center justify-center rounded-full border border-separator bg-[#1D1D26]/95 text-text-secondary shadow-xl backdrop-blur transition-transform active:scale-95 md:right-auto md:bottom-4 md:left-1/2 md:h-auto md:w-auto md:-translate-x-1/2 md:gap-2 md:px-3 md:py-1.5 md:text-xs",
		title: "Asistente de automatización (Robot)",
		children: [/* @__PURE__ */ jsx(Bot, { className: "h-5 w-5 text-[#A996FF] md:h-4 md:w-4" }), /* @__PURE__ */ jsx("span", {
			className: "hidden md:inline font-medium",
			children: "Asistente Agente"
		})]
	});
	return /* @__PURE__ */ jsx("div", {
		role: "dialog",
		"aria-modal": "false",
		"aria-label": "Asistente de automatización",
		"data-ai-overlay": "drawer",
		className: "fixed inset-x-0 bottom-0 z-[60] w-full md:inset-x-auto md:bottom-4 md:left-1/2 md:w-[min(720px,calc(100vw-1rem))] md:-translate-x-1/2",
		children: /* @__PURE__ */ jsxs("form", {
			onSubmit: submit,
			className: "max-h-[calc(100dvh-1rem)] overflow-y-auto rounded-t-2xl border border-[#3A3A48] bg-[#14141B]/95 p-3 shadow-2xl backdrop-blur-xl md:rounded-2xl",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "mb-2 flex items-center justify-between border-b border-[#2A2A38] pb-2",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ jsx(Bot, { className: "h-5 w-5 text-[#A996FF]" }), /* @__PURE__ */ jsx("span", {
							className: "text-xs font-semibold text-foreground tracking-wide",
							children: "Nexus AI Agent"
						})]
					}), /* @__PURE__ */ jsx("button", {
						type: "button",
						onClick: close,
						className: "grid h-6 w-6 place-items-center rounded-full text-text-secondary hover:bg-elevated hover:text-foreground",
						"aria-label": "Cerrar",
						children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
					})]
				}),
				attachments.length > 0 && /* @__PURE__ */ jsx("div", {
					className: "mb-2 flex flex-wrap gap-1.5",
					children: attachments.map((att, idx) => /* @__PURE__ */ jsxs("span", {
						className: "flex items-center gap-1 rounded-md bg-[#252533] px-2 py-1 text-[11px] text-text-secondary border border-separator",
						children: [
							att.type === "image" && /* @__PURE__ */ jsx(Image$1, { className: "h-3 w-3 text-sky-400" }),
							att.type === "audio" && /* @__PURE__ */ jsx(Music, { className: "h-3 w-3 text-amber-400" }),
							att.type === "doc" && /* @__PURE__ */ jsx(FileText, { className: "h-3 w-3 text-emerald-400" }),
							/* @__PURE__ */ jsx("span", {
								className: "max-w-[120px] truncate",
								children: att.name
							}),
							/* @__PURE__ */ jsx("button", {
								type: "button",
								onClick: () => removeAttachment(idx),
								className: "ml-0.5 text-text-secondary hover:text-red-400",
								children: /* @__PURE__ */ jsx(X, { className: "h-3 w-3" })
							})
						]
					}, idx))
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "relative flex items-center gap-1.5 rounded-xl border border-[#3E3E52] bg-[#1B1B24] px-2 py-1.5 focus-within:border-[#7A68EE]",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "relative",
							children: [/* @__PURE__ */ jsx("button", {
								type: "button",
								onClick: () => setShowAttachMenu((prev) => !prev),
								className: "grid h-8 w-8 place-items-center rounded-lg text-text-secondary hover:bg-[#2B2B3A] hover:text-foreground active:scale-95",
								title: "Adjuntar archivo o documento",
								children: /* @__PURE__ */ jsx(Paperclip, { className: "h-4 w-4" })
							}), showAttachMenu && /* @__PURE__ */ jsxs("div", {
								className: "absolute bottom-10 left-0 z-50 flex w-48 flex-col gap-1 rounded-xl border border-separator bg-[#1A1A24] p-1.5 shadow-xl",
								children: [
									/* @__PURE__ */ jsxs("button", {
										type: "button",
										onClick: () => handleTriggerFileSelect(".txt,.md,.docx,.xlsx,.pdf"),
										className: "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-text-secondary hover:bg-elevated hover:text-foreground",
										children: [/* @__PURE__ */ jsx(FileText, { className: "h-3.5 w-3.5 text-emerald-400" }), /* @__PURE__ */ jsx("span", { children: "Documento / Guion" })]
									}),
									/* @__PURE__ */ jsxs("button", {
										type: "button",
										onClick: () => handleTriggerFileSelect(".png,.jpg,.jpeg,.webp"),
										className: "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-text-secondary hover:bg-elevated hover:text-foreground",
										children: [/* @__PURE__ */ jsx(Image$1, { className: "h-3.5 w-3.5 text-sky-400" }), /* @__PURE__ */ jsx("span", { children: "Imagen / Sprite" })]
									}),
									/* @__PURE__ */ jsxs("button", {
										type: "button",
										onClick: () => handleTriggerFileSelect(".mp3,.wav,.ogg"),
										className: "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-text-secondary hover:bg-elevated hover:text-foreground",
										children: [/* @__PURE__ */ jsx(Music, { className: "h-3.5 w-3.5 text-amber-400" }), /* @__PURE__ */ jsx("span", { children: "Audio / Música" })]
									})
								]
							})]
						}),
						/* @__PURE__ */ jsx("input", {
							ref: fileInputRef,
							type: "file",
							accept: fileFilter,
							className: "hidden",
							onChange: handleFileChange
						}),
						/* @__PURE__ */ jsx("input", {
							ref: inputRef,
							value: prompt,
							onChange: (e) => setPrompt(e.target.value),
							placeholder: "Pregunta a Nexus AI o describe las acciones de la escena...",
							className: "flex-1 bg-transparent text-xs text-foreground placeholder:text-text-placeholder focus:outline-none"
						}),
						/* @__PURE__ */ jsx("button", {
							type: "submit",
							disabled: busy || !prompt.trim() && attachments.length === 0,
							className: cn("grid h-8 w-8 place-items-center rounded-lg bg-[#6868E8] text-white transition-opacity active:scale-95", (busy || !prompt.trim() && attachments.length === 0) && "opacity-40"),
							children: /* @__PURE__ */ jsx(Send, { className: "h-3.5 w-3.5" })
						})
					]
				})
			]
		})
	});
}
var MAX_MODEL_TIMEOUT_MS = 12e4;
/** Hard cap for the context sent to the model (bounded autonomy). */
var MAX_CONTEXT_CHARS = 8e3;
/**
* Compact JSON context of the project: scene/object/instance names and
* coordinates, variable names, resources by name. Deliberately excludes
* resource payloads (data URLs) and anything that is not needed to plan.
*/
function buildModelContext(project, activeSceneName) {
	const scenes = project.scenes.map((scene) => ({
		name: scene.name,
		active: scene.name === activeSceneName,
		objects: scene.objects.map((object) => ({
			id: object.id,
			name: object.name,
			type: object.type,
			...object.text !== void 0 ? { text: object.text.slice(0, 80) } : {},
			behaviors: object.behaviors.map((behavior) => behavior.type)
		})),
		instances: scene.instances.slice(0, 40).map((instance) => {
			const object = scene.objects.find((candidate) => candidate.id === instance.objectId);
			return {
				id: instance.id,
				name: object?.name ?? instance.objectId,
				x: instance.x,
				y: instance.y,
				width: instance.width,
				height: instance.height
			};
		}),
		variables: scene.variables.map((variable) => variable.name)
	}));
	const context = {
		project: project.name,
		window: {
			width: project.gameSettings.windowWidth,
			height: project.gameSettings.windowHeight
		},
		scenes,
		resources: project.resources.slice(0, 50).map((resource) => resource.name),
		globalVariables: project.globalVariables.map((variable) => variable.name)
	};
	let json = JSON.stringify(context);
	if (json.length > MAX_CONTEXT_CHARS) json = `${json.slice(0, MAX_CONTEXT_CHARS)}…`;
	return json;
}
/**
* Catalog of the tools the model may use: only the supported tools. The
* prompt is generated from the registry so it cannot advertise capabilities
* the runtime does not have.
*/
function buildToolCatalog() {
	return Object.values(TOOL_REGISTRY).filter((tool) => tool.supported).map((tool) => {
		const doc = PAYLOAD_DOCS[tool.name];
		return `- ${tool.name}: ${tool.description}${doc ? ` Payload: ${doc}` : ""}`;
	}).join("\n");
}
/** Short payload documentation per supported tool (prompt material). */
var PAYLOAD_DOCS = {
	create_scene: "{ name: string }",
	duplicate_scene: "{ sceneName: string, newName?: string }",
	update_scene: "{ sceneName: string, backgroundColor?: \"R;G;B\" }",
	create_object: "{ sceneName, name, type: \"Sprite\"|\"TextObject::Text\"|\"SpriteObject::SpriteSheet\"|..., text? (para texto), asset? (recurso existente) }",
	update_object: "{ sceneName, objectId, patch: { name?|text?|textColor?|textSize?|bold?|italic? } }",
	delete_object: "{ sceneName, objectId }",
	create_instance: "{ sceneName, objectId, x, y, width?, height? }",
	move_instance: "{ sceneName, instanceId, x, y }",
	resize_instance: "{ sceneName, instanceId, width, height }",
	assign_sprite: "{ sceneName, objectId, resource: nombre de recurso existente o \"\" }",
	create_animation: "{ sceneName, objectId, name, resource? }",
	add_behavior: "{ sceneName, objectId, name?, type (uno de los comportamientos soportados), properties? }",
	remove_behavior: "{ sceneName, objectId, behaviorName }",
	create_variable: "{ sceneName, name, type: \"number\"|\"string\"|\"boolean\", value?, scope?: \"scene\"|\"global\" }",
	create_event: "{ sceneName, conditions?: [{typeId, parameters, inverted?}], actions?: [{typeId, parameters, inverted?}] }",
	update_event: "{ sceneName, eventId, conditions?, actions?, disabled? }",
	add_collision: "{ sceneName, objectA, objectB, deleteTarget?: \"A\"|\"B\"|\"none\" }"
};
/** System + user messages for the chat-completions call. */
function buildModelMessages(instruction, project, activeSceneName) {
	const system = [
		"Eres el agente de un editor de juegos. Recibes una instrucción en español y un contexto JSON del proyecto.",
		"SOLO puedes responder con JSON válido, sin markdown ni texto extra, con esta forma:",
		"{ \"summary\": \"resumen breve en español\", \"sceneName\": \"opcional, escena destino\", \"operations\": [ { \"type\": \"nombre_de_herramienta\", \"payload\": { ... } } ] }",
		"",
		"Reglas:",
		"- Usa ÚNICAMENTE estas herramientas (no inventes otras):",
		buildToolCatalog(),
		"- Usa solo ids y nombres que existan en el contexto (objectId, instanceId, sceneName, nombres de objetos).",
		"- Máximo 50 operaciones; prefiere pocas y precisas.",
		"- No puedes generar sprites, importar archivos, ejecutar juegos ni publicar nada.",
		"- Si no puedes completar la instrucción con estas herramientas, responde { \"error\": \"explicación breve en español\" }."
	].join("\n");
	const user = [
		`Instrucción: ${instruction}`,
		"",
		"Contexto del proyecto (la escena activa está marcada):",
		buildModelContext(project, activeSceneName)
	].join("\n");
	return [{
		role: "system",
		content: system
	}, {
		role: "user",
		content: user
	}];
}
function stripCodeFences(value) {
	const trimmed = value.trim();
	return trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)?.[1] ?? trimmed;
}
function isRecord(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
/**
* Parses the raw model output into a candidate AgentPlan validated against
* the project. Never throws: failures come back as a reason in Spanish.
* Model-supplied ids are ignored; operations are re-registered with fresh
* ids so a malicious/corrupt id can never collide.
*/
function parseModelPlan(raw, project) {
	let candidate = raw;
	if (typeof raw === "string") try {
		candidate = JSON.parse(stripCodeFences(raw));
	} catch {
		return {
			plan: null,
			reason: "El modelo no devolvió JSON válido. Prueba a reformular la instrucción o usa el planificador local."
		};
	}
	if (!isRecord(candidate)) return {
		plan: null,
		reason: "La respuesta del modelo no tiene la forma esperada."
	};
	if (typeof candidate["error"] === "string" && candidate["error"].trim()) return {
		plan: null,
		reason: candidate["error"].trim().slice(0, 300)
	};
	if (!Array.isArray(candidate["operations"]) || candidate["operations"].length === 0) return {
		plan: null,
		reason: "El modelo no propuso ninguna operación válida."
	};
	const summary = typeof candidate["summary"] === "string" && candidate["summary"].trim() ? candidate["summary"].trim().slice(0, 500) : "Plan propuesto por el modelo de IA";
	const sceneName = typeof candidate["sceneName"] === "string" && candidate["sceneName"].trim() ? candidate["sceneName"].trim() : void 0;
	const operations = [];
	for (const item of candidate["operations"]) {
		if (!isRecord(item)) return {
			plan: null,
			reason: "El modelo devolvió operaciones en forma no válida."
		};
		const type = item["type"];
		const payload = item["payload"];
		if (typeof type !== "string" || !isRecord(payload)) return {
			plan: null,
			reason: "El modelo devolvió operaciones en forma no válida."
		};
		operations.push(createOperation(type, payload));
	}
	const plan = createPlan(summary, operations, sceneName);
	const validation = validatePlan(plan, project);
	if (!validation.ok) {
		const first = validation.errors[0];
		return {
			plan: null,
			reason: first ? `El plan del modelo no pasó la validación: ${first.message}` : "El plan del modelo no pasó la validación."
		};
	}
	return { plan };
}
/**
* Resuelve un endpoint OpenAI-compatible a la URL de chat-completions.
* Acepta tanto una URL completa (`…/chat/completions`) como una URL base
* (p. ej. `https://api.deepseek.com` o `https://api.openai.com/v1`) y añade
* la ruta estándar `/chat/completions` cuando falta.
*/
function resolveChatEndpoint(raw) {
	const trimmed = raw.trim();
	const base = trimmed.replace(/\/+$/, "");
	if (/\/completions$/i.test(base)) return trimmed;
	return `${base}/chat/completions`;
}
function safeEndpoint(url) {
	let parsed;
	try {
		parsed = new URL(url);
	} catch {
		return { reason: "El endpoint del modelo no es una URL válida." };
	}
	const isLocal = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
	if (parsed.protocol !== "https:" && !isLocal) return { reason: "El endpoint debe ser HTTPS (o localhost en desarrollo)." };
	return { url: parsed.toString() };
}
/**
* Calls the chat-completions endpoint and returns the candidate plan.
* The token is sent only in the Authorization header of this single request
* and never appears in returned reasons, logs or the audit trail.
*/
async function planFromModel(request) {
	const { url, reason } = safeEndpoint(resolveChatEndpoint(request.provider.endpoint));
	if (!url) return {
		plan: null,
		reason: reason ?? "El endpoint del modelo no es válido."
	};
	const timeoutMs = Math.min(MAX_MODEL_TIMEOUT_MS, Math.max(1e3, request.provider.timeoutMs ?? 3e4));
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const headers = {
			"Content-Type": "application/json",
			Accept: "application/json"
		};
		const token = request.provider.token?.trim();
		if (token) headers["Authorization"] = `Bearer ${token}`;
		const response = await fetch(url, {
			method: "POST",
			headers,
			body: JSON.stringify({
				model: request.provider.model?.trim() || void 0,
				messages: buildModelMessages(request.instruction, request.project, request.activeSceneName),
				temperature: .2,
				max_tokens: 2e3
			}),
			signal: controller.signal
		});
		if (!response.ok) return {
			plan: null,
			reason: `El proveedor de IA devolvió un error (HTTP ${response.status}). Revisa el endpoint, el modelo y las credenciales.`
		};
		const data = await response.json();
		const raw = extractModelContent(data);
		if (raw === null) return {
			plan: null,
			reason: "La respuesta del proveedor no contiene el contenido del modelo."
		};
		const usage = extractUsage(data);
		const parsed = parseModelPlan(raw, request.project);
		return usage ? {
			...parsed,
			usage
		} : parsed;
	} catch (error) {
		if (error instanceof DOMException && error.name === "AbortError") return {
			plan: null,
			reason: "El proveedor de IA no respondió a tiempo (timeout)."
		};
		return {
			plan: null,
			reason: "No se pudo conectar con el proveedor de IA (red o endpoint). El planificador local sigue disponible."
		};
	} finally {
		clearTimeout(timer);
	}
}
/** Accepts OpenAI-style responses, legacy `text` completions and raw JSON. */
function extractModelContent(data) {
	if (typeof data === "string") return data;
	if (!isRecord(data)) return null;
	const choices = data["choices"];
	if (Array.isArray(choices) && choices.length > 0 && isRecord(choices[0])) {
		const message = choices[0]["message"];
		if (isRecord(message) && typeof message["content"] === "string") return message["content"];
		if (typeof choices[0]["text"] === "string") return choices[0]["text"];
	}
	if (typeof data["summary"] === "string" || Array.isArray(data["operations"])) return JSON.stringify(data);
	return null;
}
function extractUsage(data) {
	if (!isRecord(data) || !isRecord(data["usage"])) return void 0;
	const usage = data["usage"];
	const result = {};
	if (typeof usage["prompt_tokens"] === "number") result.promptTokens = usage["prompt_tokens"];
	if (typeof usage["completion_tokens"] === "number") result.completionTokens = usage["completion_tokens"];
	if (result.promptTokens === void 0 && result.completionTokens === void 0) return void 0;
	return result;
}
//#endregion
//#region src/lib/agent/deepseek-client.ts
/**
* Cliente DeepSeek unificado sobre `model.ts`.
*
* Históricamente este módulo duplicaba el gateway LLM (SYSTEM_PROMPT propio,
* fetch manual sin timeout, parseo sin strip de fences). Desde la unificación,
* `requestAgentPlan` delega en `planFromModel`: un único punto de verdad para
* construir el contexto/mensajes, timeout duro (AbortController), validación
* del endpoint (HTTPS/localhost), strip de fences markdown y re-registro de ids
* del plan. Esta capa solo aporta el endpoint y el modelo por defecto de
* DeepSeek, manteniendo la API pública que usan scripts/agent-cli.mjs.
*/
/** Base del proveedor DeepSeek, usada como endpoint por defecto en la UI. */
var DEEPSEEK_BASE_URL = "https://api.deepseek.com";
var DEFAULT_DEEPSEEK_MODEL = "deepseek-chat";
//#endregion
//#region src/components/editor/AgentPanel.tsx
var messageId = 0;
var nextMessageId = () => messageId += 1;
var AUTONOMY_LABELS = {
	Supervised: "Supervisado",
	SemiAutonomous: "Semiautónomo",
	Autonomous: "Autónomo"
};
var AUTONOMY_HINTS = {
	Supervised: "Cada plan se muestra y lo apruebas antes de tocar el proyecto.",
	SemiAutonomous: "Aplica planes seguros directamente; los destructivos siguen pidiendo aprobación.",
	Autonomous: "Aplica todo al instante. Sigue siendo atómico, auditado y deshecho en un clic; nunca publica."
};
function AgentPanel() {
	const { ui, project, agent, activeSceneName, dispatch } = useEditor();
	const { planFromPrompt, needsApproval, commit, undoPlan, restoreBaseline, audit } = useAgentCommit();
	const [draft, setDraft] = React.useState("");
	const [messages, setMessages] = React.useState([]);
	const [showAudit, setShowAudit] = React.useState(false);
	const [busy, setBusy] = React.useState(false);
	/** Optional remote model (OpenAI-compatible). Per-session only: the token
	*  is never persisted, only used in the outgoing request (same pattern as
	*  the sprite-generation flow). */
	const [showModelConfig, setShowModelConfig] = React.useState(false);
	const [endpoint, setEndpoint] = React.useState(DEEPSEEK_BASE_URL);
	const [modelName, setModelName] = React.useState(DEFAULT_DEEPSEEK_MODEL);
	const [token, setToken] = React.useState("");
	const inputRef = React.useRef(null);
	const bottomRef = React.useRef(null);
	const open = ui.agentPanelOpen;
	React.useEffect(() => {
		if (open) window.setTimeout(() => inputRef.current?.focus(), 0);
	}, [open]);
	React.useEffect(() => {
		bottomRef.current?.scrollIntoView({ block: "end" });
	}, [messages]);
	React.useEffect(() => {
		if (!open) return;
		const onKeyDown = (event) => {
			if (event.key === "Escape") {
				event.stopPropagation();
				dispatch({
					type: "ui",
					patch: { agentPanelOpen: false }
				});
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [open, dispatch]);
	const close = React.useCallback(() => {
		setToken("");
		dispatch({
			type: "ui",
			patch: { agentPanelOpen: false }
		});
	}, [dispatch]);
	const pushMessages = React.useCallback((entries) => {
		setMessages((previous) => [...previous, ...entries.map((entry) => ({
			...entry,
			id: nextMessageId()
		}))]);
	}, []);
	const replaceMessage = React.useCallback((id, patch) => {
		setMessages((previous) => previous.map((message) => message.id === id ? {
			...message,
			...patch
		} : message));
	}, []);
	const dismissPending = React.useCallback(() => {
		const pending = messages.find((message) => message.pending && message.plan);
		if (pending?.plan) audit("cancelled", `Plan descartado: ${pending.plan.summary}`, pending.plan.id);
		setMessages((previous) => previous.map((message) => message.pending ? {
			...message,
			pending: false
		} : message));
	}, [messages, audit]);
	const runPlan = React.useCallback((plan) => {
		const result = commit(plan);
		if (result.ok) {
			toast.success("Plan aplicado. Puedes deshacerlo desde el panel del agente.");
			return {
				kind: "applied",
				lines: result.lines
			};
		}
		toast.error(result.error ?? "El plan no se pudo aplicar.");
		return {
			kind: "rejected",
			lines: result.lines,
			...result.error ? { text: result.error } : {}
		};
	}, [commit]);
	/** Shared approval flow for a candidate plan (local or model produced). */
	const presentPlan = React.useCallback((plan) => {
		dismissPending();
		const operations = plan.operations.map((operation) => ({
			type: operation.type,
			label: TOOL_REGISTRY[operation.type]?.label ?? operation.type,
			payload: JSON.stringify(operation.payload).slice(0, 90)
		}));
		if (!needsApproval(plan)) {
			const outcome = runPlan(plan);
			pushMessages([{
				role: "agent",
				kind: outcome.kind,
				lines: outcome.lines,
				...outcome.text ? { text: outcome.text } : {}
			}]);
			return;
		}
		const validation = validatePlan(plan, project);
		if (!validation.ok) {
			pushMessages([{
				role: "agent",
				kind: "rejected",
				text: "El plan no pasó la validación; el proyecto no cambió:",
				lines: validation.errors.map((error) => error.message)
			}]);
			return;
		}
		pushMessages([{
			role: "agent",
			kind: "plan",
			pending: true,
			plan,
			operations,
			text: agent.mode === "Supervised" ? "Revisa el plan antes de aplicarlo:" : "Plan con cambios destructivos — revísalo antes de aplicarlo:"
		}]);
	}, [
		dismissPending,
		needsApproval,
		runPlan,
		pushMessages,
		project,
		agent.mode
	]);
	/** Deterministic planner path (no remote model involved). */
	const runDeterministic = React.useCallback((prompt) => {
		const proposal = planFromPrompt(prompt);
		if (!proposal.plan) {
			pushMessages([{
				role: "agent",
				kind: "info",
				text: proposal.reason ?? "No pude generar un plan seguro."
			}]);
			return;
		}
		presentPlan(proposal.plan);
	}, [
		planFromPrompt,
		pushMessages,
		presentPlan
	]);
	const onSubmit = async (event) => {
		event.preventDefault();
		const prompt = draft.trim();
		if (!prompt || busy) return;
		setDraft("");
		pushMessages([{
			role: "user",
			kind: "info",
			text: prompt
		}]);
		if (!endpoint.trim().startsWith("http")) {
			runDeterministic(prompt);
			return;
		}
		setBusy(true);
		try {
			const result = await planFromModel({
				instruction: prompt,
				project,
				activeSceneName,
				provider: {
					endpoint: endpoint.trim(),
					...modelName.trim() ? { model: modelName.trim() } : {},
					...token.trim() ? { token: token.trim() } : {}
				}
			});
			if (result.plan) presentPlan(result.plan);
			else pushMessages([{
				role: "agent",
				kind: "info",
				text: `El modelo de IA no pudo generar un plan: ${result.reason ?? "error desconocido."}`,
				retryPrompt: prompt
			}]);
		} finally {
			setBusy(false);
		}
	};
	const retryLocal = (prompt) => {
		runDeterministic(prompt);
	};
	const approve = (message) => {
		if (!message.plan) return;
		const outcome = runPlan(message.plan);
		replaceMessage(message.id, {
			pending: false,
			kind: outcome.kind,
			lines: outcome.lines,
			...outcome.text ? { text: outcome.text } : {}
		});
	};
	const cancel = (message) => {
		if (message.plan) audit("cancelled", `Plan descartado por el usuario: ${message.plan.summary}`, message.plan.id);
		replaceMessage(message.id, {
			pending: false,
			kind: "info",
			text: "Plan descartado. El proyecto no cambió."
		});
	};
	if (!open) return null;
	const appliedCount = agent.applied.length;
	const recentAudit = agent.audit.slice(-12).reverse();
	return /* @__PURE__ */ jsxs("aside", {
		"aria-label": "Panel del agente",
		className: "fixed inset-y-0 right-0 z-[45] flex w-full max-w-[400px] flex-col border-l border-separator bg-[#14141B] shadow-2xl",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex h-11 shrink-0 items-center gap-2 border-b border-separator px-3",
				children: [
					/* @__PURE__ */ jsx(Bot, { className: "h-4 w-4 text-[#A996FF]" }),
					/* @__PURE__ */ jsx("span", {
						className: "text-[13px] font-medium text-foreground",
						children: "Agente"
					}),
					/* @__PURE__ */ jsx("select", {
						value: agent.mode,
						onChange: (event) => dispatch({
							type: "agentSetMode",
							mode: event.target.value
						}),
						"aria-label": "Modo de autonomía",
						title: AUTONOMY_HINTS[agent.mode],
						className: "ml-auto h-6 rounded border border-separator bg-[#25252E] px-1 text-[10.5px] text-foreground outline-none focus:border-[#6868E8]",
						children: AUTONOMY_MODES.map((mode) => /* @__PURE__ */ jsx("option", {
							value: mode,
							children: AUTONOMY_LABELS[mode]
						}, mode))
					}),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						onClick: close,
						"aria-label": "Cerrar panel del agente",
						className: "grid h-6 w-6 place-items-center rounded text-text-secondary hover:bg-elevated hover:text-foreground",
						children: /* @__PURE__ */ jsx(X, { className: "h-3.5 w-3.5" })
					})
				]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "min-h-0 flex-1 overflow-y-auto px-3 py-2",
				children: messages.length === 0 ? /* @__PURE__ */ jsxs("div", {
					className: "mt-6 rounded-lg border border-dashed border-separator p-3 text-[11.5px] leading-relaxed text-text-secondary",
					children: [
						/* @__PURE__ */ jsxs("p", {
							className: "mb-2 flex items-center gap-1.5 text-text-foreground",
							children: [/* @__PURE__ */ jsx(Sparkles, { className: "h-3.5 w-3.5 text-[#A996FF]" }), "Pídele al agente cambios seguros sobre el proyecto:"]
						}),
						/* @__PURE__ */ jsxs("ul", {
							className: "list-disc space-y-1 pl-4",
							children: [
								/* @__PURE__ */ jsx("li", { children: "«Crea la escena Nivel 2 y añade la variable puntos»" }),
								/* @__PURE__ */ jsx("li", { children: "«Añade una instancia de Moneda en 200,100»" }),
								/* @__PURE__ */ jsx("li", { children: "«Añade el comportamiento plataforma a Jugador»" }),
								/* @__PURE__ */ jsx("li", { children: "«Crea la variable vidas booleana global»" }),
								/* @__PURE__ */ jsx("li", { children: "«Cuando Jugador colisiona con Moneda, destruye Moneda»" })
							]
						}),
						/* @__PURE__ */ jsxs("p", {
							className: "mt-2 text-[10.5px]",
							children: [
								"Todo pasa por validación y se aplica como transacción atómica con deshacer. Por defecto usa DeepSeek (",
								/* @__PURE__ */ jsx("span", {
									className: "text-text-foreground",
									children: "deepseek-chat"
								}),
								"); el modelo solo propone planes (nunca toca el proyecto directamente). El agente no publica nada automáticamente."
							]
						})
					]
				}) : /* @__PURE__ */ jsxs("div", {
					className: "space-y-2",
					children: [messages.map((message) => /* @__PURE__ */ jsx(PanelMessageView, {
						message,
						onApprove: approve,
						onCancel: cancel,
						onPreview: () => dispatch({
							type: "ui",
							patch: { previewOpen: true }
						}),
						onRetryLocal: retryLocal
					}, message.id)), /* @__PURE__ */ jsx("div", { ref: bottomRef })]
				})
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "shrink-0 border-t border-separator",
				children: [/* @__PURE__ */ jsxs("button", {
					type: "button",
					onClick: () => setShowAudit((value) => !value),
					className: "flex w-full items-center gap-1 px-3 py-1.5 text-[10.5px] text-text-secondary hover:bg-elevated hover:text-foreground",
					children: [
						/* @__PURE__ */ jsx(ChevronDown, { className: cn("h-3 w-3 transition-transform", !showAudit && "-rotate-90") }),
						"Diagnósticos y memoria de la sesión (",
						agent.audit.length,
						")"
					]
				}), showAudit ? /* @__PURE__ */ jsxs("div", {
					className: "max-h-40 overflow-y-auto border-t border-separator px-3 py-1.5",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "mb-1.5 flex gap-1.5",
							children: [
								/* @__PURE__ */ jsxs("button", {
									type: "button",
									onClick: () => {
										if (undoPlan()) toast.success("Último plan deshecho.");
									},
									disabled: appliedCount === 0,
									className: "flex items-center gap-1 rounded border border-separator px-2 py-0.5 text-[10.5px] text-foreground hover:bg-elevated disabled:opacity-40",
									children: [/* @__PURE__ */ jsx(RotateCcw, { className: "h-3 w-3" }), "Deshacer último plan"]
								}),
								/* @__PURE__ */ jsxs("button", {
									type: "button",
									onClick: () => {
										if (restoreBaseline()) toast.success("Proyecto restaurado al punto de partida.");
									},
									disabled: appliedCount === 0,
									className: "flex items-center gap-1 rounded border border-separator px-2 py-0.5 text-[10.5px] text-foreground hover:bg-elevated disabled:opacity-40",
									children: [/* @__PURE__ */ jsx(Trash2, { className: "h-3 w-3" }), "Restaurar punto de partida"]
								}),
								/* @__PURE__ */ jsxs("button", {
									type: "button",
									onClick: () => dispatch({
										type: "ui",
										patch: { previewOpen: true }
									}),
									className: "flex items-center gap-1 rounded bg-primary px-2 py-0.5 text-[10.5px] font-medium text-primary-foreground hover:bg-[#5C36D6]",
									children: [/* @__PURE__ */ jsx(Play, { className: "h-3 w-3" }), "Vista previa"]
								})
							]
						}),
						/* @__PURE__ */ jsx("select", {
							value: agent.snapshotMode,
							onChange: (event) => dispatch({
								type: "agentSetSnapshotMode",
								mode: event.target.value
							}),
							"aria-label": "Modo de restauración",
							title: "Snapshot: punto de partida de la sesión. Branches de proyecto: en etapas posteriores.",
							className: "mb-1.5 h-6 rounded border border-separator bg-[#25252E] px-1 text-[10px] text-text-secondary outline-none",
							children: SNAPSHOT_MODES.map((mode) => /* @__PURE__ */ jsxs("option", {
								value: mode,
								children: [
									"Restauración:",
									" ",
									mode === "snapshot" ? "snapshot (por defecto)" : "branch (próximamente)"
								]
							}, mode))
						}),
						/* @__PURE__ */ jsx("ul", {
							className: "space-y-1",
							children: recentAudit.map((entry, index) => /* @__PURE__ */ jsxs("li", {
								className: "text-[10px] leading-snug text-text-secondary",
								children: [
									/* @__PURE__ */ jsx("span", {
										className: "tabular-nums text-text-placeholder",
										children: new Date(entry.at).toLocaleTimeString("es-PY", {
											hour: "2-digit",
											minute: "2-digit",
											second: "2-digit"
										})
									}),
									" ",
									entry.label
								]
							}, `${entry.at}-${index}`))
						})
					]
				}) : null]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "shrink-0 border-t border-separator",
				children: [/* @__PURE__ */ jsxs("button", {
					type: "button",
					onClick: () => setShowModelConfig((value) => !value),
					className: "flex w-full items-center gap-1 px-3 py-1.5 text-[10.5px] text-text-secondary hover:bg-elevated hover:text-foreground",
					children: [
						/* @__PURE__ */ jsx(Cpu, { className: "h-3 w-3" }),
						"Modelo de IA",
						/* @__PURE__ */ jsx("span", {
							className: cn(endpoint.trim().startsWith("http") ? "text-emerald-400" : "text-text-placeholder"),
							children: endpoint.trim().startsWith("http") ? "· activo" : "· sin configurar (usará planificador local)"
						})
					]
				}), showModelConfig ? /* @__PURE__ */ jsxs("div", {
					className: "space-y-1 border-t border-separator px-3 py-2",
					children: [
						/* @__PURE__ */ jsxs("p", {
							className: "text-[9.5px] leading-snug text-text-placeholder",
							children: [
								"Configuración por defecto: DeepSeek (endpoint",
								" ",
								/* @__PURE__ */ jsx("span", {
									className: "text-text-secondary",
									children: "https://api.deepseek.com"
								}),
								" y modelo",
								" ",
								/* @__PURE__ */ jsx("span", {
									className: "text-text-secondary",
									children: "deepseek-chat"
								}),
								"). El token (API key) solo se usa en la solicitud y no se guarda. Sin endpoint, el agente usa el planificador determinista local."
							]
						}),
						/* @__PURE__ */ jsx("input", {
							value: endpoint,
							onChange: (event) => setEndpoint(event.target.value),
							placeholder: "https://…/v1/chat/completions",
							"aria-label": "Endpoint del modelo",
							className: "h-7 w-full rounded border border-separator bg-[#25252E] px-2 text-[11px] text-foreground outline-none focus:border-[#6868E8]"
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex gap-1",
							children: [/* @__PURE__ */ jsx("input", {
								value: modelName,
								onChange: (event) => setModelName(event.target.value),
								placeholder: "Modelo (opcional)",
								"aria-label": "Nombre del modelo",
								className: "h-7 w-1/2 rounded border border-separator bg-[#25252E] px-2 text-[11px] text-foreground outline-none focus:border-[#6868E8]"
							}), /* @__PURE__ */ jsx("input", {
								value: token,
								onChange: (event) => setToken(event.target.value),
								type: "password",
								placeholder: "Token (opcional)",
								"aria-label": "Token del proveedor",
								autoComplete: "off",
								className: "h-7 w-1/2 rounded border border-separator bg-[#25252E] px-2 text-[11px] text-foreground outline-none focus:border-[#6868E8]"
							})]
						})
					]
				}) : null]
			}),
			/* @__PURE__ */ jsxs("form", {
				onSubmit: (event) => {
					onSubmit(event);
				},
				className: "flex shrink-0 items-center gap-1 border-t border-separator bg-[#101017] p-2",
				children: [/* @__PURE__ */ jsx("input", {
					ref: inputRef,
					value: draft,
					onChange: (event) => setDraft(event.target.value),
					maxLength: 600,
					disabled: busy,
					placeholder: "Ej.: crea la escena Nivel 2 y añade la variable puntos",
					"aria-label": "Instrucción para el agente",
					className: "min-w-0 flex-1 rounded-lg border border-separator bg-[#17171F] px-2 py-1.5 text-[12px] text-foreground outline-none placeholder:text-text-placeholder focus:border-[#6868E8] disabled:opacity-60"
				}), /* @__PURE__ */ jsx("button", {
					type: "submit",
					disabled: !draft.trim() || busy,
					"aria-label": busy ? "Consultando el modelo de IA" : "Enviar instrucción al agente",
					className: "grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground hover:bg-[#5C36D6] disabled:bg-elevated disabled:text-text-placeholder",
					children: busy ? /* @__PURE__ */ jsx("span", { className: "h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" }) : /* @__PURE__ */ jsx(Send, { className: "h-3.5 w-3.5" })
				})]
			})
		]
	});
}
function PanelMessageView({ message, onApprove, onCancel, onPreview, onRetryLocal }) {
	if (message.role === "user") return /* @__PURE__ */ jsx("div", {
		className: "flex justify-end",
		children: /* @__PURE__ */ jsx("p", {
			className: "max-w-[85%] rounded-lg rounded-br-none bg-[#2A2A36] px-2.5 py-1.5 text-[12px] text-foreground",
			children: message.text
		})
	});
	const tone = message.kind === "applied" ? "border-emerald-700/50" : message.kind === "rejected" ? "border-red-800/60" : message.kind === "plan" ? "border-[#6868E8]/60" : "border-separator";
	return /* @__PURE__ */ jsx("div", {
		className: "flex justify-start",
		children: /* @__PURE__ */ jsx("div", {
			className: cn("max-w-[92%] rounded-lg rounded-bl-none border bg-[#17171F] px-2.5 py-1.5", tone),
			children: message.kind === "plan" && message.plan ? /* @__PURE__ */ jsxs(Fragment, { children: [
				/* @__PURE__ */ jsx("p", {
					className: "mb-1 text-[11.5px] text-foreground",
					children: message.text
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mb-1 text-[11px] font-medium text-[#CFC8FF]",
					children: message.plan.summary
				}),
				message.operations ? /* @__PURE__ */ jsx("ul", {
					className: "mb-1.5 space-y-0.5",
					children: message.operations.map((operation, index) => /* @__PURE__ */ jsxs("li", {
						className: "text-[10.5px] text-text-secondary",
						children: [
							"• ",
							operation.label,
							/* @__PURE__ */ jsx("span", {
								className: "ml-1 text-text-placeholder",
								children: operation.payload
							})
						]
					}, `${operation.type}-${index}`))
				}) : null,
				message.pending ? /* @__PURE__ */ jsxs("div", {
					className: "flex gap-1.5",
					children: [/* @__PURE__ */ jsx("button", {
						type: "button",
						onClick: () => onApprove(message),
						className: "rounded bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground hover:bg-[#5C36D6]",
						children: "Aplicar"
					}), /* @__PURE__ */ jsx("button", {
						type: "button",
						onClick: () => onCancel(message),
						className: "rounded border border-separator px-2.5 py-1 text-[11px] text-foreground hover:bg-elevated",
						children: "Descartar"
					})]
				}) : null
			] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
				message.text ? /* @__PURE__ */ jsx("p", {
					className: "text-[11.5px] text-foreground",
					children: message.text
				}) : null,
				message.lines ? /* @__PURE__ */ jsx("ul", {
					className: cn("space-y-0.5", message.text && "mt-1"),
					children: message.lines.map((line, index) => /* @__PURE__ */ jsx("li", {
						className: "text-[11px] text-text-secondary",
						children: line
					}, index))
				}) : null,
				message.kind === "applied" ? /* @__PURE__ */ jsxs("button", {
					type: "button",
					onClick: onPreview,
					className: "mt-1.5 flex items-center gap-1 rounded border border-separator px-2 py-0.5 text-[10.5px] text-foreground hover:bg-elevated",
					children: [/* @__PURE__ */ jsx(Play, { className: "h-3 w-3" }), "Vista previa del resultado"]
				}) : null,
				message.retryPrompt ? /* @__PURE__ */ jsxs("button", {
					type: "button",
					onClick: () => onRetryLocal(message.retryPrompt),
					className: "mt-1.5 flex items-center gap-1 rounded border border-separator px-2 py-0.5 text-[10.5px] text-foreground hover:bg-elevated",
					children: [/* @__PURE__ */ jsx(RotateCcw, { className: "h-3 w-3" }), "Intentar con el planificador local"]
				}) : null
			] })
		})
	});
}
//#endregion
//#region src/components/editor/hooks/use-editor-shortcuts.ts
var isTyping = (target) => {
	const element = target;
	if (!element) return false;
	const tag = element.tagName;
	return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || element.isContentEditable === true;
};
function useEditorShortcuts() {
	const { ui, scene, project, dispatch, canUndo, canRedo } = useEditor();
	useEffect(() => {
		const onKeyDown = (event) => {
			if (ui.dialog || ui.previewOpen || ui.projectManagerOpen || ui.agentPanelOpen) return;
			const ctrl = event.ctrlKey || event.metaKey;
			const key = event.key;
			if (ctrl && key.toLowerCase() === "k") {
				event.preventDefault();
				dispatch({
					type: "ui",
					patch: {
						quickAutomationOpen: !ui.quickAutomationOpen,
						inlineAi: null
					}
				});
				return;
			}
			if (ui.quickAutomationOpen) {
				if (key === "Escape") {
					event.preventDefault();
					dispatch({
						type: "ui",
						patch: { quickAutomationOpen: false }
					});
				}
				return;
			}
			if (ui.inlineAi) {
				if (key === "Escape") {
					event.preventDefault();
					dispatch({ type: "closeInlineAi" });
				}
				return;
			}
			if (ctrl && key.toLowerCase() === "s") {
				event.preventDefault();
				saveProjectEverywhere(project).then(() => dispatch({ type: "markSaved" })).catch((error) => {
					window.alert?.(error instanceof Error ? error.message : "No se pudo guardar el proyecto.");
				});
				return;
			}
			if (isTyping(event.target)) return;
			if (ctrl && key.toLowerCase() === "z") {
				event.preventDefault();
				dispatch({ type: event.shiftKey ? "redo" : canUndo ? "undo" : "redo" });
				return;
			}
			if (ctrl && key.toLowerCase() === "y") {
				event.preventDefault();
				if (canRedo) dispatch({ type: "redo" });
				return;
			}
			const inEvents = ui.tab === "events";
			if (ctrl && key.toLowerCase() === "d") {
				event.preventDefault();
				if (inEvents) for (const id of ui.selectedEventIds) dispatch({
					type: "duplicateEvent",
					id
				});
				else if (ui.selectedInstanceIds.length > 0) dispatch({
					type: "duplicateInstances",
					ids: ui.selectedInstanceIds
				});
				else for (const id of ui.selectedObjectIds) dispatch({
					type: "duplicateObject",
					id
				});
				return;
			}
			if (ctrl && key.toLowerCase() === "c" && !inEvents) {
				event.preventDefault();
				if (ui.selectedInstanceIds.length > 0) copyInstances(scene.instances.filter((i) => ui.selectedInstanceIds.includes(i.id)));
				else copyObjects(scene.objects.filter((o) => ui.selectedObjectIds.includes(o.id)));
				return;
			}
			if (ctrl && key.toLowerCase() === "x" && !inEvents) {
				event.preventDefault();
				if (ui.selectedInstanceIds.length > 0) {
					copyInstances(scene.instances.filter((i) => ui.selectedInstanceIds.includes(i.id)));
					dispatch({
						type: "deleteInstances",
						ids: ui.selectedInstanceIds
					});
				} else if (ui.selectedObjectIds.length > 0) {
					copyObjects(scene.objects.filter((o) => ui.selectedObjectIds.includes(o.id)));
					for (const id of ui.selectedObjectIds) dispatch({
						type: "deleteObject",
						id
					});
				}
				return;
			}
			if (ctrl && key.toLowerCase() === "v") {
				event.preventDefault();
				if (inEvents) {
					const first = scene.events[0];
					if (first) dispatch({
						type: "duplicateEvent",
						id: first.id
					});
					return;
				}
				const { objects, instances } = pasteInto(scene);
				for (const object of objects) dispatch({
					type: "addObject",
					object
				});
				if (instances.length > 0) dispatch({
					type: "addInstances",
					instances
				});
				return;
			}
			if (inEvents && key.toLowerCase() === "e") {
				event.preventDefault();
				dispatch({
					type: "addEvent",
					parentId: null,
					kind: "standard"
				});
				return;
			}
			if (inEvents && (key === "Enter" || key.toLowerCase() === "c")) {
				event.preventDefault();
				dispatch({
					type: "addEvent",
					parentId: ui.selectedEventIds[0] ?? null,
					kind: key === "Enter" ? "standard" : "comment"
				});
				return;
			}
			if (key === "Delete" || key === "Backspace") {
				if (inEvents) {
					if (ui.selectedEventIds.length === 0) return;
					event.preventDefault();
					dispatch({
						type: "deleteEvents",
						ids: ui.selectedEventIds
					});
					dispatch({
						type: "selectEvents",
						ids: []
					});
					return;
				}
				if (ui.selectedInstanceIds.length > 0) {
					event.preventDefault();
					dispatch({
						type: "deleteInstances",
						ids: ui.selectedInstanceIds
					});
				} else if (ui.selectedObjectIds.length > 0) {
					event.preventDefault();
					for (const id of ui.selectedObjectIds) dispatch({
						type: "deleteObject",
						id
					});
				}
				return;
			}
			if (key === "Escape") {
				dispatch({
					type: "selectInstances",
					ids: []
				});
				dispatch({
					type: "ui",
					patch: {
						selectedObjectIds: [],
						selectedEventIds: [],
						selectedInstruction: null
					}
				});
				return;
			}
			if (!inEvents && ui.selectedInstanceIds.length > 0 && key.startsWith("Arrow")) {
				event.preventDefault();
				const step = event.shiftKey ? 10 : scene.grid.snap ? scene.grid.width : 1;
				const delta = {
					ArrowLeft: {
						dx: -step,
						dy: 0
					},
					ArrowRight: {
						dx: step,
						dy: 0
					},
					ArrowUp: {
						dx: 0,
						dy: -step
					},
					ArrowDown: {
						dx: 0,
						dy: step
					}
				}[key];
				if (delta) dispatch({
					type: "moveInstances",
					ids: ui.selectedInstanceIds,
					...delta
				});
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [
		ui,
		scene,
		project,
		dispatch,
		canUndo,
		canRedo
	]);
}
//#endregion
//#region src/components/editor/EditorShell.tsx
/** Escena / Eventos switcher of the active scene tab. */
function SceneSubTabs() {
	const { ui, dispatch, scene, activeTabKind } = useEditor();
	if (activeTabKind !== "scene") return null;
	return /* @__PURE__ */ jsxs("div", {
		className: "flex h-8 shrink-0 items-end gap-px border-b border-separator bg-[#32323B] px-2",
		children: [[{
			id: "scene",
			label: S.sceneTab
		}, {
			id: "events",
			label: S.eventsTab
		}].map((entry) => /* @__PURE__ */ jsxs("button", {
			type: "button",
			onClick: () => dispatch({
				type: "ui",
				patch: { tab: entry.id }
			}),
			className: cn("flex h-7 items-center gap-1.5 rounded-t px-3 text-[11.5px] font-medium", ui.tab === entry.id ? "bg-window text-foreground" : "text-[#c9c9cd] hover:bg-[#3c3c46] hover:text-foreground"),
			children: [entry.label, entry.id === "events" && scene.events.length > 0 ? /* @__PURE__ */ jsx("span", {
				className: "rounded bg-[rgba(0,0,0,0.3)] px-1 text-[10px] tabular-nums text-text-secondary",
				children: scene.events.length
			}) : null]
		}, entry.id)), /* @__PURE__ */ jsxs("div", {
			className: "ml-auto flex items-center gap-1 pb-1 text-[11px] text-text-secondary",
			children: [
				scene.objects.length,
				" ",
				S.objects.toLowerCase(),
				" · ",
				scene.instances.length,
				" ",
				S.instances.toLowerCase()
			]
		})]
	});
}
function RightColumn() {
	const { ui, dispatch } = useEditor();
	const tabs = [
		{
			id: "properties",
			label: S.properties,
			icon: SlidersHorizontal
		},
		{
			id: "instances",
			label: S.instances,
			icon: List
		},
		{
			id: "layers",
			label: S.layers,
			icon: Layers
		}
	];
	return /* @__PURE__ */ jsxs("div", {
		className: "hidden w-[318px] shrink-0 flex-col border-l border-separator bg-toolbar md:flex",
		children: [
			/* @__PURE__ */ jsx("div", {
				className: "flex h-8 shrink-0 items-center gap-px border-b border-separator bg-[#32323B] px-1",
				children: tabs.map((entry) => /* @__PURE__ */ jsxs("button", {
					type: "button",
					onClick: () => dispatch({
						type: "ui",
						patch: {
							rightTab: entry.id,
							showPropertiesPanel: entry.id === "properties" ? true : ui.showPropertiesPanel,
							showInstancesPanel: entry.id === "instances" ? true : ui.showInstancesPanel,
							showLayersPanel: entry.id === "layers" ? true : ui.showLayersPanel
						}
					}),
					className: cn("flex h-7 flex-1 items-center justify-center gap-1 rounded px-1 text-[11px] font-medium", ui.rightTab === entry.id ? "bg-window text-foreground" : "text-[#c9c9cd] hover:bg-[#3c3c46] hover:text-foreground"),
					title: entry.label,
					children: [/* @__PURE__ */ jsx(entry.icon, { className: "h-3.5 w-3.5" }), /* @__PURE__ */ jsx("span", {
						className: "truncate",
						children: entry.label
					})]
				}, entry.id))
			}),
			ui.showPropertiesPanel ? /* @__PURE__ */ jsx(PropertiesPanel, {}) : null,
			ui.rightTab === "instances" && ui.showInstancesPanel ? /* @__PURE__ */ jsx(InstancesPanel, { onClose: () => dispatch({
				type: "ui",
				patch: {
					rightTab: "properties",
					showPropertiesPanel: true
				}
			}) }) : null,
			ui.rightTab === "layers" && ui.showLayersPanel ? /* @__PURE__ */ jsx(LayersPanel, { onClose: () => dispatch({
				type: "ui",
				patch: {
					rightTab: "properties",
					showPropertiesPanel: true
				}
			}) }) : null
		]
	});
}
function LeftColumn() {
	const { ui } = useEditor();
	return /* @__PURE__ */ jsxs("div", {
		className: "hidden w-[236px] shrink-0 flex-col border-r border-separator bg-toolbar md:flex",
		children: [/* @__PURE__ */ jsx(ObjectsPanel, {}), ui.showGroupsPanel ? /* @__PURE__ */ jsx(GroupsPanel, {}) : null]
	});
}
function Workspace() {
	const { ui, dispatch, activeTabKind: kind } = useEditor();
	if (kind === "home") return /* @__PURE__ */ jsx(HomeTab, {});
	if (kind === "gameSettings") return /* @__PURE__ */ jsxs("div", {
		className: "flex min-h-0 flex-1 flex-col items-center justify-center gap-3 bg-window text-center",
		children: [/* @__PURE__ */ jsx("p", {
			className: "text-[13px] text-text-secondary",
			children: S.gameSettings
		}), /* @__PURE__ */ jsxs("button", {
			type: "button",
			onClick: () => dispatch({
				type: "openDialog",
				dialog: { name: "projectProperties" }
			}),
			className: "rounded bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-foreground hover:bg-[#5C36D6]",
			children: ["Abrir ", S.gameSettings]
		})]
	});
	if (kind === "resources") return /* @__PURE__ */ jsxs("div", {
		className: "flex min-h-0 flex-1 flex-col items-center justify-center gap-3 bg-window text-center",
		children: [/* @__PURE__ */ jsx("p", {
			className: "text-[13px] text-text-secondary",
			children: S.resources
		}), /* @__PURE__ */ jsxs("button", {
			type: "button",
			onClick: () => dispatch({
				type: "openDialog",
				dialog: { name: "resources" }
			}),
			className: "rounded bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-foreground hover:bg-[#5C36D6]",
			children: ["Abrir ", S.resources]
		})]
	});
	return /* @__PURE__ */ jsxs("div", {
		className: "flex min-h-0 min-w-0 flex-1 flex-col",
		children: [/* @__PURE__ */ jsx(SceneSubTabs, {}), /* @__PURE__ */ jsx("div", {
			className: "flex min-h-0 flex-1",
			children: ui.tab === "events" ? /* @__PURE__ */ jsx(EventsEditor, {}) : /* @__PURE__ */ jsx(SceneCanvas, {})
		})]
	});
}
function InlineAiOverlay() {
	const { ui, dispatch, applyInlineAiPrompt } = useEditor();
	const session = ui.inlineAi;
	const close = React.useCallback(() => dispatch({ type: "closeInlineAi" }), [dispatch]);
	const apply = React.useCallback(async (prompt, targetName) => {
		try {
			const summary = await applyInlineAiPrompt(prompt, targetName);
			toast.success(summary);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "No se pudo aplicar la edición con IA.");
			throw error;
		}
	}, [applyInlineAiPrompt]);
	if (!session) return null;
	return /* @__PURE__ */ jsx(InlineAiPrompt, {
		x: session.x,
		y: session.y,
		...session.targetName ? { targetName: session.targetName } : {},
		onApply: apply,
		onClose: close
	});
}
function Body() {
	const { ui, dispatch } = useEditor();
	useEditorShortcuts();
	return /* @__PURE__ */ jsxs("div", {
		className: "flex h-dvh flex-col overflow-hidden bg-window text-foreground",
		children: [
			/* @__PURE__ */ jsx(ProjectTitlebar, {}),
			/* @__PURE__ */ jsx(TopToolbar, {}),
			/* @__PURE__ */ jsxs("main", {
				className: "flex min-h-0 flex-1 pb-[var(--mobile-editor-dock-height)] md:pb-0",
				children: [
					ui.showLeftPanel && ui.tab === "scene" ? /* @__PURE__ */ jsx(LeftColumn, {}) : /* @__PURE__ */ jsx("div", {}),
					/* @__PURE__ */ jsx(Workspace, {}),
					ui.showRightPanel ? /* @__PURE__ */ jsx(RightColumn, {}) : null
				]
			}),
			/* @__PURE__ */ jsx(MobileBottomBar, {}),
			/* @__PURE__ */ jsx(QuickAutomationBar, {}),
			/* @__PURE__ */ jsx(AgentPanel, {}),
			/* @__PURE__ */ jsx(NewObjectDialog, {}),
			/* @__PURE__ */ jsx(ObjectEditorDialog, {}),
			/* @__PURE__ */ jsx(BehaviorsDialog, {}),
			/* @__PURE__ */ jsx(EffectsListDialog, {}),
			/* @__PURE__ */ jsx(ScenePropertiesDialog, {}),
			/* @__PURE__ */ jsx(ProjectPropertiesDialog, {}),
			/* @__PURE__ */ jsx(VariablesDialog, {}),
			/* @__PURE__ */ jsx(InstructionSelectorDialog, {}),
			/* @__PURE__ */ jsx(PreviewDialog, {}),
			/* @__PURE__ */ jsx(ProjectManagerDrawer, {}),
			/* @__PURE__ */ jsx(ShareDialog, {
				open: ui.dialog?.name === "share",
				initialTab: ui.dialog?.name === "share" ? ui.dialog.tab : "publish",
				onClose: () => dispatch({ type: "closeDialog" })
			}),
			/* @__PURE__ */ jsx(InlineAiOverlay, {})
		]
	});
}
function EditorShell() {
	return /* @__PURE__ */ jsx(EditorProvider, { children: /* @__PURE__ */ jsx(Body, {}) });
}
//#endregion
//#region src/routes/editor.tsx?tsr-split=component
function EditorPage() {
	return /* @__PURE__ */ jsx(EditorShell, {});
}
//#endregion
export { EditorPage as component };
