import { mkdir, readFile, writeFile } from "node:fs/promises";
import { deflateSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(root, "public", "icons");
const sizes = [192, 512];
// "any" keeps the rounded-square badge, "maskable" is full-bleed with a safe zone
// and "monochrome" is a transparent white glyph for themed Android launchers.
const variants = [
  { suffix: "", variant: "any", sizes },
  { suffix: "-maskable", variant: "maskable", sizes },
  { suffix: "-monochrome", variant: "monochrome", sizes },
];
const sourcePath = path.join(outputDir, "nexus-mark.svg");

// The icon is intentionally rendered here instead of checked in from a GUI export:
// every release gets the same pixels and the script has no native/image dependency.
function renderIcon(size, variant = "any") {
  const pixels = Buffer.alloc(size * size * 4);
  const scale = size / 512;
  const maskable = variant === "maskable";
  const monochrome = variant === "monochrome";
  // Maskable icons must survive an aggressive circular crop: bleed the plate to the
  // edges and keep the artwork inside the 80% safe zone recommended by Android.
  const radius = maskable ? 0 : 112 * scale;
  const innerRadius = maskable ? 0 : 92 * scale;
  const contentScale = maskable ? 0.8 : 1;

  const setPixel = (x, y, r, g, b, a = 255) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const offset = (y * size + x) * 4;
    pixels[offset] = r;
    pixels[offset + 1] = g;
    pixels[offset + 2] = b;
    pixels[offset + 3] = a;
  };

  const inRoundedRect = (x, y, left, top, right, bottom, cornerRadius) => {
    const nearestX = Math.max(left + cornerRadius, Math.min(x, right - cornerRadius));
    const nearestY = Math.max(top + cornerRadius, Math.min(y, bottom - cornerRadius));
    return (x - nearestX) ** 2 + (y - nearestY) ** 2 <= cornerRadius ** 2;
  };

  // Supersample a little so the small launcher icon keeps smooth corners.
  const samples = size <= 192 ? 3 : 2;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let red = 0;
      let green = 0;
      let blue = 0;
      let alpha = 0;
      for (let sy = 0; sy < samples; sy += 1) {
        for (let sx = 0; sx < samples; sx += 1) {
          const px = x + (sx + 0.5) / samples;
          const py = y + (sy + 0.5) / samples;
          let color = null;
          if (!monochrome && inRoundedRect(px, py, 0, 0, size, size, radius)) {
            color = [29, 29, 38];
            const plateInset = maskable ? 0 : 32 * scale;
            if (
              inRoundedRect(
                px,
                py,
                plateInset,
                plateInset,
                size - plateInset,
                size - plateInset,
                innerRadius,
              )
            ) {
              const t = Math.max(0, Math.min(1, (px / scale + py / scale - 78) / 900));
              color = [141 * (1 - t) + 79 * t, 105 * (1 - t) + 40 * t, 243 * (1 - t) + 205 * t];
            }
          }

          // White Nexus path: M151,365 V147 L361,365 V147, with round caps.
          const sx1 = (px / scale - 256) / contentScale + 256;
          const sy1 = (py / scale - 256) / contentScale + 256;
          const distanceToSegment = (ax, ay, bx, by) => {
            const dx = bx - ax;
            const dy = by - ay;
            const lengthSquared = dx * dx + dy * dy;
            const t =
              lengthSquared === 0
                ? 0
                : Math.max(0, Math.min(1, ((sx1 - ax) * dx + (sy1 - ay) * dy) / lengthSquared));
            return Math.hypot(sx1 - (ax + t * dx), sy1 - (ay + t * dy));
          };
          const strokeRadius = 24;
          const onPath =
            distanceToSegment(151, 365, 151, 147) <= strokeRadius ||
            distanceToSegment(151, 147, 361, 365) <= strokeRadius ||
            distanceToSegment(361, 365, 361, 147) <= strokeRadius;
          const onNode =
            Math.hypot(sx1 - 151, sy1 - 147) <= 24 || Math.hypot(sx1 - 361, sy1 - 147) <= 24;
          if (onPath || onNode) color = [255, 255, 255];

          if (color) {
            red += color[0];
            green += color[1];
            blue += color[2];
            alpha += 255;
          }
        }
      }
      const sampleCount = samples * samples;
      // Average the colour over the *covered* samples only, otherwise partially
      // covered edge pixels darken towards black instead of just fading out.
      const covered = alpha / 255;
      if (covered === 0) {
        setPixel(x, y, 0, 0, 0, 0);
        continue;
      }
      setPixel(
        x,
        y,
        Math.round(red / covered),
        Math.round(green / covered),
        Math.round(blue / covered),
        Math.round(alpha / sampleCount),
      );
    }
  }
  return pixels;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const payload = Buffer.concat([typeBuffer, data]);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(payload));
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  return Buffer.concat([length, payload, checksum]);
}

function encodePng(size, pixels) {
  const scanlines = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y += 1) {
    const rowStart = y * (size * 4 + 1);
    scanlines[rowStart] = 0; // PNG filter: None
    pixels.copy(scanlines, rowStart + 1, y * size * 4, (y + 1) * size * 4);
  }
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    header,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(scanlines, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

await mkdir(outputDir, { recursive: true });
await readFile(sourcePath); // Fail loudly if the source logo is accidentally removed.
const written = [];
for (const { suffix, variant, sizes: variantSizes } of variants) {
  for (const size of variantSizes) {
    const file = `nexus-${size}${suffix}.png`;
    await writeFile(path.join(outputDir, file), encodePng(size, renderIcon(size, variant)));
    written.push(`public/icons/${file}`);
  }
}
console.log(`Generated ${written.join(", ")} from ${sourcePath}.`);
