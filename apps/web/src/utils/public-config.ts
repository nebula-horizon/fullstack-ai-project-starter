import { createServerFn } from '@tanstack/react-start'

// Configuration the browser needs, resolved by the web server at runtime from
// its own environment (ECS injects it in dev/prod; vite.config.ts loads
// apps/web/.env locally). Nothing here is compiled into the bundle, so one
// image serves every environment. Only public values belong here — never the
// Supabase service-role key.
export type PublicConfig = {
  supabaseUrl: string
  supabaseAnonKey: string
}

declare global {
  interface Window {
    __PUBLIC_CONFIG__?: PublicConfig
  }
}

export const getPublicConfig = createServerFn({ method: 'GET' }).handler((): PublicConfig => {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in the web server environment')
  }
  return { supabaseUrl, supabaseAnonKey }
})

// Inline script that hands the config to the browser before the app hydrates.
// `<` is escaped so a value can never close the script tag.
export function publicConfigScript(config: PublicConfig) {
  return `window.__PUBLIC_CONFIG__=${JSON.stringify(config).replace(/</g, '\\u003c')}`
}
