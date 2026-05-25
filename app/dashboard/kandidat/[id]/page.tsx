import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VAKChart } from "@/components/VAKChart";
import { STYLE_DESCRIPTIONS, type Style } from "@/lib/scoring-key";
import { QUESTIONS } from "@/lib/questions";

export const dynamic = "force-dynamic";

export default async function CandidateDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const candidate = await prisma.candidate.findUnique({
    where: { id: params.id },
    include: {
      answers: { orderBy: { questionNo: "asc" } },
    },
  });

  if (!candidate || candidate.createdBy !== session.user.id) {
    notFound();
  }

  const status = candidate.submittedAt
    ? "submitted"
    : Date.now() > candidate.expiresAt.getTime()
    ? "expired"
    : "open";

  const statusLabel = {
    submitted: { text: "Sudah Mengisi", cls: "bg-emerald-100 text-emerald-700" },
    open: { text: "Belum Mengisi", cls: "bg-amber-100 text-amber-700" },
    expired: { text: "Expired", cls: "bg-slate-200 text-slate-600" },
  }[status];

  const questionMap = new Map(QUESTIONS.map((q) => [q.no, q]));

  return (
    <div>
      <Link
        href="/dashboard"
        className="text-sm text-brand-600 hover:underline"
      >
        ← Kembali ke Dashboard
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{candidate.name}</h1>
          <p className="text-sm text-slate-600">{candidate.position}</p>
        </div>
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusLabel.cls}`}
        >
          {statusLabel.text}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600 sm:grid-cols-4">
        <Info label="Tanggal Buat" value={candidate.createdAt.toLocaleDateString("id-ID")} />
        <Info label="Kadaluarsa" value={candidate.expiresAt.toLocaleDateString("id-ID")} />
        <Info
          label="Tanggal Submit"
          value={
            candidate.submittedAt ? candidate.submittedAt.toLocaleDateString("id-ID") : "—"
          }
        />
        <Info label="Dominant Style" value={candidate.dominantStyle ?? "—"} />
      </div>

      {candidate.submittedAt && candidate.dominantStyle ? (
        <>
          <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Skor VAK</h2>
              <div className="mt-4">
                <VAKChart
                  scoreV={candidate.scoreV ?? 0}
                  scoreA={candidate.scoreA ?? 0}
                  scoreK={candidate.scoreK ?? 0}
                />
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Dominant Style</h2>
              <p className="mt-1 text-2xl font-bold text-brand-700">
                {candidate.dominantStyle}
              </p>
              <p className="mt-3 text-sm text-slate-600">
                {STYLE_DESCRIPTIONS[candidate.dominantStyle as Style]}
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-3">
              <h2 className="text-lg font-semibold">Detail Jawaban</h2>
            </div>
            <ul className="divide-y divide-slate-100">
              {candidate.answers.map((a) => {
                const q = questionMap.get(a.questionNo);
                if (!q) return null;
                return (
                  <li key={a.id} className="px-5 py-3 text-sm">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-slate-100 px-1.5 text-xs font-semibold text-slate-700">
                        {a.questionNo}
                      </span>
                      <div>
                        <p className="text-slate-700">{q.text}</p>
                        <p className="mt-1 text-slate-900">
                          <span className="font-semibold">Jawaban {a.answer}:</span>{" "}
                          {q.options[a.answer as "A" | "B" | "C"]}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      ) : (
        <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-600">
          {status === "expired"
            ? "Link sudah kadaluarsa sebelum kandidat sempat mengisi tes."
            : "Kandidat belum mengisi tes. Bagikan ulang link jika diperlukan."}
          {status === "open" && (
            <p className="mt-3 break-all text-xs text-slate-500">
              Link tes: <code>/tes/{candidate.token}</code>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-0.5 text-slate-800">{value}</div>
    </div>
  );
}
