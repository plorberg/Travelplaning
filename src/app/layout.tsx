import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeToggle } from "@/app/_components/ThemeToggle";

// Runs before paint so a saved theme choice applies without a flash of the
// wrong colors. Kept tiny and inlined for that reason.
const THEME_INIT = `(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

export const metadata: Metadata = {
  title: "Travelplaning",
  description: "Plan, organize, and manage trips — solo or with a small group.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1216" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}
