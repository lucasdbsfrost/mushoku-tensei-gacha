/*
 * Sons synthétisés en direct (WebAudio), sans aucun fichier.
 * Ils ne jouent qu'après un geste du visiteur, comme l'exigent les navigateurs.
 */
let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(value: boolean): void {
  muted = value;
}

function audio(): AudioContext | null {
  if (muted) return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, dur: number, type: OscillatorType, gain: number, delay = 0, slideTo?: number): void {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise(dur: number, gain: number, delay = 0, cutoff = 800): void {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const frames = Math.floor(ac.sampleRate * dur);
  const buffer = ac.createBuffer(1, frames, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = cutoff;
  const g = ac.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(g).connect(ac.destination);
  src.start(t0);
}

export const sfx = {
  /** Le cercle magique se charge. */
  charge(): void {
    tone(110, 0.9, 'sine', 0.09, 0, 440);
    tone(220, 0.9, 'triangle', 0.04, 0.05, 660);
  },
  /** Le sceau de cire se brise, le papier s'ouvre. */
  seal(): void {
    noise(0.12, 0.3, 0, 1800);
    tone(160, 0.2, 'triangle', 0.12, 0, 70);
    noise(0.4, 0.14, 0.1, 900);
  },
  flip(): void {
    noise(0.08, 0.14, 0, 2400);
    tone(560, 0.07, 'triangle', 0.05);
  },
  rare(): void {
    tone(523.25, 0.18, 'sine', 0.1);
    tone(659.25, 0.18, 'sine', 0.1, 0.08);
    tone(783.99, 0.26, 'sine', 0.1, 0.16);
  },
  superRare(): void {
    tone(392, 0.6, 'triangle', 0.08);
    tone(493.88, 0.6, 'triangle', 0.08, 0.06);
    tone(587.33, 0.6, 'triangle', 0.08, 0.12);
    tone(783.99, 0.9, 'sine', 0.11, 0.2);
    tone(1174.66, 0.9, 'sine', 0.05, 0.3);
  },
  godPack(): void {
    const notes = [261.63, 329.63, 392, 523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => tone(f, 0.45, 'triangle', 0.08, i * 0.09));
    tone(1567.98, 1.1, 'sine', 0.12, notes.length * 0.09 + 0.1);
  },
};
