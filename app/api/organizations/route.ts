import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 })
  }
}

// POST create new organization (superadmin only)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, domain } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Organization name is required' }, { status: 400 })
    }

    const organization = await prisma.organization.create({
      data: {
        name,
        domain: domain || null,
        createdBy: session.user.id
      }
    })

    return NextResponse.json(organization)
  } catch (error: any) {
    console.error('Error creating organization:', error)

    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'An organization with this domain already exists' }, { status: 409 })
    }

    return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
  }
}
