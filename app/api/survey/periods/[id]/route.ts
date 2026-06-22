import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PatchBody = {
  label?: string;
  startsAt?: string;
  endsAt?: string;
  isActive?: boolean;
};

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: PatchBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const existing = await prisma.surveyPeriod.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Periode tidak ditemukan." }, { status: 404 });
  }

  const data: {
    label?: string;
    startsAt?: Date;
    endsAt?: Date;
    isActive?: boolean;
  } = {};

  if (typeof body.label === "string") {
    const t = body.label.trim();
    if (!t) {
      return NextResponse.json({ error: "Label tidak boleh kosong." }, { status: 400 });
    }
    data.label = t;
  }
  if (body.startsAt) {
    const d = new Date(body.startsAt);
    if (isNaN(d.getTime())) {
      return NextResponse.json({ error: "Tanggal mulai tidak valid." }, { status: 400 });
    }
    data.startsAt = d;
  }
  if (body.endsAt) {
    const d = new Date(body.endsAt);
    if (isNaN(d.getTime())) {
      return NextResponse.json({ error: "Tanggal selesai tidak valid." }, { status: 400 });
    }
    data.endsAt = d;
  }
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;

  const newStarts = data.startsAt ?? existing.startsAt;
  const newEnds = data.endsAt ?? existing.endsAt;
  if (newEnds <= newStarts) {
    return NextResponse.json(
      { error: "Tanggal selesai harus setelah tanggal mulai." },
      { status: 400 },
    );
  }

  const period = await prisma.surveyPeriod.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json({ period });
}
