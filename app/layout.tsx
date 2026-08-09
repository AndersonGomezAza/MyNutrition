import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { InstallHint } from "@/components/InstallHint";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MyNutrition",
  description:
    "Catálogo de supermercado, checklist de compras, plan de comidas y seguimiento de peso.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MyNutrition",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#130f1f",
};

const NAV_LINKS = [
  { href: "/catalog", label: "Catálogo" },
  { href: "/checklist", label: "Checklist" },
  { href: "/plan", label: "Plan" },
  { href: "/progress", label: "Progreso" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-app-bg text-app-ink">
        <header
          className="border-b border-app-line bg-app-surface"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <nav className="mx-auto flex max-w-4xl items-center gap-6 px-4 py-3 text-sm font-medium">
            <Link href="/" className="font-semibold text-app-accent-2">
              MyNutrition
            </Link>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-app-muted hover:text-app-ink"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
          {children}
        </main>
        <InstallHint />
        <ServiceWorkerRegistration />
        <div style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
      </body>
    </html>
  );
}
