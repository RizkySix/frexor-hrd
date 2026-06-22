import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { aggregate, type Answers, type TextAnswers } from "@/lib/survey-utils";
import { SECTIONS } from "@/lib/survey-questions";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const processed = searchParams.get("processed"); // "true" | "false" | null

  const where =
    processed === "true"
      ? { isProcessed: true }
      : processed === "false"
      ? { isProcessed: false }
      : {};

  const submissions = await prisma.surveySubmission.findMany({
    where,
    orderBy: { submittedAt: "desc" },
  });

  const enriched = submissions.map((s) => {
    const answers = s.answers as Answers;
    const textAnswers = s.textAnswers as TextAnswers;
    const { per_section, overall_avg } = aggregate([{ answers }]);
    const sectionAvgs: Record<string, number> = {};
    for (const sec of SECTIONS) sectionAvgs[sec.id] = per_section[sec.id]?.avg ?? 0;

    return {
      id: s.id,
      submittedAt: s.submittedAt,
      isProcessed: s.isProcessed,
      answers,
      textAnswers,
      sectionAvgs,
      overallAvg: overall_avg,
    };
  });

  return NextResponse.json({ submissions: enriched, total: enriched.length });
}
