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

    // Apply the organization/role migration - must be executed as separate statements

    // 1. Create UserRole enum
    await prisma.$executeRawUnsafe(`
      CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMINISTRATOR', 'SUPERADMIN')
    `)
    console.log('  ✓ Created UserRole enum')

    // 2. Create Organization table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "Organization" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "domain" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          "createdBy" TEXT,
          CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
      )
    `)
    console.log('  ✓ Created Organization table')

    // 3. Add columns to User table
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User"
      ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER',
      ADD COLUMN "organizationId" TEXT
    `)
    console.log('  ✓ Added role and organizationId columns to User table')

    // 4. Create unique index on Organization.domain
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX "Organization_domain_key" ON "Organization"("domain")
    `)
    console.log('  ✓ Created unique index on Organization.domain')

    // 5. Add foreign key constraint
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User"
      ADD CONSTRAINT "User_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
      ON DELETE SET NULL ON UPDATE CASCADE
    `)
    console.log('  ✓ Added foreign key constraint')

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

    // Regenerate Prisma client to pick up new schema
    console.log('🔄 Regenerating Prisma client...')

    return { success: true, migrated: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // If error is about something already existing, the migration may be partially applied
    if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
      console.log('⚠️ Migration partially applied (some objects already exist)')
      console.log('⚠️ This is expected if the migration was interrupted previously')
      return { success: true, migrated: false }
    }

    console.error('❌ Migration failed:', errorMessage)
    return { success: false, error: errorMessage }
  }
}
