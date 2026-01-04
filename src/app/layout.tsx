import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { LogoLoader } from "@/components/LogoLoader";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { Toaster } from "sonner";
import { PWAProvider } from "@/components/pwa/PWAProvider";
import { ConfirmationProvider } from "@/components/ui/ConfirmationDialog";
import { QueryProvider } from "@/lib/contexts/QueryProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "מגן זהב - מערכת CRM",
  description: "מערכת ניהול לקוחות וסוכנים לסוכנויות ביטוח",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "מגן זהב",
  },
  formatDetection: {
    telephone: true,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f59e0b",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" className={`${inter.variable} ${outfit.variable}`}>
      <head>
        {/* PWA Meta Tags */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="מגן זהב" />
      </head>
      <body className="font-sans antialiased text-slate-900 selection:bg-accent/10 selection:text-accent overflow-x-hidden">
        <QueryProvider>
          <AuthProvider>
            <PWAProvider>
              <ConfirmationProvider>
                <LogoLoader />
                {children}
                <Toaster richColors position="top-center" closeButton dir="rtl" />
              </ConfirmationProvider>
            </PWAProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
