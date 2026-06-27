/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa-icon.svg'],
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
      },
      manifest: {
        name: 'HANS COFFRAGE ERP',
        short_name: 'HANS ERP',
        description: 'ERP de production HANS COFFRAGE',
        theme_color: '#1F4E4A',
        background_color: '#FFF8E1',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    // Clé publishable (publique) fournie aux tests → indépendants des fichiers .env (CI).
    env: {
      VITE_SUPABASE_URL: 'https://qjmofktujdyxlmvzoklh.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_wU2IRlJGmrWHYK20HjBOAQ_51fxCnSW',
    },
  },
});
