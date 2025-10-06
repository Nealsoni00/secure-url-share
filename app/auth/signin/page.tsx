'use client'

import { signIn } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, Suspense } from 'react'

function SignInContent() {
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
        return 'Authentication failed. Please make sure you are using an email from @prepared911.com, @axon.com, @nealsoni.com, or @gmail.com'
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
            Only users with @prepared911.com, @axon.com, @nealsoni.com, @gmail.com emails, or pre-approved accounts can sign in
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

          <div className="text-center text-xs text-gray-500 space-y-2">
            <p>
              By signing in, you agree to our{' '}
              <a
                href="https://www.nealsoni.com/terms-of-service"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-500 underline"
              >
                Terms of Service
              </a>
              {' '}and{' '}
              <a
                href="https://www.nealsoni.com/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-500 underline"
              >
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignIn() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
}