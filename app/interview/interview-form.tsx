"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  GENDER_OPTIONS,
  BLOOD_TYPE_OPTIONS,
  RELIGION_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  PROFICIENCY_OPTIONS,
  FAMILY_IMMEDIATE_ROLES,
  FAMILY_EXTENDED_ROLES,
  MAX_UPLOAD_SIZE_BYTES,
  type DriverGender,
  type BloodType,
  type Religion,
  type MaritalStatus,
  type Proficiency,
  type FamilyMember,
  type FormalEducationRow,
  type NonFormalEducationRow,
  type LanguageRow,
  type WorkExperienceRow,
} from "@/lib/interview-utils";

const DRAFT_KEY = "interview-draft-v1";

const COMPRESS_MAX_DIMENSION = 1920;
const COMPRESS_JPEG_QUALITY = 0.82;

// Resize/re-encode a photo client-side before upload so phone-camera photos
// (often 5-10MB) shrink to a few hundred KB while staying legible. Falls back
// to the original file if the browser can't decode it (e.g. some HEIC cases) —
// the server still enforces a size cap either way.
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
  // Step 1 — Lamaran & Identitas
  appliedPosition: string;
  fullName: string;
  nickname: string;
  birthPlace: string;
  birthDate: string;
  gender: DriverGender | "";
  heightCm: string;
  weightKg: string;
  bloodType: BloodType | "";
  ktpAddress: string;
  homePhone: string;
  currentAddress: string;
  bcaAccount: string;
  citizenship: string;
  personalEmail: string;
  maritalStatus: MaritalStatus | "";
  childrenCount: string;
  religion: Religion | "";
  nik: string;
  phone: string;
  simA: string;
  simB: string;
  simC: string;
  // Step 4 — single fields
  lastJobDescription: string;
  lastSalaryTotal: string;
  expectedSalary: string;
  hasBpjsTk: boolean;
  bpjsTkNumber: string;
  hasBpjsKes: boolean;
  bpjsKesNumber: string;
  // Step 5 — Lain-lain (section G)
  qLegalIssue: string;
  qTerminated: string;
  qSmoking: boolean;
  qTattoo: boolean;
  qSeriousIllness: string;
  qAllergy: string;
  qSkinLungDisease: string;
  qHereditaryDisease: string;
  qPrevSupervisor: string;
  qStartDate: string;
  qOrganization: string;
  qEmergencyContact: string;
  qRelativeInCompany: string;
  qWorkedAtBst: string;
};

const INITIAL_FORM_DATA: FormData = {
  appliedPosition: "",
  fullName: "",
  nickname: "",
  birthPlace: "",
  birthDate: "",
  gender: "",
  heightCm: "",
  weightKg: "",
  bloodType: "",
  ktpAddress: "",
  homePhone: "",
  currentAddress: "",
  bcaAccount: "",
  citizenship: "",
  personalEmail: "",
  maritalStatus: "",
  childrenCount: "",
  religion: "",
  nik: "",
  phone: "",
  simA: "",
  simB: "",
  simC: "",
  lastJobDescription: "",
  lastSalaryTotal: "",
  expectedSalary: "",
  hasBpjsTk: false,
  bpjsTkNumber: "",
  hasBpjsKes: false,
  bpjsKesNumber: "",
  qLegalIssue: "",
  qTerminated: "",
  qSmoking: false,
  qTattoo: false,
  qSeriousIllness: "",
  qAllergy: "",
  qSkinLungDisease: "",
  qHereditaryDisease: "",
  qPrevSupervisor: "",
  qStartDate: "",
  qOrganization: "",
  qEmergencyContact: "",
  qRelativeInCompany: "",
  qWorkedAtBst: "",
};

function seedFamily(roles: string[], genderByRole?: Record<string, string>): FamilyMember[] {
  return roles.map((role) => ({
    role,
    name: "",
    gender: genderByRole?.[role] ?? "",
    birthDate: "",
    education: "",
    job: "",
  }));
}

const INITIAL_FAMILY_IMMEDIATE: FamilyMember[] = seedFamily(FAMILY_IMMEDIATE_ROLES);
const INITIAL_FAMILY_EXTENDED: FamilyMember[] = seedFamily(FAMILY_EXTENDED_ROLES, {
  Ayah: "L",
  Ibu: "P",
});

const emptyFormalRow = (): FormalEducationRow => ({
  institution: "",
  periodFrom: "",
  periodTo: "",
  major: "",
  place: "",
  diploma: "",
  notes: "",
});
const emptyNonFormalRow = (): NonFormalEducationRow => ({
  training: "",
  organizer: "",
  year: "",
  place: "",
  notes: "",
});
const emptyLanguageRow = (): LanguageRow => ({
  language: "",
  understand: "",
  speak: "",
  read: "",
  write: "",
  notes: "",
});
const emptyWorkRow = (): WorkExperienceRow => ({
  company: "",
  periodFrom: "",
  periodTo: "",
  position: "",
  salary: "",
  recommendation: false,
  reasonLeaving: "",
});

