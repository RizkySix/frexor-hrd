import crypto from "crypto";
import { prisma } from "./prisma";
import {
  CLOSING_RATING,
  RATING_IDS,
  RATING_TEXT_BY_ID,
  SECTIONS,
  SECTION_OF_QUESTION,
} from "./survey-questions";

export type Answers = Record<string, number>;
export type TextAnswers = Record<string, string | null>;

export const SURVEY_COOKIE_NAME = "survey_client_token";

export function hashToken(token: string): string {
  const salt = process.env.NEXTAUTH_SECRET ?? "fallback-salt";
  return crypto.createHash("sha256").update(`${salt}:${token}`).digest("hex");
}

export function generateClientToken(): string {
  return crypto.randomUUID();
}

export type ActivePeriod = {
  id: string;
  label: string;
  startsAt: Date;
  endsAt: Date;
};

export async function getActivePeriod(now: Date = new Date()): Promise<ActivePeriod | null> {
  const period = await prisma.surveyPeriod.findFirst({
    where: {
      isActive: true,
      startsAt: { lte: now },
      endsAt: { gte: now },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, label: true, startsAt: true, endsAt: true },
  });
  return period;
}

export function periodLabelFromDate(d: Date = new Date()): string {
  // WITA timezone, format "Bulan YYYY" (Indonesian)
  const month = d.toLocaleString("id-ID", {
    month: "long",
    timeZone: "Asia/Makassar",
  });
  const year = d.toLocaleString("id-ID", {
    year: "numeric",
    timeZone: "Asia/Makassar",
  });
  return `${month} ${year}`;
}

export type PerQuestion = {
  avg: number;
  distribution: Record<"1" | "2" | "3" | "4", number>;
};
export type PerSection = { title: string; avg: number };

export type Aggregated = {
  per_question: Record<string, PerQuestion>;
  per_section: Record<string, PerSection>;
  overall_avg: number;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function aggregate(submissions: { answers: Answers }[]): Aggregated {
  const per_question: Record<string, PerQuestion> = {};
  for (const qid of RATING_IDS) {
    per_question[qid] = { avg: 0, distribution: { "1": 0, "2": 0, "3": 0, "4": 0 } };
  }

  for (const s of submissions) {
    for (const qid of RATING_IDS) {
      const v = Number(s.answers[qid]);
      if (v >= 1 && v <= 4) {
        const k = String(v) as "1" | "2" | "3" | "4";
        per_question[qid].distribution[k]++;
      }
    }
  }

  for (const qid of RATING_IDS) {
    const d = per_question[qid].distribution;
    const total = d["1"] + d["2"] + d["3"] + d["4"];
    const sum = d["1"] * 1 + d["2"] * 2 + d["3"] * 3 + d["4"] * 4;
    per_question[qid].avg = total > 0 ? round2(sum / total) : 0;
  }

  const per_section: Record<string, PerSection> = {};
  for (const section of SECTIONS) {
    const qs = section.ratingQuestions.map((q) => per_question[q.id].avg);
    const valid = qs.filter((v) => v > 0);
    const avg = valid.length > 0 ? round2(valid.reduce((a, b) => a + b, 0) / valid.length) : 0;
    per_section[section.id] = { title: section.title, avg };
  }

  const allAvgs = RATING_IDS.map((qid) => per_question[qid].avg).filter((v) => v > 0);
  const overall_avg =
    allAvgs.length > 0 ? round2(allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length) : 0;

  return { per_question, per_section, overall_avg };
}

export function buildAnalysisPayload(
  submissions: { id: string; submittedAt: Date; answers: Answers; textAnswers: TextAnswers }[],
  periodLabel: string,
) {
  const aggregated = aggregate(submissions);

  return {
    survey_period: periodLabel,
    total_respondents: submissions.length,
    generated_at: new Date().toISOString(),
    sections: SECTIONS.map((s) => ({
      section_id: s.id,
      section_title: s.title,
      questions: s.ratingQuestions.map((q) => ({
        question_id: q.id,
        question_text: q.text,
      })),
    })).concat([
      {
        section_id: "closing",
        section_title: "Penutup",
        questions: [{ question_id: CLOSING_RATING.id, question_text: CLOSING_RATING.text }],
      },
    ]),
    submissions: submissions.map((s) => ({
      submission_id: s.id,
      submitted_at: s.submittedAt.toISOString(),
      answers: s.answers,
      text_answers: s.textAnswers,
    })),
    aggregated,
  };
}

export type RankedAspect = { question_id: string; question_text: string; avg: number };

export function topAspects(perQuestion: Record<string, PerQuestion>, n: number): RankedAspect[] {
  return Object.entries(perQuestion)
    .map(([qid, v]) => ({
      question_id: qid,
      question_text: RATING_TEXT_BY_ID[qid] ?? qid,
      avg: v.avg,
    }))
    .filter((a) => a.avg > 0)
    .sort((a, b) => b.avg - a.avg)
    .slice(0, n);
}

export function bottomAspects(
  perQuestion: Record<string, PerQuestion>,
  n: number,
): RankedAspect[] {
  return Object.entries(perQuestion)
    .map(([qid, v]) => ({
      question_id: qid,
      question_text: RATING_TEXT_BY_ID[qid] ?? qid,
      avg: v.avg,
    }))
    .filter((a) => a.avg > 0)
    .sort((a, b) => a.avg - b.avg)
    .slice(0, n);
}

export function sectionOf(qid: string): string | undefined {
  return SECTION_OF_QUESTION[qid];
}
