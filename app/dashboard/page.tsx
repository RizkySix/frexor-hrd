"use client";

import { useCallback, useEffect, useState } from "react";
import { CandidateTable } from "@/components/CandidateTable";
import { CreateCandidateModal } from "@/components/CreateCandidateModal";

type Candidate = {
  id: string;
  name: string;
  position: string;
  token: string;
  createdAt: string;
  expiresAt: string;
  submittedAt: string | null;
  scoreV: number | null;
  scoreA: number | null;
  scoreK: number | null;
  dominantStyle: string | null;
};

export default function DashboardPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/dashboard", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setCandidates(data.candidates);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const total = candidates.length;
  const sudah = candidates.filter((c) => c.submittedAt).length;
  const belum = candidates.filter(
    (c) => !c.submittedAt && Date.now() <= new Date(c.expiresAt).getTime(),
  ).length;
  const expired = candidates.filter(
    (c) => !c.submittedAt && Date.now() > new Date(c.expiresAt).getTime(),
  ).length;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard Kandidat</h1>
          <p className="mt-1 text-sm text-slate-600">
            Kelola tes VAK untuk seluruh kandidat.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-brand-600"
        >
          + Buat Link Baru
        </button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total" value={total} />
        <Stat label="Sudah Mengisi" value={sudah} tone="emerald" />
        <Stat label="Belum Mengisi" value={belum} tone="amber" />
        <Stat label="Expired" value={expired} tone="slate" />
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            Memuat...
          </div>
        ) : (
          <CandidateTable candidates={candidates} />
        )}
      </div>

      <CreateCandidateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => load()}
      />
    </>
  );
}

function Stat({
  label,
  value,
  tone = "brand",
}: {
  label: string;
  value: number;
  tone?: "brand" | "emerald" | "amber" | "slate";
}) {
  const colors = {
    brand: "text-brand-700",
    emerald: "text-emerald-700",
    amber: "text-amber-700",
    slate: "text-slate-600",
  };
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${colors[tone]}`}>{value}</div>
    </div>
  );
}
