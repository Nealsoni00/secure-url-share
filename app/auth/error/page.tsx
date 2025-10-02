'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function AuthError() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Authentication Error
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {error === 'AccessDenied'
              ? 'Your email domain is not authorized to access this application.'
              : 'An error occurred during authentication.'}
          </p>
          <Link
            href="/auth/signin"
            className="mt-4 inline-block text-indigo-600 hover:text-indigo-500"
          >
            Try signing in again
          </Link>
        </div>
      </div>
    </div>
  )
}