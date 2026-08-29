// Optional image-generation pipeline for the hybrid editor.
// Credentials are supplied per request and are never persisted in a project.
// The result is a normal PNG data URL + regular editable frame collision shape.

import type { GDFrameHitBox, GDResourceGenerationMetadata } from "../editor/types.ts";

export interface HuggingFaceImageProvider {
  provider: "huggingface";
  token: string;
  model?: string;
  /** Primarily for a self-hosted HF-compatible inference endpoint. */
  endpoint?: string;
}

export interface CloudflareImageProvider {
  provider: "cloudflare";
  token: string;
  model?: string;
  accountId?: string;
  /** A Cloudflare Worker URL can be used instead of accountId. */
  endpoint?: string;
}

export type ImageGenerationProvider = HuggingFaceImageProvider | CloudflareImageProvider;

export interface ImageGenerationOptions {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  seed?: number;
  removeBackground?: boolean;
  /** Maximum fetch duration. Defaults to 45 seconds. */
  timeoutMs?: number;
}

export interface GeneratedImageAsset {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  hitBox: GDFrameHitBox;
  metadata: GDResourceGenerationMetadata;
}

export interface BackgroundRemovalOptions {
  /** Euclidean RGB distance accepted as background, from 0 to 441. */
  colorTolerance?: number;
  /** Pixels below this alpha are always transparent. */
  alphaThreshold?: number;
  /** Softens the matte just outside the tolerance. */
  feather?: number;
}

export interface CollisionDetectionOptions {
  alphaThreshold?: number;
  padding?: number;
}

const DEFAULT_HF_MODEL = "stabilityai/stable-diffusion-3-medium-diffusers";
const DEFAULT_CF_MODEL = "@cf/black-forest-labs/flux-1-schnell";
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

export async function generateImageAsset(
  provider: ImageGenerationProvider,
  options: ImageGenerationOptions,
): Promise<GeneratedImageAsset> {
  const prompt = validatePrompt(options.prompt);
  const width = boundedInteger(options.width ?? 512, 64, 2048, "ancho");
  const height = boundedInteger(options.height ?? 512, 64, 2048, "alto");
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(
    () => controller.abort(),
    boundedInteger(options.timeoutMs ?? 45_000, 1_000, 180_000, "tiempo de espera"),
  );

  let blob: Blob;
  try {
    blob =
      provider.provider === "huggingface"
        ? await requestHuggingFace(provider, options, prompt, width, height, controller.signal)
        : await requestCloudflare(provider, options, prompt, width, height, controller.signal);
  } catch (error) {
    if (controller.signal.aborted)
      throw new Error("La generación de imagen excedió el tiempo límite.");
    throw error;
  } finally {
    globalThis.clearTimeout(timeout);
  }

  validateImageBlob(blob);
  let backgroundRemoved = false;
  if (options.removeBackground !== false) {
    blob = await removeTransparentBackground(blob);
    backgroundRemoved = true;
  }

  const imageData = await readImageData(blob);
  const hitBox = detectCollisionBox(imageData);
  return {
    blob,
    dataUrl: await blobToDataUrl(blob),
    width: imageData.width,
    height: imageData.height,
    hitBox,
    metadata: {
      provider: provider.provider,
      prompt,
      model:
        provider.model ??
        (provider.provider === "huggingface" ? DEFAULT_HF_MODEL : DEFAULT_CF_MODEL),
      generatedAt: new Date().toISOString(),
      backgroundRemoved,
    },
  };
}

/**
 * Removes only border-connected pixels similar to the average corner color.
 * This avoids deleting same-colored details enclosed inside the sprite and works
 * locally, so generated art does not need to be uploaded to a second service.
 */
