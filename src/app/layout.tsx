import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { SignOutButton } from "@/app/_components/SignOutButton";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Travelplaning",
  description:
    "Reisen planen, organisieren und verwalten – allein oder mit einer kleinen Gruppe.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  return (
    <html lang="de">
      <body>
        <header className="topbar">
          <div className="topbar-inner">
            <Link href="/" className="brand">
              ✈ Travelplaning
            </Link>
            {user ? (
              <nav className="topbar-nav">
                <Link href="/dashboard" className="btn btn-ghost">Dashboard</Link>
                <span className="topbar-email">{user.email}</span>
                <SignOutButton />
              </nav>
            ) : null}
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
