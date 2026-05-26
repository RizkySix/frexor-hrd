import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RSVP Events",
  description: "Kelola event RSVP karyawan Bali Sun Tours.",
};

export default function RSVPDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
