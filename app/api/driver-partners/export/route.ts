import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { escapeCsv, formatSubmittedAt } from "@/lib/rsvp-utils";
import {
  BLOOD_TYPE_LABELS,
  LAST_EDUCATION_LABELS,
  MARITAL_STATUS_LABELS,
  RELIGION_LABELS,
  type BloodType,
  type LastEducation,
  type MaritalStatus,
  type Religion,
} from "@/lib/driver-partner-utils";
import { GENDER_LABELS, type DriverGender } from "@/lib/driver-size-utils";

const ID_TZ = "Asia/Makassar"; // WITA (UTC+8) — Bali timezone

// birthDate / workStartDate are calendar dates, not timestamps — format
// date-only (no time-of-day component).
function formatDateOnly(d: Date | null): string {
  if (!d) return "-";
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: ID_TZ,
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const partners = await prisma.driverPartner.findMany({
    orderBy: { submittedAt: "desc" },
  });

  const header = [
    "Nama Lengkap",
    "Tempat Lahir",
    "Tanggal Lahir",
    "Jenis Kelamin",
    "Golongan Darah",
    "Alamat (Sesuai KTP)",
    "Agama",
    "Status Perkawinan",
    "NIK",
    "Nomor KK",
    "NPWP",
    "Status PTKP",
    "BPJS Kesehatan",
    "Status Kesehatan",
    "BPJS Ketenagakerjaan",
    "No. Rekening",
    "Telepon/HP",
    "Email",
    "Alamat Tinggal Saat Ini",
    "Pendidikan Terakhir",
    "Nomor Telepon Kerabat",
    "Nama Akun Roket",
    "Tanggal Mulai Bekerja",
    "Foto KTP",
    "Foto KK",
    "Foto NPWP",
    "Waktu Submit",
    "Terakhir Diperbarui",
  ]
    .map(escapeCsv)
    .join(",");

  const rows = partners.map((p) =>
    [
      p.fullName,
      p.birthPlace,
      formatDateOnly(p.birthDate),
      GENDER_LABELS[p.gender as DriverGender],
      BLOOD_TYPE_LABELS[p.bloodType as BloodType],
      p.address,
      RELIGION_LABELS[p.religion as Religion],
      MARITAL_STATUS_LABELS[p.maritalStatus as MaritalStatus],
      p.nik,
      p.kkNumber,
      p.npwp,
      p.ptkpStatus,
      p.bpjsKesehatan,
      p.statusKesehatan,
      p.bpjsKetenagakerjaan,
      p.noRekening,
      p.phone,
      p.email,
      p.currentAddress,
      p.lastEducation ? LAST_EDUCATION_LABELS[p.lastEducation as LastEducation] : "-",
      p.emergencyPhone,
      p.roketAccountName,
      formatDateOnly(p.workStartDate),
      p.ktpPhotoUrl,
      p.kkPhotoUrl,
      p.npwpPhotoUrl,
      formatSubmittedAt(p.submittedAt),
      formatSubmittedAt(p.updatedAt),
    ]
      .map(escapeCsv)
      .join(","),
  );

  // BOM agar Excel mengenali UTF-8
  const csv = "﻿" + [header, ...rows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="data-mitra-driver.csv"`,
    },
  });
}
