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
    type: 'reminder' | 'task';
    urgency?: 'urgent' | 'regular';
    priority?: 'low' | 'medium' | 'high';
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
            const [userReminders, userTasks] = await Promise.all([
                firestoreService.getReminders(user.uid),
                firestoreService.getTasks() // Ideally filter by assignee but for now all
            ]);

            const now = new Date();
            
            // Combine both sources
            const allItems: Reminder[] = [
                ...userReminders.map(r => ({ ...r, type: 'reminder' as const })),
                ...userTasks
                    .filter(t => (t.isReminder || t.status === 'pending') && t.date && t.time)
                    .map(t => {
                        const [year, month, day] = t.date.split('-').map(Number);
                        const [hours, minutes] = t.time.split(':').map(Number);
                        return {
                            id: t.id,
                            title: t.title,
                            description: t.description,
                            reminderTime: new Date(year, month - 1, day, hours, minutes),
                            itemType: 'task',
                            itemId: t.id,
                            type: 'task' as const,
                            urgency: t.urgency || 'regular',
                            priority: t.priority
                        };
                    })
            ];

            // Find items that are due (and haven't been notified yet)
            const dueItems = allItems.filter(item => {
                const isDue = item.reminderTime <= now;
                // Add some logic to prevent duplicate toasts for the same item in one session
                // We could use a set of notified ids
                return isDue;
            });
            
            // Show notifications for due items
            for (const item of dueItems) {
                // Check if already notified in this session to avoid spam
                const sessionKey = `notified_${item.id}_${item.reminderTime.getTime()}`;
                if (sessionStorage.getItem(sessionKey)) continue;

                // Show toast notification
                const isUrgent = item.urgency === 'urgent' || item.priority === 'high';
                const toastMessage = item.description 
                    ? `⏰ ${item.title}: ${item.description}`
                    : `⏰ תזכורת: ${item.title}`;
                
                if (isUrgent) {
                    toast.error(toastMessage, {
                        duration: Infinity,
                        description: 'משימה דחופה לביצוע!',
                        className: 'bg-red-500 text-white border-red-600 shadow-[0_0_20px_rgba(239,68,68,0.4)]',
                        action: {
                            label: "טופל",
                            onClick: async () => {
                                if (item.type === 'reminder') {
                                    await handleDismiss(item.id);
                                } else {
                                    sessionStorage.setItem(sessionKey, 'true');
                                }
                            },
                        },
                    });
                } else {
                    toast(toastMessage, {
                        duration: Infinity, // Stay until closed
                        description: item.type === 'task' ? 'משימה לביצוע' : 'תזכורת',
                        action: {
                            label: "הבנתי",
                            onClick: async () => {
                                if (item.type === 'reminder') {
                                    await handleDismiss(item.id);
                                } else {
                                    sessionStorage.setItem(sessionKey, 'true');
                                }
                            },
                        },
                    });
                }

                // Mark as notified in session
                sessionStorage.setItem(sessionKey, 'true');

                // Try browser notification
                if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                    new Notification(item.type === 'task' ? '📋 משימה לביצוע' : '⏰ תזכורת', {
                        body: item.title,
                        tag: `${item.type}-${item.id}`,
                    });
                }

                // If it's a dedicated reminder object, mark as sent in DB
                if (item.type === 'reminder') {
                    await firestoreService.updateReminderStatus(item.id, 'sent');
                }
            }

            setReminders(allItems.filter(r => r.reminderTime > now));
            setLastCheck(now);
        } catch (error) {
            console.error('Error checking reminders:', error);
        }
    }, [user, handleDismiss]);

    // Initial check and interval
    useEffect(() => {
        if (!user) return;

        // Check immediately on mount (after a tick to avoid cascading render)
        const timeout = setTimeout(() => {
            checkReminders();
        }, 0);

        // Set up interval
        const interval = setInterval(checkReminders, checkInterval);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [user, checkInterval, checkReminders]);

    return {
        reminders,
        lastCheck,
        checkNow: checkReminders,
        dismissReminder: handleDismiss,
    };
}
