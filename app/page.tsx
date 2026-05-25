import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-xl text-center">
        <p className="text-sm uppercase tracking-wider text-brand-600">Frexor</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">VAK Working Style Test</h1>
        <p className="mt-4 text-slate-600">
          Tool internal HRD untuk mengidentifikasi gaya belajar dan bekerja kandidat
          (Visual / Auditory / Kinesthetic).
        </p>
        <Link
          href="/login"
          className="mt-8 inline-block rounded-md bg-brand-500 px-6 py-3 text-sm font-medium text-white shadow hover:bg-brand-600"
        >
          Login HRD
        </Link>
      </div>
    </main>
  );
}