export async function removeTransparentBackground(
  input: Blob | string,
  options: BackgroundRemovalOptions = {},
): Promise<Blob> {
  const imageData = await readImageData(input);
  const { data, width, height } = imageData;
  const tolerance = clamp(options.colorTolerance ?? 48, 0, 441);
  const feather = clamp(options.feather ?? 18, 0, 128);
  const alphaThreshold = clamp(Math.round(options.alphaThreshold ?? 8), 0, 255);
  const background = averageCornerColor(imageData);
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;

  const enqueue = (index: number) => {
    if (index < 0 || index >= visited.length || visited[index]) return;
    visited[index] = 1;
    queue[tail++] = index;
  };
  for (let x = 0; x < width; x += 1) {
    enqueue(x);
    enqueue((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(y * width);
    enqueue(y * width + width - 1);
  }

  while (head < tail) {
    const index = queue[head++]!;
    const offset = index * 4;
    const alpha = data[offset + 3] ?? 0;
    const distance = colorDistance(
      data[offset] ?? 0,
      data[offset + 1] ?? 0,
      data[offset + 2] ?? 0,
      background,
    );
    if (alpha > alphaThreshold && distance > tolerance + feather) continue;

    if (distance <= tolerance || alpha <= alphaThreshold) {
      data[offset + 3] = 0;
    } else if (feather > 0) {
      data[offset + 3] = Math.round(alpha * ((distance - tolerance) / feather));
    }

    const x = index % width;
    const y = Math.floor(index / width);
    if (x > 0) enqueue(index - 1);
    if (x + 1 < width) enqueue(index + 1);
    if (y > 0) enqueue(index - width);
    if (y + 1 < height) enqueue(index + width);
  }

  return imageDataToPng(imageData);
}

/** Detects the minimal alpha bounds. The returned rectangle and vertices are editable. */
export function detectCollisionBox(
  imageData: ImageData,
  options: CollisionDetectionOptions = {},
): GDFrameHitBox {
  const threshold = clamp(Math.round(options.alphaThreshold ?? 16), 0, 255);
  const padding = Math.max(0, Math.round(options.padding ?? 1));
  let minX = imageData.width;
  let minY = imageData.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < imageData.height; y += 1) {
    for (let x = 0; x < imageData.width; x += 1) {
      if ((imageData.data[(y * imageData.width + x) * 4 + 3] ?? 0) <= threshold) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < minX || maxY < minY) {
    minX = 0;
    minY = 0;
    maxX = Math.max(0, imageData.width - 1);
    maxY = Math.max(0, imageData.height - 1);
  }
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(imageData.width - 1, maxX + padding);
  maxY = Math.min(imageData.height - 1, maxY + padding);
  const width = Math.max(1, maxX - minX + 1);
  const height = Math.max(1, maxY - minY + 1);

  return {
    kind: "rectangle",
    x: minX,
    y: minY,
    width,
    height,
    referenceWidth: imageData.width,
    referenceHeight: imageData.height,
    vertices: rectangleVertices(minX, minY, width, height),
    source: "detected",
  };
}

/** Sanitizes manual mask edits and synchronizes rectangle vertices. */
export function adjustCollisionBox(
  current: GDFrameHitBox,
  patch: Partial<GDFrameHitBox>,
): GDFrameHitBox {
  const kind = patch.kind ?? current.kind;
  const x = finite(patch.x ?? current.x, 0);
  const y = finite(patch.y ?? current.y, 0);
  const width = Math.max(1, finite(patch.width ?? current.width, 1));
  const height = Math.max(1, finite(patch.height ?? current.height, 1));
  const referenceWidth = patch.referenceWidth ?? current.referenceWidth;
  const referenceHeight = patch.referenceHeight ?? current.referenceHeight;
  const reference = {
    ...(referenceWidth !== undefined ? { referenceWidth } : {}),
    ...(referenceHeight !== undefined ? { referenceHeight } : {}),
  };
  const source = "manual" as const;
  if (kind === "rectangle") {
    return {
      kind,
      x,
      y,
      width,
      height,
      ...reference,
      vertices: rectangleVertices(x, y, width, height),
      source,
    };
  }
  const vertices = (patch.vertices ?? current.vertices)
    .slice(0, 64)
    .map((point) => ({ x: finite(point.x, x), y: finite(point.y, y) }));
  return {
    kind,
    x,
    y,
    width,
    height,
    ...reference,
    vertices: vertices.length >= 3 ? vertices : rectangleVertices(x, y, width, height),
    source,
  };
}

async function requestHuggingFace(
  provider: HuggingFaceImageProvider,
  options: ImageGenerationOptions,
  prompt: string,
  width: number,
  height: number,
  signal: AbortSignal,
): Promise<Blob> {
  const model = provider.model?.trim() || DEFAULT_HF_MODEL;
  const endpoint =
    provider.endpoint?.trim() ||
    `https://router.huggingface.co/hf-inference/models/${model
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/")}`;
  assertHttpsEndpoint(endpoint);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: bearer(provider.token),
      "Content-Type": "application/json",
      Accept: "image/*, application/json",
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        width,
        height,
        ...(options.negativePrompt
          ? { negative_prompt: options.negativePrompt.slice(0, 600) }
          : {}),
        ...(Number.isFinite(options.seed) ? { seed: Math.trunc(options.seed!) } : {}),
      },
      options: { wait_for_model: true, use_cache: false },
    }),
    signal,
  });
  return imageResponse(response, "Hugging Face", signal);
}

