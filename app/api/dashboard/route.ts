import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const candidates = await prisma.candidate.findMany({
    where: { createdBy: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      position: true,
      token: true,
      createdAt: true,
      expiresAt: true,
      submittedAt: true,
      scoreV: true,
      scoreA: true,
      scoreK: true,
      dominantStyle: true,
    },
  });

  return NextResponse.json({ candidates });
}
