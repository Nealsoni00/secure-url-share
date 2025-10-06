'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  Building2,
  Users,
  Save,
  ArrowLeft,
  Shield,
  Calendar,
  Mail
} from 'lucide-react'

interface Organization {
  id: string
  name: string
  domain: string | null
  createdAt: string
  users: {
    id: string
    name: string | null
    email: string
    isAdmin: boolean
    isSuperAdmin: boolean
    createdAt: string
  }[]
}

export default function OrganizationPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    domain: ''
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      if (!session.user.organizationId) {
        toast.error('You are not part of an organization')
        router.push('/dashboard')
        return
      }
      fetchOrganization()
    }
  }, [status, session, router])

  // Determine if user can edit (Administrator or Superadmin)
  const canEdit = session?.user?.role === 'ADMINISTRATOR' || session?.user?.isSuperAdmin

  const fetchOrganization = async () => {
    if (!session?.user?.organizationId) return

    try {
      const response = await fetch(`/api/organizations/${session.user.organizationId}`)
      if (response.ok) {
        const data = await response.json()
        setOrganization(data)
        setFormData({
          name: data.name,
          domain: data.domain || ''
        })
      } else {
        toast.error('Failed to load organization')
      }
    } catch (error) {
      console.error('Failed to fetch organization:', error)
      toast.error('Failed to load organization')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/organizations/${organization?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const updated = await response.json()
        setOrganization(updated)
        toast.success('Organization updated successfully')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update organization')
      }
    } catch (error) {
      console.error('Failed to update organization:', error)
      toast.error('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading organization...</p>
        </div>
      </div>
    )
  }

  if (!organization) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <Link href="/dashboard" className="flex items-center cursor-pointer hover:opacity-80 transition-opacity">
              <Shield className="h-8 w-8 text-indigo-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">Secure URL Share</h1>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-8">
            <div className="flex items-center space-x-4">
              <div className="bg-white rounded-full p-3">
                <Building2 className="h-8 w-8 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {canEdit ? 'Organization Settings' : 'Organization Information'}
                </h2>
                <p className="text-indigo-100">
                  {canEdit ? 'Manage your organization information' : 'View your organization details'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!canEdit}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Domain
                </label>
                <input
                  type="text"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  disabled={!canEdit}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="example.com"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Users with this email domain will automatically join this organization
                </p>
              </div>

              {canEdit && (
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="h-5 w-5 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </form>

            <div className="mt-8 border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Organization Members ({organization.users.length})
              </h3>

              <div className="space-y-3">
                {organization.users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900">
                          {user.name || 'No name'}
                        </p>
                        {user.isSuperAdmin && (
                          <span className="px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-800 rounded">
                            Superadmin
                          </span>
                        )}
                        {user.isAdmin && !user.isSuperAdmin && (
                          <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                            Administrator
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Mail className="h-4 w-4 mr-1" />
                          {user.email}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Joined {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <Link
                  href="/users"
                  className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  <Users className="h-4 w-4 mr-1" />
                  {canEdit ? 'Manage Users' : 'View All Members'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
