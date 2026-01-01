// ============================================
// WORKFLOW TYPES
// ============================================

import { TaskType, UserRole } from './index';

/**
 * Workflow - תהליך עבודה עם שלבים מוגדרים
 */
export interface Workflow {
    id: string;
    name: string;
    description?: string;
    steps: WorkflowStep[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    createdByName?: string;

    // Metadata
    category?: string;              // קטגוריה (לקוח חדש, חידוש, תביעה וכו')
    estimatedDuration?: number;     // משך זמן משוער בימים
    successRate?: number;           // אחוז הצלחה
    usageCount?: number;            // כמה פעמים נוצר
}

/**
 * WorkflowStep - שלב בתהליך
 */
export interface WorkflowStep {
    id: string;
    stepNumber: number;             // מספר סידורי של השלב
    name: string;
    description?: string;
    taskType: TaskType;             // סוג המשימה שתיווצר
    daysToComplete: number;         // SLA - ימים לביצוע

    // Assignment
    assigneeRole?: UserRole;        // תפקיד ברירת מחדל (agent/manager/admin)
    assigneeId?: string;            // משתמש ספציפי (אופציונלי)

    // Automation
    autoCreate: boolean;            // יצירה אוטומטית של המשימה
    requiresPreviousCompletion: boolean; // דורש השלמת שלב קודם

    // Templates
    titleTemplate?: string;         // תבנית לכותרת המשימה
    descriptionTemplate?: string;   // תבנית לתיאור

    // Dependencies
    dependsOnSteps?: number[];      // שלבים שצריך להשלים לפני

    // Notifications
    notifyOnCreate?: boolean;       // התראה ביצירה
    notifyOnOverdue?: boolean;      // התראה באיחור
    reminderDaysBefore?: number;    // תזכורת X ימים לפני
}

/**
 * WorkflowInstance - מופע של תהליך שרץ
 */
export interface WorkflowInstance {
    id: string;
    workflowId: string;
    workflowName: string;

    // Context
    clientId: string;
    clientName: string;
    policyId?: string;

    // Status
    status: 'active' | 'completed' | 'cancelled' | 'paused';
    startedAt: Date;
    completedAt?: Date;
    cancelledAt?: Date;
    cancelReason?: string;

    // Progress
    currentStep: number;
    totalSteps: number;
    completedSteps: number;

    // Tasks
    tasks: string[];                // Task IDs שנוצרו במסגרת התהליך

    // Metadata
    startedBy: string;
    startedByName?: string;
    notes?: string;

    // Performance
    actualDuration?: number;        // משך זמן בפועל בימים
    slaCompliance?: number;         // אחוז עמידה ב-SLA
}

/**
 * WorkflowTemplate - תבנית מוכנה לתהליך
 */
export interface WorkflowTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>;
    isPublic: boolean;              // זמין לכולם או פרטי
    createdBy: string;
    usageCount: number;
}

/**
 * WorkflowAnalytics - אנליטיקה על תהליך
 */
export interface WorkflowAnalytics {
    workflowId: string;
    totalInstances: number;
    activeInstances: number;
    completedInstances: number;
    cancelledInstances: number;

    averageDuration: number;        // ממוצע ימים להשלמה
    averageSlaCompliance: number;   // ממוצע עמידה ב-SLA
    successRate: number;            // אחוז השלמה מוצלחת

    bottleneckSteps: number[];      // שלבים שגורמים לעיכובים

    // Time-based
    period: 'week' | 'month' | 'quarter' | 'year';
    startDate: Date;
    endDate: Date;
}
