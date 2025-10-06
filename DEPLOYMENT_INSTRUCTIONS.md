# Deployment Instructions

## Quick Summary

The application is ready to deploy. The database migration will run automatically when you deploy to Vercel.

## What's Been Updated

### Schema Changes
- Added `Organization` model
- Added `UserRole` enum (USER, ADMINISTRATOR, SUPERADMIN)
- Updated `User` model with `role` and `organizationId` fields
- Migration file created at: `prisma/migrations/20251005000000_add_user_roles_and_organizations/migration.sql`

### Build Process
The `package.json` build script now includes:
```bash
prisma generate && prisma migrate deploy && next build
```

This ensures migrations run automatically on Vercel deployment.

## Deployment Steps

### 1. Commit and Push Changes

```bash
git add .
git commit -m "Add user management and organization features"
git push origin main
```

### 2. Vercel Will Automatically:

1. Install dependencies
2. Run `prisma generate` (creates Prisma Client with new schema)
3. Run `prisma migrate deploy` (applies database migrations)
4. Build the Next.js application

### 3. Verify Deployment

After deployment completes:

1. **Test Login**
   - Log in with your admin email (nealsoni00@gmail.com)
   - You should be automatically assigned SUPERADMIN role

2. **Test Organization Auto-Assignment**
   - Log in with an @axon.com or @prepared911.com email
   - User should be auto-assigned to their organization
   - First user becomes ADMINISTRATOR

3. **Test Features**
   - Navigate to user menu (top right)
   - Should see your photo, role badge, and organization
   - Try accessing:
     - Profile page
     - Organization page
     - User Management
     - Superadmin Panel (if superadmin)

## Environment Variables

Ensure these are set in Vercel:

```bash
# Database (already configured via Vercel Postgres)
URL_SHARING_POSTGRES_URL=<your_postgres_url>
URL_SHARING_PRISMA_DATABASE_URL=<your_prisma_url>

# NextAuth
NEXTAUTH_SECRET=<your_secret>
NEXTAUTH_URL=<auto-detected by Vercel>

# Google OAuth
GOOGLE_CLIENT_ID=<your_google_client_id>
GOOGLE_CLIENT_SECRET=<your_google_client_secret>

# Admin
ADMIN_EMAIL=nealsoni00@gmail.com
```

## Migration Details

The migration adds:

```sql
-- Organization table
CREATE TABLE "Organization" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "domain" TEXT UNIQUE,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT
);

-- UserRole enum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMINISTRATOR', 'SUPERADMIN');

-- User table updates
ALTER TABLE "User"
  ADD COLUMN "role" "UserRole" DEFAULT 'USER',
  ADD COLUMN "organizationId" TEXT;

-- Foreign key
ALTER TABLE "User"
  ADD CONSTRAINT "User_organizationId_fkey"
  FOREIGN KEY ("organizationId")
  REFERENCES "Organization"("id")
  ON DELETE SET NULL;
```

## Features Enabled After Migration

### 1. **User Roles**
- **USER**: View organization members
- **ADMINISTRATOR**: Manage users in organization
- **SUPERADMIN**: Manage all organizations

### 2. **Organization Management**
- Auto-created for company domains (axon.com, prepared911.com)
- First user becomes Administrator
- View/edit organization settings
- See all organization members

### 3. **User Profile**
- View own profile with photo, role, stats
- See organization membership

### 4. **Enhanced Navigation**
- User photo in top-right
- Dropdown shows role, organization
- Quick links to all management pages

### 5. **Permissions**
- API routes enforce role-based access
- UI elements show/hide based on permissions
- JWT tokens include role information (12-hour expiration)

## Troubleshooting

### Migration Fails on Vercel

If migration fails:
1. Check Vercel build logs
2. Ensure database is accessible
3. Verify environment variables are set
4. Try redeploying

### Users Not Getting Organizations

If users aren't auto-assigned:
1. Check that their email domain is in `ORGANIZATION_DOMAINS` (lib/auth.ts)
2. Verify they're logging in fresh (not using old session)
3. Check database for Organization with their domain

### Role Not Showing

If role doesn't appear:
1. Clear browser cache and cookies
2. Sign out and sign back in
3. Check database that `role` column exists
4. Verify `npx prisma generate` ran successfully

## Post-Deployment Checklist

- [ ] Migrations applied successfully
- [ ] Admin user has SUPERADMIN role
- [ ] Test user can view organization members
- [ ] Administrator can create/edit users
- [ ] Superadmin can access superadmin panel
- [ ] Organization auto-creation works
- [ ] JWT tokens expire after 12 hours
- [ ] User photos display in navigation
- [ ] All management pages accessible

## Support

For detailed migration steps, see: `DATABASE_MIGRATION_GUIDE.md`

For Vercel-specific environment variables, see: `VERCEL_SETUP.md`
