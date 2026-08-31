import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Mitra Driver",
  description:
    "Data resmi mitra driver (KTP, KK, NPWP, BPJS, dll) yang dikumpulkan untuk keperluan administrasi.",
};

export default function DriverPartnersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
