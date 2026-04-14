import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { LogoLoader } from "@/components/LogoLoader";
import { PWAProvider } from "@/components/pwa/PWAProvider";
import { ConfirmationProvider } from "@/components/ui/ConfirmationDialog";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { QueryProvider } from "@/lib/contexts/QueryProvider";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
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
  );
}
