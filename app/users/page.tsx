'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  Users,
  UserPlus,
  Shield,
  ArrowLeft,
  Mail,
  Calendar,
  Trash2,
  Edit,
  X,
  Save,
  Crown,
  Building2
} from 'lucide-react'

interface User {
  id: string
  email: string
  name: string | null
  image: string | null
  isAdmin: boolean
  isSuperAdmin: boolean
  organizationId: string | null
  createdAt: string
  _count?: {
    protectedUrls: number
  }
}

export default function UsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    isAdmin: false
  })
  const [editData, setEditData] = useState({
    name: '',
    isAdmin: false,
    isSuperAdmin: false
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      // All users can view organization members
      if (!session.user.organizationId && !session.user.isSuperAdmin) {
        toast.error('You are not part of an organization')
        router.push('/dashboard')
        return
      }
      fetchUsers()
    }
  }, [status, session, router])

  const fetchUsers = async () => {
    try {
      const url = session?.user?.organizationId
        ? `/api/users?organizationId=${session.user.organizationId}`
        : '/api/users'

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      } else {
        toast.error('Failed to load users')
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()

    const loadingToast = toast.loading('Creating user...')

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          organizationId: session?.user?.organizationId || null
        })
      })

      if (response.ok) {
        toast.success('User created successfully', { id: loadingToast })
        await fetchUsers()
        setShowCreateForm(false)
        setFormData({ email: '', name: '', isAdmin: false })
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create user', { id: loadingToast })
      }
    } catch (error) {
      console.error('Failed to create user:', error)
      toast.error('An error occurred', { id: loadingToast })
    }
  }

  const handleUpdateUser = async (userId: string) => {
    const loadingToast = toast.loading('Updating user...')

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      })

      if (response.ok) {
        toast.success('User updated successfully', { id: loadingToast })
        await fetchUsers()
        setEditingUser(null)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update user', { id: loadingToast })
      }
    } catch (error) {
      console.error('Failed to update user:', error)
      toast.error('An error occurred', { id: loadingToast })
    }
  }

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user ${userEmail}?`)) {
      return
    }

    const loadingToast = toast.loading('Deleting user...')

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('User deleted successfully', { id: loadingToast })
        await fetchUsers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete user', { id: loadingToast })
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
      toast.error('An error occurred', { id: loadingToast })
    }
  }

  const startEditing = (user: User) => {
    setEditingUser(user.id)
    setEditData({
      name: user.name || '',
      isAdmin: user.isAdmin,
      isSuperAdmin: user.isSuperAdmin
    })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    )
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

        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 flex items-center">
                <Users className="h-8 w-8 mr-3 text-indigo-600" />
                {session?.user?.role === 'USER' ? 'Organization Members' : 'User Management'}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {session?.user?.organizationId
                  ? session?.user?.role === 'USER'
                    ? 'View all members in your organization'
                    : 'Manage users in your organization'
                  : 'Manage all users (Superadmin)'}
              </p>
            </div>
            {(session?.user?.role === 'ADMINISTRATOR' || session?.user?.isSuperAdmin) && (
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors flex items-center shadow-md"
              >
                <UserPlus className="h-5 w-5 mr-2" />
                Add User
              </button>
            )}
          </div>
        </div>

        {showCreateForm && (
          <div className="bg-white shadow-lg rounded-xl p-6 mb-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Create New User</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="user@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isAdmin"
                  checked={formData.isAdmin}
                  onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="isAdmin" className="ml-2 block text-sm text-gray-900">
                  Organization Administrator
                </label>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  Create User
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    setFormData({ email: '', name: '', isAdmin: false })
                  }}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="divide-y divide-gray-200">
            {users.length === 0 ? (
              <div className="text-center py-16">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No users yet</h3>
                <p className="text-gray-500">Create your first user to get started</p>
              </div>
            ) : (
              users.map((user) => (
                <div key={user.id} className="p-6 hover:bg-gray-50 transition-colors">
                  {editingUser === user.id ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          value={editData.name}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={`edit-admin-${user.id}`}
                            checked={editData.isAdmin}
                            onChange={(e) => setEditData({ ...editData, isAdmin: e.target.checked })}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`edit-admin-${user.id}`} className="ml-2 block text-sm text-gray-900">
                            Organization Administrator
                          </label>
                        </div>

                        {session?.user?.isSuperAdmin && (
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={`edit-superadmin-${user.id}`}
                              checked={editData.isSuperAdmin}
                              onChange={(e) => setEditData({ ...editData, isSuperAdmin: e.target.checked })}
                              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                            />
                            <label htmlFor={`edit-superadmin-${user.id}`} className="ml-2 block text-sm text-gray-900">
                              Superadministrator
                            </label>
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleUpdateUser(user.id)}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center text-sm"
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </button>
                        <button
                          onClick={() => setEditingUser(null)}
                          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors flex items-center text-sm"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          {user.image && (
                            <img
                              src={user.image}
                              alt={user.name || user.email}
                              className="h-12 w-12 rounded-full"
                            />
                          )}
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {user.name || 'No name'}
                              </h3>
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
                            <div className="mt-1 flex items-center space-x-4 text-sm text-gray-600">
                              <span className="flex items-center">
                                <Mail className="h-4 w-4 mr-1" />
                                {user.email}
                              </span>
                              <span className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                Joined {new Date(user.createdAt).toLocaleDateString()}
                              </span>
                              {user._count && (
                                <span className="text-gray-500">
                                  {user._count.protectedUrls} protected URLs
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Only show actions for administrators and superadmins */}
                      {(session?.user?.role === 'ADMINISTRATOR' || session?.user?.isSuperAdmin) && (
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => startEditing(user)}
                            className="text-indigo-600 hover:text-indigo-700 p-2 rounded-lg hover:bg-indigo-50 transition-colors"
                            title="Edit user"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          {session?.user?.id !== user.id && (
                            <button
                              onClick={() => handleDeleteUser(user.id, user.email)}
                              className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                              title="Delete user"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
