import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves the repo at /edgelabel/ — all asset paths must be relative
  base: './',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main:        'index.html',
        annotation:  'annotation.html',
        translation: 'translation.html',
        about:       'about.html',
        contact:     'contact.html',
        guide:       'guide.html',
        privacy:     'privacy.html',
      },
    },
  },
});
