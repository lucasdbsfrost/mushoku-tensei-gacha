/**
 * Sons générés en WebAudio (aucun asset externe requis).
 * Effets courts synthétisés à la volée ; ne se déclenchent qu'après une
 * interaction utilisateur (politique autoplay des navigateurs).
 */

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  try {
    if (!ctx) {
      const AC =
        window.AudioContext ??
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

function tone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  gain = 0.15,
  delay = 0,
  slideTo?: number,
): void {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

function noise(duration: number, gain = 0.2, delay = 0, hp = 800): void {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const frames = Math.floor(ac.sampleRate * duration);
  const buffer = ac.createBuffer(1, frames, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  }
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = hp;
  const g = ac.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  src.connect(filter).connect(g).connect(ac.destination);
  src.start(t0);
}

export const sfx = {
  /** Déchirure du papier du booster. */
  tear(): void {
    noise(0.35, 0.35, 0, 900);
    noise(0.25, 0.25, 0.12, 1400);
    tone(180, 0.18, 'triangle', 0.12, 0, 60);
  },
  /** Flip d'une carte. */
  flip(): void {
    noise(0.09, 0.18, 0, 2200);
    tone(520, 0.08, 'triangle', 0.08);
  },
  /** Carte SuperRare révélée. */
  rare(): void {
    tone(523.25, 0.16, 'sine', 0.12);
    tone(659.25, 0.16, 'sine', 0.12, 0.09);
    tone(783.99, 0.22, 'sine', 0.12, 0.18);
  },
  /** Carte UltraRare révélée : accord épique. */
  ultra(): void {
    tone(392, 0.5, 'sawtooth', 0.10);
    tone(493.88, 0.5, 'sawtooth', 0.10, 0.05);
    tone(587.33, 0.5, 'sawtooth', 0.10, 0.10);
    tone(783.99, 0.7, 'sine', 0.12, 0.18);
  },
  /** God Pack : fanfare montante. */
  godPack(): void {
    const notes = [261.63, 329.63, 392, 523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => tone(f, 0.4, 'sawtooth', 0.09, i * 0.09));
    tone(1567.98, 0.9, 'sine', 0.14, notes.length * 0.09 + 0.1);
    noise(0.8, 0.12, 0.2, 400);
  },
};
