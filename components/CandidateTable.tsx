"use client";

import Link from "next/link";
import { useState } from "react";

type Candidate = {
  id: string;
  name: string;
  position: string;
  token: string;
  createdAt: string;
  expiresAt: string;
  submittedAt: string | null;
  dominantStyle: string | null;
};

type Status = "submitted" | "open" | "expired";

function statusOf(c: Candidate): Status {
  if (c.submittedAt) return "submitted";
  if (Date.now() > new Date(c.expiresAt).getTime()) return "expired";
  return "open";
}

const STATUS_LABEL: Record<Status, { text: string; cls: string; dot: string }> = {
  submitted: {
    text: "Sudah Mengisi",
    cls: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
  },
  open: {
    text: "Belum Mengisi",
    cls: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
  },
  expired: { text: "Expired", cls: "bg-slate-200 text-slate-600", dot: "bg-slate-400" },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function CandidateTable({ candidates }: { candidates: Candidate[] }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copyLink(token: string, id: string) {
    const url = `${window.location.origin}/tes/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1500);
    } catch {
      window.prompt("Salin link ini:", url);
    }
  }

  if (candidates.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
        Belum ada kandidat. Klik <strong>Buat Link Baru</strong> untuk memulai.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Posisi</th>
              <th className="px-4 py-3">Tanggal Buat</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Dominant Style</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {candidates.map((c) => {
              const status = statusOf(c);
              const label = STATUS_LABEL[status];
              return (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                  <td className="px-4 py-3 text-slate-700">{c.position}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(c.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${label.cls}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${label.dot}`} />
                      {label.text}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {c.dominantStyle ?? <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {status === "open" && (
                        <button
                          onClick={() => copyLink(c.token, c.id)}
                          className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                        >
                          {copiedId === c.id ? "Tersalin!" : "Salin Link"}
                        </button>
                      )}
                      <Link
                        href={`/dashboard/kandidat/${c.id}`}
                        className="rounded-md bg-brand-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-600"
                      >
                        Detail
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
