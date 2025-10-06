import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { validateRealName } from '@/lib/validation'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const accessLink = await prisma.accessLink.findUnique({
      where: { uniqueCode: code },
      select: {
        authMethod: true,
        recipientName: true,
        recipientEmail: true,
        recipientPhone: true,
        requireVerification: true,
        isActive: true,
        expiresAt: true,
        maxAccesses: true,
        accessCount: true,
      }
    })

    if (!accessLink || !accessLink.isActive) {
      return NextResponse.json({ error: 'Invalid or inactive link' }, { status: 404 })
    }

    return NextResponse.json({
      authMethod: accessLink.authMethod,
      recipientName: accessLink.recipientName,
      recipientEmail: accessLink.recipientEmail,
      recipientPhone: accessLink.recipientPhone,
      requireVerification: accessLink.requireVerification,
    })
  } catch (error) {
    console.error('Error getting link info:', error)
    return NextResponse.json({ error: 'Failed to get link info' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const body = await request.json()
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'
    const userAgent = request.headers.get('user-agent') || ''

    const accessLink = await prisma.accessLink.findUnique({
      where: { uniqueCode: code },
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

    // Validate based on authentication method
    let isValid = false
    let providedName = null
    let providedEmail = null
    let providedPhone = null

    switch (accessLink.authMethod) {
      case 'password':
        if (!body.password || !accessLink.password) {
          return NextResponse.json({ error: 'Password required' }, { status: 401 })
        }
        isValid = await bcrypt.compare(body.password, accessLink.password)
        if (!isValid) {
          return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
        }
        break

      case 'name':
        if (!body.name) {
          return NextResponse.json({ error: 'Name required' }, { status: 401 })
        }

        // Validate that the name is legitimate (not fake)
        const nameValidation = validateRealName(body.name)
        if (!nameValidation.valid) {
          return NextResponse.json({ error: nameValidation.error }, { status: 400 })
        }

        // Case-insensitive comparison, trimmed
        providedName = body.name.trim()
        const expectedName = accessLink.recipientName?.trim().toLowerCase()
        const providedNameLower = providedName.toLowerCase()

        if (accessLink.requireVerification && expectedName) {
          // Strict matching for verification when recipient name is set
          isValid = providedNameLower === expectedName
          if (!isValid) {
            return NextResponse.json({ error: 'Name does not match expected recipient' }, { status: 401 })
          }
        } else if (expectedName) {
          // Fuzzy matching - allow partial match for flexibility
          isValid = providedNameLower.includes(expectedName) || expectedName.includes(providedNameLower)
          if (!isValid) {
            return NextResponse.json({ error: 'Name does not match expected recipient' }, { status: 401 })
          }
        } else {
          // No expected name - just accept any valid real name
          isValid = true
        }
        break

      case 'email':
        if (!body.email) {
          return NextResponse.json({ error: 'Email required' }, { status: 401 })
        }
        providedEmail = body.email.trim().toLowerCase()
        const expectedEmail = accessLink.recipientEmail?.trim().toLowerCase()

        if (accessLink.requireVerification) {
          // TODO: Send verification code to email
          // For now, just check exact match
          isValid = providedEmail === expectedEmail
        } else {
          isValid = providedEmail === expectedEmail
        }

        if (!isValid) {
          return NextResponse.json({ error: 'Email does not match' }, { status: 401 })
        }
        break

      case 'phone':
        if (!body.phone) {
          return NextResponse.json({ error: 'Phone number required' }, { status: 401 })
        }
        // Remove all non-digits for comparison
        providedPhone = body.phone.replace(/\D/g, '')
        const expectedPhone = accessLink.recipientPhone?.replace(/\D/g, '')

        if (accessLink.requireVerification) {
          // TODO: Send verification code via SMS
          // For now, just check exact match
          isValid = providedPhone === expectedPhone
        } else {
          isValid = providedPhone === expectedPhone
        }

        if (!isValid) {
          return NextResponse.json({ error: 'Phone number does not match' }, { status: 401 })
        }
        break

      case 'none':
        // No authentication required
        isValid = true
        break

      default:
        return NextResponse.json({ error: 'Invalid authentication method' }, { status: 400 })
    }

    // Update access count and create log
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
          providedName,
          providedEmail,
          providedPhone,
        }
      })
    ])

    return NextResponse.json({
      originalUrl: accessLink.protectedUrl.originalUrl,
      title: accessLink.protectedUrl.title,
      recipientName: accessLink.recipientName,
      displayMode: (accessLink.protectedUrl as any).displayMode || 'iframe',
      showUserInfo: (accessLink.protectedUrl as any).showUserInfo !== false,
      protectedUrlId: accessLink.protectedUrlId
    })
  } catch (error) {
    console.error('Error accessing URL:', error)
    return NextResponse.json({ error: 'Failed to access URL' }, { status: 500 })
  }
}