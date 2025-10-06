import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { CreateOrganizationRequest, ApiError } from '@/types/api'

// GET all organizations (superadmin only)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const organizations = await prisma.organization.findMany({
      include: {
        _count: {
          select: { users: true }
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            isAdmin: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(organizations)
  } catch (error) {
    console.error('Error fetching organizations:', error)
    return NextResponse.json({
      error: 'Failed to fetch organizations'
    } satisfies ApiError, { status: 500 })
  }
}

// POST create new organization (superadmin only)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json() as CreateOrganizationRequest
    const { name, domain } = body

    if (!name) {
      return NextResponse.json({
        error: 'Organization name is required'
      } satisfies ApiError, { status: 400 })
    }

    const organization = await prisma.organization.create({
      data: {
        name,
        domain: domain || null,
        createdBy: session.user.id
      }
    })

    return NextResponse.json(organization)
  } catch (error) {
    console.error('Error creating organization:', error)

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({
        error: 'An organization with this domain already exists'
      } satisfies ApiError, { status: 409 })
    }

    return NextResponse.json({
      error: 'Failed to create organization'
    } satisfies ApiError, { status: 500 })
  }
}
