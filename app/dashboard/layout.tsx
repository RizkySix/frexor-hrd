import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SignOutButton } from "./sign-out-button";
import { DashboardTabs } from "./dashboard-tabs";

export const metadata: Metadata = {
  title: "Tes Gaya Kerja (VAK)",
  description: "Kelola tes gaya kerja kandidat Bali Sun Tours.",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/dashboard" className="flex items-baseline gap-2">
            <span className="text-sm font-bold uppercase tracking-[0.15em] text-brand-600">
              Bali Sun Tours
            </span>
            <span className="hidden text-sm text-slate-400 sm:inline">·</span>
            <span className="hidden text-sm text-slate-500 sm:inline">Talent Portal</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-slate-600 sm:inline">
              {session?.user?.name ?? session?.user?.email}
            </span>
            <SignOutButton />
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <DashboardTabs />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
