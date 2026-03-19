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
        name: 'ScienceLogic EM7',
        short_name: 'SL EM7',
        description: 'ScienceLogic EM7 Event Management',
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
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
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
