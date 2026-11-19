import { useState } from 'react';
import type { Card } from '../types';
import { rarityLabel } from '../lib/rarity';

/*
 * Image officielle de la carte. Si elle ne se charge pas (site Bandai
 * injoignable, adresse changée), on affiche une fiche à la plume à la place.
 */
export default function CardImage({ card, eager = false }: { card: Card; eager?: boolean }) {
  const [broken, setBroken] = useState(false);

  if (broken) {
    return (
      <span className="card-fallback">
        <span className="card-fallback-name">{card.name}</span>
        <span className="card-fallback-meta">{rarityLabel(card.rarity)}</span>
        <span className="card-fallback-meta">{card.cardNo.replace('UA54BT/', '')}</span>
      </span>
    );
  }

  return (
    <img
      className="card-img"
      src={card.imageUrl}
      alt={`${card.name}, ${rarityLabel(card.rarity)}`}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
      onError={() => setBroken(true)}
    />
  );
}
