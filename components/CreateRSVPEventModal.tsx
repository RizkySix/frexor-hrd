"use client";

import { useState } from "react";
import { TagInput } from "./TagInput";

type Created = {
  id: string;
  token: string;
  title: string;
  eventAt: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export function CreateRSVPEventModal({ open, onClose, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [eventAt, setEventAt] = useState("");
  const [description, setDescription] = useState("");
  const [useDropdown, setUseDropdown] = useState(false);
  const [dropdownLabel, setDropdownLabel] = useState("");
  const [dropdownOptions, setDropdownOptions] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Created | null>(null);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  function reset() {
    setTitle("");
    setEventAt("");
    setDescription("");
    setUseDropdown(false);
    setDropdownLabel("");
    setDropdownOptions([]);
    setError(null);
    setResult(null);
    setSubmitting(false);
    setCopied(false);
  }

  function closeAndReset() {
    reset();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (useDropdown) {
      if (!dropdownLabel.trim()) {
        setError("Label dropdown wajib diisi.");
        return;
      }
      if (dropdownOptions.length === 0) {
        setError("Dropdown butuh minimal 1 opsi.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/rsvp/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          eventAt: new Date(eventAt).toISOString(),
          dropdownLabel: useDropdown ? dropdownLabel : undefined,
          dropdownOptions: useDropdown ? dropdownOptions : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal membuat event.");
        return;
      }
      setResult(data);
      onCreated();
    } catch {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setSubmitting(false);
    }
  }

  async function copy() {
    if (!result) return;
    const url = `${window.location.origin}/rsvp/${result.token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Salin link ini:", url);
    }
  }

  const link = result
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/rsvp/${result.token}`
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        {!result ? (
          <>
            <h2 className="text-lg font-semibold">Buat Event RSVP Baru</h2>
            <p className="mt-1 text-sm text-slate-600">
              Link akan otomatis ditutup tepat saat event mulai.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Nama Event *
                </label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Town Hall Q2 2025"
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Tanggal & Jam Event *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={eventAt}
                  onChange={(e) => setEventAt(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Deskripsi
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Detail event, lokasi, agenda..."
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={useDropdown}
                    onChange={(e) => setUseDropdown(e.target.checked)}
                    className="h-4 w-4 accent-brand-500"
                  />
                  Tambah dropdown custom (misal: Departemen, Posisi, Tim)
                </label>

                {useDropdown && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700">
                        Label Dropdown
                      </label>
                      <input
                        value={dropdownLabel}
                        onChange={(e) => setDropdownLabel(e.target.value)}
                        placeholder="Departemen"
                        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700">
                        Opsi (ketik lalu tekan Enter / koma)
                      </label>
                      <div className="mt-1">
                        <TagInput
                          value={dropdownOptions}
                          onChange={setDropdownOptions}
                          placeholder="Sales, Marketing, Engineering..."
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeAndReset}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
                >
                  {submitting ? "Membuat..." : "Buat Event"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold">Event Berhasil Dibuat</h2>
            <p className="mt-1 text-sm text-slate-600">
              Bagikan link berikut ke karyawan untuk mengisi RSVP{" "}
              <strong>{result.title}</strong>.
            </p>

            <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="break-all text-sm text-slate-800">{link}</div>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Form ditutup: {new Date(result.eventAt).toLocaleString("id-ID")}
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={copy}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {copied ? "Tersalin!" : "Salin Link"}
              </button>
              <button
                onClick={closeAndReset}
                className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
              >
                Selesai
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
