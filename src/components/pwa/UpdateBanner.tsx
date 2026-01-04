/**
 * Update Available Banner
 * 
 * באנר המודיע על גרסה חדשה זמינה
 * מאפשר למשתמש לעדכן או לדחות
 */

"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';
import { useServiceWorker } from '@/lib/hooks/useServiceWorker';

export function UpdateBanner() {
    const { isUpdateAvailable, skipWaiting } = useServiceWorker();

    if (!isUpdateAvailable) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-l from-indigo-600 to-indigo-700 text-white shadow-lg"
                dir="rtl"
            >
                <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-1.5 rounded-lg">
                            <RefreshCw size={16} className="animate-spin-slow" />
                        </div>
                        <p className="text-sm font-medium">
                            גרסה חדשה זמינה! לחץ לעדכון.
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button
                            onClick={skipWaiting}
                            className="bg-white text-indigo-600 font-bold text-sm px-4 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                        >
                            עדכן עכשיו
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
