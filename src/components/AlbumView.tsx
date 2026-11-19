import { useMemo, useState } from 'react';
import type { Card } from '../types';
import type { Album } from '../lib/collection';
import { statsOf } from '../lib/collection';
import { RARITY_LABEL } from '../lib/rarity';
import CardImage from './CardImage';
import CardZoom from './CardZoom';

interface Props {
  cards: Card[];
  album: Album;
  onOpen: () => void;
  onReset: () => void;
}

type Filter = 'all' | string;

// Ordre des filtres : de la plus courante à la plus précieuse.
const ORDER = ['C', 'CP', 'U', 'R', 'SR', 'AP'];
const PLURAL: Record<string, string> = {
  C: 'Communes', CP: 'Parallèles', U: 'Peu communes', R: 'Rares', SR: 'Super rares', AP: 'Cartes AP',
};

const short = (no: string) => no.replace('UA54BT/MST-1-', '').replace('_p', ' P');

export default function AlbumView({ cards, album, onOpen, onReset }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [missingOnly, setMissingOnly] = useState(false);
  const [zoom, setZoom] = useState<Card | null>(null);
  const stats = useMemo(() => statsOf(album, cards), [album, cards]);

  const counts = useMemo(() => {
    const c: Record<string, { all: number; owned: number }> = {};
    for (const card of cards) {
      const k = card.rarity;
      c[k] ??= { all: 0, owned: 0 };
      c[k].all++;
      if (album.owned[card.cardNo]) c[k].owned++;
    }
    return c;
  }, [cards, album]);

  const shown = cards.filter((c) =>
    (filter === 'all' || c.rarity === filter) && (!missingOnly || !album.owned[c.cardNo]));

  const reset = () => {
    if (window.confirm("Effacer l'album ? Toutes vos cartes et statistiques seront supprimées de ce navigateur.")) onReset();
  };

  const pct = Math.round((stats.distinct / cards.length) * 100);

  return (
    <section className="album" aria-labelledby="album-title">
      <header className="album-head">
        <div>
          <h2 id="album-title" className="album-title">Album</h2>
          <p className="album-progress-text">{stats.distinct} cartes sur {cards.length}</p>
        </div>
        <div className="album-progress" role="progressbar" aria-label="Album complété"
          aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
          <span className="album-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </header>

      <dl className="ledger">
        <div><dt>Boosters ouverts</dt><dd>{album.packs}</dd></div>
        <div><dt>Super rares obtenues</dt><dd>{stats.superRares}</dd></div>
        <div><dt>God Packs</dt><dd>{album.godPacks}</dd></div>
        <div><dt>Doublons</dt><dd>{stats.doubles}</dd></div>
      </dl>

      {album.packs === 0 ? (
        <div className="album-empty">
          <p>Votre album est vide. Ouvrez un premier booster pour le remplir.</p>
          <button type="button" className="btn btn-lapis" onClick={onOpen}>Ouvrir un booster</button>
        </div>
      ) : (
        <>
          <div className="filters" role="group" aria-label="Filtrer par rareté">
            <button type="button" className="chip" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
              Toutes <span className="chip-count">{stats.distinct}/{cards.length}</span>
            </button>
            {ORDER.filter((r) => counts[r]).map((r) => (
              <button key={r} type="button" className="chip" aria-pressed={filter === r}
                title={RARITY_LABEL[r]} onClick={() => setFilter(r)}>
                {PLURAL[r]} <span className="chip-count">{counts[r].owned}/{counts[r].all}</span>
              </button>
            ))}
            <label className="toggle">
              <input type="checkbox" checked={missingOnly} onChange={(e) => setMissingOnly(e.target.checked)} />
              Manquantes seulement
            </label>
          </div>

          {shown.length === 0 ? (
            <p className="album-none">Aucune carte manquante ici : cette rareté est complète.</p>
          ) : (
            <ol className="plates">
              {shown.map((card) => {
                const n = album.owned[card.cardNo] ?? 0;
                return (
                  <li key={card.cardNo} className={`plate ${n ? 'is-owned' : 'is-missing'} r-${card.rarity}`}>
                    {n ? (
                      <button type="button" className="plate-btn" onClick={() => setZoom(card)}
                        aria-label={`${card.name}, agrandir`}>
                        <CardImage card={card} />
                        {n > 1 && <span className="plate-count">{n}</span>}
                      </button>
                    ) : (
                      <span className="plate-empty">
                        <span className="plate-no">{short(card.cardNo)}</span>
                        <span className="plate-name">{card.name}</span>
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          )}

          <div className="album-foot">
            <button type="button" className="btn-link" onClick={reset}>Effacer l'album</button>
          </div>
        </>
      )}

      <CardZoom card={zoom} owned={zoom ? album.owned[zoom.cardNo] : undefined} onClose={() => setZoom(null)} />
    </section>
  );
}
