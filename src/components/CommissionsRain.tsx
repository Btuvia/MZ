"use client";

import Image from "next/image";
import { useEffect, useMemo } from 'react';

type RainElement = {
    id: number;
    left: number;
    duration: number;
    delay: number;
    type: 'coin' | 'shield';
};

export function CommissionsRain({ isActive, onComplete }: { isActive: boolean; onComplete: () => void }) {
    const elements = useMemo(() => {
        if (!isActive) return [];
        return Array.from({ length: 50 }).map((_, i) => ({
            id: i,
            left: (i * 7) % 100,
            duration: 2 + ((i * 3) % 3),
            delay: (i * 11) % 2,
            type: (i % 3 === 0) ? 'shield' : 'coin' as const
        }));
    }, [isActive]);

    useEffect(() => {
        if (!isActive) return;

        const timer = setTimeout(() => {
            onComplete();
        }, 5000);

        return () => clearTimeout(timer);
    }, [isActive, onComplete]);

    if (!isActive) return null;

    return (
        <div className="fixed inset-0 z-[60] pointer-events-none overflow-hidden">
            {elements.map((el) => (
                <div
                    key={el.id}
                    className="absolute -top-20 animate-fall"
                    style={{
                        left: `${el.left}%`,
                        animationDuration: `${el.duration}s`,
                        animationDelay: `${el.delay}s`,
                        animationTimingFunction: 'linear'
                    }}
                >
                    {el.type === 'shield' ? (
                        <div className="text-4xl drop-shadow-xl filter brightness-110">
                            <div className="absolute top-0 w-8 h-24 bg-linear-to-b from-transparent via-amber-400/50 to-transparent blur-sm" />
                            <div className="w-12 h-12 relative">
                                <Image src="/logo.jpg" fill alt="shield" className="object-contain rounded-full shadow-lg border-2 border-amber-400/50" />
                            </div>
                        </div>
                    ) : (
                        <div className="text-2xl animate-spin-slow">💰</div>
                    )}
                </div>
            ))}
            <style jsx>{`
                @keyframes fall {
                    0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
                }
                .animate-fall {
                    animation-name: fall;
                    animation-fill-mode: forwards;
                }
                .animate-spin-slow {
                    animation: spin 3s linear infinite;
                }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
