-- Yes/No flags for section G questions 1, 2, 5, 6, 7, 8 (explanation text
-- columns already exist; the flag records whether the applicant answered Ya).
ALTER TABLE "InterviewSubmission" ADD COLUMN "qLegalIssueYes" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "InterviewSubmission" ADD COLUMN "qTerminatedYes" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "InterviewSubmission" ADD COLUMN "qSeriousIllnessYes" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "InterviewSubmission" ADD COLUMN "qAllergyYes" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "InterviewSubmission" ADD COLUMN "qSkinLungDiseaseYes" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "InterviewSubmission" ADD COLUMN "qHereditaryDiseaseYes" BOOLEAN NOT NULL DEFAULT false;
