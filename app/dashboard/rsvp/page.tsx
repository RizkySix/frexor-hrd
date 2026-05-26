"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CreateRSVPEventModal } from "@/components/CreateRSVPEventModal";
import { formatEventDateTime, isRSVPExpired } from "@/lib/rsvp-utils";

type EventItem = {
  id: string;
  title: string;
  description: string | null;
  eventAt: string;
  token: string;
  total: number;
  hadir: number;
  tidakHadir: number;
};

export default function RSVPListPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/rsvp/events", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setEvents(data.events);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function copyLink(token: string, id: string) {
    const url = `${window.location.origin}/rsvp/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1500);
    } catch {
      window.prompt("Salin link ini:", url);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">RSVP Events</h1>
          <p className="mt-1 text-sm text-slate-600">
            Buat dan kelola event kehadiran karyawan.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-brand-600"
        >
          + Buat Event Baru
        </button>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            Memuat...
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            Belum ada event. Klik <strong>Buat Event Baru</strong> untuk mulai.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {events.map((ev) => {
              const expired = isRSVPExpired({ eventAt: ev.eventAt });
              return (
                <div
                  key={ev.id}
                  className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-slate-900">{ev.title}</h2>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatEventDateTime(ev.eventAt)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        expired
                          ? "bg-gray-100 text-gray-600"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {expired ? "Ditutup" : "Aktif"}
                    </span>
                  </div>

                  {ev.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                      {ev.description}
                    </p>
                  )}

                  <div className="mt-3 flex items-center gap-4 text-xs text-slate-700">
                    <span>
                      <span className="font-semibold text-slate-900">{ev.total}</span>{" "}
                      Total
                    </span>
                    <span className="text-green-700">✅ {ev.hadir} Hadir</span>
                    <span className="text-rose-700">❌ {ev.tidakHadir} Tidak</span>
                  </div>

                  <div className="mt-4 flex items-center justify-end gap-2">
                    {!expired && (
                      <button
                        onClick={() => copyLink(ev.token, ev.id)}
                        className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        {copiedId === ev.id ? "Tersalin!" : "Salin Link"}
                      </button>
                    )}
                    <Link
                      href={`/dashboard/rsvp/${ev.id}`}
                      className="rounded-md bg-brand-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-600"
                    >
                      Lihat Detail
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CreateRSVPEventModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => load()}
      />
    </>
  );
}
