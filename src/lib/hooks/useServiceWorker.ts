/**
 * useServiceWorker Hook
 * 
 * Hook לרישום וניהול Service Worker
 * מטפל ברישום, עדכונים ומצב offline
 */

"use client";

import { useState, useEffect, useCallback } from 'react';

interface UseServiceWorkerReturn {
    // State
    isSupported: boolean;
    isRegistered: boolean;
    isUpdateAvailable: boolean;
    isOffline: boolean;
    registration: ServiceWorkerRegistration | null;
    
    // Actions
    update: () => Promise<void>;
    skipWaiting: () => void;
}

export function useServiceWorker(): UseServiceWorkerReturn {
    const [isSupported, setIsSupported] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
    const [isOffline, setIsOffline] = useState(false);
    const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
    const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

    // Check support and register SW
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const supported = 'serviceWorker' in navigator;
        setIsSupported(supported);
        setIsOffline(!navigator.onLine);

        if (!supported) return;

        // Register service worker
        const registerSW = async () => {
            try {
                const reg = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/'
                });

                setRegistration(reg);
                setIsRegistered(true);

                console.log('[SW Hook] Service Worker registered');

                // Check for updates
                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                console.log('[SW Hook] New version available');
                                setIsUpdateAvailable(true);
                                setWaitingWorker(newWorker);
                            }
                        });
                    }
                });

                // Check if there's already a waiting worker
                if (reg.waiting) {
                    setIsUpdateAvailable(true);
                    setWaitingWorker(reg.waiting);
                }

            } catch (error) {
                console.error('[SW Hook] Registration failed:', error);
            }
        };

        registerSW();

        // Listen for online/offline
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Listen for controller change (when new SW takes over)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('[SW Hook] Controller changed, reloading...');
            window.location.reload();
        });

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    /**
     * Check for updates manually
     */
    const update = useCallback(async () => {
        if (!registration) return;

        try {
            await registration.update();
            console.log('[SW Hook] Update check complete');
        } catch (error) {
            console.error('[SW Hook] Update check failed:', error);
        }
    }, [registration]);

    /**
     * Skip waiting and activate new SW
     */
    const skipWaiting = useCallback(() => {
        if (!waitingWorker) return;

        waitingWorker.postMessage({ type: 'SKIP_WAITING' });
        setIsUpdateAvailable(false);
    }, [waitingWorker]);

    return {
        isSupported,
        isRegistered,
        isUpdateAvailable,
        isOffline,
        registration,
        update,
        skipWaiting
    };
}
