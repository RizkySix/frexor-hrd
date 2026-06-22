"use client";

import { useState } from "react";

type QualitativeData = {
  company_strengths?: unknown;
  top_improvement_areas?: unknown;
  actionable_suggestions?: unknown;
  retention_sentiment?: unknown;
  retention_summary?: unknown;
} | null;

type Props = {
  result: {
    id: string;
    summaryText: string | null;
    qualitativeData: QualitativeData;
  };
  onClose: () => void;
  onSaved: () => void;
};

function stringList(v: unknown): string[] {
  return Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    : [];
}

function pickStringField(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export function EditAnalysisModal({ result, onClose, onSaved }: Props) {
  const [summaryText, setSummaryText] = useState(result.summaryText ?? "");

  const [strengths, setStrengths] = useState<string[]>(
    stringList(result.qualitativeData?.company_strengths),
  );
  const [improvementAreas, setImprovementAreas] = useState<string[]>(
    stringList(result.qualitativeData?.top_improvement_areas),
  );
  const [suggestions, setSuggestions] = useState<string[]>(
    stringList(result.qualitativeData?.actionable_suggestions),
  );
  const [retentionSentiment, setRetentionSentiment] = useState(
    pickStringField(result.qualitativeData?.retention_sentiment),
  );
  const [retentionSummary, setRetentionSummary] = useState(
    pickStringField(result.qualitativeData?.retention_summary),
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/survey/results/${result.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summaryText: summaryText.trim() || null,
          qualitativeData: {
            company_strengths: strengths,
            top_improvement_areas: improvementAreas,
            actionable_suggestions: suggestions,
            retention_sentiment: retentionSentiment.trim() || null,
            retention_summary: retentionSummary.trim() || null,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal menyimpan.");
        setSaving(false);
        return;
      }
      onSaved();
    } catch {
      setError("Network error.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold">Edit Analisis</h2>
        <p className="mt-1 text-sm text-slate-600">
          Perubahan akan menandai analisis ini sebagai <strong>Edit Manual</strong>.
          Semua field di bawah opsional — kosongkan yang tidak ingin diisi.
        </p>

        <div className="mt-5 space-y-5">
          <FormSection title="Ringkasan">
            <textarea
              rows={4}
              value={summaryText}
              onChange={(e) => setSummaryText(e.target.value)}
              className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="Ringkasan hasil analisis..."
            />
          </FormSection>

          <FormSection title="Kekuatan Perusahaan">
            <ListEditor
              items={strengths}
              onChange={setStrengths}
              placeholder="Tulis satu poin kekuatan perusahaan..."
            />
          </FormSection>

          <FormSection title="Area yang Perlu Ditingkatkan">
            <ListEditor
              items={improvementAreas}
              onChange={setImprovementAreas}
              placeholder="Tulis satu area yang perlu ditingkatkan..."
            />
          </FormSection>

          <FormSection title="Saran yang Bisa Ditindaklanjuti">
            <ListEditor
              items={suggestions}
              onChange={setSuggestions}
              placeholder="Tulis satu saran yang bisa ditindaklanjuti..."
            />
          </FormSection>

          <FormSection title="Sentimen Retensi Karyawan">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600">
                  Sentimen{" "}
                  <span className="font-normal text-slate-400">
                    (misal: Positif, Netral, Negatif)
                  </span>
                </label>
                <input
                  value={retentionSentiment}
                  onChange={(e) => setRetentionSentiment(e.target.value)}
                  placeholder="Positif"
                  className="mt-1 block w-full max-w-xs rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600">
                  Ringkasan Retensi
                </label>
                <textarea
                  rows={3}
                  value={retentionSummary}
                  onChange={(e) => setRetentionSummary(e.target.value)}
                  placeholder="Ringkasan singkat tentang kemungkinan karyawan bertahan..."
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>
          </FormSection>

          {error && (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

function ListEditor({
  items,
  onChange,
  placeholder,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  function update(i: number, value: string) {
    onChange(items.map((it, idx) => (idx === i ? value : it)));
  }
  function remove(i: number) {
    onChange(items.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([...items, ""]);
  }

  return (
    <div className="space-y-2">
      {items.length === 0 && (
        <p className="text-sm text-slate-400">Belum ada poin. Klik tambah di bawah.</p>
      )}
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
          <textarea
            rows={1}
            value={item}
            onChange={(e) => update(i, e.target.value)}
            placeholder={placeholder}
            className="block w-full resize-y rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="mt-0.5 shrink-0 rounded-md border border-slate-300 px-2 py-1.5 text-xs text-slate-500 hover:bg-slate-100"
            aria-label="Hapus poin"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="mt-1 rounded-md border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-brand-400 hover:text-brand-600"
      >
        + Tambah Poin
      </button>
    </div>
  );
}
