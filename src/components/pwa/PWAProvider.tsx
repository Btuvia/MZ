/**
 * PWA Provider Component
 * 
 * קומפוננטה שמנהלת את כל פונקציונליות ה-PWA
 * כולל Service Worker, התראות, ועדכונים
 */

"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useServiceWorker } from '@/lib/hooks/useServiceWorker';
import { NotificationPrompt } from './NotificationPrompt';
import { OfflineIndicator } from './OfflineIndicator';
import { PWAInstallPrompt } from './PWAInstallPrompt';
import { UpdateBanner } from './UpdateBanner';

interface PWAProviderProps {
    children: React.ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
    const { isRegistered } = useServiceWorker();
    const { user, role } = useAuth();
    const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

    // Show notification prompt after login for admin/agent
    useEffect(() => {
        if (!user || !role) return;
        if (role !== 'admin' && role !== 'agent') return;

        // Check if already dismissed
        const dismissed = localStorage.getItem('notification_prompt_dismissed');
        if (dismissed) return;

        // Check if already granted
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'granted') return;
            if (Notification.permission === 'denied') return;
        }

        // Show prompt after delay
        const timer = setTimeout(() => {
            setShowNotificationPrompt(true);
        }, 10000); // 10 seconds after login

        return () => clearTimeout(timer);
    }, [user, role]);

    return (
        <>
            {children}
            
            {/* PWA UI Components */}
            <UpdateBanner />
            <OfflineIndicator />
            <PWAInstallPrompt />
            
            {/* Notification prompt for admin/agent */}
            {showNotificationPrompt ? <NotificationPrompt 
                    onDismiss={() => setShowNotificationPrompt(false)} 
                /> : null}
        </>
    );
}
