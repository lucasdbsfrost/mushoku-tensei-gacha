import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Politique de sécurité du contenu, ajoutée au site publié.
// Tout vient du site lui-même, sauf les images des cartes, chargées
// depuis la cardlist officielle UNION ARENA.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "font-src 'self'",
  "img-src 'self' data: blob: https://www.unionarena-tcg.com",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ');

function securityMeta(): Plugin {
  return {
    name: 'security-meta',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '<!-- securite -->',
        `<meta http-equiv="Content-Security-Policy" content="${CSP}">\n    <meta name="referrer" content="strict-origin-when-cross-origin">`,
      );
    },
  };
}

export default defineConfig({
  base: './', // le site vit dans un sous-dossier : lucasdbsfrost.github.io/mushoku-tensei-gacha/
  plugins: [react(), securityMeta()],
  build: {
    sourcemap: false,
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 700, // three.js, chargé seulement pour l'ouverture
  },
});
