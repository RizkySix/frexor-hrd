"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EditAnalysisModal } from "./edit-analysis-modal";

type QualitativeData = {
  company_strengths?: unknown;
  top_improvement_areas?: unknown;
  actionable_suggestions?: unknown;
  retention_sentiment?: unknown;
  retention_summary?: unknown;
} | null;

type AnalysisResult = {
  id: string;
  periodLabel: string;
  analysisPayload: AnalysisPayload | null;
  qualitativeData: QualitativeData;
  sectionAnalyses: unknown;
  summaryText: string | null;
  overallAvg: string;
  totalRespondents: number;
  generatedBy: "AI_WEBHOOK" | "MANUAL_HRD";
  generatedAt: string;
  updatedAt: string;
  updatedBy: { name: string; email: string } | null;
};

// Raw payload persis seperti yang dikirim AI — disimpan sebagai audit trail,
// tidak digunakan langsung untuk render (field penting sudah diekstrak
// ke kolom terstruktur: qualitativeData, sectionAnalyses, summaryText, dst).
type AnalysisPayload = Record<string, unknown>;

export default function SurveyDashboardPage() {
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/survey/results", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setResults(data.results);
      setPendingSubmissions(data.pendingSubmissions);
      if (!selectedId && data.results[0]) setSelectedId(data.results[0].id);
    }
    setLoading(false);
  }, [selectedId]);

  useEffect(() => {
    load();
  }, [load]);

  const selected = useMemo(
    () => results.find((r) => r.id === selectedId) ?? null,
    [results, selectedId],
  );

  async function sendAnalysis() {
    if (!window.confirm(`Kirim ${pendingSubmissions} submission ke AI untuk dianalisis?`)) {
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/survey/send-analysis", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setToast(data.error ?? "Gagal mengirim ke AI.");
      } else {
        setToast(
          `${data.totalRespondents} submission untuk periode ${data.periodLabel} sedang diproses oleh AI. Hasil akan otomatis muncul di sini begitu selesai — tidak perlu menunggu di halaman ini.`,
        );
        await load();
      }
    } catch {
      setToast("Gagal mengirim ke AI: network error.");
    } finally {
      setSending(false);
      setTimeout(() => setToast(null), 8000);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Employee Satisfaction Survey
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Hasil analisis kepuasan karyawan dari AI atau editan HRD.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/survey/periods"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Atur Periode
          </Link>
          <Link
            href="/dashboard/survey/submissions"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Raw Submissions
          </Link>
          <button
            onClick={sendAnalysis}
            disabled={sending || pendingSubmissions === 0}
            className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-brand-600 disabled:opacity-50"
          >
            {sending
              ? "Mengirim..."
              : pendingSubmissions === 0
              ? "Tidak ada data baru"
              : `Kirim untuk Analisis (${pendingSubmissions})`}
          </button>
        </div>
      </div>

      {toast && (
        <div className="mt-4 rounded-md bg-brand-50 px-3 py-2 text-sm text-brand-800">
          {toast}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label className="text-sm text-slate-600">Periode analisis:</label>
        <select
          value={selectedId ?? ""}
          onChange={(e) => setSelectedId(e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          {results.map((r) => (
            <option key={r.id} value={r.id}>
              {r.periodLabel} · {new Date(r.generatedAt).toLocaleDateString("id-ID")}
            </option>
          ))}
        </select>
        {selected && (
          <button
            onClick={() => setEditing(true)}
            className="ml-auto rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Edit Analisis
          </button>
        )}
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            Memuat...
          </div>
        ) : !selected ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            Belum ada hasil analisis. Kirim submission ke AI atau tunggu webhook
            mengirim hasilnya.
          </div>
        ) : (
          <ResultView result={selected} />
        )}
      </div>

      {selected && editing && (
        <EditAnalysisModal
          result={selected}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            load();
          }}
        />
      )}
    </>
  );
}

