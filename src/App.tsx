import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { BoosterPack, Card } from './types';
import { openBooster } from './lib/gacha';
import BoosterPackView from './components/BoosterPack';
import RevealStage from './components/RevealStage';
import GodPackOverlay from './components/GodPackOverlay';
import { formatEuro } from './lib/tierStyle';
import cardsData from '../public/data/cards.json';

type Stage = 'sealed' | 'reveal';
type DataState = 'loading' | 'ready' | 'error';

export default function App() {
  const [cards, setCards] = useState<Card[]>([]);
  const [dataState, setDataState] = useState<DataState>('loading');
  const [stage, setStage] = useState<Stage>('sealed');
  const [pack, setPack] = useState<BoosterPack | null>(null);
  const [godPackCelebrating, setGodPackCelebrating] = useState(false);

  // Chargement du jeu de cartes : données embarquées (marche en file://)
  // + tentative de fetch pour prendre en compte une mise à jour fraîche du JSON.
  useEffect(() => {
    let cancelled = false;
    // Fallback immédiat : données embarquées au build
    if (Array.isArray(cardsData.cards) && cardsData.cards.length > 0) {
      setCards(cardsData.cards as Card[]);
      setDataState('ready');
    }
    // Puis tentative de refresh (utile en dev / serveur HTTP)
    fetch('data/cards.json')
      .then((r) => (r.ok ? (r.json() as Promise<{ cards: Card[] }>) : null))
      .then((json) => {
        if (!cancelled && json && Array.isArray(json.cards) && json.cards.length > 0) {
          setCards(json.cards);
          setDataState('ready');
        }
      })
      .catch(() => {
        /* file:// ou JSON absent : les données embarquées suffisent */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const cosmic = useMemo(
    () => pack?.isGodPack ?? false,
    [pack],
  );

  const handleTear = () => {
    const next = openBooster(cards);
    setPack(next);
    if (next.isGodPack) {
      setGodPackCelebrating(true);
      // Laisser la fanfare respirer avant d'afficher les cartes.
      window.setTimeout(() => setStage('reveal'), 2600);
    } else {
      setStage('reveal');
    }
  };

  const reset = () => {
    setPack(null);
    setStage('sealed');
    setGodPackCelebrating(false);
  };

  const totalCollectionValue = useMemo(
    () => cards.reduce((s, c) => s + c.priceTrend, 0),
    [cards],
  );

  return (
    <div className={`relative min-h-screen overflow-x-hidden ${cosmic ? 'bg-cosmic-gold' : 'bg-aurora'}`}>
      {/* Blobs animés GPU (transform-only) — aucun repaint du fond */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div
          className="aurora-blob"
          style={{ width: '44vw', height: '44vw', top: '-10vh', left: '-8vw' }}
        />
        <div
          className="aurora-blob"
          style={{
            width: '36vw',
            height: '36vw',
            bottom: '-12vh',
            right: '-6vw',
            animationDelay: '-12s',
            animationDuration: '26s',
          }}
        />
      </div>

      {/* Dégradé de transition quand God Pack */}
      <AnimatePresence>
        {cosmic && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="pointer-events-none fixed inset-0 z-0"
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-8">
        {/* Header */}
        <header className="mb-10 text-center">
          <h1 className="font-display text-3xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-sky-200 via-white to-amber-200 sm:text-4xl">
            Gacha Simulator — Mushoku Tensei
          </h1>
          <p className="mt-2 text-sm text-white/50">
            UNION ARENA · UA54BT · {cards.length || '…'} cartes · Set value{' '}
            {cards.length ? formatEuro(totalCollectionValue) : '…'}
          </p>
        </header>

        {/* Contenu */}
        <main className="flex flex-1 items-start justify-center">
          {dataState === 'loading' && (
            <p className="animate-pulse text-white/60">Chargement du set…</p>
          )}

          {dataState === 'error' && (
            <div className="max-w-md rounded-2xl border border-rose-400/30 bg-rose-500/10 p-6 text-center">
              <p className="font-semibold text-rose-200">Impossible de charger data/cards.json</p>
              <p className="mt-2 text-sm text-rose-100/70">
                Lance le scraper puis recharge : <code>npm run scrape</code>
              </p>
            </div>
          )}

          {dataState === 'ready' && stage === 'sealed' && (
            <motion.div
              key="sealed"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94, filter: 'blur(6px)' }}
              className="mt-8"
            >
              <BoosterPackView onTear={handleTear} />
            </motion.div>
          )}

          {dataState === 'ready' && stage === 'reveal' && pack && (
            <motion.div
              key="reveal"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full"
            >
              <RevealStage pack={pack} onReset={reset} />
            </motion.div>
          )}
        </main>

        <footer className="mt-12 text-center text-xs text-white/30">
          Simulateur non officiel · images © BANDAI / cardlist officielle UNION ARENA · prix estimés (TCGplayer à venir) · aucune affiliation
        </footer>
      </div>

      {/* God Pack overlay */}
      <AnimatePresence>
        {godPackCelebrating && (
          <GodPackOverlay onClose={() => setGodPackCelebrating(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
