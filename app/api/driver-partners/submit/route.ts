import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  BLOOD_TYPE_OPTIONS,
  LAST_EDUCATION_OPTIONS,
  MARITAL_STATUS_OPTIONS,
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

type Body = {
  fullName?: unknown;
  birthPlace?: unknown;
  birthDate?: unknown;
  gender?: unknown;
  bloodType?: unknown;
  address?: unknown;
  religion?: unknown;
  maritalStatus?: unknown;
  nik?: unknown;
  kkNumber?: unknown;
  npwp?: unknown;
  ptkpStatus?: unknown;
  bpjsKesehatan?: unknown;
  statusKesehatan?: unknown;
  bpjsKetenagakerjaan?: unknown;
  noRekening?: unknown;
  phone?: unknown;
  email?: unknown;
  currentAddress?: unknown;
  lastEducation?: unknown;
  emergencyPhone?: unknown;
  roketAccountName?: unknown;
  workStartDate?: unknown;
  ktpPhotoUrl?: unknown;
  kkPhotoUrl?: unknown;
  npwpPhotoUrl?: unknown;
};

const VALID_GENDERS: DriverGender[] = GENDER_OPTIONS.map((o) => o.value);
const VALID_BLOOD_TYPES: BloodType[] = BLOOD_TYPE_OPTIONS.map((o) => o.value);
const VALID_RELIGIONS: Religion[] = RELIGION_OPTIONS.map((o) => o.value);
const VALID_MARITAL_STATUSES: MaritalStatus[] = MARITAL_STATUS_OPTIONS.map(
  (o) => o.value,
);
const VALID_LAST_EDUCATIONS: LastEducation[] = LAST_EDUCATION_OPTIONS.map(
  (o) => o.value,
);

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalStr(value: unknown): string | null {
  const v = str(value);
  return v === "" ? null : v;
}

function parseDate(value: unknown): Date | null {
  const v = str(value);
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }

  const fullName = str(body.fullName);
  if (!fullName) {
    return NextResponse.json(
      { error: "Nama lengkap wajib diisi." },
      { status: 400 },
    );
  }

  const birthPlace = str(body.birthPlace);
  if (!birthPlace) {
    return NextResponse.json(
      { error: "Tempat lahir wajib diisi." },
      { status: 400 },
    );
  }

  const birthDate = parseDate(body.birthDate);
  if (!birthDate) {
    return NextResponse.json(
      { error: "Tanggal lahir wajib diisi dengan format tanggal yang valid." },
      { status: 400 },
    );
  }

  const gender = body.gender;
  if (typeof gender !== "string" || !VALID_GENDERS.includes(gender as DriverGender)) {
    return NextResponse.json(
      { error: "Jenis kelamin wajib dipilih." },
      { status: 400 },
    );
  }

  const bloodType = body.bloodType;
  if (
    typeof bloodType !== "string" ||
    !VALID_BLOOD_TYPES.includes(bloodType as BloodType)
  ) {
    return NextResponse.json(
      { error: "Golongan darah wajib dipilih." },
      { status: 400 },
    );
  }

  const address = str(body.address);
  if (!address) {
    return NextResponse.json(
      { error: "Alamat sesuai KTP wajib diisi." },
      { status: 400 },
    );
  }

  const religion = body.religion;
  if (
    typeof religion !== "string" ||
    !VALID_RELIGIONS.includes(religion as Religion)
  ) {
    return NextResponse.json(
      { error: "Agama wajib dipilih." },
      { status: 400 },
    );
  }

  const maritalStatus = body.maritalStatus;
  if (
    typeof maritalStatus !== "string" ||
    !VALID_MARITAL_STATUSES.includes(maritalStatus as MaritalStatus)
  ) {
    return NextResponse.json(
      { error: "Status perkawinan wajib dipilih." },
      { status: 400 },
    );
  }

  const nikRaw = str(body.nik);
  if (!nikRaw) {
    return NextResponse.json(
      { error: "NIK (Nomor KTP) wajib diisi." },
      { status: 400 },
    );
  }
  if (!isValidNik(nikRaw)) {
    return NextResponse.json(
      { error: "NIK harus 16 digit angka." },
      { status: 400 },
    );
  }
  const nik = normalizeDigits(nikRaw);

  const kkRaw = str(body.kkNumber);
  if (!kkRaw) {
    return NextResponse.json(
      { error: "Nomor KK wajib diisi." },
      { status: 400 },
    );
  }
  if (!isValidKk(kkRaw)) {
    return NextResponse.json(
      { error: "Nomor KK harus 16 digit angka." },
      { status: 400 },
    );
  }
  const kkNumber = normalizeDigits(kkRaw);

  const npwpRaw = str(body.npwp);
  if (!isValidNpwp(npwpRaw)) {
    return NextResponse.json(
      { error: "NPWP harus 15 atau 16 digit angka." },
      { status: 400 },
    );
  }
  const npwp = npwpRaw ? normalizeDigits(npwpRaw) : null;

  const phone = str(body.phone);
  if (!phone) {
    return NextResponse.json(
      { error: "Nomor telepon/HP wajib diisi." },
      { status: 400 },
    );
  }

  let lastEducation: LastEducation | null = null;
  const lastEducationRaw = str(body.lastEducation);
  if (lastEducationRaw) {
    if (!VALID_LAST_EDUCATIONS.includes(lastEducationRaw as LastEducation)) {
      return NextResponse.json(
        { error: "Pendidikan terakhir tidak valid." },
        { status: 400 },
      );
    }
    lastEducation = lastEducationRaw as LastEducation;
  }

  const workStartDate = parseDate(body.workStartDate);

  const ktpPhotoUrl = str(body.ktpPhotoUrl);
  if (!ktpPhotoUrl) {
    return NextResponse.json(
      { error: "Foto KTP wajib diunggah." },
      { status: 400 },
    );
  }

  const kkPhotoUrl = str(body.kkPhotoUrl);
  if (!kkPhotoUrl) {
    return NextResponse.json(
      { error: "Foto KK wajib diunggah." },
      { status: 400 },
    );
  }

  const npwpPhotoUrl = optionalStr(body.npwpPhotoUrl);

  const data = {
    fullName,
    birthPlace,
    birthDate,
    gender: gender as DriverGender,
    bloodType: bloodType as BloodType,
    address,
    religion: religion as Religion,
    maritalStatus: maritalStatus as MaritalStatus,
    kkNumber,
    npwp,
    ptkpStatus: optionalStr(body.ptkpStatus),
    bpjsKesehatan: optionalStr(body.bpjsKesehatan),
    statusKesehatan: optionalStr(body.statusKesehatan),
    bpjsKetenagakerjaan: optionalStr(body.bpjsKetenagakerjaan),
    noRekening: optionalStr(body.noRekening),
    phone,
    email: optionalStr(body.email),
    currentAddress: optionalStr(body.currentAddress),
    lastEducation,
    emergencyPhone: optionalStr(body.emergencyPhone),
    roketAccountName: optionalStr(body.roketAccountName),
    workStartDate,
    ktpPhotoUrl,
    kkPhotoUrl,
    npwpPhotoUrl,
  };

  await prisma.driverPartner.upsert({
    where: { nik },
    create: { nik, ...data },
    update: data,
  });

  return NextResponse.json({ ok: true });
}
