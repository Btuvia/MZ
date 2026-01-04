/**
 * Notification Permission Prompt
 * 
 * קומפוננטה לבקשת הרשאת התראות מהמשתמש
 */

"use client";

import { useState } from 'react';
import { Bell, X, BellRing } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePushNotifications } from '@/lib/hooks/usePushNotifications';

interface NotificationPromptProps {
    onDismiss?: () => void;
}

export function NotificationPrompt({ onDismiss }: NotificationPromptProps) {
    const { isSupported, permission, requestPermission } = usePushNotifications();
    const [isLoading, setIsLoading] = useState(false);
    const [showPrompt, setShowPrompt] = useState(true);

    // Don't show if not supported or already decided
    if (!isSupported || permission !== 'default' || !showPrompt) {
        return null;
    }

    const handleEnable = async () => {
        setIsLoading(true);
        await requestPermission();
        setIsLoading(false);
        setShowPrompt(false);
        onDismiss?.();
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('notification_prompt_dismissed', 'true');
        onDismiss?.();
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-20 left-4 z-40 w-72 max-w-[calc(100vw-2rem)]"
                dir="rtl"
            >
                <div className="glass-card border border-amber-500/20 rounded-2xl shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-slate-800/50 p-4 flex items-center justify-between border-b border-amber-500/20">
                        <div className="flex items-center gap-3">
                            <div className="bg-amber-500/20 text-amber-400 p-2 rounded-xl">
                                <BellRing size={20} />
                            </div>
                            <span className="font-bold text-amber-100">קבל התראות</span>
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="text-slate-400 hover:text-amber-400 p-1 hover:bg-slate-700/50 rounded-lg transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-4">
                        <p className="text-sm text-slate-200">
                            הפעל התראות כדי לקבל עדכונים על:
                        </p>
                        
                        <ul className="text-sm text-slate-300 space-y-2">
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                                משימות ותזכורות
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                                לידים חדשים
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                                עדכוני לקוחות
                            </li>
                        </ul>

                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={handleDismiss}
                                className="flex-1 text-slate-300 font-medium py-2 px-4 rounded-xl hover:bg-slate-700/50 transition-colors"
                            >
                                אח&quot;כ
                            </button>
                            <button
                                onClick={handleEnable}
                                disabled={isLoading}
                                className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <span className="animate-spin">⏳</span>
                                ) : (
                                    <>
                                        <Bell size={16} />
                                        הפעל
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
