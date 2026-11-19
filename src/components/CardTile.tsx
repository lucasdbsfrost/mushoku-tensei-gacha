import type { CSSProperties } from 'react';
import type { PackedCard } from '../types';
import { rarityLabel } from '../lib/rarity';
import { useTilt } from '../hooks/useTilt';
import CardImage from './CardImage';
import Sigil from './Sigil';

interface Props {
  packed: PackedCard;
  index: number;
  flipped: boolean;
  isHit: boolean;
  onFlip: () => void;
  onZoom: () => void;
}

/** Une carte du booster : face cachée, puis retournée d'un clic. */
export default function CardTile({ packed, index, flipped, isHit, onFlip, onZoom }: Props) {
  const tilt = useTilt<HTMLButtonElement>(9);
  const { card, tier } = packed;
  const shiny = tier === 'super-rare' || tier === 'rare';
  const label = flipped
    ? `${card.name}, ${rarityLabel(card.rarity)}. Agrandir la carte`
    : `Retourner la carte ${index + 1}`;

  return (
    <button
      type="button"
      className={['card', `tier-${tier}`, flipped && 'is-flipped', isHit && 'is-hit']
        .filter(Boolean).join(' ')}
      style={{ '--i': index } as CSSProperties}
      aria-label={label}
      onClick={flipped ? onZoom : onFlip}
      {...(flipped && shiny ? tilt : {})}
    >
      <span className="card-inner">
        <span className="card-face card-back">
          <Sigil className="card-back-sigil" weight={1.6} />
        </span>
        <span className="card-face card-front">
          <CardImage card={card} eager />
          {shiny && <span className="card-sheen" aria-hidden="true" />}
        </span>
      </span>
    </button>
  );
}
