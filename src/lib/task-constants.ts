// ============================================
// TASK CONSTANTS & HELPERS
// ============================================

import { TaskType, TaskStatus, TaskPriority } from '@/types';
import {
    Phone,
    CheckSquare,
    Calendar,
    FileText,
    BookOpen,
    Mail,
    MailOpen,
    FileSignature,
    MessageSquare,
    Printer,
    type LucideIcon
} from 'lucide-react';

/**
 * Task Type Metadata
 */
export interface TaskTypeMetadata {
    value: TaskType;
    label: string;
    labelHe: string;
    icon: LucideIcon;
    color: string;
    description: string;
}

export const TASK_TYPES: TaskTypeMetadata[] = [
    {
        value: 'call',
        label: 'Call',
        labelHe: 'שיחה',
        icon: Phone,
        color: '#3b82f6',
        description: 'שיחת טלפון עם לקוח',
    },
    {
        value: 'task',
        label: 'Task',
        labelHe: 'משימה',
        icon: CheckSquare,
        color: '#8b5cf6',
        description: 'משימה כללית',
    },
    {
        value: 'meeting',
        label: 'Meeting',
        labelHe: 'פגישה',
        icon: Calendar,
        color: '#10b981',
        description: 'תיאום פגישה עם לקוח',
    },
    {
        value: 'meeting_summary',
        label: 'Meeting Summary',
        labelHe: 'סיכום פגישה',
        icon: FileText,
        color: '#06b6d4',
        description: 'סיכום פגישה שהתקיימה',
    },
    {
        value: 'documentation',
        label: 'Documentation',
        labelHe: 'תיעוד',
        icon: BookOpen,
        color: '#f59e0b',
        description: 'תיעוד מידע ומסמכים',
    },
    {
        value: 'email_out',
        label: 'Email Out',
        labelHe: 'דואר יוצא',
        icon: Mail,
        color: '#ef4444',
        description: 'שליחת אימייל ללקוח',
    },
    {
        value: 'email_in',
        label: 'Email In',
        labelHe: 'דואר נכנס',
        icon: MailOpen,
        color: '#ec4899',
        description: 'קבלת אימייל מלקוח',
    },
    {
        value: 'letter',
        label: 'Letter',
        labelHe: 'מכתב',
        icon: FileSignature,
        color: '#6366f1',
        description: 'מכתב רשמי',
    },
    {
        value: 'sms',
        label: 'SMS',
        labelHe: 'SMS',
        icon: MessageSquare,
        color: '#14b8a6',
        description: 'הודעת טקסט',
    },
    {
        value: 'fax',
        label: 'Fax',
        labelHe: 'פקס',
        icon: Printer,
        color: '#64748b',
        description: 'שליחת פקס',
    },
];

/**
 * Task Status Metadata
 */
export interface TaskStatusMetadata {
    value: TaskStatus;
    label: string;
    labelHe: string;
    color: string;
    bgColor: string;
    textColor: string;
    description: string;
}

export const TASK_STATUSES: TaskStatusMetadata[] = [
    {
        value: 'new',
        label: 'New',
        labelHe: 'חדש',
        color: '#3b82f6',
        bgColor: '#dbeafe',
        textColor: '#1e40af',
        description: 'משימה חדשה',
    },
    {
        value: 'pending',
        label: 'Pending',
        labelHe: 'ממתין',
        color: '#f59e0b',
        bgColor: '#fef3c7',
        textColor: '#92400e',
        description: 'ממתין לפעולה',
    },
    {
        value: 'in_progress',
        label: 'In Progress',
        labelHe: 'בטיפול',
        color: '#8b5cf6',
        bgColor: '#ede9fe',
        textColor: '#5b21b6',
        description: 'בטיפול כרגע',
    },
    {
        value: 'completed',
        label: 'Completed',
        labelHe: 'הושלם',
        color: '#10b981',
        bgColor: '#d1fae5',
        textColor: '#065f46',
        description: 'הושלם בהצלחה',
    },
    {
        value: 'overdue',
        label: 'Overdue',
        labelHe: 'באיחור',
        color: '#ef4444',
        bgColor: '#fee2e2',
        textColor: '#991b1b',
        description: 'חרג מזמן היעד',
    },
    {
        value: 'transferred',
        label: 'Transferred',
        labelHe: 'הועבר',
        color: '#ec4899',
        bgColor: '#fce7f3',
        textColor: '#9f1239',
        description: 'הועבר למשתמש אחר',
    },
    {
        value: 'cancelled',
        label: 'Cancelled',
        labelHe: 'בוטל',
        color: '#64748b',
        bgColor: '#f1f5f9',
        textColor: '#334155',
        description: 'בוטל',
    },
];

/**
 * Task Priority Metadata
 */
