/**
 * PWA Install Prompt Component
 * 
 * קומפוננטה להצגת הנחיה להתקנת האפליקציה
 * מופיעה רק כשניתן להתקין (לא בסביבת standalone)
 */

"use client";

import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if already installed (standalone mode)
        const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone === true;
        setIsStandalone(standalone);

        // Check if iOS
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
        setIsIOS(ios);

        // Don't show if already installed
        if (standalone) return;

        // Check if user dismissed before (don't show for 7 days)
        const dismissed = localStorage.getItem('pwa_install_dismissed');
        if (dismissed) {
            const dismissedDate = new Date(dismissed);
            const daysSince = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSince < 7) return;
        }

        // Listen for beforeinstallprompt event (Chrome, Edge, etc.)
        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            
            // Show prompt after a delay
            setTimeout(() => setShowPrompt(true), 3000);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);

        // For iOS, show after delay since there's no event
        if (ios && !standalone) {
            setTimeout(() => setShowPrompt(true), 5000);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) {
            // For iOS, we can only show instructions
            return;
        }

        // Show native install prompt
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('[PWA] User accepted install');
        } else {
            console.log('[PWA] User dismissed install');
        }

        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('pwa_install_dismissed', new Date().toISOString());
    };

    // Don't render if already installed
    if (isStandalone) return null;

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    className="fixed bottom-4 left-4 z-50 w-80 max-w-[calc(100vw-2rem)]"
                >
                    <div className="glass-card border border-amber-500/20 rounded-2xl shadow-2xl overflow-hidden" dir="rtl">
                        {/* Header */}
                        <div className="bg-gradient-to-l from-amber-500 to-amber-600 p-4 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2 rounded-xl backdrop-blur">
                                    <Smartphone size={20} />
                                </div>
                                <span className="font-bold">התקן את האפליקציה</span>
                            </div>
                            <button
                                onClick={handleDismiss}
                                className="hover:bg-white/20 p-1 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                            {isIOS ? (
                                // iOS instructions
                                <div className="space-y-3">
                                    <p className="text-slate-200 text-sm">
                                        להתקנה באייפון/אייפד:
                                    </p>
                                    <ol className="text-sm text-slate-300 space-y-2 list-decimal list-inside">
                                        <li>לחץ על כפתור השיתוף <span className="inline-block bg-slate-600/50 px-1 rounded">⬆️</span></li>
                                        <li>גלול ובחר &quot;הוסף למסך הבית&quot;</li>
                                        <li>לחץ &quot;הוסף&quot;</li>
                                    </ol>
                                </div>
                            ) : (
                                // Android/Desktop
                                <div className="space-y-3">
                                    <p className="text-slate-200 text-sm">
                                        התקן את מגן זהב על המכשיר שלך לגישה מהירה, עבודה אופליין והתראות בזמן אמת.
                                    </p>
                                    <button
                                        onClick={handleInstall}
                                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Download size={18} />
                                        התקן עכשיו
                                    </button>
                                </div>
                            )}

                            <p className="text-xs text-slate-400 mt-3 text-center">
                                לא תופס מקום • ללא חנות אפליקציות
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
