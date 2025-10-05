import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'
import bcrypt from 'bcryptjs'

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
    const protectedUrl = await prisma.protectedUrl.findFirst({
      where: {
        id: id,
        userId: session.user.id
      }
    })

    if (!protectedUrl) {
      return NextResponse.json({ error: 'URL not found' }, { status: 404 })
    }

    const accessLinks = await prisma.accessLink.findMany({
      where: {
        protectedUrlId: protectedUrl.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const linksWithFullUrl = accessLinks.map(link => ({
      ...link,
      password: undefined,
      fullUrl: `${baseUrl}/s/${link.uniqueCode}`
    }))

    return NextResponse.json(linksWithFullUrl)
  } catch (error) {
    console.error('Error fetching access links:', error)
    return NextResponse.json({ error: 'Failed to fetch access links' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const protectedUrl = await prisma.protectedUrl.findFirst({
      where: {
        id: id,
        userId: session.user.id
      }
    })

    if (!protectedUrl) {
      return NextResponse.json({ error: 'URL not found' }, { status: 404 })
    }

    const {
      recipientName,
      recipientEmail,
      recipientPhone,
      password,
      authMethod,
      requireVerification,
      expiresAt,
      maxAccesses
    } = await request.json()

    // Hash password only if it's provided and auth method is password
    const hashedPassword = password && authMethod === 'password'
      ? await bcrypt.hash(password, 10)
      : null

    const uniqueCode = nanoid(12)

    const accessLink = await prisma.accessLink.create({
      data: {
        protectedUrlId: protectedUrl.id,
        uniqueCode,
        recipientName,
        recipientEmail,
        recipientPhone,
        authMethod: authMethod || 'password',
        password: hashedPassword,
        requireVerification: requireVerification || false,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        maxAccesses,
      }
    })

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const fullUrl = `${baseUrl}/s/${accessLink.uniqueCode}`

    return NextResponse.json({
      ...accessLink,
      password: undefined,
      fullUrl
    })
  } catch (error) {
    console.error('Error creating access link:', error)
    return NextResponse.json({ error: 'Failed to create access link' }, { status: 500 })
  }
}