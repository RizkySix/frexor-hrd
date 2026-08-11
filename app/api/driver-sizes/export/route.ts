import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { escapeCsv, formatSubmittedAt } from "@/lib/rsvp-utils";
import {
  GENDER_LABELS,
  SHIRT_SIZE_LABELS,
  type DriverGender,
  type ShirtSize,
} from "@/lib/driver-size-utils";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const submissions = await prisma.driverSizeSubmission.findMany({
    orderBy: { submittedAt: "desc" },
  });

  const header = [
    "Nama",
    "No. WhatsApp",
    "Jenis Kelamin",
    "Ukuran Baju",
    "Terakhir Diperbarui",
  ]
    .map(escapeCsv)
    .join(",");

  const rows = submissions.map((s) =>
    [
      s.name,
      s.phone,
      GENDER_LABELS[s.gender as DriverGender],
      SHIRT_SIZE_LABELS[s.size as ShirtSize],
      formatSubmittedAt(s.updatedAt),
    ]
      .map(escapeCsv)
      .join(","),
  );

  // BOM agar Excel mengenali UTF-8
  const csv = "﻿" + [header, ...rows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ukuran-baju-driver.csv"`,
    },
  });
}
