import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { SignOutButton } from "@/app/_components/SignOutButton";
import { ServiceWorkerRegister } from "@/app/_components/ServiceWorkerRegister";
import { ThemeToggle } from "@/app/_components/ThemeToggle";

// Applies a saved theme choice before paint so there's no flash of the wrong
// colors; the OS preference is used when no choice has been made.
const THEME_INIT = `(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1d4ed8" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1216" },
  ],
};

export const metadata: Metadata = {
  title: "Travelplaning",
  description:
    "Reisen planen, organisieren und verwalten – allein oder mit einer kleinen Gruppe.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Travelplaning",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  return (
    <html lang="de" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        <header className="topbar">
          <div className="topbar-inner">
            <Link href="/" className="brand">
              ✈ Travelplaning
            </Link>
            <nav className="topbar-nav">
              <ThemeToggle />
              {user ? (
                <>
                  <Link href="/dashboard" className="btn btn-ghost">Dashboard</Link>
                  <span className="topbar-email">{user.email}</span>
                  <SignOutButton />
                </>
              ) : null}
            </nav>
          </div>
        </header>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
