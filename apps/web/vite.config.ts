import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'WalletWise',
        short_name: 'WalletWise',
        description: 'Know what you can spend today. Spending, budgets and savings goals for hostel life.',
        theme_color: '#0a0b09',
        background_color: '#0a0b09',
        id: '/app',
        display: 'standalone',
        // The installed app opens on the dashboard, never the marketing page.
        start_url: '/app',
        scope: '/',
        categories: ['finance', 'productivity'],
        shortcuts: [{ name: 'Add expense', short_name: 'Add', url: '/app?add=1' }],
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Never cache API responses in the service worker; offline data lives in IndexedDB.
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
});