function ResultView({ result }: { result: AnalysisResult }) {
  const overall = toFiniteNumber(result.overallAvg) ?? 0;

  const stringList = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0) : [];

  const strengths = stringList(result.qualitativeData?.company_strengths);
  const improvementAreas = stringList(result.qualitativeData?.top_improvement_areas);
  const suggestions = stringList(result.qualitativeData?.actionable_suggestions);
  const retentionSentiment =
    typeof result.qualitativeData?.retention_sentiment === "string"
      ? result.qualitativeData.retention_sentiment
      : null;
  const retentionSummary =
    typeof result.qualitativeData?.retention_summary === "string"
      ? result.qualitativeData.retention_summary
      : null;
  const hasQualitative =
    strengths.length > 0 ||
    improvementAreas.length > 0 ||
    suggestions.length > 0 ||
    !!retentionSentiment ||
    !!retentionSummary;

  const sectionAnalysisItems: Record<string, unknown>[] = Array.isArray(result.sectionAnalyses)
    ? result.sectionAnalyses.filter(
        (x): x is Record<string, unknown> => !!x && typeof x === "object",
      )
    : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Stat
          label="Overall Score"
          value={overall.toFixed(2)}
          sub="/ 4.00"
          tone={overall >= 3.5 ? "green" : overall < 3 ? "red" : "brand"}
        />
        <Stat label="Total Responden" value={String(result.totalRespondents)} />
        <Stat
          label="Sumber Analisis"
          value={result.generatedBy === "AI_WEBHOOK" ? "AI Webhook" : "Edit Manual"}
        />
      </div>

      {result.generatedBy === "MANUAL_HRD" && result.updatedBy && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Diedit oleh HRD · <strong>{result.updatedBy.name}</strong> ·{" "}
          {new Date(result.updatedAt).toLocaleString("id-ID")}
        </div>
      )}

      {result.summaryText && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Ringkasan
          </h2>
          <p className="mt-2 whitespace-pre-line text-sm text-slate-800">
            {result.summaryText}
          </p>
        </div>
      )}

      {hasQualitative && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card title="Kekuatan Perusahaan">
            {strengths.length > 0 ? (
              <BulletList items={strengths} tone="green" />
            ) : (
              <Empty />
            )}
          </Card>

          <Card title="Area yang Perlu Ditingkatkan">
            {improvementAreas.length > 0 ? (
              <BulletList items={improvementAreas} tone="amber" />
            ) : (
              <Empty />
            )}
          </Card>
        </div>
      )}

      {hasQualitative && (suggestions.length > 0 || retentionSentiment || retentionSummary) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {suggestions.length > 0 && (
            <Card title="Saran yang Bisa Ditindaklanjuti">
              <BulletList items={suggestions} tone="brand" numbered />
            </Card>
          )}

          {(retentionSentiment || retentionSummary) && (
            <Card title="Sentimen Retensi Karyawan">
              {retentionSentiment && <SentimentBadge value={retentionSentiment} />}
              {retentionSummary && (
                <p className="mt-3 text-sm leading-relaxed text-slate-700">
                  {retentionSummary}
                </p>
              )}
            </Card>
          )}
        </div>
      )}

      {sectionAnalysisItems.length > 0 && (
        <Card title="Analisis Naratif per Seksi">
          <div className="space-y-3">
            {sectionAnalysisItems.map((item, i) => (
              <SectionAnalysisCard key={i} item={item} />
            ))}
          </div>
        </Card>
      )}

      <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-4">
        <p className="text-sm text-slate-600">
          Ingin baca jawaban &amp; saran asli per karyawan (anonim)? Lihat detail
          lengkapnya di halaman Raw Submissions.
        </p>
        <Link
          href="/dashboard/survey/submissions"
          className="shrink-0 rounded-md bg-white border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-100"
        >
          Buka Raw Submissions →
        </Link>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  tone = "brand",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "brand" | "green" | "red";
}) {
  const colors = {
    brand: "text-brand-700",
    green: "text-emerald-700",
    red: "text-rose-700",
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`mt-1 flex items-baseline gap-1 text-2xl font-semibold tabular-nums ${colors[tone]}`}>
        {value}
        {sub && <span className="text-sm text-slate-400">{sub}</span>}
      </div>
    </div>
  );
}

