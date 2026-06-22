import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  buildAnalysisPayload,
  periodLabelFromDate,
  type Answers,
  type TextAnswers,
} from "@/lib/survey-utils";

// AI memproses analisis secara async dan mengirim hasilnya lewat
// /api/webhooks/survey-analysis — kita tidak perlu (dan tidak boleh) menunggu
// analisis selesai di sini. Kita beri waktu singkat untuk memastikan request
// benar-benar terkirim; kalau AI lambat balas, kita tetap lanjut (bukan error).
const TRIGGER_WAIT_MS = 5000;

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const webhookUrl = process.env.AI_ANALYSIS_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json(
      { error: "AI_ANALYSIS_WEBHOOK_URL belum dikonfigurasi di server." },
      { status: 500 },
    );
  }

  const submissions = await prisma.surveySubmission.findMany({
    where: { isProcessed: false },
    orderBy: { submittedAt: "asc" },
  });

  if (submissions.length === 0) {
    return NextResponse.json(
      { error: "Tidak ada submission baru untuk dianalisis." },
      { status: 400 },
    );
  }

  const periodLabel = periodLabelFromDate();
  const payload = buildAnalysisPayload(
    submissions.map((s) => ({
      id: s.id,
      submittedAt: s.submittedAt,
      answers: s.answers as Answers,
      textAnswers: s.textAnswers as TextAnswers,
    })),
    periodLabel,
  );

  // Jika fetch gagal cepat (DNS/connection refused) sebelum timeout, request
  // dianggap tidak pernah sampai ke AI. Jika belum selesai saat timeout
  // tercapai, kita tetap anggap terkirim dan biarkan jalan di belakang —
  // hasil tetap akan masuk lewat webhook nanti.
  let failedFast = false;
  const dispatch = fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch((err) => {
    failedFast = true;
    console.error("Gagal trigger AI webhook:", err);
    return null;
  });

  await Promise.race([
    dispatch,
    new Promise((resolve) => setTimeout(resolve, TRIGGER_WAIT_MS)),
  ]);

  if (failedFast) {
    return NextResponse.json(
      {
        error:
          "Gagal menghubungi AI_ANALYSIS_WEBHOOK_URL. Periksa URL dan koneksi, lalu coba lagi.",
      },
      { status: 502 },
    );
  }

  await prisma.surveySubmission.updateMany({
    where: { id: { in: submissions.map((s) => s.id) } },
    data: { isProcessed: true },
  });

  return NextResponse.json({
    ok: true,
    periodLabel,
    totalRespondents: submissions.length,
  });
}
