import * as THREE from 'three';
import { sfx } from '../lib/audio';
import {
  cardBackTexture, circleTexture, flapTexture, folioTexture, glowTexture, sealTexture, shadowTexture,
  GOLD, INK, LAPIS, VELLUM, WAX,
} from './textures';

/*
 * La scène d'ouverture : un pli scellé à la cire, posé sur un cercle magique.
 * Au clic, le cercle se charge, le sceau se brise, le rabat s'ouvre et
 * les cartes s'envolent. Ensuite la page affiche les cartes en HTML.
 */

export interface RitualHandle {
  open(isGodPack: boolean): void;
  setActive(active: boolean): void;
  dispose(): void;
}

// Couleurs données telles quelles, comme dans le CSS.
THREE.ColorManagement.enabled = false;

const W = 2.0, H = 2.8, FLAP = 1.35;           // taille du pli et profondeur du rabat
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => { x = clamp01(x); return x * x * (3 - 2 * x); };
const outCubic = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);

export function startRitual(canvas: HTMLCanvasElement, onDone: () => void): RitualHandle | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  const disposables: { dispose(): void }[] = [];
  const keep = <T extends { dispose(): void }>(x: T) => { disposables.push(x); return x; };

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  scene.add(new THREE.HemisphereLight(0xfff6e4, 0xb9a57c, 0.62 * Math.PI));
  const sun = new THREE.DirectionalLight(0xffffff, 0.42 * Math.PI);
  sun.position.set(-3, 8, 4);
  scene.add(sun);

  const cInk = new THREE.Color(INK), cLapis = new THREE.Color(LAPIS);
  const cGold = new THREE.Color(GOLD), cWax = new THREE.Color(WAX);

  // --- Cercle magique (deux anneaux qui tournent en sens inverse) + halo ---
  const ground = (tex: THREE.Texture, size: number, opacity: number) => {
    const mat = keep(new THREE.MeshBasicMaterial({ map: keep(tex), transparent: true, opacity, depthWrite: false }));
    const mesh = new THREE.Mesh(keep(new THREE.PlaneGeometry(size, size)), mat);
    mesh.rotation.x = -Math.PI / 2;
    scene.add(mesh);
    return { mesh, mat };
  };
  const glow = ground(glowTexture(), 7.5, 0);
  glow.mesh.position.y = 0.002;
  const outer = ground(circleTexture('outer'), 5.6, 0.5);
  outer.mesh.position.y = 0.004;
  const inner = ground(circleTexture('inner'), 5.6, 0.5);
  inner.mesh.position.y = 0.006;
  const shadow = ground(shadowTexture(), 3.6, 0.85);
  shadow.mesh.position.y = 0.008;
  shadow.mesh.scale.set(0.8, 1.05, 1);

  // --- Le pli scellé ---
  const folio = new THREE.Group();
  scene.add(folio);
  const vellum = new THREE.Color(VELLUM);
  const edgeMat = keep(new THREE.MeshLambertMaterial({ color: vellum.clone().multiplyScalar(0.86) }));
  const topMat = keep(new THREE.MeshLambertMaterial({ map: keep(folioTexture()) }));
  const body = new THREE.Mesh(keep(new THREE.BoxGeometry(W, 0.04, H)),
    [edgeMat, edgeMat, topMat, edgeMat, edgeMat, edgeMat]);
  folio.add(body);

  // Le rabat : un triangle accroché au bord supérieur, qui pivote pour s'ouvrir.
  const hinge = new THREE.Group();
  hinge.position.set(0, 0.022, -H / 2);
  folio.add(hinge);
  const flapShape = new THREE.Shape();
  flapShape.moveTo(-W / 2, 0);
  flapShape.lineTo(W / 2, 0);
  flapShape.lineTo(0, FLAP);
  flapShape.closePath();
  const flapGeo = keep(new THREE.ShapeGeometry(flapShape));
  flapGeo.rotateX(Math.PI / 2);   // à plat, pointe vers +z
  const flapUv = flapGeo.attributes.uv;
  for (let i = 0; i < flapUv.count; i++) flapUv.setXY(i, flapUv.getX(i) / W + 0.5, flapUv.getY(i) / FLAP);
  const flapMat = keep(new THREE.MeshLambertMaterial({ map: keep(flapTexture()), side: THREE.DoubleSide }));
  const flap = new THREE.Mesh(flapGeo, flapMat);
  flap.position.y = 0.002;
  hinge.add(flap);
  const flapEdge = new THREE.LineSegments(keep(new THREE.EdgesGeometry(flapGeo)),
    keep(new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.55 })));
  flapEdge.position.y = 0.003;
  hinge.add(flapEdge);

  // Le sceau : deux moitiés qui se séparent à l'ouverture.
  const sealMat = keep(new THREE.MeshLambertMaterial({ map: keep(sealTexture()) }));
  const sealSideMat = keep(new THREE.MeshLambertMaterial({ color: WAX }));
  const halves = [0, 1].map((k) => {
    const geo = keep(new THREE.CylinderGeometry(0.3, 0.32, 0.09, 40, 1, false, k * Math.PI, Math.PI));
    const m = new THREE.Mesh(geo, [sealSideMat, sealMat, sealSideMat]);
    m.position.set(0, 0.05, FLAP - 0.12);
    hinge.add(m);
    return { mesh: m, vel: new THREE.Vector3(), spin: 0 };
  });

  // Les cartes, cachées dans le pli jusqu'à l'ouverture.
  const backTex = keep(cardBackTexture());
  const cardGeo = keep(new THREE.PlaneGeometry(0.72, 1.0));
  const cards = Array.from({ length: 8 }, () => {
    const mat = keep(new THREE.MeshBasicMaterial({ map: backTex, transparent: true, opacity: 0, side: THREE.DoubleSide }));
    const m = new THREE.Mesh(cardGeo, mat);
    m.visible = false;
    scene.add(m);
    return { mesh: m, mat };
  });

  // Paillettes d'or au moment de l'ouverture.
  const SPARKS = 140;
  const sparkPos = new Float32Array(SPARKS * 3);
  const sparkVel = Array.from({ length: SPARKS }, () => new THREE.Vector3());
  const sparkGeo = keep(new THREE.BufferGeometry());
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
  const sparkMat = keep(new THREE.PointsMaterial({ color: GOLD, size: 0.06, transparent: true, opacity: 0 }));
  const sparks = new THREE.Points(sparkGeo, sparkMat);
  sparks.visible = false;
  scene.add(sparks);

  // --- Cadrage : tout le cercle visible, quelle que soit la forme de l'écran ---
  let width = 0, height = 0;
  const lookAt = new THREE.Vector3(0, 0.35, 0.1);
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h || (w === width && h === height)) return;
    width = w; height = h;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const half = THREE.MathUtils.degToRad(camera.fov / 2);
    const fit = 2.9;                       // rayon à garder dans le cadre
    const dist = fit / Math.tan(half) / Math.min(1, camera.aspect) * 1.02;
    camera.position.copy(lookAt).add(new THREE.Vector3(0, 0.84, 0.54).normalize().multiplyScalar(dist));
    camera.lookAt(lookAt);
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  // Inclinaison du pli qui suit le pointeur.
  let px = 0, py = 0;
  const onMove = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    px = ((e.clientX - r.left) / r.width) * 2 - 1;
    py = ((e.clientY - r.top) / r.height) * 2 - 1;
  };
  canvas.addEventListener('pointermove', onMove);

  // --- Animation ---
  let active = true, alive = true, raf = 0, last = performance.now(), time = 0;
  let openAt = -1, god = false, broke = false, burst = false, finished = false;
  const still = reduceMotion();

  function startBurst() {
    sparks.visible = true;
    for (let i = 0; i < SPARKS; i++) {
      sparkPos.set([(Math.random() - 0.5) * 0.8, 0.3, (Math.random() - 0.5) * 1.2], i * 3);
      const a = Math.random() * Math.PI * 2, s = 0.6 + Math.random() * 1.8;
      sparkVel[i].set(Math.cos(a) * s, 2 + Math.random() * 2.6, Math.sin(a) * s);
    }
    cards.forEach((c, i) => { c.mesh.visible = i < (god ? 5 : 8); });
  }

  function frame() {
    if (!alive) return;
    raf = requestAnimationFrame(frame);
    if (!active) { last = performance.now(); return; }
    resize();
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    time += dt;

    const t = openAt < 0 ? -1 : time - openAt;          // temps depuis le clic
    const charge = t < 0 ? 0 : smooth(t / 0.7);
    const bloom = t < 0 ? 0 : smooth((t - 1.0) / 0.5);
    const accent = god ? cWax : cLapis;

    // Cercle : encre pâle au repos, lapis à la charge, or (ou rouge) à l'ouverture.
    const circleColor = cInk.clone().lerp(accent, charge).lerp(god ? cWax : cGold, bloom * 0.85);
    outer.mat.color.copy(circleColor);
    inner.mat.color.copy(circleColor);
    outer.mat.opacity = 0.42 + charge * 0.5;
    inner.mat.opacity = 0.42 + charge * 0.5;
    glow.mat.color.copy(accent).lerp(god ? cWax : cGold, bloom);
    glow.mat.opacity = charge * 0.32 + bloom * 0.18 - smooth((t - 2.0) / 0.5) * 0.3;
    const spin = still ? 0 : 0.05 + charge * 0.9 + bloom * 0.6;
    outer.mesh.rotation.z += spin * dt;
    inner.mesh.rotation.z -= spin * 1.4 * dt;

    // Le pli flotte, frémit pendant la charge, puis se pose.
    const bob = still ? 0 : Math.sin(time * 1.6) * 0.04;
    const lift = charge * 0.3 * (1 - bloom * 0.6);
    folio.position.y = 0.12 + bob + lift;
    const shake = t >= 0 && t < 0.75 && !still ? (Math.random() - 0.5) * 0.04 * charge : 0;
    folio.rotation.set(-py * 0.08 + shake, px * 0.12, -0.06 + shake);
    shadow.mat.opacity = 0.85 - lift * 1.2;
    shadow.mesh.scale.set(0.8 + lift * 0.3, 1.05 + lift * 0.3, 1);

    // Le sceau se brise.
    if (t >= 0.7 && !broke) {
      broke = true;
      sfx.seal();
      halves.forEach((h, k) => {
        scene.attach(h.mesh);
        h.vel.set(k ? 1.4 : -1.4, 2.2, 0.6);
        h.spin = k ? 6 : -6;
      });
    }
    if (broke) {
      halves.forEach((h) => {
        h.vel.y -= 9 * dt;
        h.mesh.position.addScaledVector(h.vel, dt);
        h.mesh.rotation.z += h.spin * dt;
        if (h.mesh.position.y < -2) h.mesh.visible = false;
      });
    }

    // Le rabat s'ouvre vers l'arrière.
    hinge.rotation.x = -2.7 * outCubic((t - 0.75) / 0.6);

    // Les cartes sortent, s'éventaillent, puis s'envolent vers le visiteur.
    if (t >= 1.05 && !burst) {
      burst = true;
      startBurst();
      if (god) sfx.godPack();
    }
    if (burst) {
      const n = god ? 5 : 8;
      cards.forEach((c, i) => {
        if (i >= n) return;
        const k = (i - (n - 1) / 2);
        const rise = outCubic((t - 1.05 - i * 0.04) / 0.55);
        const away = smooth((t - 1.75 - i * 0.03) / 0.55);
        c.mesh.position.set(
          k * 0.42 * rise,
          folio.position.y + 0.1 + rise * (1.4 - Math.abs(k) * 0.08) + away * 1.6,
          -0.2 + rise * 0.3 + away * 2.4,
        );
        c.mesh.rotation.set(-0.5 - away * 0.4, 0, -k * 0.09 * rise);
        c.mat.opacity = Math.min(rise * 1.4, 1) * (1 - away);
      });
      sparkMat.opacity = 1 - smooth((t - 1.6) / 0.9);
      for (let i = 0; i < SPARKS; i++) {
        sparkVel[i].y -= 2.2 * dt;
        sparkPos[i * 3] += sparkVel[i].x * dt;
        sparkPos[i * 3 + 1] += sparkVel[i].y * dt;
        sparkPos[i * 3 + 2] += sparkVel[i].z * dt;
      }
      sparkGeo.attributes.position.needsUpdate = true;
    }

    if (t >= 2.45 && !finished) {
      finished = true;
      onDone();
    }

    renderer.render(scene, camera);
  }

  // Le titre du pli est dessiné avec la police du site : on attend qu'elle soit là.
  if (document.fonts?.load) {
    Promise.all([
      document.fonts.load('italic 58px "IM Fell English"'),
      document.fonts.load('30px "IM Fell English"'),
    ]).then(() => {
      if (!alive) return;
      const fresh = folioTexture();
      keep(fresh);
      topMat.map = fresh;
      topMat.needsUpdate = true;
    }).catch(() => { /* la police de secours suffit */ });
  }

  resize();
  frame();

  return {
    open(isGodPack) {
      if (openAt >= 0) return;
      god = isGodPack;
      if (still) {
        sfx.seal();
        if (god) sfx.godPack();
        finished = true;
        window.setTimeout(onDone, 150);
        return;
      }
      openAt = time;
    },
    setActive(value) { active = value; },
    dispose() {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('pointermove', onMove);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
    },
  };
}
