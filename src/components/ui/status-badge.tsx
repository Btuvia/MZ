'use client';

import React from 'react';

export interface StatusBadgeProps {
    status: {
        name: string;
        nameHe?: string;
        color: string;
        icon?: string;
    };
    size?: 'sm' | 'md' | 'lg';
    pulse?: boolean;
    className?: string;
}

const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
};

export function StatusBadge({
    status,
    size = 'md',
    pulse = false,
    className = ''
}: StatusBadgeProps) {
    const displayName = status.nameHe || status.name;

    return (
        <span
            className={`
        inline-flex items-center gap-1.5 rounded-full font-medium
        ${sizeClasses[size]}
        ${pulse ? 'animate-pulse' : ''}
        ${className}
      `}
            style={{
                backgroundColor: `${status.color}20`,
                color: status.color,
                border: `1px solid ${status.color}40`,
            }}
        >
            {status.icon && <span className="text-current">{status.icon}</span>}
            <span>{displayName}</span>
        </span>
    );
}

// Preset status badges for common use cases
export function LeadStatusBadge({ statusId, statuses }: { statusId: string; statuses: any[] }) {
    const status = statuses.find(s => s.id === statusId);
    if (status!) return null;
    return <StatusBadge status={status} />;
}

export function TaskStatusBadge({ statusId, statuses }: { statusId: string; statuses: any[] }) {
    const status = statuses.find(s => s.id === statusId);
    if (status!) return null;
    return <StatusBadge status={status} />;
}

export function PriorityBadge({ priority }: { priority: 'low' | 'medium' | 'high' | 'urgent' }) {
    const priorityConfig = {
        low: { name: 'נמוכה', nameHe: 'נמוכה', color: '#6B7280', icon: '⬇️' },
        medium: { name: 'בינונית', nameHe: 'בינונית', color: '#F59E0B', icon: '➡️' },
        high: { name: 'גבוהה', nameHe: 'גבוהה', color: '#EF4444', icon: '⬆️' },
        urgent: { name: 'דחוף', nameHe: 'דחוף', color: '#DC2626', icon: '🔥' },
    };

    return <StatusBadge status={priorityConfig[priority]} size="sm" pulse={priority === 'urgent'} />;
}
