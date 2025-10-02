import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'

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
    const { originalUrl, title, description, customSlug } = await request.json()

    const slug = customSlug || nanoid(10)

    const protectedUrl = await prisma.protectedUrl.create({
      data: {
        userId: session.user.id,
        originalUrl,
        title,
        description,
        customSlug: slug,
      }
    })

    return NextResponse.json(protectedUrl)
  } catch (error) {
    console.error('Error creating protected URL:', error)
    return NextResponse.json({ error: 'Failed to create protected URL' }, { status: 500 })
  }
}