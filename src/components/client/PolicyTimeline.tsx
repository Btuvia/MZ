"use client";

import { motion } from "framer-motion";
import { Check, Shield } from "lucide-react";

interface PolicyTimelineProps {
    status: string; // e.g., "proposal", "underwriting", "active"
}

const STEPS = [
    { id: "proposal", label: "קבלת מסמכים" },
    { id: "underwriting", label: "חיתום ותהליך" },
    { id: "active", label: "פוליסה פעילה" },
];

export function PolicyTimeline({ status }: PolicyTimelineProps) {
    // Determine status index
    const activeIndex = STEPS.findIndex(s => s.id === status);
    // If status not found (e.g. 'cancelled'), default to 0 or handle separately. 
    // For this demo, we assume valid status or map 'pending' to 0.
    const currentStepIndex = activeIndex === -1 ? 0 : activeIndex;

    return (
        <div className="w-full py-8 px-4">
            <div className="relative flex items-center justify-between max-w-lg mx-auto">
                {/* Background Line */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-2 bg-slate-100 rounded-full md:w-[95%] md:left-[2.5%]" />

                {/* Progress Line */}
                <motion.div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-2 bg-gradient-to-r from-primary to-accent rounded-full md:left-[2.5%]"
                    initial={{ width: "0%" }}
                    animate={{ width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    style={{ maxWidth: '95%' }}
                />

                {STEPS.map((step, index) => {
                    const isCompleted = index <= currentStepIndex;
                    const isActive = index === currentStepIndex;

                    return (
                        <div key={step.id} className="relative flex flex-col items-center group z-10 w-24">
                            {/* Step Circle */}
                            <motion.div
                                initial={{ scale: 0.8 }}
                                animate={{ scale: isCompleted ? 1 : 0.9 }}
                                className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-colors duration-500
                                    ${isCompleted
                                        ? "bg-white border-primary text-primary shadow-lg shadow-primary/20"
                                        : "bg-slate-50 border-slate-200 text-slate-300"
                                    }`}
                            >
                                {index < currentStepIndex ? (
                                    <Check className="w-5 h-5 stroke-[3]" />
                                ) : (
                                    <span className="text-sm font-bold">{index + 1}</span>
                                )}
                            </motion.div>

                            {/* Label */}
                            <p className={`mt-3 text-xs md:text-sm font-bold text-center transition-colors duration-300 ${isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>
                                {step.label}
                            </p>

                            {/* "Magen Character" Animation - Only on Active Step */}
                            {isActive && (
                                <motion.div
                                    layoutId="magen-character"
                                    className="absolute -top-16 left-1/2 -translate-x-1/2 flex flex-col items-center"
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                >
                                    {/* Speech Bubble */}
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 0.5 }}
                                        className="bg-accent text-white text-[10px] font-bold px-3 py-1.5 rounded-xl rounded-bl-sm shadow-md mb-2 whitespace-nowrap"
                                    >
                                        תראה כמה עברנו! :)
                                    </motion.div>

                                    {/* Character Icon (Using Shield as Logo proxy) */}
                                    <motion.div
                                        animate={{
                                            rotate: [0, -10, 10, -5, 5, 0],
                                            y: [0, -5, 0]
                                        }}
                                        transition={{
                                            rotate: { repeat: Infinity, duration: 4, repeatDelay: 1 },
                                            y: { repeat: Infinity, duration: 2, ease: "easeInOut" }
                                        }}
                                        className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 text-white"
                                    >
                                        <Shield className="w-5 h-5 fill-current" />
                                    </motion.div>
                                </motion.div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
