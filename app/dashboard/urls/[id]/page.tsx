'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AccessLink {
  id: string
  uniqueCode: string
  recipientName?: string
  recipientEmail?: string
  accessCount: number
  maxAccesses?: number
  expiresAt?: string
  isActive: boolean
  fullUrl?: string
}

export default function ManageUrl({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [showCreateLink, setShowCreateLink] = useState(false)
  const [linkData, setLinkData] = useState({
    recipientName: '',
    recipientEmail: '',
    password: '',
    expiresAt: '',
    maxAccesses: ''
  })
  const [createdLink, setCreatedLink] = useState<AccessLink | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`/api/protected/urls/${params.id}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...linkData,
          maxAccesses: linkData.maxAccesses ? parseInt(linkData.maxAccesses) : null
        })
      })

      if (response.ok) {
        const data = await response.json()
        setCreatedLink(data)
        setLinkData({
          recipientName: '',
          recipientEmail: '',
          password: '',
          expiresAt: '',
          maxAccesses: ''
        })
      }
    } catch (error) {
      console.error('Failed to create access link:', error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-semibold">
                Secure URL Share
              </Link>
            </div>
            <div className="flex items-center">
              <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Manage Access Links</h2>
            <button
              onClick={() => setShowCreateLink(!showCreateLink)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Create Access Link
            </button>
          </div>

          {showCreateLink && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <form onSubmit={handleCreateLink} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Recipient Name</label>
                    <input
                      type="text"
                      value={linkData.recipientName}
                      onChange={(e) => setLinkData({ ...linkData, recipientName: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Recipient Email</label>
                    <input
                      type="email"
                      value={linkData.recipientEmail}
                      onChange={(e) => setLinkData({ ...linkData, recipientEmail: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password (required)</label>
                  <input
                    type="text"
                    required
                    value={linkData.password}
                    onChange={(e) => setLinkData({ ...linkData, password: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Expires At (optional)</label>
                    <input
                      type="datetime-local"
                      value={linkData.expiresAt}
                      onChange={(e) => setLinkData({ ...linkData, expiresAt: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Accesses (optional)</label>
                    <input
                      type="number"
                      value={linkData.maxAccesses}
                      onChange={(e) => setLinkData({ ...linkData, maxAccesses: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    Create Access Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateLink(false)}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {createdLink && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-medium text-green-900 mb-2">Access Link Created!</h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  <strong>URL:</strong> {createdLink.fullUrl}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Password:</strong> {linkData.password}
                </p>
                {createdLink.recipientName && (
                  <p className="text-sm text-gray-700">
                    <strong>For:</strong> {createdLink.recipientName}
                  </p>
                )}
                <button
                  onClick={() => copyToClipboard(`${createdLink.fullUrl}\nPassword: ${linkData.password}`)}
                  className="mt-2 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                >
                  {copied ? 'Copied!' : 'Copy Link & Password'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}