import { createFileRoute } from "@tanstack/react-router";
import { EditorShell } from "@/components/editor/EditorShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Game Editor — Scene & Events (GDevelop-style UI)" },
      {
        name: "description",
        content:
          "Editor de juegos con canvas de escena, panel de objetos, propiedades, capas y hoja de eventos sin código, con la UI/UX del editor de GDevelop 5.",
      },
      { property: "og:title", content: "Game Editor — Scene & Events" },
      {
        property: "og:description",
        content:
          "Scene editor con instancias arrastrables y events editor con condiciones y acciones, en tema oscuro estilo GDevelop 5.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <EditorShell />;
}
