import { describe, expect, it } from 'vitest';
import type { Card } from '../types';
import { GOD_PACK_CHANCE, openBooster } from '../lib/gacha';
import { classify, PRICE_THRESHOLDS } from '../lib/tiers';

/** RNG déterministe : renvoie toujours `value`. */
const fixedRng = (value: number) => () => value;

const mk = (name: string, rarity: string, price: number): Card => ({
  name, rarity, imageUrl: '', priceTrend: price,
});

const sample: Card[] = [
  ...Array.from({ length: 12 }, (_, i) => mk(`C${i + 1}`, 'C', 0.10)),
  ...Array.from({ length: 8 }, (_, i) => mk(`U${i + 1}`, 'U', 0.80)),
  ...Array.from({ length: 6 }, (_, i) => mk(`R${i + 1}`, 'R', 1.50)),
  ...Array.from({ length: 6 }, (_, i) => mk(`SR${i + 1}`, 'SR', 8.00)),
  mk('SRP1', 'SRP', 28.00),
  mk('SRP2', 'SRP', 35.00),
  mk('AP1', 'AP', 3.00),
  mk('AP2', 'AP', 3.00),
  mk('AP3', 'AP', 3.00),
];

describe('classification par prix', () => {
  it('respecte les tranches', () => {
    const card = (p: number): Card => mk('x', 'C', p);
    expect(classify(card(0.49))).toBe('Common');
    expect(classify(card(PRICE_THRESHOLDS.uncommonMin))).toBe('Uncommon');
    expect(classify(card(4.99))).toBe('Uncommon');
    expect(classify(card(5.0))).toBe('SuperRare');
    expect(classify(card(24.99))).toBe('SuperRare');
    expect(classify(card(25.0))).toBe('UltraRare');
  });

  it('raretés UNION ARENA mappées', () => {
    expect(classify(mk('x', 'C', 0))).toBe('Common');
    expect(classify(mk('x', 'AP', 0))).toBe('Uncommon');
    expect(classify(mk('x', 'SRP', 0))).toBe('UltraRare');
  });
});

describe('openBooster — structure UNION ARENA 8 cartes', () => {
  it('contient toujours 8 cartes', () => {
    for (let i = 0; i < 40; i++) {
      expect(openBooster(sample).cards).toHaveLength(8);
    }
  });

  it('slot 8 : le hit est SR ou SRP', () => {
    for (let i = 0; i < 40; i++) {
      const pack = openBooster(sample);
      const hit = pack.cards[7];
      expect(hit.card.rarity === 'SR' || hit.card.rarity === 'SRP').toBe(true);
    }
  });

  it('slots 1-5 : jamais de SR dans les commons', () => {
    for (let i = 0; i < 40; i++) {
      const pack = openBooster(sample);
      for (const p of pack.cards.slice(0, 5)) {
        expect(['Common', 'Uncommon']).toContain(p.tier);
      }
    }
  });

  it('anti-doublon strict : 8 cartes distinctes', () => {
    for (let i = 0; i < 40; i++) {
      const names = openBooster(sample).cards.map((p) => p.card.name);
      expect(new Set(names).size).toBe(8);
    }
  });

  it('slot 8 : 20% de parallèle SRP (plan du RNG)', () => {
    // rng() consommé avant le slot 8 : 5 slots commons + 2 slots U/R = 7 rolls
    // + 1 roll AP éventuel par slot common. Avec fixedRng(0.1) : les 5 premiers slots
    // déclenchent l'AP (0.1 < 0.12) puis le roll 6 et 7 prennent 0.1 chacun.
    // Le roll du hit est le 8e appel = 0.1 < 0.2 -> SRP
    const pack = openBooster(sample, fixedRng(0.10));
    expect(pack.cards[7].card.rarity).toBe('SRP');
  });
});

describe('openBooster — God Pack', () => {
  it('0.1% : 5 cartes SuperRare toutes différentes', () => {
    const pack = openBooster(sample, fixedRng(0.0005));
    expect(pack.isGodPack).toBe(true);
    expect(pack.cards).toHaveLength(5);
    for (const p of pack.cards) expect(p.tier).toBe('SuperRare');
    const names = pack.cards.map((p) => p.card.name);
    expect(new Set(names).size).toBe(5);
  });

  it('99.9% : pas de God Pack', () => {
    expect(openBooster(sample, fixedRng(0.2)).isGodPack).toBe(false);
  });

  it('la constante vaut bien 0.1%', () => {
    expect(GOD_PACK_CHANCE).toBe(0.001);
  });
});

describe('valeur du pack', () => {
  it('totalValue = somme des priceTrend', () => {
    const pack = openBooster(sample, fixedRng(0.5));
    const sum = pack.cards.reduce((s, p) => s + p.card.priceTrend, 0);
    expect(pack.totalValue).toBeCloseTo(sum, 8);
  });
});
