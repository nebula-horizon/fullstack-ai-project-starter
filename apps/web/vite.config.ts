import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

const API_TARGET = process.env.API_URL ?? 'http://localhost:3333'

export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      // Forward API + health requests to the AdonisJS backend in dev.
      // Prefixes match on both sides, so no path rewrite is needed.
      '/api': { target: API_TARGET, changeOrigin: true },
      '/health': { target: API_TARGET, changeOrigin: true },
    },
  },
  plugins: [
    tanstackStart(),
    viteReact(),
    tailwindcss(),
    tsconfigPaths({
      projects: ['./tsconfig.json'],
    }),
  ],
})
