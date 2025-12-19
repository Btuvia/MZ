import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "InsurCRM | מערכת ניהול סוכנות ביטוח ופנסיה",
  description: "מערכת CRM מתקדמת לניהול תיקי ביטוח, פנסיה וקשרי לקוחות",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${inter.className} antialiased selection:bg-accent-soft selection:text-accent`}>
        {children}
      </body>
    </html>
  );
}
