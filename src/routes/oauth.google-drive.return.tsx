import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/oauth/google-drive/return")({
  head: () => ({
    meta: [
      { title: "Conectando Google Drive — Studio" },
      {
        name: "description",
        content: "Ventana de retorno que finaliza la conexión de tu cuenta de Google Drive.",
      },
      { property: "og:title", content: "Conectando Google Drive — Studio" },
      {
        property: "og:description",
        content: "Finalizando la autorización de Google Drive para guardar tus juegos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OAuthReturn,
});

function OAuthReturn() {
  const [message, setMessage] = useState("Finalizando la conexión…");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const notify = (
      type: "appUserConnectorOAuthComplete" | "appUserConnectorOAuthFailed",
      code?: string,
    ) => {
      window.opener?.postMessage(
        { type, connectorId: "google_drive", code: code ?? null },
        window.location.origin,
      );
      window.close();
    };

    if (params.get("success") !== "true") {
      setMessage(params.get("error") ?? "La autorización no se completó.");
      notify("appUserConnectorOAuthFailed");
      return;
    }
    const code = params.get("code");
    if (!code) {
      if (params.get("offline_access_allowed") === "false") {
        notify("appUserConnectorOAuthComplete");
        return;
      }
      setMessage("La autorización terminó sin código de intercambio.");
      notify("appUserConnectorOAuthFailed");
      return;
    }
    notify("appUserConnectorOAuthComplete", code);
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-window p-6">
      <p className="text-base text-foreground">{message}</p>
    </main>
  );
}
