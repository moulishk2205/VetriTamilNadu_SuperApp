-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('submitted', 'approved', 'rejected');

-- AlterTable
ALTER TABLE "Citizen" ADD COLUMN     "facts" JSONB;

-- CreateTable
CREATE TABLE "SchemeClaim" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "schemeId" TEXT NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'submitted',
    "basis" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchemeClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SchemeClaim_schemeId_status_idx" ON "SchemeClaim"("schemeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SchemeClaim_citizenId_schemeId_key" ON "SchemeClaim"("citizenId", "schemeId");

-- AddForeignKey
ALTER TABLE "SchemeClaim" ADD CONSTRAINT "SchemeClaim_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchemeClaim" ADD CONSTRAINT "SchemeClaim_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "Scheme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

