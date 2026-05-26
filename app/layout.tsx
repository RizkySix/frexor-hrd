import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

const SITE_URL = "https://talent.balisuntours.com";
const SITE_NAME = "Bali Sun Tours Talent";
const DEFAULT_TITLE = "Talent Portal — Bali Sun Tours";
const DEFAULT_DESC =
  "Portal talent management Bali Sun Tours: tes gaya kerja kandidat dan RSVP event karyawan.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: "%s — Bali Sun Tours",
  },
  description: DEFAULT_DESC,
  applicationName: SITE_NAME,
  authors: [{ name: "Bali Sun Tours" }],
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESC,
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESC,
  },
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
