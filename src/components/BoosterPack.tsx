import { useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import { sfx } from '../lib/audio';

interface Props {
  onTear: () => void;
}

/**
 * Booster scellé 2.5D (art génératif : aucun asset copyrighté).
 * Interaction : swipe horizontal (drag ≥ 90px) OU clic simple pour déchirer.
 */
export default function BoosterPack({ onTear }: Props) {
  const controls = useAnimationControls();
  const [torn, setTorn] = useState(false);
  const [topStrip, setTopStrip] = useState(false);
  const tornRef = useRef(false);

  const doTear = () => {
    if (tornRef.current) return;
    tornRef.current = true;
    sfx.tear();
    setTopStrip(true);
    // Shake violent du pack puis flash
    void controls.start({
      x: [0, -14, 12, -9, 7, -4, 0],
      y: [0, 6, -5, 4, -2, 1, 0],
      rotate: [0, -2.5, 2, -1, 0.5, 0],
      transition: { duration: 0.55, ease: 'easeOut' },
    });
    setTimeout(() => {
      setTorn(true);
      onTear();
    }, 480);
  };

  return (
    <div className="flex flex-col items-center gap-10">
      <motion.div
        animate={controls}
        className="group-holo relative cursor-grab select-none active:cursor-grabbing"
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.35}
        onDragEnd={(_, info) => {
          if (Math.abs(info.offset.x) >= 90) doTear();
        }}
        onClick={doTear}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        role="button"
        aria-label="Déchirer le booster"
      >
        {/* Glimmer au survol */}
        <div className="pointer-events-none absolute -inset-8 overflow-hidden rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <div className="shine-sweep absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </div>

        {/* Halo du pack */}
        <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-indigo-500/20 via-fuchsia-500/15 to-amber-400/20 blur-2xl" />

        {/* Corps du booster */}
        <div className="relative h-[26rem] w-64 overflow-hidden rounded-2xl shadow-2xl">
          {/* Bandeau haut (partie arrachée) */}
          <AnimatePresence>
            {topStrip && (
              <motion.div
                initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
                animate={{ x: 140, y: -150, rotate: 24, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="absolute inset-x-0 top-0 z-20 h-16"
              >
                <div className="h-full w-full rounded-t-2xl bg-gradient-to-b from-violet-200 to-indigo-400 crimped-edge" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Art du booster */}
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-950" />
          <div className="absolute inset-0 opacity-70">
            <div className="absolute left-1/2 top-[30%] h-56 w-56 -translate-x-1/2 rounded-full bg-gradient-to-tr from-sky-400/40 via-fuchsia-500/40 to-amber-300/50 blur-2xl" />
            <div className="absolute bottom-8 left-4 h-24 w-24 rounded-full bg-emerald-400/20 blur-xl" />
            <div className="absolute bottom-16 right-5 h-16 w-16 rounded-full bg-rose-400/25 blur-lg" />
          </div>

          {/* Textes packaging */}
          <div className="relative z-10 flex h-full flex-col items-center justify-between py-7">
            <div className="w-full">
              <div className="crimped-edge mx-auto w-full opacity-80" />
              <p className="mt-2 text-center font-display text-xs tracking-[0.35em] text-sky-200/90">
                UNION ARENA
              </p>
            </div>

            <div className="text-center">
              <p className="font-display text-3xl font-bold leading-tight text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-300 to-orange-400 text-glow-gold">
                MUSHOKU
                <br />
                TENSEI
              </p>
              <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-sky-200/70">
                Jobless Reincarnation · UA54BT
              </p>
            </div>

            <div className="flex flex-col items-center gap-2">
              <span className="rounded-full border border-sky-300/40 bg-black/40 px-3 py-1 text-[10px] tracking-widest text-sky-200">
                8 CARDS
              </span>
              <span className="text-[9px] uppercase tracking-widest text-white/40">
                Glisser ou cliquer pour ouvrir
              </span>
            </div>
          </div>

          {/* Voile lumineux au moment de l'ouverture */}
          <AnimatePresence>
            {torn && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.9, 0] }}
                transition={{ duration: 0.6, times: [0, 0.3, 1] }}
                className="absolute inset-0 z-30 bg-white"
              />
            )}
          </AnimatePresence>
        </div>

        {/* Liseré doré */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/20" />
      </motion.div>

      <p className="animate-pulse text-sm text-white/50">
        Glisse le booster (ou clique) pour le déchirer…
      </p>
    </div>
  );
}
