"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type LogoLoaderProps = {
    variant?: "splash" | "route";
    subtitle?: string;
};

export function LogoLoader({ variant = "splash", subtitle }: LogoLoaderProps) {
    const [progress, setProgress] = useState(0);
    const [visible, setVisible] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    // Immediate mount check
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Timer logic
    useEffect(() => {
        if (!isMounted || variant !== "splash") return;
        
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setTimeout(() => setVisible(false), 300); // Shorter fade delay
                    return 100;
                }
                return prev + 2.5; // Faster increment
            });
        }, 20); // Faster interval for snappier feel

        return () => clearInterval(interval);
    }, [isMounted, variant]);

    if (!isMounted) return null;
    if (variant === "splash" && !visible) return null;

    return (
        <div
            className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-xl flex flex-col items-center justify-center transition-opacity duration-500"
            style={{ opacity: variant === "splash" && progress === 100 ? 0 : 1 }}
        >
            {variant === "splash" ? (
                <>
                    <div className="relative w-64 h-64">
                        <Image
                            src="/logo.jpg"
                            alt="Logo Background"
                            fill
                            className="object-contain opacity-20 grayscale blur-sm"
                        />

                        <div
                            className="absolute inset-0 overflow-hidden transition-all duration-100"
                            style={{ height: `${progress}%` }}
                        >
                            <Image
                                src="/logo.jpg"
                                alt="Restoring Logo"
                                fill
                                className="object-contain drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]"
                            />
                        </div>
                    </div>

                    <div className="mt-8 text-center space-y-2">
                        <h2 className="text-2xl font-black text-white tracking-widest uppercase">Magen Zahav</h2>
                        <div className="h-1 w-48 bg-slate-800 rounded-full overflow-hidden mx-auto">
                            <div
                                className="h-full bg-linear-to-r from-yellow-400 via-amber-500 to-yellow-600 transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-xs font-bold text-amber-500/80 animate-pulse">{subtitle ?? "בונים עבורך את העתיד..."}</p>
                    </div>
                </>
            ) : (
                <>
                    <div className="relative w-56 h-56 animate-pulse">
                        <Image
                            src="/logo.jpg"
                            alt="Logo"
                            fill
                            className="object-contain drop-shadow-[0_0_15px_rgba(255,215,0,0.35)]"
                        />
                    </div>
                    <p className="mt-6 text-lg font-black text-white">{subtitle ?? "טוען..."}</p>
                </>
            )}
        </div>
    );
}
