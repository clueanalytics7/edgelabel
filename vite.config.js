import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        id: './',
        name: 'EdgeLabel — Privacy-First Data Annotation Platform',
        short_name: 'EdgeLabel',
        description: 'Label, tag entities, and translate CSV datasets entirely in your browser with zero data leakage.',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: './index.html',
        scope: './',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,csv}'],
        navigateFallback: null,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
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
        pricing:         'pricing.html',
        admin:           'admin.html',
        guide:                'guide.html',
        privacy:              'privacy.html',
        securityArchitecture: 'security-architecture.html',
      },
    },
  },
});
