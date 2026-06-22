import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  CLOSING_TEXT,
  RATING_IDS,
  SECTIONS,
} from "@/lib/survey-questions";
import {
  getActivePeriod,
  hashToken,
  SURVEY_COOKIE_NAME,
  type Answers,
  type TextAnswers,
} from "@/lib/survey-utils";

type Body = {
  answers?: Record<string, number>;
  textAnswers?: Record<string, string | null | undefined>;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const answers = body.answers ?? {};
  const textAnswersIn = body.textAnswers ?? {};

  // Validasi rating wajib 1-4
  for (const qid of RATING_IDS) {
    const v = Number(answers[qid]);
    if (!Number.isInteger(v) || v < 1 || v > 4) {
      return NextResponse.json(
        { error: `Pertanyaan ${qid} harus diisi dengan skala 1–4.` },
        { status: 400 },
      );
    }
  }

  // Validasi closing text wajib
  for (const q of CLOSING_TEXT) {
    const v = textAnswersIn[q.id];
    if (!v || typeof v !== "string" || v.trim().length === 0) {
      return NextResponse.json(
        { error: `Pertanyaan ${q.id} wajib diisi.` },
        { status: 400 },
      );
    }
  }

  // Bangun payload bersih
  const cleanAnswers: Answers = {};
  for (const qid of RATING_IDS) cleanAnswers[qid] = Number(answers[qid]);

  const cleanText: TextAnswers = {};
  for (const s of SECTIONS) {
    if (s.feedbackId) {
      const v = textAnswersIn[s.feedbackId];
      cleanText[s.feedbackId] = typeof v === "string" && v.trim() ? v.trim() : null;
    }
  }
  for (const q of CLOSING_TEXT) {
    const v = textAnswersIn[q.id];
    cleanText[q.id] = typeof v === "string" ? v.trim() : "";
  }

  // Periode aktif wajib ada
  const period = await getActivePeriod();
  if (!period) {
    return NextResponse.json(
      { error: "Tidak ada periode survey yang aktif saat ini." },
      { status: 410 },
    );
  }

  // Client token wajib (di-set lewat /api/survey/init)
  const cookieStore = cookies();
  const token = cookieStore.get(SURVEY_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json(
      { error: "Sesi browser tidak valid. Refresh halaman dan coba lagi." },
      { status: 400 },
    );
  }
  const clientTokenHash = hashToken(token);

  // Cek apakah browser ini sudah submit di periode yang sama
  const existing = await prisma.surveySubmission.findFirst({
    where: { periodId: period.id, clientTokenHash },
    select: { id: true, submittedAt: true },
  });
  if (existing) {
    return NextResponse.json(
      {
        error: `Anda sudah mengisi survey untuk periode "${period.label}".`,
        alreadySubmitted: true,
      },
      { status: 409 },
    );
  }

  await prisma.surveySubmission.create({
    data: {
      answers: cleanAnswers,
      textAnswers: cleanText,
      periodId: period.id,
      clientTokenHash,
    },
  });

  return NextResponse.json({ ok: true, periodLabel: period.label });
}
