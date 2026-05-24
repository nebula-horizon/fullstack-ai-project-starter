import type { QueryClient } from '@tanstack/react-query'
import Cookies from 'js-cookie'

export const AUTH_COOKIE_NAME = 'auth_token'

export function getAuthToken() {
  return Cookies.get(AUTH_COOKIE_NAME)
}

export function setAuthToken(token: string) {
  Cookies.set(AUTH_COOKIE_NAME, token, {
    expires: 7, // 7 days
    sameSite: 'Lax',
    secure: window.location.protocol === 'https:',
  })
}

export function clearAuthToken() {
  Cookies.remove(AUTH_COOKIE_NAME)
}

export function useAuth(queryClient: QueryClient) {
  const token = getAuthToken()
  const isAuthenticated = !!token

  const login = (token: string) => {
    setAuthToken(token)
    // Invalidate queries dependent on auth state
    queryClient.invalidateQueries({ queryKey: ['users', 'me'] })
  }

  const logout = () => {
    clearAuthToken()
    queryClient.invalidateQueries({ queryKey: ['users', 'me'] })
    queryClient.clear()
  }

  return {
    isAuthenticated,
    token,
    login,
    logout,
  }
}
