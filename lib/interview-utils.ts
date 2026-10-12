// Shared types + option lists for the Interview form (FO-HR.SUN-008/FI).
// Re-exports the identity enums already defined for driver partners so the
// interview UI imports everything from one place.
export {
  GENDER_OPTIONS,
  GENDER_LABELS,
  type DriverGender,
} from "@/lib/driver-size-utils";

export {
  BLOOD_TYPE_OPTIONS,
  BLOOD_TYPE_LABELS,
  RELIGION_OPTIONS,
  RELIGION_LABELS,
  MARITAL_STATUS_OPTIONS,
  MARITAL_STATUS_LABELS,
  type BloodType,
  type Religion,
  type MaritalStatus,
} from "@/lib/driver-partner-utils";

export const ALLOWED_IMAGE_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

// E. Penguasaan Bahasa Asing — Baik / Cukup / Kurang.
export type Proficiency = "BAIK" | "CUKUP" | "KURANG" | "";

export const PROFICIENCY_OPTIONS: { value: Exclude<Proficiency, "">; label: string }[] = [
  { value: "BAIK", label: "Baik" },
  { value: "CUKUP", label: "Cukup" },
  { value: "KURANG", label: "Kurang" },
];

export const PROFICIENCY_LABELS: Record<Exclude<Proficiency, "">, string> = {
  BAIK: "Baik",
  CUKUP: "Cukup",
  KURANG: "Kurang",
};

// ── JSON row shapes stored on InterviewSubmission ──────────────────────────

// B. Data Keluarga
export type FamilyMember = {
  role: string; // "Isteri / Suami", "Anak 1", "Ayah", "Saudara 1", ...
  name: string;
  gender: string; // "L" | "P" | "" (free, kept as entered)
  birthDate: string;
  education: string;
  job: string;
};

// C. Pendidikan Formal
export type FormalEducationRow = {
  institution: string;
  periodFrom: string;
  periodTo: string;
  major: string;
  place: string;
  diploma: string; // Ijasah
  notes: string;
};

// D. Pendidikan Non-Formal / Pelatihan / Kursus
export type NonFormalEducationRow = {
  training: string;
  organizer: string;
  year: string;
  place: string;
  notes: string;
};

// E. Penguasaan Bahasa Asing
export type LanguageRow = {
  language: string;
  understand: Proficiency;
  speak: Proficiency;
  read: Proficiency;
  write: Proficiency;
  notes: string;
};

// F. Pengalaman Kerja
export type WorkExperienceRow = {
  company: string;
  periodFrom: string;
  periodTo: string;
  position: string;
  salary: string;
  recommendation: boolean; // Ada / Tidak
  reasonLeaving: string;
};

// Default role labels mirroring the printed form, used to seed the family
// tables so applicants fill the same rows as the paper form.
export const FAMILY_IMMEDIATE_ROLES = ["Isteri / Suami", "Anak 1", "Anak 2", "Anak 3"];
export const FAMILY_EXTENDED_ROLES = [
  "Ayah",
  "Ibu",
  "Saudara 1",
  "Saudara 2",
  "Saudara 3",
  "Saudara 4",
];

// Safe array coercion for reading the JSON columns back out.
export function asRows<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

// Type consumed by the admin dashboard list + detail modal.
export type InterviewRecord = {
  id: string;
  appliedPosition: string;
  photoUrl: string | null;
  fullName: string;
  nickname: string | null;
  birthPlace: string;
  birthDate: string | null;
  gender: string;
  heightCm: string | null;
  weightKg: string | null;
  bloodType: string;
  ktpAddress: string;
  homePhone: string | null;
  currentAddress: string | null;
  bcaAccount: string | null;
  citizenship: string | null;
  personalEmail: string | null;
  maritalStatus: string;
  childrenCount: number | null;
  religion: string;
  nik: string;
  phone: string;
  simA: string | null;
  simB: string | null;
  simC: string | null;
  familyImmediate: unknown;
  familyExtended: unknown;
  formalEducation: unknown;
  nonFormalEducation: unknown;
  languages: unknown;
  workExperience: unknown;
  lastJobDescription: string | null;
  lastSalaryTotal: string | null;
  expectedSalary: string | null;
  hasBpjsTk: boolean;
  bpjsTkNumber: string | null;
  hasBpjsKes: boolean;
  bpjsKesNumber: string | null;
  qLegalIssueYes: boolean;
  qLegalIssue: string | null;
  qTerminatedYes: boolean;
  qTerminated: string | null;
  qSmoking: boolean;
  qTattoo: boolean;
  qSeriousIllnessYes: boolean;
  qSeriousIllness: string | null;
  qAllergyYes: boolean;
  qAllergy: string | null;
  qSkinLungDiseaseYes: boolean;
  qSkinLungDisease: string | null;
  qHereditaryDiseaseYes: boolean;
  qHereditaryDisease: string | null;
  qPrevSupervisor: string | null;
  qStartDate: string | null;
  qOrganization: string | null;
  qEmergencyContact: string | null;
  qRelativeInCompany: string | null;
  qWorkedAtBst: string | null;
  submittedAt: string;
  updatedAt: string;
};
