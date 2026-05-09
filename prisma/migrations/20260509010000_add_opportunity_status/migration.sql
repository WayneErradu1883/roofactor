-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('OPEN', 'WON', 'LOST');

-- AlterTable
ALTER TABLE "Estimate" ADD COLUMN "opportunityStatus" "OpportunityStatus" NOT NULL DEFAULT 'OPEN';
ALTER TABLE "Estimate" ADD COLUMN "opportunityReason" TEXT;
ALTER TABLE "Estimate" ADD COLUMN "opportunityUpdatedAt" TIMESTAMP(3);
