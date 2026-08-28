// Client-safe helpers for the Google Drive App User Connector popup flow.
import { completeDriveConnection, startDriveConnect } from "@/lib/drive.functions";

const CONNECTOR_ID = "google_drive";

function waitForOAuthCompletion(popup: Window): Promise<string | null> {
  return new Promise((resolve, reject) => {
    let poll: number | undefined;
    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      if (poll !== undefined) window.clearInterval(poll);
    };
    const onMessage = (event: MessageEvent) => {
      const type = (event.data as { type?: string } | null)?.type;
      if (
        event.origin !== window.location.origin ||
        event.source !== popup ||
        (event.data as { connectorId?: string } | null)?.connectorId !== CONNECTOR_ID ||
        (type !== "appUserConnectorOAuthComplete" && type !== "appUserConnectorOAuthFailed")
      ) {
        return;
      }
      cleanup();
      if (type === "appUserConnectorOAuthComplete") {
        const code = (event.data as { code?: unknown }).code;
        resolve(typeof code === "string" ? code : null);
        return;
      }
      popup.close();
      reject(new Error("No se pudo completar la conexión con Google Drive."));
    };
    window.addEventListener("message", onMessage);
    poll = window.setInterval(() => {
      if (!popup.closed) return;
      cleanup();
      reject(new Error("Cerraste la ventana antes de terminar la conexión."));
    }, 500);
  });
}

export async function connectGoogleDrive(): Promise<void> {
  const popup = window.open("", "lovable-oauth", "width=600,height=720");
  if (!popup) throw new Error("El navegador bloqueó la ventana emergente. Permítela e inténtalo de nuevo.");
  let code: string | null;
  try {
    const { authorizationUrl } = await startDriveConnect();
    const completion = waitForOAuthCompletion(popup);
    popup.location.href = authorizationUrl;
    code = await completion;
  } catch (error) {
    popup.close();
    throw error;
  }
  if (code) await completeDriveConnection({ data: { code } });
}
