/** Register the PWA shell only in production. Keeping development unregistered avoids
 * stale service-worker assets in local and sandbox previews. */
export function registerPwa() {
  if (typeof window === "undefined" || !import.meta.env.PROD || !("serviceWorker" in navigator))
    return;

  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error: unknown) => {
      // PWA support is an enhancement; an unavailable service worker must not
      // prevent the editor from loading.
      console.warn("Nexus Engine: no se pudo registrar el service worker", error);
    });
  });
}