async function requestCloudflare(
  provider: CloudflareImageProvider,
  options: ImageGenerationOptions,
  prompt: string,
  width: number,
  height: number,
  signal: AbortSignal,
): Promise<Blob> {
  const model = provider.model?.trim() || DEFAULT_CF_MODEL;
  const endpoint =
    provider.endpoint?.trim() ||
    (provider.accountId
      ? `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(provider.accountId)}/ai/run/${model}`
      : "");
  if (!endpoint) throw new Error("Configura accountId o la URL de tu Cloudflare Worker.");
  assertHttpsEndpoint(endpoint);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: bearer(provider.token),
      "Content-Type": "application/json",
      Accept: "image/*, application/json",
    },
    body: JSON.stringify({
      prompt,
      width,
      height,
      ...(options.negativePrompt ? { negative_prompt: options.negativePrompt.slice(0, 600) } : {}),
      ...(Number.isFinite(options.seed) ? { seed: Math.trunc(options.seed!) } : {}),
    }),
    signal,
  });
  return imageResponse(response, "Cloudflare Workers AI", signal);
}

async function imageResponse(
  response: Response,
  provider: string,
  signal: AbortSignal,
): Promise<Blob> {
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300).replace(/\s+/g, " ");
    throw new Error(
      `${provider} rechazó la generación (${response.status})${detail ? `: ${detail}` : "."}`,
    );
  }
  const type = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (type.startsWith("image/")) return response.blob();

  const payload = (await response.json()) as Record<string, unknown>;
  const result = isRecord(payload["result"]) ? payload["result"] : payload;
  const firstData =
    Array.isArray(payload["data"]) && isRecord(payload["data"][0]) ? payload["data"][0] : undefined;
  const encoded =
    stringValue(payload["result"]) ??
    stringValue(result["image"]) ??
    stringValue(result["b64_json"]) ??
    stringValue(firstData?.["b64_json"]) ??
    (Array.isArray(result["images"]) ? stringValue(result["images"][0]) : undefined);
  if (encoded) return dataUrlOrBase64ToBlob(encoded, "image/png");

  const outputUrl = Array.isArray(payload["output"])
    ? stringValue(payload["output"][0])
    : undefined;
  if (outputUrl) {
    assertHttpsEndpoint(outputUrl);
    const output = await fetch(outputUrl, { signal });
    if (output.ok) return output.blob();
  }
  throw new Error(`${provider} no devolvió una imagen reconocible.`);
}

async function readImageData(input: Blob | string): Promise<ImageData> {
  requireCanvas();
  const url = typeof input === "string" ? input : URL.createObjectURL(input);
  try {
    const image = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("El navegador no permite procesar esta imagen.");
    context.drawImage(image, 0, 0);
    return context.getImageData(0, 0, canvas.width, canvas.height);
  } finally {
    if (typeof input !== "string") URL.revokeObjectURL(url);
  }
}

