# Database Migration Guide

## Overview
This guide explains how to apply the database schema changes for the user management and organization features.

## Changes Required

The schema has been updated to add:
1. **Organization model** - for managing user organizations
2. **UserRole enum** - USER, ADMINISTRATOR, SUPERADMIN
3. **User model updates** - added `role` and `organizationId` fields

## Migration Steps

### Option 1: Using Prisma Migrate (Recommended for Production)

When deploying to Vercel or when you have database access:

```bash
# Apply all pending migrations
npx prisma migrate deploy
```

This will apply the migration file located at:
`prisma/migrations/20251005000000_add_user_roles_and_organizations/migration.sql`

### Option 2: Using Prisma DB Push (For Development)

If you're in development and want to quickly sync the schema:

```bash
npx prisma db push
```

This will:
- Create the `Organization` table
- Add the `UserRole` enum
- Add `role` and `organizationId` columns to the `User` table
- Create necessary indexes and foreign keys

### Option 3: Manual SQL Execution

If you need to run the migration manually, execute this SQL:

```sql
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMINISTRATOR', 'SUPERADMIN');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER',
ADD COLUMN "organizationId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Organization_domain_key" ON "Organization"("domain");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
```

## After Migration

1. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

2. **Restart your application**

3. **Verify the migration**:
   - Log in with the ADMIN_EMAIL account
   - You should automatically be assigned SUPERADMIN role
   - Users with company domains will be auto-assigned to organizations

## Vercel Deployment

When deploying to Vercel:

1. Push your code changes to GitHub
2. Vercel will automatically:
   - Install dependencies
   - Run `npx prisma generate`
   - The migrations will be applied via `npx prisma migrate deploy` (if configured in build command)

3. Add this to your `package.json` scripts if not already present:
   ```json
   {
     "scripts": {
       "postinstall": "prisma generate",
       "build": "prisma migrate deploy && next build"
     }
   }
   ```

## Rollback (If Needed)

If you need to rollback the migration:

```sql
-- Remove foreign key
ALTER TABLE "User" DROP CONSTRAINT "User_organizationId_fkey";

-- Drop columns
ALTER TABLE "User" DROP COLUMN "role";
ALTER TABLE "User" DROP COLUMN "organizationId";

-- Drop table
DROP TABLE "Organization";

-- Drop enum
DROP TYPE "UserRole";
```

## Troubleshooting

### Error: "Unknown field `organizationId`"
- **Cause**: Prisma client not regenerated after schema changes
- **Fix**: Run `npx prisma generate`

### Error: "Can't reach database server"
- **Cause**: Database not accessible from your local machine
- **Fix**: Deploy to Vercel where database is accessible, or use Prisma Accelerate connection pooling

### Error: "Unique constraint failed on domain"
- **Cause**: Trying to create organization with duplicate domain
- **Fix**: Each domain can only have one organization

## Support

For issues, check:
1. Prisma schema is correct in `prisma/schema.prisma`
2. Environment variables are set correctly
3. Prisma client has been regenerated
4. Application has been restarted
