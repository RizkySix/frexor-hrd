import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-brand-50 px-6">
      <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand-100 opacity-60 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-amber-100 opacity-60 blur-3xl" />

      <div className="relative max-w-xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
          Bali Sun Tours
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Talent Portal
        </h1>
        <p className="mt-4 text-base text-slate-600">
          Portal internal Bali Sun Tours untuk talent management — tes gaya kerja
          kandidat (VAK) dan RSVP event karyawan, dalam satu tempat.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition hover:bg-brand-600"
        >
          Login HRD
          <span aria-hidden>→</span>
        </Link>
        <p className="mt-6 text-xs text-slate-400">
          Akses hanya untuk tim HRD Bali Sun Tours.
        </p>
      </div>
    </main>
  );
}
