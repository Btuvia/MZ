"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/base";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log error to monitoring service (Sentry, etc.)
        console.error("Application Error:", error);
    }, [error]);

    return (
        <div 
            className="min-h-screen flex items-center justify-center p-6"
            style={{
                background: "linear-gradient(135deg, #0c1929 0%, #1a2942 25%, #0f2744 50%, #162033 75%, #0c1929 100%)"
            }}
            dir="rtl"
        >
            <div className="glass-card rounded-3xl p-8 max-w-md w-full text-center space-y-6">
                {/* Icon */}
                <div className="mx-auto w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>

                {/* Title */}
                <h1 className="text-2xl font-black text-amber-100">
                    משהו השתבש 😕
                </h1>

                {/* Message */}
                <p className="text-slate-400 leading-relaxed">
                    אירעה שגיאה בלתי צפויה. אנחנו מתנצלים על אי הנוחות.
                    אפשר לנסות לרענן את הדף או לחזור לדף הבית.
                </p>

                {/* Error details (only in development) */}
                {process.env.NODE_ENV === "development" && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-right">
                        <p className="text-xs text-red-400 font-mono break-all">
                            {error.message}
                        </p>
                        {error.digest && (
                            <p className="text-xs text-slate-500 mt-2">
                                Error ID: {error.digest}
                            </p>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                        onClick={reset}
                        variant="gold"
                        className="flex items-center gap-2"
                    >
                        <RefreshCw size={16} />
                        נסה שוב
                    </Button>
                    
                    <Link href="/">
                        <Button
                            variant="outline"
                            className="flex items-center gap-2 w-full"
                        >
                            <Home size={16} />
                            חזרה לדף הבית
                        </Button>
                    </Link>
                </div>

                {/* Support info */}
                <p className="text-xs text-slate-500">
                    אם הבעיה חוזרת, פנה לתמיכה הטכנית
                </p>
            </div>
        </div>
    );
}
