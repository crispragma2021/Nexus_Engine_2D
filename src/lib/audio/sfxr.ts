// Procedural 2D sound effects inspired by sfxr/jsfxr. The synthesizer is fully
// deterministic and produces standard PCM/WAV data, so every preset can be
// stored as a normal project resource and edited again from its parameters.

export type SfxrPresetName = "jump" | "coin" | "laser" | "explosion" | "hit";
export type SfxrWaveform = "square" | "saw" | "sine" | "noise";

export interface SfxrParameters {
  waveform: SfxrWaveform;
  /** oscillator frequency in hertz */
  frequency: number;
  /** attack time in seconds */
  attack: number;
  /** release/decay time in seconds */
  decay: number;
  /** full-volume sustain time in seconds */
  sustain: number;
  /** pitch change across the sound, in semitones */
  pitchJump: number;
  /** soft-clipping amount, from 0 to 1 */
  distortion: number;
}

export interface SfxrPlayback {
  context: AudioContext;
  source: AudioBufferSourceNode;
  stop: () => void;
}

export const SFXR_SAMPLE_RATE = 44_100;
export const SFXR_METADATA_VERSION = 1;

export const SFXR_PRESETS: Readonly<Record<SfxrPresetName, Readonly<SfxrParameters>>> = {
  jump: {
    waveform: "square",
    frequency: 260,
    attack: 0.005,
    sustain: 0.12,
    decay: 0.18,
    pitchJump: 12,
    distortion: 0.08,
  },
  coin: {
    waveform: "square",
    frequency: 880,
    attack: 0.002,
    sustain: 0.06,
    decay: 0.2,
    pitchJump: 7,
    distortion: 0.03,
  },
  laser: {
    waveform: "saw",
    frequency: 920,
    attack: 0.002,
    sustain: 0.09,
    decay: 0.22,
    pitchJump: -24,
    distortion: 0.22,
  },
  explosion: {
    waveform: "noise",
    frequency: 90,
    attack: 0.002,
    sustain: 0.2,
    decay: 0.55,
    pitchJump: -10,
    distortion: 0.5,
  },
  hit: {
    waveform: "noise",
    frequency: 170,
    attack: 0.001,
    sustain: 0.045,
    decay: 0.14,
    pitchJump: -6,
    distortion: 0.35,
  },
};

const WAVEFORMS = new Set<SfxrWaveform>(["square", "saw", "sine", "noise"]);

export function presetParameters(name: SfxrPresetName): SfxrParameters {
  return { ...SFXR_PRESETS[name] };
}

export function normalizeSfxrParameters(input: Partial<SfxrParameters>): SfxrParameters {
  return {
    waveform: WAVEFORMS.has(input.waveform as SfxrWaveform)
      ? (input.waveform as SfxrWaveform)
      : "square",
    frequency: clamp(finite(input.frequency, 440), 20, 8_000),
    attack: clamp(finite(input.attack, 0.005), 0, 2),
    decay: clamp(finite(input.decay, 0.2), 0.005, 4),
    sustain: clamp(finite(input.sustain, 0.1), 0, 4),
    pitchJump: clamp(finite(input.pitchJump, 0), -60, 60),
    distortion: clamp(finite(input.distortion, 0), 0, 1),
  };
}

/** Generate mono PCM samples without requiring a browser or AudioContext. */
export function synthesizeSfxr(
  input: Partial<SfxrParameters>,
  sampleRate = SFXR_SAMPLE_RATE,
): Float32Array {
  const parameters = normalizeSfxrParameters(input);
  const rate = Math.round(clamp(finite(sampleRate, SFXR_SAMPLE_RATE), 8_000, 192_000));
  const duration = Math.max(0.01, parameters.attack + parameters.sustain + parameters.decay);
  const length = Math.max(1, Math.ceil(duration * rate));
  const samples = new Float32Array(length);
  let phase = 0;
  let noiseState = 0x9e3779b9;
  const distortionDrive = 1 + parameters.distortion * 24;
  const distortionScale = Math.tanh(distortionDrive) || 1;

  for (let index = 0; index < length; index += 1) {
    const time = index / rate;
    const progress = length <= 1 ? 1 : index / (length - 1);
    const semitones = parameters.pitchJump * progress;
    const frequency = parameters.frequency * 2 ** (semitones / 12);
    phase = (phase + frequency / rate) % 1;

    let sample: number;
    switch (parameters.waveform) {
      case "sine":
        sample = Math.sin(phase * Math.PI * 2);
        break;
      case "saw":
        sample = phase * 2 - 1;
        break;
      case "noise":
        noiseState ^= noiseState << 13;
        noiseState ^= noiseState >>> 17;
        noiseState ^= noiseState << 5;
        sample = ((noiseState >>> 0) / 0xffffffff) * 2 - 1;
        break;
      case "square":
      default:
        sample = phase < 0.5 ? 1 : -1;
        break;
    }

    const envelope = envelopeAt(time, parameters);
    const distorted = Math.tanh(sample * distortionDrive) / distortionScale;
    // A small safety gain prevents inter-sample clipping after browser resampling.
    samples[index] = clamp(distorted * envelope * 0.92, -1, 1);
  }

  return samples;
}

