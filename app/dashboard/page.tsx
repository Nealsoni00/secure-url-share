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
  ChevronDown,
  Link2,
  Eye,
  EyeOff,
  Check,
  Monitor,
  ArrowRight,
  Building2,
  Crown,
  Menu,
  Edit
} from 'lucide-react'
import { detectUrlType } from '@/lib/url-type'

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
  const [showMenu, setShowMenu] = useState(false)
  const [expandedUrls, setExpandedUrls] = useState<Set<string>>(new Set())
  const [formData, setFormData] = useState({
    originalUrl: '',
    title: '',
    description: '',
    customSlug: '',
    displayMode: 'auto',
    showUserInfo: true
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

  const toggleExpanded = (urlId: string) => {
    setExpandedUrls(prev => {
      const newSet = new Set(prev)
      if (newSet.has(urlId)) {
        newSet.delete(urlId)
      } else {
        newSet.add(urlId)
      }
      return newSet
    })
  }

  const handleCreateUrl = async (e: React.FormEvent) => {
    e.preventDefault()

    const loadingToast = toast.loading('Creating protected URL...')

    // Auto-detect display mode if set to auto
    let displayMode = formData.displayMode
    if (displayMode === 'auto') {
      const url = formData.originalUrl.toLowerCase()
      const isVideo = url.match(/\.(mp4|webm|ogg|mov)$/i) ||
                     url.includes('loom.com') ||
                     url.includes('youtube.com') ||
                     url.includes('vimeo.com')
      const isPDF = url.match(/\.pdf$/i)
      displayMode = (isVideo || isPDF) ? 'iframe' : 'redirect'
    }

    try {
      const response = await fetch('/api/protected/urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          displayMode,
          showUserInfo: formData.showUserInfo
        })
      })

      if (response.ok) {
        const newUrl = await response.json()
        const accessUrl = `${window.location.origin}/s/${newUrl.defaultAccessLink.uniqueCode}`

        // Copy the access URL (not the slug) to clipboard
        await navigator.clipboard.writeText(accessUrl)

        // Show success message
        toast.success(
          `Protected URL created and copied to clipboard!\n\nAuthentication: Name-based (passwordless)\nAnyone with the link can access by entering their full name.`,
          {
            id: loadingToast,
            duration: 8000,
            style: {
              whiteSpace: 'pre-line'
            }
          }
        )

        await fetchUrls()
        setShowCreateForm(false)
        setFormData({ originalUrl: '', title: '', description: '', customSlug: '', displayMode: 'auto', showUserInfo: true })
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to create URL', { id: loadingToast })
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
            <Link href="/" className="flex items-center cursor-pointer hover:opacity-80 transition-opacity">
              <Shield className="h-8 w-8 text-indigo-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">Secure URL Share</h1>
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700 hidden sm:block">{session?.user?.email}</span>

              {/* User Menu Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {session?.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      className="h-8 w-8 rounded-full border-2 border-indigo-200"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <Users className="h-4 w-4 text-indigo-600" />
                    </div>
                  )}
                  <Menu className="h-4 w-4 text-gray-600 hidden sm:block" />
                </button>

                {showMenu && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMenu(false)}
                    />

                    {/* Dropdown Menu */}
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                          {session?.user?.image ? (
                            <img
                              src={session.user.image}
                              alt={session.user.name || 'User'}
                              className="h-12 w-12 rounded-full border-2 border-indigo-200"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                              <Users className="h-6 w-6 text-indigo-600" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {session?.user?.name || 'User'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
                            {session?.user?.role && (
                              <div className="mt-1">
                                {session.user.role === 'SUPERADMIN' ? (
                                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-purple-100 text-purple-800 rounded">
                                    <Crown className="h-3 w-3 mr-1" />
                                    Superadmin
                                  </span>
                                ) : session.user.role === 'ADMINISTRATOR' ? (
                                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                                    <Shield className="h-3 w-3 mr-1" />
                                    Administrator
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-800 rounded">
                                    User
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        {session?.user?.organization && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500">Organization</p>
                            <p className="text-sm font-medium text-indigo-600 flex items-center mt-1">
                              <Building2 className="h-3 w-3 mr-1" />
                              {session.user.organization.name}
                            </p>
                            {session.user.organization.domain && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                {session.user.organization.domain}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Profile Link */}
                      <Link
                        href="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setShowMenu(false)}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        View Profile
                      </Link>

                      {/* Superadmin Access */}
                      {session?.user?.isSuperAdmin && (
                        <Link
                          href="/superadmin"
                          className="flex items-center px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 transition-colors"
                          onClick={() => setShowMenu(false)}
                        >
                          <Crown className="h-4 w-4 mr-2" />
                          Superadmin Panel
                        </Link>
                      )}

                      {/* Organization Settings */}
                      {session?.user?.organizationId && (
                        <Link
                          href="/organization"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setShowMenu(false)}
                        >
                          <Building2 className="h-4 w-4 mr-2" />
                          Organization
                        </Link>
                      )}

                      {/* User Management - All org members can view */}
                      {(session?.user?.organizationId || session?.user?.isSuperAdmin) && (
                        <Link
                          href="/users"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setShowMenu(false)}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          {session?.user?.role === 'USER' ? 'Organization Members' : 'User Management'}
                        </Link>
                      )}

                      <div className="border-t border-gray-200 mt-2 pt-2">
                        <button
                          onClick={() => signOut()}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
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

              {/* Display Mode Configuration */}
              <div className="space-y-4 border-t pt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Monitor className="inline h-4 w-4 mr-1" />
                    Display Mode
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, displayMode: 'auto' })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.displayMode === 'auto'
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-sm font-medium">Auto</div>
                      <div className="text-xs text-gray-500 mt-1">Smart detect</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, displayMode: 'iframe' })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.displayMode === 'iframe'
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-sm font-medium">Embed</div>
                      <div className="text-xs text-gray-500 mt-1">Show in frame</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, displayMode: 'redirect' })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.displayMode === 'redirect'
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-sm font-medium">Redirect</div>
                      <div className="text-xs text-gray-500 mt-1">Direct access</div>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Auto mode embeds videos and PDFs, redirects for other content
                  </p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showUserInfo"
                    checked={formData.showUserInfo}
                    onChange={(e) => setFormData({ ...formData, showUserInfo: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="showUserInfo" className="ml-2 block text-sm text-gray-900">
                    Show recipient info overlay (deters sharing)
                  </label>
                </div>
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
                    setFormData({ originalUrl: '', title: '', description: '', customSlug: '', displayMode: 'auto', showUserInfo: true })
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
              // Use the first access link's code if available
              const firstLink = url.accessLinks[0]
              const accessUrl = firstLink
                ? `${window.location.origin}/s/${firstLink.uniqueCode}`
                : null
              const isExpanded = expandedUrls.has(url.id)
              const urlTypeInfo = detectUrlType(url.originalUrl)

              return (
                <div
                  key={url.id}
                  className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Main Card - Clickable to expand */}
                  <div
                    onClick={() => toggleExpanded(url.id)}
                    className="p-6 cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {url.title || 'Untitled'}
                              </h3>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${urlTypeInfo.color}`}>
                                <span className="mr-1">{urlTypeInfo.icon}</span>
                                {urlTypeInfo.type}
                              </span>
                            </div>
                            {url.description && (
                              <p className="mt-1 text-sm text-gray-600">{url.description}</p>
                            )}

                            <div className="mt-3 flex items-center space-x-6 text-sm text-gray-500">
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                {url.accessLinks.length} access {url.accessLinks.length === 1 ? 'link' : 'links'}
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

                          <div className="ml-4 flex items-center gap-2">
                            <Link
                              href={`/dashboard/urls/${url.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center"
                            >
                              Manage
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Link>
                            <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Section - Access Links */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Access Links</h4>
                      <div className="space-y-3">
                        {url.accessLinks.map((link) => {
                          const linkUrl = `${window.location.origin}/s/${link.uniqueCode}`
                          return (
                            <div
                              key={link.id}
                              className="bg-white rounded-lg p-3 border border-gray-200 flex items-center justify-between"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-sm text-gray-900">/s/{link.uniqueCode}</span>
                                  {link.recipientName && (
                                    <span className="text-xs text-gray-500">
                                      → {link.recipientName}
                                    </span>
                                  )}
                                  {!link.isActive && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                                      Inactive
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {link.accessCount} views
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    copyToClipboard(linkUrl, link.id, 'Link')
                                  }}
                                  className="text-indigo-600 hover:text-indigo-700 p-2 rounded-lg hover:bg-indigo-50 transition-colors"
                                >
                                  {copiedId === link.id ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </button>
                                <Link
                                  href={`/dashboard/urls/${url.id}#link-${link.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-gray-600 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}