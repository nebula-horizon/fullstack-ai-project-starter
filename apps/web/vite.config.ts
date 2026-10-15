import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig(({ mode }) => {
  // Load apps/web/.env into the server's process.env for local development.
  // These are server-side runtime values (no VITE_ prefix), so Vite never
  // compiles them into the browser bundle. Real environment variables win.
  for (const [key, value] of Object.entries(loadEnv(mode, process.cwd(), ''))) {
    process.env[key] ??= value
  }
  const API_TARGET = process.env.API_URL ?? 'http://localhost:3333'

  return {
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
  }
})
