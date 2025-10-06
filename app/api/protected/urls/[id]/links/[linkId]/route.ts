import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getBaseUrl } from '@/lib/url'
import type { UpdateAccessLinkData, ApiError } from '@/types/api'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; linkId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id, linkId } = await params
    const body = await request.json() as UpdateAccessLinkData
    const { isActive, recipientName, recipientEmail, recipientPhone, expiresAt, maxAccesses } = body

    // First verify the user owns the protected URL
    const protectedUrl = await prisma.protectedUrl.findFirst({
      where: {
        id: id,
        userId: session.user.id
      }
    })

    if (!protectedUrl) {
      return NextResponse.json({
        error: 'URL not found'
      } satisfies ApiError, { status: 404 })
    }

    // Build update data object
    const updateData: UpdateAccessLinkData = {}
    if (isActive !== undefined) updateData.isActive = isActive
    if (recipientName !== undefined) updateData.recipientName = recipientName || null
    if (recipientEmail !== undefined) updateData.recipientEmail = recipientEmail || null
    if (recipientPhone !== undefined) updateData.recipientPhone = recipientPhone || null
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null
    if (maxAccesses !== undefined) updateData.maxAccesses = maxAccesses ? Number(maxAccesses) : null

    // Update the access link
    const updatedLink = await prisma.accessLink.update({
      where: {
        id: linkId,
        protectedUrlId: protectedUrl.id
      },
      data: updateData
    })

    const baseUrl = getBaseUrl(request)
    return NextResponse.json({
      ...updatedLink,
      password: undefined,
      fullUrl: `${baseUrl}/s/${updatedLink.uniqueCode}`
    })
  } catch (error) {
    console.error('Error updating access link:', error)
    return NextResponse.json({
      error: 'Failed to update access link'
    } satisfies ApiError, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; linkId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id, linkId } = await params
    // First verify the user owns the protected URL
    const protectedUrl = await prisma.protectedUrl.findFirst({
      where: {
        id: id,
        userId: session.user.id
      }
    })

    if (!protectedUrl) {
      return NextResponse.json({
        error: 'URL not found'
      } satisfies ApiError, { status: 404 })
    }

    // Delete the access link
    const deletedLink = await prisma.accessLink.delete({
      where: {
        id: linkId,
        protectedUrlId: protectedUrl.id
      }
    })

    return NextResponse.json({ success: true, deleted: deletedLink.id })
  } catch (error) {
    console.error('Error deleting access link:', error)
    return NextResponse.json({
      error: 'Failed to delete access link'
    } satisfies ApiError, { status: 500 })
  }
}