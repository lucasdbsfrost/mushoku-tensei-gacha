import { useEffect, useRef, useState } from 'react';
import type { Pack } from '../types';
import { sfx } from '../lib/audio';
import type { RitualHandle } from '../three/ritual';
import Sigil from './Sigil';

interface Props {
  /** Tire le booster au moment où le sceau est brisé. */
  onBreak: () => Pack;
  /** Appelé quand l'animation d'ouverture est terminée. */
  onDone: () => void;
  active: boolean;
}

type Status = 'loading' | 'ready' | 'off';

/** Le booster scellé posé sur le cercle magique, en 3D quand c'est possible. */
export default function Ritual({ onBreak, onDone, active }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handle = useRef<RitualHandle | null>(null);
  const busy = useRef(false);
  const [status, setStatus] = useState<Status>('loading');
  const [opening, setOpening] = useState(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    let cancelled = false;
    import('../three/ritual')
      .then(({ startRitual }) => {
        if (cancelled || !canvasRef.current) return;
        handle.current = startRitual(canvasRef.current, () => doneRef.current());
        setStatus(handle.current ? 'ready' : 'off');
      })
      .catch(() => { if (!cancelled) setStatus('off'); });
    return () => {
      cancelled = true;
      handle.current?.dispose();
      handle.current = null;
    };
  }, []);

  useEffect(() => { handle.current?.setActive(active); }, [active, status]);

  const breakSeal = () => {
    if (busy.current || status === 'loading') return;
    busy.current = true;
    setOpening(true);
    const pack = onBreak();
    if (handle.current) {
      sfx.charge();
      handle.current.open(pack.isGodPack);
    } else {
      sfx.seal();
      if (pack.isGodPack) sfx.godPack();
      window.setTimeout(() => doneRef.current(), 250);
    }
  };

  return (
    <section className={`ritual is-${status} ${opening ? 'is-opening' : ''}`} aria-label="Ouverture du booster">
      <div className="ritual-stage">
        <canvas ref={canvasRef} className="ritual-canvas" onClick={breakSeal} aria-hidden="true" />
        {status === 'off' && (
          <button type="button" className="seal-fallback" onClick={breakSeal} tabIndex={-1} aria-hidden="true">
            <Sigil className="seal-fallback-circle" weight={0.9} />
            <span className="seal-fallback-folio"><span className="seal-fallback-wax" /></span>
          </button>
        )}
      </div>
      <p className="ritual-hint">{opening ? 'Le sceau se brise…' : 'Touchez le sceau pour ouvrir le booster.'}</p>
      <button type="button" className="btn btn-lapis" onClick={breakSeal} disabled={opening || status === 'loading'}>
        Briser le sceau
      </button>
    </section>
  );
}
