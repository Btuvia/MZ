// ============================================
// TASK SUBJECT TYPES
// ============================================

/**
 * TaskSubject - נושא/קטגוריה למשימה
 */
export interface TaskSubject {
    id: string;
    name: string;
    description?: string;

    // Behavior flags
    relatedToPolicy: boolean;        // קשור להפקת פוליסה
    isFutureLead: boolean;           // לקוח עתידי/פוטנציאלי

    // Workflow integration
    defaultWorkflowId?: string;      // תהליך ברירת מחדל

    // Display
    color?: string;                  // צבע לתצוגה (#hex)
    icon?: string;                   // שם אייקון
    order?: number;                  // סדר תצוגה

    // Status
    isActive: boolean;
    isSystem: boolean;               // נושא מערכת (לא ניתן למחוק)

    // Metadata
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    createdByName?: string;

    // Statistics
    taskCount?: number;              // כמות משימות עם נושא זה
    completionRate?: number;         // אחוז השלמה
}

/**
 * SubjectCategory - קטגוריה עליונה לנושאים
 */
export interface SubjectCategory {
    id: string;
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    subjects: string[];              // Subject IDs
    isActive: boolean;
}

/**
 * Default subjects for initialization
 */
export const DEFAULT_SUBJECTS: Omit<TaskSubject, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>[] = [
    {
        name: 'לקוח חדש',
        description: 'טיפול בלקוח חדש',
        relatedToPolicy: false,
        isFutureLead: true,
        color: '#3b82f6',
        icon: 'UserPlus',
        isActive: true,
        isSystem: true,
    },
    {
        name: 'הפקת פוליסה',
        description: 'תהליך הפקת פוליסה חדשה',
        relatedToPolicy: true,
        isFutureLead: false,
        color: '#10b981',
        icon: 'FileText',
        isActive: true,
        isSystem: true,
    },
    {
        name: 'חידוש פוליסה',
        description: 'חידוש פוליסה קיימת',
        relatedToPolicy: true,
        isFutureLead: false,
        color: '#f59e0b',
        icon: 'RefreshCw',
        isActive: true,
        isSystem: true,
    },
    {
        name: 'תביעה',
        description: 'טיפול בתביעה',
        relatedToPolicy: true,
        isFutureLead: false,
        color: '#ef4444',
        icon: 'AlertCircle',
        isActive: true,
        isSystem: true,
    },
    {
        name: 'שירות לקוחות',
        description: 'פניות שירות כלליות',
        relatedToPolicy: false,
        isFutureLead: false,
        color: '#8b5cf6',
        icon: 'Headphones',
        isActive: true,
        isSystem: true,
    },
    {
        name: 'מעקב',
        description: 'מעקב אחר לקוח',
        relatedToPolicy: false,
        isFutureLead: true,
        color: '#06b6d4',
        icon: 'Eye',
        isActive: true,
        isSystem: false,
    },
    {
        name: 'שיחת טלפון',
        description: 'שיחה טלפונית עם לקוח',
        relatedToPolicy: false,
        isFutureLead: false,
        color: '#14b8a6',
        icon: 'Phone',
        isActive: true,
        isSystem: false,
    },
];
