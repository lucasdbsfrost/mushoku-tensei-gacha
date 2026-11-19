import { describe, expect, it } from 'vitest';
import type { Card } from '../types';
import { AP_CHANCE, GOD_PACK_CHANCE, openBooster } from './gacha';
import { addPack, EMPTY_ALBUM, statsOf } from './collection';
import data from '../../public/data/cards.json';

const cards = data.cards as Card[];

/** Générateur qui renvoie toujours la même valeur. */
const fixed = (v: number) => () => v;

describe('le vrai set UA54BT', () => {
  it('contient 120 cartes, chacune avec un numéro unique', () => {
    expect(cards).toHaveLength(120);
    expect(new Set(cards.map((c) => c.cardNo)).size).toBe(120);
  });
});

describe('un booster normal', () => {
  it('contient toujours 8 cartes sans doublon', () => {
    for (let i = 0; i < 500; i++) {
      const pack = openBooster(cards);
      const size = pack.isGodPack ? 5 : 8;   // un God Pack peut tomber au hasard
      expect(pack.cards).toHaveLength(size);
      expect(new Set(pack.cards.map((p) => p.card.cardNo)).size).toBe(size);
    }
  });

  it('se termine toujours par une super rare', () => {
    for (let i = 0; i < 500; i++) {
      const pack = openBooster(cards);
      if (!pack.isGodPack) expect(pack.cards[7].tier).toBe('super-rare');
    }
  });

  it('a une peu commune en 6e et une rare en 7e', () => {
    const pack = openBooster(cards, fixed(0.5));
    expect(pack.cards[5].card.rarity).toBe('U');
    expect(pack.cards[6].card.rarity).toBe('R');
  });

  it('ne met jamais de super rare parmi les cinq premières', () => {
    for (let i = 0; i < 500; i++) {
      const pack = openBooster(cards);
      if (pack.isGodPack) continue;
      for (const p of pack.cards.slice(0, 5)) expect(['C', 'CP', 'AP']).toContain(p.card.rarity);
    }
  });

  it('peut contenir plusieurs cartes AP différentes', () => {
    // Avec un tirage toujours sous le seuil AP, les cinq premières sont des AP.
    const pack = openBooster(cards, fixed(AP_CHANCE / 2));
    const aps = pack.cards.slice(0, 5).filter((p) => p.card.rarity === 'AP');
    expect(aps).toHaveLength(5);
  });
});

describe('le God Pack', () => {
  it('donne cinq super rares différentes', () => {
    const pack = openBooster(cards, fixed(GOD_PACK_CHANCE / 2));
    expect(pack.isGodPack).toBe(true);
    expect(pack.cards).toHaveLength(5);
    for (const p of pack.cards) expect(p.tier).toBe('super-rare');
    expect(new Set(pack.cards.map((p) => p.card.cardNo)).size).toBe(5);
  });

  it('a une chance sur mille', () => {
    expect(GOD_PACK_CHANCE).toBe(0.001);
    expect(openBooster(cards, fixed(0.5)).isGodPack).toBe(false);
  });
});

describe("l'album", () => {
  it('compte les cartes, les doublons et les super rares', () => {
    const pack = openBooster(cards, fixed(0.5));
    let album = addPack(EMPTY_ALBUM, pack);
    album = addPack(album, pack);
    const stats = statsOf(album, cards);
    expect(album.packs).toBe(2);
    expect(stats.distinct).toBe(8);
    expect(stats.total).toBe(16);
    expect(stats.doubles).toBe(8);
    expect(stats.superRares).toBe(2);
  });
});
