import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { CreateUserRequest, ApiError } from '@/types/api'

// GET users in organization (org admin or superadmin)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    // Superadmin can see all users or filter by organization
    if (session.user.isSuperAdmin) {
      const where = organizationId ? { organizationId } : {}
      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          isAdmin: true,
          isSuperAdmin: true,
          organizationId: true,
          organization: {
            select: {
              id: true,
              name: true,
              domain: true
            }
          },
          createdAt: true,
          _count: {
            select: { protectedUrls: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
      return NextResponse.json(users)
    }

    // Any user in an organization can view members
    if (session.user.organizationId) {
      const users = await prisma.user.findMany({
        where: { organizationId: session.user.organizationId },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          role: true,
          isAdmin: true,
          isSuperAdmin: true,
          createdAt: true,
          _count: {
            select: { protectedUrls: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
      return NextResponse.json(users)
    }

    return NextResponse.json({ error: 'Forbidden - You must be part of an organization' }, { status: 403 })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

// POST create new user (org admin or superadmin)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json() as CreateUserRequest
    const { email, name, organizationId, isAdmin } = body

    if (!email) {
      return NextResponse.json({
        error: 'Email is required'
      } satisfies ApiError, { status: 400 })
    }

    // Validate permissions
    const isSuperAdmin = session.user.isSuperAdmin
    const isOrgAdmin = session.user.isAdmin && session.user.organizationId === organizationId

    if (!isSuperAdmin && !isOrgAdmin) {
      return NextResponse.json({
        error: 'Forbidden'
      } satisfies ApiError, { status: 403 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({
        error: 'User with this email already exists'
      } satisfies ApiError, { status: 409 })
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        organizationId: organizationId || null,
        isAdmin: isAdmin || false,
        emailVerified: new Date() // Pre-verify manually created users
      },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        organizationId: true,
        createdAt: true
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error creating user:', error)

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({
        error: 'User with this email already exists'
      } satisfies ApiError, { status: 409 })
    }

    return NextResponse.json({
      error: 'Failed to create user'
    } satisfies ApiError, { status: 500 })
  }
}
