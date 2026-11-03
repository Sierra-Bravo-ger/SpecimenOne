import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'images/**/*', 'fonts/**/*'],
      manifest: {
        name: 'SpecimenOne',
        short_name: 'SpecimenOne',
        description: 'Offline-fähige Labor-Test-Verwaltung',
        theme_color: '#6abf7b',
        background_color: '#ffffff',
        icons: [
          {
            src: '/images/icons/frame1.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable'
          },
          {
            src: '/images/icons/icon-72x72-b.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/images/icons/icon-96x96-b.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/images/icons/icon-144x144-b.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/images/icons/icon-192x192-b.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/images/icons/icon-512x512-b.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/images/icons/component.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/images/icons/icon_72x72.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/images/icons/icon_96x96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/images/icons/icon_144x144.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/images/icons/icon_192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/images/icons/icon_512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        navigateFallback: '/index.html',
        // Den großen Grafik-Chunk (@nivo) nicht vorab cachen: Er wird erst beim
        // Öffnen der Grafiken-Ansicht geladen und dann zur Laufzeit gecacht.
        globIgnores: ['**/TimelineView-*.js'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/assets/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'lazy-assets',
              expiration: { maxEntries: 20 }
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxAgeSeconds: 86400  // 1 Stunde
              },
              networkTimeoutSeconds: 10
            },
          },
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: { cacheName: 'html-cache' }
          }
        ]
      }
    })
  ],
  test: {
    include: ['src/**/*.test.{js,jsx}'],
  },
  server: {
    proxy: {
      '/api': process.env.API_PROXY_TARGET || 'http://localhost:3001'
    }
  }
})
