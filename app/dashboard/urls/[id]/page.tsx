'use client'

import { useState, useEffect } from 'react'
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
  Hash
} from 'lucide-react'

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
  const [showPassword, setShowPassword] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [linkData, setLinkData] = useState({
    recipientName: '',
    recipientEmail: '',
    password: '',
    expiresAt: '',
    maxAccesses: ''
  })
  const [createdLinks, setCreatedLinks] = useState<AccessLink[]>([])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setLinkData({ ...linkData, password })
    toast.success('Password generated!')
  }

  const copyToClipboard = async (text: string, id: string, label: string = 'Text') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      toast.success(`${label} copied!`)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      toast.error('Failed to copy')
    }
  }

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault()

    const loadingToast = toast.loading('Creating access link...')

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

        // Copy the full link with password to clipboard
        const clipboardText = `Access Link: ${data.fullUrl}\nPassword: ${linkData.password}`
        await navigator.clipboard.writeText(clipboardText)

        toast.success('Access link created and copied!', { id: loadingToast })

        setCreatedLinks([data, ...createdLinks])
        setLinkData({
          recipientName: '',
          recipientEmail: '',
          password: '',
          expiresAt: '',
          maxAccesses: ''
        })
        setShowCreateLink(false)
      } else {
        toast.error('Failed to create access link', { id: loadingToast })
      }
    } catch (error) {
      console.error('Failed to create access link:', error)
      toast.error('An error occurred', { id: loadingToast })
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
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
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Manage Access Links</h2>
              <p className="mt-1 text-sm text-gray-600">
                Create password-protected access links for this URL
              </p>
            </div>
            <button
              onClick={() => setShowCreateLink(!showCreateLink)}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors flex items-center shadow-md"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Access Link
            </button>
          </div>
        </div>

        {showCreateLink && (
          <div className="bg-white shadow-lg rounded-xl p-6 mb-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Create New Access Link</h3>
            <form onSubmit={handleCreateLink} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <User className="inline h-4 w-4 mr-1" />
                    Recipient Name (optional)
                  </label>
                  <input
                    type="text"
                    value={linkData.recipientName}
                    onChange={(e) => setLinkData({ ...linkData, recipientName: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Mail className="inline h-4 w-4 mr-1" />
                    Recipient Email (optional)
                  </label>
                  <input
                    type="email"
                    value={linkData.recipientEmail}
                    onChange={(e) => setLinkData({ ...linkData, recipientEmail: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

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
                      password: '',
                      expiresAt: '',
                      maxAccesses: ''
                    })
                  }}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {createdLinks.length > 0 && (
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recently Created Links</h3>
            {createdLinks.map((link) => (
              <div
                key={link.id}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {link.recipientName && (
                        <span className="text-sm font-medium text-gray-900">
                          For: {link.recipientName}
                        </span>
                      )}
                      {link.recipientEmail && (
                        <span className="text-sm text-gray-500">({link.recipientEmail})</span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Link2 className="h-4 w-4 mr-1" />
                          <span className="font-mono">{link.fullUrl}</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(link.fullUrl || '', link.id, 'Link')}
                          className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center"
                        >
                          {copiedId === link.id ? (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-1" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        {link.maxAccesses && (
                          <span className="flex items-center">
                            <Eye className="h-4 w-4 mr-1" />
                            {link.accessCount}/{link.maxAccesses} accesses
                          </span>
                        )}
                        {link.expiresAt && (
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            Expires: {new Date(link.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                        <span className={`flex items-center ${link.isActive ? 'text-green-600' : 'text-red-600'}`}>
                          {link.isActive ? (
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
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {createdLinks.length === 0 && !showCreateLink && (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <Key className="h-16 w-16 text-gray-300 mx-auto mb-4" />
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
      </main>
    </div>
  )
}