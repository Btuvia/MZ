"use client";

import { useState, useEffect } from "react";
import { Card } from "./base";
import { Bell, X, Check, Trash2, Eye } from "lucide-react";
import { Notification, getUserNotifications, markAsRead, markAllAsRead, deleteNotification, getUnreadCount } from "@/lib/automation/notifications";
import { useRouter } from "next/navigation";
import { handleError } from "@/lib/error-handler";

interface NotificationsPanelProps {
    userId: string;
}

export function NotificationsPanel({ userId }: NotificationsPanelProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Load notifications
    const loadNotifications = async () => {
        setLoading(true);
        try {
            const [allNotifications, count] = await Promise.all([
                getUserNotifications(userId),
                getUnreadCount(userId),
            ]);
            setNotifications(allNotifications);
            setUnreadCount(count);
        } catch (error) {
            handleError(error, { context: 'טעינת התראות', silent: true });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
            loadNotifications();

            // Refresh every 30 seconds
            const interval = setInterval(loadNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [userId]);

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            await markAsRead(notificationId);
            await loadNotifications();
        } catch (error) {
            handleError(error, { context: 'סימון כנקראה', silent: true });
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead(userId);
            await loadNotifications();
        } catch (error) {
            handleError(error, { context: 'סימון הכל כנקרא', silent: true });
        }
    };

    const handleDelete = async (notificationId: string) => {
        try {
            await deleteNotification(notificationId);
            await loadNotifications();
        } catch (error) {
            handleError(error, { context: 'מחיקת התראה' });
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        // Mark as read
        if (!notification.isRead && notification.id) {
            await handleMarkAsRead(notification.id);
        }

        // Navigate to task/workflow
        if (notification.taskId) {
            router.push(`/admin/calendar?task=${notification.taskId}`);
        } else if (notification.workflowId) {
            router.push(`/admin/workflows?id=${notification.workflowId}`);
        }

        setIsOpen(false);
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'task_assigned':
                return '📋';
            case 'task_overdue':
                return '⚠️';
            case 'task_completed':
                return '✅';
            case 'task_transferred':
                return '🔀';
            case 'workflow_started':
                return '🚀';
            case 'workflow_completed':
                return '🎉';
            case 'sla_warning':
                return '⏰';
            default:
                return '🔔';
        }
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'task_overdue':
            case 'sla_warning':
                return 'border-r-red-500 bg-red-50';
            case 'task_completed':
            case 'workflow_completed':
                return 'border-r-green-500 bg-green-50';
            case 'task_assigned':
            case 'workflow_started':
                return 'border-r-blue-500 bg-blue-50';
            case 'task_transferred':
                return 'border-r-purple-500 bg-purple-50';
            default:
                return 'border-r-slate-300 bg-white';
        }
    };

    return (
        <div className="relative" dir="rtl">
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
                <Bell size={20} className="text-slate-600" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <>
                    {/* Overlay */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Panel */}
                    <Card className="absolute left-0 top-12 w-96 max-h-[600px] shadow-2xl border-2 border-slate-200 z-20 overflow-hidden">
                        {/* Header */}
                        <div className="p-4 border-b border-slate-200 bg-slate-50 sticky top-0">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-black text-slate-900">התראות</h3>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 hover:bg-slate-200 rounded"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="text-sm text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1"
                                >
                                    <Check size={14} />
                                    סמן הכל כנקרא
                                </button>
                            )}
                        </div>

                        {/* Notifications List */}
                        <div className="overflow-y-auto max-h-[500px]">
                            {loading ? (
                                <div className="p-8 text-center text-slate-400">
                                    טוען...
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Bell size={48} className="mx-auto text-slate-300 mb-3" />
                                    <p className="text-slate-400">אין התראות</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors border-r-4 ${getNotificationColor(notification.type)
                                                } ${!notification.isRead ? 'font-bold' : ''}`}
                                            onClick={() => handleNotificationClick(notification)}
                                        >
                                            <div className="flex items-start gap-3">
                                                {/* Icon */}
                                                <div className="text-2xl shrink-0">
                                                    {getNotificationIcon(notification.type)}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2 mb-1">
                                                        <h4 className="text-sm font-bold text-slate-900">
                                                            {notification.title}
                                                        </h4>
                                                        {!notification.isRead && (
                                                            <div className="w-2 h-2 bg-indigo-600 rounded-full shrink-0 mt-1" />
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-slate-600 mb-2">
                                                        {notification.message}
                                                    </p>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-slate-400">
                                                            {formatTime(notification.createdAt)}
                                                        </span>
                                                        <div className="flex gap-1">
                                                            {!notification.isRead && notification.id && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleMarkAsRead(notification.id!);
                                                                    }}
                                                                    className="p-1 hover:bg-slate-200 rounded text-slate-500"
                                                                    title="סמן כנקרא"
                                                                >
                                                                    <Eye size={14} />
                                                                </button>
                                                            )}
                                                            {notification.id && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDelete(notification.id!);
                                                                    }}
                                                                    className="p-1 hover:bg-red-100 rounded text-red-600"
                                                                    title="מחק"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>
                </>
            )}
        </div>
    );
}

function formatTime(timestamp: any): string {
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'עכשיו';
    if (diffMins < 60) return `לפני ${diffMins} דקות`;
    if (diffHours < 24) return `לפני ${diffHours} שעות`;
    if (diffDays < 7) return `לפני ${diffDays} ימים`;

    return date.toLocaleDateString('he-IL');
}
