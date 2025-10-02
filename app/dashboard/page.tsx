'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  Copy,
  ExternalLink,
  Shield,
  Users,
  Clock,
  Plus,
  LogOut,
  Settings,
  ChevronRight,
  Link2,
  Eye,
  EyeOff,
  Check
} from 'lucide-react'

interface ProtectedUrl {
  id: string
  originalUrl: string
  customSlug: string
  title?: string
  description?: string
  isActive: boolean
  createdAt: string
  accessLinks: {
    id: string
    uniqueCode: string
    recipientName?: string
    accessCount: number
    isActive: boolean
  }[]
  _count: {
    accessLogs: number
  }
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [urls, setUrls] = useState<ProtectedUrl[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    originalUrl: '',
    title: '',
    description: '',
    customSlug: ''
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      fetchUrls()
    }
  }, [status, router])

  const fetchUrls = async () => {
    try {
      const response = await fetch('/api/protected/urls')
      if (response.ok) {
        const data = await response.json()
        setUrls(data)
      }
    } catch (error) {
      console.error('Failed to fetch URLs:', error)
      toast.error('Failed to load your URLs')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string, id: string, label: string = 'URL') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      toast.success(`${label} copied to clipboard!`)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const handleCreateUrl = async (e: React.FormEvent) => {
    e.preventDefault()

    const loadingToast = toast.loading('Creating protected URL...')

    try {
      const response = await fetch('/api/protected/urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const newUrl = await response.json()
        const protectedUrl = `${window.location.origin}/s/${newUrl.customSlug}`

        await navigator.clipboard.writeText(protectedUrl)
        toast.success('Protected URL created and copied to clipboard!', { id: loadingToast })

        await fetchUrls()
        setShowCreateForm(false)
        setFormData({ originalUrl: '', title: '', description: '', customSlug: '' })
      } else {
        toast.error('Failed to create URL', { id: loadingToast })
      }
    } catch (error) {
      console.error('Failed to create URL:', error)
      toast.error('An error occurred', { id: loadingToast })
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-indigo-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">Secure URL Share</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{session?.user?.email}</span>
              {session?.user?.isAdmin && (
                <Link
                  href="/admin"
                  className="text-sm text-indigo-600 hover:text-indigo-500 font-medium flex items-center"
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Admin
                </Link>
              )}
              <button
                onClick={() => signOut()}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Your Protected URLs</h2>
              <p className="mt-1 text-sm text-gray-600">
                Create and manage password-protected links with access tracking
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors flex items-center shadow-md"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create New URL
            </button>
          </div>
        </div>

        {showCreateForm && (
          <div className="bg-white shadow-lg rounded-xl p-6 mb-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Create Protected URL</h3>
            <form onSubmit={handleCreateUrl} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Original URL <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="url"
                    required
                    value={formData.originalUrl}
                    onChange={(e) => setFormData({ ...formData, originalUrl: e.target.value })}
                    className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="https://example.com/document"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="My Protected Document"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Slug (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.customSlug}
                    onChange={(e) => setFormData({ ...formData, customSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="my-custom-url"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty for auto-generated</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows={2}
                  placeholder="Brief description of the content"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  Create & Copy URL
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    setFormData({ originalUrl: '', title: '', description: '', customSlug: '' })
                  }}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {urls.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No protected URLs yet</h3>
            <p className="text-gray-500 mb-6">Create your first protected URL to get started</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Your First URL
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {urls.map((url) => {
              const protectedUrl = `${window.location.origin}/s/${url.customSlug}`
              return (
                <div
                  key={url.id}
                  className="bg-white shadow-sm rounded-xl p-6 hover:shadow-md transition-shadow border border-gray-100"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {url.title || 'Untitled'}
                          </h3>
                          {url.description && (
                            <p className="mt-1 text-sm text-gray-600">{url.description}</p>
                          )}

                          <div className="mt-3 flex items-center space-x-4">
                            <div className="flex items-center text-sm text-gray-500">
                              <Link2 className="h-4 w-4 mr-1" />
                              <span className="font-mono text-xs">/s/{url.customSlug}</span>
                            </div>

                            <button
                              onClick={() => copyToClipboard(protectedUrl, url.id, 'Protected URL')}
                              className="flex items-center text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                            >
                              {copiedId === url.id ? (
                                <>
                                  <Check className="h-4 w-4 mr-1" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="h-4 w-4 mr-1" />
                                  Copy URL
                                </>
                              )}
                            </button>

                            <a
                              href={url.originalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center text-sm text-gray-500 hover:text-gray-700"
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Original
                            </a>
                          </div>

                          <div className="mt-3 flex items-center space-x-6 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {url.accessLinks.length} access links
                            </div>
                            <div className="flex items-center">
                              <Eye className="h-4 w-4 mr-1" />
                              {url._count.accessLogs} total views
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {new Date(url.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <Link
                          href={`/dashboard/urls/${url.id}`}
                          className="ml-4 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center"
                        >
                          Manage
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}