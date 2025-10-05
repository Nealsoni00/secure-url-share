import { NextRequest } from 'next/server'

/**
 * Get the base URL from the request headers
 * This ensures URLs work across different domains (localhost, custom domain, Vercel)
 */
export function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host')
  const protocol = request.headers.get('x-forwarded-proto') || 'http'

  if (host) {
    return `${protocol}://${host}`
  }

  // Fallback to NEXTAUTH_URL for local development
  return process.env.NEXTAUTH_URL || 'http://localhost:3000'
}
