import ExcelJS from "exceljs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatSubmittedAt } from "@/lib/rsvp-utils";
import {
  BLOOD_TYPE_LABELS,
  GENDER_LABELS,
  MARITAL_STATUS_LABELS,
  PROFICIENCY_LABELS,
  RELIGION_LABELS,
  asRows,
  type BloodType,
  type DriverGender,
  type FamilyMember,
  type FormalEducationRow,
  type LanguageRow,
  type MaritalStatus,
  type NonFormalEducationRow,
  type Proficiency,
  type Religion,
  type WorkExperienceRow,
} from "@/lib/interview-utils";

const ID_TZ = "Asia/Makassar";

function formatDateOnly(d: Date | null): string {
  if (!d) return "-";
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: ID_TZ,
  });
}

function dash(v: string | null | undefined): string {
  return v && v.trim() ? v : "-";
}
function yesNo(v: boolean): string {
  return v ? "Ya" : "Tidak";
}
function yesNoText(yes: boolean, text: string | null): string {
  if (!yes) return "Tidak";
  const t = (text ?? "").trim();
  return t ? `Ya — ${t}` : "Ya";
}
function prof(p: Proficiency): string {
  return p ? PROFICIENCY_LABELS[p as Exclude<Proficiency, "">] : "-";
}

function fmtFamily(v: unknown): string {
  const rows = asRows<FamilyMember>(v);
  if (rows.length === 0) return "-";
  return rows
    .map(
      (r) =>
        `${dash(r.role)}: ${dash(r.name)}` +
        ` (${[r.gender, r.birthDate, r.education, r.job].filter(Boolean).join(", ") || "-"})`,
    )
    .join("\n");
}
function fmtFormal(v: unknown): string {
  const rows = asRows<FormalEducationRow>(v);
  if (rows.length === 0) return "-";
  return rows
    .map(
      (r) =>
        `${dash(r.institution)}${r.major ? " — " + r.major : ""}` +
        ` (${[r.periodFrom, r.periodTo].filter(Boolean).join(" s/d ") || "-"})` +
        `${r.place ? ", " + r.place : ""}${r.diploma ? ", Ijasah: " + r.diploma : ""}` +
        `${r.notes ? ", " + r.notes : ""}`,
    )
    .join("\n");
}
function fmtNonFormal(v: unknown): string {
  const rows = asRows<NonFormalEducationRow>(v);
  if (rows.length === 0) return "-";
  return rows
    .map(
      (r) =>
        `${dash(r.training)}${r.organizer ? " — " + r.organizer : ""}` +
        `${r.year ? " (" + r.year + ")" : ""}${r.place ? ", " + r.place : ""}` +
        `${r.notes ? ", " + r.notes : ""}`,
    )
    .join("\n");
}
function fmtLanguages(v: unknown): string {
  const rows = asRows<LanguageRow>(v);
  if (rows.length === 0) return "-";
  return rows
    .map(
      (r) =>
        `${dash(r.language)}: Memahami ${prof(r.understand)}, Bicara ${prof(r.speak)},` +
        ` Membaca ${prof(r.read)}, Menulis ${prof(r.write)}` +
        `${r.notes ? " (" + r.notes + ")" : ""}`,
    )
    .join("\n");
}
function fmtWork(v: unknown): string {
  const rows = asRows<WorkExperienceRow>(v);
  if (rows.length === 0) return "-";
  return rows
    .map(
      (r) =>
        `${dash(r.company)}${r.position ? " — " + r.position : ""}` +
        ` (${[r.periodFrom, r.periodTo].filter(Boolean).join(" s/d ") || "-"})` +
        `${r.salary ? ", Upah: " + r.salary : ""}, Rekomendasi: ${r.recommendation ? "Ada" : "Tidak"}` +
        `${r.reasonLeaving ? ", Alasan: " + r.reasonLeaving : ""}`,
    )
    .join("\n");
}

type ColumnDef = { header: string; width: number; wrap?: boolean };
type GroupDef = { title: string; fill: string; headerText: string; columns: ColumnDef[] };

