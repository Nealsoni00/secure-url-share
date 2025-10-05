'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Key, User, Mail, Phone, ShieldOff, AlertCircle, Shield, Settings, ExternalLink } from 'lucide-react'

interface LinkInfo {
  authMethod: string
  recipientName?: string
  recipientEmail?: string
  recipientPhone?: string
  requireVerification: boolean
}

const AUTH_ICONS = {
  password: Key,
  name: User,
  email: Mail,
  phone: Phone,
  none: ShieldOff,
}

const AUTH_LABELS = {
  password: 'Password Protected',
  name: 'Name Verification Required',
  email: 'Email Verification Required',
  phone: 'Phone Verification Required',
  none: 'Public Access',
}

export default function AccessPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const router = useRouter()
  const { data: session } = useSession()
  const [linkInfo, setLinkInfo] = useState<LinkInfo | null>(null)
  const [authData, setAuthData] = useState({
    password: '',
    name: '',
    email: '',
    phone: '',
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [urlData, setUrlData] = useState<{
    originalUrl: string
    title?: string
    recipientName?: string
    displayMode?: string
    showUserInfo?: boolean
    protectedUrlId?: string
  } | null>(null)
  const [embedError, setEmbedError] = useState(false)

  useEffect(() => {
    fetchLinkInfo()
  }, [code])

  const fetchLinkInfo = async () => {
    try {
      const response = await fetch(`/api/access/${code}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Invalid or expired link')
        setLoading(false)
        return
      }

      setLinkInfo(data)
      setLoading(false)

      // If no auth required, submit immediately
      if (data.authMethod === 'none') {
        handleSubmit(new Event('submit') as any)
      }
    } catch (err) {
      setError('Failed to load link information')
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const payload: any = {}

      switch (linkInfo?.authMethod) {
        case 'password':
          payload.password = authData.password
          break
        case 'name':
          payload.name = authData.name
          break
        case 'email':
          payload.email = authData.email
          break
        case 'phone':
          payload.phone = authData.phone
          break
      }

      const response = await fetch(`/api/access/${code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to access URL')
        setSubmitting(false)
        return
      }

      setUrlData(data)
    } catch (err) {
      setError('An error occurred. Please try again.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error && !linkInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Error</h1>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  // Transform URLs to embeddable versions
  const getEmbedUrl = (url: string): string => {
    // Loom: Multiple URL formats support
    if (url.includes('loom.com')) {
      // Handle both www.loom.com and loom.com
      // Extract video ID from various formats
      let videoId = null

      // Format: https://www.loom.com/share/VIDEO_ID or https://loom.com/share/VIDEO_ID
      const shareMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/)
      if (shareMatch) {
        videoId = shareMatch[1]
      }

      // Format: https://www.loom.com/embed/VIDEO_ID (already embedded)
      const embedMatch = url.match(/loom\.com\/embed\/([a-zA-Z0-9]+)/)
      if (embedMatch) {
        return url // Already in embed format
      }

      if (videoId) {
        // Return proper embed URL - simpler is better
        return `https://www.loom.com/embed/${videoId}`
      }
    }

    // YouTube: various formats -> https://www.youtube.com/embed/VIDEO_ID
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoIdMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^?&]+)/)
      if (videoIdMatch) {
        return `https://www.youtube.com/embed/${videoIdMatch[1]}`
      }
    }

    // Vimeo: https://vimeo.com/VIDEO_ID -> https://player.vimeo.com/video/VIDEO_ID
    if (url.includes('vimeo.com') && !url.includes('player.vimeo.com')) {
      const videoIdMatch = url.match(/vimeo\.com\/(\d+)/)
      if (videoIdMatch) {
        return `https://player.vimeo.com/video/${videoIdMatch[1]}`
      }
    }

    return url
  }

  if (urlData) {
    // Check if URL is video/PDF for auto-embed
    const isVideo = urlData.originalUrl.match(/\.(mp4|webm|ogg|mov)$/i) ||
                   urlData.originalUrl.includes('loom.com') ||
                   urlData.originalUrl.includes('youtube.com') ||
                   urlData.originalUrl.includes('vimeo.com')
    const isPDF = urlData.originalUrl.match(/\.pdf$/i)
    const shouldEmbed = urlData.displayMode === 'iframe' || (urlData.displayMode === undefined && (isVideo || isPDF))

    // Get the embeddable URL
    const embedUrl = getEmbedUrl(urlData.originalUrl)

    // Redirect mode - immediate redirect
    if (!shouldEmbed && urlData.displayMode === 'redirect') {
      window.location.href = urlData.originalUrl
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Redirecting to protected content...</p>
          </div>
        </div>
      )
    }

    // Iframe/Embed mode with user info overlay
    return (
      <div className="min-h-screen bg-gray-900">
        {/* User Info Overlay - Always visible for tracking deterrent */}
        {(urlData.showUserInfo !== false) && urlData.recipientName && (
          <div className="bg-gray-800 text-white px-4 py-3 shadow-lg">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Shield className="h-5 w-5 text-indigo-400" />
                <div>
                  <p className="text-sm font-medium">
                    Protected Content Access
                  </p>
                  <p className="text-xs text-gray-400">
                    Accessed by: {urlData.recipientName} • {new Date().toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <AlertCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">This access is being tracked and logged</span>
                  <span className="sm:hidden">Tracked</span>
                </div>
                {/* Configure Access Button - Only show if logged in */}
                {session?.user && urlData.protectedUrlId && (
                  <a
                    href={`/dashboard/urls/${urlData.protectedUrlId}`}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1 transition-colors"
                  >
                    <Settings className="h-3 w-3" />
                    <span>Configure Access</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="h-[calc(100vh-64px)] relative">
          {embedError ? (
            <div className="flex items-center justify-center h-full bg-gray-100">
              <div className="text-center max-w-md mx-auto p-8">
                <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Embedding Not Available</h3>
                <p className="text-gray-600 mb-6">
                  This content cannot be embedded. This may be due to privacy settings on the source platform.
                </p>
                <a
                  href={urlData.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  <ExternalLink className="h-5 w-5 mr-2" />
                  Open in New Tab
                </a>
              </div>
            </div>
          ) : isPDF ? (
            <embed
              src={embedUrl}
              type="application/pdf"
              className="w-full h-full"
              title={urlData.title || 'Protected PDF'}
            />
          ) : (
            <iframe
              src={embedUrl}
              className="w-full h-full border-0"
              title={urlData.title || 'Protected Content'}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              onError={() => setEmbedError(true)}
            />
          )}

          {/* Fallback button for manual access */}
          {!embedError && !isPDF && (
            <a
              href={urlData.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-6 left-6 z-50 bg-white hover:bg-gray-50 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 shadow-lg transition-colors border border-gray-200"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Open Original</span>
            </a>
          )}
        </div>

        {/* Floating watermark for additional deterrent */}
        {(urlData.showUserInfo !== false) && urlData.recipientName && (
          <div className="fixed bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg text-xs pointer-events-none select-none">
            <p className="font-mono opacity-75">
              {urlData.recipientName} • {new Date().toISOString().split('T')[0]}
            </p>
          </div>
        )}
      </div>
    )
  }

  const Icon = AUTH_ICONS[linkInfo?.authMethod as keyof typeof AUTH_ICONS] || ShieldOff

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="text-center mb-8">
          <Icon className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">Protected URL</h1>
          <p className="mt-2 text-sm text-gray-600">
            {AUTH_LABELS[linkInfo?.authMethod as keyof typeof AUTH_LABELS]}
          </p>
        </div>

        {/* Recipient Info Banner - Show if any recipient info exists */}
        {(linkInfo?.recipientName || linkInfo?.recipientEmail || linkInfo?.recipientPhone) && (
          <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <User className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-indigo-900">This link was created for:</p>
                <div className="mt-2 space-y-1">
                  {linkInfo.recipientName && (
                    <div className="flex items-center space-x-2 text-sm text-indigo-800">
                      <User className="h-4 w-4" />
                      <span>{linkInfo.recipientName}</span>
                    </div>
                  )}
                  {linkInfo.recipientEmail && (
                    <div className="flex items-center space-x-2 text-sm text-indigo-800">
                      <Mail className="h-4 w-4" />
                      <span>{linkInfo.recipientEmail}</span>
                    </div>
                  )}
                  {linkInfo.recipientPhone && (
                    <div className="flex items-center space-x-2 text-sm text-indigo-800">
                      <Phone className="h-4 w-4" />
                      <span>{linkInfo.recipientPhone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {linkInfo?.authMethod === 'password' && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={authData.password}
                onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter password to access"
              />
            </div>
          )}

          {linkInfo?.authMethod === 'name' && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Your Name
              </label>
              <input
                type="text"
                id="name"
                value={authData.name}
                onChange={(e) => setAuthData({ ...authData, name: e.target.value })}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder={linkInfo.recipientName ? `Enter your name` : 'Enter your name'}
              />
              {linkInfo.recipientName && !linkInfo.requireVerification && (
                <p className="mt-1 text-xs text-gray-500">
                  This link was created for {linkInfo.recipientName}
                </p>
              )}
            </div>
          )}

          {linkInfo?.authMethod === 'email' && (
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={authData.email}
                onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter your email address"
              />
              {linkInfo.recipientEmail && !linkInfo.requireVerification && (
                <p className="mt-1 text-xs text-gray-500">
                  This link was created for {linkInfo.recipientEmail}
                </p>
              )}
            </div>
          )}

          {linkInfo?.authMethod === 'phone' && (
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                value={authData.phone}
                onChange={(e) => setAuthData({ ...authData, phone: e.target.value })}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter your phone number"
              />
              {linkInfo.recipientPhone && !linkInfo.requireVerification && (
                <p className="mt-1 text-xs text-gray-500">
                  This link was created for {linkInfo.recipientPhone}
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          {linkInfo?.authMethod !== 'none' && (
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Verifying...' : 'Access Content'}
            </button>
          )}
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