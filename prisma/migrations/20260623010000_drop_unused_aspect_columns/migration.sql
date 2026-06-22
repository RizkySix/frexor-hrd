-- Drop columns that were consistently empty/unreliable from the real AI
-- response shape (highest_aspects/improvement_aspects/per_section_scores
-- were never populated meaningfully). qualitativeData already covers
-- strengths/improvement areas in narrative form.
ALTER TABLE "SurveyAnalysisResult" DROP COLUMN "highestAspects";
ALTER TABLE "SurveyAnalysisResult" DROP COLUMN "improvementAspects";
ALTER TABLE "SurveyAnalysisResult" DROP COLUMN "perSectionScores";
