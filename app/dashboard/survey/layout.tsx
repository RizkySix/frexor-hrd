import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Employee Satisfaction Survey",
  description: "Hasil analisis survei kepuasan karyawan Bali Sun Tours.",
};

export default function SurveyDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
