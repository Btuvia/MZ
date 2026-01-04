/**
 * Push Notifications Service
 * 
 * שירות להרשמה ושליחת התראות push למשתמשים
 * תומך בהתראות בזמן אמת גם כשהאפליקציה סגורה
 */

import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';
import { app } from '@/lib/firebase/firebase';
import { firestoreService } from '@/lib/firebase/firestore-service';

// Types
export interface PushNotification {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: Record<string, string>;
    requireInteraction?: boolean;
    actions?: Array<{
        action: string;
        title: string;
        icon?: string;
    }>;
}

export interface NotificationPreferences {
    enabled: boolean;
    tasks: boolean;
    leads: boolean;
    clients: boolean;
    system: boolean;
    sound: boolean;
    vibrate: boolean;
}

// Default preferences
const DEFAULT_PREFERENCES: NotificationPreferences = {
    enabled: true,
    tasks: true,
    leads: true,
    clients: true,
    system: true,
    sound: true,
    vibrate: true
};

// Storage keys
const STORAGE_KEYS = {
    PREFERENCES: 'notification_preferences',
    TOKEN: 'fcm_token',
    PERMISSION: 'notification_permission'
};

class PushNotificationService {
    private messaging: Messaging | null = null;
    private token: string | null = null;
    private preferences: NotificationPreferences = DEFAULT_PREFERENCES;
    private messageHandlers: Set<(payload: any) => void> = new Set();

    constructor() {
        if (typeof window !== 'undefined') {
            this.loadPreferences();
            this.initializeMessaging();
        }
    }

    /**
     * Initialize Firebase Cloud Messaging
     */
    private async initializeMessaging(): Promise<void> {
        try {
            // Check if browser supports notifications
            if (!('Notification' in window)) {
                console.warn('[Push] Browser does not support notifications');
                return;
            }

            // Initialize FCM
            this.messaging = getMessaging(app);

            // Listen for foreground messages
            onMessage(this.messaging, (payload) => {
                console.log('[Push] Foreground message:', payload);
                this.handleForegroundMessage(payload);
            });

            // Load saved token
            const savedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
            if (savedToken) {
                this.token = savedToken;
            }

        } catch (error) {
            console.error('[Push] Failed to initialize:', error);
        }
    }

    /**
     * Load preferences from localStorage
     */
    private loadPreferences(): void {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
            if (saved) {
                this.preferences = { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error('[Push] Failed to load preferences:', error);
        }
    }

    /**
     * Save preferences to localStorage
     */
    private savePreferences(): void {
        localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(this.preferences));
    }

    /**
     * Check if push notifications are supported
     */
    isSupported(): boolean {
        return typeof window !== 'undefined' && 
               'Notification' in window && 
               'serviceWorker' in navigator &&
               'PushManager' in window;
    }

    /**
     * Get current permission status
     */
    getPermissionStatus(): NotificationPermission | 'unsupported' {
        if (!this.isSupported()) return 'unsupported';
        return Notification.permission;
    }

    /**
     * Request notification permission
     */
    async requestPermission(): Promise<boolean> {
        if (!this.isSupported()) {
            console.warn('[Push] Notifications not supported');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            localStorage.setItem(STORAGE_KEYS.PERMISSION, permission);

            if (permission === 'granted') {
                await this.registerForPush();
                return true;
            }

            return false;
        } catch (error) {
            console.error('[Push] Permission request failed:', error);
            return false;
        }
    }

    /**
     * Register for push notifications and get FCM token
     */
    async registerForPush(): Promise<string | null> {
        if (!this.messaging) {
            console.warn('[Push] Messaging not initialized');
            return null;
        }

        try {
            // Get VAPID key from environment
            const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

            // Get FCM token
            const token = await getToken(this.messaging, {
                vapidKey,
                serviceWorkerRegistration: await navigator.serviceWorker.getRegistration()
            });

            if (token) {
                this.token = token;
                localStorage.setItem(STORAGE_KEYS.TOKEN, token);
                console.log('[Push] FCM token obtained');
                return token;
            }

            return null;
        } catch (error) {
            console.error('[Push] Failed to get token:', error);
            return null;
        }
    }

    /**
     * Save user's FCM token to Firestore
     */
    async saveTokenForUser(userId: string): Promise<void> {
        if (!this.token) {
            console.warn('[Push] No token to save');
            return;
        }

        try {
            await firestoreService.updateUserPreferences(userId, {
                fcmTokens: [this.token],
                notificationPreferences: this.preferences
            });
            console.log('[Push] Token saved for user:', userId);
        } catch (error) {
            console.error('[Push] Failed to save token:', error);
        }
    }

    /**
     * Handle foreground messages
     */
    private handleForegroundMessage(payload: any): void {
        const { notification, data } = payload;

        // Check if this type of notification is enabled
        if (data?.type && !this.isNotificationTypeEnabled(data.type)) {
            return;
        }

        // Show browser notification
        if (this.preferences.enabled && notification) {
            this.showLocalNotification({
                title: notification.title || 'מגן זהב',
                body: notification.body || '',
                icon: notification.icon,
                data: data
            });
        }

        // Notify handlers
        this.messageHandlers.forEach(handler => handler(payload));
    }

    /**
     * Check if notification type is enabled
     */
    private isNotificationTypeEnabled(type: string): boolean {
        switch (type) {
            case 'task':
            case 'task_reminder':
            case 'task_overdue':
                return this.preferences.tasks;
            case 'lead':
            case 'new_lead':
                return this.preferences.leads;
            case 'client':
            case 'client_update':
                return this.preferences.clients;
            case 'system':
            default:
                return this.preferences.system;
        }
    }

    /**
     * Show a local notification (when app is in foreground)
     */
    showLocalNotification(notification: PushNotification): void {
        if (Notification.permission !== 'granted') return;

        const options: NotificationOptions = {
            body: notification.body,
            icon: notification.icon || '/icons/icon-192x192.png',
            badge: notification.badge || '/icons/badge-72x72.png',
            tag: notification.tag || 'general',
            data: notification.data,
            requireInteraction: notification.requireInteraction || false,
            dir: 'rtl',
            lang: 'he',
            silent: !this.preferences.sound
        };

        const n = new Notification(notification.title, options);

        n.onclick = () => {
            window.focus();
            if (notification.data?.url) {
                window.location.href = notification.data.url;
            }
            n.close();
        };
    }

    /**
     * Subscribe to foreground messages
     */
    onMessage(handler: (payload: any) => void): () => void {
        this.messageHandlers.add(handler);
        return () => this.messageHandlers.delete(handler);
    }

    /**
     * Get notification preferences
     */
    getPreferences(): NotificationPreferences {
        return { ...this.preferences };
    }

    /**
     * Update notification preferences
     */
    updatePreferences(updates: Partial<NotificationPreferences>): void {
        this.preferences = { ...this.preferences, ...updates };
        this.savePreferences();
    }

    /**
     * Get FCM token
     */
    getToken(): string | null {
        return this.token;
    }

    /**
     * Unsubscribe from push notifications
     */
    async unsubscribe(): Promise<void> {
        this.token = null;
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        this.preferences.enabled = false;
        this.savePreferences();
    }
}

// Export singleton
export const pushNotificationService = new PushNotificationService();

// Export class for testing
export { PushNotificationService };
