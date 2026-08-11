import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ShirtSize } from "@/lib/driver-size-utils";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const submissions = await prisma.driverSizeSubmission.findMany({
    orderBy: { submittedAt: "desc" },
  });

  const summary: { total: number } & Record<ShirtSize, number> = {
    total: submissions.length,
    S: 0,
    M: 0,
    L: 0,
    XL: 0,
    XXL: 0,
    XXXL: 0,
    XXXXL: 0,
  };
  for (const s of submissions) {
    summary[s.size as ShirtSize] += 1;
  }

  return NextResponse.json({ submissions, summary });
}
