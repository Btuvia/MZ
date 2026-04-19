"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ListTodo, Circle } from "lucide-react";

const steps = [
    { text: "טוען רשימת מטלות...", delay: 0 },
    { text: "מסנכרן עדיפויות...", delay: 0.5 },
    { text: "מעדכן סטטוסים...", delay: 1 },
    { text: "מכין סביבת עבודה...", delay: 1.5 }
];

export default function TasksLoading() {
    return (
        <div className="fixed inset-0 bg-[#050810] flex items-center justify-center z-9999" dir="rtl">
            <div className="max-w-md w-full px-8 relative">
                {/* Decoration */}
                <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-500/10 blur-[80px] rounded-full" />
                <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-indigo-500/10 blur-[80px] rounded-full" />

                <div className="text-center mb-16 relative z-10">
                    <motion.div
                        initial={{ rotate: -10, scale: 0.8, opacity: 0 }}
                        animate={{ rotate: 0, scale: 1, opacity: 1 }}
                        className="h-24 w-24 rounded-[2rem] bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white mx-auto mb-8 shadow-2xl shadow-blue-500/20"
                    >
                        <ListTodo size={48} strokeWidth={2.5} />
                    </motion.div>
                    <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase">TO-DO <span className="text-blue-500">LIST</span></h2>
                    <p className="text-slate-500 font-black mt-3 uppercase tracking-[0.3em] text-[10px]">Optimizing Productivity</p>
                </div>

                <div className="space-y-4 relative z-10">
                    {steps.map((step, i) => (
                        <motion.div
                            key={i}
                            initial={{ x: 30, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: step.delay }}
                            className="group flex items-center gap-5 p-5 rounded-3xl bg-slate-900/40 border border-slate-800/50 backdrop-blur-xl"
                        >
                            <div className="relative h-7 w-7 flex items-center justify-center">
                                <motion.div
                                    initial={{ scale: 1, opacity: 1 }}
                                    animate={{ scale: 0, opacity: 0 }}
                                    transition={{ delay: step.delay + 0.4, duration: 0.2 }}
                                    className="absolute text-slate-700"
                                >
                                    <Circle size={28} strokeWidth={3} />
                                </motion.div>
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: step.delay + 0.5, type: "spring", stiffness: 200 }}
                                    className="absolute text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                                >
                                    <CheckCircle2 size={28} strokeWidth={3} />
                                </motion.div>
                            </div>
                            <motion.span 
                                animate={{ 
                                    color: ["#64748b", "#cbd5e1"],
                                    transition: { delay: step.delay + 0.5 }
                                }}
                                className="text-slate-500 font-bold text-lg"
                            >
                                {step.text}
                            </motion.span>
                        </motion.div>
                    ))}
                </div>

                {/* Progress bar at bottom */}
                <div className="mt-12 w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 2.5, ease: "easeInOut" }}
                        className="h-full bg-linear-to-r from-blue-600 to-indigo-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                    />
                </div>
            </div>

            {/* Animated Background Atmosphere */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.03)_0%,transparent_70%)]" />
            </div>
        </div>
    );
}
