"use client";

import { formatSubmittedAt } from "@/lib/rsvp-utils";
import {
  GENDER_LABELS,
  BLOOD_TYPE_LABELS,
  RELIGION_LABELS,
  MARITAL_STATUS_LABELS,
  PROFICIENCY_LABELS,
  asRows,
  type InterviewRecord,
  type FamilyMember,
  type FormalEducationRow,
  type NonFormalEducationRow,
  type LanguageRow,
  type WorkExperienceRow,
  type Proficiency,
  type DriverGender,
  type BloodType,
  type Religion,
  type MaritalStatus,
} from "@/lib/interview-utils";

type Props = {
  submission: InterviewRecord;
  onClose: () => void;
};

function display(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  const s = String(value);
  if (s.trim() === "") return "-";
  return s;
}

function yesNo(value: boolean): string {
  return value ? "Ya" : "Tidak";
}

// For section-G questions carrying a Yes/No flag + explanation.
function yesNoWithText(yes: boolean, text: string | null | undefined): string {
  if (!yes) return "Tidak";
  const t = (text ?? "").trim();
  return t ? `Ya — ${t}` : "Ya";
}

function labelFrom<K extends string>(
  map: Record<K, string>,
  value: string | null | undefined,
): string {
  if (!value || value.trim() === "") return "-";
  return (map as Record<string, string>)[value] ?? value;
}

function prof(value: Proficiency | null | undefined): string {
  if (!value || value.trim() === "") return "-";
  return PROFICIENCY_LABELS[value as Exclude<Proficiency, "">] ?? value;
}

function formatDateOnly(d: string | null | undefined): string {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Makassar",
  });
}

