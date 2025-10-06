import { prisma } from './prisma'

/**
 * Automatically check and apply migrations on server startup
 * This ensures the database schema is always up-to-date
 */
export async function checkAndApplyMigrations() {
  try {
    console.log('🔍 Checking database migration status...')

    // Check if the role column exists
    const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'User'
        AND column_name = 'role'
      ) as exists
    `

    if (result[0]?.exists) {
      console.log('✅ Database schema is up-to-date')
      return { success: true, migrated: false }
    }

    console.log('🔄 Applying pending migrations...')

    // Apply the organization/role migration
    await prisma.$executeRawUnsafe(`
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
    `)

    // Update admin email user to be superadmin if specified
    if (process.env.ADMIN_EMAIL) {
      const updatedCount = await prisma.user.updateMany({
        where: { email: process.env.ADMIN_EMAIL },
        data: {
          isSuperAdmin: true,
          isAdmin: true
        }
      })

      if (updatedCount.count > 0) {
        console.log(`✅ Set ${process.env.ADMIN_EMAIL} as superadmin`)
      }
    }

    console.log('✅ Migrations applied successfully')
    return { success: true, migrated: true }
  } catch (error) {
    // If error is about enum already existing, ignore it (migration already partially applied)
    if (error instanceof Error && error.message.includes('already exists')) {
      console.log('⚠️ Migration partially applied, continuing...')
      return { success: true, migrated: false }
    }

    console.error('❌ Migration failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
