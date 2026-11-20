import fs from 'fs';
import path from 'path';

const SAMPLE_RATE = 48000;

function writeWavStereo(filePath: string, left: Float32Array, right: Float32Array): void {
  const numSamples = left.length;
  const dataSize = numSamples * 4; // 2 channels * 2 bytes (int16)
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // PCM chunk size
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(2, 22); // stereo
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 4, 28); // byte rate
  buffer.writeUInt16LE(4, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < numSamples; i += 1) {
    const l = Math.max(-1, Math.min(1, left[i]));
    const r = Math.max(-1, Math.min(1, right[i]));
    buffer.writeInt16LE(Math.round(l * 32767), offset);
    buffer.writeInt16LE(Math.round(r * 32767), offset + 2);
    offset += 4;
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buffer);
}

/**
 * Generates a warm, mellow 84 BPM lo-fi tech instrumental bed (Rhodes-style
 * electric piano chords + soft warm sub bass + muted lo-fi percussion) tuned
 * to sit cleanly underneath voiceover without masking speech intelligibility.
 */
function generateLofiBed(filePath: string, durationSec = 54): void {
  const totalSamples = Math.floor(durationSec * SAMPLE_RATE);
  const left = new Float32Array(totalSamples);
  const right = new Float32Array(totalSamples);

  const bpm = 84;
  const beatSec = 60 / bpm;
  const barSec = beatSec * 4;

  // Warm lo-fi progression: Cmaj9 -> Am9 -> Fmaj7 -> G6 (frequencies in Hz)
  const chords: number[][] = [
    [130.81, 196.0, 246.94, 293.66, 329.63], // Cmaj9
    [110.0, 164.81, 196.0, 246.94, 261.63], // Am9
    [87.31, 130.81, 174.61, 220.0, 261.63], // Fmaj7
    [98.0, 146.83, 196.0, 246.94, 329.63], // G6
  ];

  // Deterministic pseudo-random generator for warm soft brushed snare/hat
  let seed = 1337;
  const nextNoise = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return (seed / 0xffffffff) * 2 - 1;
  };

  // Gentle 1-pole low-pass filter state for warm lo-fi tone
  let lpL = 0;
  let lpR = 0;
  const lpAlpha = 0.14; // warm roll-off above ~1.4kHz so voice stays ultra-clear

  for (let i = 0; i < totalSamples; i += 1) {
    const t = i / SAMPLE_RATE;
    const barIdx = Math.floor(t / barSec) % chords.length;
    const barTime = t % barSec;
    const beatPos = barTime / beatSec;
    const beatFrac = beatPos - Math.floor(beatPos);
    const beatNum = Math.floor(beatPos);

    // Subtle analog pitch drift
    const drift = 1 + 0.0012 * Math.sin(2 * Math.PI * 0.45 * t);

    // 1. Warm Rhodes-like chord pad with soft attack and natural decay
    const chord = chords[barIdx];
    const chordEnv =
      Math.min(1, barTime / 0.09) * Math.exp(-barTime * 0.42) * 0.72 +
      Math.min(1, barTime / 0.15) * 0.28;

    let padL = 0;
    let padR = 0;
    for (let n = 0; n < chord.length; n += 1) {
      const f = chord[n] * drift;
      const fundamental = Math.sin(2 * Math.PI * f * t);
      const secondHarm = 0.22 * Math.sin(2 * Math.PI * f * 2 * t) * Math.exp(-barTime * 1.4);
      const voice = (fundamental + secondHarm) * (n === 0 ? 0.34 : 0.18);
      const pan = n % 2 === 0 ? 0.58 : 0.42;
      padL += voice * pan;
      padR += voice * (1 - pan);
    }
    padL *= chordEnv;
    padR *= chordEnv;

    // 2. Soft muted kick on beat 0 and beat 2.5
    let kick = 0;
    const kickHits = [0, 2.5];
    for (const kh of kickHits) {
      const dt = beatPos - kh;
      if (dt >= 0 && dt < 0.28) {
        const dtSec = dt * beatSec;
        const kFreq = 46 + 68 * Math.exp(-dtSec * 28);
        kick += Math.sin(2 * Math.PI * kFreq * dtSec) * Math.exp(-dtSec * 14) * 0.42;
      }
    }

    // 3. Soft brushed rim/snare on beats 1 and 3
    let snare = 0;
    if (beatNum === 1 || beatNum === 3) {
      const dtSec = beatFrac * beatSec;
      if (dtSec < 0.14) {
        const body = Math.sin(2 * Math.PI * 195 * dtSec) * Math.exp(-dtSec * 30) * 0.14;
        const brush = nextNoise() * Math.exp(-dtSec * 26) * 0.12;
        snare = body + brush;
      }
    }

    // 4. Subtle off-beat lo-fi shaker/hat
    const eighthFrac = (beatPos * 2) % 1;
    const hatSec = eighthFrac * (beatSec / 2);
    const hat = hatSec < 0.045 ? nextNoise() * Math.exp(-hatSec * 65) * 0.035 : 0;

    // Combine & warm low-pass filter
    const rawL = (padL + kick + snare * 0.95 + hat * 1.1) * 0.72;
    const rawR = (padR + kick + snare * 1.05 + hat * 0.9) * 0.72;

    lpL = lpL + lpAlpha * (rawL - lpL);
    lpR = lpR + lpAlpha * (rawR - lpR);

    // Master fade in / fade out
    const fadeIn = Math.min(1, t / 0.8);
    const fadeOut = Math.min(1, (durationSec - t) / 1.5);
    const env = Math.max(0, fadeIn * fadeOut);

    left[i] = lpL * env;
    right[i] = lpR * env;
  }

  writeWavStereo(filePath, left, right);
}

