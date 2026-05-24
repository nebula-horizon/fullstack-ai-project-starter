import { Link } from '@tanstack/react-router'
import { AlertCircle, Home } from 'lucide-react'

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-10 text-center space-y-6 border border-gray-100">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            404 - Page Not Found
          </h1>
          <p className="text-gray-500 text-sm">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>
        <div className="pt-4">
          <Link
            to="/"
            className="w-full inline-flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ease-in-out transform hover:-translate-y-0.5"
          >
            <Home className="w-4 h-4" />
            Go back Home
          </Link>
        </div>
      </div>
    </div>
  )
}
