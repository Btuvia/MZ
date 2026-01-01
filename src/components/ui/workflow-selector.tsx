"use client";

import { useState } from 'react';
import { Workflow } from '@/types/workflow';
import { Card } from './base';
import { Check, GitBranch, Layers } from 'lucide-react';

interface WorkflowSelectorProps {
    value?: string;
    onChange: (workflowId: string) => void;
    workflows: Workflow[];
    disabled?: boolean;
    allowClear?: boolean;
    clientId?: string;
}

export function WorkflowSelector({
    value,
    onChange,
    workflows,
    disabled,
    allowClear = true,
    clientId
}: WorkflowSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);

    const selectedWorkflow = workflows.find(w => w.id === value);
    const activeWorkflows = workflows.filter(w => w.isActive);

    return (
        <div className="relative">
            <label className="block text-sm font-bold text-slate-700 mb-2">
                תהליך
                {!value && <span className="text-slate-400 font-normal mr-1">(אופציונלי)</span>}
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
                {selectedWorkflow ? (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                            <GitBranch size={20} className="text-purple-600" />
                        </div>
                        <div className="text-right">
                            <div className="font-bold text-slate-800">{selectedWorkflow.name}</div>
                            <div className="text-xs text-slate-500">
                                {selectedWorkflow.steps.length} שלבים
                                {selectedWorkflow.estimatedDuration && ` • ${selectedWorkflow.estimatedDuration} ימים`}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-slate-400">
                        <GitBranch size={18} />
                        <span>בחר תהליך</span>
                    </div>
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
                            {/* Clear option */}
                            {allowClear && value && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onChange('');
                                            setIsOpen(false);
                                        }}
                                        className="w-full px-3 py-2 rounded-lg text-right hover:bg-slate-50 border-2 border-transparent transition-all"
                                    >
                                        <span className="text-slate-400 text-sm">ללא תהליך</span>
                                    </button>
                                    <div className="border-t border-slate-100 my-1" />
                                </>
                            )}

                            {activeWorkflows.length === 0 ? (
                                <div className="px-3 py-4 text-center text-slate-400 text-sm">
                                    אין תהליכים זמינים
                                </div>
                            ) : (
                                activeWorkflows.map((workflow) => (
                                    <button
                                        key={workflow.id}
                                        type="button"
                                        onClick={() => {
                                            onChange(workflow.id);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full px-3 py-3 rounded-lg text-right flex items-center gap-3 transition-all
                      ${value === workflow.id
                                                ? 'bg-indigo-50 border-2 border-indigo-300'
                                                : 'hover:bg-slate-50 border-2 border-transparent'
                                            }
                    `}
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                                            <GitBranch size={20} className="text-purple-600" />
                                        </div>

                                        <div className="flex-1 text-right">
                                            <div className="font-bold text-slate-800 flex items-center gap-2">
                                                {workflow.name}
                                                {workflow.category && (
                                                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                                        {workflow.category}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-500 flex items-center gap-3 mt-1">
                                                <span className="flex items-center gap-1">
                                                    <Layers size={12} />
                                                    {workflow.steps.length} שלבים
                                                </span>
                                                {workflow.estimatedDuration && (
                                                    <span>⏱ {workflow.estimatedDuration} ימים</span>
                                                )}
                                                {workflow.successRate && (
                                                    <span>✓ {workflow.successRate}%</span>
                                                )}
                                            </div>
                                            {workflow.description && (
                                                <div className="text-xs text-slate-400 mt-1 line-clamp-1">
                                                    {workflow.description}
                                                </div>
                                            )}
                                        </div>

                                        {value === workflow.id && (
                                            <Check size={20} className="text-indigo-600 shrink-0" />
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    </Card>
                </>
            )}
        </div>
    );
}
