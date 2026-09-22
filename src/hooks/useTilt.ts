import { useCallback, useRef } from 'react';

/**
 * Tilt 3D + position holographique.
 * Écrit des variables CSS sur l'élément :
 *   --rx/--ry : rotation (deg)   --mx/--my : position souris (0-100)
 * Le CSS (.tilt-body / .holo-sheen) les consomme — aucun re-render React.
 */
export function useTilt<T extends HTMLElement>(maxDeg = 12) {
  const raf = useRef<number | null>(null);

  const apply = useCallback(
    (el: T, clientX: number, clientY: number) => {
      const rect = el.getBoundingClientRect();
      const px = (clientX - rect.left) / rect.width; // 0..1
      const py = (clientY - rect.top) / rect.height; // 0..1
      const ry = (px - 0.5) * 2 * maxDeg;
      const rx = -(py - 0.5) * 2 * maxDeg;
      el.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
      el.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
      el.style.setProperty('--mx', `${(px * 100).toFixed(1)}`);
      el.style.setProperty('--my', `${(py * 100).toFixed(1)}`);
    },
    [maxDeg],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<T>) => {
      const el = e.currentTarget;
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => apply(el, e.clientX, e.clientY));
    },
    [apply],
  );

  const onPointerLeave = useCallback((e: React.PointerEvent<T>) => {
    const el = e.currentTarget;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
    el.style.setProperty('--mx', '50');
    el.style.setProperty('--my', '50');
  }, []);

  return { tiltHandlers: { onPointerMove, onPointerLeave } };
}
