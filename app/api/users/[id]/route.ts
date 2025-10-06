import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { UpdateUserRequest, ApiError } from '@/types/api'

// GET user by ID
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

    const user = await prisma.user.findUnique({
      where: { id },
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
      }
    })

    if (!user) {
      return NextResponse.json({
        error: 'User not found'
      } satisfies ApiError, { status: 404 })
    }

    // Check permissions
    const canView = session.user.isSuperAdmin ||
                   (session.user.isAdmin && session.user.organizationId === user.organizationId) ||
                   session.user.id === user.id

    if (!canView) {
      return NextResponse.json({
        error: 'Forbidden'
      } satisfies ApiError, { status: 403 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({
      error: 'Failed to fetch user'
    } satisfies ApiError, { status: 500 })
  }
}

// PATCH update user
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
    const body = await request.json() as UpdateUserRequest
    const { name, isAdmin, isSuperAdmin, organizationId } = body

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { organizationId: true }
    })

    if (!targetUser) {
      return NextResponse.json({
        error: 'User not found'
      } satisfies ApiError, { status: 404 })
    }

    // Permission checks
    const isSelfUpdate = session.user.id === id
    const isOrgAdmin = session.user.isAdmin && session.user.organizationId === targetUser.organizationId
    const canUpdate = session.user.isSuperAdmin || isOrgAdmin || isSelfUpdate

    if (!canUpdate) {
      return NextResponse.json({
        error: 'Forbidden'
      } satisfies ApiError, { status: 403 })
    }

    // Build update data
    const updateData: Partial<UpdateUserRequest> = {}

    // Anyone can update their own name
    if (name !== undefined) updateData.name = name

    // Only admins can change admin status or organization
    if (session.user.isSuperAdmin || (isOrgAdmin && !isSelfUpdate)) {
      if (isAdmin !== undefined) updateData.isAdmin = isAdmin
      if (organizationId !== undefined) updateData.organizationId = organizationId || null
    }

    // Only superadmin can change superadmin status
    if (session.user.isSuperAdmin) {
      if (isSuperAdmin !== undefined) updateData.isSuperAdmin = isSuperAdmin
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        isSuperAdmin: true,
        organizationId: true,
        organization: {
          select: {
            id: true,
            name: true,
            domain: true
          }
        }
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({
      error: 'Failed to update user'
    } satisfies ApiError, { status: 500 })
  }
}

// DELETE user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params

    // Prevent self-deletion
    if (session.user.id === id) {
      return NextResponse.json({
        error: 'Cannot delete your own account'
      } satisfies ApiError, { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { organizationId: true }
    })

    if (!targetUser) {
      return NextResponse.json({
        error: 'User not found'
      } satisfies ApiError, { status: 404 })
    }

    // Permission check
    const isOrgAdmin = session.user.isAdmin && session.user.organizationId === targetUser.organizationId
    if (!session.user.isSuperAdmin && !isOrgAdmin) {
      return NextResponse.json({
        error: 'Forbidden'
      } satisfies ApiError, { status: 403 })
    }

    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({
      error: 'Failed to delete user'
    } satisfies ApiError, { status: 500 })
  }
}
