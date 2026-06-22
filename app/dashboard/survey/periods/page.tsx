"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Period = {
  id: string;
  label: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  createdAt: string;
  submissionCount: number;
};

type FormDraft = {
  label: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};

const EMPTY: FormDraft = { label: "", startsAt: "", endsAt: "", isActive: true };

function toLocalDateTimeInput(iso: string): string {
  // Convert ISO timestamp ke format yyyy-MM-ddTHH:mm untuk datetime-local input
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function statusOf(p: Period): { text: string; cls: string; dot: string } {
  const now = Date.now();
  const starts = new Date(p.startsAt).getTime();
  const ends = new Date(p.endsAt).getTime();
  if (!p.isActive) {
    return { text: "Nonaktif", cls: "bg-slate-100 text-slate-600", dot: "bg-slate-400" };
  }
  if (now < starts) {
    return { text: "Akan Datang", cls: "bg-sky-100 text-sky-700", dot: "bg-sky-500" };
  }
  if (now > ends) {
    return { text: "Selesai", cls: "bg-slate-100 text-slate-600", dot: "bg-slate-400" };
  }
  return { text: "Aktif", cls: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" };
}

function formatDateRange(start: string, end: string) {
  const fmt = (s: string) =>
    new Date(s).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Makassar",
    });
  return `${fmt(start)} → ${fmt(end)} WITA`;
}

export default function SurveyPeriodsPage() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState<null | { mode: "create" | "edit"; id?: string }>(
    null,
  );
  const [draft, setDraft] = useState<FormDraft>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/survey/periods", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setPeriods(data.periods);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function startCreate() {
    setDraft(EMPTY);
    setError(null);
    setOpenModal({ mode: "create" });
  }

  function startEdit(p: Period) {
    setDraft({
      label: p.label,
      startsAt: toLocalDateTimeInput(p.startsAt),
      endsAt: toLocalDateTimeInput(p.endsAt),
      isActive: p.isActive,
    });
    setError(null);
    setOpenModal({ mode: "edit", id: p.id });
  }

  async function save() {
    setError(null);
    if (!draft.label.trim() || !draft.startsAt || !draft.endsAt) {
      setError("Label, tanggal mulai, dan tanggal selesai wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      const url =
        openModal?.mode === "edit"
          ? `/api/survey/periods/${openModal.id}`
          : "/api/survey/periods";
      const method = openModal?.mode === "edit" ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: draft.label.trim(),
          startsAt: new Date(draft.startsAt).toISOString(),
          endsAt: new Date(draft.endsAt).toISOString(),
          isActive: draft.isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal menyimpan.");
        setSaving(false);
        return;
      }
      setOpenModal(null);
      await load();
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(p: Period) {
    const res = await fetch(`/api/survey/periods/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    if (res.ok) load();
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/dashboard/survey"
            className="text-sm text-brand-600 hover:underline"
          >
            ← Kembali ke Analisis Survey
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            Periode Survey
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Atur kapan karyawan bisa mengakses form survey. Di luar periode aktif,
            link <code>/survey</code> akan menampilkan pesan &ldquo;ditutup&rdquo;.
          </p>
        </div>
        <button
          onClick={startCreate}
          className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-brand-600"
        >
          + Buat Periode Baru
        </button>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            Memuat...
          </div>
        ) : periods.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            Belum ada periode. Buat periode pertama untuk membuka form survey.
          </div>
        ) : (
          <div className="space-y-3">
            {periods.map((p) => {
              const st = statusOf(p);
              return (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{p.label}</h3>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${st.cls}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                        {st.text}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                        {p.submissionCount} submission
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDateRange(p.startsAt, p.endsAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleActive(p)}
                      className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      {p.isActive ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                    <button
                      onClick={() => startEdit(p)}
                      className="rounded-md bg-brand-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-600"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold">
              {openModal.mode === "edit" ? "Edit Periode" : "Buat Periode Baru"}
            </h2>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Label Periode *
                </label>
                <input
                  value={draft.label}
                  onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                  placeholder="Juni 2026"
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Mulai *
                </label>
                <input
                  type="datetime-local"
                  value={draft.startsAt}
                  onChange={(e) => setDraft({ ...draft, startsAt: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Selesai *
                </label>
                <input
                  type="datetime-local"
                  value={draft.endsAt}
                  onChange={(e) => setDraft({ ...draft, endsAt: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.isActive}
                  onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
                  className="h-4 w-4 accent-brand-500"
                />
                <span>Aktifkan periode ini</span>
              </label>

              {error && (
                <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </p>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setOpenModal(null)}
                disabled={saving}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
