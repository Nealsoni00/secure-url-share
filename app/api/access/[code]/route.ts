import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { password } = await request.json()
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'
    const userAgent = request.headers.get('user-agent') || ''

    const accessLink = await prisma.accessLink.findUnique({
      where: { uniqueCode: params.code },
      include: {
        protectedUrl: true
      }
    })

    if (!accessLink || !accessLink.isActive) {
      return NextResponse.json({ error: 'Invalid or inactive link' }, { status: 404 })
    }

    if (accessLink.expiresAt && new Date() > accessLink.expiresAt) {
      return NextResponse.json({ error: 'Link has expired' }, { status: 403 })
    }

    if (accessLink.maxAccesses && accessLink.accessCount >= accessLink.maxAccesses) {
      return NextResponse.json({ error: 'Maximum access limit reached' }, { status: 403 })
    }

    const isPasswordValid = await bcrypt.compare(password, accessLink.password)
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    await prisma.$transaction([
      prisma.accessLink.update({
        where: { id: accessLink.id },
        data: { accessCount: { increment: 1 } }
      }),
      prisma.accessLog.create({
        data: {
          protectedUrlId: accessLink.protectedUrlId,
          accessLinkId: accessLink.id,
          ipAddress: ipAddress.toString(),
          userAgent,
          referrer: request.headers.get('referer') || null,
        }
      })
    ])

    return NextResponse.json({
      originalUrl: accessLink.protectedUrl.originalUrl,
      title: accessLink.protectedUrl.title,
      recipientName: accessLink.recipientName
    })
  } catch (error) {
    console.error('Error accessing URL:', error)
    return NextResponse.json({ error: 'Failed to access URL' }, { status: 500 })
  }
}