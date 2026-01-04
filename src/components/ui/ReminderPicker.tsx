"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Calendar, Bell, BellRing } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/base";

interface ReminderPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (reminderTime: Date) => void;
    itemTitle: string;
}

// Quick reminder options
const quickOptions = [
    { label: "בעוד 30 דקות", minutes: 30 },
    { label: "בעוד שעה", minutes: 60 },
    { label: "בעוד שעתיים", minutes: 120 },
    { label: "מחר בבוקר (09:00)", preset: "tomorrow_morning" },
    { label: "מחר בצהריים (13:00)", preset: "tomorrow_noon" },
    { label: "בעוד יומיים", preset: "in_2_days" },
];

export function ReminderPicker({ isOpen, onClose, onSelect, itemTitle }: ReminderPickerProps) {
    const [showCustom, setShowCustom] = useState(false);
    const [customDate, setCustomDate] = useState("");
    const [customTime, setCustomTime] = useState("09:00");

    const handleQuickSelect = (option: typeof quickOptions[0]) => {
        const now = new Date();
        let reminderTime: Date;

        if (option.minutes) {
            reminderTime = new Date(now.getTime() + option.minutes * 60 * 1000);
        } else if (option.preset === "tomorrow_morning") {
            reminderTime = new Date(now);
            reminderTime.setDate(reminderTime.getDate() + 1);
            reminderTime.setHours(9, 0, 0, 0);
        } else if (option.preset === "tomorrow_noon") {
            reminderTime = new Date(now);
            reminderTime.setDate(reminderTime.getDate() + 1);
            reminderTime.setHours(13, 0, 0, 0);
        } else if (option.preset === "in_2_days") {
            reminderTime = new Date(now);
            reminderTime.setDate(reminderTime.getDate() + 2);
            reminderTime.setHours(9, 0, 0, 0);
        } else {
            reminderTime = now;
        }

        onSelect(reminderTime);
        onClose();
    };

    const handleCustomSubmit = () => {
        if (!customDate || !customTime) return;
        
        const [hours, minutes] = customTime.split(":").map(Number);
        const reminderTime = new Date(customDate);
        reminderTime.setHours(hours, minutes, 0, 0);
        
        onSelect(reminderTime);
        onClose();
        setShowCustom(false);
    };

    // Get min date (today)
    const today = new Date().toISOString().split("T")[0];

    return (
        <AnimatePresence>
            {isOpen ? <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
                        dir="rtl"
                    >
                        <div className="glass-card border border-amber-500/20 rounded-2xl shadow-2xl overflow-hidden mx-4">
                            {/* Header */}
                            <div className="bg-gradient-to-l from-amber-500 to-amber-600 p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 p-2 rounded-xl backdrop-blur">
                                        <BellRing size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white">הגדר תזכורת</h3>
                                        <p className="text-amber-100 text-xs truncate max-w-[200px]">{itemTitle}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="hover:bg-white/20 p-1.5 rounded-lg transition-colors text-white"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-4 space-y-4">
                                {!showCustom ? (
                                    <>
                                        {/* Quick Options */}
                                        <div className="grid grid-cols-2 gap-2">
                                            {quickOptions.map((option, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleQuickSelect(option)}
                                                    className="p-3 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-amber-500/50 rounded-xl text-sm font-medium text-slate-200 transition-all flex items-center gap-2 justify-center"
                                                >
                                                    <Clock size={14} className="text-amber-400" />
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Custom Option */}
                                        <button
                                            onClick={() => setShowCustom(true)}
                                            className="w-full p-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-sm font-bold text-amber-400 transition-all flex items-center gap-2 justify-center"
                                        >
                                            <Calendar size={16} />
                                            בחר תאריך ושעה מותאמים
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        {/* Custom Date/Time Picker */}
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 mb-1.5">תאריך</label>
                                                <input
                                                    type="date"
                                                    value={customDate}
                                                    onChange={(e) => setCustomDate(e.target.value)}
                                                    min={today}
                                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 mb-1.5">שעה</label>
                                                <input
                                                    type="time"
                                                    value={customTime}
                                                    onChange={(e) => setCustomTime(e.target.value)}
                                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                                                />
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 pt-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => setShowCustom(false)}
                                                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                                            >
                                                חזרה
                                            </Button>
                                            <Button
                                                onClick={handleCustomSubmit}
                                                disabled={!customDate || !customTime}
                                                className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold disabled:opacity-50"
                                            >
                                                <Bell size={16} className="ml-2" />
                                                קבע תזכורת
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </> : null}
        </AnimatePresence>
    );
}
