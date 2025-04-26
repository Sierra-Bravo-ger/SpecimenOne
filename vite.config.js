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
        icons: [          {
            src: '/images/icons/frame.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable'
          },
          {
            src: '/images/icons/icon-72x72-bg.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/images/icons/icon-96x96-bg.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/images/icons/icon-144x144-bg.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/images/icons/icon-192x192-bg.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/images/icons/icon-512x512-bg.png',
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
            src: '/images/icons/icon-72x72-new.png',
            sizes: '72x72',
            type: 'image/png'
          },
          {
            src: '/images/icons/icon-96x96-new.png',
            sizes: '96x96',
            type: 'image/png'
          },
          {
            src: '/images/icons/icon-144x144-new.png',
            sizes: '144x144',
            type: 'image/png'
          },
          {
            src: '/images/icons/icon-192x192-new.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/images/icons/icon-512x512-new.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})