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

    // Check ownership
    const protectedUrl = await prisma.protectedUrl.findUnique({
      where: { id },
      select: { userId: true, title: true, originalUrl: true, customSlug: true }
    })

    if (!protectedUrl || protectedUrl.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Get all access logs
    const accessLogs = await prisma.accessLog.findMany({
      where: { protectedUrlId: id },
      include: {
        accessLink: {
          select: {
            uniqueCode: true,
            recipientName: true,
            recipientEmail: true,
            authMethod: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate analytics
    const totalAccesses = accessLogs.length

    // IP address statistics
    const ipStats = accessLogs.reduce((acc, log) => {
      acc[log.ipAddress] = (acc[log.ipAddress] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const ipAnalytics = Object.entries(ipStats)
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)

    // User agent statistics
    const userAgentStats = accessLogs.reduce((acc, log) => {
      const ua = log.userAgent || 'Unknown'
      acc[ua] = (acc[ua] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const userAgentAnalytics = Object.entries(userAgentStats)
      .map(([userAgent, count]) => ({ userAgent, count }))
      .sort((a, b) => b.count - a.count)

    // Access by link
    const linkStats = accessLogs.reduce((acc, log) => {
      const linkId = log.accessLinkId || 'direct'
      if (!acc[linkId]) {
        acc[linkId] = {
          linkId,
          count: 0,
          uniqueCode: log.accessLink?.uniqueCode || 'Direct',
          recipientName: log.accessLink?.recipientName,
          authMethod: log.accessLink?.authMethod,
        }
      }
      acc[linkId].count++
      return acc
    }, {} as Record<string, any>)

    const linkAnalytics = Object.values(linkStats).sort((a: any, b: any) => b.count - a.count)

    // Access over time (by day)
    const accessByDay = accessLogs.reduce((acc, log) => {
      const date = new Date(log.createdAt).toISOString().split('T')[0]
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const timeSeriesData = Object.entries(accessByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Access by hour (24-hour format)
    const accessByHour = accessLogs.reduce((acc, log) => {
      const hour = new Date(log.createdAt).getHours()
      acc[hour] = (acc[hour] || 0) + 1
      return acc
    }, {} as Record<number, number>)

    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: accessByHour[hour] || 0
    }))

    // Unique users (by provided name/email/phone or IP)
    const uniqueIdentifiers = new Set(
      accessLogs.map(log =>
        log.providedEmail || log.providedName || log.providedPhone || log.ipAddress
      )
    )

    // Recent accesses (last 50)
    const recentAccesses = accessLogs.slice(0, 50).map(log => ({
      id: log.id,
      timestamp: log.createdAt,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      providedName: log.providedName,
      providedEmail: log.providedEmail,
      providedPhone: log.providedPhone,
      accessLink: log.accessLink ? {
        uniqueCode: log.accessLink.uniqueCode,
        recipientName: log.accessLink.recipientName,
        authMethod: log.accessLink.authMethod,
      } : null,
      country: log.country,
      city: log.city,
    }))

    return NextResponse.json({
      urlInfo: {
        title: protectedUrl.title,
        originalUrl: protectedUrl.originalUrl,
        customSlug: protectedUrl.customSlug,
      },
      summary: {
        totalAccesses,
        uniqueUsers: uniqueIdentifiers.size,
        uniqueIPs: Object.keys(ipStats).length,
        firstAccess: accessLogs.length > 0 ? accessLogs[accessLogs.length - 1].createdAt : null,
        lastAccess: accessLogs.length > 0 ? accessLogs[0].createdAt : null,
      },
      ipAnalytics,
      userAgentAnalytics,
      linkAnalytics,
      timeSeriesData,
      hourlyData,
      recentAccesses,
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
