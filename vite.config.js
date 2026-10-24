import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Multi-page app: each HTML file is its own entry point.
// Vite compiles JSX at build time — no Babel CDN needed at runtime.
export default defineConfig({
  plugins: [react()],
  build: {
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
