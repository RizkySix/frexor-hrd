import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  generateClientToken,
  getActivePeriod,
  hashToken,
  SURVEY_COOKIE_NAME,
} from "@/lib/survey-utils";

// Set cookie sesi anonim + return status periode & apakah browser ini sudah submit.
export async function GET() {
  const cookieStore = cookies();
  let token = cookieStore.get(SURVEY_COOKIE_NAME)?.value;
  let setCookie = false;

  if (!token) {
    token = generateClientToken();
    setCookie = true;
  }

  const period = await getActivePeriod();
  let alreadySubmitted = false;

  if (period) {
    const existing = await prisma.surveySubmission.findFirst({
      where: { periodId: period.id, clientTokenHash: hashToken(token) },
      select: { submittedAt: true },
    });
    alreadySubmitted = !!existing;
  }

  const res = NextResponse.json({
    activePeriod: period
      ? {
          id: period.id,
          label: period.label,
          startsAt: period.startsAt.toISOString(),
          endsAt: period.endsAt.toISOString(),
        }
      : null,
    alreadySubmitted,
  });

  if (setCookie) {
    res.cookies.set({
      name: SURVEY_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      // 1 tahun
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return res;
}
