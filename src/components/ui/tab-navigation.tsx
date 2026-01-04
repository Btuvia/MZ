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
            return `${baseClasses} opacity-50 cursor-not-allowed text-slate-500`;
        }

        switch (variant) {
            case 'pills':
                return `${baseClasses} rounded-full ${isActive
                        ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-900'
                        : 'glass-card text-slate-300 hover:text-amber-200 hover:border-amber-500/30'
                    }`;

            case 'underline':
                return `${baseClasses} border-b-2 ${isActive
                        ? 'border-amber-500 text-amber-400'
                        : 'border-transparent text-slate-400 hover:text-amber-200 hover:border-amber-500/30'
                    }`;

            default: // 'default'
                return `${baseClasses} rounded-t-lg border border-b-0 ${isActive
                        ? 'glass-card text-amber-400 border-amber-500/30'
                        : 'bg-slate-800/50 text-slate-400 border-transparent hover:text-amber-200 hover:bg-slate-700/50'
                    }`;
        }
    };

    const containerClasses = variant === 'underline'
        ? 'flex gap-1 border-b border-slate-700'
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
                    {tab.icon ? <span>{tab.icon}</span> : null}
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
