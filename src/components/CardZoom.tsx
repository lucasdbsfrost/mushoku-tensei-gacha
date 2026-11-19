import { useEffect, useRef } from 'react';
import type { Card } from '../types';
import { rarityLabel } from '../lib/rarity';
import CardImage from './CardImage';

interface Props {
  card: Card | null;
  owned?: number;
  onClose: () => void;
}

/** La carte en grand, dans une fenêtre qu'on ferme avec Échap ou un clic à côté. */
export default function CardZoom({ card, owned, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (card && !d.open) d.showModal();
    if (!card && d.open) d.close();
  }, [card]);

  return (
    <dialog
      ref={ref}
      className="zoom"
      aria-label={card ? card.name : 'Carte'}
      onClose={onClose}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {card && (
        <figure className="zoom-figure">
          <div className="zoom-card"><CardImage card={card} eager /></div>
          <figcaption className="zoom-caption">
            <span className="zoom-name">{card.name}</span>
            <span>{rarityLabel(card.rarity)}, carte {card.cardNo.replace('UA54BT/', '')}</span>
            {owned !== undefined && owned > 0 && (
              <span>{owned > 1 ? `${owned} exemplaires dans l'album` : "1 exemplaire dans l'album"}</span>
            )}
          </figcaption>
          <button type="button" className="btn btn-ink zoom-close" onClick={onClose}>Fermer</button>
        </figure>
      )}
    </dialog>
  );
}
