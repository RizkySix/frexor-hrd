import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ukuran Baju Driver",
  description: "Data ukuran baju driver untuk keperluan pemesanan seragam.",
};

export default function DriverSizesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
