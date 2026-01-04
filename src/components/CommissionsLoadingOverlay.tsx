"use client";

import { useState } from "react";
import Image from "next/image";

type Bill = {
    id: number;
    leftPercent: number;
    rotateDeg: number;
    durationSec: number;
    delaySec: number;
    scale: number;
};

type BillStyle = React.CSSProperties & {
    "--magen-bill-rotate"?: string;
    "--magen-bill-scale"?: number;
};

function buildBills(count: number): Bill[] {
    return Array.from({ length: count }).map((_, i) => {
        const durationSec = 3.2 + Math.random() * 3.8;
        return {
            id: i,
            leftPercent: Math.random() * 100,
            rotateDeg: -12 + Math.random() * 24,
            durationSec,
            delaySec: -(Math.random() * durationSec),
            scale: 0.75 + Math.random() * 0.55
        };
    });
}

function getBillStyle(bill: Bill): BillStyle {
    return {
        left: `${bill.leftPercent}%`,
        animationDuration: `${bill.durationSec}s`,
        animationDelay: `${bill.delaySec}s`,
        "--magen-bill-rotate": `${bill.rotateDeg}deg`,
        "--magen-bill-scale": bill.scale
    };
}

function BillRain() {
    const [bills] = useState<Bill[]>(() => buildBills(44));

    return (
        <div className="fixed inset-0 z-[60] pointer-events-none overflow-hidden">
            {bills.map((bill) => (
                <div key={bill.id} className="absolute -top-28 animate-magen-bill-fall" style={getBillStyle(bill)}>
                    <div className="glass-card border border-gold shadow-gold rounded-2xl w-44 h-20 flex items-center justify-center">
                        <div className="relative w-12 h-12 rounded-full overflow-hidden border border-gold shadow-gold">
                            <Image
                                src="/logo.jpg"
                                alt="logo"
                                fill
                                sizes="48px"
                                className="object-cover"
                                priority
                            />
                        </div>
                    </div>
                </div>
            ))}

            <style jsx>{`
                @keyframes magenBillFall {
                    0% {
                        transform: translateY(-15vh)
                            rotate(var(--magen-bill-rotate))
                            scale(var(--magen-bill-scale));
                        opacity: 0.95;
                    }
                    100% {
                        transform: translateY(120vh)
                            rotate(calc(var(--magen-bill-rotate) + 18deg))
                            scale(var(--magen-bill-scale));
                        opacity: 0;
                    }
                }
                .animate-magen-bill-fall {
                    animation-name: magenBillFall;
                    animation-timing-function: linear;
                    animation-iteration-count: infinite;
                    will-change: transform, opacity;
                }
            `}</style>
        </div>
    );
}

export function CommissionsLoadingOverlay() {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <BillRain />

            <div className="absolute inset-0 bg-black/25" />

            <div className="relative z-[61] px-6">
                <div className="text-center text-2xl sm:text-3xl font-extrabold text-gradient-gold neon-text-gold">
                    שקלים שקלים עלינו נופלים!
                </div>
            </div>
        </div>
    );
}
