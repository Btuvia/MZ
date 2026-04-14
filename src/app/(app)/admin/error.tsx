"use client";

import { AlertTriangle, RefreshCw, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/base";
import DashboardShell from "@/components/ui/dashboard-shell";
import { ADMIN_NAV_ITEMS } from "@/lib/navigation-config";

export default function AdminError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Admin Error:", error);
    }, [error]);

    return (
        <DashboardShell role="אדמין" navItems={ADMIN_NAV_ITEMS}>
            <div className="flex items-center justify-center min-h-[60vh]" dir="rtl">
                <div className="glass-card rounded-3xl p-8 max-w-md w-full text-center space-y-6">
                    <div className="mx-auto w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-red-400" />
                    </div>

                    <h1 className="text-2xl font-black text-amber-100">
                        שגיאה בטעינת הדף
                    </h1>

                    <p className="text-slate-400">
                        אירעה שגיאה בטעינת העמוד. נסה לרענן או לחזור ללוח הבקרה.
                    </p>

                    {process.env.NODE_ENV === "development" && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-right">
                            <p className="text-xs text-red-400 font-mono break-all">
                                {error.message}
                            </p>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button onClick={reset} variant="gold" className="flex items-center gap-2">
                            <RefreshCw size={16} />
                            נסה שוב
                        </Button>
                        
                        <Link href="/admin/dashboard">
                            <Button variant="outline" className="flex items-center gap-2 w-full">
                                <ArrowRight size={16} />
                                חזרה ללוח הבקרה
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}
