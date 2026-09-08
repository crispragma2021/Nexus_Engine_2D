import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
//#region src/routes/auth.tsx
var $$splitComponentImporter = () => import("./auth-CjVae4AV.js");
var Route = createFileRoute("/auth")({
	ssr: false,
	head: () => ({ meta: [
		{ title: "Iniciar sesión · Nexus Engine" },
		{
			name: "description",
			content: "Inicia sesión para acceder a tus proyectos y a las herramientas del estudio."
		},
		{
			property: "og:title",
			content: "Iniciar sesión · Nexus Engine"
		},
		{
			property: "og:description",
			content: "Accede con correo o Google al estudio de creación de juegos."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary"
		}
	] }),
	validateSearch: (s) => ({ next: typeof s["next"] === "string" ? s["next"] : "" }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
