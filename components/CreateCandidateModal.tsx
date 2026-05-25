"use client";

import { useState } from "react";

type Created = {
  id: string;
  name: string;
  position: string;
  token: string;
  expiresAt: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export function CreateCandidateModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Created | null>(null);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  function reset() {
    setName("");
    setPosition("");
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
    setSubmitting(true);
    try {
      const res = await fetch("/api/kandidat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, position }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal membuat kandidat.");
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
    const url = `${window.location.origin}/tes/${result.token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Salin link ini:", url);
    }
  }

  const link = result
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/tes/${result.token}`
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        {!result ? (
          <>
            <h2 className="text-lg font-semibold">Buat Link Tes Baru</h2>
            <p className="mt-1 text-sm text-slate-600">
              Link akan otomatis kadaluarsa 7 hari setelah dibuat.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Nama Kandidat
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Posisi</label>
                <input
                  required
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {error && (
                <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-end gap-2">
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
                  {submitting ? "Membuat..." : "Buat Link"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold">Link Berhasil Dibuat</h2>
            <p className="mt-1 text-sm text-slate-600">
              Bagikan link berikut ke <strong>{result.name}</strong> ({result.position}).
            </p>

            <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="break-all text-sm text-slate-800">{link}</div>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Kadaluarsa: {new Date(result.expiresAt).toLocaleString("id-ID")}
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
