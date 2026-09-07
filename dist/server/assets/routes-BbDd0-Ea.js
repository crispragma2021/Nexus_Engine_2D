import { t as supabase } from "./client-CFB4ucS5.js";
import { a as NexusLogo, d as listLocalProjects, f as saveLocalProject, g as createEmptyProject, i as SheetTitle, l as deleteLocalProject, n as SheetContent, o as NexusMark, p as setCurrentProject, s as cn, t as Sheet } from "./sheet-DaL3UsqW.js";
import * as React from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { ArrowRight, Bell, Check, ChevronDown, ChevronLeft, ChevronRight, Coins, Crown, ExternalLink, Gamepad2, Github, GraduationCap, Hammer, HardDrive, HelpCircle, Home, Languages, Loader2, Lock, Menu, Plus, RefreshCw, Search, Shuffle, SlidersHorizontal, Store, Tag, ThumbsUp, Trash2, Trophy, X, Youtube } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as SliderPrimitive from "@radix-ui/react-slider";
//#region src/components/home/MainMenuDrawer.tsx
function MainMenuDrawer({ open, onOpenChange, hasProject, onCreateGame, onPreferences }) {
	const [section, setSection] = useState("root");
	const navigate = useNavigate();
	const close = () => {
		onOpenChange(false);
		setTimeout(() => setSection("root"), 250);
	};
	const fileEntries = [
		{
			label: "Crear un juego",
			action: () => {
				close();
				onCreateGame();
			}
		},
		{
			label: "Abrir…",
			action: () => navigate({ to: "/editor" }).then(close)
		},
		{
			label: "Abrir recientes",
			submenu: true,
			action: () => setSection("recent")
		},
		{
			label: "Guardar",
			disabled: !hasProject,
			divider: true
		},
		{
			label: "Guardar como…",
			disabled: !hasProject
		},
		{
			label: "Mostrar historial de versiones",
			disabled: !hasProject
		},
		{
			label: "Invitar colaboradores",
			disabled: !hasProject,
			divider: true
		},
		{
			label: "Exportar (web, iOS, Android)…",
			disabled: !hasProject
		},
		{
			label: "Cerrar proyecto",
			disabled: !hasProject,
			divider: true
		},
		{
			label: "Preferencias",
			divider: true,
			action: () => {
				close();
				onPreferences();
			}
		}
	];
	const helpEntries = [
		{ label: "Documentación" },
		{ label: "Tutoriales y guías" },
		{ label: "Comunidad" },
		{
			label: "Reportar un problema",
			divider: true
		},
		{ label: "Acerca de" }
	];
	const recentEntries = [
		{
			label: "My platformer project",
			action: () => navigate({ to: "/editor" }).then(close)
		},
		{
			label: "Space shooter (demo)",
			disabled: true
		},
		{
			label: "Puzzle prototype",
			disabled: true
		}
	];
	const renderList = (entries) => /* @__PURE__ */ jsx("ul", {
		className: "px-4",
		children: entries.map((e) => /* @__PURE__ */ jsx("li", {
			className: cn(e.divider && "border-t border-separator"),
			children: /* @__PURE__ */ jsxs("button", {
				type: "button",
				disabled: e.disabled,
				onClick: e.action,
				className: cn("flex w-full items-center justify-between gap-3 py-4 text-left text-base", e.disabled ? "cursor-default text-muted-foreground/50" : "text-foreground active:bg-elevated"),
				children: [/* @__PURE__ */ jsx("span", { children: e.label }), e.submenu && /* @__PURE__ */ jsx(ChevronRight, { className: "size-5 text-muted-foreground" })]
			})
		}, e.label))
	});
	return /* @__PURE__ */ jsx(Sheet, {
		open,
		onOpenChange: (o) => o ? onOpenChange(true) : close(),
		children: /* @__PURE__ */ jsxs(SheetContent, {
			side: "left",
			className: "w-[82vw] max-w-sm border-separator bg-window p-0 [&>button]:hidden",
			children: [
				/* @__PURE__ */ jsx(SheetTitle, {
					className: "sr-only",
					children: "Menú"
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "flex h-14 items-center gap-3 border-b border-separator bg-elevated px-4",
					children: [
						/* @__PURE__ */ jsx(Menu, { className: "size-6 text-foreground" }),
						/* @__PURE__ */ jsx("span", {
							className: "flex-1 text-lg font-semibold text-foreground",
							children: "Menú"
						}),
						/* @__PURE__ */ jsx("button", {
							type: "button",
							onClick: close,
							"aria-label": "Cerrar menú",
							className: "p-1",
							children: /* @__PURE__ */ jsx(X, { className: "size-6 text-foreground" })
						})
					]
				}),
				section === "root" ? /* @__PURE__ */ jsxs("div", {
					className: "grid grid-cols-2 divide-x divide-separator border-b border-separator",
					children: [/* @__PURE__ */ jsx("button", {
						type: "button",
						onClick: () => setSection("file"),
						className: "py-4 text-base font-semibold text-foreground active:bg-elevated",
						children: "Archivo"
					}), /* @__PURE__ */ jsx("button", {
						type: "button",
						onClick: () => setSection("help"),
						className: "py-4 text-base font-semibold text-foreground active:bg-elevated",
						children: "Ayuda"
					})]
				}) : /* @__PURE__ */ jsxs("button", {
					type: "button",
					onClick: () => setSection(section === "recent" ? "file" : "root"),
					className: "flex w-full items-center gap-2 px-4 py-4 text-base font-semibold text-foreground active:bg-elevated",
					children: [/* @__PURE__ */ jsx(ChevronLeft, { className: "size-5" }), "Atrás"]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "h-[calc(100%-7rem)] overflow-y-auto",
					children: [
						section === "file" && renderList(fileEntries),
						section === "help" && renderList(helpEntries),
						section === "recent" && renderList(recentEntries),
						section === "root" && /* @__PURE__ */ jsx("p", {
							className: "px-6 pt-40 text-center text-base text-muted-foreground",
							children: "Para empezar, abrir o crear un nuevo proyecto."
						})
					]
				})
			]
		})
	});
}
//#endregion
//#region src/components/ui/dialog.tsx
var Dialog = DialogPrimitive.Root;
var DialogPortal = DialogPrimitive.Portal;
var DialogOverlay = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(DialogPrimitive.Overlay, {
	ref,
	className: cn("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props
}));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;
var DialogContent = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(DialogPortal, { children: [/* @__PURE__ */ jsx(DialogOverlay, {}), /* @__PURE__ */ jsxs(DialogPrimitive.Content, {
	ref,
	className: cn("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg", className),
	...props,
	children: [children, /* @__PURE__ */ jsxs(DialogPrimitive.Close, {
		className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
		children: [/* @__PURE__ */ jsx(X, { className: "h-4 w-4" }), /* @__PURE__ */ jsx("span", {
			className: "sr-only",
			children: "Close"
		})]
	})]
})] }));
DialogContent.displayName = DialogPrimitive.Content.displayName;
var DialogHeader = ({ className, ...props }) => /* @__PURE__ */ jsx("div", {
	className: cn("flex flex-col space-y-1.5 text-center sm:text-left", className),
	...props
});
DialogHeader.displayName = "DialogHeader";
var DialogFooter = ({ className, ...props }) => /* @__PURE__ */ jsx("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
});
DialogFooter.displayName = "DialogFooter";
var DialogTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(DialogPrimitive.Title, {
	ref,
	className: cn("text-lg font-semibold leading-none tracking-tight", className),
	...props
}));
DialogTitle.displayName = DialogPrimitive.Title.displayName;
var DialogDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(DialogPrimitive.Description, {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
DialogDescription.displayName = DialogPrimitive.Description.displayName;
//#endregion
//#region src/components/home/CreateGameDialog.tsx
var ADJECTIVES = [
	"Balmy",
	"Cosmic",
	"Silent",
	"Brave",
	"Frozen",
	"Golden",
	"Wild",
	"Neon"
];
var NOUNS = [
	"Blade",
	"Rocket",
	"Forest",
	"Runner",
	"Comet",
	"Panda",
	"Circuit",
	"Echo"
];
function randomName() {
	return `${ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]} ${NOUNS[Math.floor(Math.random() * NOUNS.length)]}`;
}
var RESOLUTIONS = [
	{
		id: "portrait",
		label: "Retrato móvil",
		sub: "720x1280",
		w: 720,
		h: 1280
	},
	{
		id: "landscape",
		label: "Paisaje de escritorio y móvil",
		sub: "1280x720",
		w: 1280,
		h: 720
	},
	{
		id: "fullhd",
		label: "Escritorio Full HD",
		sub: "1920x1080",
		w: 1920,
		h: 1080
	},
	{
		id: "custom",
		label: "Personalizar tamaño",
		w: 800,
		h: 600
	}
];
var STORAGE_OPTIONS = [{
	id: "device",
	label: "En este dispositivo"
}, {
	id: "session",
	label: "Abrir sin añadir a Mis proyectos"
}];
function CreateGameDialog({ open, onOpenChange }) {
	const [step, setStep] = useState("pick");
	const [resolution, setResolution] = useState("landscape");
	const [customW, setCustomW] = useState("800");
	const [customH, setCustomH] = useState("600");
	const [projectName, setProjectName] = useState(randomName);
	const [storage, setStorage] = useState("device");
	const [storageOpen, setStorageOpen] = useState(false);
	const [pixelArt, setPixelArt] = useState(false);
	const [creationError, setCreationError] = useState("");
	const navigate = useNavigate();
	const storageLabel = STORAGE_OPTIONS.find((option) => option.id === storage)?.label ?? "";
	const openEditor = () => {
		const preset = RESOLUTIONS.find((entry) => entry.id === resolution) ?? RESOLUTIONS[1];
		const width = resolution === "custom" ? Number(customW) : preset.w;
		const height = resolution === "custom" ? Number(customH) : preset.h;
		const project = createEmptyProject({
			name: projectName,
			windowWidth: width,
			windowHeight: height,
			pixelArt
		});
		try {
			if (storage === "device") {
				const saved = saveLocalProject({
					name: project.name,
					project
				});
				setCurrentProject({
					id: saved.id,
					project
				});
			} else setCurrentProject({
				id: null,
				project
			});
		} catch (error) {
			setCreationError(error instanceof Error ? error.message : "No se pudo crear el proyecto.");
			return;
		}
		setCreationError("");
		onOpenChange(false);
		setStep("pick");
		setProjectName(randomName());
		navigate({ to: "/editor" });
	};
	const goConfig = () => {
		setCreationError("");
		setStep("config");
	};
	if (step === "config") return /* @__PURE__ */ jsx(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ jsxs(DialogContent, {
			className: "flex h-[92vh] max-w-2xl flex-col gap-0 border-separator bg-window p-0",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "flex items-start justify-between px-5 pb-3 pt-5",
					children: [/* @__PURE__ */ jsx(DialogTitle, {
						className: "text-2xl font-bold text-foreground",
						children: "Crear un nuevo juego"
					}), /* @__PURE__ */ jsx("button", {
						type: "button",
						"aria-label": "Cerrar",
						onClick: () => onOpenChange(false),
						className: "p-1 text-foreground",
						children: /* @__PURE__ */ jsx(X, { className: "size-6" })
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "min-h-0 flex-1 overflow-y-auto px-5 pb-4",
					children: [
						/* @__PURE__ */ jsxs("button", {
							type: "button",
							onClick: () => setStep("pick"),
							className: "flex items-center gap-2 py-2 text-base font-semibold text-foreground",
							children: [/* @__PURE__ */ jsx(ChevronLeft, { className: "size-5" }), " Atrás"]
						}),
						/* @__PURE__ */ jsx("div", {
							className: "mt-3 grid grid-cols-2 gap-3",
							children: RESOLUTIONS.map((r) => /* @__PURE__ */ jsxs("button", {
								type: "button",
								onClick: () => setResolution(r.id),
								className: cn("flex flex-col items-center gap-2 rounded-lg border p-4 text-center", resolution === r.id ? "border-[#C9B6FC] bg-elevated" : "border-separator bg-transparent"),
								children: [
									/* @__PURE__ */ jsx("span", {
										className: cn("block rounded border-2 border-muted-foreground", r.id === "portrait" && "h-12 w-8", r.id !== "portrait" && "h-8 w-14", r.id === "custom" && "border-dashed"),
										"aria-hidden": true
									}),
									/* @__PURE__ */ jsx("span", {
										className: "text-sm font-medium text-foreground",
										children: r.label
									}),
									r.id === "custom" ? /* @__PURE__ */ jsxs("span", {
										className: "flex items-center gap-2 text-xs text-muted-foreground",
										children: [
											"W",
											/* @__PURE__ */ jsx("input", {
												value: customW,
												onChange: (e) => setCustomW(e.target.value),
												inputMode: "numeric",
												className: "w-12 border-b border-separator bg-transparent text-center text-sm text-foreground outline-none"
											}),
											"H",
											/* @__PURE__ */ jsx("input", {
												value: customH,
												onChange: (e) => setCustomH(e.target.value),
												inputMode: "numeric",
												className: "w-12 border-b border-separator bg-transparent text-center text-sm text-foreground outline-none"
											})
										]
									}) : /* @__PURE__ */ jsx("span", {
										className: "text-xs text-muted-foreground",
										children: r.sub
									})
								]
							}, r.id))
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "mt-5 flex items-end gap-2 rounded-t-md border-b-2 border-foreground bg-elevated px-3 py-2",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "flex-1",
								children: [/* @__PURE__ */ jsx("span", {
									className: "block text-xs text-muted-foreground",
									children: "Nombre del proyecto"
								}), /* @__PURE__ */ jsx("input", {
									value: projectName,
									onChange: (e) => setProjectName(e.target.value),
									className: "w-full bg-transparent text-lg text-foreground outline-none"
								})]
							}), /* @__PURE__ */ jsx("button", {
								type: "button",
								"aria-label": "Generar nombre",
								onClick: () => setProjectName(randomName()),
								className: "p-1 text-foreground",
								children: /* @__PURE__ */ jsx(RefreshCw, { className: "size-5" })
							})]
						}),
						/* @__PURE__ */ jsxs("button", {
							type: "button",
							onClick: () => setStorageOpen(true),
							className: "mt-3 flex w-full items-end gap-2 rounded-t-md border-b-2 border-foreground bg-elevated px-3 py-2 text-left",
							children: [/* @__PURE__ */ jsxs("span", {
								className: "flex-1",
								children: [/* @__PURE__ */ jsx("span", {
									className: "block text-xs text-muted-foreground",
									children: "Dónde almacenar este proyecto"
								}), /* @__PURE__ */ jsx("span", {
									className: "block text-lg text-foreground",
									children: storageLabel
								})]
							}), /* @__PURE__ */ jsx(ChevronDown, { className: "size-5 text-foreground" })]
						}),
						/* @__PURE__ */ jsxs("label", {
							className: "mt-4 flex items-center gap-3 text-base text-foreground",
							children: [/* @__PURE__ */ jsx("input", {
								type: "checkbox",
								checked: pixelArt,
								onChange: (e) => setPixelArt(e.target.checked),
								className: "size-6 accent-primary"
							}), "Optimizar para Pixel Art"]
						}),
						creationError ? /* @__PURE__ */ jsx("p", {
							role: "alert",
							className: "mt-3 rounded border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive",
							children: creationError
						}) : null
					]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "flex justify-end gap-3 border-t border-separator px-5 py-3",
					children: [/* @__PURE__ */ jsx("button", {
						type: "button",
						onClick: () => onOpenChange(false),
						className: "rounded-md border border-separator px-5 py-2.5 text-sm font-semibold text-foreground active:bg-elevated",
						children: "Cancelar"
					}), /* @__PURE__ */ jsx("button", {
						type: "button",
						onClick: openEditor,
						className: "rounded-md bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground",
						children: "Crear nuevo juego"
					})]
				}),
				storageOpen && /* @__PURE__ */ jsx("div", {
					className: "absolute inset-0 z-10 flex items-center justify-center bg-black/50 p-6",
					onClick: () => setStorageOpen(false),
					children: /* @__PURE__ */ jsx("div", {
						className: "w-full max-w-md overflow-hidden rounded-2xl bg-[#F5F5F7]",
						onClick: (e) => e.stopPropagation(),
						children: STORAGE_OPTIONS.map((opt, i) => /* @__PURE__ */ jsxs("button", {
							type: "button",
							onClick: () => {
								setStorage(opt.id);
								setStorageOpen(false);
							},
							className: cn("flex w-full items-center gap-3 px-6 py-5 text-left text-xl text-[#1D1D26]", i > 0 && "border-t border-black/10"),
							children: [/* @__PURE__ */ jsx("span", {
								className: "flex-1",
								children: opt.label
							}), /* @__PURE__ */ jsx("span", {
								className: cn("flex size-6 items-center justify-center rounded-full border-2", storage === opt.id ? "border-[#0B62D6]" : "border-[#1D1D26]"),
								children: storage === opt.id && /* @__PURE__ */ jsx(Check, { className: "size-3.5 stroke-[3] text-[#0B62D6]" })
							})]
						}, opt.id))
					})
				})
			]
		})
	});
	return /* @__PURE__ */ jsx(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ jsxs(DialogContent, {
			className: "flex h-[92vh] max-w-2xl flex-col gap-0 border-separator bg-window p-0",
			children: [
				/* @__PURE__ */ jsx(DialogTitle, {
					className: "px-5 pb-3 pt-5 text-2xl font-bold text-foreground",
					children: "Crear un nuevo juego"
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "min-h-0 flex-1 overflow-y-auto px-5 pb-4",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "rounded-lg border border-[#C9B6FC]/60 bg-elevated p-4",
						children: [/* @__PURE__ */ jsx("p", {
							className: "text-sm font-semibold text-foreground",
							children: "Proyecto 2D desde cero"
						}), /* @__PURE__ */ jsx("p", {
							className: "mt-1 text-sm text-muted-foreground",
							children: "Elige la resolución y crea una escena vacía. La asistencia de IA se activa después, directamente sobre el lienzo con Ctrl/Cmd + K."
						})]
					}), /* @__PURE__ */ jsxs("button", {
						type: "button",
						onClick: goConfig,
						className: "mt-5 flex h-36 w-48 flex-col items-center justify-center gap-2 rounded-lg border border-separator text-foreground active:bg-elevated",
						children: [/* @__PURE__ */ jsx(Plus, { className: "size-7" }), /* @__PURE__ */ jsx("span", {
							className: "text-base",
							children: "Proyecto 2D vacío"
						})]
					})]
				}),
				/* @__PURE__ */ jsx("div", {
					className: "flex justify-end border-t border-separator px-5 py-3",
					children: /* @__PURE__ */ jsx("button", {
						type: "button",
						onClick: () => onOpenChange(false),
						className: "rounded-md border border-separator px-5 py-2.5 text-sm font-semibold text-foreground active:bg-elevated",
						children: "Cancelar"
					})
				})
			]
		})
	});
}
//#endregion
//#region src/components/home/ProfileDialog.tsx
var SOCIALS = [
	{
		icon: Github,
		text: "Star el repositorio y añade aquí tu nombre de usuario de GitHub para obtener 100 créditos gratuitos."
	},
	{
		icon: ExternalLink,
		text: "Síguenos e introduce tu nombre de usuario de X aquí para obtener 80 créditos gratuitos."
	},
	{
		icon: Youtube,
		text: "Suscríbete e introduce tu nombre de usuario de YouTube aquí para obtener 50 créditos gratuitos."
	}
];
var ACHIEVEMENTS = [
	{
		title: "Primer evento",
		text: "Has añadido tu primer evento, ¡estamos seguros de que no será el último!",
		date: "11/8/2026",
		unlocked: true
	},
	{
		title: "Primer comportamiento",
		text: "Usaste un comportamiento por primera vez, las cosas son mucho más simples con ellos, ¿no crees?",
		unlocked: false
	},
	{
		title: "Primera vista previa",
		text: "¡Previsualizar tu juego es el primer paso hacia un juego completo!",
		unlocked: false
	}
];
function Collapsible({ label, disabled }) {
	const [open, setOpen] = React.useState(false);
	return /* @__PURE__ */ jsxs("div", {
		className: "rounded-md border border-separator",
		children: [/* @__PURE__ */ jsxs("button", {
			type: "button",
			disabled,
			onClick: () => setOpen((o) => !o),
			className: "flex w-full items-center gap-3 px-4 py-4 text-left text-base text-foreground disabled:text-muted-foreground",
			children: [open ? /* @__PURE__ */ jsx(ChevronDown, { className: "size-4" }) : /* @__PURE__ */ jsx(ChevronRight, { className: "size-4" }), label]
		}), open && !disabled ? /* @__PURE__ */ jsx("p", {
			className: "px-11 pb-4 text-sm text-muted-foreground",
			children: "Nada por aquí todavía."
		}) : null]
	});
}
function ProfileDialog({ open, onOpenChange, onSignOut }) {
	return /* @__PURE__ */ jsx(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ jsxs(DialogContent, {
			className: "flex h-[92vh] max-w-lg flex-col gap-0 border-separator bg-window p-0",
			children: [
				/* @__PURE__ */ jsx(DialogTitle, {
					className: "px-5 pb-3 pt-5 text-2xl font-bold text-foreground",
					children: "Mi perfil"
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "min-h-0 flex-1 space-y-5 overflow-y-auto px-5 pb-5",
					children: [
						/* @__PURE__ */ jsx("div", {
							className: "size-16 rounded-full bg-gradient-to-br from-[#7046EC] to-[#FF8569]",
							"aria-hidden": true
						}),
						/* @__PURE__ */ jsx("h3", {
							className: "text-xl font-bold text-foreground",
							children: "creador"
						}),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
							className: "text-sm text-muted-foreground",
							children: "Email"
						}), /* @__PURE__ */ jsx("p", {
							className: "text-base text-foreground",
							children: "tu-cuenta@ejemplo.com"
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
							className: "text-sm text-muted-foreground",
							children: "Biografía"
						}), /* @__PURE__ */ jsx("p", {
							className: "text-base text-foreground",
							children: "No se ha definido la bio."
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
							className: "mb-3 text-sm text-muted-foreground",
							children: "Redes Sociales"
						}), /* @__PURE__ */ jsx("ul", {
							className: "space-y-4",
							children: SOCIALS.map(({ icon: Icon, text }) => /* @__PURE__ */ jsxs("li", {
								className: "flex gap-3",
								children: [/* @__PURE__ */ jsx(Icon, { className: "mt-0.5 size-6 shrink-0 text-foreground" }), /* @__PURE__ */ jsx("p", {
									className: "text-sm leading-relaxed text-foreground",
									children: text
								})]
							}, text))
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
							className: "text-sm text-muted-foreground",
							children: "Enlace de donación"
						}), /* @__PURE__ */ jsx("p", {
							className: "text-base text-foreground",
							children: "No hay enlace definido."
						})] }),
						/* @__PURE__ */ jsxs("section", {
							className: "space-y-3",
							children: [
								/* @__PURE__ */ jsx("h4", {
									className: "text-xl font-bold text-foreground",
									children: "Suscripciones"
								}),
								/* @__PURE__ */ jsxs("p", {
									className: "text-base text-muted-foreground",
									children: [
										"Publicar en Android, iOS, desbloquear más proyectos en la nube, tablas de clasificación, funciones de colaboración y más servicios en línea.",
										" ",
										/* @__PURE__ */ jsx("a", {
											href: "#",
											className: "text-link underline",
											children: "Aprende más"
										})
									]
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "flex items-center gap-4 rounded-xl border-2 border-[#45D9A1] bg-elevated p-4",
									children: [/* @__PURE__ */ jsx(Crown, { className: "size-8 shrink-0 text-[#FFBC57]" }), /* @__PURE__ */ jsxs("div", {
										className: "min-w-0 flex-1 space-y-3",
										children: [/* @__PURE__ */ jsx("p", {
											className: "text-base font-semibold text-foreground",
											children: "¡Desbloquea el acceso completo para crear sin límites!"
										}), /* @__PURE__ */ jsx("button", {
											type: "button",
											className: "w-full rounded-md bg-primary py-3 text-sm font-bold text-primary-foreground",
											children: "Seleccione una suscripción"
										})]
									})]
								})
							]
						}),
						/* @__PURE__ */ jsxs("section", {
							className: "space-y-3",
							children: [
								/* @__PURE__ */ jsx("h4", {
									className: "text-xl font-bold text-foreground",
									children: "Créditos"
								}),
								/* @__PURE__ */ jsxs("p", {
									className: "text-base text-muted-foreground",
									children: [
										"Consigue ventajas y beneficios en la nube cuando te acerques al lanzamiento de tu juego.",
										" ",
										/* @__PURE__ */ jsx("a", {
											href: "#",
											className: "text-link underline",
											children: "Más información"
										})
									]
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "space-y-3 rounded-xl bg-primary p-4",
									children: [/* @__PURE__ */ jsxs("p", {
										className: "flex items-center gap-3 text-base font-medium text-primary-foreground",
										children: [/* @__PURE__ */ jsx(Coins, { className: "size-6 text-[#FFBC57]" }), " Créditos disponibles: 0"]
									}), /* @__PURE__ */ jsx("button", {
										type: "button",
										className: "w-full rounded-md border border-primary-foreground/70 py-3 text-sm font-bold text-primary-foreground",
										children: "Obtener paquetes de créditos"
									})]
								})
							]
						}),
						/* @__PURE__ */ jsxs("section", {
							className: "space-y-3",
							children: [
								/* @__PURE__ */ jsx("h4", {
									className: "text-xl font-bold text-foreground",
									children: "Contribuciones"
								}),
								/* @__PURE__ */ jsx(Collapsible, { label: "Extensiones (0)" }),
								/* @__PURE__ */ jsx(Collapsible, { label: "Ejemplos (0)" }),
								/* @__PURE__ */ jsx(Collapsible, {
									label: "Recursos (¡próximamente!)",
									disabled: true
								}),
								/* @__PURE__ */ jsx("p", {
									className: "text-center text-sm text-muted-foreground",
									children: "¿Faltan algunas contribuciones? Si eres el autor, agrega tu nombre de usuario en los autores del ejemplo o la extensión, o pídeselo al autor original."
								})
							]
						}),
						/* @__PURE__ */ jsxs("section", {
							className: "space-y-3",
							children: [
								/* @__PURE__ */ jsx("h4", {
									className: "text-xl font-bold text-foreground",
									children: "Logros"
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "py-2 text-center",
									children: [/* @__PURE__ */ jsx(Trophy, { className: "mx-auto size-10 text-[#C9B6FC]" }), /* @__PURE__ */ jsx("p", {
										className: "mt-2 text-lg font-bold text-foreground",
										children: "1/22 logros"
									})]
								}),
								/* @__PURE__ */ jsx("ul", {
									className: "space-y-4",
									children: ACHIEVEMENTS.map((a) => /* @__PURE__ */ jsxs("li", {
										className: "flex gap-3",
										children: [/* @__PURE__ */ jsxs("div", {
											className: "min-w-0 flex-1",
											children: [/* @__PURE__ */ jsx("p", {
												className: a.unlocked ? "text-base font-bold text-foreground" : "text-base font-bold text-muted-foreground",
												children: a.title
											}), /* @__PURE__ */ jsx("p", {
												className: "text-sm text-muted-foreground",
												children: a.text
											})]
										}), a.unlocked ? /* @__PURE__ */ jsx("span", {
											className: "shrink-0 text-sm text-foreground",
											children: a.date
										}) : /* @__PURE__ */ jsx(Lock, { className: "size-4 shrink-0 text-muted-foreground" })]
									}, a.title))
								})
							]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "space-y-3 pt-2",
							children: [
								/* @__PURE__ */ jsx("button", {
									type: "button",
									className: "w-full rounded-md bg-primary py-3 text-sm font-bold text-primary-foreground",
									children: "Edición de Mi Perfil"
								}),
								/* @__PURE__ */ jsx("button", {
									type: "button",
									className: "w-full rounded-md border border-separator py-3 text-sm font-semibold text-foreground",
									children: "Cambiar mi dirección de correo electrónico"
								}),
								/* @__PURE__ */ jsxs("button", {
									type: "button",
									className: "flex w-full items-center justify-center gap-2 rounded-md border border-separator py-3 text-sm font-semibold text-foreground",
									children: [/* @__PURE__ */ jsx(ExternalLink, { className: "size-4" }), " Acceder al perfil público"]
								})
							]
						})
					]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-2 border-t border-separator px-4 py-3",
					children: [
						/* @__PURE__ */ jsx(HelpCircle, { className: "size-6 shrink-0 text-muted-foreground" }),
						/* @__PURE__ */ jsx("button", {
							type: "button",
							onClick: onSignOut,
							className: "rounded-md border border-separator px-3 py-2.5 text-sm font-semibold text-foreground",
							children: "Cerrar sesión"
						}),
						/* @__PURE__ */ jsxs("button", {
							type: "button",
							className: "flex items-center gap-2 rounded-md border border-separator px-3 py-2.5 text-sm font-semibold text-foreground",
							children: [/* @__PURE__ */ jsx(Tag, { className: "size-4" }), " Canjear"]
						}),
						/* @__PURE__ */ jsx("button", {
							type: "button",
							onClick: () => onOpenChange(false),
							className: "ml-auto rounded-md border border-separator px-4 py-2.5 text-sm font-semibold text-foreground",
							children: "Cerrar"
						})
					]
				})
			]
		})
	});
}
//#endregion
//#region src/components/home/LanguageDialog.tsx
var LANGUAGES = [
	"Español (Spanish)",
	"English",
	"Français (French)",
	"Português (Portuguese)",
	"Deutsch (German)",
	"Italiano (Italian)",
	"日本語 (Japanese)"
];
function LanguageDialog({ open, onOpenChange }) {
	const [lang, setLang] = React.useState(LANGUAGES[0]);
	return /* @__PURE__ */ jsx(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ jsxs(DialogContent, {
			className: "flex h-[92vh] max-w-lg flex-col gap-0 border-separator bg-window p-0",
			children: [
				/* @__PURE__ */ jsx(DialogTitle, {
					className: "px-5 pb-4 pt-5 text-2xl font-bold text-foreground",
					children: "Idioma"
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "min-h-0 flex-1 overflow-y-auto px-5",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-start gap-4",
						children: [/* @__PURE__ */ jsx("p", {
							className: "w-24 shrink-0 text-base text-foreground",
							children: "Elija el idioma de GDevelop"
						}), /* @__PURE__ */ jsx("select", {
							value: lang,
							onChange: (e) => setLang(e.target.value),
							"aria-label": "Elija el idioma",
							className: "min-w-0 flex-1 rounded-t-md border-b-2 border-foreground bg-elevated px-3 py-3 text-base text-foreground outline-none",
							children: LANGUAGES.map((l) => /* @__PURE__ */ jsx("option", {
								value: l,
								children: l
							}, l))
						})]
					}), /* @__PURE__ */ jsxs("p", {
						className: "mt-4 text-base text-muted-foreground",
						children: [
							"Puedes",
							" ",
							/* @__PURE__ */ jsx("a", {
								href: "https://crowdin.com/project/gdevelop",
								className: "text-link underline",
								children: "ayudar a traducir GDevelop a tu idioma"
							}),
							"."
						]
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-2 border-t border-separator px-4 py-3",
					children: [/* @__PURE__ */ jsx("button", {
						type: "button",
						className: "rounded-md border border-separator px-4 py-2.5 text-sm font-semibold text-foreground",
						children: "Reportar una traducción errónea"
					}), /* @__PURE__ */ jsx("button", {
						type: "button",
						onClick: () => onOpenChange(false),
						className: "ml-auto rounded-md border border-separator px-5 py-2.5 text-sm font-semibold text-foreground",
						children: "Cerrar"
					})]
				})
			]
		})
	});
}
//#endregion
//#region src/lib/home/data.ts
var COURSES = [
	{
		id: "c1",
		title: "Curso Esencial del Editor",
		description: "Aprende los conceptos básicos del desarrollo de juegos para crear, pulir y publicar tu primer juego casual.",
		level: "Principiante",
		credits: 1e3,
		progress: 0,
		total: 15,
		gradient: "from-[#4F28CD] to-[#7046EC]"
	},
	{
		id: "c2",
		title: "Crea un juego 2D de acción",
		description: "Crea un juego 2D con movimiento, vehículos y enemigos dinámicos.",
		level: "Intermedio",
		credits: 1e3,
		progress: 0,
		total: 12,
		gradient: "from-[#0F7B5F] to-[#45D9A1]"
	},
	{
		id: "c3",
		title: "De Cero a Creador",
		description: "Comienza tu viaje como creador de juegos, desde la idea hasta la publicación.",
		level: "Principiante",
		credits: 0,
		progress: 3,
		total: 10,
		gradient: "from-[#8A4B00] to-[#FFBC57]"
	}
];
var TEMPLATES = [
	{
		id: "t1",
		title: "Arena 2D Multiplayer",
		credits: 1e3,
		gradient: "from-[#232336] to-[#4F28CD]"
	},
	{
		id: "t2",
		title: "Action Platformer Pixel",
		credits: 800,
		gradient: "from-[#3B1D5E] to-[#FF8569]"
	},
	{
		id: "t3",
		title: "2D Laner Racer",
		credits: 750,
		gradient: "from-[#12303F] to-[#6BAFFF]"
	},
	{
		id: "t4",
		title: "Cards Ranks",
		credits: 750,
		gradient: "from-[#2B1436] to-[#C9B6FC]"
	},
	{
		id: "t5",
		title: "Top-down Shooter",
		credits: 700,
		gradient: "from-[#1C2B1C] to-[#45D9A1]"
	},
	{
		id: "t6",
		title: "Endless Runner",
		credits: 650,
		gradient: "from-[#3A2410] to-[#FFBC57]"
	}
];
var RECOMMENDED = [
	{
		id: "g1",
		title: "Rocket Racers",
		rating: 92,
		gradient: "from-[#100A20] to-[#4F28CD]"
	},
	{
		id: "g2",
		title: "Wave Defender",
		rating: 85,
		gradient: "from-[#0B1520] to-[#6BAFFF]"
	},
	{
		id: "g3",
		title: "Slime Quest",
		rating: 88,
		gradient: "from-[#0F2318] to-[#45D9A1]"
	}
];
var TOP_GAMES = [
	{
		id: "p1",
		title: "Missiles Game 2D",
		rating: 91,
		gradient: "from-[#301020] to-[#FF8569]"
	},
	{
		id: "p2",
		title: "Blue Ball 4 Adventure",
		rating: 90,
		gradient: "from-[#101C36] to-[#6BAFFF]"
	},
	{
		id: "p3",
		title: "Astro Miner",
		rating: 89,
		gradient: "from-[#26170B] to-[#FFBC57]"
	}
];
var IN_DEVELOPMENT = [
	{
		id: "d1",
		title: "Tortol Escape",
		rating: 0,
		gradient: "from-[#123047] to-[#6BAFFF]"
	},
	{
		id: "d2",
		title: "Rally X Revenge",
		rating: 0,
		gradient: "from-[#3A2A05] to-[#FFBC57]"
	},
	{
		id: "d3",
		title: "Neon Drift",
		rating: 0,
		gradient: "from-[#2A0B3A] to-[#C9B6FC]"
	}
];
var GENRES = [
	"Platformer",
	"Puzzle",
	"Adventure",
	"Action",
	"Minijuegos",
	"Racing"
];
var ASSET_PACKS = [
	{
		id: "a1",
		title: "Pixel Platformer Pack",
		author: "Studio Nova",
		credits: 0,
		kind: "Gratuito",
		view: "Vista lateral",
		objectType: "Sprite",
		gradient: "from-[#2A1B4D] to-[#7046EC]"
	},
	{
		id: "a2",
		title: "Top-down Dungeon Tiles",
		author: "Kenko",
		credits: 450,
		kind: "Premium",
		view: "Arriba-abajo",
		objectType: "Mapa de baldosas",
		gradient: "from-[#0F2A2A] to-[#45D9A1]"
	},
	{
		id: "a3",
		title: "UI Panel Kit",
		author: "Formo",
		credits: 300,
		kind: "Premium",
		view: "Arriba-abajo",
		objectType: "Panel de sprite",
		gradient: "from-[#2C2410] to-[#FFBC57]"
	},
	{
		id: "a4",
		title: "Iso City Blocks",
		author: "Hexa",
		credits: 600,
		kind: "Premium",
		view: "Isométrico",
		objectType: "Sprite en mosaico",
		gradient: "from-[#101E33] to-[#6BAFFF]"
	},
	{
		id: "a5",
		title: "Mis sprites del proyecto",
		author: "Tú",
		credits: 0,
		kind: "Propio",
		view: "Vista lateral",
		objectType: "Sprite",
		gradient: "from-[#2E1220] to-[#FF8569]"
	},
	{
		id: "a6",
		title: "Efectos de combate 2D",
		author: "Volu",
		credits: 800,
		kind: "Premium",
		view: "Isométrico",
		objectType: "Sprite",
		gradient: "from-[#1D1030] to-[#C9B6FC]"
	}
];
//#endregion
//#region src/components/home/ProjectsSection.tsx
function formatDate(iso) {
	try {
		return new Date(iso).toLocaleString("es", {
			dateStyle: "short",
			timeStyle: "short"
		});
	} catch {
		return iso;
	}
}
function ProjectsSection() {
	const navigate = useNavigate();
	const [local, setLocal] = useState([]);
	const [busy, setBusy] = useState(false);
	useEffect(() => {
		setLocal(listLocalProjects());
	}, []);
	const refresh = () => {
		setBusy(true);
		setLocal(listLocalProjects());
		window.setTimeout(() => setBusy(false), 180);
	};
	const openLocalProject = async (project) => {
		try {
			setCurrentProject({
				id: project.id,
				project: project.project
			});
			await navigate({ to: "/editor" });
		} catch (error) {
			window.alert?.(error instanceof Error ? error.message : "No se pudo abrir el proyecto.");
		}
	};
	return /* @__PURE__ */ jsxs("section", {
		className: "mt-7 rounded-lg border border-separator bg-toolbar p-4",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ jsx("h2", {
					className: "text-xl font-bold text-foreground",
					children: "Mis proyectos"
				}), /* @__PURE__ */ jsx("button", {
					type: "button",
					onClick: refresh,
					"aria-label": "Actualizar proyectos",
					className: "p-2 text-muted-foreground",
					children: busy ? /* @__PURE__ */ jsx(Loader2, { className: "size-5 animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "size-5" })
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "mt-3 rounded-md border border-separator bg-elevated p-3",
				children: /* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ jsx(HardDrive, { className: "size-5 text-[#45D9A1]" }), /* @__PURE__ */ jsx("p", {
						className: "flex-1 text-sm text-foreground",
						children: "Tus proyectos se guardan de forma segura en este dispositivo."
					})]
				})
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-4",
				children: [/* @__PURE__ */ jsxs("h3", {
					className: "flex items-center gap-2 text-sm font-bold text-muted-foreground",
					children: [/* @__PURE__ */ jsx(HardDrive, { className: "size-4" }), " En este dispositivo"]
				}), local.length === 0 ? /* @__PURE__ */ jsx("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Aún no guardaste juegos localmente."
				}) : /* @__PURE__ */ jsx("ul", {
					className: "mt-2 space-y-2",
					children: local.map((project) => /* @__PURE__ */ jsxs("li", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ jsxs("button", {
							type: "button",
							onClick: () => void openLocalProject(project),
							className: "flex-1 rounded-md border border-separator px-3 py-2 text-left",
							children: [/* @__PURE__ */ jsx("span", {
								className: "block text-sm font-semibold text-foreground",
								children: project.name
							}), /* @__PURE__ */ jsx("span", {
								className: "block text-xs text-muted-foreground",
								children: formatDate(project.updatedAt)
							})]
						}), /* @__PURE__ */ jsx("button", {
							type: "button",
							"aria-label": `Eliminar ${project.name} del dispositivo`,
							onClick: () => {
								try {
									deleteLocalProject(project.id);
									setLocal(listLocalProjects());
								} catch (error) {
									window.alert?.(error instanceof Error ? error.message : "No se pudo eliminar el proyecto.");
								}
							},
							className: "p-2 text-muted-foreground",
							children: /* @__PURE__ */ jsx(Trash2, { className: "size-4" })
						})]
					}, project.id))
				})]
			})
		]
	});
}
//#endregion
//#region src/components/home/CreateView.tsx
function CreateView({ onCreateGame }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "h-full overflow-y-auto p-4 pb-8",
		children: [
			/* @__PURE__ */ jsxs("section", {
				className: "rounded-lg border border-separator bg-toolbar p-4",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ jsx("h2", {
						className: "text-xl font-bold text-foreground",
						children: "Cartera"
					}), /* @__PURE__ */ jsxs("span", {
						className: "flex items-center gap-2 text-base font-semibold text-foreground",
						children: [/* @__PURE__ */ jsx(Coins, { className: "size-5 text-[#FFBC57]" }), " 0"]
					})]
				}), /* @__PURE__ */ jsxs("div", {
					className: "mt-4 flex items-center gap-3",
					children: [
						/* @__PURE__ */ jsx(Coins, { className: "size-9 shrink-0 text-[#FFBC57]" }),
						/* @__PURE__ */ jsx("p", {
							className: "flex-1 text-base text-foreground",
							children: "Comparte tu juego y gana créditos."
						}),
						/* @__PURE__ */ jsxs("button", {
							type: "button",
							className: "flex shrink-0 items-center gap-2 rounded-md border border-separator px-3 py-2 text-sm font-semibold text-foreground",
							children: [/* @__PURE__ */ jsx(Coins, { className: "size-4 text-[#FFBC57]" }), " Gana 80"]
						})
					]
				})]
			}),
			/* @__PURE__ */ jsx(ProjectsSection, {}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-7 flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ jsxs("h2", {
					className: "flex items-center gap-3 text-2xl font-bold text-foreground",
					children: ["Juegos", /* @__PURE__ */ jsx(RefreshCw, { className: "size-5 text-muted-foreground" })]
				}), /* @__PURE__ */ jsxs("button", {
					type: "button",
					onClick: onCreateGame,
					className: "flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-base font-semibold text-primary-foreground",
					children: [/* @__PURE__ */ jsx(Plus, { className: "size-5" }), " Crear"]
				})]
			}),
			/* @__PURE__ */ jsx("h3", {
				className: "mt-5 text-xl font-bold text-foreground",
				children: "Ideas para tu próximo juego 2D"
			}),
			/* @__PURE__ */ jsx("div", {
				className: "mt-3 grid grid-cols-2 gap-4",
				children: TEMPLATES.map((t) => /* @__PURE__ */ jsxs("button", {
					type: "button",
					onClick: onCreateGame,
					className: "text-left",
					children: [/* @__PURE__ */ jsx("span", {
						className: `block h-28 rounded-lg bg-gradient-to-br ${t.gradient}`,
						"aria-hidden": true
					}), /* @__PURE__ */ jsx("span", {
						className: "mt-2 block text-sm text-foreground",
						children: t.title
					})]
				}, t.id))
			})
		]
	});
}
//#endregion
//#region src/components/home/LearnView.tsx
function LearnView() {
	return /* @__PURE__ */ jsxs("div", {
		className: "h-full overflow-y-auto pb-6",
		children: [/* @__PURE__ */ jsxs("section", {
			className: "relative overflow-hidden bg-gradient-to-br from-[#2A1550] to-[#120B22] px-4 py-6",
			children: [
				/* @__PURE__ */ jsx("span", {
					className: "inline-block rounded-full bg-elevated px-3 py-1.5 text-sm text-foreground",
					children: "Comienza gratis"
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-4 flex items-start justify-between gap-4",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "text-3xl font-bold leading-tight text-foreground",
						children: "Cursos oficiales de desarrollo de juegos"
					}), /* @__PURE__ */ jsxs("button", {
						type: "button",
						className: "flex shrink-0 items-center gap-2 rounded-md border border-separator px-3 py-2 text-sm font-semibold text-foreground",
						children: ["Ver todo ", /* @__PURE__ */ jsx(ArrowRight, { className: "size-4" })]
					})]
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-3 text-base text-foreground/90",
					children: "Inicia en la industria en auge de los juegos casuales. Mejora tus habilidades y conviértete en un profesional."
				})
			]
		}), /* @__PURE__ */ jsx("div", {
			className: "grid gap-4 p-4 sm:grid-cols-2",
			children: COURSES.map((c) => /* @__PURE__ */ jsxs("article", {
				className: "overflow-hidden rounded-xl border border-separator bg-toolbar",
				children: [/* @__PURE__ */ jsx("div", {
					className: `flex h-40 items-center justify-center bg-gradient-to-br ${c.gradient}`,
					"aria-hidden": true,
					children: /* @__PURE__ */ jsx("span", {
						className: "text-2xl font-black tracking-widest text-foreground/90",
						children: c.title.split(" ")[0]?.toUpperCase()
					})
				}), /* @__PURE__ */ jsxs("div", {
					className: "space-y-3 p-4",
					children: [
						/* @__PURE__ */ jsxs("p", {
							className: "flex items-center gap-2 text-sm text-muted-foreground",
							children: [/* @__PURE__ */ jsx("span", { className: "size-2.5 rounded-full bg-[#6BAFFF]" }), " Desarrollo de Juegos"]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ jsx("div", {
								className: "h-1.5 flex-1 rounded-full bg-elevated",
								children: /* @__PURE__ */ jsx("div", {
									className: "h-full rounded-full bg-primary",
									style: { width: `${c.progress / c.total * 100}%` }
								})
							}), /* @__PURE__ */ jsxs("span", {
								className: "text-sm text-muted-foreground",
								children: [
									c.progress,
									"/",
									c.total
								]
							})]
						}),
						/* @__PURE__ */ jsx("h2", {
							className: "text-lg font-bold text-foreground",
							children: c.title
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-sm leading-relaxed text-muted-foreground",
							children: c.description
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-center justify-between pt-1",
							children: [/* @__PURE__ */ jsx("span", {
								className: "rounded-full border border-[#45D9A1] px-3 py-1.5 text-sm text-foreground",
								children: c.level
							}), /* @__PURE__ */ jsx("span", {
								className: "text-sm font-semibold text-foreground",
								children: c.credits === 0 ? "Gratis" : `${c.credits} créditos`
							})]
						})
					]
				})]
			}, c.id))
		})]
	});
}
//#endregion
//#region src/components/home/PlayView.tsx
function PlayView() {
	return /* @__PURE__ */ jsxs("div", {
		className: "h-full space-y-8 overflow-y-auto p-4 pb-8",
		children: [
			/* @__PURE__ */ jsxs("section", { children: [/* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ jsx("h2", {
					className: "text-2xl font-bold text-foreground",
					children: "Recomendados"
				}), /* @__PURE__ */ jsxs("button", {
					type: "button",
					className: "flex items-center gap-2 rounded-md border border-[#C9B6FC] px-3 py-2 text-sm font-semibold text-foreground",
					children: ["Ver todo ", /* @__PURE__ */ jsx(ArrowRight, { className: "size-4" })]
				})]
			}), /* @__PURE__ */ jsx("div", {
				className: "mt-3 flex gap-3 overflow-x-auto pb-2",
				children: RECOMMENDED.map((g) => /* @__PURE__ */ jsxs("button", {
					type: "button",
					className: "w-64 shrink-0 text-left",
					children: [/* @__PURE__ */ jsx("span", {
						className: `relative flex h-36 items-end rounded-lg bg-gradient-to-br p-3 ${g.gradient}`,
						children: /* @__PURE__ */ jsxs("span", {
							className: "flex items-center gap-2 text-base font-semibold text-foreground",
							children: [
								/* @__PURE__ */ jsx(ThumbsUp, { className: "size-5" }),
								" ",
								g.rating,
								"%"
							]
						})
					}), /* @__PURE__ */ jsx("span", {
						className: "mt-2 block text-sm text-foreground",
						children: g.title
					})]
				}, g.id))
			})] }),
			/* @__PURE__ */ jsxs("section", { children: [
				/* @__PURE__ */ jsx("h2", {
					className: "text-2xl font-bold text-foreground",
					children: "Juegos en desarrollo"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "text-base text-muted-foreground",
					children: "Envía comentarios, gana monedas"
				}),
				/* @__PURE__ */ jsx("div", {
					className: "mt-3 flex gap-3 overflow-x-auto pb-2",
					children: IN_DEVELOPMENT.map((g) => /* @__PURE__ */ jsx("button", {
						type: "button",
						className: "w-56 shrink-0 text-left",
						children: /* @__PURE__ */ jsxs("span", {
							className: `flex h-28 flex-col justify-between rounded-lg bg-gradient-to-br p-3 ${g.gradient}`,
							children: [/* @__PURE__ */ jsxs("span", {
								className: "flex items-center gap-2 text-sm font-semibold text-foreground",
								children: [/* @__PURE__ */ jsx(Coins, { className: "size-4 text-[#FFBC57]" }), " Gana créditos"]
							}), /* @__PURE__ */ jsx("span", {
								className: "text-base font-bold text-foreground",
								children: g.title
							})]
						})
					}, g.id))
				})
			] }),
			/* @__PURE__ */ jsxs("section", { children: [/* @__PURE__ */ jsx("h2", {
				className: "text-2xl font-bold text-foreground",
				children: "¿Buscas algo?"
			}), /* @__PURE__ */ jsx("div", {
				className: "mt-4 flex gap-5 overflow-x-auto pb-2",
				children: GENRES.map((g) => /* @__PURE__ */ jsxs("button", {
					type: "button",
					className: "w-20 shrink-0 text-center",
					children: [/* @__PURE__ */ jsx("span", {
						className: "mx-auto flex size-14 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground",
						children: g.slice(0, 1)
					}), /* @__PURE__ */ jsx("span", {
						className: "mt-2 block text-sm text-foreground",
						children: g
					})]
				}, g))
			})] }),
			/* @__PURE__ */ jsxs("section", { children: [/* @__PURE__ */ jsx("h2", {
				className: "text-2xl font-bold text-foreground",
				children: "Top 5 de esta semana"
			}), /* @__PURE__ */ jsx("div", {
				className: "mt-3 flex gap-3 overflow-x-auto pb-2",
				children: TOP_GAMES.map((g, i) => /* @__PURE__ */ jsxs("button", {
					type: "button",
					className: "w-56 shrink-0 text-left",
					children: [
						/* @__PURE__ */ jsx("span", {
							className: `relative flex h-32 items-start rounded-lg bg-gradient-to-br p-3 ${g.gradient}`,
							children: /* @__PURE__ */ jsx("span", {
								className: "text-4xl font-black text-foreground",
								children: i + 1
							})
						}),
						/* @__PURE__ */ jsx("span", {
							className: "mt-2 block text-sm text-foreground",
							children: g.title
						}),
						/* @__PURE__ */ jsxs("span", {
							className: "flex items-center gap-2 text-sm text-muted-foreground",
							children: [
								/* @__PURE__ */ jsx(ThumbsUp, { className: "size-4" }),
								" ",
								g.rating,
								"%"
							]
						})
					]
				}, g.id))
			})] }),
			/* @__PURE__ */ jsx("section", {
				className: "rounded-xl border border-[#45D9A1] p-4",
				children: /* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap items-center justify-between gap-3",
					children: [/* @__PURE__ */ jsx("h3", {
						className: "text-xl font-bold text-foreground",
						children: "Encuentra tu próximo juego favorito"
					}), /* @__PURE__ */ jsxs("button", {
						type: "button",
						className: "flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground",
						children: [/* @__PURE__ */ jsx(Shuffle, { className: "size-4" }), " Juego aleatorio"]
					})]
				})
			})
		]
	});
}
//#endregion
//#region src/components/ui/checkbox.tsx
var Checkbox = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(CheckboxPrimitive.Root, {
	ref,
	className: cn("grid place-content-center peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground", className),
	...props,
	children: /* @__PURE__ */ jsx(CheckboxPrimitive.Indicator, {
		className: cn("grid place-content-center text-current"),
		children: /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" })
	})
}));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;
//#endregion
//#region src/components/ui/slider.tsx
var Slider = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxs(SliderPrimitive.Root, {
	ref,
	className: cn("relative flex w-full touch-none select-none items-center", className),
	...props,
	children: [/* @__PURE__ */ jsx(SliderPrimitive.Track, {
		className: "relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20",
		children: /* @__PURE__ */ jsx(SliderPrimitive.Range, { className: "absolute h-full bg-primary" })
	}), /* @__PURE__ */ jsx(SliderPrimitive.Thumb, { className: "block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" })]
}));
Slider.displayName = SliderPrimitive.Root.displayName;
//#endregion
//#region src/components/home/StoreView.tsx
var GROUPS = [
	{
		key: "kind",
		title: "Tipo de paquete",
		options: [
			"Gratuito",
			"Premium",
			"Propio"
		]
	},
	{
		key: "view",
		title: "Área de visualización",
		options: [
			"Arriba-abajo",
			"Vista lateral",
			"Isométrico"
		]
	},
	{
		key: "objectType",
		title: "Tipo de objetos",
		options: [
			"Sprite",
			"Sprite en mosaico",
			"Panel de sprite",
			"Mapa de baldosas"
		]
	}
];
function StoreView() {
	const [query, setQuery] = useState("");
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [collapsed, setCollapsed] = useState({});
	const [selected, setSelected] = useState({
		kind: [],
		view: [],
		objectType: []
	});
	const [pixelSize, setPixelSize] = useState([1, 16]);
	const toggle = (key, option) => setSelected((s) => ({
		...s,
		[key]: s[key].includes(option) ? s[key].filter((o) => o !== option) : [...s[key], option]
	}));
	const matches = (p) => p.title.toLowerCase().includes(query.toLowerCase()) && (selected.kind.length === 0 || selected.kind.includes(p.kind)) && (selected.view.length === 0 || selected.view.includes(p.view)) && (selected.objectType.length === 0 || selected.objectType.includes(p.objectType));
	const packs = ASSET_PACKS.filter(matches);
	const activeCount = Object.values(selected).flat().length;
	return /* @__PURE__ */ jsxs("div", {
		className: "flex h-full flex-col",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-2 border-b border-separator px-3 py-3",
				children: [
					/* @__PURE__ */ jsx("button", {
						type: "button",
						"aria-label": "Atrás",
						className: "p-2 text-muted-foreground",
						children: /* @__PURE__ */ jsx(ChevronLeft, { className: "size-5" })
					}),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						"aria-label": "Inicio de la tienda",
						className: "p-2 text-foreground",
						children: /* @__PURE__ */ jsx(Home, { className: "size-5" })
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "relative flex-1",
						children: [/* @__PURE__ */ jsx(Search, { className: "pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ jsx("input", {
							value: query,
							onChange: (e) => setQuery(e.target.value),
							placeholder: "Buscar en la tienda",
							className: "h-11 w-full rounded-md bg-elevated pl-11 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
						})]
					}),
					/* @__PURE__ */ jsxs("button", {
						type: "button",
						onClick: () => setFiltersOpen(true),
						"aria-label": "Filtros de objetos",
						className: "relative p-2 text-foreground",
						children: [/* @__PURE__ */ jsx(SlidersHorizontal, { className: "size-5" }), activeCount > 0 && /* @__PURE__ */ jsx("span", {
							className: "absolute right-0 top-0 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground",
							children: activeCount
						})]
					})
				]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "min-h-0 flex-1 overflow-y-auto p-4",
				children: packs.length === 0 ? /* @__PURE__ */ jsx("p", {
					className: "py-16 text-center text-sm text-muted-foreground",
					children: "No hay paquetes con esos filtros."
				}) : /* @__PURE__ */ jsx("div", {
					className: "grid grid-cols-2 gap-4",
					children: packs.map((p) => /* @__PURE__ */ jsxs("article", {
						className: "overflow-hidden rounded-lg border border-separator",
						children: [/* @__PURE__ */ jsx("div", {
							className: `h-28 bg-gradient-to-br ${p.gradient}`,
							"aria-hidden": true
						}), /* @__PURE__ */ jsxs("div", {
							className: "space-y-1 p-3",
							children: [
								/* @__PURE__ */ jsx("h3", {
									className: "text-sm font-semibold text-foreground",
									children: p.title
								}),
								/* @__PURE__ */ jsx("p", {
									className: "text-xs text-muted-foreground",
									children: p.author
								}),
								/* @__PURE__ */ jsxs("p", {
									className: "flex items-center gap-1.5 text-sm font-semibold text-foreground",
									children: [/* @__PURE__ */ jsx(Coins, { className: "size-4 text-[#FFBC57]" }), p.credits === 0 ? "Gratis" : p.credits]
								})
							]
						})]
					}, p.id))
				})
			}),
			/* @__PURE__ */ jsx(Sheet, {
				open: filtersOpen,
				onOpenChange: setFiltersOpen,
				children: /* @__PURE__ */ jsxs(SheetContent, {
					side: "right",
					className: "w-[85vw] max-w-md border-separator bg-window p-0",
					children: [
						/* @__PURE__ */ jsx(SheetTitle, {
							className: "sr-only",
							children: "Filtros de objetos"
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-3 border-b border-separator px-4 py-4",
							children: [/* @__PURE__ */ jsx(SlidersHorizontal, { className: "size-5 text-foreground" }), /* @__PURE__ */ jsx("span", {
								className: "text-sm font-semibold uppercase tracking-wide text-foreground",
								children: "Filtros de objetos"
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "h-[calc(100%-3.75rem)] space-y-4 overflow-y-auto p-4",
							children: [GROUPS.map((g) => /* @__PURE__ */ jsxs("section", {
								className: "rounded-lg border border-separator bg-toolbar p-3",
								children: [/* @__PURE__ */ jsxs("button", {
									type: "button",
									onClick: () => setCollapsed((c) => ({
										...c,
										[g.key]: !c[g.key]
									})),
									className: "flex w-full items-center gap-2 py-1 text-left",
									children: [/* @__PURE__ */ jsx(ChevronDown, { className: cn("size-5 text-muted-foreground transition-transform", collapsed[g.key] && "-rotate-90") }), /* @__PURE__ */ jsx("span", {
										className: "text-base font-semibold text-foreground",
										children: g.title
									})]
								}), !collapsed[g.key] && /* @__PURE__ */ jsx("ul", {
									className: "mt-2 space-y-3 pl-2",
									children: g.options.map((o) => /* @__PURE__ */ jsxs("li", {
										className: "flex items-center gap-3",
										children: [/* @__PURE__ */ jsx(Checkbox, {
											id: `${g.key}-${o}`,
											checked: selected[g.key].includes(o),
											onCheckedChange: () => toggle(g.key, o),
											className: "size-5"
										}), /* @__PURE__ */ jsx("label", {
											htmlFor: `${g.key}-${o}`,
											className: "text-base text-foreground",
											children: o
										})]
									}, o))
								})]
							}, g.key)), /* @__PURE__ */ jsxs("section", {
								className: "rounded-lg border border-separator bg-toolbar p-3",
								children: [/* @__PURE__ */ jsx("p", {
									className: "py-1 pl-7 text-base font-semibold text-foreground",
									children: "Tamaño del píxel"
								}), /* @__PURE__ */ jsxs("div", {
									className: "px-4 py-6",
									children: [/* @__PURE__ */ jsx(Slider, {
										value: pixelSize,
										onValueChange: setPixelSize,
										min: 1,
										max: 16,
										step: 1
									}), /* @__PURE__ */ jsxs("p", {
										className: "mt-3 text-center text-sm text-muted-foreground",
										children: [
											pixelSize[0],
											" – ",
											pixelSize[1],
											" px"
										]
									})]
								})]
							})]
						})
					]
				})
			})
		]
	});
}
//#endregion
//#region src/components/home/AppShell.tsx
var TABS = [
	{
		id: "learn",
		label: "Aprende",
		icon: GraduationCap
	},
	{
		id: "create",
		label: "Crear",
		icon: Hammer
	},
	{
		id: "play",
		label: "Juega",
		icon: Gamepad2
	},
	{
		id: "store",
		label: "Tienda",
		icon: Store
	}
];
function AppShell() {
	const [tab, setTab] = useState("create");
	const [menuOpen, setMenuOpen] = useState(false);
	const [createOpen, setCreateOpen] = useState(false);
	const [profileOpen, setProfileOpen] = useState(false);
	const [langOpen, setLangOpen] = useState(false);
	const [email, setEmail] = useState(null);
	const navigate = useNavigate();
	useEffect(() => {
		supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null));
		const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setEmail(session?.user.email ?? null));
		return () => sub.subscription.unsubscribe();
	}, []);
	const signOut = async () => {
		await supabase.auth.signOut();
		setProfileOpen(false);
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "flex h-screen flex-col overflow-hidden bg-window",
		children: [
			/* @__PURE__ */ jsxs("header", {
				className: "shrink-0 border-b border-separator bg-window",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex h-14 items-center gap-2 px-3",
					children: [
						/* @__PURE__ */ jsx("button", {
							type: "button",
							onClick: () => setMenuOpen(true),
							"aria-label": "Abrir menú",
							className: "p-2 text-foreground",
							children: /* @__PURE__ */ jsx(Menu, { className: "size-6" })
						}),
						/* @__PURE__ */ jsx("button", {
							type: "button",
							onClick: () => setTab("create"),
							"aria-label": "Inicio de Nexus Engine",
							className: cn("rounded-t-lg border-x border-t px-2 py-1.5 text-foreground", tab === "create" ? "border-separator bg-elevated" : "border-transparent"),
							children: /* @__PURE__ */ jsx(NexusMark, { className: "size-7" })
						}),
						/* @__PURE__ */ jsx(NexusLogo, { className: "hidden min-w-0 text-base font-bold text-foreground sm:inline-flex" }),
						email ? /* @__PURE__ */ jsxs("button", {
							type: "button",
							onClick: () => setProfileOpen(true),
							className: "ml-auto flex items-center gap-2 text-base font-bold text-foreground",
							children: [/* @__PURE__ */ jsx("span", {
								className: "size-7 rounded-md bg-gradient-to-br from-[#7046EC] to-[#FF8569]",
								"aria-hidden": true
							}), "Mi perfil"]
						}) : /* @__PURE__ */ jsx("button", {
							type: "button",
							onClick: () => navigate({
								to: "/auth",
								search: { next: "/" }
							}),
							className: "ml-auto rounded-md bg-primary px-3 py-2 text-sm font-bold text-primary-foreground",
							children: "Iniciar sesión"
						})
					]
				}), /* @__PURE__ */ jsxs("div", {
					className: "flex h-12 items-center gap-3 border-t border-separator bg-toolbar px-3",
					children: [
						/* @__PURE__ */ jsx("button", {
							type: "button",
							onClick: () => setProfileOpen(true),
							"aria-label": "Cuenta",
							className: "size-7 rounded-md bg-gradient-to-br from-[#C9B6FC] to-[#7046EC]"
						}),
						/* @__PURE__ */ jsxs("button", {
							type: "button",
							className: "flex items-center gap-2 rounded-md bg-gradient-to-r from-[#45D9A1] to-[#FFBC57] px-4 py-2 text-sm font-bold text-[#1D1D26]",
							children: [/* @__PURE__ */ jsx(Crown, { className: "size-4" }), " Obtener prémium"]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "ml-auto flex items-center gap-1",
							children: [
								/* @__PURE__ */ jsx("button", {
									type: "button",
									"aria-label": "Notificaciones",
									className: "p-2 text-foreground",
									children: /* @__PURE__ */ jsx(Bell, { className: "size-5" })
								}),
								/* @__PURE__ */ jsx("button", {
									type: "button",
									"aria-label": "Idioma",
									onClick: () => setLangOpen(true),
									className: "p-2 text-foreground",
									children: /* @__PURE__ */ jsx(Languages, { className: "size-5" })
								}),
								/* @__PURE__ */ jsx(Link, {
									to: "/editor",
									className: "ml-1 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground",
									children: "Editor"
								})
							]
						})
					]
				})]
			}),
			/* @__PURE__ */ jsxs("main", {
				className: "min-h-0 flex-1",
				children: [
					tab === "learn" && /* @__PURE__ */ jsx(LearnView, {}),
					tab === "create" && /* @__PURE__ */ jsx(CreateView, { onCreateGame: () => setCreateOpen(true) }),
					tab === "play" && /* @__PURE__ */ jsx(PlayView, {}),
					tab === "store" && /* @__PURE__ */ jsx(StoreView, {})
				]
			}),
			/* @__PURE__ */ jsx("nav", {
				className: "grid shrink-0 grid-cols-4 border-t border-separator bg-toolbar",
				children: TABS.map(({ id, label, icon: Icon }) => {
					const active = tab === id;
					return /* @__PURE__ */ jsxs("button", {
						type: "button",
						onClick: () => setTab(id),
						className: cn("relative flex flex-col items-center gap-1 py-2.5", active ? "text-foreground" : "text-muted-foreground"),
						children: [
							active && /* @__PURE__ */ jsx("span", { className: "absolute inset-x-6 top-0 h-0.5 rounded-full bg-[#C9B6FC]" }),
							/* @__PURE__ */ jsx(Icon, { className: "size-6" }),
							/* @__PURE__ */ jsx("span", {
								className: "text-xs font-medium",
								children: label
							})
						]
					}, id);
				})
			}),
			/* @__PURE__ */ jsx(MainMenuDrawer, {
				open: menuOpen,
				onOpenChange: setMenuOpen,
				hasProject: false,
				onCreateGame: () => setCreateOpen(true),
				onPreferences: () => setProfileOpen(true)
			}),
			/* @__PURE__ */ jsx(CreateGameDialog, {
				open: createOpen,
				onOpenChange: setCreateOpen
			}),
			/* @__PURE__ */ jsx(LanguageDialog, {
				open: langOpen,
				onOpenChange: setLangOpen
			}),
			/* @__PURE__ */ jsx(ProfileDialog, {
				open: profileOpen,
				onOpenChange: setProfileOpen,
				onSignOut: signOut
			})
		]
	});
}
//#endregion
//#region src/routes/index.tsx?tsr-split=component
function Index() {
	return /* @__PURE__ */ jsx(AppShell, {});
}
//#endregion
export { Index as component };
