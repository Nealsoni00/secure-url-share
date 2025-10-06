'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  Building2,
  Users,
  Crown,
  Shield,
  ArrowLeft,
  Plus,
  ChevronDown,
  ChevronRight,
  Mail,
  Calendar,
  Edit
} from 'lucide-react'

interface Organization {
  id: string
  name: string
  domain: string | null
  createdAt: string
  _count: {
    users: number
  }
  users: {
    id: string
    name: string | null
    email: string
    isAdmin: boolean
    isSuperAdmin: boolean
    createdAt: string
  }[]
}

export default function SuperadminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set())
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    domain: ''
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      if (!session.user.isSuperAdmin) {
        toast.error('Access denied - Superadmin only')
        router.push('/dashboard')
        return
      }
      fetchOrganizations()
    }
  }, [status, session, router])

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations')
      if (response.ok) {
        const data = await response.json()
        setOrganizations(data)
      } else {
        toast.error('Failed to load organizations')
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error)
      toast.error('Failed to load organizations')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault()

    const loadingToast = toast.loading('Creating organization...')

    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('Organization created successfully', { id: loadingToast })
        await fetchOrganizations()
        setShowCreateForm(false)
        setFormData({ name: '', domain: '' })
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create organization', { id: loadingToast })
      }
    } catch (error) {
      console.error('Failed to create organization:', error)
      toast.error('An error occurred', { id: loadingToast })
    }
  }

  const toggleOrganization = (orgId: string) => {
    const newExpanded = new Set(expandedOrgs)
    if (newExpanded.has(orgId)) {
      newExpanded.delete(orgId)
    } else {
      newExpanded.add(orgId)
    }
    setExpandedOrgs(newExpanded)
  }

  const toggleSuperadmin = async (userId: string, currentStatus: boolean, userEmail: string) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'remove' : 'grant'} superadmin access ${currentStatus ? 'from' : 'to'} ${userEmail}?`)) {
      return
    }

    const loadingToast = toast.loading('Updating user...')

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSuperAdmin: !currentStatus })
      })

      if (response.ok) {
        toast.success(`Superadmin access ${currentStatus ? 'removed' : 'granted'}`, { id: loadingToast })
        await fetchOrganizations()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update user', { id: loadingToast })
      }
    } catch (error) {
      console.error('Failed to update user:', error)
      toast.error('An error occurred', { id: loadingToast })
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading superadmin panel...</p>
        </div>
      </div>
    )
  }

  const totalUsers = organizations.reduce((sum, org) => sum + org._count.users, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <Link href="/dashboard" className="flex items-center cursor-pointer hover:opacity-90 transition-opacity">
              <Crown className="h-8 w-8 text-yellow-300 mr-3" />
              <h1 className="text-xl font-bold text-white">Superadmin Panel</h1>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Organizations</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{organizations.length}</p>
              </div>
              <div className="bg-indigo-100 rounded-full p-3">
                <Building2 className="h-8 w-8 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{totalUsers}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Superadmins</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {organizations.reduce((sum, org) =>
                    sum + org.users.filter(u => u.isSuperAdmin).length, 0
                  )}
                </p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <Crown className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 flex items-center">
                <Building2 className="h-8 w-8 mr-3 text-purple-600" />
                All Organizations
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Manage all organizations and their users
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-purple-600 text-white px-5 py-2.5 rounded-lg hover:bg-purple-700 transition-colors flex items-center shadow-md"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Organization
            </button>
          </div>
        </div>

        {showCreateForm && (
          <div className="bg-white shadow-lg rounded-xl p-6 mb-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Create New Organization</h3>
            <form onSubmit={handleCreateOrganization} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Acme Corporation"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Domain (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="acme.com"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="submit"
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Create Organization
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    setFormData({ name: '', domain: '' })
                  }}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {organizations.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm">
              <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No organizations yet</h3>
              <p className="text-gray-500">Create your first organization to get started</p>
            </div>
          ) : (
            organizations.map((org) => (
              <div key={org.id} className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleOrganization(org.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="bg-indigo-100 rounded-full p-3">
                        <Building2 className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-xl font-semibold text-gray-900">{org.name}</h3>
                          {org.domain && (
                            <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                              {org.domain}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {org._count.users} users
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Created {new Date(org.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Link
                        href={`/organization?id=${org.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-indigo-600 hover:text-indigo-700 p-2 rounded-lg hover:bg-indigo-50 transition-colors"
                        title="Edit organization"
                      >
                        <Edit className="h-5 w-5" />
                      </Link>
                      {expandedOrgs.has(org.id) ? (
                        <ChevronDown className="h-6 w-6 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {expandedOrgs.has(org.id) && (
                  <div className="border-t border-gray-200 bg-gray-50 p-6">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      Organization Members ({org.users.length})
                    </h4>
                    <div className="space-y-3">
                      {org.users.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm"
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <p className="font-medium text-gray-900">
                                {user.name || 'No name'}
                              </p>
                              {user.isSuperAdmin && (
                                <span className="px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-800 rounded flex items-center">
                                  <Crown className="h-3 w-3 mr-1" />
                                  Superadmin
                                </span>
                              )}
                              {user.isAdmin && !user.isSuperAdmin && (
                                <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded flex items-center">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Admin
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
                                {new Date(user.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleSuperadmin(user.id, user.isSuperAdmin, user.email)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              user.isSuperAdmin
                                ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {user.isSuperAdmin ? 'Remove Superadmin' : 'Make Superadmin'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
