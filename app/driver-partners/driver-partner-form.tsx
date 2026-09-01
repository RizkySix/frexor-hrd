"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  BLOOD_TYPE_OPTIONS,
  LAST_EDUCATION_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  MAX_UPLOAD_SIZE_BYTES,
  PTKP_OPTIONS,
  RELIGION_OPTIONS,
  isValidKk,
  isValidNik,
  isValidNpwp,
  normalizeDigits,
  type BloodType,
  type LastEducation,
  type MaritalStatus,
  type Religion,
} from "@/lib/driver-partner-utils";
import { GENDER_OPTIONS, type DriverGender } from "@/lib/driver-size-utils";

const DRAFT_KEY = "driver-partner-draft-v1";

const COMPRESS_MAX_DIMENSION = 1920;
const COMPRESS_JPEG_QUALITY = 0.82;

// Resize/re-encode a photo client-side before upload so phone-camera photos
// (often 5-10MB) shrink to a few hundred KB while staying legible for
// document verification. Falls back to the original file if the browser
// can't decode it (e.g. some HEIC cases) — the server still enforces a size
// cap either way.
async function compressImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;
    if (width > COMPRESS_MAX_DIMENSION || height > COMPRESS_MAX_DIMENSION) {
      const scale = COMPRESS_MAX_DIMENSION / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", COMPRESS_JPEG_QUALITY),
    );
    if (!blob) return file;
    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

type FormData = {
  fullName: string;
  birthPlace: string;
  birthDate: string;
  gender: DriverGender | "";
  bloodType: BloodType | "";
  address: string;
  religion: Religion | "";
  maritalStatus: MaritalStatus | "";
  nik: string;
  kkNumber: string;
  npwp: string;
  ptkpStatus: string;
  noRekening: string;
  phone: string;
  email: string;
  currentAddress: string;
  lastEducation: LastEducation | "";
  emergencyName: string;
  emergencyPhone: string;
  roketAccountName: string;
  workStartDate: string;
};

const INITIAL_FORM_DATA: FormData = {
  fullName: "",
  birthPlace: "",
  birthDate: "",
  gender: "",
  bloodType: "",
  address: "",
  religion: "",
  maritalStatus: "",
  nik: "",
  kkNumber: "",
  npwp: "",
  ptkpStatus: "",
  noRekening: "",
  phone: "",
  email: "",
  currentAddress: "",
  lastEducation: "",
  emergencyName: "",
  emergencyPhone: "",
  roketAccountName: "",
  workStartDate: "",
};

type PhotoSlotKey = "ktp" | "kk" | "npwp";

type PhotoSlotState = {
  status: "idle" | "uploading" | "success" | "error";
  url: string | null;
  previewUrl: string | null;
  error: string | null;
};

const INITIAL_PHOTO_STATE: PhotoSlotState = {
  status: "idle",
  url: null,
  previewUrl: null,
  error: null,
};

const STEPS = [
  { title: "Data Diri (Sesuai KTP)", shortLabel: "Data Diri" },
  { title: "Unggah Dokumen", shortLabel: "Dokumen" },
  { title: "Data Pajak & Rekening", shortLabel: "Pajak" },
  { title: "Kontak & Data Tambahan", shortLabel: "Kontak" },
];

const inputBase =
  "mt-1.5 block w-full rounded-lg border px-3.5 py-3 text-base text-slate-900 focus:outline-none focus:ring-2";