async function imageDataToPng(imageData: ImageData): Promise<Blob> {
  requireCanvas();
  const canvas = document.createElement("canvas");
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("El navegador no permite exportar esta imagen.");
  context.putImageData(imageData, 0, 0);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo exportar el PNG."))),
      "image/png",
    ),
  );
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo decodificar la imagen generada."));
    image.src = url;
  });
}

function averageCornerColor(imageData: ImageData): [number, number, number] {
  const { width, height, data } = imageData;
  const sample = Math.max(1, Math.min(8, Math.floor(Math.min(width, height) / 4)));
  let red = 0;
  let green = 0;
  let blue = 0;
  let count = 0;
  for (let y = 0; y < sample; y += 1) {
    for (let x = 0; x < sample; x += 1) {
      for (const [px, py] of [
        [x, y],
        [width - 1 - x, y],
        [x, height - 1 - y],
        [width - 1 - x, height - 1 - y],
      ]) {
        const offset = (py! * width + px!) * 4;
        if ((data[offset + 3] ?? 0) === 0) continue;
        red += data[offset] ?? 0;
        green += data[offset + 1] ?? 0;
        blue += data[offset + 2] ?? 0;
        count += 1;
      }
    }
  }
  return count ? [red / count, green / count, blue / count] : [255, 255, 255];
}

function colorDistance(red: number, green: number, blue: number, target: readonly number[]) {
  return Math.hypot(red - (target[0] ?? 0), green - (target[1] ?? 0), blue - (target[2] ?? 0));
}

function rectangleVertices(x: number, y: number, width: number, height: number) {
  return [
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + height },
    { x, y: y + height },
  ];
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No se pudo leer la imagen generada."));
    reader.readAsDataURL(blob);
  });
}

function dataUrlOrBase64ToBlob(value: string, fallbackType: string): Blob {
  const match = value.match(/^data:([^;,]+)?(?:;base64)?,(.*)$/s);
  const type = match?.[1] || fallbackType;
  const encoded = match?.[2] ?? value;
  let binary: string;
  try {
    binary = atob(encoded.replace(/\s+/g, ""));
  } catch {
    throw new Error("La API devolvió datos de imagen inválidos.");
  }
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([new Uint8Array(bytes).buffer], { type });
}

function validateImageBlob(blob: Blob) {
  if (!blob.type.startsWith("image/"))
    throw new Error("El proveedor no devolvió un archivo de imagen.");
  if (blob.size === 0 || blob.size > MAX_IMAGE_BYTES) {
    throw new Error("La imagen generada está vacía o supera 20 MB.");
  }
}

function validatePrompt(value: unknown): string {
  if (typeof value !== "string" || value.trim().length < 3) {
    throw new Error("Describe la imagen que quieres generar.");
  }
  const prompt = value.trim().replace(/\s+/g, " ");
  if (prompt.length > 600) throw new Error("La descripción supera 600 caracteres.");
  return prompt;
}

function bearer(token: string): string {
  const clean = token.trim();
  if (!clean || /[\r\n]/.test(clean))
    throw new Error("Configura un token válido para el proveedor.");
  return `Bearer ${clean}`;
}

function assertHttpsEndpoint(endpoint: string) {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    throw new Error("La URL del proveedor no es válida.");
  }
  if (url.protocol !== "https:") throw new Error("La API de imágenes debe usar HTTPS.");
}

function boundedInteger(value: number, min: number, max: number, label: string): number {
  if (!Number.isFinite(value)) throw new Error(`El ${label} no es válido.`);
  return Math.max(min, Math.min(max, Math.round(value)));
}

function finite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function requireCanvas() {
  if (typeof document === "undefined" || typeof Image === "undefined") {
    throw new Error("El procesamiento de sprites necesita un navegador con Canvas 2D.");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}