type PhotoState = {
  status: "idle" | "uploading" | "success" | "error";
  url: string | null;
  previewUrl: string | null;
  error: string | null;
};

const INITIAL_PHOTO_STATE: PhotoState = {
  status: "idle",
  url: null,
  previewUrl: null,
  error: null,
};

const STEPS = [
  { title: "Lamaran & Identitas", shortLabel: "Identitas" },
  { title: "Data Keluarga", shortLabel: "Keluarga" },
  { title: "Pendidikan & Bahasa", shortLabel: "Pendidikan" },
  { title: "Pengalaman Kerja", shortLabel: "Pengalaman" },
  { title: "Lain-lain", shortLabel: "Lain-lain" },
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

// Compact input used inside the dynamic tables / cards.
const cellCls =
  "block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100";

const labelCls = "block text-sm font-medium text-slate-800";
const fieldLabelCls = "block text-xs font-medium text-slate-500";
const optionalTag = (
  <span className="text-xs font-normal text-slate-400">(opsional)</span>
);

export function InterviewForm() {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [familyImmediate, setFamilyImmediate] = useState<FamilyMember[]>(
    INITIAL_FAMILY_IMMEDIATE,
  );
  const [familyExtended, setFamilyExtended] = useState<FamilyMember[]>(
    INITIAL_FAMILY_EXTENDED,
  );
  const [formalEducation, setFormalEducation] = useState<FormalEducationRow[]>([
    emptyFormalRow(),
    emptyFormalRow(),
  ]);
  const [nonFormalEducation, setNonFormalEducation] = useState<
    NonFormalEducationRow[]
  >([emptyNonFormalRow()]);
  const [languages, setLanguages] = useState<LanguageRow[]>([emptyLanguageRow()]);
  const [workExperience, setWorkExperience] = useState<WorkExperienceRow[]>([
    emptyWorkRow(),
  ]);
  const [photo, setPhoto] = useState<PhotoState>({ ...INITIAL_PHOTO_STATE });

  const [currentStep, setCurrentStep] = useState(0);
  const [highestStep, setHighestStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);

  const lastFileRef = useRef<File | null>(null);
  const photoRef = useRef(photo);
  useEffect(() => {
    photoRef.current = photo;
  }, [photo]);
  const fullNameRef = useRef(formData.fullName);
  useEffect(() => {
    fullNameRef.current = formData.fullName;
  }, [formData.fullName]);

  // Load draft from localStorage once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          formData?: Partial<FormData>;
          familyImmediate?: FamilyMember[];
          familyExtended?: FamilyMember[];
          formalEducation?: FormalEducationRow[];
          nonFormalEducation?: NonFormalEducationRow[];
          languages?: LanguageRow[];
          workExperience?: WorkExperienceRow[];
          photoUrl?: string | null;
          step?: number;
        };
        if (parsed.formData) {
          setFormData((prev) => ({ ...prev, ...parsed.formData }));
        }
        if (Array.isArray(parsed.familyImmediate) && parsed.familyImmediate.length) {
          setFamilyImmediate(parsed.familyImmediate);
        }
        if (Array.isArray(parsed.familyExtended) && parsed.familyExtended.length) {
          setFamilyExtended(parsed.familyExtended);
        }
        if (Array.isArray(parsed.formalEducation) && parsed.formalEducation.length) {
          setFormalEducation(parsed.formalEducation);
        }
        if (
          Array.isArray(parsed.nonFormalEducation) &&
          parsed.nonFormalEducation.length
        ) {
          setNonFormalEducation(parsed.nonFormalEducation);
        }
        if (Array.isArray(parsed.languages) && parsed.languages.length) {
          setLanguages(parsed.languages);
        }
        if (Array.isArray(parsed.workExperience) && parsed.workExperience.length) {
          setWorkExperience(parsed.workExperience);
        }
        if (parsed.photoUrl) {
          setPhoto({
            status: "success",
            url: parsed.photoUrl,
            previewUrl: parsed.photoUrl,
            error: null,
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

  // Auto-save draft to localStorage (debounced). Store text values + the
  // successfully-uploaded photo URL — never the file itself.
  useEffect(() => {
    if (!draftLoaded) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({
            formData,
            familyImmediate,
            familyExtended,
            formalEducation,
            nonFormalEducation,
            languages,
            workExperience,
            photoUrl: photo.url,
            step: currentStep,
          }),
        );
      } catch {
        /* ignore */
      }
    }, 400);
    return () => clearTimeout(t);
  }, [
    formData,
    familyImmediate,
    familyExtended,
    formalEducation,
    nonFormalEducation,
    languages,
    workExperience,
    photo,
    currentStep,
    draftLoaded,
  ]);

  // Clean up local object URL on unmount.
  useEffect(() => {
    return () => {
      if (photoRef.current.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(photoRef.current.previewUrl);
      }
    };
  }, []);

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  // ── Photo upload ──────────────────────────────────────────────────────────
  async function uploadPhoto(file: File) {
    const localPreview = URL.createObjectURL(file);
    setPhoto((prev) => {
      if (prev.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(prev.previewUrl);
      }
      return { status: "uploading", url: null, previewUrl: localPreview, error: null };
    });

    try {
      if (file.size > MAX_UPLOAD_SIZE_BYTES) {
        throw new Error("Ukuran file maksimal 10MB.");
      }
      const compressed = await compressImage(file);
      const form = new FormData();
      form.append("file", compressed);
      form.append("fullName", fullNameRef.current.trim());

      const res = await fetch("/api/interview/upload", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Gagal mengunggah file.");
      }
      const publicUrl: string = data.publicUrl;
      setPhoto((prev) => {
        if (prev.previewUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(prev.previewUrl);
        }
        return {
          status: "success",
          url: publicUrl,
          previewUrl: publicUrl,
          error: null,
        };
      });
    } catch {
      setPhoto((prev) => ({
        ...prev,
        status: "error",
        error:
          "Gagal mengunggah foto. Periksa koneksi internet Anda lalu coba lagi.",
      }));
    }
  }

  function handleFileInput(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!file) return;
    lastFileRef.current = file;
    void uploadPhoto(file);
  }

  function retryPhoto() {
    if (lastFileRef.current) void uploadPhoto(lastFileRef.current);
  }

  // ── Dynamic-table helpers ──────────────────────────────────────────────────
  function updateFamily(
    which: "immediate" | "extended",
    index: number,
    key: keyof FamilyMember,
    value: string,
  ) {
    const setter = which === "immediate" ? setFamilyImmediate : setFamilyExtended;
    setter((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    );
  }

  function updateRow<T>(
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    index: number,
    key: keyof T,
    value: T[keyof T],
  ) {
    setter((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    );
  }

  function addRow<T>(setter: React.Dispatch<React.SetStateAction<T[]>>, make: () => T) {
    setter((prev) => [...prev, make()]);
  }

  function removeRow<T>(
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    index: number,
  ) {
    setter((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  // ── Validation (only Step 1 gates) ─────────────────────────────────────────
  function validateStep1(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!formData.appliedPosition.trim())
      e.appliedPosition = "Posisi yang dilamar wajib diisi.";
    if (!formData.fullName.trim()) e.fullName = "Nama lengkap wajib diisi.";
    if (!formData.birthPlace.trim()) e.birthPlace = "Tempat lahir wajib diisi.";
    if (!formData.gender) e.gender = "Pilih jenis kelamin Anda.";
    if (!formData.bloodType) e.bloodType = "Pilih golongan darah Anda.";
    if (!formData.ktpAddress.trim())
      e.ktpAddress = "Alamat sesuai KTP wajib diisi.";
    if (!formData.maritalStatus)
      e.maritalStatus = "Pilih status pernikahan Anda.";
    if (!formData.religion) e.religion = "Pilih agama Anda.";
    if (!formData.nik.trim()) e.nik = "No. KTP / NIK wajib diisi.";
    if (!formData.phone.trim()) e.phone = "No. handphone wajib diisi.";
    return e;
  }

  const STEP_VALIDATORS: (() => Record<string, string>)[] = [
    validateStep1,
    () => ({}),
    () => ({}),
    () => ({}),
    () => ({}),
  ];

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
    // Re-check the required (step 1) fields before sending.
    const stepErrors = validateStep1();
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      setCurrentStep(0);
      setSubmitError("Lengkapi data wajib pada langkah pertama terlebih dahulu.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/interview/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appliedPosition: formData.appliedPosition.trim(),
          photoUrl: photo.url,
          fullName: formData.fullName.trim(),
          nickname: formData.nickname.trim(),
          birthPlace: formData.birthPlace.trim(),
          birthDate: formData.birthDate,
          gender: formData.gender,
          heightCm: formData.heightCm.trim(),
          weightKg: formData.weightKg.trim(),
          bloodType: formData.bloodType,
          ktpAddress: formData.ktpAddress.trim(),
          homePhone: formData.homePhone.trim(),
          currentAddress: formData.currentAddress.trim(),
          bcaAccount: formData.bcaAccount.trim(),
          citizenship: formData.citizenship.trim(),
          personalEmail: formData.personalEmail.trim(),
          maritalStatus: formData.maritalStatus,
          childrenCount: formData.childrenCount.trim(),
          religion: formData.religion,
          nik: formData.nik.trim(),
          phone: formData.phone.trim(),
          simA: formData.simA.trim(),
          simB: formData.simB.trim(),
          simC: formData.simC.trim(),
          familyImmediate,
          familyExtended,
          formalEducation,
          nonFormalEducation,
          languages,
          workExperience,
          lastJobDescription: formData.lastJobDescription.trim(),
          lastSalaryTotal: formData.lastSalaryTotal.trim(),
          expectedSalary: formData.expectedSalary.trim(),
          hasBpjsTk: formData.hasBpjsTk,
          bpjsTkNumber: formData.bpjsTkNumber.trim(),
          hasBpjsKes: formData.hasBpjsKes,
          bpjsKesNumber: formData.bpjsKesNumber.trim(),
          qLegalIssue: formData.qLegalIssue.trim(),
          qTerminated: formData.qTerminated.trim(),
          qSmoking: formData.qSmoking,
          qTattoo: formData.qTattoo,
          qSeriousIllness: formData.qSeriousIllness.trim(),
          qAllergy: formData.qAllergy.trim(),
          qSkinLungDisease: formData.qSkinLungDisease.trim(),
          qHereditaryDisease: formData.qHereditaryDisease.trim(),
          qPrevSupervisor: formData.qPrevSupervisor.trim(),
          qStartDate: formData.qStartDate.trim(),
          qOrganization: formData.qOrganization.trim(),
          qEmergencyContact: formData.qEmergencyContact.trim(),
          qRelativeInCompany: formData.qRelativeInCompany.trim(),
          qWorkedAtBst: formData.qWorkedAtBst.trim(),
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

  // ── Success ─────────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-3xl">
          ✓
        </div>
        <h2 className="mt-4 text-lg font-semibold text-emerald-900">
          Terima kasih! Form interview Anda sudah terkirim.
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-emerald-800">
          Tim kami akan meninjau lamaran Anda. Anda boleh menutup halaman ini.
        </p>
      </div>
    );
  }

  // ── Small reusable field renderers ──────────────────────────────────────────
  function textField(
    key: keyof FormData,
    label: string,
    opts?: {
      required?: boolean;
      type?: string;
      inputMode?: "numeric" | "tel" | "email" | "text";
      placeholder?: string;
      autoComplete?: string;
    },
  ) {
    const id = `iv-${String(key)}`;
    return (
      <div>
        <label htmlFor={id} className={labelCls}>
          {label} {opts?.required ? null : optionalTag}
        </label>
        <input
          id={id}
          type={opts?.type ?? "text"}
          inputMode={opts?.inputMode}
          autoComplete={opts?.autoComplete}
          placeholder={opts?.placeholder}
          value={formData[key] as string}
          onChange={(e) => setField(key, e.target.value as FormData[typeof key])}
          className={inputCls(errors[String(key)])}
        />
        {errors[String(key)] && (
          <p className="mt-1.5 text-xs text-rose-600">{errors[String(key)]}</p>
        )}
      </div>
    );
  }

  function textareaField(key: keyof FormData, label: string, rows = 3) {
    const id = `iv-${String(key)}`;
    return (
      <div>
        <label htmlFor={id} className={labelCls}>
          {label}
        </label>
        <textarea
          id={id}
          rows={rows}
          value={formData[key] as string}
          onChange={(e) => setField(key, e.target.value as FormData[typeof key])}
          className={inputCls(errors[String(key)])}
        />
        {errors[String(key)] && (
          <p className="mt-1.5 text-xs text-rose-600">{errors[String(key)]}</p>
        )}
      </div>
    );
  }

  function yesNoToggle(
    key: keyof FormData,
    label: string,
  ) {
    const value = formData[key] as boolean;
    return (
      <div>
        <span className={labelCls}>{label}</span>
        <div className="mt-1.5 grid grid-cols-2 gap-3">
          {[
            { v: true, l: "Ya" },
            { v: false, l: "Tidak" },
          ].map((opt) => {
            const active = value === opt.v;
            return (
              <button
                key={opt.l}
                type="button"
                onClick={() => setField(key, opt.v as FormData[typeof key])}
                aria-pressed={active}
                className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold transition ${
                  active
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                {opt.l}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── STEP 1 ───────────────────────────────────────────────────────────────────
  function renderStep1() {
    return (
      <div className="space-y-5">
        {textField("appliedPosition", "Posisi yang Dilamar", {
          required: true,
          placeholder: "misal: Driver, Admin, Tour Guide",
        })}

        {/* Foto 4x6 */}
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-slate-800">
              Foto 4x6{" "}
              <span className="text-xs font-normal text-slate-400">(opsional)</span>
            </span>
            {photo.status === "success" && (
              <span className="shrink-0 text-lg text-emerald-600">✓</span>
            )}
          </div>
          <div className="mt-3 flex items-center gap-3">
            {photo.previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo.previewUrl}
                alt="Pratinjau foto"
                className="h-24 w-20 shrink-0 rounded-lg border border-slate-200 object-cover"
              />
            ) : (
              <div className="flex h-24 w-20 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-2xl">
                🧑
              </div>
            )}
            <div className="min-w-0 flex-1">
              <label
                htmlFor="iv-photo"
                className={`inline-flex cursor-pointer items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
                  photo.status === "uploading"
                    ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                    : "border-brand-500 bg-white text-brand-700 hover:bg-brand-50"
                }`}
              >
                {photo.status === "uploading"
                  ? "Mengunggah..."
                  : photo.status === "success"
                  ? "Ganti Foto"
                  : "Pilih Foto"}
              </label>
              <input
                id="iv-photo"
                type="file"
                accept="image/*"
                disabled={photo.status === "uploading"}
                onChange={handleFileInput}
                className="sr-only"
              />
              {photo.status === "error" && (
                <div className="mt-2">
                  <p className="text-xs text-rose-600">{photo.error}</p>
                  <button
                    type="button"
                    onClick={retryPhoto}
                    className="mt-1 text-xs font-semibold text-brand-600 underline"
                  >
                    Coba lagi
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {textField("fullName", "Nama Lengkap", { required: true })}
        {textField("nickname", "Nama Panggilan")}
        {textField("birthPlace", "Tempat Lahir", { required: true })}

        <div>
          <label htmlFor="iv-birthDate" className={labelCls}>
            Tanggal Lahir {optionalTag}
          </label>
          <input
            id="iv-birthDate"
            type="date"
            value={formData.birthDate}
            onChange={(e) => setField("birthDate", e.target.value)}
            className={inputCls()}
          />
        </div>

        {/* Jenis Kelamin — segmented */}
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

        <div className="grid grid-cols-2 gap-3">
          {textField("heightCm", "Tinggi Badan (cm)", { inputMode: "numeric" })}
          {textField("weightKg", "Berat Badan (kg)", { inputMode: "numeric" })}
        </div>

        <div>
          <label htmlFor="iv-bloodType" className={labelCls}>
            Golongan Darah
          </label>
          <select
            id="iv-bloodType"
            value={formData.bloodType}
            onChange={(e) =>
              setField("bloodType", e.target.value as BloodType)
            }
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
          <label htmlFor="iv-ktpAddress" className={labelCls}>
            Alamat sesuai KTP
          </label>
          <textarea
            id="iv-ktpAddress"
            rows={3}
            value={formData.ktpAddress}
            onChange={(e) => setField("ktpAddress", e.target.value)}
            className={inputCls(errors.ktpAddress)}
          />
          {errors.ktpAddress && (
            <p className="mt-1.5 text-xs text-rose-600">{errors.ktpAddress}</p>
          )}
        </div>

        {textField("homePhone", "No. Telp Rumah", { type: "tel", inputMode: "tel" })}

        <div>
          <label htmlFor="iv-currentAddress" className={labelCls}>
            Alamat Domisili {optionalTag}
          </label>
          <textarea
            id="iv-currentAddress"
            rows={3}
            value={formData.currentAddress}
            onChange={(e) => setField("currentAddress", e.target.value)}
            className={inputCls()}
          />
        </div>

        {textField("bcaAccount", "No. Rek BCA", { inputMode: "numeric" })}
        {textField("citizenship", "Kewarganegaraan", { placeholder: "WNI" })}
        {textField("personalEmail", "Email Pribadi", {
          type: "email",
          inputMode: "email",
          autoComplete: "email",
        })}

        <div>
          <label htmlFor="iv-maritalStatus" className={labelCls}>
            Status Pernikahan
          </label>
          <select
            id="iv-maritalStatus"
            value={formData.maritalStatus}
            onChange={(e) =>
              setField("maritalStatus", e.target.value as MaritalStatus)
            }
            className={`${inputCls(errors.maritalStatus)} bg-white`}
          >
            <option value="" disabled>
              Pilih status pernikahan
            </option>
            {MARITAL_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {errors.maritalStatus && (
            <p className="mt-1.5 text-xs text-rose-600">{errors.maritalStatus}</p>
          )}
        </div>

        <div>
          <label htmlFor="iv-childrenCount" className={labelCls}>
            Jumlah Anak {optionalTag}
          </label>
          <input
            id="iv-childrenCount"
            type="number"
            min={0}
            inputMode="numeric"
            value={formData.childrenCount}
            onChange={(e) => setField("childrenCount", e.target.value)}
            className={inputCls()}
          />
        </div>

        <div>
          <label htmlFor="iv-religion" className={labelCls}>
            Agama
          </label>
          <select
            id="iv-religion"
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
          <label htmlFor="iv-nik" className={labelCls}>
            No. KTP / NIK
          </label>
          <input
            id="iv-nik"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={formData.nik}
            onChange={(e) => setField("nik", e.target.value)}
            placeholder="16 digit angka"
            className={inputCls(errors.nik)}
          />
          {errors.nik && (
            <p className="mt-1.5 text-xs text-rose-600">{errors.nik}</p>
          )}
        </div>

        {textField("phone", "No. Handphone", {
          required: true,
          type: "tel",
          inputMode: "tel",
          autoComplete: "tel",
          placeholder: "08123456789",
        })}

        <div>
          <span className={labelCls}>
            No. SIM {optionalTag}
          </span>
          <div className="mt-1.5 grid grid-cols-3 gap-3">
            {([
              ["simA", "SIM A"],
              ["simB", "SIM B"],
              ["simC", "SIM C"],
            ] as const).map(([key, lbl]) => (
              <div key={key}>
                <label htmlFor={`iv-${key}`} className={fieldLabelCls}>
                  {lbl}
                </label>
                <input
                  id={`iv-${key}`}
                  type="text"
                  inputMode="numeric"
                  value={formData[key]}
                  onChange={(e) => setField(key, e.target.value)}
                  className={cellCls}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── STEP 2 — Family tables ────────────────────────────────────────────────
  function renderFamilyTable(
    title: string,
    which: "immediate" | "extended",
    rows: FamilyMember[],
  ) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <div className="mt-3 space-y-3">
          {rows.map((row, i) => (
            <div
              key={`${which}-${i}`}
              className="rounded-xl border border-slate-200 bg-slate-50/60 p-3"
            >
              <p className="text-sm font-semibold text-brand-700">{row.role}</p>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={fieldLabelCls}>Nama</label>
                  <input
                    className={cellCls}
                    value={row.name}
                    onChange={(e) =>
                      updateFamily(which, i, "name", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className={fieldLabelCls}>Jenis Kelamin (L/P)</label>
                  <input
                    className={cellCls}
                    maxLength={1}
                    placeholder="L / P"
                    value={row.gender}
                    onChange={(e) =>
                      updateFamily(which, i, "gender", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className={fieldLabelCls}>Tanggal Lahir</label>
                  <input
                    className={cellCls}
                    placeholder="mis. 1990 / 01-01-1990"
                    value={row.birthDate}
                    onChange={(e) =>
                      updateFamily(which, i, "birthDate", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className={fieldLabelCls}>Pendidikan</label>
                  <input
                    className={cellCls}
                    value={row.education}
                    onChange={(e) =>
                      updateFamily(which, i, "education", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className={fieldLabelCls}>Pekerjaan</label>
                  <input
                    className={cellCls}
                    value={row.job}
                    onChange={(e) =>
                      updateFamily(which, i, "job", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderStep2() {
    return (
      <div className="space-y-6">
        <p className="text-xs leading-relaxed text-slate-500">
          Semua kolom di langkah ini opsional. Isi yang relevan dengan keadaan
          Anda, kosongkan baris yang tidak perlu.
        </p>
        {renderFamilyTable("Keluarga Inti", "immediate", familyImmediate)}
        {renderFamilyTable(
          "Keluarga (Ayah / Ibu / Saudara)",
          "extended",
          familyExtended,
        )}
      </div>
    );
  }

  // ── Generic dynamic-table scaffold ──────────────────────────────────────────
  function tableShell(
    title: string,
    onAdd: () => void,
    children: React.ReactNode,
  ) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <div className="mt-3 space-y-3">{children}</div>
        <button
          type="button"
          onClick={onAdd}
          className="mt-3 inline-flex items-center gap-1 rounded-lg border border-brand-500 bg-white px-3.5 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
        >
          + Tambah
        </button>
      </div>
    );
  }

  function rowCard(
    index: number,
    canRemove: boolean,
    onRemove: () => void,
    children: React.ReactNode,
  ) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">
            #{index + 1}
          </span>
          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="text-xs font-semibold text-rose-600 hover:underline"
            >
              Hapus
            </button>
          )}
        </div>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">{children}</div>
      </div>
    );
  }

  // ── STEP 3 — Education & languages ──────────────────────────────────────────
  function renderStep3() {
    return (
      <div className="space-y-6">
        <p className="text-xs leading-relaxed text-slate-500">
          Semua kolom opsional. Tambahkan baris sesuai kebutuhan.
        </p>

        {tableShell(
          "Pendidikan Formal",
          () => addRow(setFormalEducation, emptyFormalRow),
          formalEducation.map((row, i) =>
            rowCard(
              i,
              formalEducation.length > 1,
              () => removeRow(setFormalEducation, i),
              <>
                <div className="sm:col-span-2">
                  <label className={fieldLabelCls}>Institusi</label>
                  <input
                    className={cellCls}
                    value={row.institution}
                    onChange={(e) =>
                      updateRow(setFormalEducation, i, "institution", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className={fieldLabelCls}>Periode Dari</label>
                  <input
                    className={cellCls}
                    value={row.periodFrom}
                    onChange={(e) =>
                      updateRow(setFormalEducation, i, "periodFrom", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className={fieldLabelCls}>Periode Sampai</label>
                  <input
                    className={cellCls}
                    value={row.periodTo}
                    onChange={(e) =>
                      updateRow(setFormalEducation, i, "periodTo", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className={fieldLabelCls}>Jurusan</label>
                  <input
                    className={cellCls}
                    value={row.major}
                    onChange={(e) =>
                      updateRow(setFormalEducation, i, "major", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className={fieldLabelCls}>Tempat</label>
                  <input
                    className={cellCls}
                    value={row.place}
                    onChange={(e) =>
                      updateRow(setFormalEducation, i, "place", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className={fieldLabelCls}>Ijasah</label>
                  <input
                    className={cellCls}
                    value={row.diploma}
                    onChange={(e) =>
                      updateRow(setFormalEducation, i, "diploma", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className={fieldLabelCls}>Keterangan</label>
                  <input
                    className={cellCls}
                    value={row.notes}
                    onChange={(e) =>
                      updateRow(setFormalEducation, i, "notes", e.target.value)
                    }
                  />
                </div>
              </>,
            ),
          ),
        )}

        {tableShell(
          "Pendidikan Non-Formal / Pelatihan / Kursus",
          () => addRow(setNonFormalEducation, emptyNonFormalRow),
          nonFormalEducation.map((row, i) =>
            rowCard(
              i,
              nonFormalEducation.length > 1,
              () => removeRow(setNonFormalEducation, i),
              <>
                <div className="sm:col-span-2">
                  <label className={fieldLabelCls}>Pelatihan</label>
                  <input
                    className={cellCls}
                    value={row.training}
                    onChange={(e) =>
                      updateRow(setNonFormalEducation, i, "training", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className={fieldLabelCls}>Penyelenggara</label>
                  <input
                    className={cellCls}
                    value={row.organizer}
                    onChange={(e) =>
                      updateRow(setNonFormalEducation, i, "organizer", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className={fieldLabelCls}>Tahun</label>
                  <input
                    className={cellCls}
                    value={row.year}
                    onChange={(e) =>
                      updateRow(setNonFormalEducation, i, "year", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className={fieldLabelCls}>Tempat</label>
                  <input
                    className={cellCls}
                    value={row.place}
                    onChange={(e) =>
                      updateRow(setNonFormalEducation, i, "place", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className={fieldLabelCls}>Keterangan</label>
                  <input
                    className={cellCls}
                    value={row.notes}
                    onChange={(e) =>
                      updateRow(setNonFormalEducation, i, "notes", e.target.value)
                    }
                  />
                </div>
              </>,
            ),
          ),
        )}

        {tableShell(
          "Penguasaan Bahasa Asing",
          () => addRow(setLanguages, emptyLanguageRow),
          languages.map((row, i) =>
            rowCard(
              i,
              languages.length > 1,
              () => removeRow(setLanguages, i),
              <>
                <div className="sm:col-span-2">
                  <label className={fieldLabelCls}>Bahasa</label>
                  <input
                    className={cellCls}
                    value={row.language}
                    onChange={(e) =>
                      updateRow(setLanguages, i, "language", e.target.value)
                    }
                  />
                </div>
                {([
                  ["understand", "Memahami"],
                  ["speak", "Berbicara"],
                  ["read", "Membaca"],
                  ["write", "Menulis"],
                ] as const).map(([field, lbl]) => (
                  <div key={field}>
                    <label className={fieldLabelCls}>{lbl}</label>
                    <select
                      className={`${cellCls} bg-white`}
                      value={row[field]}
                      onChange={(e) =>
                        updateRow(
                          setLanguages,
                          i,
                          field,
                          e.target.value as Proficiency,
                        )
                      }
                    >
                      <option value="">-</option>
                      {PROFICIENCY_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <label className={fieldLabelCls}>Keterangan</label>
                  <input
                    className={cellCls}
                    value={row.notes}
                    onChange={(e) =>
                      updateRow(setLanguages, i, "notes", e.target.value)
                    }
                  />
                </div>
              </>,
            ),
          ),
        )}
      </div>
    );
  }

  // ── STEP 4 — Work experience ────────────────────────────────────────────────
  function renderStep4() {
    return (
      <div className="space-y-6">
        <p className="text-xs leading-relaxed text-slate-500">
          Semua kolom opsional. Tambahkan baris untuk setiap pengalaman kerja.
        </p>

        {tableShell(
          "Pengalaman Kerja",
          () => addRow(setWorkExperience, emptyWorkRow),
          workExperience.map((row, i) =>
            rowCard(
              i,
              workExperience.length > 1,
              () => removeRow(setWorkExperience, i),
              <>
                <div className="sm:col-span-2">
                  <label className={fieldLabelCls}>Nama Perusahaan</label>
                  <input
                    className={cellCls}
                    value={row.company}
                    onChange={(e) =>
                      updateRow(setWorkExperience, i, "company", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className={fieldLabelCls}>Periode Dari</label>
                  <input
                    className={cellCls}
                    value={row.periodFrom}
                    onChange={(e) =>
                      updateRow(setWorkExperience, i, "periodFrom", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className={fieldLabelCls}>Periode Sampai</label>
                  <input
                    className={cellCls}
                    value={row.periodTo}
                    onChange={(e) =>
                      updateRow(setWorkExperience, i, "periodTo", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className={fieldLabelCls}>Jabatan</label>
                  <input
                    className={cellCls}
                    value={row.position}
                    onChange={(e) =>
                      updateRow(setWorkExperience, i, "position", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className={fieldLabelCls}>Upah</label>
                  <input
                    className={cellCls}
                    value={row.salary}
                    onChange={(e) =>
                      updateRow(setWorkExperience, i, "salary", e.target.value)
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={fieldLabelCls}>Rekomendasi</label>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    {[
                      { v: true, l: "Ya" },
                      { v: false, l: "Tidak" },
                    ].map((opt) => {
                      const active = row.recommendation === opt.v;
                      return (
                        <button
                          key={opt.l}
                          type="button"
                          onClick={() =>
                            updateRow(
                              setWorkExperience,
                              i,
                              "recommendation",
                              opt.v,
                            )
                          }
                          aria-pressed={active}
                          className={`rounded-lg border-2 px-3 py-2 text-sm font-semibold transition ${
                            active
                              ? "border-brand-500 bg-brand-50 text-brand-700"
                              : "border-slate-200 bg-white text-slate-600"
                          }`}
                        >
                          {opt.l}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className={fieldLabelCls}>Alasan Berhenti</label>
                  <input
                    className={cellCls}
                    value={row.reasonLeaving}
                    onChange={(e) =>
                      updateRow(
                        setWorkExperience,
                        i,
                        "reasonLeaving",
                        e.target.value,
                      )
                    }
                  />
                </div>
              </>,
            ),
          ),
        )}

        {textareaField(
          "lastJobDescription",
          "Uraikan singkat pekerjaan dari jabatan terakhir Anda",
        )}

        {textField("lastSalaryTotal", "Total upah terakhir yang Anda terima (Rp)", {
          inputMode: "numeric",
        })}
        {textField("expectedSalary", "Gaji yang diharapkan (Rp)", {
          inputMode: "numeric",
        })}

        <div className="space-y-3 rounded-xl border border-slate-200 p-4">
          {yesNoToggle(
            "hasBpjsTk",
            "Apakah Anda memiliki Kartu BPJS Ketenagakerjaan?",
          )}
          {formData.hasBpjsTk &&
            textField("bpjsTkNumber", "No. BPJS TK", { inputMode: "numeric" })}
        </div>

        <div className="space-y-3 rounded-xl border border-slate-200 p-4">
          {yesNoToggle(
            "hasBpjsKes",
            "Apakah Anda memiliki Kartu BPJS Kesehatan?",
          )}
          {formData.hasBpjsKes &&
            textField("bpjsKesNumber", "No. BPJS Kesehatan", {
              inputMode: "numeric",
            })}
        </div>
      </div>
    );
  }

  // ── STEP 5 — Lain-lain ──────────────────────────────────────────────────────
  function renderStep5() {
    return (
      <div className="space-y-5">
        <p className="text-xs leading-relaxed text-slate-500">
          Semua pertanyaan opsional, namun mohon diisi sejujur-jujurnya.
        </p>

        {textareaField(
          "qLegalIssue",
          "1. Pernah terlibat masalah hukum hingga proses pengadilan? Jelaskan.",
        )}
        {textareaField(
          "qTerminated",
          "2. Pernah diberhentikan / diskorsing dari tempat kerja? Jelaskan.",
        )}
        {yesNoToggle("qSmoking", "3. Apakah Anda merokok?")}
        {yesNoToggle("qTattoo", "4. Apakah Anda bertatto?")}
        {textareaField(
          "qSeriousIllness",
          "5. Pernah sakit serius / kecelakaan / operasi dalam 5 tahun terakhir? Bila ya, jelaskan.",
        )}
        {textareaField(
          "qAllergy",
          "6. Memiliki alergi atau riwayat penyakit kambuhan? Bila ya, sebutkan.",
        )}
        {textareaField(
          "qSkinLungDisease",
          "7. Memiliki penyakit kulit dan/atau paru-paru? Jelaskan.",
        )}
        {textareaField(
          "qHereditaryDisease",
          "8. Memiliki penyakit bawaan / keturunan dari keluarga? Bila ya, jelaskan.",
        )}
        {textareaField(
          "qPrevSupervisor",
          "9. Nama & no. HP atasan di tempat kerja sebelumnya (untuk referensi).",
          2,
        )}
        {textField("qStartDate", "10. Kapan Anda dapat mulai bekerja?")}
        {textareaField(
          "qOrganization",
          "11. Pernah mengikuti organisasi di tempat kerja atau rumah? Jelaskan.",
        )}
        {textareaField(
          "qEmergencyContact",
          "12. Nama, no. HP, dan hubungan keluarga/kerabat yang bisa dihubungi dalam keadaan darurat.",
        )}
        {textareaField(
          "qRelativeInCompany",
          "13. Punya teman/keluarga/kenalan yang bekerja di perusahaan ini? Tuliskan nama & hubungannya.",
        )}
        {textareaField(
          "qWorkedAtBst",
          "14. Pernah bekerja di Bali Sun Tours atau afiliasinya? Jika ya, jelaskan lokasi & periode.",
        )}

        <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs italic leading-relaxed text-slate-600">
          Dengan ini saya menyatakan bahwa semua informasi di atas adalah benar.
          Setiap ketidakbenaran atau penyimpangan informasi dalam formulir ini
          dapat dijadikan sebagai dasar untuk menolak lamaran saya, maupun
          pemberhentian tanpa ganti rugi apabila saya telah diterima bekerja.
        </p>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
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

      {/* Active step card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          {STEPS[currentStep].title}
        </h2>
        <div className="mt-4">
          {currentStep === 0 && renderStep1()}
          {currentStep === 1 && renderStep2()}
          {currentStep === 2 && renderStep3()}
          {currentStep === 3 && renderStep4()}
          {currentStep === 4 && renderStep5()}
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
            : "Kirim Form Interview"}
        </button>
      </div>
    </form>
  );
}
