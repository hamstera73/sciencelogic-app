import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/sciencelogic-app/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'ScienceLogic',
        short_name: 'ScienceLogic',
        description: 'ScienceLogic Event Management',
        theme_color: '#0e1e38',
        background_color: '#0a1628',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/sciencelogic-app/',
        start_url: '/sciencelogic-app/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        // Force clients to use the new service worker immediately
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // Bust cache by adding build timestamp
        additionalManifestEntries: [],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\/api\//,
            handler: 'NetworkFirst',
            options: { cacheName: 'sl-api-cache', networkTimeoutSeconds: 10 }
          }
        ]
      }
    })
  ]
})
