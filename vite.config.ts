/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
