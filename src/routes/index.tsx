import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/home/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nexus Engine — 2D/3D Game Engine" },
      {
        name: "description",
        content:
          "Nexus Engine es un 2D/3D Game Engine con editor visual de escenas, eventos y runtime propio.",
      },
      { property: "og:title", content: "Nexus Engine — 2D/3D Game Engine" },
      {
        property: "og:description",
        content:
          "Crea juegos 2D y 3D con escenas, eventos visuales y un runtime preparado para crecer.",
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
