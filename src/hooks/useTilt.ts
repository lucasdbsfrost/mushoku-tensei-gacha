import { useCallback, useRef } from 'react';

/*
 * Inclinaison 3D et reflet qui suit le pointeur, pour les cartes précieuses.
 * Écrit des variables CSS (--rx, --ry, --mx, --my) : aucun rendu React.
 */
export function useTilt<T extends HTMLElement>(maxDeg = 10) {
  const raf = useRef(0);

  const onPointerMove = useCallback((e: React.PointerEvent<T>) => {
    if (e.pointerType !== 'mouse') return;
    const el = e.currentTarget;
    const { clientX, clientY } = e;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      const px = (clientX - r.left) / r.width;
      const py = (clientY - r.top) / r.height;
      el.style.setProperty('--rx', `${(-(py - 0.5) * 2 * maxDeg).toFixed(2)}deg`);
      el.style.setProperty('--ry', `${((px - 0.5) * 2 * maxDeg).toFixed(2)}deg`);
      el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
      el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
    });
  }, [maxDeg]);

  const onPointerLeave = useCallback((e: React.PointerEvent<T>) => {
    cancelAnimationFrame(raf.current);
    const el = e.currentTarget;
    el.style.removeProperty('--rx');
    el.style.removeProperty('--ry');
    el.style.removeProperty('--mx');
    el.style.removeProperty('--my');
  }, []);

  return { onPointerMove, onPointerLeave };
}
