"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RatingScale } from "@/components/RatingScale";
import {
  CLOSING_RATING,
  CLOSING_TEXT,
  RATING_IDS,
  SECTIONS,
} from "@/lib/survey-questions";

type Ratings = Record<string, number | null>;
type Texts = Record<string, string>;

const TOTAL_SECTIONS = SECTIONS.length + 1;

export type SurveyPeriodProp = {
  id: string;
  label: string;
  startsAt: string;
  endsAt: string;
  endsAtFormatted: string;
};

export function SurveyForm({ period }: { period: SurveyPeriodProp }) {
  // Draft key scoped per-period sehingga karyawan tidak melihat draft periode lama
  const DRAFT_KEY = `survey-draft-v1:${period.id}`;
  const router = useRouter();
  const [initState, setInitState] = useState<
    "checking" | "ready" | "already" | "error"
  >("checking");
  const [ratings, setRatings] = useState<Ratings>(() =>
    Object.fromEntries(RATING_IDS.map((id) => [id, null])),
  );
  const [texts, setTexts] = useState<Texts>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);

  // Init cookie + cek apakah browser sudah submit di periode ini
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/survey/init", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        if (cancelled) return;
        if (!res.ok) {
          setInitState("error");
          return;
        }
        const data = (await res.json()) as {
          activePeriod: { id: string } | null;
          alreadySubmitted: boolean;
        };
        if (!data.activePeriod || data.activePeriod.id !== period.id) {
          // Periode berubah saat user buka halaman — paksa reload
          router.refresh();
          return;
        }
        setInitState(data.alreadySubmitted ? "already" : "ready");
      } catch {
        if (!cancelled) setInitState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [period.id, router]);

  // Load draft dari localStorage sekali di mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { ratings?: Ratings; texts?: Texts };
        if (parsed.ratings) setRatings((prev) => ({ ...prev, ...parsed.ratings }));
        if (parsed.texts) setTexts(parsed.texts);
      }
    } catch {
      /* ignore */
    }
    setDraftLoaded(true);
  }, [DRAFT_KEY]);

  // Auto-save draft ke localStorage (debounced)
  useEffect(() => {
    if (!draftLoaded) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ ratings, texts }));
      } catch {
        /* ignore */
      }
    }, 400);
    return () => clearTimeout(t);
  }, [ratings, texts, draftLoaded]);

  // Show back-to-top button after scrolling down
  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const totalRatings = RATING_IDS.length;
  const answeredRatings = useMemo(
    () => RATING_IDS.filter((id) => ratings[id] != null).length,
    [ratings],
  );
  const progress = Math.round((answeredRatings / totalRatings) * 100);

  // Status per seksi (untuk stepper)
  const sectionStatus = useMemo(() => {
    return SECTIONS.map((sec) => {
      const total = sec.ratingQuestions.length;
      const done = sec.ratingQuestions.filter((q) => ratings[q.id] != null).length;
      return { id: sec.id, total, done, complete: done === total };
    });
  }, [ratings]);

  const closingComplete =
    ratings[CLOSING_RATING.id] != null &&
    CLOSING_TEXT.every((q) => (texts[q.id] ?? "").trim().length > 0);

  function setRating(id: string, v: number) {
    setRatings((p) => ({ ...p, [id]: v }));
  }
  function setText(id: string, v: string) {
    setTexts((p) => ({ ...p, [id]: v }));
  }

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const setSectionRef = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      sectionRefs.current[id] = el;
    },
    [],
  );

  function jumpToSection(id: string) {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const missingRating = RATING_IDS.find((id) => ratings[id] == null);
    if (missingRating) {
      setError("Masih ada pertanyaan rating yang belum dijawab.");
      document
        .getElementById(`q-${missingRating}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    for (const q of CLOSING_TEXT) {
      if (!texts[q.id]?.trim()) {
        setError("Pertanyaan penutup wajib diisi semua.");
        document
          .getElementById(`q-${q.id}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
    }

    if (
      !window.confirm(
        "Kirim jawaban survey? Survei ini anonim dan tidak bisa diubah setelah dikirim.",
      )
    ) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/survey/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: ratings, textAnswers: texts }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409 && data.alreadySubmitted) {
          try {
            localStorage.removeItem(DRAFT_KEY);
          } catch {
            /* ignore */
          }
          setInitState("already");
          return;
        }
        setError(data.error ?? "Gagal mengirim survey.");
        setSubmitting(false);
        return;
      }
      // Bersihkan draft setelah submit sukses
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      router.push("/survey/selesai");
    } catch {
      setError("Terjadi kesalahan jaringan.");
      setSubmitting(false);
    }
  }

  // Gate states sebelum form ditampilkan
  if (initState === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-slate-500">Memuat...</p>
      </main>
    );
  }

  if (initState === "already") {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-3xl">
            ✓
          </div>
          <h1 className="mt-4 text-lg font-semibold text-emerald-900">
            Anda sudah mengisi survey periode ini
          </h1>
          <p className="mt-2 text-sm text-emerald-800">
            Terima kasih atas partisipasi Anda di periode{" "}
            <strong>{period.label}</strong>. Jawaban Anda telah tersimpan secara
            anonim. Anda akan bisa mengisi lagi pada periode berikutnya.
          </p>
        </div>
      </main>
    );
  }

  if (initState === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-xl border border-rose-200 bg-rose-50 p-8 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-rose-900">
            Gagal memuat survey
          </h1>
          <p className="mt-2 text-sm text-rose-800">
            Coba refresh halaman. Jika masih gagal, hubungi HRD.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50/50 via-white to-white pb-32">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-600">
                Bali Sun Tours
              </p>
              <p className="text-sm font-medium text-slate-800">
                Employee Satisfaction Survey
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Rating</p>
              <p className="font-semibold tabular-nums text-slate-800">
                {answeredRatings} / {totalRatings}
              </p>
            </div>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Section stepper */}
          <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
            {SECTIONS.map((sec, i) => {
              const st = sectionStatus[i];
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => jumpToSection(sec.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                    st.complete
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : st.done > 0
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                  title={sec.title}
                >
                  <span
                    className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                      st.complete
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {st.complete ? "✓" : i + 1}
                  </span>
                  <span className="hidden sm:inline">{sec.title.split(" ")[0]}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => jumpToSection("closing")}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                closingComplete
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-600"
              }`}
            >
              <span
                className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                  closingComplete ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-700"
                }`}
              >
                {closingComplete ? "✓" : TOTAL_SECTIONS}
              </span>
              <span className="hidden sm:inline">Penutup</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        {/* Intro card */}
        <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xl">
              🤝
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                Halo, terima kasih sudah meluangkan waktu!
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
                Survei ini <strong>100% anonim</strong> — tidak ada nama, email,
                atau identitas apapun yang dikumpulkan. Jawaban jujur Anda akan
                membantu Bali Sun Tours menjadi tempat kerja yang lebih baik.
              </p>
              <p className="mt-2 text-xs text-slate-500">
                ⏱ Estimasi waktu: 5–8 menit · 💾 Jawaban Anda otomatis tersimpan di
                browser, aman dari refresh tanpa sengaja.
              </p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/70 px-3 py-1 text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="font-medium text-slate-700">Periode {period.label}</span>
                <span className="text-slate-500">· tutup {period.endsAtFormatted}</span>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {SECTIONS.map((section, idx) => {
            const st = sectionStatus[idx];
            return (
              <section
                key={section.id}
                ref={setSectionRef(section.id)}
                className="scroll-mt-40 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <header className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50 px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        st.complete
                          ? "bg-emerald-500 text-white"
                          : "bg-brand-100 text-brand-700"
                      }`}
                    >
                      {st.complete ? "✓" : idx + 1}
                    </span>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Seksi {idx + 1} dari {TOTAL_SECTIONS}
                      </p>
                      <h2 className="text-base font-semibold text-slate-900 leading-tight">
                        {section.title}
                      </h2>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-slate-500">
                    {st.done}/{st.total}
                  </span>
                </header>

                <div className="space-y-6 px-5 py-5">
                  {section.ratingQuestions.map((q) => (
                    <div key={q.id} id={`q-${q.id}`} className="scroll-mt-40">
                      <p className="text-sm font-medium leading-relaxed text-slate-800">
                        {q.text}
                      </p>
                      <div className="mt-3">
                        <RatingScale
                          name={q.id}
                          value={ratings[q.id]}
                          onChange={(v) => setRating(q.id, v)}
                        />
                      </div>
                    </div>
                  ))}

                  {section.feedbackId && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700">
                        {section.feedbackLabel}{" "}
                        <span className="text-xs font-normal text-slate-400">
                          (opsional)
                        </span>
                      </label>
                      <textarea
                        rows={3}
                        value={texts[section.feedbackId] ?? ""}
                        onChange={(e) =>
                          setText(section.feedbackId!, e.target.value)
                        }
                        placeholder="Tulis saran Anda di sini..."
                        className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                      />
                    </div>
                  )}
                </div>
              </section>
            );
          })}

          {/* Closing section */}
          <section
            ref={setSectionRef("closing")}
            className="scroll-mt-40 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <header className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50 px-5 py-3.5">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    closingComplete
                      ? "bg-emerald-500 text-white"
                      : "bg-brand-100 text-brand-700"
                  }`}
                >
                  {closingComplete ? "✓" : TOTAL_SECTIONS}
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Seksi {TOTAL_SECTIONS} dari {TOTAL_SECTIONS}
                  </p>
                  <h2 className="text-base font-semibold text-slate-900 leading-tight">
                    Penutup — Kepuasan Keseluruhan
                  </h2>
                </div>
              </div>
            </header>

            <div className="space-y-6 px-5 py-5">
              <div id={`q-${CLOSING_RATING.id}`} className="scroll-mt-40">
                <p className="text-sm font-medium text-slate-800">
                  {CLOSING_RATING.text}
                </p>
                <div className="mt-3">
                  <RatingScale
                    name={CLOSING_RATING.id}
                    value={ratings[CLOSING_RATING.id]}
                    onChange={(v) => setRating(CLOSING_RATING.id, v)}
                  />
                </div>
              </div>

              {CLOSING_TEXT.map((q) => (
                <div key={q.id} id={`q-${q.id}`} className="scroll-mt-40">
                  <label className="block text-sm font-medium text-slate-800">
                    {q.text}
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={texts[q.id] ?? ""}
                    onChange={(e) => setText(q.id, e.target.value)}
                    placeholder="Tulis jawaban Anda..."
                    className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  />
                </div>
              ))}
            </div>
          </section>

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {/* Submit card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-800">
                  {answeredRatings === totalRatings && closingComplete
                    ? "✓ Semua sudah terisi. Siap kirim!"
                    : `Masih ${totalRatings - answeredRatings} rating ${
                        closingComplete ? "" : "+ pertanyaan penutup "
                      }belum diisi.`}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Setelah dikirim, jawaban tidak bisa diubah.
                </p>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-brand-500/20 transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Mengirim..." : "Kirim Survey"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Floating back-to-top */}
      {showBackToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Kembali ke atas"
          className="fixed bottom-6 right-6 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg shadow-brand-500/30 transition hover:bg-brand-600"
        >
          ↑
        </button>
      )}
    </main>
  );
}
