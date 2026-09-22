import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { godPackRain } from '../lib/confetti';
import { sfx } from '../lib/audio';

/** Événement God Pack : fanfare, pluie dorée cosmique, bannière mythique. */
export default function GodPackOverlay({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    sfx.godPack();
    godPackRain(5000);
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center"
      >
        {/* Voile cosmic */}
        <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />

        {/* Anneaux cosmiques */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.2, opacity: 0.9 }}
            animate={{ scale: 3.2, opacity: 0 }}
            transition={{ duration: 2.2, delay: i * 0.35, repeat: Infinity, repeatDelay: 0.6 }}
            className="absolute h-72 w-72 rounded-full border-2 border-amber-300/50"
          />
        ))}

        <motion.div
          initial={{ scale: 0.6, y: 40, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 90, damping: 12, delay: 0.15 }}
          className="relative z-10 flex flex-col items-center gap-4 px-8 text-center"
        >
          <motion.p
            animate={{ scale: [1, 1.06, 1], textShadow: ['0 0 22px rgba(255,200,60,.8)', '0 0 44px rgba(255,160,20,.95)', '0 0 22px rgba(255,200,60,.8)'] }}
            transition={{ repeat: Infinity, duration: 1.6 }}
            className="font-display text-5xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-300 to-orange-500 sm:text-6xl"
          >
            GOD PACK
          </motion.p>
          <p className="max-w-md text-sm leading-relaxed text-amber-100/85">
            Un pack mythique ! Les 5 cartes sont Ultra Rare — des tirages que
            l'on voit une fois tous les 1 000 boosters.
          </p>
          <motion.p
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 1.8 }}
            className="text-xs uppercase tracking-[0.4em] text-amber-200/70"
          >
            ✦ Révélation légendaire ✦
          </motion.p>
        </motion.div>

        {/* Bouton fermer */}
        <motion.button
          type="button"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2 }}
          className="absolute bottom-12 rounded-full border border-amber-300/50 bg-amber-400/15 px-8 py-3 font-semibold text-amber-100 backdrop-blur transition hover:bg-amber-400/25"
        >
          Découvrir les cartes →
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
}
