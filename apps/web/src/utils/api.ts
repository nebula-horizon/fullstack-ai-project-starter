import type { paths } from '@template/contracts'
import createFetchClient from 'openapi-fetch'
import createClient from 'openapi-react-query'
import { getAuthToken } from '@/utils/auth'

export const fetchClient = createFetchClient<paths>({
  baseUrl: '/', // Works automatically through vite proxy in dev, and relative mapping in prod
})

// Attach the JWT from the client-side cookie to every outgoing request as a
// Bearer token. Guarded for SSR, where there is no document to read cookies from.
fetchClient.use({
  onRequest({ request }) {
    if (typeof document === 'undefined') {
      return request
    }

    const token = getAuthToken()
    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`)
    }

    return request
  },
})

export const $api = createClient(fetchClient)