/**
 * Generates a subtle, silky air-whoosh + warm tonal pop for smooth B-roll entrances.
 */
function generateSoftWhoosh(filePath: string, durationSec = 0.42): void {
  const totalSamples = Math.floor(durationSec * SAMPLE_RATE);
  const left = new Float32Array(totalSamples);
  const right = new Float32Array(totalSamples);

  let seed = 4242;
  const nextNoise = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return (seed / 0xffffffff) * 2 - 1;
  };

  let lp = 0;
  let hpPrevIn = 0;
  let hpPrevOut = 0;

  for (let i = 0; i < totalSamples; i += 1) {
    const t = i / SAMPLE_RATE;
    const progress = t / durationSec;
    // Smooth bell envelope peaking at 48%
    const env = Math.sin(Math.PI * progress) ** 1.7;

    // Sweeping filtered air noise
    const n = nextNoise();
    const cutoff = 0.04 + 0.16 * Math.sin(Math.PI * progress);
    lp = lp + cutoff * (n - lp);
    const hp = 0.94 * (hpPrevOut + lp - hpPrevIn);
    hpPrevIn = lp;
    hpPrevOut = hp;

    // Soft warm marimba-like pop accent near the peak
    const popStart = 0.14;
    let pop = 0;
    if (t >= popStart) {
      const pt = t - popStart;
      const freq = 340 + 180 * Math.exp(-pt * 28);
      pop = Math.sin(2 * Math.PI * freq * pt) * Math.exp(-pt * 22) * 0.24;
    }

    const sample = hp * env * 0.55 + pop;
    // Subtle left-to-right stereo motion
    const panL = 0.65 - 0.3 * progress;
    const panR = 0.35 + 0.3 * progress;
    left[i] = sample * panL;
    right[i] = sample * panR;
  }

  writeWavStereo(filePath, left, right);
}

export function ensureStudioAudioAssets(mediaDir: string): {
  musicPath: string;
  whooshPath: string;
} {
  const audioDir = path.join(mediaDir, 'audio');
  const musicPath = path.join(audioDir, 'lofi_tech_bed.wav');
  const whooshPath = path.join(audioDir, 'whoosh_soft.wav');

  if (!fs.existsSync(musicPath)) {
    generateLofiBed(musicPath, 54);
  }
  if (!fs.existsSync(whooshPath)) {
    generateSoftWhoosh(whooshPath, 0.42);
  }

  return { musicPath, whooshPath };
}
