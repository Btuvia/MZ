"use client";

import { useState } from "react";
import { TaskType, TaskStatus, TaskPriority } from "@/types";
import { TaskSubject } from "@/types/subject";
import { Workflow } from "@/types/workflow";
import { Employee } from "@/types";
import { Card, Button } from "./base";
import { Filter, X, ChevronDown } from "lucide-react";
import { TASK_TYPES, TASK_STATUSES, TASK_PRIORITIES } from "@/lib/task-constants";

export interface TaskFilters {
    status: TaskStatus | 'all';
    type: TaskType | 'all';
    priority: TaskPriority | 'all';
    subjectId: string | 'all';
    workflowId: string | 'all';
    assignedTo: string | 'all';
    searchTerm: string;
}

interface AdvancedFiltersProps {
    filters: TaskFilters;
    subjects: TaskSubject[];
    workflows: Workflow[];
    users: Employee[];
    onChange: (filters: TaskFilters) => void;
    onClear: () => void;
}

export function AdvancedFilters({
    filters,
    subjects,
    workflows,
    users,
    onChange,
    onClear,
}: AdvancedFiltersProps) {
    const [isOpen, setIsOpen] = useState(false);

    const updateFilter = (key: keyof TaskFilters, value: any) => {
        onChange({ ...filters, [key]: value });
    };

    const activeFiltersCount = Object.entries(filters).filter(
        ([key, value]) => key !== 'searchTerm' && value !== 'all' && value !== ''
    ).length;

    const hasActiveFilters = activeFiltersCount > 0 || filters.searchTerm !== '';

    return (
        <div className="relative" dir="rtl">
            {/* Filter Button */}
            <div className="flex gap-3">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`px-4 py-2 rounded-xl border-2 font-bold text-sm flex items-center gap-2 transition-all ${hasActiveFilters
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                >
                    <Filter size={18} />
                    סינון מתקדם
                    {activeFiltersCount > 0 && (
                        <span className="bg-indigo-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                            {activeFiltersCount}
                        </span>
                    )}
                    <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Search */}
                <input
                    type="text"
                    value={filters.searchTerm}
                    onChange={(e) => updateFilter('searchTerm', e.target.value)}
                    placeholder="חיפוש משימות..."
                    className="flex-1 px-4 py-2 rounded-xl border-2 border-slate-200 focus:border-indigo-300 focus:outline-none"
                />

                {hasActiveFilters && (
                    <Button
                        onClick={onClear}
                        variant="outline"
                        size="sm"
                        className="text-slate-600"
                    >
                        נקה הכל
                    </Button>
                )}
            </div>

            {/* Active Filters Badges */}
            {hasActiveFilters && (
                <div className="flex gap-2 flex-wrap mt-3">
                    {filters.type !== 'all' && (
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            סוג: {TASK_TYPES.find(t => t.value === filters.type)?.labelHe}
                            <button onClick={() => updateFilter('type', 'all')} className="hover:bg-blue-200 rounded-full p-0.5">
                                <X size={12} />
                            </button>
                        </span>
                    )}
                    {filters.status !== 'all' && (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            סטטוס: {TASK_STATUSES.find(s => s.value === filters.status)?.labelHe}
                            <button onClick={() => updateFilter('status', 'all')} className="hover:bg-green-200 rounded-full p-0.5">
                                <X size={12} />
                            </button>
                        </span>
                    )}
                    {filters.priority !== 'all' && (
                        <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            עדיפות: {TASK_PRIORITIES.find(p => p.value === filters.priority)?.labelHe}
                            <button onClick={() => updateFilter('priority', 'all')} className="hover:bg-amber-200 rounded-full p-0.5">
                                <X size={12} />
                            </button>
                        </span>
                    )}
                    {filters.subjectId !== 'all' && (
                        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            נושא: {subjects.find(s => s.id === filters.subjectId)?.name}
                            <button onClick={() => updateFilter('subjectId', 'all')} className="hover:bg-purple-200 rounded-full p-0.5">
                                <X size={12} />
                            </button>
                        </span>
                    )}
                    {filters.workflowId !== 'all' && (
                        <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            תהליך: {workflows.find(w => w.id === filters.workflowId)?.name}
                            <button onClick={() => updateFilter('workflowId', 'all')} className="hover:bg-indigo-200 rounded-full p-0.5">
                                <X size={12} />
                            </button>
                        </span>
                    )}
                    {filters.assignedTo !== 'all' && (
                        <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            אחראי: {users.find(u => u.id === filters.assignedTo)?.name || filters.assignedTo}
                            <button onClick={() => updateFilter('assignedTo', 'all')} className="hover:bg-slate-200 rounded-full p-0.5">
                                <X size={12} />
                            </button>
                        </span>
                    )}
                    {filters.searchTerm && (
                        <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            חיפוש: "{filters.searchTerm}"
                            <button onClick={() => updateFilter('searchTerm', '')} className="hover:bg-slate-200 rounded-full p-0.5">
                                <X size={12} />
                            </button>
                        </span>
                    )}
                </div>
            )}

            {/* Dropdown Panel */}
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <Card className="absolute z-20 top-full mt-2 w-full md:w-auto md:min-w-[600px] shadow-2xl border-2 border-slate-200">
                        <div className="p-6 grid grid-cols-2 gap-4">
                            {/* Type */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">סוג משימה</label>
                                <select
                                    value={filters.type}
                                    onChange={(e) => updateFilter('type', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                                >
                                    <option value="all">הכל</option>
                                    {TASK_TYPES.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.labelHe}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">סטטוס</label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => updateFilter('status', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                                >
                                    <option value="all">הכל</option>
                                    {TASK_STATUSES.map(status => (
                                        <option key={status.value} value={status.value}>
                                            {status.labelHe}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Priority */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">עדיפות</label>
                                <select
                                    value={filters.priority}
                                    onChange={(e) => updateFilter('priority', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                                >
                                    <option value="all">הכל</option>
                                    {TASK_PRIORITIES.map(priority => (
                                        <option key={priority.value} value={priority.value}>
                                            {priority.labelHe}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Subject */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">נושא</label>
                                <select
                                    value={filters.subjectId}
                                    onChange={(e) => updateFilter('subjectId', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                                >
                                    <option value="all">הכל</option>
                                    {subjects.filter(s => s.isActive).map(subject => (
                                        <option key={subject.id} value={subject.id}>
                                            {subject.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Workflow */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">תהליך</label>
                                <select
                                    value={filters.workflowId}
                                    onChange={(e) => updateFilter('workflowId', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                                >
                                    <option value="all">הכל</option>
                                    {workflows.filter(w => w.isActive).map(workflow => (
                                        <option key={workflow.id} value={workflow.id}>
                                            {workflow.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Assigned To */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">אחראי</label>
                                <select
                                    value={filters.assignedTo}
                                    onChange={(e) => updateFilter('assignedTo', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                                >
                                    <option value="all">הכל</option>
                                    <option value="admin">מנהל ראשי</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>
                                            {user.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </Card>
                </>
            )}
        </div>
    );
}
