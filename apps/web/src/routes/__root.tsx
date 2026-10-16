import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import type React from 'react'
import { useEffect } from 'react'
import { NotFound } from '@/components/NotFound'
import { getPublicConfig, publicConfigScript } from '@/utils/public-config'
import { getSupabase } from '@/utils/supabase'
import '@/style.css'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Template Web App' },
    ],
  }),
  // Runtime config for the browser, resolved on the server. It never changes
  // while the app runs, so load it once rather than on every navigation.
  loader: () => getPublicConfig(),
  staleTime: Number.POSITIVE_INFINITY,
  component: RootComponent,
  notFoundComponent: () => <NotFound />,
})

function RootComponent() {
  // Create the Supabase client on load so its token-refresh listener keeps the
  // API auth cookie current from the first page, not only after sign-in.
  useEffect(() => {
    getSupabase()
  }, [])

  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const config = Route.useLoaderData()
  return (
    <html lang="en">
      <head>
        <HeadContent />
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: JSON is escaped by publicConfigScript */}
        <script dangerouslySetInnerHTML={{ __html: publicConfigScript(config) }} />
      </head>
      <body className="antialiased font-sans bg-gray-50 text-gray-900 min-h-screen">
        {children}
        <Scripts />
      </body>
    </html>
  )
}
