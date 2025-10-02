# Secure URL Share

A secure URL sharing application with password protection and access tracking.

## Features

- Google OAuth authentication (restricted to @prepard911.com, @axon.com, and @nealsoni.com domains)
- Create password-protected links for any URL
- Track who accesses links with IP logging
- Admin dashboard for viewing all access logs
- Iframe embedding to protect original URLs
- Custom slugs and expiration dates for links
- Access limit controls

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (copy `.env.local.example` to `.env.local` and fill in values)
4. Run database migrations: `npx prisma migrate dev`
5. Start development server: `npm run dev`

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string from Vercel Postgres
- `NEXTAUTH_URL`: Your application URL
- `NEXTAUTH_SECRET`: Secret for NextAuth session encryption
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `ADMIN_EMAIL`: Admin user email (defaults to nealsoni00@gmail.com)

## Deployment

This application is configured for deployment on Vercel with automatic GitHub integration.

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## Tech Stack

- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL (Vercel Postgres)
- NextAuth.js for authentication
- Google OAuth