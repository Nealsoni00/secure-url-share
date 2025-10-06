'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  User,
  Mail,
  Building2,
  Shield,
  Crown,
  Calendar,
  ArrowLeft,
  Link2,
  Eye
} from 'lucide-react'

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState({
    protectedUrls: 0,
    totalViews: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      fetchStats()
    }
  }, [status, router])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/protected/urls')
      if (response.ok) {
        const urls = await response.json()
        const totalViews = urls.reduce((sum: number, url: any) => sum + (url._count?.accessLogs || 0), 0)
        setStats({
          protectedUrls: urls.length,
          totalViews
        })
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPERADMIN':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-800">
            <Crown className="h-4 w-4 mr-1" />
            Superadmin
          </span>
        )
      case 'ADMINISTRATOR':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
            <Shield className="h-4 w-4 mr-1" />
            Administrator
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-800">
            <User className="h-4 w-4 mr-1" />
            User
          </span>
        )
    }
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
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-12">
            <div className="flex items-center space-x-6">
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  className="h-24 w-24 rounded-full border-4 border-white shadow-lg"
                />
              ) : (
                <div className="h-24 w-24 rounded-full border-4 border-white bg-indigo-200 flex items-center justify-center">
                  <User className="h-12 w-12 text-indigo-600" />
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-white">
                  {session?.user?.name || 'User'}
                </h2>
                <p className="text-indigo-100 mt-1 flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  {session?.user?.email}
                </p>
                <div className="mt-3">
                  {getRoleBadge(session?.user?.role || 'USER')}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Email</p>
                  <p className="text-base text-gray-900">{session?.user?.email}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Name</p>
                  <p className="text-base text-gray-900">{session?.user?.name || 'Not set'}</p>
                </div>
              </div>

              {session?.user?.organization && (
                <div className="flex items-start space-x-3 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <Building2 className="h-5 w-5 text-indigo-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-indigo-900">Organization</p>
                    <p className="text-base text-indigo-800 font-semibold">
                      {session.user.organization.name}
                    </p>
                    {session.user.organization.domain && (
                      <p className="text-sm text-indigo-600 mt-1">
                        Domain: {session.user.organization.domain}
                      </p>
                    )}
                    <Link
                      href="/organization"
                      className="inline-flex items-center text-sm text-indigo-700 hover:text-indigo-800 font-medium mt-2"
                    >
                      View Organization →
                    </Link>
                  </div>
                </div>
              )}

              <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                <Shield className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Role & Permissions</p>
                  <div className="mt-2">
                    {getRoleBadge(session?.user?.role || 'USER')}
                  </div>
                  <ul className="mt-3 space-y-1 text-sm text-gray-600">
                    <li className="flex items-center">
                      <span className="h-1.5 w-1.5 bg-gray-400 rounded-full mr-2"></span>
                      View organization members
                    </li>
                    {(session?.user?.role === 'ADMINISTRATOR' || session?.user?.role === 'SUPERADMIN') && (
                      <>
                        <li className="flex items-center">
                          <span className="h-1.5 w-1.5 bg-blue-500 rounded-full mr-2"></span>
                          Manage users in organization
                        </li>
                        <li className="flex items-center">
                          <span className="h-1.5 w-1.5 bg-blue-500 rounded-full mr-2"></span>
                          Edit organization settings
                        </li>
                      </>
                    )}
                    {session?.user?.role === 'SUPERADMIN' && (
                      <>
                        <li className="flex items-center">
                          <span className="h-1.5 w-1.5 bg-purple-500 rounded-full mr-2"></span>
                          View all organizations
                        </li>
                        <li className="flex items-center">
                          <span className="h-1.5 w-1.5 bg-purple-500 rounded-full mr-2"></span>
                          Grant superadmin privileges
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="border-t border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Stats</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-4 p-4 bg-indigo-50 rounded-lg">
                <div className="bg-indigo-100 rounded-full p-3">
                  <Link2 className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-indigo-900">Protected URLs</p>
                  <p className="text-2xl font-bold text-indigo-700">{stats.protectedUrls}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-lg">
                <div className="bg-purple-100 rounded-full p-3">
                  <Eye className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-900">Total Views</p>
                  <p className="text-2xl font-bold text-purple-700">{stats.totalViews}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
