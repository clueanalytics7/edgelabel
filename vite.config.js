import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  base: './',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main:        'index.html',
        annotation:  'annotation.html',
        translation:     'translation.html',
        imageAnnotation: 'image-annotation.html',
        about:           'about.html',
        contact:         'contact.html',
        guide:                'guide.html',
        privacy:              'privacy.html',
        securityArchitecture: 'security-architecture.html',
      },
    },
  },
});
