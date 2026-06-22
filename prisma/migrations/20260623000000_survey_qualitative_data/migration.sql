-- AlterTable SurveyAnalysisResult — capture qualitative analysis from AI webhook
ALTER TABLE "SurveyAnalysisResult" ADD COLUMN "qualitativeData" JSONB;
ALTER TABLE "SurveyAnalysisResult" ADD COLUMN "sectionAnalyses" JSONB;
