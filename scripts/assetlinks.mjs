import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Writes the Digital Asset Links file that lets Chrome verify the TWA and drop the
// URL bar. The fingerprint comes from CI (repository variable or the keystore).
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [, , fingerprintArg = "", outputArg = ""] = process.argv;

const packageName = process.env.ANDROID_PACKAGE_ID || "com.nexusengine.studio";
const fingerprints = (fingerprintArg || process.env.ANDROID_SHA256_CERT_FINGERPRINT || "")
  .split(/[\s,]+/)
  .map((value) => value.trim().toUpperCase())
  .filter((value) => /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(value));

const outputPath = path.resolve(
  root,
  outputArg || path.join("public", ".well-known", "assetlinks.json"),
);
const statements = [
  {
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: packageName,
      sha256_cert_fingerprints: fingerprints,
    },
  },
];

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(statements, null, 2)}\n`);
console.log(
  fingerprints.length
    ? `Wrote ${outputPath} for ${packageName} with ${fingerprints.length} fingerprint(s).`
    : `Wrote ${outputPath} for ${packageName} without fingerprints (set ANDROID_SHA256_CERT_FINGERPRINT).`,
);
