export const SHIRT_SIZES = [
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "XXXL",
  "XXXXL",
] as const;

export type ShirtSize = (typeof SHIRT_SIZES)[number];

export const SHIRT_SIZE_LABELS: Record<ShirtSize, string> = {
  S: "S",
  M: "M",
  L: "L",
  XL: "XL",
  XXL: "2XL",
  XXXL: "3XL",
  XXXXL: "4XL",
};

export type DriverGender = "MALE" | "FEMALE";

export const GENDER_OPTIONS: { value: DriverGender; label: string }[] = [
  { value: "MALE", label: "Laki-laki" },
  { value: "FEMALE", label: "Perempuan" },
];

export const GENDER_LABELS: Record<DriverGender, string> = {
  MALE: "Laki-laki",
  FEMALE: "Perempuan",
};

/**
 * Normalize an Indonesian phone number into a digits-only dedup key.
 * "0812...", "62812...", "+62812..." all normalize to the same "62812..." key.
 */
export function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  const digitsOnly = trimmed.replace(/\D/g, "");
  if (digitsOnly.startsWith("0")) {
    return "62" + digitsOnly.slice(1);
  }
  return digitsOnly;
}
