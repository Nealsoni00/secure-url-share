'use client'

import { signIn } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

export default function SignIn() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const error = searchParams.get('error')

  useEffect(() => {
    if (status === 'authenticated') {
      router.push(callbackUrl)
    }
  }, [status, router, callbackUrl])

  const getErrorMessage = (error: string | null) => {
    switch(error) {
      case 'Callback':
        return 'Authentication failed. Please make sure you are using an email from @prepard911.com, @axon.com, or @nealsoni.com'
      case 'OAuthCreateAccount':
        return 'Failed to create account. Please try again or contact support.'
      case 'AccessDenied':
        return 'Access denied. Your email domain is not authorized.'
      case 'Configuration':
        return 'There is a configuration issue. Please contact support.'
      default:
        return error ? 'An error occurred during sign in. Please try again.' : null
    }
  }

  const errorMessage = getErrorMessage(error)

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (status === 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Only users with @prepard911.com, @axon.com, @nealsoni.com emails, or pre-approved accounts can sign in
          </p>
        </div>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800 text-center">
              {errorMessage}
            </p>
          </div>
        )}

        <div className="mt-8 space-y-6">
          <button
            onClick={() => signIn('google', { callbackUrl })}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  )
}