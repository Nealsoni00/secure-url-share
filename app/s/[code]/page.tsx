'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AccessPage({ params }: { params: { code: string } }) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [urlData, setUrlData] = useState<{
    originalUrl: string
    title?: string
    recipientName?: string
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/access/${params.code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to access URL')
        setLoading(false)
        return
      }

      setUrlData(data)
    } catch (err) {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  if (urlData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-2xl w-full bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Access Granted</h2>
              {urlData.recipientName && (
                <p className="text-sm text-gray-600 mt-1">
                  Access granted to: {urlData.recipientName}
                </p>
              )}
            </div>

            <div className="bg-gray-50 rounded p-4 mb-4">
              <p className="text-sm text-gray-700 mb-2">
                {urlData.title || 'Protected Content'}
              </p>
              <p className="text-xs text-gray-500">
                Your access has been logged for security purposes.
              </p>
            </div>

            <iframe
              src={urlData.originalUrl}
              className="w-full h-96 border-2 border-gray-200 rounded"
              title="Protected Content"
              sandbox="allow-scripts allow-same-origin allow-forms"
            />

            <div className="mt-4 text-center">
              <a
                href={urlData.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-500 text-sm"
              >
                Open in new tab
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Protected URL</h1>
          <p className="mt-2 text-sm text-gray-600">
            This content is password protected
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter password to access"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : 'Access Content'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Your IP address and access details will be logged
          </p>
        </div>
      </div>
    </div>
  )
}