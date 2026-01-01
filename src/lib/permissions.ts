// ============================================
// PERMISSIONS SYSTEM
// ============================================

import { UserRole } from '@/types';

/**
 * Permission definitions for task management
 */
export interface TaskPermissions {
    canViewOwn: boolean;
    canViewAll: boolean;
    canViewTeam: boolean;
    canCreate: boolean;
    canEditOwn: boolean;
    canEditAll: boolean;
    canDeleteOwn: boolean;
    canDeleteAll: boolean;
    canTransfer: boolean;
    canManageWorkflows: boolean;
    canManageSubjects: boolean;
    canManageSettings: boolean;
    canViewAnalytics: boolean;
    canExportData: boolean;
}

/**
 * Role-based permissions
 */
export const TASK_PERMISSIONS: Record<UserRole, TaskPermissions> = {
    // Agent - Basic user
    agent: {
        canViewOwn: true,
        canViewAll: false,
        canViewTeam: false,
        canCreate: true,
        canEditOwn: true,
        canEditAll: false,
        canDeleteOwn: false,
        canDeleteAll: false,
        canTransfer: false,
        canManageWorkflows: false,
        canManageSubjects: false,
        canManageSettings: false,
        canViewAnalytics: false,
        canExportData: false,
    },

    // Manager - Team lead
    manager: {
        canViewOwn: true,
        canViewAll: true,           // Can view all team tasks
        canViewTeam: true,
        canCreate: true,
        canEditOwn: true,
        canEditAll: true,           // Can edit team tasks
        canDeleteOwn: true,
        canDeleteAll: false,        // Cannot delete others' tasks
        canTransfer: true,          // Can transfer tasks
        canManageWorkflows: false,  // Cannot create workflows
        canManageSubjects: false,   // Cannot manage subjects
        canManageSettings: false,
        canViewAnalytics: true,     // Can view analytics
        canExportData: true,
    },

    // Admin - Full access
    admin: {
        canViewOwn: true,
        canViewAll: true,
        canViewTeam: true,
        canCreate: true,
        canEditOwn: true,
        canEditAll: true,
        canDeleteOwn: true,
        canDeleteAll: true,
        canTransfer: true,
        canManageWorkflows: true,   // Can create/edit workflows
        canManageSubjects: true,    // Can manage subjects
        canManageSettings: true,    // Can manage system settings
        canViewAnalytics: true,
        canExportData: true,
    },

    // Client - Read-only for their own tasks
    client: {
        canViewOwn: true,
        canViewAll: false,
        canViewTeam: false,
        canCreate: false,
        canEditOwn: false,
        canEditAll: false,
        canDeleteOwn: false,
        canDeleteAll: false,
        canTransfer: false,
        canManageWorkflows: false,
        canManageSubjects: false,
        canManageSettings: false,
        canViewAnalytics: false,
        canExportData: false,
    },
};

/**
 * Check if user has specific permission
 */
export function hasPermission(
    userRole: UserRole,
    permission: keyof TaskPermissions
): boolean {
    return TASK_PERMISSIONS[userRole][permission];
}

/**
 * Check if user can perform action on task
 */
export function canPerformTaskAction(
    userRole: UserRole,
    action: 'view' | 'edit' | 'delete' | 'transfer',
    isOwnTask: boolean
): boolean {
    const permissions = TASK_PERMISSIONS[userRole];

    switch (action) {
        case 'view':
            return isOwnTask ? permissions.canViewOwn : permissions.canViewAll;
        case 'edit':
            return isOwnTask ? permissions.canEditOwn : permissions.canEditAll;
        case 'delete':
            return isOwnTask ? permissions.canDeleteOwn : permissions.canDeleteAll;
        case 'transfer':
            return permissions.canTransfer;
        default:
            return false;
    }
}

/**
 * Get filtered permissions for UI
 */
export function getTaskPermissions(userRole: UserRole): TaskPermissions {
    return TASK_PERMISSIONS[userRole];
}

/**
 * Check if user can access admin features
 */
export function canAccessAdminFeatures(userRole: UserRole): boolean {
    return userRole === 'admin' || userRole === 'manager';
}

/**
 * Check if user can manage workflows
 */
export function canManageWorkflows(userRole: UserRole): boolean {
    return hasPermission(userRole, 'canManageWorkflows');
}

/**
 * Check if user can manage subjects
 */
export function canManageSubjects(userRole: UserRole): boolean {
    return hasPermission(userRole, 'canManageSubjects');
}

/**
 * Permission helper for components
 */
export class PermissionHelper {
    constructor(private userRole: UserRole, private userId: string) { }

    canView(taskOwnerId: string): boolean {
        return canPerformTaskAction(
            this.userRole,
            'view',
            taskOwnerId === this.userId
        );
    }

    canEdit(taskOwnerId: string): boolean {
        return canPerformTaskAction(
            this.userRole,
            'edit',
            taskOwnerId === this.userId
        );
    }

    canDelete(taskOwnerId: string): boolean {
        return canPerformTaskAction(
            this.userRole,
            'delete',
            taskOwnerId === this.userId
        );
    }

    canTransfer(): boolean {
        return hasPermission(this.userRole, 'canTransfer');
    }

    canManageWorkflows(): boolean {
        return hasPermission(this.userRole, 'canManageWorkflows');
    }

    canManageSubjects(): boolean {
        return hasPermission(this.userRole, 'canManageSubjects');
    }

    canViewAnalytics(): boolean {
        return hasPermission(this.userRole, 'canViewAnalytics');
    }

    isAdmin(): boolean {
        return this.userRole === 'admin';
    }

    isManager(): boolean {
        return this.userRole === 'manager';
    }

    isAgent(): boolean {
        return this.userRole === 'agent';
    }
}
