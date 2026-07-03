import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AutoPrint, PrintButton } from "./auto-print";

export const metadata: Metadata = {
  title: "Laporan Analisis Survey Kepuasan Karyawan — Bali Sun Tours",
  robots: { index: false, follow: false },
};

// ─── helpers ────────────────────────────────────────────────────────────────

function toNum(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function stringList(v: unknown): string[] {
  return Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    : [];
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
    const n = toNum(obj[k]);
    if (n !== null) return n;
  }
  return null;
}

// Diformat manual (bukan Intl/toLocaleString) karena hasil Intl untuk locale
// "id-ID" bisa berbeda karakter spasi antara Node (server) dan browser
// (client), yang memicu React hydration mismatch meski teksnya terlihat sama.
const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const WITA_OFFSET_MS = 8 * 60 * 60 * 1000;

function fmtDate(iso: string | Date, withTime = true) {
  const utcMs = new Date(iso).getTime() + WITA_OFFSET_MS;
  const d = new Date(utcMs);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = MONTHS_ID[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  let out = `${day} ${month} ${year}`;
  if (withTime) {
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");
    out += `, ${hh}.${mm} WITA`;
  }
  return out;
}

const KNOWN_SA_KEYS = [
  "section_id", "section_title", "title", "section", "name",
  "avg", "score", "average",
  "summary", "analysis", "insight", "description",
];

// ─── page ────────────────────────────────────────────────────────────────────

export default async function PrintSurveyPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const result = await prisma.surveyAnalysisResult.findUnique({
    where: { id: params.id },
    include: { updatedBy: { select: { name: true, email: true } } },
  });

  if (!result) redirect("/dashboard/survey");

  const overall = toNum(result.overallAvg) ?? 0;
  const qd = result.qualitativeData as Record<string, unknown> | null;
  const strengths = stringList(qd?.company_strengths);
  const improvements = stringList(qd?.top_improvement_areas);
  const suggestions = stringList(qd?.actionable_suggestions);
  const retSentiment =
    typeof qd?.retention_sentiment === "string" ? qd.retention_sentiment : null;
  const retSummary =
    typeof qd?.retention_summary === "string" ? qd.retention_summary : null;

  const rawSections = result.sectionAnalyses;
  const sectionAnalyses: Record<string, unknown>[] = Array.isArray(rawSections)
    ? (rawSections as unknown[]).filter(
        (x): x is Record<string, unknown> =>
          !!x && typeof x === "object" && !Array.isArray(x),
      )
    : [];

  const scoreColor =
    overall >= 3.5 ? "#059669" : overall < 3 ? "#dc2626" : "#3b6ef0";

  const sentimentCls = (v: string) => {
    const lower = v.toLowerCase();
    if (/positi|baik|tinggi|good|high/.test(lower)) return "badge-green";
    if (/negati|buruk|rendah|bad|low|risk/.test(lower)) return "badge-red";
    return "badge-amber";
  };

  const printDate = fmtDate(new Date());

  return (
    <>
      {/* Auto-trigger print after render */}
      <AutoPrint />

      {/* ─── print-specific global styles ─────────────────────────────── */}
      <style>{`
        @page {
          size: A4;
          margin: 18mm 16mm 20mm 16mm;
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
          font-size: 10.5pt;
          color: #1e293b;
          background: #f1f5f9;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        @media print {
          body { background: white; }
          .no-print { display: none !important; }
          .content-wrap { padding: 0; max-width: 100%; }
          /* Sembunyikan overlay debug Next.js dev mode (badge "N error"
             di pojok kiri bawah) agar tidak ikut tercetak di PDF. */
          nextjs-portal { display: none !important; }
        }

        /* ─── screen action bar ─── */
        .action-bar {
          position: fixed; top: 0; left: 0; right: 0;
          background: #0f172a;
          padding: 10px 24px;
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          z-index: 999;
          box-shadow: 0 2px 8px rgba(0,0,0,.35);
        }
        .action-bar-info { font-size: 12.5px; color: #94a3b8; }
        .action-bar-info strong { color: #e2e8f0; }
        .action-btns { display: flex; align-items: center; gap: 8px; }
        .btn-back {
          display: inline-flex; align-items: center; gap: 4px;
          background: transparent; color: #94a3b8;
          border: 1px solid #334155;
          padding: 7px 14px; border-radius: 6px;
          font-size: 12.5px; cursor: pointer; text-decoration: none;
          transition: color .15s, border-color .15s;
        }
        .btn-back:hover { color: #f1f5f9; border-color: #64748b; }

        /* ─── content container ─── */
        .content-wrap {
          max-width: 760px;
          margin: 0 auto;
          padding: 80px 28px 48px;
          background: white;
          min-height: 100vh;
        }

        /* ─── report header ─── */
        .rpt-header {
          border-bottom: 3px solid #3b6ef0;
          padding-bottom: 14px;
          margin-bottom: 20px;
        }
        .rpt-brand {
          font-size: 9pt; font-weight: 800;
          letter-spacing: .16em; text-transform: uppercase;
          color: #3b6ef0;
        }
        .rpt-title {
          font-size: 15pt; font-weight: 700;
          color: #1e293b; margin-top: 5px;
        }
        .rpt-period {
          font-size: 10pt; color: #64748b; margin-top: 3px;
        }
        .rpt-meta {
          display: flex; flex-wrap: wrap; gap: 6px 18px;
          margin-top: 10px; font-size: 8.5pt; color: #94a3b8;
        }
        .rpt-meta span { display: flex; align-items: center; gap: 4px; }

        /* ─── stats row ─── */
        .stats-row {
          display: flex; gap: 12px; margin-bottom: 20px;
        }
        .stat-box {
          flex: 1;
          border: 1px solid #e2e8f0; border-radius: 8px;
          padding: 10px 14px; background: #f8fafc;
        }
        .stat-label {
          font-size: 7.5pt; text-transform: uppercase;
          letter-spacing: .08em; color: #64748b; font-weight: 600;
        }
        .stat-val {
          font-size: 20pt; font-weight: 700; line-height: 1.15;
          margin-top: 3px;
        }
        .stat-sub { font-size: 9pt; color: #94a3b8; }

        /* ─── section card ─── */
        .section-card {
          border: 1px solid #e2e8f0; border-radius: 8px;
          padding: 14px 16px; margin-bottom: 14px;
          page-break-inside: avoid;
          background: white;
        }
        .section-head {
          font-size: 8pt; font-weight: 700;
          text-transform: uppercase; letter-spacing: .09em;
          color: #64748b; margin-bottom: 10px;
          padding-bottom: 7px; border-bottom: 1px solid #f1f5f9;
        }

        /* ─── summary ─── */
        .summary-text {
          font-size: 10pt; line-height: 1.75;
          color: #334155; white-space: pre-line;
        }

        /* ─── two-col ─── */
        .two-col { display: flex; gap: 14px; margin-bottom: 14px; }
        .two-col > .section-card { flex: 1; margin-bottom: 0; }

        /* ─── bullet list ─── */
        .bullet-list { list-style: none; }
        .bullet-list li {
          display: flex; align-items: flex-start; gap: 8px;
          margin-bottom: 7px; font-size: 9.5pt;
          line-height: 1.6; color: #334155;
        }
        .b-dot {
          width: 6px; height: 6px; border-radius: 50%;
          flex-shrink: 0; margin-top: 5px;
        }
        .b-green { background: #10b981; }
        .b-amber { background: #f59e0b; }
        .b-blue  { background: #3b6ef0; }
        .num-badge {
          min-width: 18px; height: 18px; border-radius: 50%;
          background: #dde9ff; color: #3b6ef0;
          font-size: 7.5pt; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; margin-top: 2px;
        }

        /* ─── sentiment badge ─── */
        .badge-base {
          display: inline-flex; align-items: center;
          border-radius: 20px; padding: 3px 12px;
          font-size: 9pt; font-weight: 700; text-transform: capitalize;
        }
        .badge-green { background: #d1fae5; color: #065f46; }
        .badge-red   { background: #fee2e2; color: #991b1b; }
        .badge-amber { background: #fef3c7; color: #92400e; }
        .retention-text {
          font-size: 9.5pt; line-height: 1.7; color: #334155; margin-top: 8px;
        }

        /* ─── section analysis item ─── */
        .sa-item {
          border: 1px solid #f1f5f9; border-radius: 6px;
          padding: 10px 12px; margin-bottom: 9px;
          background: #f8fafc; page-break-inside: avoid;
        }
        .sa-head {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 5px;
        }
        .sa-title { font-size: 10pt; font-weight: 700; color: #1e293b; }
        .score-pill {
          font-size: 8pt; font-weight: 700;
          padding: 2px 9px; border-radius: 12px;
        }
        .sp-green { background: #d1fae5; color: #065f46; }
        .sp-red   { background: #fee2e2; color: #991b1b; }
        .sp-gray  { background: #f1f5f9; color: #475569; }
        .sa-summary { font-size: 9pt; line-height: 1.65; color: #475569; }
        .sa-extra {
          margin-top: 7px; padding-top: 7px;
          border-top: 1px solid #e2e8f0;
          font-size: 8.5pt; color: #64748b;
        }
        .sa-extra-row { display: flex; gap: 6px; margin-bottom: 3px; }
        .sa-extra-key { font-weight: 600; flex-shrink: 0; color: #475569; }

        /* ─── edit notice ─── */
        .edit-notice {
          border: 1px solid #fde68a; background: #fffbeb;
          border-radius: 6px; padding: 8px 12px;
          font-size: 8.5pt; color: #92400e; margin-bottom: 14px;
        }

        /* ─── footer ─── */
        .rpt-footer {
          margin-top: 30px; padding-top: 12px;
          border-top: 1px solid #e2e8f0;
          font-size: 8pt; color: #94a3b8;
          display: flex; flex-wrap: wrap;
          justify-content: space-between; align-items: flex-end; gap: 6px;
        }
        .rpt-footer-left { line-height: 1.6; }
        .rpt-footer-right { text-align: right; line-height: 1.6; }
        .confidential {
          display: inline-block; margin-top: 3px;
          background: #f1f5f9; color: #64748b;
          border-radius: 4px; padding: 1px 7px;
          font-size: 7.5pt; font-weight: 700;
          letter-spacing: .06em; text-transform: uppercase;
        }
      `}</style>

      {/* ─── Screen-only action bar ───────────────────────────────────── */}
      <div className="action-bar no-print">
        <div className="action-bar-info">
          Pratinjau PDF · <strong>Laporan: {result.periodLabel}</strong>
        </div>
        <div className="action-btns">
          <a href="/dashboard/survey" className="btn-back">← Kembali</a>
          <PrintButton />
        </div>
      </div>

      {/* ─── Print content ────────────────────────────────────────────── */}
      <div className="content-wrap">

        {/* Header */}
        <div className="rpt-header">
          <div className="rpt-brand">Bali Sun Tours</div>
          <div className="rpt-title">Laporan Analisis Survey Kepuasan Karyawan</div>
          <div className="rpt-period">Periode: {result.periodLabel}</div>
          <div className="rpt-meta">
            <span>Dihasilkan: {fmtDate(result.generatedAt)}</span>
            <span>·</span>
            <span>
              Sumber:{" "}
              {result.generatedBy === "AI_WEBHOOK" ? "AI Analisis Otomatis" : "Edit Manual HRD"}
            </span>
            {result.updatedBy && (
              <>
                <span>·</span>
                <span>Diedit oleh: {result.updatedBy.name}</span>
              </>
            )}
          </div>
        </div>

        {/* Edit notice */}
        {result.generatedBy === "MANUAL_HRD" && result.updatedBy && (
          <div className="edit-notice">
            ⚠ Analisis ini telah dimodifikasi secara manual oleh HRD —{" "}
            <strong>{result.updatedBy.name}</strong> ({result.updatedBy.email}) pada{" "}
            {fmtDate(result.updatedAt)}.
          </div>
        )}

        {/* Stats row */}
        <div className="stats-row">
          <div className="stat-box">
            <div className="stat-label">Overall Score</div>
            <div className="stat-val" style={{ color: scoreColor }}>
              {overall.toFixed(2)}{" "}
              <span className="stat-sub">/ 4.00</span>
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Total Responden</div>
            <div className="stat-val" style={{ color: "#1e293b" }}>
              {result.totalRespondents}
              <span className="stat-sub"> karyawan</span>
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Skala Penilaian</div>
            <div className="stat-val" style={{ color: "#64748b", fontSize: "13pt" }}>
              1 – 4
            </div>
            <div className="stat-sub">1 = Sangat Tidak Puas · 4 = Sangat Puas</div>
          </div>
        </div>

        {/* Summary */}
        {result.summaryText && (
          <div className="section-card">
            <div className="section-head">Ringkasan Eksekutif</div>
            <p className="summary-text">{result.summaryText}</p>
          </div>
        )}

        {/* Kekuatan + Area Perbaikan */}
        {(strengths.length > 0 || improvements.length > 0) && (
          <div className="two-col">
            {strengths.length > 0 && (
              <div className="section-card">
                <div className="section-head">Kekuatan Perusahaan</div>
                <ul className="bullet-list">
                  {strengths.map((s, i) => (
                    <li key={i}>
                      <span className="b-dot b-green" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {improvements.length > 0 && (
              <div className="section-card">
                <div className="section-head">Area yang Perlu Ditingkatkan</div>
                <ul className="bullet-list">
                  {improvements.map((s, i) => (
                    <li key={i}>
                      <span className="b-dot b-amber" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Saran */}
        {suggestions.length > 0 && (
          <div className="section-card">
            <div className="section-head">Saran yang Bisa Ditindaklanjuti</div>
            <ul className="bullet-list">
              {suggestions.map((s, i) => (
                <li key={i}>
                  <span className="num-badge">{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Retensi */}
        {(retSentiment || retSummary) && (
          <div className="section-card">
            <div className="section-head">Sentimen Retensi Karyawan</div>
            {retSentiment && (
              <span className={`badge-base ${sentimentCls(retSentiment)}`}>
                {retSentiment}
              </span>
            )}
            {retSummary && <p className="retention-text">{retSummary}</p>}
          </div>
        )}

        {/* Section analyses */}
        {sectionAnalyses.length > 0 && (
          <div className="section-card">
            <div className="section-head">Analisis Naratif per Seksi</div>
            {sectionAnalyses.map((item, i) => {
              const title =
                pickString(item, ["section_title", "title", "section", "name"]) ??
                `Seksi ${i + 1}`;
              const score = pickNumber(item, ["avg", "score", "average"]);
              const summary = pickString(item, ["summary", "analysis", "insight", "description"]);
              const extraEntries = Object.entries(item).filter(
                ([k, v]) =>
                  !KNOWN_SA_KEYS.includes(k) &&
                  v !== null && v !== undefined && v !== "",
              );
              const scoreCls =
                score === null
                  ? "sp-gray"
                  : score >= 3.5
                  ? "sp-green"
                  : score < 3
                  ? "sp-red"
                  : "sp-gray";
              return (
                <div className="sa-item" key={i}>
                  <div className="sa-head">
                    <span className="sa-title">{title}</span>
                    {score !== null && (
                      <span className={`score-pill ${scoreCls}`}>
                        {score.toFixed(2)} / 4.00
                      </span>
                    )}
                  </div>
                  {summary && <p className="sa-summary">{summary}</p>}
                  {extraEntries.length > 0 && (
                    <div className="sa-extra">
                      {extraEntries.map(([k, v]) => (
                        <div className="sa-extra-row" key={k}>
                          <span className="sa-extra-key">
                            {k.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}:
                          </span>
                          <span>
                            {Array.isArray(v) ? v.join(", ") : String(v)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="rpt-footer">
          <div className="rpt-footer-left">
            Dokumen ini dihasilkan otomatis oleh sistem Talent Portal Bali Sun Tours.
            <br />
            Dicetak pada: {printDate}
            <div className="confidential">Rahasia</div>
          </div>
          <div className="rpt-footer-right">
            talent.balisuntours.com
            <br />
            HR Division · Bali Sun Tours
          </div>
        </div>

      </div>
    </>
  );
}
