import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'

const ALLOWED_DOMAINS = ['prepard911.com', 'axon.com', 'nealsoni.com']
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'nealsoni00@gmail.com'

// Organization domains that should auto-create organizations
const ORGANIZATION_DOMAINS = ['axon.com', 'prepared911.com']

// Helper to get or create organization for a domain
async function getOrCreateOrganization(email: string, userId: string) {
  const emailDomain = email.split('@')[1]

  // Check if domain should have an organization
  if (!ORGANIZATION_DOMAINS.includes(emailDomain)) {
    return null
  }

  // Try to find existing organization
  let organization = await prisma.organization.findUnique({
    where: { domain: emailDomain }
  })

  // Create organization if it doesn't exist
  if (!organization) {
    const orgName = emailDomain.split('.')[0]
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

    organization = await prisma.organization.create({
      data: {
        domain: emailDomain,
        name: orgName,
        createdBy: userId
      }
    })
  }

  return organization
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false

      const emailDomain = user.email.split('@')[1]
      const isAllowed = ALLOWED_DOMAINS.includes(emailDomain) || user.email === ADMIN_EMAIL

      // Handle user setup on first login
      if (isAllowed && user.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true, isSuperAdmin: true }
          })

          if (dbUser && user.email === ADMIN_EMAIL && !dbUser.isSuperAdmin) {
            // Set superadmin for the ADMIN_EMAIL (using old schema for now)
            await prisma.user.update({
              where: { id: user.id },
              data: { isAdmin: true }
            }).catch(() => {})
          }
        } catch (error) {
          console.error('Error updating user on signin:', error)
        }
      }

      return isAllowed
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: {
              name: true,
              email: true,
              image: true,
              isAdmin: true
            }
          })

          if (dbUser) {
            session.user.name = dbUser.name || session.user.name
            session.user.email = dbUser.email || session.user.email
            session.user.image = dbUser.image || session.user.image
            // Use old schema fields for now
            session.user.role = dbUser.isAdmin ? 'ADMINISTRATOR' : 'USER'
            session.user.isAdmin = dbUser.isAdmin || false
            session.user.isSuperAdmin = dbUser.isAdmin || false
            session.user.organizationId = null
            session.user.organization = null
          }
        } catch (error) {
          console.error('Error fetching user session:', error)
          // Set defaults if query fails
          session.user.role = 'USER'
          session.user.isAdmin = false
          session.user.isSuperAdmin = false
          session.user.organizationId = null
          session.user.organization = null
        }
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
      }
      return token
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl + '/dashboard'
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 12 * 60 * 60, // 12 hours in seconds
  },
  jwt: {
    maxAge: 12 * 60 * 60, // 12 hours in seconds
  },
}