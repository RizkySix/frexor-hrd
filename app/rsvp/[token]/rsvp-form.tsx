"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { STATUS_LABEL, type DropdownOptions, type RSVPStatus } from "@/lib/rsvp-utils";

type Props = {
  token: string;
  event: {
    title: string;
    description: string | null;
    eventAt: string;
    eventAtFormatted: string;
    dropdown: DropdownOptions;
  };
};

type ExistingResponse = {
  name: string;
  status: RSVPStatus;
  dropdownValue: string | null;
  reason: string | null;
  submittedAt: string;
};

export function RSVPForm({ token, event }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [dropdownValue, setDropdownValue] = useState("");
  const [status, setStatus] = useState<RSVPStatus | "">("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<ExistingResponse | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Nama wajib diisi.");
      return;
    }
    if (event.dropdown && !dropdownValue) {
      setError(`${event.dropdown.label} wajib dipilih.`);
      return;
    }
    if (!status) {
      setError("Pilih status kehadiran (Hadir / Tidak Hadir).");
      return;
    }

    if (!window.confirm(`Pastikan nama Anda benar: "${name.trim()}". Lanjutkan?`)) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/rsvp/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          dropdownValue: event.dropdown ? dropdownValue : undefined,
          status,
          reason: status === "TIDAK_HADIR" ? reason.trim() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409 && data.error === "ALREADY_SUBMITTED" && data.data) {
          setDuplicate({
            name: data.data.name,
            status: data.data.status,
            dropdownValue: data.data.dropdownValue,
            reason: data.data.reason,
            submittedAt: data.data.submittedAt,
          });
          setSubmitting(false);
          return;
        }
        setError(data.error ?? "Gagal mengirim RSVP.");
        setSubmitting(false);
        return;
      }
      router.push(`/rsvp/${token}/selesai?name=${encodeURIComponent(name.trim())}`);
    } catch {
      setError("Terjadi kesalahan jaringan. Silakan coba lagi.");
      setSubmitting(false);
    }
  }

  if (duplicate) {
    const label = STATUS_LABEL[duplicate.status];
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-amber-900">
            Anda sudah mengisi RSVP untuk event ini
          </h1>
          <p className="mt-1 text-sm text-amber-800">
            Berikut jawaban yang sudah tersimpan:
          </p>
          <dl className="mt-4 space-y-2 rounded-md bg-white p-4 text-sm">
            <Row label="Nama" value={duplicate.name} />
            {duplicate.dropdownValue && event.dropdown && (
              <Row label={event.dropdown.label} value={duplicate.dropdownValue} />
            )}
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Status</dt>
              <dd>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${label.cls}`}
                >
                  {label.text}
                </span>
              </dd>
            </div>
            {duplicate.reason && <Row label="Alasan" value={duplicate.reason} />}
            <Row
              label="Disubmit"
              value={new Date(duplicate.submittedAt).toLocaleString("id-ID")}
            />
          </dl>
          <p className="mt-4 text-xs text-amber-700">
            Jika ini bukan Anda, hubungi HRD untuk klarifikasi.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-md">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-600">
              Bali Sun Tours
            </p>
            <span className="inline-flex rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-700">
              RSVP
            </span>
          </div>
          <h1 className="mt-3 text-xl font-semibold text-slate-900">{event.title}</h1>
          <p className="mt-1 text-sm text-slate-600">{event.eventAtFormatted}</p>
          {event.description && (
            <p className="mt-3 whitespace-pre-line text-sm text-slate-700">
              {event.description}
            </p>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-4 space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Nama Lengkap *
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="Nama lengkap Anda"
              autoComplete="name"
            />
          </div>

          {event.dropdown && (
            <div>
              <label className="block text-sm font-medium text-slate-700">
                {event.dropdown.label} *
              </label>
              <select
                required
                value={dropdownValue}
                onChange={(e) => setDropdownValue(e.target.value)}
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="">— Pilih {event.dropdown.label} —</option>
                {event.dropdown.options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          )}

          <fieldset>
            <legend className="block text-sm font-medium text-slate-700">
              Kehadiran *
            </legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <RadioCard
                label="Hadir"
                selected={status === "HADIR"}
                onClick={() => setStatus("HADIR")}
                tone="green"
              />
              <RadioCard
                label="Tidak Hadir"
                selected={status === "TIDAK_HADIR"}
                onClick={() => setStatus("TIDAK_HADIR")}
                tone="rose"
              />
            </div>
          </fieldset>

          {status === "TIDAK_HADIR" && (
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Alasan (opsional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Misal: ada agenda lain, sakit, dsb."
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          )}

          {error && (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow hover:bg-brand-600 disabled:opacity-60"
          >
            {submitting ? "Mengirim..." : "Kirim RSVP"}
          </button>
        </form>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right text-slate-900">{value}</dd>
    </div>
  );
}

function RadioCard({
  label,
  selected,
  onClick,
  tone,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  tone: "green" | "rose";
}) {
  const activeCls =
    tone === "green"
      ? "border-green-500 bg-green-50 text-green-800"
      : "border-rose-500 bg-rose-50 text-rose-800";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-3 py-3 text-sm font-medium transition ${
        selected ? activeCls : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}
