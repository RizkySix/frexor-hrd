"use client";

import { formatSubmittedAt } from "@/lib/rsvp-utils";
import {
  BLOOD_TYPE_OPTIONS,
  LAST_EDUCATION_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  RELIGION_OPTIONS,
  type BloodType,
  type LastEducation,
  type MaritalStatus,
  type Religion,
} from "@/lib/driver-partner-utils";
import { GENDER_OPTIONS, type DriverGender } from "@/lib/driver-size-utils";
import type { DriverPartner } from "./page";

type Props = {
  partner: DriverPartner;
  onClose: () => void;
};

function labelFor<T extends string>(
  options: { value: T; label: string }[],
  value: T | null | undefined,
): string {
  if (!value) return "–";
  return options.find((o) => o.value === value)?.label ?? value;
}

function display(value: string | null | undefined): string {
  if (!value || value.trim() === "") return "–";
  return value;
}

function formatDateOnly(d: string | null | undefined): string {
  if (!d) return "–";
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Makassar",
  });
}

export function DriverPartnerDetailModal({ partner, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{partner.fullName}</h2>
            <p className="mt-1 text-xs text-slate-500">
              Diisi {formatSubmittedAt(partner.submittedAt)} · Terakhir diperbarui{" "}
              {formatSubmittedAt(partner.updatedAt)}
            </p>
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
          <Section title="Data KTP">
            <Fields>
              <Field label="Nama Lengkap" value={display(partner.fullName)} />
              <Field label="Tempat Lahir" value={display(partner.birthPlace)} />
              <Field label="Tanggal Lahir" value={formatDateOnly(partner.birthDate)} />
              <Field label="Jenis Kelamin" value={labelFor<DriverGender>(GENDER_OPTIONS, partner.gender)} />
              <Field label="Golongan Darah" value={labelFor<BloodType>(BLOOD_TYPE_OPTIONS, partner.bloodType)} />
              <Field label="Agama" value={labelFor<Religion>(RELIGION_OPTIONS, partner.religion)} />
              <Field
                label="Status Perkawinan"
                value={labelFor<MaritalStatus>(MARITAL_STATUS_OPTIONS, partner.maritalStatus)}
              />
              <Field label="NIK" value={display(partner.nik)} mono />
              <Field label="No. KK" value={display(partner.kkNumber)} mono />
              <Field label="Alamat KTP" value={display(partner.address)} full />
            </Fields>
          </Section>

          <Section title="Data Pajak">
            <Fields>
              <Field label="NPWP" value={display(partner.npwp)} mono />
              <Field label="Status PTKP" value={display(partner.ptkpStatus)} />
            </Fields>
          </Section>

          <Section title="Data Rekening">
            <Fields>
              <Field label="No. Rekening (Roket)" value={display(partner.noRekening)} mono />
            </Fields>
          </Section>

          <Section title="Kontak & Data Tambahan">
            <Fields>
              <Field label="No. HP" value={display(partner.phone)} />
              <Field label="Email" value={display(partner.email)} />
              <Field label="Nama Kerabat" value={display(partner.emergencyName)} />
              <Field label="No. HP Darurat" value={display(partner.emergencyPhone)} />
              <Field
                label="Pendidikan Terakhir"
                value={labelFor<LastEducation>(LAST_EDUCATION_OPTIONS, partner.lastEducation)}
              />
              <Field label="Nama Panggung" value={display(partner.roketAccountName)} />
              <Field label="Mulai Bekerja" value={formatDateOnly(partner.workStartDate)} />
              <Field label="Alamat Domisili" value={display(partner.currentAddress)} full />
            </Fields>
          </Section>

          <Section title="Dokumen">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <DocThumb label="KTP" url={partner.ktpPhotoUrl} />
              <DocThumb label="KK" url={partner.kkPhotoUrl} />
              <DocThumb label="NPWP" url={partner.npwpPhotoUrl} />
            </div>
          </Section>
        </div>

        <div className="mt-6 flex items-center justify-end">
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

function DocThumb({ label, url }: { label: string; url: string | null }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-slate-500">{label}</p>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block overflow-hidden rounded-md border border-slate-200 transition hover:opacity-80"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={`Foto ${label}`}
            className="h-28 w-full rounded-md object-cover"
          />
        </a>
      ) : (
        <div className="flex h-28 w-full items-center justify-center rounded-md border border-dashed border-slate-300 bg-white text-xs text-slate-400">
          Tidak diunggah
        </div>
      )}
    </div>
  );
}
