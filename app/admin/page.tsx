'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AccessLog {
  id: string
  ipAddress: string
  userAgent?: string
  createdAt: string
  protectedUrl: {
    originalUrl: string
    title?: string
    user: {
      email: string
      name?: string
    }
  }
  accessLink?: {
    recipientName?: string
    recipientEmail?: string
    uniqueCode: string
  }
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [logs, setLogs] = useState<AccessLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      if (!session?.user?.isAdmin) {
        router.push('/dashboard')
      } else {
        fetchLogs()
      }
    }
  }, [status, session, router])

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/admin/logs')
      if (response.ok) {
        const data = await response.json()
        setLogs(data)
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Admin Dashboard</h1>
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
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Access Logs</h2>

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {logs.length === 0 ? (
                <li className="px-6 py-4 text-center text-gray-500">
                  No access logs yet
                </li>
              ) : (
                logs.map((log) => (
                  <li key={log.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {log.protectedUrl.title || log.protectedUrl.originalUrl}
                            </p>
                            <p className="text-sm text-gray-500">
                              Created by: {log.protectedUrl.user.email}
                            </p>
                            {log.accessLink && (
                              <p className="text-sm text-gray-500">
                                Accessed by: {log.accessLink.recipientName || log.accessLink.recipientEmail || 'Anonymous'}
                              </p>
                            )}
                            <p className="text-xs text-gray-400">
                              IP: {log.ipAddress} • {new Date(log.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}