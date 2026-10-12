"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatSubmittedAt } from "@/lib/rsvp-utils";
import { normalizePhone } from "@/lib/driver-size-utils";
import type { InterviewRecord } from "@/lib/interview-utils";
import { InterviewDetailModal } from "./interview-detail-modal";

const PUBLIC_FORM_URL = "https://talent.balisuntours.com/interview";

export default function InterviewPage() {
  const [submissions, setSubmissions] = useState<InterviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [detail, setDetail] = useState<InterviewRecord | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/interview", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setSubmissions(data.submissions);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return submissions;
    return submissions.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.appliedPosition.toLowerCase().includes(q) ||
        s.nik.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q),
    );
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
    if (
      !window.confirm(
        `Hapus data interview untuk "${name}"? Tindakan ini tidak bisa dibatalkan.`,
      )
    ) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/interview/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (detail?.id === id) setDetail(null);
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
          <h1 className="text-2xl font-semibold text-slate-900">Form Interview</h1>
          <p className="mt-1 text-sm text-slate-600">
            Data interview pelamar kerja yang dikumpulkan untuk keperluan
            rekrutmen HRD. Tinjau, kelola, dan ekspor dari sini.
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
            href="/api/interview/export"
            className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-brand-600"
          >
            Export Excel
          </a>
        </div>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        Bagikan link berikut ke pelamar, misalnya lewat WhatsApp:{" "}
        <span className="font-medium text-slate-700">{PUBLIC_FORM_URL}</span>
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="shrink-0 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          Total Pelamar:{" "}
          <span className="font-semibold text-brand-700">
            {submissions.length}
          </span>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari nama, posisi, NIK, atau nomor HP..."
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
            Belum ada pelamar yang mengisi form interview.
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            Tidak ada hasil untuk pencarian ini.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-white text-left text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Nama</th>
                    <th className="px-4 py-3">Posisi Dilamar</th>
                    <th className="px-4 py-3">No. HP</th>
                    <th className="px-4 py-3">NIK</th>
                    <th className="px-4 py-3">Terakhir Diperbarui</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {s.fullName}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {s.appliedPosition}
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
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">
                        {s.nik}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatSubmittedAt(s.updatedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setDetail(s)}
                            className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            Lihat Detail
                          </button>
                          <button
                            onClick={() => handleDelete(s.id, s.fullName)}
                            disabled={deletingId === s.id}
                            className="rounded-md border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                          >
                            {deletingId === s.id ? "Menghapus..." : "Hapus"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {detail && (
        <InterviewDetailModal
          submission={detail}
          onClose={() => setDetail(null)}
        />
      )}
    </>
  );
}
