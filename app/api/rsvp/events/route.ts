import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type CreateBody = {
  title?: string;
  description?: string;
  eventAt?: string;
  dropdownLabel?: string;
  dropdownOptions?: string[];
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: CreateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = body.title?.trim();
  const description = body.description?.trim() || null;
  const eventAt = body.eventAt;
  if (!title || !eventAt) {
    return NextResponse.json(
      { error: "Nama event dan tanggal/jam wajib diisi." },
      { status: 400 },
    );
  }

  const eventDate = new Date(eventAt);
  if (isNaN(eventDate.getTime())) {
    return NextResponse.json({ error: "Tanggal tidak valid." }, { status: 400 });
  }
  if (eventDate.getTime() <= Date.now()) {
    return NextResponse.json(
      { error: "Tanggal event harus di masa depan." },
      { status: 400 },
    );
  }

  let dropdownJson: { label: string; options: string[] } | null = null;
  const label = body.dropdownLabel?.trim();
  const opts = Array.isArray(body.dropdownOptions)
    ? body.dropdownOptions.map((o) => String(o).trim()).filter(Boolean)
    : [];
  if (label && opts.length > 0) {
    dropdownJson = { label, options: opts };
  } else if (label && opts.length === 0) {
    return NextResponse.json(
      { error: "Dropdown butuh minimal 1 opsi." },
      { status: 400 },
    );
  } else if (!label && opts.length > 0) {
    return NextResponse.json(
      { error: "Label dropdown wajib diisi jika ada opsi." },
      { status: 400 },
    );
  }

  const event = await prisma.rSVPEvent.create({
    data: {
      title,
      description,
      eventAt: eventDate,
      createdBy: session.user.id,
      dropdownOptions: dropdownJson ?? undefined,
    },
  });

  return NextResponse.json({
    id: event.id,
    token: event.token,
    title: event.title,
    eventAt: event.eventAt,
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const events = await prisma.rSVPEvent.findMany({
    where: { createdBy: session.user.id },
    orderBy: { eventAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      eventAt: true,
      token: true,
      dropdownOptions: true,
      createdAt: true,
      _count: { select: { responses: true } },
      responses: { select: { status: true } },
    },
  });

  const result = events.map((e) => {
    const hadir = e.responses.filter((r) => r.status === "HADIR").length;
    const tidakHadir = e.responses.filter((r) => r.status === "TIDAK_HADIR").length;
    return {
      id: e.id,
      title: e.title,
      description: e.description,
      eventAt: e.eventAt,
      token: e.token,
      dropdownOptions: e.dropdownOptions,
      createdAt: e.createdAt,
      total: e._count.responses,
      hadir,
      tidakHadir,
    };
  });

  return NextResponse.json({ events: result });
}
