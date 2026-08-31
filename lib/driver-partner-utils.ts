export { GENDER_OPTIONS } from "@/lib/driver-size-utils";

export type BloodType = "A" | "B" | "AB" | "O" | "UNKNOWN";

export const BLOOD_TYPE_OPTIONS: { value: BloodType; label: string }[] = [
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "AB", label: "AB" },
  { value: "O", label: "O" },
  { value: "UNKNOWN", label: "Tidak Tahu" },
];

export const BLOOD_TYPE_LABELS: Record<BloodType, string> = {
  A: "A",
  B: "B",
  AB: "AB",
  O: "O",
  UNKNOWN: "Tidak Tahu",
};

export type Religion =
  | "ISLAM"
  | "KRISTEN"
  | "KATOLIK"
  | "HINDU"
  | "BUDDHA"
  | "KONGHUCU"
  | "LAINNYA";

export const RELIGION_OPTIONS: { value: Religion; label: string }[] = [
  { value: "ISLAM", label: "Islam" },
  { value: "KRISTEN", label: "Kristen" },
  { value: "KATOLIK", label: "Katolik" },
  { value: "HINDU", label: "Hindu" },
  { value: "BUDDHA", label: "Buddha" },
  { value: "KONGHUCU", label: "Konghucu" },
  { value: "LAINNYA", label: "Lainnya" },
];

export const RELIGION_LABELS: Record<Religion, string> = {
  ISLAM: "Islam",
  KRISTEN: "Kristen",
  KATOLIK: "Katolik",
  HINDU: "Hindu",
  BUDDHA: "Buddha",
  KONGHUCU: "Konghucu",
  LAINNYA: "Lainnya",
};

export type MaritalStatus =
  | "BELUM_KAWIN"
  | "KAWIN"
  | "CERAI_HIDUP"
  | "CERAI_MATI";

export const MARITAL_STATUS_OPTIONS: { value: MaritalStatus; label: string }[] = [
  { value: "BELUM_KAWIN", label: "Belum Kawin" },
  { value: "KAWIN", label: "Kawin" },
  { value: "CERAI_HIDUP", label: "Cerai Hidup" },
  { value: "CERAI_MATI", label: "Cerai Mati" },
];

export const MARITAL_STATUS_LABELS: Record<MaritalStatus, string> = {
  BELUM_KAWIN: "Belum Kawin",
  KAWIN: "Kawin",
  CERAI_HIDUP: "Cerai Hidup",
  CERAI_MATI: "Cerai Mati",
};

export const PTKP_OPTIONS: string[] = [
  "TK/0",
  "TK/1",
  "TK/2",
  "TK/3",
  "K/0",
  "K/1",
  "K/2",
  "K/3",
];

export type LastEducation =
  | "SD"
  | "SMP"
  | "SMA_SMK"
  | "D3"
  | "S1"
  | "S2"
  | "S3"
  | "LAINNYA";

export const LAST_EDUCATION_OPTIONS: { value: LastEducation; label: string }[] = [
  { value: "SD", label: "SD" },
  { value: "SMP", label: "SMP" },
  { value: "SMA_SMK", label: "SMA/SMK" },
  { value: "D3", label: "D3" },
  { value: "S1", label: "S1" },
  { value: "S2", label: "S2" },
  { value: "S3", label: "S3" },
  { value: "LAINNYA", label: "Lainnya" },
];

export const LAST_EDUCATION_LABELS: Record<LastEducation, string> = {
  SD: "SD",
  SMP: "SMP",
  SMA_SMK: "SMA/SMK",
  D3: "D3",
  S1: "S1",
  S2: "S2",
  S3: "S3",
  LAINNYA: "Lainnya",
};

/**
 * Strip everything except digits from a raw string (NIK, KK, NPWP, phone, etc).
 */
export function normalizeDigits(raw: string): string {
  return raw.trim().replace(/\D/g, "");
}

/**
 * NIK (Nomor KTP) must be exactly 16 digits.
 */
export function isValidNik(raw: string): boolean {
  return normalizeDigits(raw).length === 16;
}

/**
 * Nomor KK (Kartu Keluarga) must be exactly 16 digits.
 */
export function isValidKk(raw: string): boolean {
  return normalizeDigits(raw).length === 16;
}

/**
 * NPWP is optional. When provided, Indonesia has both the legacy 15-digit
 * format and the newer 16-digit format (aligned with NIK), so accept either.
 */
export function isValidNpwp(raw: string): boolean {
  if (raw.trim() === "") return true;
  const digits = normalizeDigits(raw);
  return digits.length === 15 || digits.length === 16;
}
