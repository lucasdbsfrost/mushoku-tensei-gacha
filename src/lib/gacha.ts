import type { BoosterPack, Card, PackedCard, Tier, TierPools } from '../types';
import { buildPools, classify } from './tiers';

export const GOD_PACK_CHANCE = 0.001; // 0.1 %

/** RNG injectable pour tests déterministes. */
export type Rng = () => number;
export const defaultRng: Rng = Math.random;

/** Tire `count` cartes distinctes (par nom) d'un pool, hors cartes déjà utilisées. */
function pickUnique(pool: Card[], count: number, used: Set<string>, rng: Rng): Card[] {
  const avail = pool.filter((c) => !used.has(c.name));
  for (let i = avail.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [avail[i], avail[j]] = [avail[j], avail[i]];
  }
  return avail.slice(0, count);
}

/** Première carte disponible en parcourant les pools de secours dans l'ordre. */
function drawWithFallback(pools: Card[][], used: Set<string>, rng: Rng): Card | null {
  for (const pool of pools) {
    const [card] = pickUnique(pool, 1, used, rng);
    if (card) return card;
  }
  return null;
}/**
 * Composition d'un booster UNION ARENA [UA54BT] — 8 cartes/pack, 1 box = 16 packs :
 *   slots 1-5 : Common
 *   slot  6   : Uncommon / Rare
 *   slot  7   : Rare (U sinon si pool R épuisé)
 *   slot  8   : LE hit — SR garanti (20 % de parallèle SRP parmi les hits)
 * Une carte AP peut remplacer un Common (12 % par slot, comme en réel).
 * Anti-doublon strict sur l'ensemble des 8 cartes.
 */
export function openBooster(cards: Card[], rng: Rng = defaultRng): BoosterPack {
  if (cards.length === 0) throw new Error('openBooster: jeu de cartes vide');
  const pools = buildPools(cards);

  // Les cartes AP sont des bonus cosmétiques : hors pools de tirage principal.
  const apPool = cards.filter((c) => c.rarity === 'AP' || c.rarity === 'APP');
  const apParallels = cards.filter((c) => c.rarity === 'APP');

  const isGodPack = rng() < GOD_PACK_CHANCE;
  if (isGodPack) {
    const picks = pickUnique(pools.SuperRare, 5, new Set(), rng);
    if (picks.length < 5) throw new Error('God Pack: pool SR insuffisant (<5)');
    return packOf(true, picks);
  }

  const used = new Set<string>();
  const picks: Card[] = [];
  const push = (card: Card | null) => {
    if (card) {
      used.add(card.name);
      picks.push(card);
    }
  };

  // Slots 1-5 : Common (chance d'AP bonus)
  for (let i = 0; i < 5; i++) {
    if (apPool.length > 0 && rng() < 0.12) {
      push(drawWithFallback([apPool, pools.Common], used, rng));
    } else {
      push(drawWithFallback([pools.Common, pools.Uncommon], used, rng));
    }
  }

  // Slot 6 : Uncommon / Rare
  push(drawWithFallback([pools.Uncommon, pools.Common], used, rng));

  // Slot 7 : Rare garanti (fallback Uncommon)
  const rPool = cards.filter((c) => c.rarity === 'R' || c.rarity === 'RP');
  push(drawWithFallback([rPool, pools.Uncommon, pools.Common], used, rng));

  // Slot 8 : le hit — SR garanti, 20 % de parallèle SRP
  const srPool = cards.filter((c) => c.rarity === 'SR');
  const srpPool = cards.filter((c) => c.rarity === 'SRP');
  push(
    rng() < 0.2 && srpPool.length > 0
      ? drawWithFallback([srpPool, srPool], used, rng)
      : drawWithFallback([srPool, pools.SuperRare, pools.Uncommon], used, rng),
  );

  // Filet de sécurité si la collection est minuscule
  while (picks.length < 8) {
    const [filler] = pickUnique(cards, 1, used, rng);
    if (!filler) break;
    push(filler);
  }

  return packOf(false, picks);
}

function packOf(isGodPack: boolean, picks: Card[]): BoosterPack {
  const packed: PackedCard[] = picks.map((card, i) => ({
    card,
    slot: i + 1,
    tier: classify(card),
  }));
  return {
    isGodPack,
    cards: packed,
    totalValue: packed.reduce((s, p) => s + p.card.priceTrend, 0),
  };
}
