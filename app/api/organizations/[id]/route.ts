import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { UpdateOrganizationRequest, ApiError } from '@/types/api'

// GET organization by ID (org admin or superadmin)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params

    // Check access rights
    if (!session.user.isSuperAdmin && session.user.organizationId !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            isAdmin: true,
            isSuperAdmin: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    return NextResponse.json(organization)
  } catch (error) {
    console.error('Error fetching organization:', error)
    return NextResponse.json({ error: 'Failed to fetch organization' }, { status: 500 })
  }
}

// PATCH update organization (org admin or superadmin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json() as UpdateOrganizationRequest

    // Check access rights
    const isOrgAdmin = session.user.isAdmin && session.user.organizationId === id
    if (!session.user.isSuperAdmin && !isOrgAdmin) {
      return NextResponse.json({ error: 'Forbidden' } satisfies ApiError, { status: 403 })
    }

    const updateData: Partial<UpdateOrganizationRequest> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.domain !== undefined) updateData.domain = body.domain || null

    const organization = await prisma.organization.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(organization)
  } catch (error) {
    console.error('Error updating organization:', error)

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({
        error: 'An organization with this domain already exists'
      } satisfies ApiError, { status: 409 })
    }

    return NextResponse.json({
      error: 'Failed to update organization'
    } satisfies ApiError, { status: 500 })
  }
}

// DELETE organization (superadmin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params

    await prisma.organization.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting organization:', error)
    return NextResponse.json({ error: 'Failed to delete organization' }, { status: 500 })
  }
}
