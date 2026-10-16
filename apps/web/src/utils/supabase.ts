import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { clearAuthToken, setAuthToken } from '@/utils/auth'

let client: SupabaseClient | undefined

// Browser-only Supabase client, created on first use from the runtime config
// the root route injects (see utils/public-config.ts).
export function getSupabase(): SupabaseClient {
  if (client) return client

  const config = typeof window === 'undefined' ? undefined : window.__PUBLIC_CONFIG__
  if (!config) {
    throw new Error('Supabase config is not available: getSupabase() must run in the browser')
  }

  client = createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })

  // Mirror the live Supabase access token into the auth cookie that the API
  // Bearer middleware reads. This keeps the cookie fresh across silent token
  // refreshes and sign-outs.
  client.auth.onAuthStateChange((_event, session) => {
    if (session?.access_token) {
      setAuthToken(session.access_token)
    } else {
      clearAuthToken()
    }
  })

  return client
}
