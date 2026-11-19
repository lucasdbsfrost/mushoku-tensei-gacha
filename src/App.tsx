import { useCallback, useEffect, useState } from 'react';
import type { Card, Pack } from './types';
import data from '../public/data/cards.json';
import { openBooster } from './lib/gacha';
import { setMuted } from './lib/audio';
import { statsOf } from './lib/collection';
import { useAlbum } from './hooks/useAlbum';
import Sigil from './components/Sigil';
import Ritual from './components/Ritual';
import Reveal from './components/Reveal';
import AlbumView from './components/AlbumView';

const cards = data.cards as Card[];
type View = 'open' | 'album';
type Phase = 'sealed' | 'reveal';

const SOUND_KEY = 'mt-gacha:son';
function readSound(): boolean {
  try { return localStorage.getItem(SOUND_KEY) !== 'off'; } catch { return true; }
}

export default function App() {
  const [view, setView] = useState<View>('open');
  const [phase, setPhase] = useState<Phase>('sealed');
  const [pack, setPack] = useState<Pack | null>(null);
  const [round, setRound] = useState(0);
  const [sound, setSound] = useState(readSound);
  const { album, record, reset } = useAlbum();
  const distinct = statsOf(album, cards).distinct;

  useEffect(() => {
    setMuted(!sound);
    try { localStorage.setItem(SOUND_KEY, sound ? 'on' : 'off'); } catch { /* sans stockage */ }
  }, [sound]);

  const draw = useCallback(() => {
    const next = openBooster(cards);
    setPack(next);
    record(next);
    return next;
  }, [record]);

  const again = () => {
    setPack(null);
    setPhase('sealed');
    setRound((r) => r + 1);
    window.scrollTo({ top: 0 });
  };

  const goto = (v: View) => {
    setView(v);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="folio">
      <a className="skip" href="#contenu">Aller au contenu</a>

      <header className="masthead">
        <div className="title-block">
          <Sigil className="title-sigil" />
          <div>
            <h1 className="title">Mushoku Tensei</h1>
            <p className="subtitle">Simulateur de boosters UNION ARENA, série UA54BT</p>
          </div>
        </div>

        <nav className="tabs" aria-label="Sections">
          <button type="button" className="tab" aria-current={view === 'open' ? 'page' : undefined}
            onClick={() => goto('open')}>Ouvrir un booster</button>
          <button type="button" className="tab" aria-current={view === 'album' ? 'page' : undefined}
            onClick={() => goto('album')}>
            Album <span className="tab-count">{distinct}/{cards.length}</span>
          </button>
          <button type="button" className="tab tab-sound" aria-pressed={sound}
            onClick={() => setSound((s) => !s)}>
            {sound ? 'Son activé' : 'Son coupé'}
          </button>
        </nav>
      </header>

      <main id="contenu">
        <div hidden={view !== 'open'}>
          {phase === 'sealed' && (
            <Ritual key={round} onBreak={draw} onDone={() => setPhase('reveal')} active={view === 'open'} />
          )}
          {phase === 'reveal' && pack && (
            <Reveal key={round} pack={pack} onAgain={again} onAlbum={() => goto('album')} />
          )}
        </div>
        {view === 'album' && (
          <AlbumView cards={cards} album={album} onOpen={() => { goto('open'); if (phase === 'reveal') again(); }}
            onReset={reset} />
        )}
      </main>

      <footer className="colophon">
        <p>
          Simulateur non officiel, sans lien avec BANDAI ni les ayants droit de Mushoku Tensei.
          Images des cartes : cardlist officielle UNION ARENA. Les taux de tirage sont des estimations.
        </p>
      </footer>
    </div>
  );
}
