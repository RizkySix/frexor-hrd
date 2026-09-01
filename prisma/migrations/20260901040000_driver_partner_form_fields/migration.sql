-- DropColumn (BPJS fields removed entirely from the form)
ALTER TABLE "DriverPartner" DROP COLUMN "bpjsKesehatan";
ALTER TABLE "DriverPartner" DROP COLUMN "statusKesehatan";
ALTER TABLE "DriverPartner" DROP COLUMN "bpjsKetenagakerjaan";

-- AddColumn: emergencyName (new required field, "Nama Kerabat")
ALTER TABLE "DriverPartner" ADD COLUMN "emergencyName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "DriverPartner" ALTER COLUMN "emergencyName" DROP DEFAULT;

-- Backfill existing rows before enforcing NOT NULL on now-required columns.
-- These rows predate the required-field change; empty string / the row's own
-- submittedAt (best available estimate) are placeholders HRD can correct via
-- the driver resubmitting the form (upsert-by-NIK).
UPDATE "DriverPartner" SET "ptkpStatus" = '' WHERE "ptkpStatus" IS NULL;
UPDATE "DriverPartner" SET "email" = '' WHERE "email" IS NULL;
UPDATE "DriverPartner" SET "emergencyPhone" = '' WHERE "emergencyPhone" IS NULL;
UPDATE "DriverPartner" SET "roketAccountName" = '' WHERE "roketAccountName" IS NULL;
UPDATE "DriverPartner" SET "workStartDate" = "submittedAt" WHERE "workStartDate" IS NULL;

-- AlterColumn: enforce NOT NULL on now-required fields
ALTER TABLE "DriverPartner" ALTER COLUMN "ptkpStatus" SET NOT NULL;
ALTER TABLE "DriverPartner" ALTER COLUMN "email" SET NOT NULL;
ALTER TABLE "DriverPartner" ALTER COLUMN "emergencyPhone" SET NOT NULL;
ALTER TABLE "DriverPartner" ALTER COLUMN "roketAccountName" SET NOT NULL;
ALTER TABLE "DriverPartner" ALTER COLUMN "workStartDate" SET NOT NULL;
