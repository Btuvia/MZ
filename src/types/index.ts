export type UserRole = 'admin' | 'agent' | 'client' | 'manager';

export type SalesStatus =
    | 'new_lead'
    | 'contacted'
    | 'meeting_scheduled'
    | 'proposal_sent'
    | 'negotiation'
    | 'closed_won'
    | 'closed_lost';

export type OperationsStatus =
    | 'sent_to_company'
    | 'needs_signatures'
    | 'needs_medical_info'
    | 'pending_approval'
    | 'policy_issued'
    | 'policy_rejected'
    | 'clearing_ordered';

export type ClientStatus = 'lead' | 'prospect' | 'active' | 'inactive' | 'churned';

export type PolicyType =
    | 'Pension'
    | 'Health'
    | 'Life'
    | 'Savings'
    | 'Car'
    | 'Home'
    | 'Disability'
    | 'Investment'
    | 'Business'
    | 'Finance';

export interface Policy {
    id: string;
    type: PolicyType;
    company: string;
    premium: number;
    balance?: number;
    startDate: string;
    renewalDate: string;
    status: string;
    policyNumber: string;
    commissionRate?: number;
    coverAmount?: number;
    employerContribution?: number;
    employeeContribution?: number;
}

export interface FamilyConnection {
    clientId: string;
    relation: string;
    name: string;
}

export interface ClientDocument {
    id: string;
    name: string;
    url: string;
    type: string;
    uploadDate: string;
    status: 'pending' | 'verified' | 'rejected';
}

export interface Client {
    id: string;
    name: string;
    email: string;
    phone: string;
    nationalId: string;
    address?: string;
    birthDate?: string;
    status: ClientStatus;
    salesStatus: SalesStatus;
    operationsStatus: OperationsStatus;
    pipelineStage?: string;
    dealValue?: number;
    churnProbability?: number;
    source?: string;
    campaign?: string;
    occupation?: string;
    familyStatus?: string;
    childrenCount?: number;
    familyConnections: FamilyConnection[];
    policies: Policy[];
    documents: ClientDocument[];
    communications: any[]; // To be defined
    tasks: any[]; // To be defined
    notes: string[];
    tags: string[];
    aiRecommendations: string[];
    dataQualityScore: number;
}

export interface Employee {
    id: string;
    name: string;
    email: string;
    phone: string;
    position: string;
    avatarUrl?: string;
    activeClientsCount: number;
    monthlySales: number;
    xp: number;
    level: number;
    badges: string[];
}

export interface Partner {
    id: string;
    name: string;
    type: string;
    companyName: string;
    contactName: string;
    email: string;
    phone: string;
    referralCode: string;
    totalReferrals: number;
    successfulPolicies: number;
    activeDeals: number;
    commissionEarned: number;
    commissionPremiums: number;
}

// ============================================
// TASK MANAGEMENT TYPES
// ============================================

// Task Types - 10 different types based on CRM analysis
export type TaskType =
    | "call"              // שיחה
    | "task"              // משימה כללית
    | "meeting"           // תיאום פגישה
    | "meeting_summary"   // סיכום פגישה
    | "documentation"     // תיעוד
    | "email_out"         // דואר יוצא
    | "email_in"          // דואר נכנס
    | "letter"            // מכתב
    | "sms"               // SMS
    | "fax";              // פקס

// Task Statuses - Enhanced status system
export type TaskStatus =
    | "new"               // חדש
    | "pending"           // ממתין
    | "in_progress"       // בטיפול
    | "completed"         // הושלם
    | "overdue"           // באיחור
    | "transferred"       // הועבר
    | "cancelled";        // בוטל

// Task Priority
export type TaskPriority =
    | "low"               // נמוך
    | "medium"            // רגיל
    | "high"              // דחוף
    | "urgent";           // קריטי

// Subtask interface
export interface Subtask {
    id: string;
    title: string;
    completed: boolean;
    createdAt?: Date;
    completedAt?: Date;
}

// Task Attachment
export interface TaskAttachment {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    uploadedAt: Date;
    uploadedBy: string;
    uploadedByName?: string;
}

// Enhanced Task Interface
export interface Task {
    id: string;
    title: string;
    description?: string;
    type: TaskType;
    status: TaskStatus;
    priority: TaskPriority;

    // Dates and Times
    date: string;                    // ISO date YYYY-MM-DD
    time: string;                    // HH:mm
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;

    // Links to other entities
    clientId?: string;
    clientName?: string;
    policyId?: string;
    companyId?: string;
    companyName?: string;

    // Assignment and ownership
    assignedTo: string;              // User ID
    assignedToName?: string;
    createdBy: string;
    createdByName?: string;

    // Workflow integration
    workflowId?: string;
    workflowName?: string;
    stepNumber?: number;
    daysToComplete?: number;         // SLA in days

    // Subject/Category
    subjectId?: string;
    subjectName?: string;

    // Attachments
    attachments?: TaskAttachment[];

    // Additional fields from CRM
    idNumber?: string;               // ת.ז לקוח
    employerName?: string;           // מעסיק
    agentName?: string;              // סוכן
    notes?: string;                  // הערות

    // Subtasks
    subtasks?: Subtask[];

    // Transfer tracking
    transferredFrom?: string;
    transferredFromName?: string;
    transferReason?: string;
    transferredAt?: Date;

    // Backward compatibility
    completed: boolean;              // Mapped to status === 'completed'
}

// View preferences
export type TaskViewType = 'calendar' | 'list' | 'kanban' | 'table';

export type TaskSortOption =
    | 'dueDate'
    | 'createdAt'
    | 'priority'
    | 'status'
    | 'clientName'
    | 'assignedTo'
    | 'type';

export interface TaskFilterPreset {
    name: string;
    status?: TaskStatus[];
    type?: TaskType[];
    assignedTo?: string[];
    priority?: TaskPriority[];
    dateRange?: { start: Date; end: Date };
    subjectId?: string[];
    workflowId?: string[];
}

export interface TaskViewPreferences {
    userId: string;
    visibleColumns: string[];        // Column IDs to display
    defaultView: TaskViewType;
    defaultFilter?: TaskFilterPreset;
    sortBy: TaskSortOption;
    sortDirection: 'asc' | 'desc';
}

// Export all status-related types
export * from './statuses';
