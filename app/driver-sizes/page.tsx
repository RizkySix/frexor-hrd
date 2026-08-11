import type { Metadata } from "next";
import { DriverSizeForm } from "./driver-size-form";

export const metadata: Metadata = {
  title: "Ukuran Baju Driver",
  description:
    "Isi data ukuran baju seragam Anda — untuk driver Bali Sun Tours.",
  openGraph: {
    title: "Ukuran Baju Driver — Bali Sun Tours",
    description:
      "Isi data ukuran baju seragam Anda — untuk driver Bali Sun Tours.",
    type: "website",
  },
};

export default function DriverSizesPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50/50 via-white to-white px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-md">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-600">
            Bali Sun Tours
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Ukuran Baju Driver
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-600">
            Isi data di bawah ini untuk pemesanan baju seragam driver.
            Pastikan nomor WhatsApp yang Anda masukkan aktif, ya.
          </p>
        </div>

        <div className="mt-6">
          <DriverSizeForm />
        </div>
      </div>
    </main>
  );
}
