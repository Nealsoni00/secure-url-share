'use client'

import { useState, useEffect, use } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  Copy,
  ArrowLeft,
  Shield,
  Plus,
  Clock,
  User,
  Mail,
  Key,
  Check,
  X,
  Eye,
  EyeOff,
  Link2,
  Calendar,
  Hash,
  Phone,
  ShieldCheck,
  ShieldOff,
  UserCheck,
  Trash2,
  Edit,
  Save,
  ExternalLink,
  BarChart3,
  Globe,
  Activity,
  TrendingUp
} from 'lucide-react'

interface AccessLink {
  id: string
  uniqueCode: string
  recipientName?: string
  recipientEmail?: string
  recipientPhone?: string
  authMethod: string
  requireVerification: boolean
  accessCount: number
  maxAccesses?: number
  expiresAt?: string
  isActive: boolean
  fullUrl?: string
  createdAt: string
  plaintextPassword?: string // Store plaintext password locally for display
}

interface ProtectedUrl {
  id: string
  originalUrl: string
  customSlug: string
  title?: string
  description?: string
  displayMode: string
  showUserInfo: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface Analytics {
  urlInfo: {
    title: string
    originalUrl: string
    customSlug: string
  }
  summary: {
    totalAccesses: number
    uniqueUsers: number
    uniqueIPs: number
    firstAccess: string | null
    lastAccess: string | null
  }
  ipAnalytics: Array<{ ip: string; count: number }>
  userAgentAnalytics: Array<{ userAgent: string; count: number }>
  linkAnalytics: Array<{
    linkId: string
    count: number
    uniqueCode: string
    recipientName?: string
    authMethod?: string
  }>
  timeSeriesData: Array<{ date: string; count: number }>
  hourlyData: Array<{ hour: number; count: number }>
  recentAccesses: Array<{
    id: string
    timestamp: string
    ipAddress: string
    userAgent?: string
    providedName?: string
    providedEmail?: string
    providedPhone?: string
    accessLink?: {
      uniqueCode: string
      recipientName?: string
      authMethod: string
    }
    country?: string
    city?: string
  }>
}

const AUTH_METHODS = [
  { value: 'password', label: 'Password', icon: Key, description: 'Requires a password to access' },
  { value: 'name', label: 'Name Only', icon: User, description: 'Requires matching the recipient name' },
  { value: 'email', label: 'Email Only', icon: Mail, description: 'Requires matching the email address' },
  { value: 'phone', label: 'Phone Only', icon: Phone, description: 'Requires matching the phone number' },
  { value: 'none', label: 'No Authentication', icon: ShieldOff, description: 'Anyone with the link can access' },
]

export default function ManageUrl({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()

  // State
  const [activeTab, setActiveTab] = useState<'links' | 'analytics'>('links')
  const [protectedUrl, setProtectedUrl] = useState<ProtectedUrl | null>(null)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<ProtectedUrl>>({})
  const [showCreateLink, setShowCreateLink] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [authMethod, setAuthMethod] = useState('password')
  const [linkData, setLinkData] = useState({
    recipientName: '',
    recipientEmail: '',
    recipientPhone: '',
    password: '',
    requireVerification: false,
    expiresAt: '',
    maxAccesses: ''
  })
  const [accessLinks, setAccessLinks] = useState<AccessLink[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({})
  const [editingLink, setEditingLink] = useState<{ linkId: string; field: string } | null>(null)
  const [editingLinkData, setEditingLinkData] = useState<any>({})

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      fetchUrlData()
      fetchLinks()
    }
  }, [status, router])

