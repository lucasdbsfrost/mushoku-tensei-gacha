/** Une carte du set, telle que décrite dans public/data/cards.json. */
export interface Card {
  name: string;
  rarity: string;
  imageUrl: string;
  /** Numéro officiel, unique, par exemple UA54BT/MST-1-001 */
  cardNo: string;
  bp?: string;
}

/** Les quatre niveaux d'affichage, du plus courant au plus précieux. */
export type Tier = 'commune' | 'peu-commune' | 'rare' | 'super-rare';

/** Une carte sortie d'un booster, avec sa position dans le paquet. */
export interface PackedCard {
  card: Card;
  tier: Tier;
  slot: number;
}

export interface Pack {
  isGodPack: boolean;
  cards: PackedCard[];
}
