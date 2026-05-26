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
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
            expired ? "bg-gray-100 text-gray-600" : "bg-green-100 text-green-800"
          }`}
        >
          {expired ? "Ditutup" : "Aktif"}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Stat label="Total Responden" value={event.responses.length} />
        <Stat label="Hadir" value={hadir} tone="green" />
        <Stat label="Tidak Hadir" value={tidakHadir} tone="rose" />
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
  tone?: "brand" | "green" | "rose";
}) {
  const colors = {
    brand: "text-brand-700",
    green: "text-green-700",
    rose: "text-rose-700",
  };
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${colors[tone]}`}>{value}</div>
    </div>
  );
}
