"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatSubmittedAt } from "@/lib/rsvp-utils";
import {
  GENDER_OPTIONS,
  SHIRT_SIZES,
  SHIRT_SIZE_LABELS,
  normalizePhone,
  type DriverGender,
  type ShirtSize,
} from "@/lib/driver-size-utils";

const PUBLIC_FORM_URL = "https://talent.balisuntours.com/driver-sizes";

const GENDER_LABEL_MAP: Record<DriverGender, string> = Object.fromEntries(
  GENDER_OPTIONS.map((g) => [g.value, g.label]),
) as Record<DriverGender, string>;

type Submission = {
  id: string;
  name: string;
  phone: string;
  gender: DriverGender;
  size: ShirtSize;
  submittedAt: string;
  updatedAt: string;
};

type Summary = { total: number } & Record<ShirtSize, number>;

export default function DriverSizesPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/driver-sizes", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setSubmissions(data.submissions);
      setSummary(data.summary);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return submissions;
    return submissions.filter((s) => s.name.toLowerCase().includes(q));
  }, [submissions, query]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(PUBLIC_FORM_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Salin link ini:", PUBLIC_FORM_URL);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Hapus data ukuran baju untuk "${name}"?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/driver-sizes/${id}`, { method: "DELETE" });
      if (res.ok) {
        await load();
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Ukuran Baju Driver
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Data ukuran baju yang dikumpulkan dari driver, dipakai HRD untuk
            memesan seragam secara massal.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={copyLink}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            {copied ? "Link disalin!" : "Salin Link"}
          </button>
          <a
            href="/api/driver-sizes/export"
            className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-brand-600"
          >
            Export CSV
          </a>
        </div>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        Bagikan link berikut ke driver, misalnya lewat WhatsApp:{" "}
        <span className="font-medium text-slate-700">{PUBLIC_FORM_URL}</span>
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <Stat label="Total Driver" value={summary?.total ?? 0} highlight />
        {SHIRT_SIZES.map((size) => (
          <Stat
            key={size}
            label={SHIRT_SIZE_LABELS[size]}
            value={summary?.[size] ?? 0}
          />
        ))}
      </div>

      <div className="mt-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari nama driver..."
          className="w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            Memuat...
          </div>
        ) : submissions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            Belum ada driver yang mengisi data ukuran baju.
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            Tidak ada driver dengan nama &ldquo;{query}&rdquo;.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-white text-left text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Nama</th>
                    <th className="px-4 py-3">No. WhatsApp</th>
                    <th className="px-4 py-3">Jenis Kelamin</th>
                    <th className="px-4 py-3">Ukuran</th>
                    <th className="px-4 py-3">Terakhir Diperbarui</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {s.name}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <a
                          href={`https://wa.me/${normalizePhone(s.phone)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-600 hover:underline"
                        >
                          {s.phone}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {GENDER_LABEL_MAP[s.gender]}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                          {SHIRT_SIZE_LABELS[s.size]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatSubmittedAt(s.updatedAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDelete(s.id, s.name)}
                          disabled={deletingId === s.id}
                          className="rounded-md border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                        >
                          {deletingId === s.id ? "Menghapus..." : "Hapus"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 shadow-sm ${
        highlight ? "border-brand-200 bg-brand-50" : "border-slate-200 bg-white"
      }`}
    >
      <div
        className={`text-xs uppercase tracking-wider ${
          highlight ? "text-brand-700" : "text-slate-500"
        }`}
      >
        {label}
      </div>
      <div
        className={`mt-1 text-2xl font-semibold tabular-nums ${
          highlight ? "text-brand-700" : "text-slate-900"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
