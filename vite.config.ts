import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Build autonome : JS + CSS inline dans un seul index.html ouvrable en file://
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  base: './',
});
