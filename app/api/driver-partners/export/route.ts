import ExcelJS from "exceljs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatSubmittedAt } from "@/lib/rsvp-utils";
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

// Mirrors the grouping/color scheme of the original "Header Data Mitra"
// template the client shared: group header row + colored sub-header row.
type ColumnDef = { header: string; width: number };
type GroupDef = { title: string; fill: string; headerText: string; columns: ColumnDef[] };

const GROUPS: GroupDef[] = [
  {
    title: "Data KTP",
    fill: "FFFFFF00", // yellow — must match KTP, same as the source template
    headerText: "FF1F2937",
    columns: [
      { header: "Nama Lengkap", width: 28 },
      { header: "Tempat Lahir", width: 18 },
      { header: "Tanggal Lahir", width: 14 },
      { header: "Jenis Kelamin", width: 14 },
      { header: "Gol Darah", width: 10 },
      { header: "Alamat (Sesuai KTP)", width: 38 },
      { header: "Agama", width: 12 },
      { header: "Status Perkawinan", width: 16 },
      { header: "Nomor KTP (NIK)", width: 18 },
      { header: "Nomor KK", width: 18 },
    ],
  },
  {
    title: "Data Pajak",
    fill: "FFFFD9A8",
    headerText: "FF1F2937",
    columns: [
      { header: "NPWP", width: 18 },
      { header: "Status PTKP", width: 12 },
    ],
  },
  {
    title: "Data Rekening",
    fill: "FFD9F2D9",
    headerText: "FF1F2937",
    columns: [{ header: "No. Rekening", width: 18 }],
  },
  {
    title: "Data Tambahan",
    fill: "FF00B0F0",
    headerText: "FFFFFFFF",
    columns: [
      { header: "Telepon/HP", width: 16 },
      { header: "Email", width: 26 },
      { header: "Alamat Tinggal Saat Ini", width: 34 },
      { header: "Pendidikan Terakhir", width: 16 },
      { header: "Nama Kerabat", width: 20 },
      { header: "Nomor Telepon Kerabat", width: 18 },
    ],
  },
  {
    title: "Data Mitra",
    fill: "FF595959",
    headerText: "FFFFFFFF",
    columns: [
      { header: "Nama Panggung", width: 20 },
      { header: "Tanggal Mulai Bekerja", width: 16 },
    ],
  },
  {
    title: "Dokumen & Info Sistem",
    fill: "FFE2E8F0",
    headerText: "FF1F2937",
    columns: [
      { header: "Foto KTP", width: 14 },
      { header: "Foto KK", width: 14 },
      { header: "Foto NPWP", width: 14 },
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

  const partners = await prisma.driverPartner.findMany({
    orderBy: { submittedAt: "desc" },
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Talent Portal Bali Sun Tours";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Data Mitra Driver", {
    views: [{ state: "frozen", ySplit: 2, xSplit: 1 }],
  });

  // Column A: row number, matching the source template's "No" column.
  const noCol: ColumnDef = { header: "No", width: 5 };
  const allColumns = [noCol, ...GROUPS.flatMap((g) => g.columns)];
  sheet.columns = allColumns.map((c) => ({ width: c.width }));

  // ---- Row 1: merged group headers ----
  const groupRow = sheet.getRow(1);
  sheet.mergeCells(1, 1, 2, 1); // "No" spans both header rows
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
  groupRow.height = 22;

  // ---- Row 2: individual column headers ----
  const headerRow = sheet.getRow(2);
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
  headerRow.height = 32;

  // Thin borders on the whole header block for a tidy printed look.
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

  // ---- Data rows ----
  partners.forEach((p, i) => {
    const row = sheet.getRow(3 + i);
    const values: (string | number | { text: string; hyperlink: string } | null)[] = [
      i + 1,
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
      p.noRekening,
      p.phone,
      p.email,
      p.currentAddress,
      p.lastEducation ? LAST_EDUCATION_LABELS[p.lastEducation as LastEducation] : "-",
      p.emergencyName,
      p.emergencyPhone,
      p.roketAccountName,
      formatDateOnly(p.workStartDate),
      p.ktpPhotoUrl ? { text: "Lihat Foto", hyperlink: p.ktpPhotoUrl } : "-",
      p.kkPhotoUrl ? { text: "Lihat Foto", hyperlink: p.kkPhotoUrl } : "-",
      p.npwpPhotoUrl ? { text: "Lihat Foto", hyperlink: p.npwpPhotoUrl } : "-",
      formatSubmittedAt(p.submittedAt),
      formatSubmittedAt(p.updatedAt),
    ];
    values.forEach((v, ci) => {
      const cell = row.getCell(ci + 1);
      cell.value = v ?? "-";
      if (v && typeof v === "object") {
        cell.font = { color: { argb: "FF2563EB" }, underline: true };
      }
      cell.alignment = { vertical: "middle", wrapText: ci === 6 || ci === 16 };
      cell.border = {
        top: { style: "hair", color: { argb: "FFE2E8F0" } },
        bottom: { style: "hair", color: { argb: "FFE2E8F0" } },
        left: { style: "hair", color: { argb: "FFE2E8F0" } },
        right: { style: "hair", color: { argb: "FFE2E8F0" } },
      };
    });
    // NIK / KK are 16-digit strings — force text format so Excel never
    // reinterprets them as numbers (dropping leading zeros / sci-notation).
    row.getCell(10).numFmt = "@";
    row.getCell(11).numFmt = "@";
    if (i % 2 === 1) {
      for (let c = 1; c <= allColumns.length; c++) {
        const cell = row.getCell(c);
        if (!cell.fill || (cell.fill as { type?: string }).type !== "pattern") {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
        }
      }
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="data-mitra-driver.xlsx"`,
    },
  });
}