export interface TaskPriorityMetadata {
    value: TaskPriority;
    label: string;
    labelHe: string;
    color: string;
    bgColor: string;
    textColor: string;
    order: number;
}

export const TASK_PRIORITIES: TaskPriorityMetadata[] = [
    {
        value: 'low',
        label: 'Low',
        labelHe: 'נמוך',
        color: '#64748b',
        bgColor: '#f1f5f9',
        textColor: '#475569',
        order: 1,
    },
    {
        value: 'medium',
        label: 'Medium',
        labelHe: 'רגיל',
        color: '#3b82f6',
        bgColor: '#dbeafe',
        textColor: '#1e40af',
        order: 2,
    },
    {
        value: 'high',
        label: 'High',
        labelHe: 'דחוף',
        color: '#f59e0b',
        bgColor: '#fef3c7',
        textColor: '#92400e',
        order: 3,
    },
    {
        value: 'urgent',
        label: 'Urgent',
        labelHe: 'קריטי',
        color: '#ef4444',
        bgColor: '#fee2e2',
        textColor: '#991b1b',
        order: 4,
    },
];

/**
 * Helper functions
 */

export function getTaskTypeMetadata(type: TaskType): TaskTypeMetadata | undefined {
    return TASK_TYPES.find(t => t.value === type);
}

export function getTaskStatusMetadata(status: TaskStatus): TaskStatusMetadata | undefined {
    return TASK_STATUSES.find(s => s.value === status);
}

export function getTaskPriorityMetadata(priority: TaskPriority): TaskPriorityMetadata | undefined {
    return TASK_PRIORITIES.find(p => p.value === priority);
}

export function getTaskTypeLabel(type: TaskType, hebrew: boolean = true): string {
    const metadata = getTaskTypeMetadata(type);
    return metadata ? (hebrew ? metadata.labelHe : metadata.label) : type;
}

export function getTaskStatusLabel(status: TaskStatus, hebrew: boolean = true): string {
    const metadata = getTaskStatusMetadata(status);
    return metadata ? (hebrew ? metadata.labelHe : metadata.label) : status;
}

export function getTaskPriorityLabel(priority: TaskPriority, hebrew: boolean = true): string {
    const metadata = getTaskPriorityMetadata(priority);
    return metadata ? (hebrew ? metadata.labelHe : metadata.label) : priority;
}

/**
 * Available columns for table view
 */
export interface ColumnDefinition {
    id: string;
    label: string;
    labelHe: string;
    width?: string;
    sortable: boolean;
    defaultVisible: boolean;
}

export const AVAILABLE_TASK_COLUMNS: ColumnDefinition[] = [
    { id: 'title', label: 'Title', labelHe: 'כותרת', sortable: true, defaultVisible: true },
    { id: 'type', label: 'Type', labelHe: 'סוג', sortable: true, defaultVisible: true },
    { id: 'status', label: 'Status', labelHe: 'סטטוס', sortable: true, defaultVisible: true },
    { id: 'priority', label: 'Priority', labelHe: 'עדיפות', sortable: true, defaultVisible: true },
    { id: 'dueDate', label: 'Due Date', labelHe: 'תאריך יעד', sortable: true, defaultVisible: true },
    { id: 'dueTime', label: 'Due Time', labelHe: 'שעת יעד', sortable: false, defaultVisible: true },
    { id: 'assignedTo', label: 'Assigned To', labelHe: 'אחראי', sortable: true, defaultVisible: true },
    { id: 'clientName', label: 'Client', labelHe: 'לקוח', sortable: true, defaultVisible: true },
    { id: 'subject', label: 'Subject', labelHe: 'נושא', sortable: true, defaultVisible: false },
    { id: 'workflow', label: 'Workflow', labelHe: 'תהליך', sortable: false, defaultVisible: false },
    { id: 'createdBy', label: 'Created By', labelHe: 'נוצר ע"י', sortable: true, defaultVisible: false },
    { id: 'createdAt', label: 'Created At', labelHe: 'תאריך יצירה', sortable: true, defaultVisible: false },
    { id: 'idNumber', label: 'ID Number', labelHe: 'ת.ז', sortable: false, defaultVisible: false },
    { id: 'employerName', label: 'Employer', labelHe: 'מעסיק', sortable: false, defaultVisible: false },
    { id: 'agentName', label: 'Agent', labelHe: 'סוכן', sortable: false, defaultVisible: false },
    { id: 'description', label: 'Description', labelHe: 'תיאור', sortable: false, defaultVisible: false },
    { id: 'notes', label: 'Notes', labelHe: 'הערות', sortable: false, defaultVisible: false },
];

/**
 * Default column visibility
 */
export const DEFAULT_VISIBLE_COLUMNS = AVAILABLE_TASK_COLUMNS
    .filter(col => col.defaultVisible)
    .map(col => col.id);
