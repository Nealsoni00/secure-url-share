import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    const protectedUrl = await prisma.protectedUrl.findUnique({
      where: { id },
      include: {
        accessLinks: {
          select: {
            id: true,
            uniqueCode: true,
            recipientName: true,
            recipientEmail: true,
            recipientPhone: true,
            authMethod: true,
            requireVerification: true,
            accessCount: true,
            maxAccesses: true,
            expiresAt: true,
            isActive: true,
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { accessLogs: true }
        }
      }
    })

    if (!protectedUrl || protectedUrl.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(protectedUrl)
  } catch (error) {
    console.error('Error fetching URL:', error)
    return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 500 })
  }
}

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
    const body = await request.json()
    const { title, description, customSlug, displayMode, showUserInfo, isActive } = body

    // Check ownership
    const existing = await prisma.protectedUrl.findUnique({
      where: { id },
      select: { userId: true }
    })

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Check if customSlug is already taken by another URL
    if (customSlug) {
      const slugExists = await prisma.protectedUrl.findFirst({
        where: {
          customSlug,
          id: { not: id }
        }
      })

      if (slugExists) {
        return NextResponse.json({ error: 'Slug already taken' }, { status: 400 })
      }
    }

    const updated = await prisma.protectedUrl.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(customSlug !== undefined && { customSlug }),
        ...(displayMode !== undefined && { displayMode }),
        ...(showUserInfo !== undefined && { showUserInfo }),
        ...(isActive !== undefined && { isActive }),
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating URL:', error)
    return NextResponse.json({ error: 'Failed to update URL' }, { status: 500 })
  }
}

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

    // Check ownership
    const existing = await prisma.protectedUrl.findUnique({
      where: { id },
      select: { userId: true }
    })

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.protectedUrl.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting URL:', error)
    return NextResponse.json({ error: 'Failed to delete URL' }, { status: 500 })
  }
}
