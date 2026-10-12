import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Form Interview",
  description:
    "Data interview pelamar kerja yang dikumpulkan untuk keperluan rekrutmen HRD.",
};

export default function InterviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
