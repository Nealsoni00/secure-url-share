import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'
import bcrypt from 'bcryptjs'
import type { CreateProtectedUrlRequest, ApiError } from '@/types/api'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const urls = await prisma.protectedUrl.findMany({
      where: { userId: session.user.id },
      include: {
        accessLinks: {
          select: {
            id: true,
            uniqueCode: true,
            recipientName: true,
            accessCount: true,
            isActive: true,
          }
        },
        _count: {
          select: { accessLogs: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(urls)
  } catch (error) {
    console.error('Error fetching URLs:', error)
    return NextResponse.json({
      error: 'Failed to fetch URLs'
    } satisfies ApiError, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json() as CreateProtectedUrlRequest
    const { originalUrl, title, description, customSlug, displayMode, showUserInfo } = body

    // Validate the original URL
    try {
      new URL(originalUrl)
    } catch {
      return NextResponse.json({
        error: 'Invalid URL format. Please provide a valid URL starting with http:// or https://'
      } satisfies ApiError, { status: 400 })
    }

    const slug = customSlug || nanoid(10)

    // Create ProtectedUrl with a default passwordless name-based AccessLink
    const result = await prisma.$transaction(async (tx) => {
      const protectedUrl = await tx.protectedUrl.create({
        data: {
          userId: session.user.id,
          originalUrl,
          title,
          description,
          customSlug: slug,
          displayMode: displayMode || 'auto',
          showUserInfo: showUserInfo ?? true
        }
      })

      // Create a default name-based access link (passwordless, least intrusive)
      const accessLink = await tx.accessLink.create({
        data: {
          protectedUrlId: protectedUrl.id,
          uniqueCode: nanoid(12),
          authMethod: 'name',
          password: null,
          requireVerification: false,
        }
      })

      return { protectedUrl, accessLink }
    })

    return NextResponse.json({
      ...result.protectedUrl,
      defaultAccessLink: {
        uniqueCode: result.accessLink.uniqueCode
      }
    })
  } catch (error) {
    console.error('Error creating protected URL:', error)

    // Handle Prisma unique constraint violations
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      const meta = 'meta' in error ? error.meta as Record<string, unknown> : null
      const field = meta?.target instanceof Array ? meta.target[0] : null
      if (field === 'customSlug') {
        return NextResponse.json({
          error: `The custom slug "${customSlug}" is already in use. Please choose a different one.`
        } satisfies ApiError, { status: 409 })
      }
    }

    return NextResponse.json({
      error: 'Failed to create protected URL'
    } satisfies ApiError, { status: 500 })
  }
}