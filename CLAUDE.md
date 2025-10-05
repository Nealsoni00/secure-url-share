# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A secure URL sharing application with password protection and access tracking. Users can create password-protected links to any URL, with configurable access controls and detailed tracking of who views the content.

## Core Development Commands

```bash
# Development
npm run dev              # Start development server (kills port 3000 first)
npm run dev:next         # Direct Next.js dev server without port cleanup
npm run dev:force        # Force start using shell script

# Database
npx prisma migrate dev   # Run database migrations
npx prisma generate      # Regenerate Prisma client
npx prisma db seed       # Seed database

# Build and Production
npm run build            # Build for production (includes Prisma generate)
npm start                # Start production server
npm run lint             # Run ESLint
```

## Architecture

### Authentication Flow

- Uses NextAuth.js with Google OAuth provider (configured in `lib/auth.ts`)
- Email domain restriction: Only @prepard911.com, @axon.com, @nealsoni.com domains allowed (plus admin email)
- JWT session strategy (not database sessions)
- Admin status automatically set for ADMIN_EMAIL on first sign-in
- PrismaAdapter handles user/account/session persistence

### Core Data Models (Prisma)

**User** → Creates protected URLs, has admin flag
**ProtectedUrl** → The URL being protected, with slug, display mode, and settings
**AccessLink** → Individual access links with flexible auth methods (password/name/email/phone/none)
**AccessLog** → Tracks every access attempt with IP, user agent, and provided credentials

### Access Link Authentication System

The system supports multiple authentication methods per link (set via `authMethod` field):

- `password`: Traditional password protection (bcrypt hashed)
- `name`: Name verification (fuzzy matching unless `requireVerification` is true)
- `email`: Email verification (exact match required)
- `phone`: Phone number verification (digits-only comparison)
- `none`: Public access, no authentication

Each AccessLink can have `requireVerification: boolean` for stricter validation.

### URL Access Flow

1. User visits `/s/{customSlug}` (ProtectedUrl route)
2. Frontend redirects to `/s/{uniqueCode}` where uniqueCode belongs to an AccessLink
3. `/app/s/[code]/page.tsx` fetches link info via `GET /api/access/[code]`
4. User provides credentials based on `authMethod`
5. `POST /api/access/[code]` validates credentials and increments access count
6. On success, returns `originalUrl`, `displayMode`, and `showUserInfo` settings
7. Client either:
   - **Redirect mode**: Immediately redirects to originalUrl
   - **Iframe mode**: Embeds content with optional user info overlay

### Display Modes

- `iframe`: Embeds content in an iframe with optional tracking overlay
- `redirect`: Direct redirect to original URL
- `auto` (frontend only): Detects videos/PDFs for iframe, others for redirect

When `showUserInfo: true`, displays recipient name overlay and watermark to deter sharing.

## API Routes Structure

```
/api/auth/[...nextauth]                      # NextAuth.js authentication
/api/protected/urls                          # GET: List user's URLs, POST: Create new protected URL (auto-creates default AccessLink)
/api/protected/urls/[id]                     # GET: Fetch single URL, PATCH: Update URL, DELETE: Delete URL
/api/protected/urls/[id]/analytics           # GET: Comprehensive analytics (accesses, IPs, user agents, time series)
/api/protected/urls/[id]/links               # GET: List links, POST: Create access link for URL
/api/protected/urls/[id]/links/[linkId]      # PATCH: Toggle link status, DELETE: Delete link
/api/access/[code]                           # GET: Link info, POST: Validate and access
/api/admin/logs                              # Admin-only access logs viewer
```

## Environment Variables

Required `.env.local` variables (see `.env.local.example`):

```bash
URL_SHARING_POSTGRES_URL         # PostgreSQL connection string
NEXTAUTH_URL                     # App URL (http://localhost:3000 for dev)
NEXTAUTH_SECRET                  # JWT encryption secret
GOOGLE_CLIENT_ID                 # Google OAuth credentials
GOOGLE_CLIENT_SECRET
ADMIN_EMAIL                      # Email for admin access (default: nealsoni00@gmail.com)
```

