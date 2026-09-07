import { t as Route$3 } from "./auth-n7F3lr13.js";
import { useEffect } from "react";
import { HeadContent, Link, Outlet, Scripts, createFileRoute, createRootRouteWithContext, createRouter, lazyRouteComponent, useRouter } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Toaster } from "sonner";
//#region src/styles.css?url
var styles_default = "/assets/styles-CSc6GXPw.css";
//#endregion
//#region src/lib/pwa.ts
/** Register the PWA shell only in production. Keeping development unregistered avoids
* stale service-worker assets in local and sandbox previews. */
function registerPwa() {
	if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
	window.addEventListener("load", () => {
		navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error) => {
			console.warn("Nexus Engine: no se pudo registrar el service worker", error);
		});
	});
}
//#endregion
//#region src/components/ui/sonner.tsx
var Toaster$1 = ({ ...props }) => {
	return /* @__PURE__ */ jsx(Toaster, {
		className: "toaster group",
		toastOptions: { classNames: {
			toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
			description: "group-[.toast]:text-muted-foreground",
			actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
			cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
		} },
		...props
	});
};
//#endregion
//#region src/routes/__root.tsx
function NotFoundComponent() {
	return /* @__PURE__ */ jsx("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ jsxs("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ jsx("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "404"
				}),
				/* @__PURE__ */ jsx("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Page not found"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "The page you're looking for doesn't exist or has been moved."
				}),
				/* @__PURE__ */ jsx("div", {
					className: "mt-6",
					children: /* @__PURE__ */ jsx(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Go home"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	useEffect(() => {
		console.error("Nexus Engine: error en la interfaz", error);
	}, [error]);
	return /* @__PURE__ */ jsx("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ jsxs("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ jsx("h1", {
					className: "text-xl font-semibold tracking-tight text-foreground",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Something went wrong on our end. You can try refreshing or head back home."
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ jsx("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Try again"
					}), /* @__PURE__ */ jsx("a", {
						href: "/",
						className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$2 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1, viewport-fit=cover"
			},
			{ title: "Nexus Engine" },
			{
				name: "application-name",
				content: "Nexus Engine"
			},
			{
				name: "theme-color",
				content: "#7046EC"
			},
			{
				name: "mobile-web-app-capable",
				content: "yes"
			},
			{
				name: "apple-mobile-web-app-capable",
				content: "yes"
			},
			{
				name: "apple-mobile-web-app-status-bar-style",
				content: "black-translucent"
			},
			{
				name: "apple-mobile-web-app-title",
				content: "Nexus Engine"
			},
			{
				name: "description",
				content: "Nexus Engine: el motor de juegos 2D para crear, aprender y publicar juegos."
			},
			{
				name: "author",
				content: "Nexus Engine"
			},
			{
				property: "og:title",
				content: "Nexus Engine"
			},
			{
				property: "og:description",
				content: "Nexus Engine: el motor de juegos 2D para crear, aprender y publicar juegos."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			},
			{
				name: "twitter:site",
				content: "@NexusEngine"
			}
		],
		links: [
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "icon",
				href: "/icons/nexus-mark.svg",
				type: "image/svg+xml"
			},
			{
				rel: "alternate icon",
				href: "/favicon.ico",
				type: "image/x-icon"
			},
			{
				rel: "manifest",
				href: "/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/icons/nexus-192.png"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ jsxs("html", {
		lang: "es",
		children: [/* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }), /* @__PURE__ */ jsxs("body", { children: [
			children,
			/* @__PURE__ */ jsx(Scripts, {}),
			/* @__PURE__ */ jsx(SpeedInsights, {})
		] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$2.useRouteContext();
	useEffect(() => {
		registerPwa();
	}, []);
	return /* @__PURE__ */ jsxs(QueryClientProvider, {
		client: queryClient,
		children: [/* @__PURE__ */ jsx(Outlet, {}), /* @__PURE__ */ jsx(Toaster$1, {
			position: "bottom-center",
			theme: "dark",
			duration: 2200,
			toastOptions: { className: "text-xs py-2 px-3.5 max-w-[85vw] mx-auto shadow-lg bg-[#20202A] text-white border border-[#32323E] rounded-lg" }
		})]
	});
}
//#endregion
//#region src/routes/index.tsx
var $$splitComponentImporter$1 = () => import("./routes-BbDd0-Ea.js");
var Route$1 = createFileRoute("/")({
	head: () => ({ meta: [
		{ title: "Nexus Engine — Motor de juegos 2D" },
		{
			name: "description",
			content: "Nexus Engine es un motor de juegos 2D con editor visual de escenas, eventos y runtime propio."
		},
		{
			property: "og:title",
			content: "Nexus Engine — Motor de juegos 2D"
		},
		{
			property: "og:description",
			content: "Crea juegos 2D con escenas, eventos visuales y un runtime especializado."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
//#endregion
//#region src/routes/editor.tsx
var $$splitComponentImporter = () => import("./editor-B1_zsBD7.js");
var Route = createFileRoute("/editor")({
	head: () => ({ meta: [
		{ title: "Editor — Escena y Eventos sin código" },
		{
			name: "description",
			content: "Editor de juegos con canvas de escena, panel de objetos, propiedades, capas y hoja de eventos sin código."
		},
		{
			property: "og:title",
			content: "Editor — Escena y Eventos sin código"
		},
		{
			property: "og:description",
			content: "Scene editor con instancias arrastrables y events editor con condiciones y acciones, en tema oscuro."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
//#region src/routeTree.gen.ts
var rootRouteChildren = {
	IndexRoute: Route$1.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$2
	}),
	AuthRoute: Route$3.update({
		id: "/auth",
		path: "/auth",
		getParentRoute: () => Route$2
	}),
	EditorRoute: Route.update({
		id: "/editor",
		path: "/editor",
		getParentRoute: () => Route$2
	})
};
var routeTree = Route$2._addFileChildren(rootRouteChildren)._addFileTypes();
//#endregion
//#region src/router.tsx
var getRouter = () => {
	const queryClient = new QueryClient();
	return createRouter({
		routeTree,
		context: { queryClient },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