  const fetchUrlData = async () => {
    try {
      const response = await fetch(`/api/protected/urls/${id}`)
      if (response.ok) {
        const data = await response.json()
        setProtectedUrl(data)
        setEditData({
          title: data.title,
          description: data.description,
          customSlug: data.customSlug,
          displayMode: data.displayMode,
          showUserInfo: data.showUserInfo,
          isActive: data.isActive
        })
      } else if (response.status === 404) {
        toast.error('URL not found')
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Failed to fetch URL data:', error)
      toast.error('Failed to load URL data')
    } finally {
      setLoading(false)
    }
  }

  const fetchLinks = async () => {
    try {
      const response = await fetch(`/api/protected/urls/${id}/links`)
      if (response.ok) {
        const data = await response.json()
        setAccessLinks(data)
      }
    } catch (error) {
      console.error('Failed to fetch links:', error)
    }
  }

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true)
    try {
      const response = await fetch(`/api/protected/urls/${id}/analytics`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      } else {
        toast.error('Failed to load analytics')
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      toast.error('Failed to load analytics')
    } finally {
      setAnalyticsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'analytics' && !analytics) {
      fetchAnalytics()
    }
  }, [activeTab])

  const handleSaveField = async (field: string, value: any) => {
    // Check if value actually changed
    if (protectedUrl && (protectedUrl as any)[field] === value) {
      setEditingField(null)
      return
    }

    const loadingToast = toast.loading('Updating...')
    try {
      const response = await fetch(`/api/protected/urls/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      })

      if (response.ok) {
        const updated = await response.json()
        setProtectedUrl(updated)
        setEditData({ ...editData, [field]: value })
        setEditingField(null)
        toast.success('Updated successfully', { id: loadingToast })
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update', { id: loadingToast })
      }
    } catch (error) {
      console.error('Failed to update:', error)
      toast.error('An error occurred', { id: loadingToast })
    }
  }

  const toggleUrlActive = async () => {
    const loadingToast = toast.loading('Updating status...')
    try {
      const response = await fetch(`/api/protected/urls/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !protectedUrl.isActive })
      })

      if (response.ok) {
        const updated = await response.json()
        setProtectedUrl(updated)
        setEditData({ ...editData, isActive: updated.isActive })
        toast.success(`URL ${updated.isActive ? 'activated' : 'deactivated'}`, { id: loadingToast })
      } else {
        toast.error('Failed to update status', { id: loadingToast })
      }
    } catch (error) {
      console.error('Failed to toggle status:', error)
      toast.error('An error occurred', { id: loadingToast })
    }
  }

  const handleDeleteUrl = async () => {
    if (!confirm('Are you sure you want to delete this URL? This action cannot be undone.')) {
      return
    }

    const loadingToast = toast.loading('Deleting URL...')
    try {
      const response = await fetch(`/api/protected/urls/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('URL deleted successfully', { id: loadingToast })
        router.push('/dashboard')
      } else {
        toast.error('Failed to delete URL', { id: loadingToast })
      }
    } catch (error) {
      console.error('Failed to delete URL:', error)
      toast.error('An error occurred', { id: loadingToast })
    }
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setLinkData({ ...linkData, password })
    toast.success('Password generated!')
  }

  const copyToClipboard = async (text: string, linkId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(linkId)
      toast.success('Link copied!')
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      toast.error('Failed to copy')
    }
  }

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields based on auth method
    if (authMethod === 'password' && !linkData.password) {
      toast.error('Password is required for password authentication')
      return
    }
    if (authMethod === 'name' && !linkData.recipientName) {
      toast.error('Recipient name is required for name authentication')
      return
    }
    if (authMethod === 'email' && !linkData.recipientEmail) {
      toast.error('Recipient email is required for email authentication')
      return
    }
    if (authMethod === 'phone' && !linkData.recipientPhone) {
      toast.error('Recipient phone is required for phone authentication')
      return
    }

    const loadingToast = toast.loading('Creating access link...')

    try {
      const response = await fetch(`/api/protected/urls/${id}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...linkData,
          authMethod,
          maxAccesses: linkData.maxAccesses ? parseInt(linkData.maxAccesses) : null
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Access link created!', { id: loadingToast })

        // Store plaintext password if it was a password link
        const linkWithPassword = {
          ...data,
          plaintextPassword: authMethod === 'password' ? linkData.password : undefined
        }

        setAccessLinks([linkWithPassword, ...accessLinks])
        setLinkData({
          recipientName: '',
          recipientEmail: '',
          recipientPhone: '',
          password: '',
          requireVerification: false,
          expiresAt: '',
          maxAccesses: ''
        })
        setShowCreateLink(false)

        // Copy URL to clipboard
        if (data.fullUrl) {
          await copyToClipboard(data.fullUrl, data.id)
        }
      } else {
        toast.error('Failed to create access link', { id: loadingToast })
      }
    } catch (error) {
      console.error('Failed to create access link:', error)
      toast.error('An error occurred', { id: loadingToast })
    }
  }

  const deleteLink = async (linkId: string) => {
    if (!confirm('Are you sure you want to delete this access link?')) {
      return
    }

    const loadingToast = toast.loading('Deleting link...')

    try {
      const response = await fetch(`/api/protected/urls/${id}/links/${linkId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Link deleted successfully', { id: loadingToast })
        setAccessLinks(prev => prev.filter(link => link.id !== linkId))
      } else {
        toast.error('Failed to delete link', { id: loadingToast })
      }
    } catch (error) {
      console.error('Failed to delete link:', error)
      toast.error('An error occurred', { id: loadingToast })
    }
  }

  const toggleLinkStatus = async (linkId: string, currentStatus: boolean) => {
    const loadingToast = toast.loading('Updating link status...')

    try {
      const response = await fetch(`/api/protected/urls/${id}/links/${linkId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      })

      if (response.ok) {
        const updated = await response.json()
        toast.success(`Link ${!currentStatus ? 'activated' : 'deactivated'}`, { id: loadingToast })
        setAccessLinks(prev => prev.map(link =>
          link.id === linkId ? { ...link, isActive: updated.isActive } : link
        ))
      } else {
        toast.error('Failed to update link status', { id: loadingToast })
      }
    } catch (error) {
      console.error('Failed to toggle link status:', error)
      toast.error('An error occurred', { id: loadingToast })
    }
  }

  const updateLinkField = async (linkId: string, field: string, value: any) => {
    // Find the original link to check if value changed
    const originalLink = accessLinks.find(l => l.id === linkId)
    if (originalLink && (originalLink as any)[field] === value) {
      setEditingLink(null)
      return
    }

    const loadingToast = toast.loading('Updating...')
    try {
      const response = await fetch(`/api/protected/urls/${id}/links/${linkId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      })

      if (response.ok) {
        const updated = await response.json()
        toast.success('Updated successfully', { id: loadingToast })
        setAccessLinks(prev => prev.map(link =>
          link.id === linkId ? { ...link, ...updated, plaintextPassword: link.plaintextPassword } : link
        ))
        setEditingLink(null)
      } else {
        toast.error('Failed to update', { id: loadingToast })
      }
    } catch (error) {
      console.error('Failed to update link:', error)
      toast.error('An error occurred', { id: loadingToast })
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!protectedUrl) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <Link href="/dashboard" className="flex items-center cursor-pointer hover:opacity-80 transition-opacity">
              <Shield className="h-8 w-8 text-indigo-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">Secure URL Share</h1>
            </Link>
            <div className="flex items-center">
              <Link
                href="/dashboard"
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* URL Information Section */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">URL Management</h2>
              <p className="text-sm text-gray-500 mt-1">Manage your protected URL and access links</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleDeleteUrl}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete URL
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                type="text"
                value={editData.title || ''}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                onBlur={handleSaveUrl}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="No title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Custom Slug</label>
              <input
                type="text"
                value={editData.customSlug || ''}
                onChange={(e) => setEditData({ ...editData, customSlug: e.target.value })}
                onBlur={handleSaveUrl}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                placeholder="custom-slug"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={editData.description || ''}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                onBlur={handleSaveUrl}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                rows={3}
                placeholder="No description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Original URL</label>
              <div className="flex items-center space-x-2">
                <p className="text-gray-900 truncate flex-1">{protectedUrl.originalUrl}</p>
                <a
                  href={protectedUrl.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-700"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Display Mode</label>
              <select
                value={editData.displayMode || 'iframe'}
                onChange={(e) => {
                  setEditData({ ...editData, displayMode: e.target.value })
                  setTimeout(handleSaveUrl, 100)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="iframe">iFrame</option>
                <option value="redirect">Redirect</option>
              </select>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showUserInfo"
                  checked={editData.showUserInfo !== undefined ? editData.showUserInfo : true}
                  onChange={(e) => {
                    setEditData({ ...editData, showUserInfo: e.target.checked })
                    setTimeout(handleSaveUrl, 100)
                  }}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="showUserInfo" className="ml-2 text-sm text-gray-900 cursor-pointer">
                  Show User Info
                </label>
              </div>

              <div className="flex items-center">
                <button
                  onClick={toggleUrlActive}
                  className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    protectedUrl.isActive
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                  title="Click to toggle status"
                >
                  {protectedUrl.isActive ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-1" />
                      Inactive
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white shadow-sm rounded-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('links')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'links'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Link2 className="inline h-4 w-4 mr-2" />
                Access Links
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'analytics'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BarChart3 className="inline h-4 w-4 mr-2" />
                Analytics
              </button>
            </nav>
          </div>

          {/* Access Links Tab */}
          {activeTab === 'links' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Access Links</h3>
                <button
                  onClick={() => setShowCreateLink(!showCreateLink)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create New Link
                </button>
              </div>

              {showCreateLink && (
                <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
                  <h4 className="text-md font-semibold mb-4">Create New Access Link</h4>

                  {/* Authentication Method Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <ShieldCheck className="inline h-4 w-4 mr-1" />
                      Authentication Method
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                      {AUTH_METHODS.map((method) => {
                        const Icon = method.icon
                        return (
                          <button
                            key={method.value}
                            type="button"
                            onClick={() => setAuthMethod(method.value)}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              authMethod === method.value
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <Icon className={`h-5 w-5 mb-1 mx-auto ${
                              authMethod === method.value ? 'text-indigo-600' : 'text-gray-500'
                            }`} />
                            <div className="text-xs font-medium text-center">
                              {method.label}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <form onSubmit={handleCreateLink} className="space-y-4">
                    {/* Recipient Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <User className="inline h-4 w-4 mr-1" />
                          Recipient Name {authMethod === 'name' && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type="text"
                          value={linkData.recipientName}
                          onChange={(e) => setLinkData({ ...linkData, recipientName: e.target.value })}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="John Doe"
                          required={authMethod === 'name'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <Mail className="inline h-4 w-4 mr-1" />
                          Recipient Email {authMethod === 'email' && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type="email"
                          value={linkData.recipientEmail}
                          onChange={(e) => setLinkData({ ...linkData, recipientEmail: e.target.value })}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="john@example.com"
                          required={authMethod === 'email'}
                        />
                      </div>
                    </div>

                    {/* Phone Number - Show when phone auth is selected */}
                    {authMethod === 'phone' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <Phone className="inline h-4 w-4 mr-1" />
                          Recipient Phone <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={linkData.recipientPhone}
                          onChange={(e) => setLinkData({ ...linkData, recipientPhone: e.target.value })}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="+1 (555) 123-4567"
                          required
                        />
                      </div>
                    )}

                    {/* Password - Only show for password auth */}
                    {authMethod === 'password' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <Key className="inline h-4 w-4 mr-1" />
                          Password <span className="text-red-500">*</span>
                        </label>
                        <div className="flex space-x-2">
                          <div className="relative flex-1">
                            <input
                              type={showPassword ? "text" : "password"}
                              required
                              value={linkData.password}
                              onChange={(e) => setLinkData({ ...linkData, password: e.target.value })}
                              className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              placeholder="Enter or generate password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-2 top-2.5 text-gray-500 hover:text-gray-700"
                            >
                              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={generatePassword}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                          >
                            Generate
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Verification Toggle - Show for name, email, phone */}
                    {['name', 'email', 'phone'].includes(authMethod) && (
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="requireVerification"
                          checked={linkData.requireVerification}
                          onChange={(e) => setLinkData({ ...linkData, requireVerification: e.target.checked })}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="requireVerification" className="ml-2 block text-sm text-gray-900">
                          <UserCheck className="inline h-4 w-4 mr-1" />
                          Require strict verification (exact match)
                        </label>
                      </div>
                    )}

                    {/* Expiration and Access Limits */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <Calendar className="inline h-4 w-4 mr-1" />
                          Expires At (optional)
                        </label>
                        <input
                          type="datetime-local"
                          value={linkData.expiresAt}
                          onChange={(e) => setLinkData({ ...linkData, expiresAt: e.target.value })}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <Hash className="inline h-4 w-4 mr-1" />
                          Max Accesses (optional)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={linkData.maxAccesses}
                          onChange={(e) => setLinkData({ ...linkData, maxAccesses: e.target.value })}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="Unlimited"
                        />
                      </div>
                    </div>

                    <div className="flex space-x-3 pt-2">
                      <button
                        type="submit"
                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                      >
                        Create & Copy Link
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateLink(false)
                          setLinkData({
                            recipientName: '',
                            recipientEmail: '',
                            recipientPhone: '',
                            password: '',
                            requireVerification: false,
                            expiresAt: '',
                            maxAccesses: ''
                          })
                          setAuthMethod('password')
                        }}
                        className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Access Links List */}
              {accessLinks.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Link
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Auth Method
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Recipient
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Access
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {accessLinks.map((link) => {
                        const authMethodInfo = AUTH_METHODS.find(m => m.value === link.authMethod)
                        const AuthIcon = authMethodInfo?.icon || Shield
                        const isExpired = link.expiresAt && new Date(link.expiresAt) < new Date()
                        const isMaxedOut = link.maxAccesses && link.accessCount >= link.maxAccesses

                        return (
                          <tr key={link.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className="text-sm font-mono text-gray-900">{link.uniqueCode}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                <AuthIcon className="h-3 w-3 mr-1" />
                                {authMethodInfo?.label}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 space-y-1">
                                {/* Recipient Name - Editable */}
                                {editingLink?.linkId === link.id && editingLink?.field === 'recipientName' ? (
                                  <div className="flex items-center space-x-2">
                                    <User className="h-3 w-3 text-gray-400" />
                                    <input
                                      type="text"
                                      value={editingLinkData.recipientName || ''}
                                      onChange={(e) => setEditingLinkData({ ...editingLinkData, recipientName: e.target.value })}
                                      className="flex-1 px-2 py-1 text-sm border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => updateLinkField(link.id, 'recipientName', editingLinkData.recipientName)}
                                      className="text-green-600 hover:text-green-700"
                                      title="Save"
                                    >
                                      <Check className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => setEditingLink(null)}
                                      className="text-gray-500 hover:text-gray-700"
                                      title="Cancel"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="group flex items-center hover:bg-gray-50 rounded px-1 -mx-1">
                                    <User className="h-3 w-3 mr-1 text-gray-400" />
                                    <span className="flex-1">{link.recipientName || '-'}</span>
                                    <button
                                      onClick={() => {
                                        setEditingLink({ linkId: link.id, field: 'recipientName' })
                                        setEditingLinkData({ recipientName: link.recipientName || '' })
                                      }}
                                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-indigo-600 ml-2"
                                      title="Edit name"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </button>
                                  </div>
                                )}

                                {/* Recipient Email - Editable */}
                                {editingLink?.linkId === link.id && editingLink?.field === 'recipientEmail' ? (
                                  <div className="flex items-center space-x-2">
                                    <Mail className="h-3 w-3 text-gray-400" />
                                    <input
                                      type="email"
                                      value={editingLinkData.recipientEmail || ''}
                                      onChange={(e) => setEditingLinkData({ ...editingLinkData, recipientEmail: e.target.value })}
                                      className="flex-1 px-2 py-1 text-sm border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => updateLinkField(link.id, 'recipientEmail', editingLinkData.recipientEmail)}
                                      className="text-green-600 hover:text-green-700"
                                      title="Save"
                                    >
                                      <Check className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => setEditingLink(null)}
                                      className="text-gray-500 hover:text-gray-700"
                                      title="Cancel"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="group flex items-center hover:bg-gray-50 rounded px-1 -mx-1">
                                    <Mail className="h-3 w-3 mr-1 text-gray-400" />
                                    <span className="flex-1">{link.recipientEmail || '-'}</span>
                                    <button
                                      onClick={() => {
                                        setEditingLink({ linkId: link.id, field: 'recipientEmail' })
                                        setEditingLinkData({ recipientEmail: link.recipientEmail || '' })
                                      }}
                                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-indigo-600 ml-2"
                                      title="Edit email"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </button>
                                  </div>
                                )}

                                {/* Recipient Phone - Editable */}
                                {editingLink?.linkId === link.id && editingLink?.field === 'recipientPhone' ? (
                                  <div className="flex items-center space-x-2">
                                    <Phone className="h-3 w-3 text-gray-400" />
                                    <input
                                      type="tel"
                                      value={editingLinkData.recipientPhone || ''}
                                      onChange={(e) => setEditingLinkData({ ...editingLinkData, recipientPhone: e.target.value })}
                                      className="flex-1 px-2 py-1 text-sm border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => updateLinkField(link.id, 'recipientPhone', editingLinkData.recipientPhone)}
                                      className="text-green-600 hover:text-green-700"
                                      title="Save"
                                    >
                                      <Check className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => setEditingLink(null)}
                                      className="text-gray-500 hover:text-gray-700"
                                      title="Cancel"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="group flex items-center hover:bg-gray-50 rounded px-1 -mx-1">
                                    <Phone className="h-3 w-3 mr-1 text-gray-400" />
                                    <span className="flex-1">{link.recipientPhone || '-'}</span>
                                    <button
                                      onClick={() => {
                                        setEditingLink({ linkId: link.id, field: 'recipientPhone' })
                                        setEditingLinkData({ recipientPhone: link.recipientPhone || '' })
                                      }}
                                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-indigo-600 ml-2"
                                      title="Edit phone"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </button>
                                  </div>
                                )}

                                {/* Password - Display only (not editable) */}
                                {link.authMethod === 'password' && link.plaintextPassword && (
                                  <div className="flex items-center space-x-2">
                                    <Key className="h-3 w-3 text-gray-400" />
                                    <span className="font-mono text-xs">
                                      {visiblePasswords[link.id] ? link.plaintextPassword : '••••••••'}
                                    </span>
                                    <button
                                      onClick={() => setVisiblePasswords({
                                        ...visiblePasswords,
                                        [link.id]: !visiblePasswords[link.id]
                                      })}
                                      className="text-gray-500 hover:text-gray-700"
                                      title={visiblePasswords[link.id] ? 'Hide password' : 'Show password'}
                                    >
                                      {visiblePasswords[link.id] ? (
                                        <EyeOff className="h-3 w-3" />
                                      ) : (
                                        <Eye className="h-3 w-3" />
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                <div>{link.accessCount}{link.maxAccesses ? `/${link.maxAccesses}` : ''} accesses</div>
                                {link.expiresAt && (
                                  <div className={`text-xs ${isExpired ? 'text-red-600' : 'text-gray-500'}`}>
                                    Expires: {new Date(link.expiresAt).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                !link.isActive
                                  ? 'bg-gray-100 text-gray-800'
                                  : isExpired || isMaxedOut
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {!link.isActive ? 'Inactive' : isExpired ? 'Expired' : isMaxedOut ? 'Max Reached' : 'Active'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={() => copyToClipboard(link.fullUrl || '', link.id)}
                                  className="text-indigo-600 hover:text-indigo-900"
                                  title="Copy URL"
                                >
                                  {copiedId === link.id ? (
                                    <Check className="h-5 w-5" />
                                  ) : (
                                    <Copy className="h-5 w-5" />
                                  )}
                                </button>
                                <button
                                  onClick={() => toggleLinkStatus(link.id, link.isActive)}
                                  className={`${link.isActive ? 'text-gray-600 hover:text-gray-900' : 'text-green-600 hover:text-green-900'}`}
                                  title={link.isActive ? 'Deactivate' : 'Activate'}
                                >
                                  {link.isActive ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                                <button
                                  onClick={() => deleteLink(link.id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Delete"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Link2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No access links yet</h3>
                  <p className="text-gray-500 mb-6">Create your first access link to share this URL</p>
                  <button
                    onClick={() => setShowCreateLink(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Create Access Link
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="p-6">
              {analyticsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
              ) : analytics ? (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary Statistics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div className="bg-indigo-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-indigo-600 font-medium">Total Accesses</p>
                            <p className="text-2xl font-bold text-indigo-900">{analytics.summary.totalAccesses}</p>
                          </div>
                          <Activity className="h-8 w-8 text-indigo-400" />
                        </div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-green-600 font-medium">Unique Users</p>
                            <p className="text-2xl font-bold text-green-900">{analytics.summary.uniqueUsers}</p>
                          </div>
                          <User className="h-8 w-8 text-green-400" />
                        </div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-blue-600 font-medium">Unique IPs</p>
                            <p className="text-2xl font-bold text-blue-900">{analytics.summary.uniqueIPs}</p>
                          </div>
                          <Globe className="h-8 w-8 text-blue-400" />
                        </div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-purple-600 font-medium">First Access</p>
                            <p className="text-sm font-bold text-purple-900">
                              {analytics.summary.firstAccess
                                ? new Date(analytics.summary.firstAccess).toLocaleDateString()
                                : 'N/A'
                              }
                            </p>
                          </div>
                          <Clock className="h-8 w-8 text-purple-400" />
                        </div>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-orange-600 font-medium">Last Access</p>
                            <p className="text-sm font-bold text-orange-900">
                              {analytics.summary.lastAccess
                                ? new Date(analytics.summary.lastAccess).toLocaleDateString()
                                : 'N/A'
                              }
                            </p>
                          </div>
                          <TrendingUp className="h-8 w-8 text-orange-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Access by Link */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Access by Link</h3>
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Link</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipient</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Auth Method</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Accesses</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {analytics.linkAnalytics.map((link, idx) => (
                            <tr key={idx}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                                {link.uniqueCode}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {link.recipientName || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {link.authMethod || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                {link.count}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* IP Analytics */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top IP Addresses</h3>
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Access Count</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {analytics.ipAnalytics.slice(0, 10).map((ip, idx) => (
                            <tr key={idx}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                                {ip.ip}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                {ip.count}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* User Agent Analytics */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top User Agents</h3>
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User Agent</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {analytics.userAgentAnalytics.slice(0, 10).map((ua, idx) => (
                            <tr key={idx}>
                              <td className="px-6 py-4 text-sm text-gray-900 truncate max-w-md">
                                {ua.userAgent}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                {ua.count}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Time Series Data */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Access Over Time (by Day)</h3>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      {analytics.timeSeriesData.length > 0 ? (
                        <div className="space-y-2">
                          {analytics.timeSeriesData.map((data, idx) => (
                            <div key={idx} className="flex items-center">
                              <span className="text-sm text-gray-600 w-32">{data.date}</span>
                              <div className="flex-1 ml-4">
                                <div className="bg-indigo-200 rounded" style={{ width: `${(data.count / Math.max(...analytics.timeSeriesData.map(d => d.count))) * 100}%`, minWidth: '2px' }}>
                                  <span className="text-xs text-indigo-900 font-semibold px-2">{data.count}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center">No access data available</p>
                      )}
                    </div>
                  </div>

                  {/* Hourly Distribution */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Hourly Distribution (24-hour)</h3>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-12 gap-2">
                        {analytics.hourlyData.map((data, idx) => {
                          const maxCount = Math.max(...analytics.hourlyData.map(d => d.count))
                          const height = maxCount > 0 ? (data.count / maxCount) * 100 : 0
                          return (
                            <div key={idx} className="flex flex-col items-center">
                              <div className="w-full bg-gray-100 rounded" style={{ height: '100px', position: 'relative' }}>
                                <div
                                  className="bg-indigo-500 rounded absolute bottom-0 w-full flex items-end justify-center text-xs text-white font-semibold pb-1"
                                  style={{ height: `${height}%`, minHeight: data.count > 0 ? '20px' : '0' }}
                                >
                                  {data.count > 0 && data.count}
                                </div>
                              </div>
                              <span className="text-xs text-gray-600 mt-1">{data.hour}h</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Recent Accesses */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Accesses (Last 50)</h3>
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Link</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provided Credentials</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {analytics.recentAccesses.map((access) => (
                            <tr key={access.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(access.timestamp).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                                {access.ipAddress}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {access.accessLink ? (
                                  <span className="font-mono">{access.accessLink.uniqueCode}</span>
                                ) : (
                                  <span className="text-gray-400">Direct</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {access.providedName && <div>Name: {access.providedName}</div>}
                                {access.providedEmail && <div>Email: {access.providedEmail}</div>}
                                {access.providedPhone && <div>Phone: {access.providedPhone}</div>}
                                {!access.providedName && !access.providedEmail && !access.providedPhone && (
                                  <span className="text-gray-400">None</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {access.city && access.country ? `${access.city}, ${access.country}` : access.country || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No analytics data</h3>
                  <p className="text-gray-500">Analytics will appear here once your URL is accessed</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
