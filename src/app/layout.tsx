import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { LogoLoader } from "@/components/LogoLoader";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "InsurCRM",
  description: "Advanced Insurance CRM",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" className={`${inter.variable} ${outfit.variable}`}>
      <body className="font-sans antialiased text-slate-900 selection:bg-accent/10 selection:text-accent overflow-x-hidden">
        <AuthProvider>
          <LogoLoader />
          {children}
          <Toaster richColors position="top-center" closeButton />
        </AuthProvider>
      </body>
    </html>
  );
}
