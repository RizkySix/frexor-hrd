import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: string; position?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = body.name?.trim();
  const position = body.position?.trim();
  if (!name || !position) {
    return NextResponse.json(
      { error: "Nama dan posisi wajib diisi." },
      { status: 400 },
    );
  }

  const now = new Date();
  const candidate = await prisma.candidate.create({
    data: {
      name,
      position,
      createdBy: session.user.id,
      expiresAt: new Date(now.getTime() + SEVEN_DAYS_MS),
    },
  });

  return NextResponse.json({
    id: candidate.id,
    token: candidate.token,
    name: candidate.name,
    position: candidate.position,
    expiresAt: candidate.expiresAt,
  });
}
