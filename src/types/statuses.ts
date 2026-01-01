// Status and Source Type Definitions

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type TransferStatus = 'pending' | 'accepted' | 'rejected';

// Lead Status
export interface LeadStatus {
    id: string;
    name: string;
    nameHe: string; // Hebrew name
    color: string;
    icon?: string;
    orderIndex: number;
    isActive: boolean;
    isSystem: boolean; // System statuses cannot be deleted
    createdAt: Date;
}

// Task Status
export interface TaskStatus {
    id: string;
    name: string;
    nameHe: string; // Hebrew name
    color: string;
    icon?: string;
    isFinal: boolean; // If true, task is considered complete
    slaHours?: number; // SLA in hours
    createdAt: Date;
}

// Lead Source
export interface LeadSource {
    id: string;
    name: string;
    nameHe: string; // Hebrew name
    description?: string;
    icon?: string;
    color?: string;
    isActive: boolean;
    trackingCode?: string;
    createdAt: Date;
    updatedAt: Date;
}

// User Permission
export interface UserPermission {
    id: string;
    userId: string;
    permissionKey: string;
    isGranted: boolean;
    createdAt: Date;
}

// Permission Keys Enum
export const PermissionKeys = {
    VIEW_EMAIL: 'view_email',
    VIEW_FAX: 'view_fax',
    VIEW_MOBILE: 'view_mobile',
    VIEW_INSURANCE_AGENT: 'view_insurance_agent',
    VIEW_HEALTH_FUND: 'view_health_fund',
    VIEW_ASSIGNED_BY: 'view_assigned_by',
    VIEW_SITE_TIME: 'view_site_time',
    VIEW_LEAD_TIME: 'view_lead_time',
    VIEW_ALERTS: 'view_alerts',
    VIEW_INSURANCE_COMPANY: 'view_insurance_company',
    MANAGE_POLICIES: 'manage_policies',
    MANAGE_LEADS: 'manage_leads',
    TRANSFER_LEADS: 'transfer_leads',
    MANAGE_TASKS: 'manage_tasks',
    TRANSFER_TASKS: 'transfer_tasks',
    MANAGE_CLIENTS: 'manage_clients',
    VIEW_REPORTS: 'view_reports',
    MANAGE_USERS: 'manage_users',
    MANAGE_SETTINGS: 'manage_settings',
} as const;

// Lead Transfer
export interface LeadTransfer {
    id: string;
    leadId: string;
    fromUserId: string;
    fromUserName: string;
    toUserId: string;
    toUserName: string;
    transferReason: string;
    transferNotes?: string;
    status: TransferStatus;
    transferredAt: Date;
    respondedAt?: Date;
}

// Task Transfer
export interface TaskTransfer {
    id: string;
    taskId: string;
    fromUserId: string;
    fromUserName: string;
    toUserId: string;
    toUserName: string;
    transferReason: string;
    transferNotes?: string;
    status: TransferStatus;
    transferredAt: Date;
    respondedAt?: Date;
}

// Activity Log
export type ActivityAction =
    | 'created'
    | 'updated'
    | 'deleted'
    | 'transferred'
    | 'status_changed'
    | 'assigned'
    | 'commented'
    | 'uploaded_document'
    | 'sent_email'
    | 'made_call';

export type ActivityEntityType = 'lead' | 'task' | 'policy' | 'client' | 'deal';

export interface ActivityLog {
    id: string;
    entityType: ActivityEntityType;
    entityId: string;
    actionType: ActivityAction;
    userId: string;
    userName: string;
    oldValue?: string;
    newValue?: string;
    notes?: string;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
}

// Enhanced Task with new fields
export interface EnhancedTask {
    id: string;
    title: string;
    description?: string;
    clientId?: string;
    clientName?: string;
    assignee: string;
    assigneeId?: string;
    statusId?: string; // Reference to TaskStatus
    priority: Priority;
    dueDate: string;
    dueTime?: string;
    estimatedHours?: number;
    actualHours?: number;
    slaDueDate?: Date;
    isOverdue?: boolean;
    parentTaskId?: string;
    completionPercentage: number;
    subtasks?: Array<{
        id: string;
        title: string;
        completed: boolean;
    }>;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
}

// Enhanced Lead with new fields
export interface EnhancedLead {
    id: string;
    name: string;
    email: string;
    phone: string;
    sourceId?: string; // Reference to LeadSource
    statusId?: string; // Reference to LeadStatus
    assignedAgentId?: string;
    assignedAgentName?: string;
    priority: Priority;
    expectedCloseDate?: Date;
    estimatedValue?: number;
    notes?: string;
    tags?: string[];
    createdAt: Date;
    updatedAt: Date;
}

// Distribution Settings
export interface DistributionSetting {
    id: string;
    userId: string;
    settingKey: string;
    settingValue: string;
    category?: string; // 'הגדרת עמודות', 'ניהול כתובות', etc.
    createdAt: Date;
}

// Policy Type Definition
export interface PolicyTypeDefinition {
    id: string;
    name: string;
    nameHe: string;
    category: string;
    description?: string;
    icon?: string;
    isActive: boolean;
    createdAt: Date;
}
