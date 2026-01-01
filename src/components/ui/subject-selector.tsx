"use client";

import { useState, useEffect } from 'react';
import { TaskSubject } from '@/types/subject';
import { Card } from './base';
import { Check, Tag } from 'lucide-react';

interface SubjectSelectorProps {
    value?: string;
    onChange: (subjectId: string) => void;
    subjects: TaskSubject[];
    disabled?: boolean;
    allowClear?: boolean;
}

export function SubjectSelector({
    value,
    onChange,
    subjects,
    disabled,
    allowClear = true
}: SubjectSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);

    const selectedSubject = subjects.find(s => s.id === value);
    const activeSubjects = subjects.filter(s => s.isActive);

    return (
        <div className="relative">
            <label className="block text-sm font-bold text-slate-700 mb-2">
                נושא
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
                {selectedSubject ? (
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: selectedSubject.color ? `${selectedSubject.color}20` : '#f1f5f9' }}
                        >
                            <Tag
                                size={20}
                                style={{ color: selectedSubject.color || '#64748b' }}
                            />
                        </div>
                        <div className="text-right">
                            <div className="font-bold text-slate-800">{selectedSubject.name}</div>
                            {selectedSubject.description && (
                                <div className="text-xs text-slate-500">{selectedSubject.description}</div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-slate-400">
                        <Tag size={18} />
                        <span>בחר נושא</span>
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
                                        <span className="text-slate-400 text-sm">ללא נושא</span>
                                    </button>
                                    <div className="border-t border-slate-100 my-1" />
                                </>
                            )}

                            {activeSubjects.length === 0 ? (
                                <div className="px-3 py-4 text-center text-slate-400 text-sm">
                                    אין נושאים זמינים
                                </div>
                            ) : (
                                activeSubjects.map((subject) => (
                                    <button
                                        key={subject.id}
                                        type="button"
                                        onClick={() => {
                                            onChange(subject.id);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full px-3 py-3 rounded-lg text-right flex items-center gap-3 transition-all
                      ${value === subject.id
                                                ? 'bg-indigo-50 border-2 border-indigo-300'
                                                : 'hover:bg-slate-50 border-2 border-transparent'
                                            }
                    `}
                                    >
                                        <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                                            style={{ backgroundColor: subject.color ? `${subject.color}20` : '#f1f5f9' }}
                                        >
                                            <Tag
                                                size={20}
                                                style={{ color: subject.color || '#64748b' }}
                                            />
                                        </div>

                                        <div className="flex-1 text-right">
                                            <div className="font-bold text-slate-800 flex items-center gap-2">
                                                {subject.name}
                                                {subject.relatedToPolicy && (
                                                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                                        פוליסה
                                                    </span>
                                                )}
                                                {subject.isFutureLead && (
                                                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                                        ליד
                                                    </span>
                                                )}
                                            </div>
                                            {subject.description && (
                                                <div className="text-xs text-slate-500">{subject.description}</div>
                                            )}
                                        </div>

                                        {value === subject.id && (
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
