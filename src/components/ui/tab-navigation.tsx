'use client';

import React from 'react';

export interface Tab {
    id: string;
    label: string;
    labelHe?: string;
    icon?: string;
    badge?: number;
    disabled?: boolean;
}

export interface TabNavigationProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
    variant?: 'default' | 'pills' | 'underline';
    className?: string;
}

export function TabNavigation({
    tabs,
    activeTab,
    onTabChange,
    variant = 'default',
    className = ''
}: TabNavigationProps) {
    const getTabClasses = (tab: Tab) => {
        const isActive = activeTab === tab.id;
        const baseClasses = 'inline-flex items-center gap-2 px-4 py-2 font-medium transition-all duration-200';

        if (tab.disabled) {
            return `${baseClasses} opacity-50 cursor-not-allowed text-gray-400`;
        }

        switch (variant) {
            case 'pills':
                return `${baseClasses} rounded-full ${isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`;

            case 'underline':
                return `${baseClasses} border-b-2 ${isActive
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }`;

            default: // 'default'
                return `${baseClasses} rounded-t-lg border border-b-0 ${isActive
                        ? 'bg-white text-blue-600 border-gray-300'
                        : 'bg-gray-50 text-gray-600 border-transparent hover:bg-gray-100'
                    }`;
        }
    };

    const containerClasses = variant === 'underline'
        ? 'flex gap-1 border-b border-gray-200'
        : 'flex gap-1';

    return (
        <div className={`${containerClasses} ${className}`} dir="rtl">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => !tab.disabled && onTabChange(tab.id)}
                    disabled={tab.disabled}
                    className={getTabClasses(tab)}
                >
                    {tab.icon && <span>{tab.icon}</span>}
                    <span>{tab.labelHe || tab.label}</span>
                    {tab.badge !== undefined && tab.badge > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full bg-red-500 text-white">
                            {tab.badge > 99 ? '99+' : tab.badge}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
}
