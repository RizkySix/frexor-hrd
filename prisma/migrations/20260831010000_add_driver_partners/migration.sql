-- CreateEnum
CREATE TYPE "BloodType" AS ENUM ('A', 'B', 'AB', 'O', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "Religion" AS ENUM ('ISLAM', 'KRISTEN', 'KATOLIK', 'HINDU', 'BUDDHA', 'KONGHUCU', 'LAINNYA');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('BELUM_KAWIN', 'KAWIN', 'CERAI_HIDUP', 'CERAI_MATI');

-- CreateEnum
CREATE TYPE "LastEducation" AS ENUM ('SD', 'SMP', 'SMA_SMK', 'D3', 'S1', 'S2', 'S3', 'LAINNYA');

-- CreateTable
CREATE TABLE "DriverPartner" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "birthPlace" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "gender" "DriverGender" NOT NULL,
    "bloodType" "BloodType" NOT NULL,
    "address" TEXT NOT NULL,
    "religion" "Religion" NOT NULL,
    "maritalStatus" "MaritalStatus" NOT NULL,
    "nik" TEXT NOT NULL,
    "kkNumber" TEXT NOT NULL,
    "npwp" TEXT,
    "ptkpStatus" TEXT,
    "bpjsKesehatan" TEXT,
    "statusKesehatan" TEXT,
    "bpjsKetenagakerjaan" TEXT,
    "noRekening" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "currentAddress" TEXT,
    "lastEducation" "LastEducation",
    "emergencyPhone" TEXT,
    "roketAccountName" TEXT,
    "workStartDate" TIMESTAMP(3),
    "ktpPhotoUrl" TEXT NOT NULL,
    "kkPhotoUrl" TEXT NOT NULL,
    "npwpPhotoUrl" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverPartner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DriverPartner_nik_key" ON "DriverPartner"("nik");

-- CreateIndex
CREATE INDEX "DriverPartner_submittedAt_idx" ON "DriverPartner"("submittedAt");
