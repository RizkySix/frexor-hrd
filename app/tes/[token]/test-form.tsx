"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { QUESTIONS } from "@/lib/questions";
import { QuestionCard } from "@/components/QuestionCard";

type Props = {
  token: string;
  candidate: { name: string; position: string };
};

type Answers = Record<number, "A" | "B" | "C" | undefined>;

export function TestForm({ token, candidate }: Props) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Answers>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const answered = useMemo(
    () => Object.values(answers).filter(Boolean).length,
    [answers],
  );
  const total = QUESTIONS.length;
  const progress = Math.round((answered / total) * 100);

  function setAnswer(no: number, val: "A" | "B" | "C") {
    setAnswers((prev) => ({ ...prev, [no]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const missing = QUESTIONS.filter((q) => !answers[q.no]);
    if (missing.length > 0) {
      setError(`Masih ada ${missing.length} soal yang belum dijawab.`);
      const first = missing[0];
      document.getElementById(`q-${first.no}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (!window.confirm("Kirim jawaban? Setelah dikirim, jawaban tidak bisa diubah.")) {
      return;
    }

    setSubmitting(true);
    try {
      const payload = QUESTIONS.map((q) => ({
        questionNo: q.no,
        answer: answers[q.no] as "A" | "B" | "C",
      }));
      const res = await fetch(`/api/tes/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal mengirim jawaban.");
        setSubmitting(false);
        return;
      }
      router.push(`/tes/${token}/selesai`);
    } catch {
      setError("Terjadi kesalahan jaringan. Silakan coba lagi.");
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen pb-32">
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="text-xs uppercase tracking-wider text-brand-600">Frexor</p>
              <p className="text-sm font-medium">Working Style Test</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Progress</p>
              <p className="font-semibold tabular-nums text-slate-800">
                {answered} / {total}
              </p>
            </div>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-brand-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h1 className="text-lg font-semibold">Halo, {candidate.name} 👋</h1>
          <p className="mt-1 text-sm text-slate-600">
            Posisi: <strong>{candidate.position}</strong>
          </p>
          <p className="mt-3 text-sm text-slate-600">
            Jawab <strong>{total} pertanyaan</strong> berikut sesuai dengan kondisi
            sehari-hari kamu. Tidak ada jawaban benar atau salah — pilih yang paling
            menggambarkan dirimu.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {QUESTIONS.map((q) => (
            <QuestionCard
              key={q.no}
              question={q}
              value={answers[q.no] ?? null}
              onChange={(val) => setAnswer(q.no, val)}
            />
          ))}

          {error && (
            <div className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-600">
                {answered === total
                  ? "Semua soal sudah terjawab. Siap kirim?"
                  : `Masih ${total - answered} soal lagi.`}
              </p>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Mengirim..." : "Kirim Jawaban"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
