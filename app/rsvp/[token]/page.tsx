import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  formatEventDateTime,
  isRSVPExpired,
  parseDropdownOptions,
} from "@/lib/rsvp-utils";
import { RSVPForm } from "./rsvp-form";

export const dynamic = "force-dynamic";

export default async function RSVPPage({
  params,
}: {
  params: { token: string };
}) {
  const event = await prisma.rSVPEvent.findUnique({
    where: { token: params.token },
    select: {
      id: true,
      title: true,
      description: true,
      eventAt: true,
      dropdownOptions: true,
    },
  });

  if (!event) {
    return (
      <CenteredCard
        title="Link tidak ditemukan"
        message="Pastikan link yang Anda buka benar. Hubungi HRD untuk konfirmasi."
      />
    );
  }

  if (isRSVPExpired(event)) {
    return (
      <CenteredCard
        title="Form RSVP sudah ditutup"
        message="Waktu pengisian RSVP untuk event ini sudah lewat. Silakan hubungi HRD jika ada pertanyaan."
      />
    );
  }

  const dd = parseDropdownOptions(event.dropdownOptions);

  return (
    <RSVPForm
      token={params.token}
      event={{
        title: event.title,
        description: event.description,
        eventAt: event.eventAt.toISOString(),
        eventAtFormatted: formatEventDateTime(event.eventAt),
        dropdown: dd,
      }}
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
