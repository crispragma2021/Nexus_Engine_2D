import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/home/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nexus Engine — Motor de juegos 2D" },
      {
        name: "description",
        content:
          "Nexus Engine es un motor de juegos 2D con editor visual de escenas, eventos y runtime propio.",
      },
      { property: "og:title", content: "Nexus Engine — Motor de juegos 2D" },
      {
        property: "og:description",
        content: "Crea juegos 2D con escenas, eventos visuales y un runtime especializado.",
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
