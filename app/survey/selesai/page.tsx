import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terima Kasih",
  description: "Terima kasih telah mengisi survei kepuasan karyawan Bali Sun Tours.",
};

export default function SurveyDonePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-3xl">
          🙏
        </div>
        <h1 className="mt-4 text-xl font-semibold text-slate-900">
          Terima kasih atas partisipasi Anda!
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Jawaban Anda telah tersimpan secara anonim. Masukan Anda sangat berharga
          untuk membantu Bali Sun Tours terus berkembang.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Kembali ke beranda
        </Link>
      </div>
    </main>
  );
}
