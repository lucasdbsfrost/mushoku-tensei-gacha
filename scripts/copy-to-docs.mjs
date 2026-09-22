/**
 * Copie dist/index.html vers docs/index.html pour GitHub Pages.
 * (GitHub Pages n'accepte que / ou /docs comme dossier source.)
 */
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
mkdirSync(join(root, 'docs'), { recursive: true });
copyFileSync(join(root, 'dist', 'index.html'), join(root, 'docs', 'index.html'));
console.log('✓ docs/index.html prêt pour GitHub Pages');
