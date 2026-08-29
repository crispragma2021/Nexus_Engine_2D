import { readFile, writeFile } from "node:fs/promises";

const [
  ,
  ,
  manifestPath = "android/twa-manifest.json",
  pwaUrl = "https://gdevelop-design-guru.vercel.app",
  versionName = "0.1.0",
] = process.argv;
const url = new URL(pwaUrl);
if (url.protocol !== "https:") throw new Error(`The TWA host must use HTTPS: ${pwaUrl}`);

const cleanVersion = versionName.replace(/^v/, "");
const versionParts = cleanVersion.split(".").map((part) => Number.parseInt(part, 10));
if (versionParts.some((part) => !Number.isInteger(part) || part < 0)) {
  throw new Error(`Invalid Android version name: ${versionName}`);
}
const [major = 0, minor = 0, patch = 0] = versionParts;
const appVersionCode = Math.max(1, major * 1_000_000 + minor * 1_000 + patch);
const origin = url.origin;
const basePath = url.pathname.replace(/\/+$/, "");
const publicUrl = (path) => `${origin}${basePath}${path}`;

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
manifest.host = url.host;
manifest.startUrl = `${basePath || ""}/`;
manifest.fullScopeUrl = publicUrl("/");
manifest.webManifestUrl = publicUrl("/manifest.webmanifest");
manifest.iconUrl = publicUrl("/icons/nexus-512.png");
manifest.maskableIconUrl = publicUrl("/icons/nexus-512-maskable.png");
manifest.monochromeIconUrl = publicUrl("/icons/nexus-512-monochrome.png");
manifest.appVersionName = cleanVersion;
manifest.appVersion = cleanVersion;
manifest.appVersionCode = appVersionCode;
manifest.packageId =
  process.env.ANDROID_PACKAGE_ID || manifest.packageId || "com.nexusengine.studio";
manifest.shortcuts = [
  {
    name: "Abrir el editor",
    shortName: "Editor",
    url: publicUrl("/editor"),
    chosenIconUrl: publicUrl("/icons/nexus-192.png"),
  },
];

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Configured ${manifestPath} for ${origin} (${cleanVersion}, code ${appVersionCode}).`);
