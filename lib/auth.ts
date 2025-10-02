import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'

const ALLOWED_DOMAINS = ['prepard911.com', 'axon.com', 'nealsoni.com']
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'nealsoni00@gmail.com'

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

      if (isAllowed && user.email === ADMIN_EMAIL) {
        await prisma.user.update({
          where: { email: user.email },
          data: { isAdmin: true }
        }).catch(() => {})
      }

      return isAllowed
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { isAdmin: true }
        })
        session.user.isAdmin = dbUser?.isAdmin || false
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
  },
}