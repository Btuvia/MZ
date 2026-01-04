/**
 * useReminders Hook
 * 
 * Hook for checking and displaying reminders in real-time.
 * Polls for due reminders and shows browser notifications.
 */

"use client";

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/contexts/AuthContext';
import { firestoreService } from '@/lib/firebase/firestore-service';

interface Reminder {
    id: string;
    title: string;
    description?: string;
    reminderTime: Date;
    itemType?: string;
    itemId?: string;
}

export function useReminders(checkInterval = 60000) { // Default: check every minute
    const { user } = useAuth();
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [lastCheck, setLastCheck] = useState<Date | null>(null);

    const handleDismiss = useCallback(async (reminderId: string) => {
        try {
            await firestoreService.updateReminderStatus(reminderId, 'dismissed');
            setReminders(prev => prev.filter(r => r.id !== reminderId));
        } catch (error) {
            console.error('Error dismissing reminder:', error);
        }
    }, []);

    const checkReminders = useCallback(async () => {
        if (!user) return;

        try {
            const userReminders = await firestoreService.getReminders(user.uid);
            const now = new Date();
            
            // Find reminders that are due
            const dueReminders = userReminders.filter(r => r.reminderTime <= now);
            
            // Show notifications for due reminders
            for (const reminder of dueReminders) {
                // Show toast notification
                const toastMessage = reminder.description 
                    ? `⏰ ${reminder.title}: ${reminder.description}`
                    : `⏰ תזכורת: ${reminder.title}`;
                
                toast(toastMessage, {
                    duration: 10000,
                    action: {
                        label: "הבנתי",
                        onClick: () => handleDismiss(reminder.id),
                    },
                });

                // Try browser notification
                if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                    new Notification('⏰ תזכורת', {
                        body: reminder.title,
                        icon: '/icons/icon-192x192.png',
                        tag: `reminder-${reminder.id}`,
                    });
                }

                // Mark as sent
                await firestoreService.updateReminderStatus(reminder.id, 'sent');
            }

            // Update reminders list (excluding sent ones)
            setReminders(userReminders.filter(r => r.reminderTime > now));
            setLastCheck(now);
        } catch (error) {
            console.error('Error checking reminders:', error);
        }
    }, [user, handleDismiss]);

    // Initial check and interval
    useEffect(() => {
        if (!user) return;

        // Check immediately on mount
        checkReminders();

        // Set up interval
        const interval = setInterval(checkReminders, checkInterval);

        return () => clearInterval(interval);
    }, [user, checkInterval, checkReminders]);

    return {
        reminders,
        lastCheck,
        checkNow: checkReminders,
        dismissReminder: handleDismiss,
    };
}
