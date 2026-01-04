import { Timestamp } from "firebase/firestore";
import { firestoreService } from "@/lib/firebase/firestore-service";

/**
 * Notification System
 * Handles in-app notifications
 */

export type NotificationType =
    | 'task_assigned'
    | 'task_overdue'
    | 'task_completed'
    | 'task_transferred'
    | 'workflow_started'
    | 'workflow_completed'
    | 'sla_warning';

export interface Notification {
    id?: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    taskId?: string;
    workflowId?: string;
    isRead: boolean;
    createdAt: Date | Timestamp;
}

/**
 * Send a notification to a user
 */
export async function sendNotification(
    userId: string,
    notification: Omit<Notification, 'id' | 'userId' | 'isRead' | 'createdAt'>
): Promise<string> {
    try {
        const notificationData: Omit<Notification, 'id'> = {
            userId,
            ...notification,
            isRead: false,
            createdAt: Timestamp.now(),
        };

        const notificationId = await firestoreService.addDocument('notifications', notificationData);

        console.log(`Notification sent to user ${userId}: ${notification.title}`);

        return notificationId;
    } catch (error) {
        console.error("Failed to send notification:", error);
        throw error;
    }
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(
    userId: string,
    unreadOnly: boolean = false
): Promise<Notification[]> {
    try {
        const notifications = await firestoreService.getDocuments<Notification>('notifications', [
            { field: 'userId', operator: '==', value: userId },
        ]);

        let filteredNotifications = notifications;

        if (unreadOnly) {
            filteredNotifications = filteredNotifications.filter(n => !n.isRead);
        }

        // Sort by createdAt descending
        filteredNotifications.sort((a, b) => {
            const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : (a.createdAt as Timestamp).toMillis();
            const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : (b.createdAt as Timestamp).toMillis();
            return bTime - aTime;
        });

        return filteredNotifications;
    } catch (error) {
        console.error("Failed to get user notifications:", error);
        return [];
    }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string): Promise<number> {
    try {
        const unreadNotifications = await getUserNotifications(userId, true);
        return unreadNotifications.length;
    } catch (error) {
        console.error("Failed to get unread count:", error);
        return 0;
    }
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
    try {
        await firestoreService.updateDocument('notifications', notificationId, {
            isRead: true,
        });
    } catch (error) {
        console.error("Failed to mark notification as read:", error);
        throw error;
    }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<void> {
    try {
        const unreadNotifications = await getUserNotifications(userId, true);

        await Promise.all(
            unreadNotifications.map(n => n.id ? markAsRead(n.id) : Promise.resolve())
        );
    } catch (error) {
        console.error("Failed to mark all as read:", error);
        throw error;
    }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
    try {
        await firestoreService.deleteDocument('notifications', notificationId);
    } catch (error) {
        console.error("Failed to delete notification:", error);
        throw error;
    }
}

/**
 * Delete all notifications for a user
 */
export async function deleteAllNotifications(userId: string): Promise<void> {
    try {
        const notifications = await getUserNotifications(userId);

        await Promise.all(
            notifications.map(n => n.id ? deleteNotification(n.id) : Promise.resolve())
        );
    } catch (error) {
        console.error("Failed to delete all notifications:", error);
        throw error;
    }
}

/**
 * Helper: Send task assigned notification
 */
export async function notifyTaskAssigned(
    userId: string,
    taskId: string,
    taskTitle: string
): Promise<void> {
    await sendNotification(userId, {
        type: 'task_assigned',
        title: 'משימה חדשה הוקצתה',
        message: `הוקצתה לך משימה: ${taskTitle}`,
        taskId,
    });
}

/**
 * Helper: Send workflow started notification
 */
export async function notifyWorkflowStarted(
    userId: string,
    workflowId: string,
    workflowName: string
): Promise<void> {
    await sendNotification(userId, {
        type: 'workflow_started',
        title: 'תהליך חדש התחיל',
        message: `התהליך "${workflowName}" התחיל`,
        workflowId,
    });
}

/**
 * Helper: Send task transferred notification
 */
export async function notifyTaskTransferred(
    userId: string,
    taskId: string,
    taskTitle: string,
    fromUser: string
): Promise<void> {
    await sendNotification(userId, {
        type: 'task_transferred',
        title: 'משימה הועברה אליך',
        message: `המשימה "${taskTitle}" הועברה אליך מ-${fromUser}`,
        taskId,
    });
}
