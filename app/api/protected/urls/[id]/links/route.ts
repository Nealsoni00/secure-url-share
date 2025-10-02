import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'
import bcrypt from 'bcryptjs'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const protectedUrl = await prisma.protectedUrl.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!protectedUrl) {
      return NextResponse.json({ error: 'URL not found' }, { status: 404 })
    }

    const { recipientName, recipientEmail, password, expiresAt, maxAccesses } = await request.json()

    const hashedPassword = await bcrypt.hash(password, 10)
    const uniqueCode = nanoid(12)

    const accessLink = await prisma.accessLink.create({
      data: {
        protectedUrlId: protectedUrl.id,
        uniqueCode,
        recipientName,
        recipientEmail,
        password: hashedPassword,
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