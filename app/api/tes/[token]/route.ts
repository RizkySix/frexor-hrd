import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { token: string } },
) {
  const candidate = await prisma.candidate.findUnique({
    where: { token: params.token },
    select: {
      id: true,
      name: true,
      position: true,
      createdAt: true,
      expiresAt: true,
      submittedAt: true,
    },
  });

  if (!candidate) {
    return NextResponse.json({ error: "Token tidak ditemukan." }, { status: 404 });
  }

  const now = Date.now();
  const isExpired = !candidate.submittedAt && now > candidate.expiresAt.getTime();
  const isSubmitted = candidate.submittedAt !== null;

  return NextResponse.json({
    candidate,
    status: isSubmitted ? "submitted" : isExpired ? "expired" : "open",
  });
}
