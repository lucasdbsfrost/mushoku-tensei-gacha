import type { Card, Tier, TierPools } from '../types';

/**
 * Classification par tranches de prix :
 *   Common    : <  0.50 €   (C)
 *   Uncommon  : 0.50 € – 5.00 €   (U, R, AP)
 *   SuperRare : 5.00 € – 25.00 €  (SR, parallèles R)
 *   UltraRare : > 25.00 €         (parallèles SR, secrètes)
 */
export const PRICE_THRESHOLDS = {
  uncommonMin: 0.5,
  superRareMin: 5,
  ultraRareMin: 25,
} as const;

/** Fallback si le prix manque : raretés UNION ARENA / Weiss Schwarz -> tier. */
const RARITY_TO_TIER: Record<string, Tier> = {
  // UNION ARENA
  C: 'Common', CP: 'Common',
  U: 'Uncommon', UP: 'Uncommon',
  R: 'Uncommon', RP: 'SuperRare',
  AP: 'Uncommon',
  SR: 'SuperRare', SRP: 'UltraRare',
  // Weiss Schwarz (compatibilité multi-jeux)
  CC: 'Common', CR: 'Uncommon', RR: 'SuperRare', RRR: 'SuperRare',
  SFR: 'UltraRare', SEC: 'UltraRare', SSP: 'UltraRare',
  SP: 'UltraRare', P: 'UltraRare', TD: 'Common',
};

export function classify(card: Card): Tier {
  const p = card.priceTrend;
  if (Number.isFinite(p) && p > 0) {
    if (p < PRICE_THRESHOLDS.uncommonMin) return 'Common';
    if (p < PRICE_THRESHOLDS.superRareMin) return 'Uncommon';
    if (p < PRICE_THRESHOLDS.ultraRareMin) return 'SuperRare';
    return 'UltraRare';
  }
  return RARITY_TO_TIER[card.rarity] ?? 'Common';
}

export function buildPools(cards: Card[]): TierPools {
  const pools: TierPools = { Common: [], Uncommon: [], SuperRare: [], UltraRare: [] };
  for (const card of cards) pools[classify(card)].push(card);
  return pools;
}
