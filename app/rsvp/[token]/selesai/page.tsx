import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  formatEventDateTime,
  formatSubmittedAt,
  STATUS_LABEL,
  type RSVPStatus,
} from "@/lib/rsvp-utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { token: string };
}): Promise<Metadata> {
  const event = await prisma.rSVPEvent.findUnique({
    where: { token: params.token },
    select: { title: true },
  });
  const title = event ? `RSVP Tersimpan · ${event.title}` : "RSVP Tersimpan";
  const description = event
    ? `RSVP untuk "${event.title}" telah tersimpan. Terima kasih dari Bali Sun Tours.`
    : "RSVP Anda telah tersimpan.";
  return {
    title,
    description,
    openGraph: { title: `${title} — Bali Sun Tours`, description, type: "website" },
  };
}

export default async function RSVPFinishedPage({
  params,
  searchParams,
}: {
  params: { token: string };
  searchParams: { name?: string };
}) {
  const event = await prisma.rSVPEvent.findUnique({
    where: { token: params.token },
    select: { id: true, title: true, eventAt: true },
  });
  if (!event) notFound();

  const queryName = searchParams.name?.trim();
  const response = queryName
    ? await prisma.rSVPResponse.findFirst({
        where: {
          eventId: event.id,
          name: { equals: queryName, mode: "insensitive" },
        },
        orderBy: { submittedAt: "desc" },
      })
    : null;

  const label = response ? STATUS_LABEL[response.status as RSVPStatus] : null;

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-md">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-3xl">
            ✅
          </div>
          <h1 className="mt-4 text-xl font-semibold text-slate-900">
            Terima kasih{response ? `, ${response.name}` : ""}!
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            RSVP Anda telah tercatat.
          </p>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <dl className="space-y-3 text-sm">
            <Row label="Event" value={event.title} />
            <Row label="Tanggal" value={formatEventDateTime(event.eventAt)} />
            {response && (
              <>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500">Status RSVP</dt>
                  <dd>
                    {label && (
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${label.cls}`}
                      >
                        {label.text}
                      </span>
                    )}
                  </dd>
                </div>
                <Row label="Waktu Submit" value={formatSubmittedAt(response.submittedAt)} />
              </>
            )}
          </dl>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Halaman ini bisa Anda tutup. RSVP bersifat final dan tidak bisa diubah.
        </p>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right text-slate-900">{value}</dd>
    </div>
  );
}
