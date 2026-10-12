import type { Metadata } from "next";
import { InterviewForm } from "./interview-form";

export const metadata: Metadata = {
  title: "Form Interview",
  description: "Form interview pelamar kerja Bali Sun Tours.",
  openGraph: {
    title: "Form Interview — Bali Sun Tours",
    description: "Form interview pelamar kerja Bali Sun Tours.",
    type: "website",
  },
};

export default function InterviewPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50/50 via-white to-white px-4 pb-16 pt-8 sm:pt-12">
      <div className="mx-auto w-full max-w-2xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-600">
            Bali Sun Tours
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Form Interview
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
            MOHON DIISI DENGAN DATA YANG LENGKAP DAN SEBENAR-BENARNYA
            MENGGUNAKAN HURUF CETAK/BALOK. Data yang Anda isi digunakan untuk
            proses seleksi pelamar kerja di Bali Sun Tours.
          </p>
        </div>

        <div className="mt-6">
          <InterviewForm />
        </div>
      </div>
    </main>
  );
}
