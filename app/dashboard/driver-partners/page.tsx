"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatSubmittedAt } from "@/lib/rsvp-utils";
import type {
  BloodType,
  LastEducation,
  MaritalStatus,
  Religion,
} from "@/lib/driver-partner-utils";
import { normalizePhone, type DriverGender } from "@/lib/driver-size-utils";
import { DriverPartnerDetailModal } from "./driver-partner-detail-modal";

const PUBLIC_FORM_URL = "https://talent.balisuntours.com/driver-partners";

export type DriverPartner = {
  id: string;
  fullName: string;
  birthPlace: string;
  birthDate: string;
  gender: DriverGender;
  bloodType: BloodType;
  address: string;
  religion: Religion;
  maritalStatus: MaritalStatus;
  nik: string;
  kkNumber: string;
  npwp: string | null;
  ptkpStatus: string;
  noRekening: string | null;
  phone: string;
  email: string;
  currentAddress: string | null;
  lastEducation: LastEducation | null;
  emergencyName: string;
  emergencyPhone: string;
  roketAccountName: string;
  workStartDate: string;
  ktpPhotoUrl: string;
  kkPhotoUrl: string;
  npwpPhotoUrl: string | null;
  submittedAt: string;
  updatedAt: string;
};

export default function DriverPartnersPage() {
  const [partners, setPartners] = useState<DriverPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [detailPartner, setDetailPartner] = useState<DriverPartner | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/driver-partners", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setPartners(data.partners);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return partners;
    return partners.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.nik.toLowerCase().includes(q) ||
        p.phone.toLowerCase().includes(q),
    );
  }, [partners, query]);

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
        `Hapus data mitra driver untuk "${name}"? Tindakan ini tidak bisa dibatalkan.`,
      )
    ) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/driver-partners/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (detailPartner?.id === id) setDetailPartner(null);
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
          <h1 className="text-2xl font-semibold text-slate-900">Data Mitra Driver</h1>
          <p className="mt-1 text-sm text-slate-600">
            Data resmi mitra driver (KTP, KK, NPWP, dan data lain) yang
            dikumpulkan untuk keperluan administrasi HRD.
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
            href="/api/driver-partners/export"
            className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-brand-600"
          >
            Export CSV
          </a>
        </div>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        Bagikan link berikut ke mitra driver, misalnya lewat WhatsApp:{" "}
        <span className="font-medium text-slate-700">{PUBLIC_FORM_URL}</span>
      </p>

      <div className="mt-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari nama, NIK, atau nomor HP..."
          className="w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            Memuat...
          </div>
        ) : partners.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            Belum ada mitra driver yang mengisi data.
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
                    <th className="px-4 py-3">NIK</th>
                    <th className="px-4 py-3">No. HP</th>
                    <th className="px-4 py-3">Dokumen</th>
                    <th className="px-4 py-3">Terakhir Diperbarui</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {p.fullName}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">
                        {p.nik}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <a
                          href={`https://wa.me/${normalizePhone(p.phone)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-600 hover:underline"
                        >
                          {p.phone}
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <DocStatus
                          ktp={!!p.ktpPhotoUrl}
                          kk={!!p.kkPhotoUrl}
                          npwp={!!p.npwpPhotoUrl}
                        />
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatSubmittedAt(p.updatedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setDetailPartner(p)}
                            className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            Lihat Detail
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.fullName)}
                            disabled={deletingId === p.id}
                            className="rounded-md border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                          >
                            {deletingId === p.id ? "Menghapus..." : "Hapus"}
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

      {detailPartner && (
        <DriverPartnerDetailModal
          partner={detailPartner}
          onClose={() => setDetailPartner(null)}
        />
      )}
    </>
  );
}

function DocStatus({
  ktp,
  kk,
  npwp,
}: {
  ktp: boolean;
  kk: boolean;
  npwp: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <DocBadge label="KTP" present={ktp} />
      <DocBadge label="KK" present={kk} />
      <DocBadge label="NPWP" present={npwp} />
    </div>
  );
}

function DocBadge({ label, present }: { label: string; present: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
        present ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"
      }`}
    >
      {label} {present ? "✓" : "–"}
    </span>
  );
}
