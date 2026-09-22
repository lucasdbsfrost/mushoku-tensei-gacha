export type Tier = 'Common' | 'Uncommon' | 'SuperRare' | 'UltraRare';

/** Carte brute issue du scraping (data/cards.json). */
export interface Card {
  name: string;
  rarity: string;
  imageUrl: string;
  priceTrend: number;
  /** Numéro officiel (ex: UA54BT/MST-1-001) — présent selon la source. */
  cardNo?: string;
  /** BP affiché sur les cartes UNION ARENA — optionnel. */
  bp?: string;
  /** Provenance du prix : tcgplayer | estimate — optionnel. */
  priceSource?: 'tcgplayer' | 'estimate';
}

/** Carte tirée dans un booster. */
export interface PackedCard {
  card: Card;
  tier: Tier;
  /** Position 1..5 dans le booster (5 = carte rare garantie). */
  slot: number;
}

export interface BoosterPack {
  isGodPack: boolean;
  cards: PackedCard[];
  totalValue: number;
}

export type TierPools = Record<Tier, Card[]>;
