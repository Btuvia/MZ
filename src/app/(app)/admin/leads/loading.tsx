"use client";

import { motion } from "framer-motion";
import { DollarSign } from "lucide-react";

export default function LeadsLoading() {
    return (
        <div className="fixed inset-0 bg-[#050810] flex items-center justify-center overflow-hidden z-9999" dir="rtl">
            {/* Falling Dollars Background */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(30)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ 
                            y: -200, 
                            x: Math.random() * 2000 - 500,
                            rotate: 0,
                            opacity: 0 
                        }}
                        animate={{ 
                            y: 1200, 
                            rotate: 720,
                            opacity: [0, 0.3, 0.3, 0]
                        }}
                        transition={{ 
                            duration: Math.random() * 3 + 2, 
                            repeat: Infinity,
                            delay: Math.random() * 5,
                            ease: "linear"
                        }}
                        className="absolute text-amber-500/20"
                    >
                        <DollarSign size={Math.random() * 40 + 20} />
                    </motion.div>
                ))}
            </div>

            {/* Central Content */}
            <div className="text-center relative z-10">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ 
                        scale: [0.8, 1.1, 1], 
                        opacity: 1,
                        rotateY: [0, 360]
                    }}
                    transition={{ 
                        scale: { duration: 1, repeat: Infinity, repeatType: "reverse" },
                        rotateY: { duration: 3, repeat: Infinity, ease: "linear" }
                    }}
                    className="mb-8"
                >
                    <div className="h-24 w-24 rounded-3xl bg-amber-500 flex items-center justify-center text-black mx-auto shadow-[0_0_50px_rgba(245,158,11,0.6)]">
                        <DollarSign size={56} strokeWidth={3} />
                    </div>
                </motion.div>

                <motion.h2 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-6xl font-black text-white italic tracking-tighter uppercase"
                >
                    money <span className="text-amber-500">money</span> money
                </motion.h2>
                
                <div className="relative w-64 h-1.5 bg-slate-900 mt-8 rounded-full mx-auto overflow-hidden">
                    <motion.div 
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 bg-linear-to-r from-transparent via-amber-500 to-transparent"
                    />
                </div>
                
                <p className="text-slate-500 font-black mt-6 uppercase tracking-[0.4em] text-[10px]">Processing High-Value Leads</p>
            </div>

            {/* Intense Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[150px]" />
        </div>
    );
}
