import { createFileRoute } from "@tanstack/react-router";
import { EditorShell } from "@/components/editor/EditorShell";

export const Route = createFileRoute("/editor")({
  head: () => ({
    meta: [
      { title: "Editor — Escena y Eventos sin código" },
      {
        name: "description",
        content:
          "Editor de juegos con canvas de escena, panel de objetos, propiedades, capas y hoja de eventos sin código.",
      },
      { property: "og:title", content: "Editor — Escena y Eventos sin código" },
      {
        property: "og:description",
        content:
          "Scene editor con instancias arrastrables y events editor con condiciones y acciones, en tema oscuro.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EditorPage,
});

function EditorPage() {
  return <EditorShell />;
}
