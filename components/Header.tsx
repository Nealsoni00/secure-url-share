'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Shield,
  Menu,
  Users,
  LogOut,
  User,
  Building2,
  Crown,
  Settings,
  ChevronRight
} from 'lucide-react'

export default function Header() {
  const { data: session } = useSession()
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)

  if (!session?.user) return null

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo/Title */}
          <Link
            href="/dashboard"
            className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
          >
            <Shield className="h-8 w-8 text-indigo-600 mr-3" />
            <h1 className="text-xl font-bold text-gray-900">Secure URL Share</h1>
          </Link>

          {/* User Info and Menu */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700 hidden sm:block">{session.user.email}</span>

            {/* User Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {session.user.image ? (
                  <div className="relative h-8 w-8 rounded-full border-2 border-indigo-200 overflow-hidden">
                    <Image
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      fill
                      className="object-cover"
                      sizes="32px"
                    />
                  </div>
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
                        {session.user.image ? (
                          <div className="relative h-12 w-12 rounded-full border-2 border-indigo-200 overflow-hidden flex-shrink-0">
                            <Image
                              src={session.user.image}
                              alt={session.user.name || 'User'}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Users className="h-6 w-6 text-indigo-600" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {session.user.name || 'User'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
                          {session.user.role && (
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
                                  <User className="h-3 w-3 mr-1" />
                                  User
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {session.user.organization && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">Organization</p>
                          <p className="text-sm font-medium text-indigo-600 truncate">
                            {session.user.organization.name}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setShowMenu(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <User className="h-4 w-4 mr-3 text-gray-500" />
                        Profile
                        <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
                      </Link>

                      {session.user.organization && (
                        <Link
                          href="/organization"
                          onClick={() => setShowMenu(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <Building2 className="h-4 w-4 mr-3 text-gray-500" />
                          Organization
                          <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
                        </Link>
                      )}

                      {(session.user.isAdmin || session.user.role === 'ADMINISTRATOR' || session.user.isSuperAdmin) && (
                        <Link
                          href="/users"
                          onClick={() => setShowMenu(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <Users className="h-4 w-4 mr-3 text-gray-500" />
                          {session.user.role === 'USER' ? 'Organization Members' : 'User Management'}
                          <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
                        </Link>
                      )}

                      {session.user.isSuperAdmin && (
                        <Link
                          href="/superadmin"
                          onClick={() => setShowMenu(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <Crown className="h-4 w-4 mr-3 text-purple-600" />
                          Superadmin Panel
                          <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-gray-200 py-1">
                      <button
                        onClick={() => {
                          setShowMenu(false)
                          signOut({ callbackUrl: '/auth/signin' })
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
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
  )
}
