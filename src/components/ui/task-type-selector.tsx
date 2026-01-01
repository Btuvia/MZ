"use client";

import { useState } from 'react';
import { TaskType } from '@/types';
import { TASK_TYPES } from '@/lib/task-constants';
import { Card } from './base';
import { Check } from 'lucide-react';

interface TaskTypeSelectorProps {
    value: TaskType;
    onChange: (type: TaskType) => void;
    disabled?: boolean;
}

export function TaskTypeSelector({ value, onChange, disabled }: TaskTypeSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);

    const selectedType = TASK_TYPES.find(t => t.value === value);

    return (
        <div className="relative">
            <label className="block text-sm font-bold text-slate-700 mb-2">
                סוג משימה
            </label>

            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full px-4 py-3 rounded-xl border-2 text-right flex items-center justify-between transition-all
          ${disabled
                        ? 'bg-slate-50 border-slate-200 cursor-not-allowed'
                        : 'bg-white border-slate-200 hover:border-indigo-300 cursor-pointer'
                    }
        `}
            >
                {selectedType ? (
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${selectedType.color}20` }}
                        >
                            <selectedType.icon
                                size={20}
                                style={{ color: selectedType.color }}
                            />
                        </div>
                        <div className="text-right">
                            <div className="font-bold text-slate-800">{selectedType.labelHe}</div>
                            <div className="text-xs text-slate-500">{selectedType.description}</div>
                        </div>
                    </div>
                ) : (
                    <span className="text-slate-400">בחר סוג משימה</span>
                )}

                <svg
                    className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && !disabled && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <Card className="absolute z-20 w-full mt-2 max-h-96 overflow-y-auto shadow-2xl border-2 border-slate-200">
                        <div className="p-2 space-y-1">
                            {TASK_TYPES.map((type) => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(type.value);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full px-3 py-3 rounded-lg text-right flex items-center gap-3 transition-all
                    ${value === type.value
                                            ? 'bg-indigo-50 border-2 border-indigo-300'
                                            : 'hover:bg-slate-50 border-2 border-transparent'
                                        }
                  `}
                                >
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                                        style={{ backgroundColor: `${type.color}20` }}
                                    >
                                        <type.icon
                                            size={20}
                                            style={{ color: type.color }}
                                        />
                                    </div>

                                    <div className="flex-1 text-right">
                                        <div className="font-bold text-slate-800">{type.labelHe}</div>
                                        <div className="text-xs text-slate-500">{type.description}</div>
                                    </div>

                                    {value === type.value && (
                                        <Check size={20} className="text-indigo-600 shrink-0" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </Card>
                </>
            )}
        </div>
    );
}
