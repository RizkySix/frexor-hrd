-- CreateEnum
CREATE TYPE "DriverGender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "DriverShirtSize" AS ENUM ('S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL');

-- CreateTable
CREATE TABLE "DriverSizeSubmission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "phoneNormalized" TEXT NOT NULL,
    "gender" "DriverGender" NOT NULL,
    "size" "DriverShirtSize" NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverSizeSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DriverSizeSubmission_phoneNormalized_key" ON "DriverSizeSubmission"("phoneNormalized");

-- CreateIndex
CREATE INDEX "DriverSizeSubmission_submittedAt_idx" ON "DriverSizeSubmission"("submittedAt");

-- CreateIndex
CREATE INDEX "DriverSizeSubmission_size_idx" ON "DriverSizeSubmission"("size");
