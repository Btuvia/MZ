'use client';

import React, { useState } from 'react';

export interface ActionButton {
    label: string;
    labelHe?: string;
    icon: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger' | 'success';
    disabled?: boolean;
}

export interface ActionButtonGroupProps {
    actions: ActionButton[];
    layout?: 'horizontal' | 'vertical' | 'dropdown';
    className?: string;
}

const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300',
    danger: 'bg-red-600 hover:bg-red-700 text-white border-red-600',
    success: 'bg-green-600 hover:bg-green-700 text-white border-green-600',
};

function ActionButtonItem({ action }: { action: ActionButton }) {
    const displayLabel = action.labelHe || action.label;
    const variant = action.variant || 'secondary';

    return (
        <button
            onClick={action.onClick}
            disabled={action.disabled}
            className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium
        border transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
      `}
        >
            <span>{action.icon}</span>
            <span>{displayLabel}</span>
        </button>
    );
}

export function ActionButtonGroup({
    actions,
    layout = 'horizontal',
    className = ''
}: ActionButtonGroupProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    if (layout === 'dropdown') {
        return (
            <div className={`relative ${className}`}>
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300"
                >
                    <span>⚡</span>
                    <span>פעולות</span>
                    <span className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
                </button>

                {isDropdownOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setIsDropdownOpen(false)}
                        />
                        <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                            <div className="py-1">
                                {actions.map((action, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            action.onClick();
                                            setIsDropdownOpen(false);
                                        }}
                                        disabled={action.disabled}
                                        className="w-full text-right px-4 py-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                                    >
                                        <span>{action.icon}</span>
                                        <span>{action.labelHe || action.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    }

    const layoutClasses = layout === 'horizontal'
        ? 'flex flex-wrap gap-2'
        : 'flex flex-col gap-2';

    return (
        <div className={`${layoutClasses} ${className}`}>
            {actions.map((action, index) => (
                <ActionButtonItem key={index} action={action} />
            ))}
        </div>
    );
}
