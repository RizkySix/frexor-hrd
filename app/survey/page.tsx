import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getActivePeriod } from "@/lib/survey-utils";
import { formatEventDateTime } from "@/lib/rsvp-utils";
import { SurveyForm } from "./survey-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Employee Satisfaction Survey",
  description:
    "Survei kepuasan karyawan Bali Sun Tours — anonim, jawaban Anda membantu kami terus berkembang.",
  openGraph: {
    title: "Employee Satisfaction Survey — Bali Sun Tours",
    description:
      "Survei kepuasan karyawan Bali Sun Tours — anonim, jawaban Anda membantu kami terus berkembang.",
    type: "website",
  },
};

export default async function SurveyPage() {
  const now = new Date();
  const active = await getActivePeriod(now);

  if (!active) {
    // Cek apakah ada periode mendatang biar pesan lebih informatif
    const upcoming = await prisma.surveyPeriod.findFirst({
      where: { isActive: true, startsAt: { gt: now } },
      orderBy: { startsAt: "asc" },
      select: { label: true, startsAt: true, endsAt: true },
    });

    return (
      <ClosedCard
        title="Survey sedang ditutup"
        message={
          upcoming
            ? `Periode survey berikutnya: ${upcoming.label} — dibuka pada ${formatEventDateTime(upcoming.startsAt)}.`
            : "Saat ini tidak ada periode survey yang aktif. Silakan hubungi HRD untuk informasi jadwal berikutnya."
        }
      />
    );
  }

  return (
    <SurveyForm
      period={{
        id: active.id,
        label: active.label,
        startsAt: active.startsAt.toISOString(),
        endsAt: active.endsAt.toISOString(),
        endsAtFormatted: formatEventDateTime(active.endsAt),
      }}
    />
  );
}

function ClosedCard({ title, message }: { title: string; message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-3xl">
          🔒
        </div>
        <h1 className="mt-4 text-xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Kembali ke beranda
        </Link>
      </div>
    </main>
  );
}
