import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { PackedCard } from '../types';
import CardFace from './CardFace';
import { useTilt } from '../hooks/useTilt';
import { burstGold, burstUltra } from '../lib/confetti';
import { sfx } from '../lib/audio';

interface Props {
  packed: PackedCard;
  index: number;
  /** La carte précédente est déjà révélée (révélation séquentielle). */
  unlocked: boolean;
  /** La carte « hit » du pack : aura de suspense + slow reveal. */
  isHit?: boolean;
  /** « Tout révéler » : retourne la carte immédiatement. */
  forceReveal?: boolean;
  onRevealed: (index: number) => void;
  /** Clic sur une carte déjà retournée -> agrandir. */
  onZoom?: (packed: PackedCard) => void;
}

const FLIP = { duration: 0.7, ease: [0.4, 0.0, 0.2, 1] as const };

/**
 * Une carte du booster : face cachée -> flip 3D au clic.
 * Backface corrigé : styles inline (backface-visibility + rotateY) fiables
 * quel que soit le navigateur — plus aucune face visible avant retournement.
 * Slot 5 : aura de suspense avant le flip (dorée = SR, arc-en-ciel = UR),
 * slow reveal + explosion de particules si UltraRare.
 * Carte retournée + clic = zoom (onZoom).
 */
export default function GachaCard({ packed, index, unlocked, isHit = false, forceReveal = false, onRevealed, onZoom }: Props) {
  const [flipped, setFlipped] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const { tiltHandlers } = useTilt<HTMLDivElement>(14);

  // « Tout révéler » : flip immédiat (sans slow reveal) de toutes les cartes.
  useEffect(() => {
    if (forceReveal && !flipped) {
      setRevealing(false);
      setFlipped(true);
      onRevealed(index);
    }
  }, [forceReveal, flipped, index, onRevealed]);

  const isUltra = packed.tier === 'UltraRare';
  const isSuper = packed.tier === 'SuperRare';

  const handleClick = () => {
    if (flipped) {
      onZoom?.(packed);
      return;
    }
    if (!unlocked) return;

    if (isHit && (isUltra || isSuper)) {
      setRevealing(true);
      (isUltra ? sfx.ultra : sfx.rare)();
      window.setTimeout(() => {
        setRevealing(false);
        setFlipped(true);
        if (isUltra) burstUltra();
        else burstGold();
        onRevealed(index);
      }, 1100);
    } else {
      sfx.flip();
      setFlipped(true);
      if (isSuper) {
        burstGold({ x: 0.5, y: 0.55 });
        sfx.rare();
      }
      onRevealed(index);
    }
  };

  const auraClass = !flipped && isHit ? (isUltra ? 'aura-rainbow' : 'aura-gold') : '';

  return (
    <>
      {/* Voile d'assombrissement pendant le slow reveal */}
      <AnimatePresence>
        {revealing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-40 bg-black/70"
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ delay: index * 0.06, type: 'spring', stiffness: 120, damping: 16 }}
        className={`perspective-1200 ${auraClass}`}
        style={{ zIndex: revealing ? 50 : 1 }}
      >
        <motion.button
          type="button"
          onClick={handleClick}
          aria-label={flipped ? `Agrandir : ${packed.card.name}` : 'Carte face cachée — cliquer pour retourner'}
          className={`preserve-3d relative block h-72 w-48 ${
            unlocked || flipped ? 'cursor-pointer' : 'cursor-wait opacity-50'
          } ${flipped ? '' : 'hover:-translate-y-1.5'}`}
          style={{ transformStyle: 'preserve-3d', opacity: 1 }}
          whileHover={flipped ? { scale: 1.04 } : { scale: 1.03 }}
          whileTap={flipped ? {} : { scale: 0.98 }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={FLIP}
        >
          {/* DOS de la carte (visible avant flip) */}
          <div
            className="card-back absolute inset-0 rounded-xl ring-1 ring-white/25"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' } as React.CSSProperties}
          >
            <div className="flex h-full w-full flex-col items-center justify-center gap-3">
              <motion.div
                animate={isHit && !flipped ? { scale: [1, 1.06, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1.4 }}
                className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-amber-300/60 bg-black/30"
              >
                <span className="font-display text-xl text-sky-200">UA</span>
              </motion.div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-sky-100/70">
                Union Arena
              </span>
              <span className="text-[9px] tracking-widest text-white/40">
                #{String(packed.slot).padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* FACE de la carte (visible après flip) */}
          <div
            className="absolute inset-0"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
            onPointerMove={flipped ? tiltHandlers.onPointerMove : undefined}
            onPointerLeave={flipped ? tiltHandlers.onPointerLeave : undefined}
          >
            <div className="tilt-body h-full w-full">
              <CardFace card={packed.card} tier={packed.tier} holo={isUltra} />
            </div>
          </div>
        </motion.button>

        {/* Halo lumineux pendant le slow reveal */}
        <AnimatePresence>
          {revealing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: [0, 1, 0.85, 1], scale: [0.9, 1.08, 1] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.05 }}
              className={`pointer-events-none absolute inset-0 rounded-xl ${
                isUltra ? 'bg-fuchsia-400/30 blur-2xl' : 'bg-amber-300/30 blur-2xl'
              }`}
              style={{ zIndex: 45 }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
