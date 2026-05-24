import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import type React from 'react'
import { NotFound } from '@/components/NotFound'
import '@/style.css'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Template Web App' },
    ],
  }),
  component: RootComponent,
  notFoundComponent: () => <NotFound />,
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="antialiased font-sans bg-gray-50 text-gray-900 min-h-screen">
        {children}
        <Scripts />
      </body>
    </html>
  )
}
