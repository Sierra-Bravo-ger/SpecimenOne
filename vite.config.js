import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'images/**/*', 'fonts/**/*', '*.json'],
      manifest: {
        name: 'SpecimenOne',
        short_name: 'SpecimenOne',
        description: 'Offline-fähige Labor-Test-Verwaltung',
        theme_color: '#6abf7b',
        background_color: '#ffffff',
        icons: [
          {
            src: '/images/icons/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png'
          },
          {
            src: '/images/icons/icon-96x96.png',
            sizes: '96x96',
            type: 'image/png'
          },
          {
            src: '/images/icons/icon-144x144.png',
            sizes: '144x144',
            type: 'image/png'
          },
          {
            src: '/images/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/images/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /\.(js|css|html)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'specimen-one-assets'
            },
          },
          {
            urlPattern: /(tests|profile|material|einheiten|referenzwerte)\.json$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'specimen-one-data',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 // 24 Stunden
              }
            },
          }
        ],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2}'],
      }
    }),
  ],
})