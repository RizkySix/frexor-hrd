export type DropdownOptions = {
  label: string;
  options: string[];
} | null;

export type RSVPStatus = "HADIR" | "TIDAK_HADIR";

export function isRSVPExpired(event: { eventAt: Date | string }): boolean {
  const t = typeof event.eventAt === "string" ? new Date(event.eventAt) : event.eventAt;
  return Date.now() >= t.getTime();
}

const ID_TZ = "Asia/Jakarta"; // WIB (UTC+7)

export function formatEventDateTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  // Contoh: "Senin, 2 Juni 2025 • 09:00 WIB"
  const tanggal = date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: ID_TZ,
  });
  const jam = date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: ID_TZ,
  });
  return `${tanggal} • ${jam} WIB`;
}

export function formatSubmittedAt(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: ID_TZ,
  });
}

export function parseDropdownOptions(raw: unknown): DropdownOptions {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as { label?: unknown; options?: unknown };
  if (typeof obj.label !== "string") return null;
  if (!Array.isArray(obj.options)) return null;
  const opts = obj.options.filter((o): o is string => typeof o === "string");
  if (opts.length === 0) return null;
  return { label: obj.label, options: opts };
}

export const STATUS_LABEL: Record<RSVPStatus, { text: string; cls: string }> = {
  HADIR: { text: "Hadir", cls: "bg-green-100 text-green-800" },
  TIDAK_HADIR: { text: "Tidak Hadir", cls: "bg-red-100 text-red-800" },
};

export function escapeCsv(value: string | null | undefined): string {
  const v = value ?? "-";
  // Lindungi dari injection sederhana + escape kutip ganda
  return `"${v.replace(/"/g, '""')}"`;
}
