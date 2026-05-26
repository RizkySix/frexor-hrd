import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login HRD",
  description: "Masuk ke Talent Portal Bali Sun Tours untuk tim HRD.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
