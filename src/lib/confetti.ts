import confetti from 'canvas-confetti';
import { TIER_META } from './tierStyle';

/** Explosion dorée (SuperRare / révélation). */
export function burstGold(origin = { x: 0.5, y: 0.45 }): void {
  confetti({
    particleCount: 90,
    spread: 75,
    startVelocity: 42,
    scalar: 0.9,
    origin,
    colors: TIER_META.SuperRare.confetti,
    disableForReducedMotion: true,
  });
}

/** Grande explosion multicolore (UltraRare) + canons latéraux. */
export function burstUltra(): void {
  confetti({
    particleCount: 160,
    spread: 100,
    startVelocity: 55,
    origin: { x: 0.5, y: 0.5 },
    colors: TIER_META.UltraRare.confetti,
    disableForReducedMotion: true,
  });
  setTimeout(() => sideCannons(TIER_META.UltraRare.confetti), 180);
}

/** Pluie dorée continue pour le God Pack. */
export function godPackRain(durationMs = 4500): void {
  const end = Date.now() + durationMs;
  const colors = [...TIER_META.UltraRare.confetti, '#ffd700', '#ffb300'];
  (function frame() {
    confetti({
      particleCount: 6,
      angle: 60,
      spread: 60,
      origin: { x: 0, y: 0.6 },
      colors,
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 6,
      angle: 120,
      spread: 60,
      origin: { x: 1, y: 0.6 },
      colors,
      disableForReducedMotion: true,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

function sideCannons(colors: string[]): void {
  confetti({
    particleCount: 70,
    angle: 60,
    spread: 55,
    origin: { x: 0, y: 0.7 },
    colors,
    disableForReducedMotion: true,
  });
  confetti({
    particleCount: 70,
    angle: 120,
    spread: 55,
    origin: { x: 1, y: 0.7 },
    colors,
    disableForReducedMotion: true,
  });
}
