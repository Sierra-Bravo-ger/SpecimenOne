import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const DAY = 24 * 60 * 60

// Icons des Web-App-Manifests (maskable mit Rand „-b“, any ohne)
const ICON_SIZES = [72, 96, 144, 152, 192, 384, 512]
const icons = [
  { src: '/images/icons/frame1.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
  ...ICON_SIZES.map((s) => ({ src: `/images/icons/icon-${s}x${s}-b.png`, sizes: `${s}x${s}`, type: 'image/png', purpose: 'maskable' })),
  { src: '/images/icons/component.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
  ...ICON_SIZES.map((s) => ({ src: `/images/icons/icon_${s}x${s}.png`, sizes: `${s}x${s}`, type: 'image/png', purpose: 'any' })),
]

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'images/**/*', 'fonts/**/*'],
      // Einziges Manifest: vite-plugin-pwa erzeugt /manifest.webmanifest, verlinkt es
      // in index.html und cacht es vorab (public/manifest.json gibt es nicht mehr).
      manifest: {
        id: '/',
        name: 'SpecimenOne',
        short_name: 'SpecimenOne',
        description: 'Offline-fähiges Labor-Test-Menü für medizinische Einrichtungen',
        lang: 'de',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#6abf7b',
        background_color: '#6abf7b',
        icons,
      },
      workbox: {
        navigateFallback: '/index.html',
        // /api/docs (Swagger UI) und /api/openapi.json sind serverseitige Seiten, keine App-Routen:
        // Navigationen unter /api/ dürfen nicht auf die App (index.html) umgeleitet werden.
        // /datenschutz.html ist eine eigenständige statische Seite (public/), keine App-Route.
        navigateFallbackDenylist: [/^\/api\//, /^\/datenschutz\.html$/],
        // Alle Build-Chunks werden vorab gecacht, auch der Grafik-Chunk (TimelineView
        // mit @nivo, ca. 280 kB). Er wird weiterhin erst beim Öffnen der Grafiken
        // geladen (React.lazy), steht dann aber auch offline bereit.
        // Größte Datei ist index-*.js mit ca. 400 kB, das Workbox-Limit von 2 MiB
        // (maximumFileSizeToCacheInBytes) reicht.
        runtimeCaching: [
          {
            // Auffangnetz für /assets/-Dateien, die nicht im Precache stehen
            // (z.B. Chunks einer älteren Version in einem noch offenen Tab).
            urlPattern: ({ url }) => url.pathname.startsWith('/assets/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'lazy-assets',
              expiration: { maxEntries: 20 },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            // API: sofort aus dem Cache antworten, im Hintergrund aktualisieren.
            // Die Daten ändern sich praktisch nie; ohne Online-Besuch bleiben sie
            // 30 Tage offline verfügbar. /api/health ist ausgenommen, weil
            // useOnlineStatus damit die echte Erreichbarkeit prüft. /api/docs* und
            // /api/openapi* (Doku, Spezifikation) gehören nicht in den Daten-Cache.
            urlPattern: ({ url }) => url.pathname.startsWith('/api/')
              && url.pathname !== '/api/health'
              && !url.pathname.startsWith('/api/docs')
              && !url.pathname.startsWith('/api/openapi'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-cache',
              cacheableResponse: { statuses: [200] },
              expiration: {
                maxAgeSeconds: 30 * DAY,
                maxEntries: 200,
              },
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
