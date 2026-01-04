/**
 * usePushNotifications Hook
 * 
 * Hook לניהול התראות push באפליקציה
 * מאפשר הרשמה, עדכון העדפות והאזנה להודעות
 */

"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { 
    pushNotificationService, 
    type NotificationPreferences,
    type PushNotification 
} from '@/lib/services/push-notification-service';

interface UsePushNotificationsReturn {
    // State
    isSupported: boolean;
    permission: NotificationPermission | 'unsupported';
    isEnabled: boolean;
    preferences: NotificationPreferences;
    
    // Actions
    requestPermission: () => Promise<boolean>;
    updatePreferences: (updates: Partial<NotificationPreferences>) => void;
    showNotification: (notification: PushNotification) => void;
    unsubscribe: () => Promise<void>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
    const { user } = useAuth();
    const [isSupported, setIsSupported] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');
    const [preferences, setPreferences] = useState<NotificationPreferences>(
        pushNotificationService.getPreferences()
    );

    // Check support and permission on mount
    useEffect(() => {
        const supported = pushNotificationService.isSupported();
        setIsSupported(supported);
        setPermission(pushNotificationService.getPermissionStatus());
    }, []);

    // Save token when user logs in
    useEffect(() => {
        if (user && permission === 'granted') {
            pushNotificationService.saveTokenForUser(user.uid);
        }
    }, [user, permission]);

    // Listen for permission changes
    useEffect(() => {
        if (!isSupported) return;

        const checkPermission = () => {
            setPermission(pushNotificationService.getPermissionStatus());
        };

        // Check periodically (permission API doesn't have change event)
        const interval = setInterval(checkPermission, 5000);
        return () => clearInterval(interval);
    }, [isSupported]);

    /**
     * Request permission for push notifications
     */
    const requestPermission = useCallback(async (): Promise<boolean> => {
        const granted = await pushNotificationService.requestPermission();
        setPermission(pushNotificationService.getPermissionStatus());
        
        if (granted && user) {
            await pushNotificationService.saveTokenForUser(user.uid);
        }
        
        return granted;
    }, [user]);

    /**
     * Update notification preferences
     */
    const updatePreferences = useCallback((updates: Partial<NotificationPreferences>) => {
        pushNotificationService.updatePreferences(updates);
        setPreferences(pushNotificationService.getPreferences());
    }, []);

    /**
     * Show a local notification
     */
    const showNotification = useCallback((notification: PushNotification) => {
        if (permission === 'granted') {
            pushNotificationService.showLocalNotification(notification);
        }
    }, [permission]);

    /**
     * Unsubscribe from notifications
     */
    const unsubscribe = useCallback(async () => {
        await pushNotificationService.unsubscribe();
        setPreferences(pushNotificationService.getPreferences());
    }, []);

    return {
        isSupported,
        permission,
        isEnabled: preferences.enabled && permission === 'granted',
        preferences,
        requestPermission,
        updatePreferences,
        showNotification,
        unsubscribe
    };
}
