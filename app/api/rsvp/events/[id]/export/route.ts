import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  escapeCsv,
  formatSubmittedAt,
  parseDropdownOptions,
} from "@/lib/rsvp-utils";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const event = await prisma.rSVPEvent.findUnique({
    where: { id: params.id },
    include: {
      responses: { orderBy: { submittedAt: "asc" } },
    },
  });

  if (!event || event.createdBy !== session.user.id) {
    return new Response("Not found", { status: 404 });
  }

  const dd = parseDropdownOptions(event.dropdownOptions);
  const ddLabel = dd?.label ?? "Dropdown";

  const header = ["Nama", ddLabel, "Status", "Alasan", "Waktu Submit"]
    .map(escapeCsv)
    .join(",");

  const rows = event.responses.map((r) =>
    [
      r.name,
      r.dropdownValue ?? "-",
      r.status === "HADIR" ? "Hadir" : "Tidak Hadir",
      r.reason ?? "-",
      formatSubmittedAt(r.submittedAt),
    ]
      .map(escapeCsv)
      .join(","),
  );

  // BOM agar Excel mengenali UTF-8
  const csv = "﻿" + [header, ...rows].join("\n");
  const safeTitle = event.title.replace(/[^a-zA-Z0-9-_]+/g, "-").toLowerCase();

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rsvp-${safeTitle}-${event.id}.csv"`,
    },
  });
}
