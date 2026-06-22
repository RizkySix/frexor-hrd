import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type CreateBody = {
  label?: string;
  startsAt?: string;
  endsAt?: string;
  isActive?: boolean;
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const periods = await prisma.surveyPeriod.findMany({
    orderBy: { startsAt: "desc" },
    include: { _count: { select: { submissions: true } } },
  });

  return NextResponse.json({
    periods: periods.map((p) => ({
      id: p.id,
      label: p.label,
      startsAt: p.startsAt,
      endsAt: p.endsAt,
      isActive: p.isActive,
      createdAt: p.createdAt,
      submissionCount: p._count.submissions,
    })),
  });
}

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

  const label = body.label?.trim();
  if (!label || !body.startsAt || !body.endsAt) {
    return NextResponse.json(
      { error: "Label, tanggal mulai, dan tanggal selesai wajib diisi." },
      { status: 400 },
    );
  }

  const startsAt = new Date(body.startsAt);
  const endsAt = new Date(body.endsAt);
  if (isNaN(startsAt.getTime()) || isNaN(endsAt.getTime())) {
    return NextResponse.json({ error: "Tanggal tidak valid." }, { status: 400 });
  }
  if (endsAt <= startsAt) {
    return NextResponse.json(
      { error: "Tanggal selesai harus setelah tanggal mulai." },
      { status: 400 },
    );
  }

  const period = await prisma.surveyPeriod.create({
    data: {
      label,
      startsAt,
      endsAt,
      isActive: body.isActive ?? true,
      createdBy: session.user.id,
    },
  });

  return NextResponse.json({ period });
}
