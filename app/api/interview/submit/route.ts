import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  BLOOD_TYPE_OPTIONS,
  GENDER_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  RELIGION_OPTIONS,
  type BloodType,
  type DriverGender,
  type MaritalStatus,
  type Religion,
  type Proficiency,
} from "@/lib/interview-utils";

const VALID_GENDERS: string[] = GENDER_OPTIONS.map((o) => o.value);
const VALID_BLOOD_TYPES: string[] = BLOOD_TYPE_OPTIONS.map((o) => o.value);
const VALID_RELIGIONS: string[] = RELIGION_OPTIONS.map((o) => o.value);
const VALID_MARITAL: string[] = MARITAL_STATUS_OPTIONS.map((o) => o.value);
const VALID_PROFICIENCY: string[] = ["BAIK", "CUKUP", "KURANG", ""];

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}
function optStr(v: unknown): string | null {
  const s = str(v);
  return s === "" ? null : s;
}
function bool(v: unknown): boolean {
  return v === true || v === "true";
}
function parseDate(v: unknown): Date | null {
  const s = str(v);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}
function intOrNull(v: unknown): number | null {
  const s = str(v);
  if (!s) return null;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
function rowField(row: Record<string, unknown>, key: string): string {
  return typeof row[key] === "string" ? (row[key] as string).trim() : "";
}
function proficiency(v: unknown): Proficiency {
  const s = str(v).toUpperCase();
  return (VALID_PROFICIENCY.includes(s) ? s : "") as Proficiency;
}
function asObjectArray(v: unknown): Record<string, unknown>[] {
  return Array.isArray(v)
    ? v.filter((x): x is Record<string, unknown> => !!x && typeof x === "object" && !Array.isArray(x))
    : [];
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }

  const appliedPosition = str(body.appliedPosition);
  if (!appliedPosition) {
    return NextResponse.json({ error: "Posisi yang dilamar wajib diisi." }, { status: 400 });
  }
  const fullName = str(body.fullName);
  if (!fullName) {
    return NextResponse.json({ error: "Nama lengkap wajib diisi." }, { status: 400 });
  }
  const nickname = str(body.nickname);
  if (!nickname) {
    return NextResponse.json({ error: "Nama panggilan wajib diisi." }, { status: 400 });
  }
  const birthPlace = str(body.birthPlace);
  if (!birthPlace) {
    return NextResponse.json({ error: "Tempat lahir wajib diisi." }, { status: 400 });
  }
  const gender = str(body.gender);
  if (!VALID_GENDERS.includes(gender)) {
    return NextResponse.json({ error: "Jenis kelamin wajib dipilih." }, { status: 400 });
  }
  const bloodType = str(body.bloodType);
  if (!VALID_BLOOD_TYPES.includes(bloodType)) {
    return NextResponse.json({ error: "Golongan darah wajib dipilih." }, { status: 400 });
  }
  const ktpAddress = str(body.ktpAddress);
  if (!ktpAddress) {
    return NextResponse.json({ error: "Alamat sesuai KTP wajib diisi." }, { status: 400 });
  }
  const religion = str(body.religion);
  if (!VALID_RELIGIONS.includes(religion)) {
    return NextResponse.json({ error: "Agama wajib dipilih." }, { status: 400 });
  }
  const maritalStatus = str(body.maritalStatus);
  if (!VALID_MARITAL.includes(maritalStatus)) {
    return NextResponse.json({ error: "Status pernikahan wajib dipilih." }, { status: 400 });
  }
  const nik = str(body.nik);
  if (!nik) {
    return NextResponse.json({ error: "No. KTP (NIK) wajib diisi." }, { status: 400 });
  }
  const phone = str(body.phone);
  if (!phone) {
    return NextResponse.json({ error: "No. handphone wajib diisi." }, { status: 400 });
  }

  // ── Nested sections (JSON) — keep only meaningfully-filled rows ──────────
  const familyImmediate = asObjectArray(body.familyImmediate)
    .map((r) => ({
      role: rowField(r, "role"),
      name: rowField(r, "name"),
      gender: rowField(r, "gender"),
      birthDate: rowField(r, "birthDate"),
      education: rowField(r, "education"),
      job: rowField(r, "job"),
    }))
    .filter((r) => r.name || r.birthDate || r.education || r.job);

  const familyExtended = asObjectArray(body.familyExtended)
    .map((r) => ({
      role: rowField(r, "role"),
      name: rowField(r, "name"),
      gender: rowField(r, "gender"),
      birthDate: rowField(r, "birthDate"),
      education: rowField(r, "education"),
      job: rowField(r, "job"),
    }))
    .filter((r) => r.name || r.birthDate || r.education || r.job);

  const formalEducation = asObjectArray(body.formalEducation)
    .map((r) => ({
      institution: rowField(r, "institution"),
      periodFrom: rowField(r, "periodFrom"),
      periodTo: rowField(r, "periodTo"),
      major: rowField(r, "major"),
      place: rowField(r, "place"),
      diploma: rowField(r, "diploma"),
      notes: rowField(r, "notes"),
    }))
    .filter((r) => r.institution || r.major || r.place || r.diploma);

  const nonFormalEducation = asObjectArray(body.nonFormalEducation)
    .map((r) => ({
      training: rowField(r, "training"),
      organizer: rowField(r, "organizer"),
      year: rowField(r, "year"),
      place: rowField(r, "place"),
      notes: rowField(r, "notes"),
    }))
    .filter((r) => r.training || r.organizer || r.place);

  const languages = asObjectArray(body.languages)
    .map((r) => ({
      language: rowField(r, "language"),
      understand: proficiency(r.understand),
      speak: proficiency(r.speak),
      read: proficiency(r.read),
      write: proficiency(r.write),
      notes: rowField(r, "notes"),
    }))
    .filter((r) => r.language);

  const workExperience = asObjectArray(body.workExperience)
    .map((r) => ({
      company: rowField(r, "company"),
      periodFrom: rowField(r, "periodFrom"),
      periodTo: rowField(r, "periodTo"),
      position: rowField(r, "position"),
      salary: rowField(r, "salary"),
      recommendation: bool(r.recommendation),
      reasonLeaving: rowField(r, "reasonLeaving"),
    }))
    .filter((r) => r.company || r.position);

  // At least one formal-education row and one work-experience row.
  if (formalEducation.length === 0) {
    return NextResponse.json(
      { error: "Minimal 1 riwayat pendidikan formal wajib diisi." },
      { status: 400 },
    );
  }
  if (workExperience.length === 0) {
    return NextResponse.json(
      { error: "Minimal 1 riwayat pengalaman kerja wajib diisi." },
      { status: 400 },
    );
  }

  // BPJS numbers required when the applicant has the card.
  const hasBpjsTk = bool(body.hasBpjsTk);
  const bpjsTkNumber = str(body.bpjsTkNumber);
  if (hasBpjsTk && !bpjsTkNumber) {
    return NextResponse.json(
      { error: "No. BPJS Ketenagakerjaan wajib diisi." },
      { status: 400 },
    );
  }
  const hasBpjsKes = bool(body.hasBpjsKes);
  const bpjsKesNumber = str(body.bpjsKesNumber);
  if (hasBpjsKes && !bpjsKesNumber) {
    return NextResponse.json(
      { error: "No. BPJS Kesehatan wajib diisi." },
      { status: 400 },
    );
  }

  // Section G: questions 1,2,5,6,7,8 carry a Yes/No flag; when Yes, the
  // explanation is required. Questions 10 & 11 are always required.
  const gYesNo: {
    yes: boolean;
    text: string;
    label: string;
  }[] = [
    { yes: bool(body.qLegalIssueYes), text: str(body.qLegalIssue), label: "masalah hukum" },
    { yes: bool(body.qTerminatedYes), text: str(body.qTerminated), label: "pernah diberhentikan/diskorsing" },
    { yes: bool(body.qSeriousIllnessYes), text: str(body.qSeriousIllness), label: "sakit serius/kecelakaan/operasi" },
    { yes: bool(body.qAllergyYes), text: str(body.qAllergy), label: "alergi/penyakit kambuhan" },
    { yes: bool(body.qSkinLungDiseaseYes), text: str(body.qSkinLungDisease), label: "penyakit kulit/paru-paru" },
    { yes: bool(body.qHereditaryDiseaseYes), text: str(body.qHereditaryDisease), label: "penyakit bawaan/keturunan" },
  ];
  for (const q of gYesNo) {
    if (q.yes && !q.text) {
      return NextResponse.json(
        { error: `Penjelasan untuk pertanyaan "${q.label}" wajib diisi.` },
        { status: 400 },
      );
    }
  }

  const qStartDate = str(body.qStartDate);
  if (!qStartDate) {
    return NextResponse.json(
      { error: "Pertanyaan no. 10 (kapan dapat mulai bekerja) wajib diisi." },
      { status: 400 },
    );
  }
  const qOrganization = str(body.qOrganization);
  if (!qOrganization) {
    return NextResponse.json(
      { error: "Pertanyaan no. 11 (organisasi) wajib diisi." },
      { status: 400 },
    );
  }

  try {
    await prisma.interviewSubmission.create({
      data: {
        appliedPosition,
        photoUrl: optStr(body.photoUrl),
        fullName,
        nickname,
        birthPlace,
        birthDate: parseDate(body.birthDate),
        gender: gender as DriverGender,
        heightCm: optStr(body.heightCm),
        weightKg: optStr(body.weightKg),
        bloodType: bloodType as BloodType,
        ktpAddress,
        homePhone: optStr(body.homePhone),
        currentAddress: optStr(body.currentAddress),
        bcaAccount: optStr(body.bcaAccount),
        citizenship: optStr(body.citizenship),
        personalEmail: optStr(body.personalEmail),
        maritalStatus: maritalStatus as MaritalStatus,
        childrenCount: intOrNull(body.childrenCount),
        religion: religion as Religion,
        nik,
        phone,
        simA: optStr(body.simA),
        simB: optStr(body.simB),
        simC: optStr(body.simC),
        familyImmediate,
        familyExtended,
        formalEducation,
        nonFormalEducation,
        languages,
        workExperience,
        lastJobDescription: optStr(body.lastJobDescription),
        lastSalaryTotal: optStr(body.lastSalaryTotal),
        expectedSalary: optStr(body.expectedSalary),
        hasBpjsTk,
        bpjsTkNumber: hasBpjsTk ? bpjsTkNumber : null,
        hasBpjsKes,
        bpjsKesNumber: hasBpjsKes ? bpjsKesNumber : null,
        qLegalIssueYes: gYesNo[0].yes,
        qLegalIssue: gYesNo[0].yes ? gYesNo[0].text : null,
        qTerminatedYes: gYesNo[1].yes,
        qTerminated: gYesNo[1].yes ? gYesNo[1].text : null,
        qSmoking: bool(body.qSmoking),
        qTattoo: bool(body.qTattoo),
        qSeriousIllnessYes: gYesNo[2].yes,
        qSeriousIllness: gYesNo[2].yes ? gYesNo[2].text : null,
        qAllergyYes: gYesNo[3].yes,
        qAllergy: gYesNo[3].yes ? gYesNo[3].text : null,
        qSkinLungDiseaseYes: gYesNo[4].yes,
        qSkinLungDisease: gYesNo[4].yes ? gYesNo[4].text : null,
        qHereditaryDiseaseYes: gYesNo[5].yes,
        qHereditaryDisease: gYesNo[5].yes ? gYesNo[5].text : null,
        qPrevSupervisor: optStr(body.qPrevSupervisor),
        qStartDate,
        qOrganization,
        qEmergencyContact: optStr(body.qEmergencyContact),
        qRelativeInCompany: optStr(body.qRelativeInCompany),
        qWorkedAtBst: optStr(body.qWorkedAtBst),
      },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Gagal menyimpan data. Silakan coba lagi." },
      { status: 500 },
    );
  }
}
