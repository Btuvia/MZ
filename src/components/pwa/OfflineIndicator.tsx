/**
 * Offline Indicator
 * 
 * אינדיקטור שמופיע כשאין חיבור לאינטרנט
 */

"use client";

import { WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useServiceWorker } from '@/lib/hooks/useServiceWorker';

export function OfflineIndicator() {
    const { isOffline } = useServiceWorker();

    return (
        <AnimatePresence>
            {isOffline && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="fixed bottom-4 left-4 z-50"
                    dir="rtl"
                >
                    <div className="bg-slate-800 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                        <WifiOff size={16} className="text-amber-400" />
                        <span className="text-sm font-medium">מצב אופליין</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
