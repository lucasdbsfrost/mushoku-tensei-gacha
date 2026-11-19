import * as THREE from 'three';

/*
 * Textures dessinées à la main sur un canvas 2D : pas d'image à télécharger.
 * Mêmes couleurs que le CSS (styles/base.css).
 */
export const INK = '#2A2016';
export const VELLUM = '#E6D8B8';
export const VELLUM_DEEP = '#D3C095';
export const LAPIS = '#2B4B8C';
export const GOLD = '#B0852F';
export const WAX = '#8E2A22';

function canvas(w: number, h = w): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!];
}

function texture(c: HTMLCanvasElement): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  return t;
}

/** Pseudo-aléatoire stable, pour que le dessin soit identique à chaque visite. */
function seeded(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

/** Grain du vélin : taches et fibres légères. */
function grain(g: CanvasRenderingContext2D, w: number, h: number, seed: number, amount = 900) {
  const rnd = seeded(seed);
  for (let i = 0; i < amount; i++) {
    g.fillStyle = `rgba(90, 64, 30, ${(rnd() * 0.06).toFixed(3)})`;
    const r = rnd() * 2.2 + 0.4;
    g.beginPath();
    g.arc(rnd() * w, rnd() * h, r, 0, Math.PI * 2);
    g.fill();
  }
}

/**
 * Le cercle magique, tracé en blanc sur fond transparent :
 * la couleur vient du matériau, ce qui permet de passer de l'encre au lapis.
 */
export function circleTexture(variant: 'outer' | 'inner'): THREE.CanvasTexture {
  const S = 1024, C = S / 2;
  const [c, g] = canvas(S);
  const rnd = seeded(variant === 'outer' ? 7 : 13);
  g.strokeStyle = '#fff';
  g.fillStyle = '#fff';
  g.lineCap = 'round';
  const ring = (r: number, w: number) => { g.lineWidth = w; g.beginPath(); g.arc(C, C, r, 0, Math.PI * 2); g.stroke(); };

  if (variant === 'outer') {
    ring(500, 6); ring(486, 2.5); ring(420, 2.5); ring(404, 6);
    // Bande de signes entre deux anneaux : traits courts tirés au sort.
    for (let i = 0; i < 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      g.save();
      g.translate(C + Math.sin(a) * 453, C - Math.cos(a) * 453);
      g.rotate(a);
      g.lineWidth = 3.2;
      g.beginPath();
      const strokes = 2 + Math.floor(rnd() * 3);
      for (let k = 0; k < strokes; k++) {
        const x = (rnd() - 0.5) * 22, y = (rnd() - 0.5) * 26;
        g.moveTo(x, y);
        g.lineTo(x + (rnd() - 0.5) * 18, y + (rnd() - 0.5) * 22);
      }
      g.stroke();
      if (rnd() < 0.3) { g.beginPath(); g.arc((rnd() - 0.5) * 12, (rnd() - 0.5) * 12, 3.2, 0, Math.PI * 2); g.fill(); }
      g.restore();
    }
    // Graduations
    for (let i = 0; i < 120; i++) {
      const a = (i / 120) * Math.PI * 2, r1 = 486, r2 = i % 5 === 0 ? 470 : 478;
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(C + Math.sin(a) * r1, C - Math.cos(a) * r1);
      g.lineTo(C + Math.sin(a) * r2, C - Math.cos(a) * r2);
      g.stroke();
    }
  } else {
    ring(360, 5); ring(118, 4); ring(96, 2);
    // Hexagramme et six petits cercles aux pointes
    const tri = (rot: number) => {
      g.lineWidth = 4.5;
      g.beginPath();
      for (let k = 0; k <= 3; k++) {
        const a = rot + (k * 2 * Math.PI) / 3;
        const x = C + Math.sin(a) * 360, y = C - Math.cos(a) * 360;
        if (k === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.stroke();
    };
    tri(0); tri(Math.PI);
    for (let k = 0; k < 6; k++) {
      const a = (k * Math.PI) / 3;
      g.lineWidth = 3;
      g.beginPath(); g.arc(C + Math.sin(a) * 360, C - Math.cos(a) * 360, 26, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.arc(C + Math.sin(a) * 208, C - Math.cos(a) * 208, 7, 0, Math.PI * 2); g.fill();
    }
  }
  return texture(c);
}

/** Halo doux, blanc vers transparent. */
export function glowTexture(): THREE.CanvasTexture {
  const S = 256;
  const [c, g] = canvas(S);
  const grad = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.45, 'rgba(255,255,255,0.35)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);
  return texture(c);
}

/** Ombre portée sous le pli. */
export function shadowTexture(): THREE.CanvasTexture {
  const S = 256;
  const [c, g] = canvas(S);
  const grad = g.createRadialGradient(S / 2, S / 2, S * 0.1, S / 2, S / 2, S / 2);
  grad.addColorStop(0, 'rgba(60,40,20,0.42)');
  grad.addColorStop(1, 'rgba(60,40,20,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);
  return texture(c);
}

/** Le dessus du pli scellé : vélin, double filet, titre à la plume. */
export function folioTexture(): THREE.CanvasTexture {
  const W = 640, H = 896;
  const [c, g] = canvas(W, H);
  g.fillStyle = VELLUM;
  g.fillRect(0, 0, W, H);
  const edge = g.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, H * 0.62);
  edge.addColorStop(0, 'rgba(0,0,0,0)');
  edge.addColorStop(1, 'rgba(120,85,40,0.28)');
  g.fillStyle = edge;
  g.fillRect(0, 0, W, H);
  grain(g, W, H, 3);

  g.strokeStyle = INK;
  g.lineWidth = 3; g.strokeRect(28, 28, W - 56, H - 56);
  g.lineWidth = 1.2; g.strokeRect(40, 40, W - 80, H - 80);

  g.fillStyle = INK;
  g.textAlign = 'center';
  g.font = 'italic 58px "IM Fell English", Georgia, serif';
  g.fillText('Mushoku Tensei', W / 2, H - 236);
  g.font = '30px "IM Fell English", Georgia, serif';
  g.fillText('Booster UA54BT', W / 2, H - 186);
  g.font = 'italic 26px "IM Fell English", Georgia, serif';
  g.fillStyle = 'rgba(42,32,22,0.7)';
  g.fillText('huit cartes, dont une super rare', W / 2, H - 138);
  return texture(c);
}

/** Le rabat du pli, un peu plus sombre que le corps. */
export function flapTexture(): THREE.CanvasTexture {
  const S = 512;
  const [c, g] = canvas(S);
  g.fillStyle = VELLUM_DEEP;
  g.fillRect(0, 0, S, S);
  grain(g, S, S, 9, 500);
  return texture(c);
}

/** Le sceau de cire, avec le cercle magique imprimé en creux. */
export function sealTexture(): THREE.CanvasTexture {
  const S = 256, C = S / 2;
  const [c, g] = canvas(S);
  const grad = g.createRadialGradient(C * 0.8, C * 0.7, 10, C, C, C);
  grad.addColorStop(0, '#B4473A');
  grad.addColorStop(0.7, WAX);
  grad.addColorStop(1, '#5E1913');
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);
  g.strokeStyle = 'rgba(40,8,4,0.55)';
  g.lineWidth = 5;
  g.beginPath(); g.arc(C, C, 86, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 4;
  for (const rot of [0, Math.PI]) {
    g.beginPath();
    for (let k = 0; k <= 3; k++) {
      const a = rot + (k * 2 * Math.PI) / 3;
      const x = C + Math.sin(a) * 70, y = C - Math.cos(a) * 70;
      if (k === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.stroke();
  }
  return texture(c);
}

/** Dos des cartes : lapis et cercle à la feuille d'or. */
export function cardBackTexture(): THREE.CanvasTexture {
  const W = 252, H = 352;
  const [c, g] = canvas(W, H);
  g.fillStyle = LAPIS;
  g.fillRect(0, 0, W, H);
  g.strokeStyle = GOLD;
  g.lineWidth = 4; g.strokeRect(10, 10, W - 20, H - 20);
  g.lineWidth = 3;
  g.beginPath(); g.arc(W / 2, H / 2, 82, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.arc(W / 2, H / 2, 62, 0, Math.PI * 2); g.stroke();
  for (const rot of [0, Math.PI]) {
    g.beginPath();
    for (let k = 0; k <= 3; k++) {
      const a = rot + (k * 2 * Math.PI) / 3;
      const x = W / 2 + Math.sin(a) * 62, y = H / 2 - Math.cos(a) * 62;
      if (k === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.stroke();
  }
  return texture(c);
}
