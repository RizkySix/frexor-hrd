"use client";

import { useState } from "react";
import {
  GENDER_OPTIONS,
  SHIRT_SIZES,
  SHIRT_SIZE_LABELS,
  type DriverGender,
  type ShirtSize,
} from "@/lib/driver-size-utils";

type FieldErrors = {
  name?: string;
  phone?: string;
  gender?: string;
  size?: string;
};

export function DriverSizeForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<DriverGender | null>(null);
  const [size, setSize] = useState<ShirtSize | "">("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  function validate(): boolean {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = "Nama lengkap wajib diisi.";
    if (!phone.trim()) next.phone = "Nomor WhatsApp wajib diisi.";
    if (!gender) next.gender = "Pilih jenis kelamin Anda.";
    if (!size) next.size = "Pilih ukuran baju Anda.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/driver-sizes/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          gender,
          size,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(
          typeof data?.error === "string"
            ? data.error
            : "Gagal menyimpan data. Silakan coba lagi.",
        );
        setSubmitting(false);
        return;
      }
      setSuccess(true);
    } catch {
      setSubmitError("Terjadi kesalahan jaringan. Silakan coba lagi.");
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-3xl">
          ✓
        </div>
        <h2 className="mt-4 text-lg font-semibold text-emerald-900">
          Terima kasih! Data ukuran baju Anda sudah tersimpan.
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-emerald-800">
          Jika Anda mengisi ulang dengan nomor WhatsApp yang sama, data lama
          akan otomatis diperbarui (bukan dobel).
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7"
    >
      {/* Nama Lengkap */}
      <div>
        <label
          htmlFor="driver-name"
          className="block text-sm font-medium text-slate-800"
        >
          Nama Sesuai Aplikasi
        </label>
        <input
          id="driver-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Lanus"
          maxLength={100}
          className={`mt-1.5 block w-full rounded-lg border px-3.5 py-3 text-base text-slate-900 focus:outline-none focus:ring-2 ${
            errors.name
              ? "border-rose-300 focus:border-rose-500 focus:ring-rose-100"
              : "border-slate-300 focus:border-brand-500 focus:ring-brand-100"
          }`}
        />
        {errors.name && (
          <p className="mt-1.5 text-xs text-rose-600">{errors.name}</p>
        )}
      </div>

      {/* Nomor WhatsApp */}
      <div>
        <label
          htmlFor="driver-phone"
          className="block text-sm font-medium text-slate-800"
        >
          Nomor WhatsApp
        </label>
        <input
          id="driver-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="08123456789"
          maxLength={30}
          className={`mt-1.5 block w-full rounded-lg border px-3.5 py-3 text-base text-slate-900 focus:outline-none focus:ring-2 ${
            errors.phone
              ? "border-rose-300 focus:border-rose-500 focus:ring-rose-100"
              : "border-slate-300 focus:border-brand-500 focus:ring-brand-100"
          }`}
        />
        <p className="mt-1.5 text-xs text-slate-500">
          Gunakan nomor WhatsApp aktif Anda
        </p>
        {errors.phone && (
          <p className="mt-1 text-xs text-rose-600">{errors.phone}</p>
        )}
      </div>

      {/* Jenis Kelamin */}
      <div>
        <span className="block text-sm font-medium text-slate-800">
          Jenis Kelamin
        </span>
        <div className="mt-1.5 grid grid-cols-2 gap-3">
          {GENDER_OPTIONS.map((opt) => {
            const active = gender === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setGender(opt.value)}
                aria-pressed={active}
                className={`rounded-xl border-2 px-4 py-3.5 text-sm font-semibold transition ${
                  active
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        {errors.gender && (
          <p className="mt-1.5 text-xs text-rose-600">{errors.gender}</p>
        )}
      </div>

      {/* Ukuran Baju */}
      <div>
        <label
          htmlFor="driver-size"
          className="block text-sm font-medium text-slate-800"
        >
          Ukuran Baju
        </label>
        <select
          id="driver-size"
          value={size}
          onChange={(e) => setSize(e.target.value as ShirtSize)}
          className={`mt-1.5 block w-full rounded-lg border bg-white px-3.5 py-3 text-base text-slate-900 focus:outline-none focus:ring-2 ${
            errors.size
              ? "border-rose-300 focus:border-rose-500 focus:ring-rose-100"
              : "border-slate-300 focus:border-brand-500 focus:ring-brand-100"
          }`}
        >
          <option value="" disabled>
            Pilih ukuran
          </option>
          {SHIRT_SIZES.map((s) => (
            <option key={s} value={s}>
              {SHIRT_SIZE_LABELS[s]}
            </option>
          ))}
        </select>
        {errors.size && (
          <p className="mt-1.5 text-xs text-rose-600">{errors.size}</p>
        )}
      </div>

      {submitError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {submitError}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-brand-500 px-6 py-3.5 text-base font-semibold text-white shadow-md shadow-brand-500/20 transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Menyimpan..." : "Kirim Data"}
      </button>
    </form>
  );
}
