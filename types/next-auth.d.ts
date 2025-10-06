import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: 'USER' | 'ADMINISTRATOR' | 'SUPERADMIN'
      isAdmin: boolean
      isSuperAdmin: boolean
      organizationId: string | null
      organization: {
        id: string
        name: string
        domain: string | null
      } | null
    } & DefaultSession['user']
  }
}