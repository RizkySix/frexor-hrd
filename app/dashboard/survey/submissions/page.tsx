"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CLOSING_RATING,
  CLOSING_TEXT,
  RATING_SCALE_LABELS,
  SECTIONS,
} from "@/lib/survey-questions";

type Submission = {
  id: string;
  submittedAt: string;
  isProcessed: boolean;
  answers: Record<string, number>;
  textAnswers: Record<string, string | null>;
  sectionAvgs: Record<string, number>;
  overallAvg: number;
};

type Filter = "all" | "unprocessed" | "processed";

function formatDateTimeWITA(d: string) {
  return new Date(d).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Makassar",
  });
}

function shortId(id: string) {
  return id.slice(-6).toUpperCase();
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const param =
      filter === "unprocessed" ? "?processed=false" : filter === "processed" ? "?processed=true" : "";
    const res = await fetch(`/api/survey/submissions${param}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setSubmissions(data.submissions);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const total = submissions.length;
    const unprocessed = submissions.filter((s) => !s.isProcessed).length;
    return { total, unprocessed, processed: total - unprocessed };
  }, [submissions]);

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div>
          <Link
            href="/dashboard/survey"
            className="text-sm text-brand-600 hover:underline"
          >
            ← Kembali ke Analisis Survey
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            Raw Submissions
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Semua jawaban karyawan secara anonim, urut dari terbaru.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <FilterButton
          label="Semua"
          count={counts.total}
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
        <FilterButton
          label="Belum Dianalisis"
          count={counts.unprocessed}
          active={filter === "unprocessed"}
          onClick={() => setFilter("unprocessed")}
          tone="amber"
        />
        <FilterButton
          label="Sudah Dianalisis"
          count={counts.processed}
          active={filter === "processed"}
          onClick={() => setFilter("processed")}
          tone="emerald"
        />
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            Memuat...
          </div>
        ) : submissions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            Belum ada submission.
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((s) => (
              <SubmissionCard
                key={s.id}
                submission={s}
                expanded={expandedId === s.id}
                onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function FilterButton({
  label,
  count,
  active,
  onClick,
  tone = "brand",
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  tone?: "brand" | "amber" | "emerald";
}) {
  const activeTone = {
    brand: "border-brand-500 bg-brand-50 text-brand-700",
    amber: "border-amber-400 bg-amber-50 text-amber-800",
    emerald: "border-emerald-400 bg-emerald-50 text-emerald-800",
  }[tone];
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border bg-white p-4 text-left shadow-sm transition ${
        active ? activeTone : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{count}</div>
    </button>
  );
}

function ScorePill({ value }: { value: number }) {
  const cls =
    value >= 3.5
      ? "bg-emerald-100 text-emerald-700"
      : value < 3
      ? "bg-rose-100 text-rose-700"
      : "bg-slate-100 text-slate-700";
  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${cls}`}
    >
      {value.toFixed(2)}
    </span>
  );
}

function RatingChip({ value }: { value: number }) {
  const cls =
    value === 4
      ? "bg-emerald-100 text-emerald-700"
      : value === 3
      ? "bg-sky-100 text-sky-700"
      : value === 2
      ? "bg-amber-100 text-amber-700"
      : "bg-rose-100 text-rose-700";
  return (
    <span
      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${cls}`}
      title={RATING_SCALE_LABELS[value]}
    >
      {value}
    </span>
  );
}

function SubmissionCard({
  submission: s,
  expanded,
  onToggle,
}: {
  submission: Submission;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-brand-200">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 p-4 text-left"
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">
            #{shortId(s.id)}
          </span>
          <span className="text-sm font-medium text-slate-700">
            {formatDateTimeWITA(s.submittedAt)} WITA
          </span>
          {s.isProcessed ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Sudah Dianalisis
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Belum Dianalisis
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">Overall</span>
          <ScorePill value={s.overallAvg} />
          <span className={`text-slate-400 transition ${expanded ? "rotate-180" : ""}`}>
            ▾
          </span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-4 py-5 sm:px-6">
          {/* Section averages */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {SECTIONS.map((sec) => (
              <div
                key={sec.id}
                className="flex items-center justify-between gap-2 rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-xs"
              >
                <span className="text-slate-600">{sec.title}</span>
                <ScorePill value={s.sectionAvgs[sec.id] ?? 0} />
              </div>
            ))}
          </div>

          {/* Detail per section */}
          <div className="mt-5 space-y-5">
            {SECTIONS.map((sec, idx) => {
              const feedback = sec.feedbackId
                ? s.textAnswers[sec.feedbackId]
                : null;
              return (
                <div key={sec.id}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Seksi {idx + 1} · {sec.title}
                  </h3>
                  <ul className="mt-2 space-y-1.5">
                    {sec.ratingQuestions.map((q) => (
                      <li
                        key={q.id}
                        className="flex items-start justify-between gap-3 rounded-md border border-slate-100 bg-white px-3 py-2 text-sm"
                      >
                        <span className="flex-1 text-slate-700">{q.text}</span>
                        <RatingChip value={s.answers[q.id] ?? 0} />
                      </li>
                    ))}
                  </ul>
                  {feedback && (
                    <div className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Saran:{" "}
                      </span>
                      &ldquo;{feedback}&rdquo;
                    </div>
                  )}
                </div>
              );
            })}

            {/* Closing rating */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Penutup · Kepuasan Keseluruhan
              </h3>
              <ul className="mt-2 space-y-1.5">
                <li className="flex items-start justify-between gap-3 rounded-md border border-slate-100 bg-white px-3 py-2 text-sm">
                  <span className="flex-1 text-slate-700">{CLOSING_RATING.text}</span>
                  <RatingChip value={s.answers[CLOSING_RATING.id] ?? 0} />
                </li>
              </ul>
            </div>

            {/* Closing text answers */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Penutup · Pertanyaan Terbuka
              </h3>
              <div className="mt-2 space-y-3">
                {CLOSING_TEXT.map((q) => {
                  const v = s.textAnswers[q.id];
                  return (
                    <div
                      key={q.id}
                      className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2"
                    >
                      <p className="text-xs font-medium text-slate-500">{q.text}</p>
                      <p className="mt-1 whitespace-pre-line text-sm text-slate-800">
                        {v ?? "—"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
