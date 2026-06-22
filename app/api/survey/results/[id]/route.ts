import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function toJsonField(v: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
  if (v === undefined) return undefined;
  if (v === null) return Prisma.JsonNull;
  return v as Prisma.InputJsonValue;
}

type PatchBody = {
  summaryText?: string | null;
  qualitativeData?: unknown;
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

  const existing = await prisma.surveyAnalysisResult.findUnique({
    where: { id: params.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const result = await prisma.surveyAnalysisResult.update({
    where: { id: params.id },
    data: {
      summaryText: body.summaryText ?? existing.summaryText,
      qualitativeData: toJsonField(body.qualitativeData),
      generatedBy: "MANUAL_HRD",
      updatedByUserId: session.user.id,
    },
    include: { updatedBy: { select: { name: true, email: true } } },
  });

  return NextResponse.json({ result });
}
