import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { TestForm } from "./test-form";

export const dynamic = "force-dynamic";

export default async function TestPage({ params }: { params: { token: string } }) {
  const candidate = await prisma.candidate.findUnique({
    where: { token: params.token },
    select: {
      id: true,
      name: true,
      position: true,
      expiresAt: true,
      submittedAt: true,
    },
  });

  if (!candidate) {
    return <NotFoundCard />;
  }

  if (candidate.submittedAt) {
    redirect(`/tes/${params.token}/selesai`);
  }

  const isExpired = Date.now() > candidate.expiresAt.getTime();
  if (isExpired) {
    return <ExpiredCard />;
  }

  return (
    <TestForm
      token={params.token}
      candidate={{ name: candidate.name, position: candidate.position }}
    />
  );
}

function ExpiredCard() {
  return (
    <CenteredCard
      title="Link sudah kadaluarsa"
      message="Link tes ini sudah lebih dari 7 hari sejak dibuat. Silakan hubungi HRD untuk meminta link baru."
    />
  );
}

function NotFoundCard() {
  return (
    <CenteredCard
      title="Link tidak ditemukan"
      message="Pastikan kamu membuka link yang benar. Jika ragu, hubungi HRD untuk konfirmasi."
    />
  );
}

function CenteredCard({ title, message }: { title: string; message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
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
