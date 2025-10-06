import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * One-time migration endpoint
 * Call this endpoint to apply the organization/role migration
 * Use: POST /api/admin/migrate with body: { secret: "your-admin-email" }
 */
export async function POST(request: NextRequest) {
  const { secret } = await request.json().catch(() => ({}))

  // Security check - must provide admin email
  if (secret !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({
      error: 'Unauthorized'
    }, { status: 401 })
  }

  try {
    // Check if migration is already applied
    const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'User'
        AND column_name = 'role'
      ) as exists
    `

    if (result[0]?.exists) {
      return NextResponse.json({
        message: 'Migration already applied',
        status: 'up-to-date'
      })
    }

    // Apply the migration
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

    // Update admin email to be superadmin
    if (process.env.ADMIN_EMAIL) {
      await prisma.user.updateMany({
        where: { email: process.env.ADMIN_EMAIL },
        data: {
          isSuperAdmin: true,
          isAdmin: true
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Migration applied successfully'
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({
      error: 'Failed to apply migration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
