"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/dashboard", label: "VAK Test", match: /^\/dashboard(\/kandidat.*)?$/ },
  { href: "/dashboard/rsvp", label: "RSVP Events", match: /^\/dashboard\/rsvp.*$/ },
];

export function DashboardTabs() {
  const pathname = usePathname() ?? "";
  return (
    <nav className="-mb-px flex gap-2 text-sm">
      {tabs.map((t) => {
        const active = t.match.test(pathname);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`border-b-2 px-3 py-2.5 font-medium transition ${
              active
                ? "border-brand-500 text-brand-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
