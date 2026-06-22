import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function toJsonField(v: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (v === undefined || v === null) return Prisma.JsonNull;
  return v as Prisma.InputJsonValue;
}

type QualitativePayload = {
  company_strengths?: unknown;
  top_improvement_areas?: unknown;
  actionable_suggestions?: unknown;
  retention_sentiment?: unknown;
  retention_summary?: unknown;
};

type InboundPayload = {
  period_label?: string;
  // Beberapa versi sistem AI mengirim "summary", sebagian "summary_text" — terima keduanya.
  summary?: string;
  summary_text?: string;
  overall_avg?: number;
  total_respondents?: number;
  generated_at?: string;
  qualitative?: QualitativePayload;
  section_analyses?: unknown;
  raw?: unknown;
};

export async function POST(request: Request) {
  let body: InboundPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const periodLabel = body.period_label?.trim();
  const overallAvg = Number(body.overall_avg);
  const totalRespondents = Number(body.total_respondents);

  if (!periodLabel || !Number.isFinite(overallAvg) || !Number.isInteger(totalRespondents)) {
    return NextResponse.json(
      { error: "period_label, overall_avg, total_respondents wajib." },
      { status: 400 },
    );
  }

  const summaryText = body.summary ?? body.summary_text ?? null;

  const result = await prisma.surveyAnalysisResult.create({
    data: {
      periodLabel,
      analysisPayload: body as Prisma.InputJsonValue,
      qualitativeData: toJsonField(body.qualitative),
      sectionAnalyses: toJsonField(body.section_analyses),
      summaryText,
      overallAvg,
      totalRespondents,
      generatedBy: "AI_WEBHOOK",
    },
  });

  return NextResponse.json({ ok: true, id: result.id });
}
