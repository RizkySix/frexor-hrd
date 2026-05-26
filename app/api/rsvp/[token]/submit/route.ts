import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isRSVPExpired, parseDropdownOptions } from "@/lib/rsvp-utils";

type SubmitBody = {
  name?: string;
  dropdownValue?: string;
  status?: "HADIR" | "TIDAK_HADIR";
  reason?: string;
};

export async function POST(
  request: Request,
  { params }: { params: { token: string } },
) {
  let body: SubmitBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = body.name?.trim();
  const status = body.status;
  const dropdownValue = body.dropdownValue?.trim();
  const reason = body.reason?.trim() || null;

  if (!name) {
    return NextResponse.json({ error: "Nama wajib diisi." }, { status: 400 });
  }
  if (status !== "HADIR" && status !== "TIDAK_HADIR") {
    return NextResponse.json(
      { error: "Status kehadiran tidak valid." },
      { status: 400 },
    );
  }

  const event = await prisma.rSVPEvent.findUnique({
    where: { token: params.token },
  });
  if (!event) {
    return NextResponse.json({ error: "Event tidak ditemukan." }, { status: 404 });
  }
  if (isRSVPExpired(event)) {
    return NextResponse.json({ error: "Form RSVP sudah ditutup." }, { status: 410 });
  }

  // Validasi dropdown jika event punya konfigurasi dropdown
  const dd = parseDropdownOptions(event.dropdownOptions);
  if (dd) {
    if (!dropdownValue) {
      return NextResponse.json(
        { error: `${dd.label} wajib dipilih.` },
        { status: 400 },
      );
    }
    if (!dd.options.includes(dropdownValue)) {
      return NextResponse.json(
        { error: `Pilihan ${dd.label} tidak valid.` },
        { status: 400 },
      );
    }
  }

  // Cek duplikasi nama (case-insensitive)
  const existing = await prisma.rSVPResponse.findFirst({
    where: {
      eventId: event.id,
      name: { equals: name, mode: "insensitive" },
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: "ALREADY_SUBMITTED", data: existing },
      { status: 409 },
    );
  }

  const response = await prisma.rSVPResponse.create({
    data: {
      eventId: event.id,
      name,
      dropdownValue: dd ? dropdownValue : null,
      status,
      reason: status === "TIDAK_HADIR" ? reason : null,
    },
  });

  return NextResponse.json({ ok: true, response });
}
