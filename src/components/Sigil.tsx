/*
 * Cercle magique dessiné en SVG : anneaux, hexagramme et graduations.
 * Sert de monogramme dans l'en-tête et de motif au dos des cartes.
 * La même figure est redessinée en 3D pour la scène d'ouverture.
 */
interface Props {
  className?: string;
  /** Épaisseur des traits, plus fine pour les petites tailles. */
  weight?: number;
}

const ticks = Array.from({ length: 48 }, (_, i) => i);

export default function Sigil({ className, weight = 1.4 }: Props) {
  const tri = (rot: number) =>
    [0, 1, 2]
      .map((k) => {
        const a = rot + (k * 2 * Math.PI) / 3;
        return `${(50 + 31 * Math.sin(a)).toFixed(2)},${(50 - 31 * Math.cos(a)).toFixed(2)}`;
      })
      .join(' ');

  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth={weight} strokeLinejoin="round">
        <circle cx="50" cy="50" r="47" />
        <circle cx="50" cy="50" r="42" strokeWidth={weight * 0.6} />
        <circle cx="50" cy="50" r="31" />
        <polygon points={tri(0)} />
        <polygon points={tri(Math.PI)} />
        <circle cx="50" cy="50" r="9" />
        {[0, 1, 2, 3, 4, 5].map((k) => {
          const a = (k * Math.PI) / 3;
          return (
            <circle key={k} cx={50 + 31 * Math.sin(a)} cy={50 - 31 * Math.cos(a)} r="3.4"
              fill="currentColor" stroke="none" />
          );
        })}
        {ticks.map((i) => {
          const a = (i / ticks.length) * 2 * Math.PI;
          const r1 = 42.5, r2 = i % 4 === 0 ? 46.5 : 44.5;
          return (
            <line key={i} strokeWidth={weight * 0.55}
              x1={50 + r1 * Math.sin(a)} y1={50 - r1 * Math.cos(a)}
              x2={50 + r2 * Math.sin(a)} y2={50 - r2 * Math.cos(a)} />
          );
        })}
      </g>
    </svg>
  );
}
