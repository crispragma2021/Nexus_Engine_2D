import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/home/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nexus Engine — Aprende, crea y publica juegos 2D" },
      {
        name: "description",
        content:
          "Inicio del estudio de juegos: cursos, creación de proyectos, catálogo de juegos y tienda de assets, con el editor de escenas y eventos incluido.",
      },
      { property: "og:title", content: "Nexus Engine — Aprende, crea y publica juegos 2D" },
      {
        property: "og:description",
        content:
          "Crea juegos sin programar: plantillas, tienda de recursos y editor visual de escenas y eventos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <AppShell />;
}
