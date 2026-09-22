# 🎴 Gacha Simulator — Mushoku Tensei (UNION ARENA)

Simulateur d'ouverture de boosters **UNION ARENA [UA54BT] — Mushoku Tensei: Jobless Reincarnation**, avec animations haut de gamme : déchirure du pack, flip 3D des cartes, auras de suspense, tilt holographique, confettis et God Pack cosmique.

**⚡ Démo instantanée : ouvrir `dist/index.html` (double-clic, tout est embarqué).**

## ✨ Fonctionnalités

- **Booster 8 cartes** fidèle aux specs officielles : 5 Commons (+ AP bonus) → Uncommon → Rare → **hit SR garanti** (20 % de parallèle SRP)
- **God Pack 0,1 %** : 5 SR distinctes + fanfare + thème cosmique
- **Flip 3D** avec slow reveal sur le hit, aura dorée/arc-en-ciel
- **Tilt holographique** réactif à la souris sur les rares
- **Zoom plein écran** : cliquer une carte révélée l'affiche entière (ratio 5/7, jamais coupée)
- **Sons WebAudio** synthétisés (aucun asset externe)
- **Animations GPU** : uniquement `transform`/`opacity`, fond statique — fluide même sur petites machines
- **120 cartes** avec scans officiels et raretés exactes

## 🚀 Utilisation

### Sans rien installer (recommandé)

Ouvrir `dist/index.html` dans un navigateur. C'est un **fichier unique autonome** (HTML + JS + CSS + données inline). Seules les images viennent du CDN officiel d'UNION ARENA (connexion internet nécessaire).

### En mode dev

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # régénère dist/index.html (autonome)
npx vitest run     # tests (11)
```

## 🗂️ Sources de données

| Source | Rôle |
|---|---|
| [Cardlist officielle UNION ARENA](https://www.unionarena-tcg.com/en/cardlist/?search=true&series=589154) | 120 cartes, raretés, images HD officielles |
| [TCGCSV / TCGplayer](https://tcgcsv.com) | Prix market (optionnel — set pas encore indexé) |

Scripts :
```bash
python scripts/fetch_unionarena.py      # régénère public/data/cards.json (cardlist officielle)
python scripts/fetch_cards_tcgplayer.py # variante Weiss Schwarz (set 2022)
```

## 📁 Structure

```
├── dist/index.html          # Build autonome (ouvrable en double-clic)
├── public/data/cards.json   # Données des cartes (source de l'app)
├── src/
│   ├── lib/gacha.ts         # Algorithme de tirage (God Pack, hit SR garanti)
│   ├── lib/tiers.ts         # Classification par prix/rareté
│   ├── components/          # BoosterPack, GachaCard, CardZoomModal, GodPackOverlay…
│   └── hooks/useTilt.ts     # Tilt holographique (variables CSS, zéro re-render)
├── scripts/                 # Scrapers Python (unionarena-tcg.com, TCGCSV)
└── scraper/                 # Scraper Cardmarket (curl_cffi) — variante prix €
```

## ⚖️ Mentions

Projet non officiel, sans affiliation avec BANDAI, Bushiroad ou les ayants droit de Mushoku Tensei. Images © BANDAI (cardlist officielle UNION ARENA), utilisées à titre de référence. Prix indicatifs.
