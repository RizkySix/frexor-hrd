import type { Metadata } from "next";
import { DriverPartnerForm } from "./driver-partner-form";

export const metadata: Metadata = {
  title: "Data Mitra Driver",
  description:
    "Isi data lengkap dan unggah dokumen (KTP, KK, NPWP) — untuk mitra driver Bali Sun Tours.",
  openGraph: {
    title: "Data Mitra Driver — Bali Sun Tours",
    description:
      "Isi data lengkap dan unggah dokumen (KTP, KK, NPWP) — untuk mitra driver Bali Sun Tours.",
    type: "website",
  },
};

export default function DriverPartnersPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50/50 via-white to-white px-4 pb-16 pt-8 sm:pt-12">
      <div className="mx-auto w-full max-w-2xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-600">
            Bali Sun Tours
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Data Mitra Driver
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
            Formulir ini mengumpulkan data resmi Anda (sesuai KTP, KK, dan NPWP)
            untuk keperluan administrasi dan legal kemitraan dengan Bali Sun
            Tours. Isi dengan data yang benar dan lengkap, ya.
          </p>
        </div>

        <div className="mt-6">
          <DriverPartnerForm />
        </div>
      </div>
    </main>
  );
}
