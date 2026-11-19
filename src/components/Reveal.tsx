import { useEffect, useRef, useState } from 'react';
import type { Card, Pack } from '../types';
import { sfx } from '../lib/audio';
import CardTile from './CardTile';
import CardZoom from './CardZoom';

interface Props {
  pack: Pack;
  onAgain: () => void;
  onAlbum: () => void;
}

/** Les cartes du booster, face cachée, à retourner une par une. */
export default function Reveal({ pack, onAgain, onAlbum }: Props) {
  const n = pack.cards.length;
  const [flipped, setFlipped] = useState<boolean[]>(() => Array(n).fill(false));
  const [zoom, setZoom] = useState<Card | null>(null);
  const timers = useRef<number[]>([]);
  const count = flipped.filter(Boolean).length;
  const done = count === n;
  const againRef = useRef<HTMLButtonElement>(null);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => { if (done) againRef.current?.focus({ preventScroll: true }); }, [done]);

  const flip = (i: number) => {
    setFlipped((f) => {
      if (f[i]) return f;
      const next = [...f];
      next[i] = true;
      return next;
    });
    const tier = pack.cards[i].tier;
    if (tier === 'super-rare') sfx.superRare();
    else if (tier === 'rare') sfx.rare();
    else sfx.flip();
  };

  const flipAll = () => {
    let delay = 0;
    flipped.forEach((isUp, i) => {
      if (isUp) return;
      timers.current.push(window.setTimeout(() => flip(i), delay));
      delay += pack.cards[i].tier === 'super-rare' ? 420 : 140;
    });
  };

  return (
    <section className="reveal" aria-labelledby="reveal-title">
      <header className="reveal-head">
        {pack.isGodPack ? (
          <>
            <h2 id="reveal-title" className="reveal-title is-god">God Pack</h2>
            <p className="reveal-text">Cinq super rares d'un coup. Cela n'arrive qu'une fois sur mille.</p>
          </>
        ) : (
          <>
            <h2 id="reveal-title" className="reveal-title">Votre booster</h2>
            <p className="reveal-text">Retournez les cartes une à une. La dernière est votre super rare.</p>
          </>
        )}
        <p className="reveal-count" aria-live="polite">{count} sur {n} retournées</p>
      </header>

      <div className={`spread ${pack.isGodPack ? 'is-god' : ''}`}>
        {pack.cards.map((p, i) => (
          <CardTile
            key={p.card.cardNo}
            packed={p}
            index={i}
            flipped={flipped[i]}
            isHit={!pack.isGodPack && i === n - 1}
            onFlip={() => flip(i)}
            onZoom={() => setZoom(p.card)}
          />
        ))}
      </div>

      <div className="actions">
        {done ? (
          <>
            <button ref={againRef} type="button" className="btn btn-lapis" onClick={onAgain}>
              Ouvrir un autre booster
            </button>
            <button type="button" className="btn btn-ink" onClick={onAlbum}>Voir l'album</button>
          </>
        ) : (
          <button type="button" className="btn btn-ink" onClick={flipAll}>Tout retourner</button>
        )}
      </div>

      <CardZoom card={zoom} onClose={() => setZoom(null)} />
    </section>
  );
}
