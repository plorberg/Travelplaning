import type { Metadata } from "next";
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
      <body>{children}</body>
    </html>
  );
}
