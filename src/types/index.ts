export type UserRole = 'admin' | 'agent' | 'client' | 'manager';

// ============================================
// SYSTEM USER (for authentication)
// ============================================
export interface SystemUser {
    id: string;
    uid: string;              // Firebase Auth UID
    email: string;
    displayName: string;
    role: UserRole;
    isActive: boolean;
    avatarUrl?: string;
    phone?: string;
    createdAt?: Date;
    updatedAt?: Date;
    lastLoginAt?: Date;
}

// ============================================
// COMMUNICATION TYPES
// ============================================
export type CommunicationType = 'call' | 'email' | 'sms' | 'meeting' | 'note' | 'whatsapp';

export interface Communication {
    id: string;
    type: CommunicationType;
    subject?: string;
    content: string;
    direction: 'inbound' | 'outbound';
    status?: 'sent' | 'delivered' | 'read' | 'failed';
    createdAt: Date;
    createdBy: string;
    createdByName?: string;
    duration?: number; // For calls, in seconds
    attachments?: string[];
}

// ============================================
// CLIENT TASK REFERENCE
// ============================================
export interface ClientTaskRef {
    id: string;
    title: string;
    status: string;
    dueDate?: string;
    priority?: string;
}

// ============================================
// CONTACT REQUEST
// ============================================
export interface ContactRequest {
    id?: string;
    // Original fields
    name?: string;
    email?: string;
    phone?: string;
    subject?: string;
    message?: string;
    // Client portal fields
    topic?: string;
    scheduledTime?: string;
    contactName?: string;
    description?: string;
    source?: string;
    // Common
    status?: 'new' | 'in_progress' | 'resolved' | 'closed';
    createdAt?: Date;
    assignedTo?: string;
}

// ============================================
// FINANCIAL PRODUCT
// ============================================
export interface FinancialProduct {
    id?: string;
    clientId?: string;
    name: string;
    type: string;
    company?: string;
    description?: string;
    commissionRate?: number;
    isActive?: boolean;
    // Additional fields used in savings page
    accountNumber?: string;
    balance?: string;
    monthlyDeposit?: string;
    employerContribution?: string;
    returns?: string;
    riskLevel?: string;
    icon?: string;
    color?: string;
    details?: Record<string, unknown>;
    createdAt?: Date;
    updatedAt?: Date;
}

// ============================================
// COLLABORATION
// ============================================
export type CollaborationType = 'סוכן' | 'נציג' | 'שיתוף פעולה';
export type CollaborationStatus = 'טיוטה' | 'נשלח חוזה' | 'חתום' | 'פעיל' | 'מבוטל';

export interface Collaboration {
    id?: string;
    name: string;
    email: string;
    phone?: string;
    idNumber?: string;
    type: CollaborationType;
    terms?: string;
    status: CollaborationStatus;
    createdAt?: Date;
    contractSentAt?: Date;
    referralCode?: string;
}

// ============================================
// ACTIVITY LOG
// ============================================
export interface ActivityLogEntry {
    id?: string;
    entityType: 'client' | 'lead' | 'task' | 'deal' | 'workflow' | 'user';
    entityId: string;
    userId: string;
    userName?: string;
    action: string;
    details?: Record<string, unknown>;
    createdAt?: Date;
}

// ============================================
// USER PREFERENCES
// ============================================
export interface UserPreferences {
    id?: string;
    userId: string;
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    notifications?: {
        email: boolean;
        push: boolean;
        sms: boolean;
    };
    dashboardLayout?: string[];
    defaultView?: string;
    timezone?: string;
    fcmTokens?: string[];
    createdAt?: Date;
    updatedAt?: Date;
    // Allow additional properties
    [key: string]: unknown;
}

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
    communications: Communication[];
    tasks: ClientTaskRef[];
    notes: string[];
    tags: string[];
    aiRecommendations: string[];
    dataQualityScore: number;
    createdAt?: Date;
    updatedAt?: Date;
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

// ============================================
// LEAD TYPES
// ============================================

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';

export interface Lead {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    source?: string;
    status: LeadStatus;
    score?: number;
    assignedTo?: string;
    assignedToName?: string;
    notes?: string;
    lastContact?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

// ============================================
// DEAL TYPES
// ============================================

export type DealStage = 'discovery' | 'proposal' | 'negotiation' | 'contract' | 'closed_won' | 'closed_lost';

export interface Deal {
    id: string;
    title: string;
    clientId?: string;
    clientName?: string;
    leadId?: string;
    value: number;
    stage: DealStage;
    probability: number;
    expectedCloseDate?: string;
    assignedTo?: string;
    assignedToName?: string;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
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
