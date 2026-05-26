import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  formatEventDateTime,
  isRSVPExpired,
  parseDropdownOptions,
} from "@/lib/rsvp-utils";
import { RSVPResponseTable } from "./response-table";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const event = await prisma.rSVPEvent.findUnique({
    where: { id: params.id },
    select: { title: true },
  });
  if (!event) return { title: "Event Tidak Ditemukan" };
  return {
    title: `RSVP · ${event.title}`,
    description: `Rekap kehadiran untuk event "${event.title}" — Bali Sun Tours.`,
  };
}

export default async function RSVPDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const event = await prisma.rSVPEvent.findUnique({
    where: { id: params.id },
    include: {
      responses: { orderBy: { submittedAt: "desc" } },
    },
  });

  if (!event || event.createdBy !== session.user.id) notFound();

  const expired = isRSVPExpired(event);
  const dd = parseDropdownOptions(event.dropdownOptions);
  const hadir = event.responses.filter((r) => r.status === "HADIR").length;
  const tidakHadir = event.responses.filter((r) => r.status === "TIDAK_HADIR").length;

  const responses = event.responses.map((r) => ({
    id: r.id,
    name: r.name,
    dropdownValue: r.dropdownValue,
    status: r.status as "HADIR" | "TIDAK_HADIR",
    reason: r.reason,
    submittedAt: r.submittedAt.toISOString(),
  }));

  return (
    <div>
      <Link href="/dashboard/rsvp" className="text-sm text-brand-600 hover:underline">
        ← Kembali ke RSVP Events
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{event.title}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {formatEventDateTime(event.eventAt)}
          </p>
          {event.description && (
            <p className="mt-2 max-w-2xl text-sm text-slate-700">{event.description}</p>
          )}
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
            expired ? "bg-gray-100 text-gray-600" : "bg-green-100 text-green-800"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              expired ? "bg-gray-400" : "bg-green-500"
            }`}
          />
          {expired ? "Ditutup" : "Aktif"}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Stat label="Total Responden" value={event.responses.length} />
        <Stat label="Hadir" value={hadir} tone="green" />
        <Stat label="Tidak Hadir" value={tidakHadir} tone="red" />
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Daftar Responden</h2>
        <a
          href={`/api/rsvp/events/${event.id}/export`}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          ⬇ Export CSV
        </a>
      </div>

      <div className="mt-3">
        <RSVPResponseTable
          responses={responses}
          dropdownLabel={dd?.label ?? null}
        />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "brand",
}: {
  label: string;
  value: number;
  tone?: "brand" | "green" | "red";
}) {
  const styles = {
    brand: { num: "text-brand-700", dot: "bg-brand-500" },
    green: { num: "text-green-700", dot: "bg-green-500" },
    red: { num: "text-red-700", dot: "bg-red-500" },
  } as const;
  const s = styles[tone];
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-slate-500">
        <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
        {label}
      </div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${s.num}`}>{value}</div>
    </div>
  );
}
