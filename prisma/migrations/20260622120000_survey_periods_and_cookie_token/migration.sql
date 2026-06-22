-- Drop the obsolete IP-based rate limit table.
DROP TABLE IF EXISTS "SurveyRateLimit";

-- CreateTable
CREATE TABLE "SurveyPeriod" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "SurveyPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SurveyPeriod_startsAt_endsAt_idx" ON "SurveyPeriod"("startsAt", "endsAt");
CREATE INDEX "SurveyPeriod_isActive_idx" ON "SurveyPeriod"("isActive");

-- AddForeignKey
ALTER TABLE "SurveyPeriod" ADD CONSTRAINT "SurveyPeriod_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "HRDUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable SurveySubmission — add periodId + clientTokenHash
ALTER TABLE "SurveySubmission" ADD COLUMN "periodId" TEXT;
ALTER TABLE "SurveySubmission" ADD COLUMN "clientTokenHash" TEXT;

-- AddForeignKey
ALTER TABLE "SurveySubmission" ADD CONSTRAINT "SurveySubmission_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "SurveyPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "SurveySubmission_periodId_idx" ON "SurveySubmission"("periodId");
CREATE UNIQUE INDEX "SurveySubmission_periodId_clientTokenHash_key" ON "SurveySubmission"("periodId", "clientTokenHash");
