import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'
import bcrypt from 'bcryptjs'

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
    return NextResponse.json({ error: 'Failed to fetch URLs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { originalUrl, title, description, customSlug, displayMode, showUserInfo } = await request.json()

    const slug = customSlug || nanoid(10)

    // Generate a random password for the default access link
    const defaultPassword = nanoid(12)
    const hashedPassword = await bcrypt.hash(defaultPassword, 10)

    // Create ProtectedUrl with a default AccessLink in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const protectedUrl = await tx.protectedUrl.create({
        data: {
          userId: session.user.id,
          originalUrl,
          title,
          description,
          customSlug: slug,
          ...(displayMode && { displayMode }),
          ...(showUserInfo !== undefined && { showUserInfo })
        } as any
      })

      // Create a default password-protected access link
      const accessLink = await tx.accessLink.create({
        data: {
          protectedUrlId: protectedUrl.id,
          uniqueCode: nanoid(),
          authMethod: 'password',
          password: hashedPassword,
          requireVerification: false,
        }
      })

      return { protectedUrl, accessLink, defaultPassword }
    })

    return NextResponse.json({
      ...result.protectedUrl,
      defaultAccessLink: {
        uniqueCode: result.accessLink.uniqueCode,
        password: result.defaultPassword
      }
    })
  } catch (error) {
    console.error('Error creating protected URL:', error)
    return NextResponse.json({ error: 'Failed to create protected URL' }, { status: 500 })
  }
}