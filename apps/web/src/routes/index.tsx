import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowRight, LogOut, ShieldAlert, User as UserIcon } from 'lucide-react'
import { $api } from '@/utils/api'
import { useAuth } from '@/utils/auth'
import { getSupabase } from '@/utils/supabase'

export const Route = createFileRoute('/')({
  component: IndexPage,
})

function IndexPage() {
  const queryClient = useQueryClient()
  const { isAuthenticated, logout } = useAuth(queryClient)
  const navigate = useNavigate()

  // Will hit the vite proxy which sends the auth cookie (js-cookie handles same domain)
  const {
    data: user,
    isLoading,
    error,
  } = $api.useQuery(
    'get',
    '/api/v1/users/me',
    {},
    {
      enabled: isAuthenticated,
    }
  )

  const handleLogout = async () => {
    await getSupabase().auth.signOut()
    logout()
    navigate({ to: '/login' })
  }

  if (isLoading && isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-500 text-lg font-medium animate-pulse">Loading dashboard...</p>
      </div>
    )
  }

  if (error || !isAuthenticated || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="max-w-md w-full bg-white shadow-2xl rounded-2xl p-10 space-y-8 border border-gray-100">
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 text-blue-600">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Welcome Back</h1>
            <p className="text-gray-500 text-sm">Please sign in to access your secure dashboard.</p>
          </div>

          <div className="pt-4">
            <Link
              to="/login"
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ease-in-out transform hover:-translate-y-0.5"
            >
              Sign In to Continue
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center text-white">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">VibeStack</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5" />
                {user?.email || 'User'}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm font-medium text-gray-500 hover:text-gray-700 cursor-pointer transition-colors flex items-center gap-1"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
          <div className="border-b border-gray-200 pb-6 mb-6">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Dashboard Overview
            </h2>
            <p className="mt-2 text-gray-500 text-lg">
              You have successfully authenticated via standard CSR architecture.
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
              Your Profile Data
            </h3>
            <pre className="text-sm text-gray-800 font-mono overflow-x-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        </div>
      </main>
    </div>
  )
}
