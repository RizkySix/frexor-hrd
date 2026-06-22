import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id) {
    const result = await prisma.surveyAnalysisResult.findUnique({
      where: { id },
      include: { updatedBy: { select: { name: true, email: true } } },
    });
    if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ result });
  }

  const results = await prisma.surveyAnalysisResult.findMany({
    orderBy: { generatedAt: "desc" },
    include: { updatedBy: { select: { name: true, email: true } } },
  });

  const pending = await prisma.surveySubmission.count({
    where: { isProcessed: false },
  });

  return NextResponse.json({ results, pendingSubmissions: pending });
}
