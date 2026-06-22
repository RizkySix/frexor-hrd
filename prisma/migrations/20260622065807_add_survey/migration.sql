-- CreateEnum
CREATE TYPE "SurveyAnalysisSource" AS ENUM ('AI_WEBHOOK', 'MANUAL_HRD');

-- CreateTable
CREATE TABLE "SurveySubmission" (
    "id" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answers" JSONB NOT NULL,
    "textAnswers" JSONB NOT NULL,
    "isProcessed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SurveySubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyRateLimit" (
    "id" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "lastSubmittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurveyRateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyAnalysisResult" (
    "id" TEXT NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "analysisPayload" JSONB NOT NULL,
    "highestAspects" JSONB,
    "improvementAspects" JSONB,
    "perSectionScores" JSONB,
    "summaryText" TEXT,
    "overallAvg" DECIMAL(3,2) NOT NULL,
    "totalRespondents" INTEGER NOT NULL,
    "generatedBy" "SurveyAnalysisSource" NOT NULL DEFAULT 'AI_WEBHOOK',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedByUserId" TEXT,

    CONSTRAINT "SurveyAnalysisResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SurveySubmission_isProcessed_idx" ON "SurveySubmission"("isProcessed");

-- CreateIndex
CREATE INDEX "SurveySubmission_submittedAt_idx" ON "SurveySubmission"("submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyRateLimit_ipHash_key" ON "SurveyRateLimit"("ipHash");

-- CreateIndex
CREATE INDEX "SurveyAnalysisResult_generatedAt_idx" ON "SurveyAnalysisResult"("generatedAt");

-- CreateIndex
CREATE INDEX "SurveyAnalysisResult_periodLabel_idx" ON "SurveyAnalysisResult"("periodLabel");

-- AddForeignKey
ALTER TABLE "SurveyAnalysisResult" ADD CONSTRAINT "SurveyAnalysisResult_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "HRDUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