function toFiniteNumber(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function ScoreBadge({
  value,
  highlight,
}: {
  value: unknown;
  highlight?: "green" | "red";
}) {
  const num = toFiniteNumber(value);
  const forced = highlight === "green" ? "bg-emerald-100 text-emerald-700" : highlight === "red" ? "bg-rose-100 text-rose-700" : null;
  const cls =
    num === null
      ? "bg-slate-100 text-slate-400"
      : forced ??
        (num >= 3.5
          ? "bg-emerald-100 text-emerald-700"
          : num < 3
          ? "bg-rose-100 text-rose-700"
          : "bg-slate-100 text-slate-700");
  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${cls}`}
    >
      {num === null ? "–" : num.toFixed(2)}
    </span>
  );
}

function Empty() {
  return <p className="text-sm text-slate-400">— belum ada data —</p>;
}

function BulletList({
  items,
  tone = "brand",
  numbered = false,
}: {
  items: string[];
  tone?: "brand" | "green" | "amber";
  numbered?: boolean;
}) {
  const dotCls = {
    brand: "bg-brand-500",
    green: "bg-emerald-500",
    amber: "bg-amber-500",
  }[tone];
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
          {numbered ? (
            <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700">
              {i + 1}
            </span>
          ) : (
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dotCls}`} />
          )}
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SentimentBadge({ value }: { value: string }) {
  const v = value.toLowerCase();
  const isPositive = /positi|baik|tinggi|good|high/.test(v);
  const isNegative = /negati|buruk|rendah|bad|low|risk/.test(v);
  const cls = isPositive
    ? "bg-emerald-100 text-emerald-700"
    : isNegative
    ? "bg-rose-100 text-rose-700"
    : "bg-amber-100 text-amber-700";
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${cls}`}>
      {value}
    </span>
  );
}

function pickString(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return null;
}

function pickNumber(obj: Record<string, unknown>, keys: string[]): number | null {
  for (const k of keys) {
    const n = toFiniteNumber(obj[k]);
    if (n !== null) return n;
  }
  return null;
}

function humanizeKey(key: string): string {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const SECTION_ANALYSIS_KNOWN_KEYS = [
  "section_id",
  "section_title",
  "title",
  "section",
  "name",
  "avg",
  "score",
  "average",
  "summary",
  "analysis",
  "insight",
  "description",
];

function SectionAnalysisCard({ item }: { item: Record<string, unknown> }) {
  const title =
    pickString(item, ["section_title", "title", "section", "name"]) ?? "Seksi";
  const score = pickNumber(item, ["avg", "score", "average"]);
  const summary = pickString(item, ["summary", "analysis", "insight", "description"]);
  const otherEntries = Object.entries(item).filter(
    ([k, v]) =>
      !SECTION_ANALYSIS_KNOWN_KEYS.includes(k) &&
      v !== null &&
      v !== undefined &&
      v !== "",
  );

  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 p-3.5">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
        {score !== null && <ScoreBadge value={score} />}
      </div>
      {summary && (
        <p className="mt-2 text-sm leading-relaxed text-slate-700">{summary}</p>
      )}
      {otherEntries.length > 0 && (
        <dl className="mt-2 space-y-1 border-t border-slate-200 pt-2 text-xs">
          {otherEntries.map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <dt className="shrink-0 font-medium text-slate-500">{humanizeKey(k)}:</dt>
              <dd className="text-slate-700">
                {Array.isArray(v) ? v.join(", ") : String(v)}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
