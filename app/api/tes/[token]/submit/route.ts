import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateVAK } from "@/lib/scoring-key";

type SubmitBody = {
  answers?: { questionNo: number; answer: string }[];
};

export async function POST(
  request: Request,
  { params }: { params: { token: string } },
) {
  let body: SubmitBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const answers = body.answers;
  if (!Array.isArray(answers) || answers.length !== 30) {
    return NextResponse.json(
      { error: "Harus mengirim tepat 30 jawaban." },
      { status: 400 },
    );
  }

  const seen = new Set<number>();
  for (const a of answers) {
    if (
      typeof a.questionNo !== "number" ||
      a.questionNo < 1 ||
      a.questionNo > 30 ||
      !["A", "B", "C"].includes(a.answer)
    ) {
      return NextResponse.json(
        { error: `Jawaban tidak valid pada soal ${a?.questionNo}.` },
        { status: 400 },
      );
    }
    if (seen.has(a.questionNo)) {
      return NextResponse.json(
        { error: `Jawaban duplikat pada soal ${a.questionNo}.` },
        { status: 400 },
      );
    }
    seen.add(a.questionNo);
  }

  const candidate = await prisma.candidate.findUnique({
    where: { token: params.token },
  });
  if (!candidate) {
    return NextResponse.json({ error: "Token tidak ditemukan." }, { status: 404 });
  }
  if (candidate.submittedAt) {
    return NextResponse.json(
      { error: "Tes sudah dikerjakan sebelumnya." },
      { status: 409 },
    );
  }
  if (Date.now() > candidate.expiresAt.getTime()) {
    return NextResponse.json(
      { error: "Link sudah kadaluarsa." },
      { status: 410 },
    );
  }

  const score = calculateVAK(answers);

  await prisma.$transaction([
    prisma.answer.createMany({
      data: answers.map((a) => ({
        candidateId: candidate.id,
        questionNo: a.questionNo,
        answer: a.answer,
      })),
    }),
    prisma.candidate.update({
      where: { id: candidate.id },
      data: {
        submittedAt: new Date(),
        scoreV: score.scoreV,
        scoreA: score.scoreA,
        scoreK: score.scoreK,
        dominantStyle: score.dominantStyle,
      },
    }),
  ]);

  return NextResponse.json({ ok: true, ...score });
}
