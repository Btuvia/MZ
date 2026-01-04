"use client";

import { Check, Tag } from 'lucide-react';
import { useState, useEffect } from 'react';
import { type TaskSubject } from '@/types/subject';
import { Card } from './base';

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
            <label className="block text-sm font-bold text-amber-200 mb-2">
                נושא
                {!value && <span className="text-slate-400 font-normal mr-1">(אופציונלי)</span>}
            </label>

            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full px-4 py-3 rounded-xl border-2 text-right flex items-center justify-between transition-all
          ${disabled
                        ? 'glass-card border-slate-700 cursor-not-allowed'
                        : 'glass-card border-amber-500/20 hover:border-amber-500/40 cursor-pointer'
                    }
        `}
            >
                {selectedSubject ? (
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: selectedSubject.color ? `${selectedSubject.color}20` : '#1e293b' }}
                        >
                            <Tag
                                size={20}
                                style={{ color: selectedSubject.color || '#94a3b8' }}
                            />
                        </div>
                        <div className="text-right">
                            <div className="font-bold text-slate-200">{selectedSubject.name}</div>
                            {selectedSubject.description ? <div className="text-xs text-slate-400">{selectedSubject.description}</div> : null}
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

            {isOpen && !disabled ? <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <Card className="absolute z-20 w-full mt-2 max-h-96 overflow-y-auto shadow-2xl border-2 border-amber-500/20">
                        <div className="p-2 space-y-1">
                            {/* Clear option */}
                            {allowClear && value ? <>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onChange('');
                                            setIsOpen(false);
                                        }}
                                        className="w-full px-3 py-2 rounded-lg text-right hover:bg-slate-700/50 border-2 border-transparent transition-all"
                                    >
                                        <span className="text-slate-400 text-sm">ללא נושא</span>
                                    </button>
                                    <div className="border-t border-amber-500/20 my-1" />
                                </> : null}

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
                                                ? 'bg-amber-500/20 border-2 border-amber-500/40'
                                                : 'hover:bg-slate-700/50 border-2 border-transparent'
                                            }
                    `}
                                    >
                                        <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                                            style={{ backgroundColor: subject.color ? `${subject.color}20` : '#1e293b' }}
                                        >
                                            <Tag
                                                size={20}
                                                style={{ color: subject.color || '#94a3b8' }}
                                            />
                                        </div>

                                        <div className="flex-1 text-right">
                                            <div className="font-bold text-slate-200 flex items-center gap-2">
                                                {subject.name}
                                                {subject.relatedToPolicy ? <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                                                        פוליסה
                                                    </span> : null}
                                                {subject.isFutureLead ? <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                                                        ליד
                                                    </span> : null}
                                            </div>
                                            {subject.description ? <div className="text-xs text-slate-400">{subject.description}</div> : null}
                                        </div>

                                        {value === subject.id && (
                                            <Check size={20} className="text-amber-400 shrink-0" />
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    </Card>
                </> : null}
        </div>
    );
}
