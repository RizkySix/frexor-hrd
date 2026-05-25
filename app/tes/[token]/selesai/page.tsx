import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { VAKChart } from "@/components/VAKChart";
import { STYLE_DESCRIPTIONS, type Style } from "@/lib/scoring-key";

export const dynamic = "force-dynamic";

export default async function FinishedPage({
  params,
}: {
  params: { token: string };
}) {
  const candidate = await prisma.candidate.findUnique({
    where: { token: params.token },
    select: {
      name: true,
      position: true,
      submittedAt: true,
      scoreV: true,
      scoreA: true,
      scoreK: true,
      dominantStyle: true,
    },
  });

  if (!candidate || !candidate.submittedAt || !candidate.dominantStyle) {
    notFound();
  }

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-xl">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-3xl">
            🎉
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">
            Terima kasih, {candidate.name}!
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Jawabanmu sudah tersimpan dan diteruskan ke tim HRD.
          </p>
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-slate-500">Skor VAK kamu</p>
          <div className="mt-4">
            <VAKChart
              scoreV={candidate.scoreV ?? 0}
              scoreA={candidate.scoreA ?? 0}
              scoreK={candidate.scoreK ?? 0}
            />
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-brand-100 bg-brand-50 p-6">
          <p className="text-xs uppercase tracking-wider text-brand-700">
            Dominant Style
          </p>
          <p className="mt-1 text-3xl font-bold text-brand-700">
            {candidate.dominantStyle}
          </p>
          <p className="mt-3 text-sm text-slate-700">
            {STYLE_DESCRIPTIONS[candidate.dominantStyle as Style]}
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Halaman ini bisa kamu tutup. HRD akan menindaklanjuti hasil tes.
        </p>
      </div>
    </main>
  );
}