function inputCls(hasError?: string | null): string {
  return `${inputBase} ${
    hasError
      ? "border-rose-300 focus:border-rose-500 focus:ring-rose-100"
      : "border-slate-300 focus:border-brand-500 focus:ring-brand-100"
  }`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const labelCls = "block text-sm font-medium text-slate-800";
const optionalTag = (
  <span className="text-xs font-normal text-slate-400">(opsional)</span>
);

export function DriverPartnerForm() {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [photos, setPhotos] = useState<Record<PhotoSlotKey, PhotoSlotState>>({
    ktp: { ...INITIAL_PHOTO_STATE },
    kk: { ...INITIAL_PHOTO_STATE },
    npwp: { ...INITIAL_PHOTO_STATE },
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [highestStep, setHighestStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);

  const fileRefs = useRef<Record<PhotoSlotKey, File | null>>({
    ktp: null,
    kk: null,
    npwp: null,
  });
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  // Load draft dari localStorage sekali di mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          formData?: Partial<FormData>;
          photos?: Partial<Record<PhotoSlotKey, string | null>>;
          step?: number;
        };
        if (parsed.formData) {
          setFormData((prev) => ({ ...prev, ...parsed.formData }));
        }
        if (parsed.photos) {
          setPhotos((prev) => {
            const next = { ...prev };
            (Object.keys(parsed.photos ?? {}) as PhotoSlotKey[]).forEach(
              (slot) => {
                const url = parsed.photos?.[slot];
                if (url) {
                  next[slot] = {
                    status: "success",
                    url,
                    previewUrl: url,
                    error: null,
                  };
                }
              },
            );
            return next;
          });
        }
        if (
          typeof parsed.step === "number" &&
          parsed.step >= 0 &&
          parsed.step < STEPS.length
        ) {
          setCurrentStep(parsed.step);
          setHighestStep(parsed.step);
        }
      }
    } catch {
      /* ignore */
    }
    setDraftLoaded(true);
  }, []);

  // Auto-save draft ke localStorage (debounced). Hanya simpan nilai teks +
  // URL foto yang sudah berhasil diunggah — bukan file itu sendiri.
  useEffect(() => {
    if (!draftLoaded) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({
            formData,
            photos: {
              ktp: photos.ktp.url,
              kk: photos.kk.url,
              npwp: photos.npwp.url,
            },
            step: currentStep,
          }),
        );
      } catch {
        /* ignore */
      }
    }, 400);
    return () => clearTimeout(t);
  }, [formData, photos, currentStep, draftLoaded]);

  // Bersihkan object URL lokal saat komponen unmount
  useEffect(() => {
    return () => {
      Object.values(photosRef.current).forEach((p) => {
        if (p.previewUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(p.previewUrl);
        }
      });
    };
  }, []);

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  async function uploadPhoto(slot: PhotoSlotKey, file: File) {
    const localPreview = URL.createObjectURL(file);
    setPhotos((prev) => {
      const old = prev[slot];
      if (old.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(old.previewUrl);
      }
      return {
        ...prev,
        [slot]: { status: "uploading", url: null, previewUrl: localPreview, error: null },
      };
    });

    try {
      if (file.size > MAX_UPLOAD_SIZE_BYTES) {
        throw new Error("Ukuran file maksimal 10MB.");
      }

      const compressed = await compressImage(file);

      const form = new FormData();
      form.append("slot", slot);
      form.append("file", compressed);

      const res = await fetch("/api/driver-partners/upload", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Gagal mengunggah file.");
      }

      const publicUrl: string = data.publicUrl;
      setPhotos((prev) => {
        const old = prev[slot];
        if (old.previewUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(old.previewUrl);
        }
        return {
          ...prev,
          [slot]: {
            status: "success",
            url: publicUrl,
            previewUrl: publicUrl,
            error: null,
          },
        };
      });
      setErrors((prev) => {
        if (!(slot in prev)) return prev;
        const next = { ...prev };
        delete next[slot];
        return next;
      });
    } catch {
      setPhotos((prev) => ({
        ...prev,
        [slot]: {
          ...prev[slot],
          status: "error",
          error:
            "Gagal mengunggah foto. Periksa koneksi internet Anda lalu coba lagi.",
        },
      }));
    }
  }

  function handleFileInput(slot: PhotoSlotKey, e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!file) return;
    fileRefs.current[slot] = file;
    void uploadPhoto(slot, file);
  }

  function retryPhoto(slot: PhotoSlotKey) {
    const file = fileRefs.current[slot];
    if (file) void uploadPhoto(slot, file);
  }

  // ---- Validasi per langkah ----

  function validateStep1(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!formData.fullName.trim()) e.fullName = "Nama lengkap wajib diisi.";
    if (!formData.birthPlace.trim()) e.birthPlace = "Tempat lahir wajib diisi.";
    if (!formData.birthDate) e.birthDate = "Tanggal lahir wajib diisi.";
    if (!formData.gender) e.gender = "Pilih jenis kelamin Anda.";
    if (!formData.bloodType) e.bloodType = "Pilih golongan darah Anda.";
    if (!formData.address.trim()) e.address = "Alamat sesuai KTP wajib diisi.";
    if (!formData.religion) e.religion = "Pilih agama Anda.";
    if (!formData.maritalStatus) e.maritalStatus = "Pilih status perkawinan Anda.";
    if (!formData.nik.trim()) e.nik = "Nomor KTP (NIK) wajib diisi.";
    else if (!isValidNik(formData.nik)) e.nik = "NIK harus 16 digit angka.";
    if (!formData.kkNumber.trim()) e.kkNumber = "Nomor KK wajib diisi.";
    else if (!isValidKk(formData.kkNumber)) e.kkNumber = "Nomor KK harus 16 digit angka.";
    return e;
  }

  function validateStep2(): Record<string, string> {
    const e: Record<string, string> = {};
    if (photos.ktp.status !== "success") {
      e.ktp = "Foto KTP wajib diunggah dan berhasil diproses sebelum lanjut.";
    }
    if (photos.kk.status !== "success") {
      e.kk = "Foto KK wajib diunggah dan berhasil diproses sebelum lanjut.";
    }
    return e;
  }

  function validateStep3(): Record<string, string> {
    const e: Record<string, string> = {};
    if (formData.npwp.trim() && !isValidNpwp(formData.npwp)) {
      e.npwp = "NPWP harus 15 atau 16 digit angka.";
    }
    if (!formData.ptkpStatus) e.ptkpStatus = "Status PTKP wajib dipilih.";
    return e;
  }

  function validateStep4(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!formData.phone.trim()) e.phone = "Nomor telepon/HP wajib diisi.";
    if (!formData.email.trim()) e.email = "Alamat email wajib diisi.";
    else if (!EMAIL_RE.test(formData.email.trim())) {
      e.email = "Format alamat email tidak valid.";
    }
    if (!formData.emergencyName.trim()) {
      e.emergencyName = "Nama kerabat wajib diisi.";
    }
    if (!formData.emergencyPhone.trim()) {
      e.emergencyPhone = "Nomor telepon kerabat wajib diisi.";
    }
    if (!formData.roketAccountName.trim()) {
      e.roketAccountName = "Nama akun di Roket wajib diisi.";
    }
    if (!formData.workStartDate) {
      e.workStartDate = "Tanggal mulai bekerja wajib diisi (boleh perkiraan).";
    }
    return e;
  }

  const STEP_VALIDATORS = [validateStep1, validateStep2, validateStep3, validateStep4];

  function goToStep(index: number) {
    if (index < 0 || index > highestStep || index === currentStep) return;
    setErrors({});
    setCurrentStep(index);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goNext() {
    const stepErrors = STEP_VALIDATORS[currentStep]();
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) return;
    const next = currentStep + 1;
    setHighestStep((h) => Math.max(h, next));
    setCurrentStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setErrors({});
    setCurrentStep((s) => Math.max(0, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit() {
    const stepErrors = validateStep4();
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/driver-partners/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          birthPlace: formData.birthPlace.trim(),
          birthDate: formData.birthDate,
          gender: formData.gender,
          bloodType: formData.bloodType,
          address: formData.address.trim(),
          religion: formData.religion,
          maritalStatus: formData.maritalStatus,
          nik: formData.nik,
          kkNumber: formData.kkNumber,
          npwp: formData.npwp.trim(),
          ptkpStatus: formData.ptkpStatus,
          noRekening: formData.noRekening.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          currentAddress: formData.currentAddress.trim(),
          lastEducation: formData.lastEducation,
          emergencyName: formData.emergencyName.trim(),
          emergencyPhone: formData.emergencyPhone.trim(),
          roketAccountName: formData.roketAccountName.trim(),
          workStartDate: formData.workStartDate,
          ktpPhotoUrl: photos.ktp.url,
          kkPhotoUrl: photos.kk.url,
          npwpPhotoUrl: photos.npwp.url,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(
          typeof data?.error === "string"
            ? data.error
            : "Gagal mengirim data. Silakan coba lagi.",
        );
        setSubmitting(false);
        return;
      }
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      setSuccess(true);
    } catch {
      setSubmitError("Terjadi kesalahan jaringan. Silakan coba lagi.");
      setSubmitting(false);
    }
  }

  function onFormSubmit(e: FormEvent) {
    e.preventDefault();
    if (currentStep < STEPS.length - 1) {
      goNext();
    } else {
      void handleSubmit();
    }
  }

  // ---- Render sukses ----

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-3xl">
          ✓
        </div>
        <h2 className="mt-4 text-lg font-semibold text-emerald-900">
          Terima kasih! Data mitra Anda sudah tersimpan.
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-emerald-800">
          Jika Anda mengisi ulang dengan Nomor KTP (NIK) yang sama, data lama
          akan otomatis diperbarui (bukan dobel).
        </p>
      </div>
    );
  }

  // ---- Render slot foto (langkah 2) ----

  function renderPhotoSlot(
    slot: PhotoSlotKey,
    label: string,
    required: boolean,
    hint?: string,
  ) {
    const state = photos[slot];
    const inputId = `dp-photo-${slot}`;
    return (
      <div key={slot} className="rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-slate-800">
            {label}{" "}
            {required ? (
              <span className="text-rose-500">*</span>
            ) : (
              <span className="text-xs font-normal text-slate-400">
                ({hint ?? "opsional"})
              </span>
            )}
          </span>
          {state.status === "success" && (
            <span className="shrink-0 text-lg text-emerald-600">✓</span>
          )}
        </div>

        <div className="mt-3 flex items-center gap-3">
          {state.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={state.previewUrl}
              alt={`Pratinjau ${label}`}
              className="h-20 w-20 shrink-0 rounded-lg border border-slate-200 object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-2xl">
              📄
            </div>
          )}

          <div className="min-w-0 flex-1">
            <label
              htmlFor={inputId}
              className={`inline-flex cursor-pointer items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
                state.status === "uploading"
                  ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                  : "border-brand-500 bg-white text-brand-700 hover:bg-brand-50"
              }`}
            >
              {state.status === "uploading"
                ? "Mengunggah..."
                : state.status === "success"
                ? "Ganti Foto"
                : "Pilih Foto"}
            </label>
            <input
              id={inputId}
              type="file"
              accept="image/*"
              capture="environment"
              disabled={state.status === "uploading"}
              onChange={(e) => handleFileInput(slot, e)}
              className="sr-only"
            />

            {state.status === "error" && (
              <div className="mt-2">
                <p className="text-xs text-rose-600">{state.error}</p>
                <button
                  type="button"
                  onClick={() => retryPhoto(slot)}
                  className="mt-1 text-xs font-semibold text-brand-600 underline"
                >
                  Coba lagi
                </button>
              </div>
            )}
          </div>
        </div>

        {errors[slot] && (
          <p className="mt-2 text-xs text-rose-600">{errors[slot]}</p>
        )}
      </div>
    );
  }

  // ---- Render tiap langkah ----

  function renderStep1() {
    return (
      <div className="space-y-5">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
          Pastikan seluruh data pada langkah ini <strong>SAMA PERSIS</strong>{" "}
          dengan KTP Anda.
        </div>

        <div>
          <label htmlFor="dp-fullName" className={labelCls}>
            Nama Lengkap
          </label>
          <input
            id="dp-fullName"
            type="text"
            value={formData.fullName}
            onChange={(e) => setField("fullName", e.target.value)}
            placeholder="Sesuai KTP"
            className={inputCls(errors.fullName)}
          />
          {errors.fullName && (
            <p className="mt-1.5 text-xs text-rose-600">{errors.fullName}</p>
          )}
        </div>

        <div>
          <label htmlFor="dp-birthPlace" className={labelCls}>
            Tempat Lahir
          </label>
          <input
            id="dp-birthPlace"
            type="text"
            value={formData.birthPlace}
            onChange={(e) => setField("birthPlace", e.target.value)}
            className={inputCls(errors.birthPlace)}
          />
          {errors.birthPlace && (
            <p className="mt-1.5 text-xs text-rose-600">{errors.birthPlace}</p>
          )}
        </div>

        <div>
          <label htmlFor="dp-birthDate" className={labelCls}>
            Tanggal Lahir
          </label>
          <input
            id="dp-birthDate"
            type="date"
            value={formData.birthDate}
            onChange={(e) => setField("birthDate", e.target.value)}
            className={inputCls(errors.birthDate)}
          />
          {errors.birthDate && (
            <p className="mt-1.5 text-xs text-rose-600">{errors.birthDate}</p>
          )}
        </div>

        <div>
          <span className={labelCls}>Jenis Kelamin</span>
          <div className="mt-1.5 grid grid-cols-2 gap-3">
            {GENDER_OPTIONS.map((opt) => {
              const active = formData.gender === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setField("gender", opt.value)}
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

        <div>
          <label htmlFor="dp-bloodType" className={labelCls}>
            Golongan Darah
          </label>
          <select
            id="dp-bloodType"
            value={formData.bloodType}
            onChange={(e) => setField("bloodType", e.target.value as BloodType)}
            className={`${inputCls(errors.bloodType)} bg-white`}
          >
            <option value="" disabled>
              Pilih golongan darah
            </option>
            {BLOOD_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {errors.bloodType && (
            <p className="mt-1.5 text-xs text-rose-600">{errors.bloodType}</p>
          )}
        </div>

        <div>
          <label htmlFor="dp-address" className={labelCls}>
            Alamat Sesuai KTP
          </label>
          <textarea
            id="dp-address"
            rows={3}
            value={formData.address}
            onChange={(e) => setField("address", e.target.value)}
            className={inputCls(errors.address)}
          />
          {errors.address && (
            <p className="mt-1.5 text-xs text-rose-600">{errors.address}</p>
          )}
        </div>

        <div>
          <label htmlFor="dp-religion" className={labelCls}>
            Agama
          </label>
          <select
            id="dp-religion"
            value={formData.religion}
            onChange={(e) => setField("religion", e.target.value as Religion)}
            className={`${inputCls(errors.religion)} bg-white`}
          >
            <option value="" disabled>
              Pilih agama
            </option>
            {RELIGION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {errors.religion && (
            <p className="mt-1.5 text-xs text-rose-600">{errors.religion}</p>
          )}
        </div>

        <div>
          <label htmlFor="dp-maritalStatus" className={labelCls}>
            Status Perkawinan
          </label>
          <select
            id="dp-maritalStatus"
            value={formData.maritalStatus}
            onChange={(e) =>
              setField("maritalStatus", e.target.value as MaritalStatus)
            }
            className={`${inputCls(errors.maritalStatus)} bg-white`}
          >
            <option value="" disabled>
              Pilih status perkawinan
            </option>
            {MARITAL_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {errors.maritalStatus && (
            <p className="mt-1.5 text-xs text-rose-600">
              {errors.maritalStatus}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="dp-nik" className={labelCls}>
            Nomor KTP / NIK
          </label>
          <input
            id="dp-nik"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={16}
            value={formData.nik}
            onChange={(e) => setField("nik", normalizeDigits(e.target.value))}
            placeholder="16 digit angka"
            className={inputCls(errors.nik)}
          />
          <p className="mt-1.5 text-xs text-slate-500">
            {formData.nik.length}/16 digit
          </p>
          {errors.nik && <p className="mt-1 text-xs text-rose-600">{errors.nik}</p>}
        </div>

        <div>
          <label htmlFor="dp-kkNumber" className={labelCls}>
            Nomor KK
          </label>
          <input
            id="dp-kkNumber"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={16}
            value={formData.kkNumber}
            onChange={(e) => setField("kkNumber", normalizeDigits(e.target.value))}
            placeholder="16 digit angka"
            className={inputCls(errors.kkNumber)}
          />
          <p className="mt-1.5 text-xs text-slate-500">
            {formData.kkNumber.length}/16 digit
          </p>
          {errors.kkNumber && (
            <p className="mt-1 text-xs text-rose-600">{errors.kkNumber}</p>
          )}
        </div>
      </div>
    );
  }

  function renderStep2() {
    return (
      <div className="space-y-4">
        <p className="text-xs leading-relaxed text-slate-500">
          Ambil foto dokumen dengan jelas dan tidak buram. Anda bisa memotret
          langsung dari HP atau memilih dari galeri.
        </p>
        {renderPhotoSlot("ktp", "Foto KTP", true)}
        {renderPhotoSlot("kk", "Foto KK", true)}
        {renderPhotoSlot("npwp", "Foto NPWP", false, "kalau ada / opsional")}
      </div>
    );
  }

  function renderStep3() {
    return (
      <div className="space-y-5">
        <div>
          <label htmlFor="dp-npwp" className={labelCls}>
            NPWP {optionalTag}
          </label>
          <input
            id="dp-npwp"
            type="text"
            inputMode="numeric"
            value={formData.npwp}
            onChange={(e) => setField("npwp", e.target.value)}
            placeholder="15 atau 16 digit"
            className={inputCls(errors.npwp)}
          />
          {errors.npwp && (
            <p className="mt-1.5 text-xs text-rose-600">{errors.npwp}</p>
          )}
        </div>

        <div>
          <label htmlFor="dp-ptkpStatus" className={labelCls}>
            Status PTKP
          </label>
          <select
            id="dp-ptkpStatus"
            value={formData.ptkpStatus}
            onChange={(e) => setField("ptkpStatus", e.target.value)}
            className={`${inputCls(errors.ptkpStatus)} bg-white`}
          >
            <option value="">Pilih status PTKP</option>
            {PTKP_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          {errors.ptkpStatus && (
            <p className="mt-1.5 text-xs text-rose-600">{errors.ptkpStatus}</p>
          )}
        </div>

        <div>
          <label htmlFor="dp-noRekening" className={labelCls}>
            Nomor Rekening {optionalTag}
          </label>
          <input
            id="dp-noRekening"
            type="text"
            inputMode="numeric"
            value={formData.noRekening}
            onChange={(e) => setField("noRekening", e.target.value)}
            className={inputCls()}
          />
        </div>
      </div>
    );
  }

  function renderStep4() {
    return (
      <div className="space-y-5">
        <div>
          <label htmlFor="dp-phone" className={labelCls}>
            Nomor Telepon/HP
          </label>
          <input
            id="dp-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={formData.phone}
            onChange={(e) => setField("phone", e.target.value)}
            placeholder="08123456789"
            className={inputCls(errors.phone)}
          />
          {errors.phone && (
            <p className="mt-1.5 text-xs text-rose-600">{errors.phone}</p>
          )}
        </div>

        <div>
          <label htmlFor="dp-email" className={labelCls}>
            Alamat Email
          </label>
          <input
            id="dp-email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={(e) => setField("email", e.target.value)}
            className={inputCls(errors.email)}
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-rose-600">{errors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="dp-currentAddress" className={labelCls}>
            Alamat Tinggal Saat Ini {optionalTag}
          </label>
          <textarea
            id="dp-currentAddress"
            rows={3}
            value={formData.currentAddress}
            onChange={(e) => setField("currentAddress", e.target.value)}
            className={inputCls()}
          />
          <p className="mt-1.5 text-xs text-slate-500">
            Bisa berbeda dari alamat KTP jika Anda saat ini tinggal di tempat
            lain.
          </p>
        </div>

        <div>
          <label htmlFor="dp-lastEducation" className={labelCls}>
            Pendidikan Terakhir {optionalTag}
          </label>
          <select
            id="dp-lastEducation"
            value={formData.lastEducation}
            onChange={(e) =>
              setField("lastEducation", e.target.value as LastEducation)
            }
            className={`${inputCls()} bg-white`}
          >
            <option value="">Belum diisi</option>
            {LAST_EDUCATION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="dp-emergencyName" className={labelCls}>
            Nama Kerabat
          </label>
          <input
            id="dp-emergencyName"
            type="text"
            value={formData.emergencyName}
            onChange={(e) => setField("emergencyName", e.target.value)}
            className={inputCls(errors.emergencyName)}
          />
          {errors.emergencyName && (
            <p className="mt-1.5 text-xs text-rose-600">{errors.emergencyName}</p>
          )}
        </div>

        <div>
          <label htmlFor="dp-emergencyPhone" className={labelCls}>
            Nomor Telepon Kerabat
          </label>
          <input
            id="dp-emergencyPhone"
            type="tel"
            inputMode="tel"
            value={formData.emergencyPhone}
            onChange={(e) => setField("emergencyPhone", e.target.value)}
            className={inputCls(errors.emergencyPhone)}
          />
          {errors.emergencyPhone && (
            <p className="mt-1.5 text-xs text-rose-600">{errors.emergencyPhone}</p>
          )}
          <p className="mt-1.5 text-xs text-slate-500">
            Kontak darurat jika Anda tidak bisa dihubungi.
          </p>
        </div>

        <div>
          <label htmlFor="dp-roketAccountName" className={labelCls}>
            Nama Akun di Roket
          </label>
          <input
            id="dp-roketAccountName"
            type="text"
            value={formData.roketAccountName}
            onChange={(e) => setField("roketAccountName", e.target.value)}
            className={inputCls(errors.roketAccountName)}
          />
          {errors.roketAccountName && (
            <p className="mt-1.5 text-xs text-rose-600">{errors.roketAccountName}</p>
          )}
        </div>

        <div>
          <label htmlFor="dp-workStartDate" className={labelCls}>
            Tanggal Mulai Bekerja di BST
          </label>
          <input
            id="dp-workStartDate"
            type="date"
            value={formData.workStartDate}
            onChange={(e) => setField("workStartDate", e.target.value)}
            className={inputCls(errors.workStartDate)}
          />
          {errors.workStartDate && (
            <p className="mt-1.5 text-xs text-rose-600">{errors.workStartDate}</p>
          )}
          <p className="mt-1.5 text-xs text-slate-500">
            Tidak apa-apa jika hanya perkiraan / seingat Anda saja.
          </p>
        </div>
      </div>
    );
  }

  // ---- Render utama ----

  return (
    <form onSubmit={onFormSubmit} noValidate className="space-y-5">
      {/* Sticky stepper */}
      <div className="sticky top-2 z-20 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between text-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-600">
            Bali Sun Tours
          </p>
          <p className="text-xs font-medium text-slate-500">
            Langkah {currentStep + 1} dari {STEPS.length}
          </p>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all"
            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5">
          {STEPS.map((step, i) => {
            const reachable = i <= highestStep;
            const isCurrent = i === currentStep;
            const isDone = i < currentStep;
            return (
              <button
                key={step.title}
                type="button"
                disabled={!reachable}
                onClick={() => goToStep(i)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-medium transition ${
                  isCurrent
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : isDone
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-500"
                } ${!reachable ? "cursor-not-allowed opacity-60" : ""}`}
              >
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    isDone
                      ? "bg-emerald-500 text-white"
                      : isCurrent
                      ? "bg-brand-500 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {isDone ? "✓" : i + 1}
                </span>
                <span className="hidden sm:inline">{step.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Kartu langkah aktif */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          {STEPS[currentStep].title}
        </h2>
        <div className="mt-4">
          {currentStep === 0 && renderStep1()}
          {currentStep === 1 && renderStep2()}
          {currentStep === 2 && renderStep3()}
          {currentStep === 3 && renderStep4()}
        </div>
      </div>

      {submitError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {submitError}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        {currentStep > 0 ? (
          <button
            type="button"
            onClick={goBack}
            className="rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Kembali
          </button>
        ) : (
          <span />
        )}
        <button
          type="submit"
          disabled={submitting}
          className="ml-auto rounded-xl bg-brand-500 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-brand-500/20 transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {currentStep < STEPS.length - 1
            ? "Lanjut"
            : submitting
            ? "Mengirim..."
            : "Kirim Data"}
        </button>
      </div>
    </form>
  );
}
