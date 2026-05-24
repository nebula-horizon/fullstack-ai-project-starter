import { createClient } from '@supabase/supabase-js'
import { clearAuthToken, setAuthToken } from '@/utils/auth'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Mirror the live Supabase access token into the auth cookie that the API
// Bearer middleware reads. This keeps the cookie fresh across silent token
// refreshes and sign-outs. SSR has no browser session, so only run in browser.
if (typeof document !== 'undefined') {
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.access_token) {
      setAuthToken(session.access_token)
    } else {
      clearAuthToken()
    }
  })
}
