import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const base = mode === 'github-pages' ? '/ege-teacher-helper/' : '/';
  return {
    base,
    plugins: [react(), VitePWA({
      registerType: 'prompt',
      injectRegister: 'auto',
      manifest: {
        name: 'Помощник проверки ЕГЭ по китайскому языку',
        short_name: 'Проверка ЕГЭ',
        description: 'Баллы и справка для проверки письменной и устной части ЕГЭ по китайскому языку.',
        lang: 'ru',
        theme_color: '#294738',
        background_color: '#f7f8f3',
        display: 'standalone',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
        navigateFallback: `${base}index.html`,
        cleanupOutdatedCaches: true,
        clientsClaim: false,
        skipWaiting: false,
      },
    })],
    test: { environmentOptions: { jsdom: { url: 'http://localhost/' } } },
  };
});
