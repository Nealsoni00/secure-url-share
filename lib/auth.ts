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
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        session.user.isAdmin = (await prisma.user.findUnique({
          where: { id: user.id },
          select: { isAdmin: true }
        }))?.isAdmin || false
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'database',
  },
}