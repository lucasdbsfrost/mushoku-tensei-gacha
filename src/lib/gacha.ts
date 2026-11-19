import type { Card, Pack } from '../types';
import { tierOf } from './rarity';

/*
 * Composition d'un booster UNION ARENA UA54BT, 8 cartes :
 *   cartes 1 à 5 : communes. Chacune peut être remplacée par une carte AP
 *                  (12 %) ou par une commune parallèle (6 %).
 *   carte 6      : peu commune
 *   carte 7      : rare
 *   carte 8      : super rare, garantie
 * Une fois sur mille, c'est un God Pack : cinq super rares différentes.
 * Aucune carte en double dans un même booster (comparaison par numéro).
 *
 * Les taux AP et parallèle sont des estimations : Bandai ne publie pas
 * les taux exacts.
 */
export const GOD_PACK_CHANCE = 0.001;
export const AP_CHANCE = 0.12;
export const PARALLEL_CHANCE = 0.06;

/** Générateur aléatoire injectable, pour des tests reproductibles. */
export type Rng = () => number;

function draw(pool: Card[], used: Set<string>, rng: Rng): Card | null {
  const free = pool.filter((c) => !used.has(c.cardNo));
  if (free.length === 0) return null;
  const card = free[Math.floor(rng() * free.length)];
  used.add(card.cardNo);
  return card;
}

/** Première carte libre en essayant les réserves dans l'ordre. */
function drawFrom(pools: Card[][], used: Set<string>, rng: Rng): Card | null {
  for (const pool of pools) {
    const card = draw(pool, used, rng);
    if (card) return card;
  }
  return null;
}

export function openBooster(cards: Card[], rng: Rng = Math.random): Pack {
  if (cards.length === 0) throw new Error('openBooster : aucune carte chargée');
  const by = (r: string) => cards.filter((c) => c.rarity === r);
  const C = by('C'), CP = by('CP'), AP = by('AP'), U = by('U'), R = by('R');
  const SR = [...by('SR'), ...by('SRP')];
  const used = new Set<string>();

  if (rng() < GOD_PACK_CHANCE && SR.length >= 5) {
    const picks: Card[] = [];
    for (let i = 0; i < 5; i++) picks.push(draw(SR, used, rng)!);
    return pack(true, picks);
  }

  const picks: (Card | null)[] = [];
  for (let i = 0; i < 5; i++) {
    const roll = rng();
    if (roll < AP_CHANCE) picks.push(drawFrom([AP, C], used, rng));
    else if (roll < AP_CHANCE + PARALLEL_CHANCE) picks.push(drawFrom([CP, C], used, rng));
    else picks.push(drawFrom([C, U], used, rng));
  }
  picks.push(drawFrom([U, C], used, rng));
  picks.push(drawFrom([R, U], used, rng));
  picks.push(drawFrom([SR, R], used, rng));

  return pack(false, picks.filter((c): c is Card => c !== null));
}

function pack(isGodPack: boolean, picks: Card[]): Pack {
  return {
    isGodPack,
    cards: picks.map((card, i) => ({ card, slot: i + 1, tier: tierOf(card.rarity) })),
  };
}
