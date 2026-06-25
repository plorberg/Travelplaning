import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Travelplaning",
  description:
    "Reisen planen, organisieren und verwalten – allein oder mit einer kleinen Gruppe.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>
        <header className="topbar">
          <div className="topbar-inner">
            <Link href="/" className="brand">
              ✈ Travelplaning
            </Link>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
