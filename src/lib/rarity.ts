import type { Tier } from '../types';

/** Raretés UNION ARENA présentes dans le set. */
const TIER_OF: Record<string, Tier> = {
  C: 'commune',
  CP: 'rare',      // parallèle : même carte, illustration alternative
  AP: 'commune',   // carte Action Point, bonus
  U: 'peu-commune',
  R: 'rare',
  SR: 'super-rare',
  SRP: 'super-rare',
};

export function tierOf(rarity: string): Tier {
  return TIER_OF[rarity] ?? 'commune';
}

/** Nom lisible de chaque rareté, pour les étiquettes et les filtres. */
export const RARITY_LABEL: Record<string, string> = {
  C: 'Commune',
  CP: 'Parallèle',
  AP: 'Carte AP',
  U: 'Peu commune',
  R: 'Rare',
  SR: 'Super rare',
  SRP: 'Super rare parallèle',
};

export function rarityLabel(rarity: string): string {
  return RARITY_LABEL[rarity] ?? rarity;
}
