import type { Tier } from '../types';

export interface TierMeta {
  label: string;
  badge: string; // classes du badge rareté
  face: string; // dégradé de la face générée
  ring: string; // liseré de la carte
  glow: string; // halo sous la carte
  confetti: string[]; // couleurs des confettis
}

export const TIER_META: Record<Tier, TierMeta> = {
  Common: {
    label: 'Common',
    badge: 'bg-slate-700/80 text-slate-200 border-slate-400/40',
    face: 'from-slate-600 via-slate-700 to-slate-900',
    ring: 'ring-slate-400/30',
    glow: 'shadow-[0_0_18px_rgba(148,163,184,0.25)]',
    confetti: ['#94a3b8', '#cbd5e1', '#64748b'],
  },
  Uncommon: {
    label: 'Uncommon / Rare',
    badge: 'bg-emerald-800/80 text-emerald-100 border-emerald-300/40',
    face: 'from-emerald-700 via-emerald-800 to-slate-900',
    ring: 'ring-emerald-300/40',
    glow: 'shadow-[0_0_22px_rgba(52,211,153,0.35)]',
    confetti: ['#34d399', '#a7f3d0', '#059669'],
  },
  SuperRare: {
    label: 'Super Rare',
    badge: 'bg-amber-700/85 text-amber-50 border-amber-300/50',
    face: 'from-amber-500 via-orange-600 to-slate-900',
    ring: 'ring-amber-300/60',
    glow: 'shadow-[0_0_30px_rgba(251,191,36,0.5)]',
    confetti: ['#fbbf24', '#f59e0b', '#fde68a', '#fb923c'],
  },
  UltraRare: {
    label: 'Ultra Rare',
    badge: 'bg-fuchsia-800/85 text-fuchsia-50 border-fuchsia-300/60',
    face: 'from-fuchsia-600 via-purple-700 to-indigo-950',
    ring: 'ring-fuchsia-300/70',
    glow: 'shadow-[0_0_36px_rgba(232,121,249,0.6)]',
    confetti: ['#e879f9', '#f0abfc', '#a855f7', '#38bdf8', '#fde047'],
  },
};

export function formatEuro(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}
