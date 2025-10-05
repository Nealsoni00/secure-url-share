-- AlterTable
ALTER TABLE "AccessLink" ADD COLUMN     "authMethod" TEXT NOT NULL DEFAULT 'password',
ADD COLUMN     "recipientPhone" TEXT,
ADD COLUMN     "requireVerification" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "password" DROP NOT NULL;

-- AlterTable
ALTER TABLE "AccessLog" ADD COLUMN     "providedEmail" TEXT,
ADD COLUMN     "providedName" TEXT,
ADD COLUMN     "providedPhone" TEXT;
