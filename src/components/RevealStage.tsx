import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { BoosterPack, PackedCard } from '../types';
import GachaCard from './GachaCard';
import CardZoomModal from './CardZoomModal';
import CardFace from './CardFace';
import { useTilt } from '../hooks/useTilt';
import { useCountUp } from '../hooks/useCountUp';
import { burstGold, burstUltra } from '../lib/confetti';
import { formatEuro } from '../lib/tierStyle';
import { sfx } from '../lib/audio';

interface Props {
  pack: BoosterPack;
  onReset: () => void;
}

/** Scène étape 2-4 : les 9 cartes sortent du booster, flip séquentiel, récap. */
export default function RevealStage({ pack, onReset }: Props) {
  const [revealedCount, setRevealedCount] = useState(0);
  const [zoomed, setZoomed] = useState<PackedCard | null>(null);
  // Grâce périodique : ignore les clics pendant que les cartes volent du booster,
  // sinon le clic de déchirure "traverse" et retourne une carte immédiatement.
  const [interactable, setInteractable] = useState(false);
  const [forceReveal, setForceReveal] = useState(false);
  const allRevealed = revealedCount >= pack.cards.length;

  useEffect(() => {
    const t = window.setTimeout(() => setInteractable(true), 900);
    return () => window.clearTimeout(t);
  }, []);

  const handleRevealed = (i: number) => {
    setRevealedCount((c) => Math.max(c, i + 1));
  };

  const revealAll = () => {
    sfx.flip();
    setForceReveal(true);
    setRevealedCount(pack.cards.length);
    // Petit burst si le hit est rare.
    const last = pack.cards[pack.cards.length - 1];
    if (last.tier === 'UltraRare') burstUltra();
    else if (last.tier === 'SuperRare') burstGold();
  };

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Filet de progression */}
      <div className="flex items-center gap-2">
        {pack.cards.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-8 rounded-full transition-all duration-500 ${
              i < revealedCount ? 'bg-amber-300' : 'bg-white/15'
            }`}
          />
        ))}
      </div>

      {/* Pile de cartes */}
      <div className="flex max-w-4xl flex-wrap items-center justify-center gap-4">
        {pack.cards.map((p: PackedCard, i) => (
          <GachaCard
            key={`${p.card.name}-${i}`}
            packed={p}
            index={i}
            unlocked={interactable && (i === 0 || i <= revealedCount)}
            isHit={!pack.isGodPack && i === pack.cards.length - 1}
            forceReveal={forceReveal}
            onRevealed={handleRevealed}
            onZoom={setZoomed}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={revealAll}
          disabled={allRevealed}
          className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-2.5 font-semibold text-black shadow-lg transition hover:scale-105 disabled:opacity-30 disabled:hover:scale-100"
        >
          ✨ Tout révéler
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-white/20 bg-white/5 px-6 py-2.5 font-semibold text-white/80 transition hover:bg-white/10"
        >
          🔁 Tirer un autre booster
        </button>
      </div>

      {/* Récap (visible quand tout est révélé) */}
      <AnimatePresence>
        {allRevealed && <Summary pack={pack} />}
      </AnimatePresence>

      {/* Agrandissement d'une carte */}
      <CardZoomModal packed={zoomed} onClose={() => setZoomed(null)} />
    </div>
  );
}

function Summary({ pack }: { pack: BoosterPack }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl"
    >
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="font-display text-lg tracking-wide text-white/90">
            Récapitulatif du pack {pack.isGodPack && <span className="text-amber-300">— GOD PACK</span>}
          </h2>
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-white/40">Valeur totale</p>
            <TotalValue value={pack.totalValue} />
          </div>
        </div>

        <ul className="divide-y divide-white/5">
          {pack.cards.map((p, i) => (
            <li key={i} className="flex items-center gap-4 py-2.5">
              <span className="w-6 text-right text-xs text-white/30">{i + 1}</span>
              <MiniFace packed={p} />
              <span className="flex-1 truncate text-sm text-white/85">{p.card.name}</span>
              <span className="text-xs text-white/40">{p.card.rarity}</span>
              <ValueText value={p.card.priceTrend} />
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

/** Mini carte avec tilt holo. */
function MiniFace({ packed }: { packed: PackedCard }) {
  const { tiltHandlers } = useTilt<HTMLDivElement>(10);
  const isUltra = packed.tier === 'UltraRare';
  return (
    <div
      {...(isUltra ? tiltHandlers : {})}
      className="group-holo h-16 w-11 shrink-0"
    >
      <div className="tilt-body h-full w-full">
        <CardFace card={packed.card} tier={packed.tier} holo={isUltra} />
      </div>
    </div>
  );
}

function TotalValue({ value }: { value: number }) {
  const shown = useCountUp(value, 1100);
  return (
    <p className="font-display text-2xl font-bold text-amber-300 text-glow-gold">
      {formatEuro(shown)}
    </p>
  );
}

function ValueText({ value }: { value: number }) {
  return (
    <span className="text-sm font-semibold text-amber-200/90">{formatEuro(value)}</span>
  );
}
