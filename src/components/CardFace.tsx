import { useState } from 'react';
import type { Card, Tier } from '../types';
import { TIER_META, formatEuro } from '../lib/tierStyle';

interface Props {
  card: Card;
  tier: Tier;
  holo: boolean; // couche arc-en-ciel (UltraRare)
}

const INITIALS = (name: string): string =>
  name
    .replace(/[^A-Za-zÀ-ÿ ]/g, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

/**
 * Face avant : vraie image (TCGplayer CDN) + couches holo par-dessus.
 * Si l'image échoue (404/réseau), fallback élégant sur la face générative.
 */
export default function CardFace({ card, tier, holo }: Props) {
  const meta = TIER_META[tier];
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = Boolean(card.imageUrl) && !imgFailed;

  return (
    <div className={`group-holo relative h-full w-full overflow-hidden rounded-xl ${meta.glow}`}>
      {/* Fond de la carte (visible pendant le chargement / fallback) */}
      <div className={`absolute inset-0 bg-gradient-to-br ${meta.face}`} />

      {/* Vraie image de la carte */}
      {showImage && (
        <img
          src={card.imageUrl}
          alt={card.name}
          loading="eager"
          draggable={false}
          onError={() => setImgFailed(true)}
          className="absolute inset-0 h-full w-full select-none object-cover"
        />
      )}

      {/* Illustration générative en fallback */}
      {!showImage && (
        <div className="absolute inset-0 opacity-80">
          <div className="absolute left-1/2 top-[32%] h-36 w-36 -translate-x-1/2 rounded-full bg-white/10 blur-xl" />
          <div className="absolute bottom-6 left-5 h-16 w-16 rounded-full bg-white/10 blur-md" />
          <div className="absolute right-6 top-10 h-10 w-10 rounded-full bg-white/15 blur-sm" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-display text-6xl font-bold text-white/25">
              {INITIALS(card.name) || 'MT'}
            </span>
          </div>
        </div>
      )}

      {/* Couches holographiques */}
      <div className={`holo-sheen ${holo ? 'holo-rainbow' : ''}`} />

      {/* Badge rareté + prix */}
      <div className="absolute left-2 top-2">
        <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold tracking-wide backdrop-blur-sm ${meta.badge}`}>
          {card.rarity || meta.label}
        </span>
      </div>
      <div className="absolute inset-x-2 bottom-2 flex items-end justify-between gap-2">
        <span className="max-w-[68%] truncate rounded bg-black/55 px-1.5 py-0.5 text-[11px] font-medium text-white/95 backdrop-blur-sm">
          {card.name}
        </span>
        <span className="shrink-0 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200 backdrop-blur-sm">
          {formatEuro(card.priceTrend)}
        </span>
      </div>

      {/* Liseré */}
      <div className={`pointer-events-none absolute inset-0 rounded-xl ring-2 ${meta.ring}`} />
    </div>
  );
}
