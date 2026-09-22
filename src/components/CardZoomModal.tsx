import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { PackedCard } from '../types';
import CardFace from './CardFace';
import { useTilt } from '../hooks/useTilt';

interface Props {
  packed: PackedCard | null;
  onClose: () => void;
}

/**
 * Agrandissement d'une carte révélée.
 * - Toujours ENTIÈRE visible : la carte se dimensionne en fonction du viewport
 *   (aspect-ratio 5:7) et jamais plus haute que l'écran moins les textes.
 * - Tilt holographique actif, fermeture par clic extérieur ou Escape.
 */
export default function CardZoomModal({ packed, onClose }: Props) {
  const { tiltHandlers } = useTilt<HTMLDivElement>(14);
  const isUltra = packed?.tier === 'UltraRare';

  useEffect(() => {
    if (!packed) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [packed, onClose]);

  return (
    <AnimatePresence>
      {packed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={onClose}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`Carte agrandie : ${packed.card.name}`}
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.75, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            className="grid h-full max-h-full w-full grid-rows-[1fr_auto] justify-items-center gap-2 sm:gap-3"
          >
            {/* Carte : dimensionnée par la ligne 1fr de la grille (hauteur viewport
                moins textes), ratio 5/7, jamais coupée. L'item stretch par défaut
                remplit la ligne 1fr -> h-full fonctionne sur l'enfant. */}
            <div className="flex h-full min-h-0 w-full items-center justify-center">
              <div {...(isUltra ? tiltHandlers : {})} className="perspective-1200 flex h-full min-h-0 items-center justify-center">
                <div
                  className="tilt-body relative"
                  style={{
                    height: '100%',
                    maxHeight: '46rem',
                    aspectRatio: '5 / 7',
                    maxWidth: 'min(92vw, 32rem)',
                  }}
                >
                  <CardFace card={packed.card} tier={packed.tier} holo={isUltra} />
                </div>
              </div>
            </div>

            {/* Textes sous la carte : compacts pour laisser la place */}
            <div className="w-full px-4 pb-1 text-center">
              <p className="font-display text-lg text-white/95 sm:text-xl">{packed.card.name}</p>
              <p className="mt-0.5 text-sm text-amber-200/90">
                {packed.card.rarity} · slot #{packed.slot} · {packed.card.cardNo ?? ''}
              </p>
              <p className="mt-1.5 text-[11px] uppercase tracking-[0.3em] text-white/40">
                Clic extérieur ou Échap pour fermer
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
