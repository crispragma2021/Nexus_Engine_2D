import assert from "node:assert/strict";
import test from "node:test";
import {
  SFXR_PRESETS,
  encodeSfxrWav,
  normalizeSfxrParameters,
  parseSfxrMetadata,
  presetParameters,
  serializeSfxrMetadata,
  synthesizeSfxr,
} from "../src/lib/audio/sfxr.ts";

test("los cinco presets producen audio PCM finito y normalizado", () => {
  assert.deepEqual(Object.keys(SFXR_PRESETS), ["jump", "coin", "laser", "explosion", "hit"]);
  for (const name of Object.keys(SFXR_PRESETS)) {
    const samples = synthesizeSfxr(presetParameters(name as keyof typeof SFXR_PRESETS), 22_050);
    assert.ok(samples.length > 100);
    assert.ok(samples.every((sample) => Number.isFinite(sample) && sample >= -1 && sample <= 1));
    assert.ok(samples.some((sample) => Math.abs(sample) > 0.01));
  }
});

test("la envolvente comienza y termina cerca de silencio", () => {
  const samples = synthesizeSfxr(
    {
      waveform: "sine",
      frequency: 440,
      attack: 0.05,
      sustain: 0.05,
      decay: 0.1,
      pitchJump: 0,
      distortion: 0,
    },
    8_000,
  );
  assert.ok(Math.abs(samples[0] ?? 1) < 0.001);
  assert.ok(Math.abs(samples.at(-1) ?? 1) < 0.02);
});

test("los parámetros manuales se limitan a rangos seguros", () => {
  const normalized = normalizeSfxrParameters({
    waveform: "noise",
    frequency: 99_999,
    attack: -1,
    decay: 99,
    sustain: 99,
    pitchJump: -999,
    distortion: 3,
  });
  assert.equal(normalized.frequency, 8_000);
  assert.equal(normalized.attack, 0);
  assert.equal(normalized.decay, 4);
  assert.equal(normalized.sustain, 4);
  assert.equal(normalized.pitchJump, -60);
  assert.equal(normalized.distortion, 1);
});

test("la codificación WAV contiene cabeceras y tamaño válidos", () => {
  const samples = new Float32Array([0, 1, -1, 0.5]);
  const wav = encodeSfxrWav(samples, 44_100);
  const ascii = (start: number, end: number) => String.fromCharCode(...wav.slice(start, end));
  assert.equal(ascii(0, 4), "RIFF");
  assert.equal(ascii(8, 12), "WAVE");
  assert.equal(ascii(36, 40), "data");
  assert.equal(wav.length, 44 + samples.length * 2);
});

test("los parámetros se conservan como metadatos editables", () => {
  const original = presetParameters("coin");
  const metadata = serializeSfxrMetadata({ ...original, frequency: 932 }, "coin");
  const restored = parseSfxrMetadata(metadata);
  assert.ok(restored);
  assert.equal(restored.frequency, 932);
  assert.equal(restored.waveform, "square");
  assert.equal(parseSfxrMetadata("{}"), null);
});