export function InterviewDetailModal({ submission, onClose }: Props) {
  const familyImmediate = asRows<FamilyMember>(submission.familyImmediate);
  const familyExtended = asRows<FamilyMember>(submission.familyExtended);
  const formalEducation = asRows<FormalEducationRow>(submission.formalEducation);
  const nonFormalEducation = asRows<NonFormalEducationRow>(
    submission.nonFormalEducation,
  );
  const languages = asRows<LanguageRow>(submission.languages);
  const workExperience = asRows<WorkExperienceRow>(submission.workExperience);

  const heightWeight =
    submission.heightCm || submission.weightKg
      ? `${display(submission.heightCm)} cm / ${display(submission.weightKg)} kg`
      : "-";

  const simParts = [
    submission.simA ? "A" : null,
    submission.simB ? "B" : null,
    submission.simC ? "C" : null,
  ].filter(Boolean);
  const simValue = simParts.length > 0 ? simParts.join(", ") : "-";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <PhotoThumb url={submission.photoUrl} />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Melamar untuk
              </p>
              <p className="text-base font-semibold text-brand-700">
                {display(submission.appliedPosition)}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">
                {submission.fullName}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div className="mt-5 space-y-5">
          <Section title="A. Identitas">
            <Fields>
              <Field label="Nama Lengkap" value={display(submission.fullName)} />
              <Field label="Nama Panggilan" value={display(submission.nickname)} />
              <Field label="Tempat Lahir" value={display(submission.birthPlace)} />
              <Field label="Tanggal Lahir" value={formatDateOnly(submission.birthDate)} />
              <Field
                label="Jenis Kelamin"
                value={labelFrom<DriverGender>(GENDER_LABELS, submission.gender)}
              />
              <Field label="Tinggi / Berat Badan" value={heightWeight} />
              <Field
                label="Golongan Darah"
                value={labelFrom<BloodType>(BLOOD_TYPE_LABELS, submission.bloodType)}
              />
              <Field
                label="Agama"
                value={labelFrom<Religion>(RELIGION_LABELS, submission.religion)}
              />
              <Field
                label="Status Perkawinan"
                value={labelFrom<MaritalStatus>(MARITAL_STATUS_LABELS, submission.maritalStatus)}
              />
              <Field label="Jumlah Anak" value={display(submission.childrenCount)} />
              <Field label="Kewarganegaraan" value={display(submission.citizenship)} />
              <Field label="NIK" value={display(submission.nik)} mono />
              <Field label="No. HP" value={display(submission.phone)} />
              <Field label="No. Telp Rumah" value={display(submission.homePhone)} />
              <Field label="Email Pribadi" value={display(submission.personalEmail)} />
              <Field label="No. Rekening BCA" value={display(submission.bcaAccount)} mono />
              <Field label="SIM" value={simValue} />
              <Field label="Alamat KTP" value={display(submission.ktpAddress)} full />
              <Field label="Alamat Domisili" value={display(submission.currentAddress)} full />
            </Fields>
          </Section>

          <Section title="B. Data Keluarga">
            <p className="mb-2 text-xs font-medium text-slate-500">
              Keluarga Inti (Suami/Isteri &amp; Anak)
            </p>
            <FamilyTable members={familyImmediate} />
            <p className="mb-2 mt-4 text-xs font-medium text-slate-500">
              Keluarga Lain (Orang Tua &amp; Saudara)
            </p>
            <FamilyTable members={familyExtended} />
          </Section>

          <Section title="C. Pendidikan Formal">
            <DataTable
              columns={["Institusi", "Periode", "Jurusan", "Tempat", "Ijasah", "Catatan"]}
              rows={formalEducation.map((r) => [
                display(r.institution),
                periodText(r.periodFrom, r.periodTo),
                display(r.major),
                display(r.place),
                display(r.diploma),
                display(r.notes),
              ])}
            />
          </Section>

          <Section title="D. Pendidikan Non-Formal">
            <DataTable
              columns={["Pelatihan / Kursus", "Penyelenggara", "Tahun", "Tempat", "Catatan"]}
              rows={nonFormalEducation.map((r) => [
                display(r.training),
                display(r.organizer),
                display(r.year),
                display(r.place),
                display(r.notes),
              ])}
            />
          </Section>

          <Section title="E. Penguasaan Bahasa Asing">
            <DataTable
              columns={["Bahasa", "Mengerti", "Berbicara", "Membaca", "Menulis", "Catatan"]}
              rows={languages.map((r) => [
                display(r.language),
                prof(r.understand),
                prof(r.speak),
                prof(r.read),
                prof(r.write),
                display(r.notes),
              ])}
            />
          </Section>

          <Section title="F. Pengalaman Kerja">
            <DataTable
              columns={[
                "Perusahaan",
                "Periode",
                "Jabatan",
                "Upah",
                "Rekomendasi",
                "Alasan Berhenti",
              ]}
              rows={workExperience.map((r) => [
                display(r.company),
                periodText(r.periodFrom, r.periodTo),
                display(r.position),
                display(r.salary),
                r.recommendation ? "Ada" : "Tidak",
                display(r.reasonLeaving),
              ])}
            />
            <div className="mt-3">
              <Fields>
                <Field
                  label="Uraian Jabatan Terakhir"
                  value={display(submission.lastJobDescription)}
                  full
                />
                <Field label="Total Upah Terakhir" value={display(submission.lastSalaryTotal)} />
                <Field label="Gaji Diharapkan" value={display(submission.expectedSalary)} />
                <Field
                  label="BPJS Ketenagakerjaan"
                  value={
                    submission.hasBpjsTk
                      ? `Ya — ${display(submission.bpjsTkNumber)}`
                      : "Tidak"
                  }
                />
                <Field
                  label="BPJS Kesehatan"
                  value={
                    submission.hasBpjsKes
                      ? `Ya — ${display(submission.bpjsKesNumber)}`
                      : "Tidak"
                  }
                />
              </Fields>
            </div>
          </Section>

          <Section title="G. Lain-lain">
            <Fields>
              <Field
                label="1. Pernah terlibat masalah hukum hingga pengadilan?"
                value={yesNoWithText(submission.qLegalIssueYes, submission.qLegalIssue)}
                full
              />
              <Field
                label="2. Pernah diberhentikan/diskorsing dari tempat kerja?"
                value={yesNoWithText(submission.qTerminatedYes, submission.qTerminated)}
                full
              />
              <Field label="3. Apakah Anda merokok?" value={yesNo(submission.qSmoking)} />
              <Field label="4. Apakah Anda bertatto?" value={yesNo(submission.qTattoo)} />
              <Field
                label="5. Pernah sakit serius/kecelakaan/operasi (5 th terakhir)?"
                value={yesNoWithText(submission.qSeriousIllnessYes, submission.qSeriousIllness)}
                full
              />
              <Field
                label="6. Memiliki alergi atau penyakit kambuhan?"
                value={yesNoWithText(submission.qAllergyYes, submission.qAllergy)}
                full
              />
              <Field
                label="7. Memiliki penyakit kulit dan/atau paru-paru?"
                value={yesNoWithText(submission.qSkinLungDiseaseYes, submission.qSkinLungDisease)}
                full
              />
              <Field
                label="8. Memiliki penyakit bawaan/keturunan dari keluarga?"
                value={yesNoWithText(submission.qHereditaryDiseaseYes, submission.qHereditaryDisease)}
                full
              />
              <Field
                label="Nama atasan di tempat kerja sebelumnya"
                value={display(submission.qPrevSupervisor)}
              />
              <Field
                label="Kapan Anda bisa mulai bekerja?"
                value={display(submission.qStartDate)}
              />
              <Field
                label="Kegiatan organisasi yang pernah/sedang diikuti"
                value={display(submission.qOrganization)}
                full
              />
              <Field
                label="Kontak yang bisa dihubungi dalam keadaan darurat"
                value={display(submission.qEmergencyContact)}
                full
              />
              <Field
                label="Apakah ada kerabat yang bekerja di perusahaan ini?"
                value={display(submission.qRelativeInCompany)}
                full
              />
              <Field
                label="Apakah Anda pernah bekerja di Bali Sun Tours?"
                value={display(submission.qWorkedAtBst)}
                full
              />
            </Fields>
          </Section>
        </div>

        <p className="mt-5 text-xs text-slate-500">
          Diisi {formatSubmittedAt(submission.submittedAt)} · Terakhir diperbarui{" "}
          {formatSubmittedAt(submission.updatedAt)}
        </p>

        <div className="mt-4 flex items-center justify-end">
          <button
            onClick={onClose}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

function periodText(from: string | null | undefined, to: string | null | undefined): string {
  const f = from && from.trim() !== "" ? from : "";
  const t = to && to.trim() !== "" ? to : "";
  if (!f && !t) return "-";
  return `${f || "?"} – ${t || "?"}`;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Fields({ children }: { children: React.ReactNode }) {
  return <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">{children}</dl>;
}

function Field({
  label,
  value,
  full,
  mono,
}: {
  label: string;
  value: string;
  full?: boolean;
  mono?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd
        className={`mt-0.5 break-words text-sm text-slate-800 ${mono ? "font-mono" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

function DataTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-slate-500">-</p>;
  }
  return (
    <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
          <tr>
            {columns.map((c) => (
              <th key={c} className="whitespace-nowrap px-3 py-2">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, i) => (
            <tr key={i} className="align-top">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 text-slate-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FamilyTable({ members }: { members: FamilyMember[] }) {
  return (
    <DataTable
      columns={["Hubungan", "Nama", "Jenis Kelamin", "Tgl Lahir", "Pendidikan", "Pekerjaan"]}
      rows={members.map((m) => [
        display(m.role),
        display(m.name),
        display(m.gender),
        display(m.birthDate),
        display(m.education),
        display(m.job),
      ])}
    />
  );
}

function PhotoThumb({ url }: { url: string | null }) {
  if (!url) {
    return (
      <div className="flex h-24 w-20 shrink-0 items-center justify-center rounded-md border border-dashed border-slate-300 bg-white px-1 text-center text-[11px] text-slate-400">
        Foto tidak diunggah
      </div>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block shrink-0 overflow-hidden rounded-md border border-slate-200 transition hover:opacity-80"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="Foto pelamar" className="h-24 w-20 rounded-md object-cover" />
    </a>
  );
}
