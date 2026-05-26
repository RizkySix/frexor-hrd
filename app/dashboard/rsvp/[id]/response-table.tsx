"use client";

import { useMemo, useState } from "react";
import { formatSubmittedAt, STATUS_LABEL, type RSVPStatus } from "@/lib/rsvp-utils";

type Response = {
  id: string;
  name: string;
  dropdownValue: string | null;
  status: RSVPStatus;
  reason: string | null;
  submittedAt: string;
};

type Filter = "all" | "HADIR" | "TIDAK_HADIR";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "HADIR", label: "Hadir" },
  { key: "TIDAK_HADIR", label: "Tidak Hadir" },
];

export function RSVPResponseTable({
  responses,
  dropdownLabel,
}: {
  responses: Response[];
  dropdownLabel: string | null;
}) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return responses;
    return responses.filter((r) => r.status === filter);
  }, [responses, filter]);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-1 border-b border-slate-200 bg-slate-50 px-3 py-2">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          const count =
            f.key === "all"
              ? responses.length
              : responses.filter((r) => r.status === f.key).length;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                active
                  ? "bg-white text-brand-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {f.label} <span className="ml-1 text-slate-400">({count})</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="p-10 text-center text-sm text-slate-500">
          Belum ada responden{filter !== "all" ? " dengan filter ini" : ""}.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-white text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Nama</th>
                {dropdownLabel && <th className="px-4 py-3">{dropdownLabel}</th>}
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Alasan</th>
                <th className="px-4 py-3">Waktu Submit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => {
                const label = STATUS_LABEL[r.status];
                return (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{r.name}</td>
                    {dropdownLabel && (
                      <td className="px-4 py-3 text-slate-700">
                        {r.dropdownValue ?? <span className="text-slate-400">—</span>}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${label.cls}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${label.dot}`} />
                        {label.text}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {r.reason ?? <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatSubmittedAt(r.submittedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