## Path Aliases

Uses `@/*` for root-level imports configured in `tsconfig.json`:

```typescript
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
```

## Key Frontend Patterns

- All pages under `/app` use Next.js 14 App Router with React Server Components
- Client components marked with `'use client'` directive
- Toast notifications via `react-hot-toast` for user feedback
- Clipboard API used for copy-to-clipboard functionality
- Lucide React for icons throughout the app
- Tailwind CSS for all styling

## Important Implementation Notes

- **Password hashing**: Always use `bcrypt.hash()` when creating passwords for AccessLinks
- **Session access**: Use `getServerSession(authOptions)` in API routes for authentication
- **Unique slugs**: `customSlug` must be unique across ProtectedUrls; use `nanoid(10)` for auto-generation
- **AccessLink codes**: Use `nanoid()` for generating `uniqueCode` for AccessLinks
- **Admin checks**: Verify `session.user.isAdmin` before allowing admin operations
- **TypeScript**: Strict mode enabled; avoid `any` types when possible (some Prisma workarounds exist)

## URL Management Page Features

The management page (`/dashboard/urls/[id]`) provides comprehensive control:

### URL Information Section
- **Editable fields**: title, description, customSlug, displayMode, showUserInfo, isActive
- **Edit/Save workflow**: Toggle between view and edit modes
- **Delete URL**: Permanently remove protected URL and all associated links/logs
- **Original URL display**: Read-only with external link button

### Access Links Tab
- **Tabular view**: Shows all access links with full details
- **Quick actions**: Copy URL (just the URL, no extra text), toggle active/inactive, delete
- **Status indicators**: Active, Inactive, Expired, Max Reached
- **Create new links**: Inline form with all auth methods and options
- **Link details**: Shows uniqueCode, authMethod, recipient info, access count, expiration

### Analytics Tab
Comprehensive analytics dashboard with:

- **Summary stats**: Total accesses, unique users, unique IPs, first/last access dates
- **Access by link**: Which links are used most frequently
- **IP analytics**: Top 10 IP addresses by access count
- **User agent analytics**: Top 10 browsers/devices accessing the URL
- **Time series chart**: Visual bar chart showing access by day
- **Hourly distribution**: 24-hour chart showing peak access times
- **Recent accesses table**: Last 50 accesses with timestamp, IP, link used, provided credentials, location

All analytics data is fetched via `/api/protected/urls/[id]/analytics` and includes powerful filtering and sorting.

## Configure Access Button

When authenticated users view a protected URL (`/s/{code}`), they see a "Configure Access" button in the top-right that:
- Only appears if user is logged in (checks `session?.user`)
- Links directly to the management page for that URL
- Uses the `protectedUrlId` returned from the access API

## Video Embedding

The system automatically transforms video URLs to their embeddable formats:

- **Loom**: `loom.com/share/{id}` → `loom.com/embed/{id}`
- **YouTube**: `youtube.com/watch?v={id}` → `youtube.com/embed/{id}`
- **Vimeo**: `vimeo.com/{id}` → `player.vimeo.com/video/{id}`

This fixes iframe embedding issues where sites block direct URL embedding.

## Recent Changes

- **Auto-created default AccessLink**: When creating a ProtectedUrl, system automatically creates a password-protected AccessLink
- **Comprehensive URL management**: Full CRUD operations on ProtectedUrls with inline editing
- **Powerful analytics**: Detailed access tracking with IP, user agent, time series, and hourly distribution
- **Configure Access button**: Quick access to management from protected content pages
- **Copy-only URLs**: Copy buttons now copy just the URL without extra formatting
- **Link status toggling**: Easy activate/deactivate buttons for access links
- **Video URL transformation**: Automatic conversion to embeddable formats for Loom, YouTube, Vimeo
- **Tabbed interface**: Clean separation between access links and analytics
- **Status badges**: Color-coded indicators for link status (active/inactive/expired/maxed)
