import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Travelplaning",
  description: "Plan, organize, and manage trips — solo or with a small group.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
