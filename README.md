# Mushoku Tensei, simulateur de boosters

Un simulateur d'ouverture de boosters UNION ARENA pour la série Mushoku Tensei
(UA54BT), que j'ai fait pour le plaisir et pour m'entraîner.

Le site est en ligne ici : https://lucasdbsfrost.github.io/mushoku-tensei-gacha/

## Ce qu'on y fait

On brise le sceau d'un booster posé sur un cercle magique, les huit cartes
s'envolent, puis on les retourne une à une. La dernière est toujours une super
rare. Une fois sur mille, c'est un God Pack : cinq super rares d'un coup.

Chaque carte tirée rejoint l'album, qui reprend les 120 cartes du set dans
l'ordre de leur numéro, avec le nombre de boosters ouverts, de super rares et
de doublons. L'album est gardé dans le navigateur : rien n'est envoyé nulle part.

## L'idée graphique

Je voulais que le site ressemble à un grimoire de l'univers de Mushoku Tensei :
du vélin, de l'encre, le bleu lapis des manuscrits enluminés, et la feuille
d'or réservée aux super rares. Le booster devient un pli scellé à la cire.

Seule l'ouverture est en 3D (three.js), et le code 3D n'est chargé qu'à ce
moment-là. Le reste est du HTML léger, pour rester fluide sur téléphone. Les
sons sont synthétisés en direct, sans aucun fichier audio.

## Comment c'est fait

- React et TypeScript, assemblés avec Vite
- la logique de tirage est dans `src/lib/gacha.ts`, avec ses tests dans `gacha.test.ts`
- la scène 3D est dans `src/three/`
- l'album et les statistiques sont dans `src/lib/collection.ts`
- les données des cartes viennent de `public/data/cards.json`, générées par
  `scripts/fetch_unionarena.py` depuis la cardlist officielle

```bash
npm ci        # installe exactement les versions prévues
npm run dev   # le site en local
npm test      # les tests du tirage et de l'album
```

Le site est republié automatiquement par GitHub Actions à chaque envoi sur `main`.

## Côté sécurité

Comme pour mon portfolio : les polices et three.js sont servis par le site
lui-même, une Content-Security-Policy n'autorise que le site et les images de
la cardlist officielle, les versions des dépendances sont figées, et la
publication tourne avec le minimum de droits.

## À savoir

La composition des boosters suit les règles officielles (cinq communes, une
peu commune, une rare, une super rare). Les taux des cartes AP et des
parallèles ne sont pas publiés par Bandai : ceux du simulateur sont des
estimations.

Projet non officiel, sans lien avec BANDAI ni les ayants droit de Mushoku
Tensei. Les images des cartes sont chargées depuis la cardlist officielle
UNION ARENA.
