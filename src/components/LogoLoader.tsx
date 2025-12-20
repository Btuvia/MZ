"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export function LogoLoader() {
    const [progress, setProgress] = useState(0);
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        // Simulate loading progress
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setTimeout(() => setVisible(false), 500); // Fade out after completion
                    return 100;
                }
                return prev + 2; // Speed of loading
            });
        }, 30);

        return () => clearInterval(interval);
    }, []);

    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-xl flex flex-col items-center justify-center transition-opacity duration-500"
            style={{ opacity: progress === 100 ? 0 : 1 }}
        >
            <div className="relative w-64 h-64">
                {/* Background "Ghost" Logo */}
                <Image
                    src="/logo.jpg"
                    alt="Logo Background"
                    fill
                    className="object-contain opacity-20 grayscale blur-sm"
                />

                {/* Revealing Logo */}
                <div
                    className="absolute inset-0 overflow-hidden transition-all duration-100"
                    style={{ height: `${progress}%` }} // Reveal from top
                >
                    <Image
                        src="/logo.jpg"
                        alt="Restoring Logo"
                        fill
                        className="object-contain drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]"
                    />
                </div>
            </div>

            {/* Loading Text */}
            <div className="mt-8 text-center space-y-2">
                <h2 className="text-2xl font-black text-white tracking-widest uppercase">Magen Zahav</h2>
                <div className="h-1 w-48 bg-slate-800 rounded-full overflow-hidden mx-auto">
                    <div
                        className="h-full bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p className="text-xs font-bold text-amber-500/80 animate-pulse">בונים עבורך את העתיד...</p>
            </div>
        </div>
    );
}