function envelopeAt(time: number, parameters: SfxrParameters): number {
  if (parameters.attack > 0 && time < parameters.attack) return time / parameters.attack;
  const sustainEnd = parameters.attack + parameters.sustain;
  if (time <= sustainEnd) return 1;
  const decayProgress = (time - sustainEnd) / parameters.decay;
  return clamp(1 - decayProgress, 0, 1);
}

/** Encode mono PCM as a browser-compatible 16-bit WAV file. */
export function encodeSfxrWav(samples: Float32Array, sampleRate = SFXR_SAMPLE_RATE): Uint8Array {
  const rate = Math.round(clamp(finite(sampleRate, SFXR_SAMPLE_RATE), 8_000, 192_000));
  const output = new Uint8Array(44 + samples.length * 2);
  const view = new DataView(output.buffer);
  writeAscii(output, 0, "RIFF");
  view.setUint32(4, output.length - 8, true);
  writeAscii(output, 8, "WAVE");
  writeAscii(output, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(output, 36, "data");
  view.setUint32(40, samples.length * 2, true);
  for (let index = 0; index < samples.length; index += 1) {
    const sample = clamp(samples[index] ?? 0, -1, 1);
    view.setInt16(44 + index * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }
  return output;
}

export function createSfxrWavBlob(parameters: Partial<SfxrParameters>): Blob {
  const bytes = encodeSfxrWav(synthesizeSfxr(parameters));
  // Copy into an ArrayBuffer-backed view for TypeScript's strict BlobPart typing.
  return new Blob([new Uint8Array(bytes).buffer], { type: "audio/wav" });
}

export function sfxrToDataUrl(parameters: Partial<SfxrParameters>): string {
  const bytes = encodeSfxrWav(synthesizeSfxr(parameters));
  return `data:audio/wav;base64,${base64(bytes)}`;
}

export function serializeSfxrMetadata(
  parameters: Partial<SfxrParameters>,
  preset?: SfxrPresetName,
): string {
  return JSON.stringify({
    generator: "sfxr",
    version: SFXR_METADATA_VERSION,
    ...(preset ? { preset } : {}),
    parameters: normalizeSfxrParameters(parameters),
  });
}

export function parseSfxrMetadata(metadata?: string): SfxrParameters | null {
  if (!metadata) return null;
  try {
    const parsed = JSON.parse(metadata) as {
      generator?: unknown;
      parameters?: Partial<SfxrParameters>;
    };
    if (parsed.generator !== "sfxr" || !parsed.parameters) return null;
    return normalizeSfxrParameters(parsed.parameters);
  } catch {
    return null;
  }
}

/** Play a generated effect through Web Audio. The caller owns the returned context. */
export function playSfxr(
  parameters: Partial<SfxrParameters>,
  context?: AudioContext,
): SfxrPlayback {
  const AudioContextConstructor = globalThis.AudioContext;
  if (!context && !AudioContextConstructor) {
    throw new Error("Web Audio no está disponible en este navegador.");
  }
  const audioContext = context ?? new AudioContextConstructor();
  const samples = synthesizeSfxr(parameters, audioContext.sampleRate);
  const buffer = audioContext.createBuffer(1, samples.length, audioContext.sampleRate);
  buffer.copyToChannel(new Float32Array(samples), 0);
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  if (audioContext.state === "suspended") void audioContext.resume();
  source.start();
  return {
    context: audioContext,
    source,
    stop: () => {
      try {
        source.stop();
      } catch {
        // The source may already have ended; stopping remains idempotent for UI callers.
      }
    },
  };
}

function writeAscii(output: Uint8Array, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    output[offset + index] = value.charCodeAt(index);
  }
}

function base64(bytes: Uint8Array): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "";
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index] ?? 0;
    const second = bytes[index + 1] ?? 0;
    const third = bytes[index + 2] ?? 0;
    const value = (first << 16) | (second << 8) | third;
    result += alphabet[(value >>> 18) & 63];
    result += alphabet[(value >>> 12) & 63];
    result += index + 1 < bytes.length ? alphabet[(value >>> 6) & 63] : "=";
    result += index + 2 < bytes.length ? alphabet[value & 63] : "=";
  }
  return result;
}

function finite(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