const GROUPS: GroupDef[] = [
  {
    title: "Lamaran",
    fill: "FF00B0F0",
    headerText: "FFFFFFFF",
    columns: [
      { header: "Posisi Dilamar", width: 22 },
      { header: "Foto", width: 14 },
    ],
  },
  {
    title: "A. Identitas",
    fill: "FFFFFF00",
    headerText: "FF1F2937",
    columns: [
      { header: "Nama Lengkap", width: 26 },
      { header: "Nama Panggilan", width: 16 },
      { header: "Tempat Lahir", width: 16 },
      { header: "Tgl Lahir", width: 13 },
      { header: "Jenis Kelamin", width: 13 },
      { header: "Tinggi (cm)", width: 11 },
      { header: "Berat (kg)", width: 11 },
      { header: "Gol. Darah", width: 10 },
      { header: "Alamat KTP", width: 32, wrap: true },
      { header: "No. Telp Rumah", width: 15 },
      { header: "Alamat Domisili", width: 32, wrap: true },
      { header: "No. Rek BCA", width: 16 },
      { header: "Kewarganegaraan", width: 14 },
      { header: "Email Pribadi", width: 24 },
      { header: "Status Pernikahan", width: 15 },
      { header: "Jml Anak", width: 9 },
      { header: "Agama", width: 12 },
      { header: "No. KTP (NIK)", width: 20 },
      { header: "No. Handphone", width: 16 },
      { header: "SIM A", width: 10 },
      { header: "SIM B", width: 10 },
      { header: "SIM C", width: 10 },
    ],
  },
  {
    title: "B. Data Keluarga",
    fill: "FFD9F2D9",
    headerText: "FF1F2937",
    columns: [
      { header: "Keluarga Inti", width: 40, wrap: true },
      { header: "Keluarga (Ayah/Ibu/Saudara)", width: 40, wrap: true },
    ],
  },
  {
    title: "C-E. Pendidikan & Bahasa",
    fill: "FFFFD9A8",
    headerText: "FF1F2937",
    columns: [
      { header: "Pendidikan Formal", width: 42, wrap: true },
      { header: "Pendidikan Non-Formal", width: 36, wrap: true },
      { header: "Bahasa Asing", width: 40, wrap: true },
    ],
  },
  {
    title: "F. Pengalaman Kerja",
    fill: "FFE2CCF5",
    headerText: "FF1F2937",
    columns: [
      { header: "Riwayat Kerja", width: 46, wrap: true },
      { header: "Uraian Jabatan Terakhir", width: 34, wrap: true },
      { header: "Total Upah Terakhir", width: 16 },
      { header: "Gaji Diharapkan", width: 16 },
      { header: "BPJS TK", width: 9 },
      { header: "No. BPJS TK", width: 18 },
      { header: "BPJS Kesehatan", width: 11 },
      { header: "No. BPJS Kes.", width: 18 },
    ],
  },
  {
    title: "G. Lain-lain",
    fill: "FFF5D9D9",
    headerText: "FF1F2937",
    columns: [
      { header: "1. Masalah Hukum", width: 24, wrap: true },
      { header: "2. Pernah Diberhentikan", width: 24, wrap: true },
      { header: "3. Merokok", width: 10 },
      { header: "4. Bertatto", width: 10 },
      { header: "5. Sakit Serius 5th", width: 24, wrap: true },
      { header: "6. Alergi/Kambuhan", width: 24, wrap: true },
      { header: "7. Penyakit Kulit/Paru", width: 22, wrap: true },
      { header: "8. Penyakit Bawaan", width: 24, wrap: true },
      { header: "9. Referensi Atasan", width: 26, wrap: true },
      { header: "10. Mulai Bekerja", width: 16 },
      { header: "11. Organisasi", width: 22, wrap: true },
      { header: "12. Kontak Darurat", width: 28, wrap: true },
      { header: "13. Kenalan di Perusahaan", width: 24, wrap: true },
      { header: "14. Pernah di BST", width: 24, wrap: true },
    ],
  },
  {
    title: "Sistem",
    fill: "FFE2E8F0",
    headerText: "FF1F2937",
    columns: [
      { header: "Waktu Submit", width: 20 },
      { header: "Terakhir Diperbarui", width: 20 },
    ],
  },
];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const subs = await prisma.interviewSubmission.findMany({
    orderBy: { submittedAt: "desc" },
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Talent Portal Bali Sun Tours";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Form Interview", {
    views: [{ state: "frozen", ySplit: 2, xSplit: 1 }],
  });

  const noCol: ColumnDef = { header: "No", width: 5 };
  const allColumns = [noCol, ...GROUPS.flatMap((g) => g.columns)];
  sheet.columns = allColumns.map((c) => ({ width: c.width }));

  // Row 1: merged group headers
  sheet.mergeCells(1, 1, 2, 1);
  const noCell = sheet.getCell(1, 1);
  noCell.value = "No";
  noCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF00" } };
  noCell.font = { bold: true };
  noCell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };

  let colIdx = 2;
  for (const group of GROUPS) {
    const startCol = colIdx;
    const endCol = colIdx + group.columns.length - 1;
    sheet.mergeCells(1, startCol, 1, endCol);
    const cell = sheet.getCell(1, startCol);
    cell.value = group.title;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: group.fill } };
    cell.font = { bold: true, color: { argb: group.headerText } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    colIdx = endCol + 1;
  }
  sheet.getRow(1).height = 22;

  // Row 2: column headers
  colIdx = 2;
  for (const group of GROUPS) {
    for (const col of group.columns) {
      const cell = sheet.getCell(2, colIdx);
      cell.value = col.header;
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: group.fill } };
      cell.font = { bold: true, color: { argb: group.headerText }, size: 10 };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      colIdx++;
    }
  }
  sheet.getRow(2).height = 30;

  for (let r = 1; r <= 2; r++) {
    for (let c = 1; c <= allColumns.length; c++) {
      sheet.getCell(r, c).border = {
        top: { style: "thin", color: { argb: "FFCBD5E1" } },
        bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
        left: { style: "thin", color: { argb: "FFCBD5E1" } },
        right: { style: "thin", color: { argb: "FFCBD5E1" } },
      };
    }
  }

  // Column index (1-based) of the NIK column, forced to text so Excel keeps
  // the leading digits. noCol(1) + Lamaran(2) + Identitas up to NIK.
  const nikColIndex = allColumns.findIndex((c) => c.header === "No. KTP (NIK)") + 1;

  subs.forEach((p, i) => {
    const row = sheet.getRow(3 + i);
    const values: (string | number | { text: string; hyperlink: string })[] = [
      i + 1,
      // Lamaran
      dash(p.appliedPosition),
      p.photoUrl ? { text: "Lihat Foto", hyperlink: p.photoUrl } : "-",
      // Identitas
      dash(p.fullName),
      dash(p.nickname),
      dash(p.birthPlace),
      formatDateOnly(p.birthDate),
      GENDER_LABELS[p.gender as DriverGender] ?? dash(p.gender),
      dash(p.heightCm),
      dash(p.weightKg),
      BLOOD_TYPE_LABELS[p.bloodType as BloodType] ?? dash(p.bloodType),
      dash(p.ktpAddress),
      dash(p.homePhone),
      dash(p.currentAddress),
      dash(p.bcaAccount),
      dash(p.citizenship),
      dash(p.personalEmail),
      MARITAL_STATUS_LABELS[p.maritalStatus as MaritalStatus] ?? dash(p.maritalStatus),
      p.childrenCount === null ? "-" : String(p.childrenCount),
      RELIGION_LABELS[p.religion as Religion] ?? dash(p.religion),
      dash(p.nik),
      dash(p.phone),
      dash(p.simA),
      dash(p.simB),
      dash(p.simC),
      // Keluarga
      fmtFamily(p.familyImmediate),
      fmtFamily(p.familyExtended),
      // Pendidikan & bahasa
      fmtFormal(p.formalEducation),
      fmtNonFormal(p.nonFormalEducation),
      fmtLanguages(p.languages),
      // Pengalaman kerja
      fmtWork(p.workExperience),
      dash(p.lastJobDescription),
      dash(p.lastSalaryTotal),
      dash(p.expectedSalary),
      yesNo(p.hasBpjsTk),
      dash(p.bpjsTkNumber),
      yesNo(p.hasBpjsKes),
      dash(p.bpjsKesNumber),
      // Lain-lain
      yesNoText(p.qLegalIssueYes, p.qLegalIssue),
      yesNoText(p.qTerminatedYes, p.qTerminated),
      yesNo(p.qSmoking),
      yesNo(p.qTattoo),
      yesNoText(p.qSeriousIllnessYes, p.qSeriousIllness),
      yesNoText(p.qAllergyYes, p.qAllergy),
      yesNoText(p.qSkinLungDiseaseYes, p.qSkinLungDisease),
      yesNoText(p.qHereditaryDiseaseYes, p.qHereditaryDisease),
      dash(p.qPrevSupervisor),
      dash(p.qStartDate),
      dash(p.qOrganization),
      dash(p.qEmergencyContact),
      dash(p.qRelativeInCompany),
      dash(p.qWorkedAtBst),
      // Sistem
      formatSubmittedAt(p.submittedAt),
      formatSubmittedAt(p.updatedAt),
    ];

    values.forEach((v, ci) => {
      const cell = row.getCell(ci + 1);
      cell.value = v;
      const colDef = allColumns[ci];
      if (v && typeof v === "object") {
        cell.font = { color: { argb: "FF2563EB" }, underline: true };
      }
      cell.alignment = { vertical: "top", wrapText: !!colDef?.wrap };
      cell.border = {
        top: { style: "hair", color: { argb: "FFE2E8F0" } },
        bottom: { style: "hair", color: { argb: "FFE2E8F0" } },
        left: { style: "hair", color: { argb: "FFE2E8F0" } },
        right: { style: "hair", color: { argb: "FFE2E8F0" } },
      };
    });
    if (nikColIndex > 0) row.getCell(nikColIndex).numFmt = "@";
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="form-interview.xlsx"`,
    },
  });
}
