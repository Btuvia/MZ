"use client";

import { useState } from 'react';
import { Task } from '@/types';
import { Employee } from '@/types';
import { Card, Button } from './base';
import { X, ArrowRight, User, AlertCircle } from 'lucide-react';

interface TransferTaskModalProps {
    task: Task;
    users: Employee[];
    currentUserId: string;
    onTransfer: (toUserId: string, toUserName: string, reason?: string) => void;
    onClose: () => void;
}

export function TransferTaskModal({
    task,
    users,
    currentUserId,
    onTransfer,
    onClose
}: TransferTaskModalProps) {
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter out current user and get available users
    const availableUsers = users.filter(u => u.id !== currentUserId);
    const selectedUser = availableUsers.find(u => u.id === selectedUserId);

    const handleSubmit = async () => {
        if (!selectedUserId || !selectedUser) return;

        setIsSubmitting(true);
        try {
            await onTransfer(selectedUserId, selectedUser.name, reason || undefined);
            onClose();
        } catch (error) {
            console.error('Transfer failed:', error);
            alert('שגיאה בהעברת המשימה');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" dir="rtl">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">העברת משימה</h2>
                        <p className="text-sm text-slate-500 mt-1">העבר משימה למשתמש אחר</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={24} className="text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Task Info */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <div className="text-xs text-slate-500 mb-1">משימה להעברה</div>
                        <div className="font-bold text-slate-900">{task.title}</div>
                        {task.description && (
                            <div className="text-sm text-slate-600 mt-1">{task.description}</div>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                            <span>📅 {task.date}</span>
                            <span>⏰ {task.time}</span>
                            {task.clientName && <span>👤 {task.clientName}</span>}
                        </div>
                    </div>

                    {/* Current Assignment */}
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <div className="text-xs text-blue-600 font-bold">אחראי נוכחי</div>
                            <div className="font-bold text-slate-900">{task.assignedToName || task.assignedTo}</div>
                        </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex justify-center">
                        <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center">
                            <ArrowRight size={24} className="text-indigo-600" />
                        </div>
                    </div>

                    {/* Select User */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-3">
                            העבר למשתמש
                        </label>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {availableUsers.length === 0 ? (
                                <div className="text-center py-8 text-slate-400">
                                    <AlertCircle size={32} className="mx-auto mb-2" />
                                    <p>אין משתמשים זמינים להעברה</p>
                                </div>
                            ) : (
                                availableUsers.map((user) => (
                                    <button
                                        key={user.id}
                                        type="button"
                                        onClick={() => setSelectedUserId(user.id)}
                                        className={`w-full p-4 rounded-xl border-2 text-right flex items-center gap-3 transition-all
                      ${selectedUserId === user.id
                                                ? 'bg-indigo-50 border-indigo-300 shadow-sm'
                                                : 'bg-white border-slate-200 hover:border-indigo-200'
                                            }
                    `}
                                    >
                                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                            {user.name.charAt(0)}
                                        </div>
                                        <div className="flex-1 text-right">
                                            <div className="font-bold text-slate-900">{user.name}</div>
                                            <div className="text-xs text-slate-500">{user.position}</div>
                                            <div className="text-xs text-slate-400 mt-1">
                                                {user.activeClientsCount} לקוחות פעילים
                                            </div>
                                        </div>
                                        {selectedUserId === user.id && (
                                            <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Reason (Optional) */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            סיבת העברה
                            <span className="text-slate-400 font-normal mr-1">(אופציונלי)</span>
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="למה אתה מעביר את המשימה?"
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-300 focus:outline-none resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-slate-200 p-6 flex gap-3">
                    <Button
                        onClick={handleSubmit}
                        disabled={!selectedUserId || isSubmitting}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-slate-300 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'מעביר...' : 'העבר משימה'}
                    </Button>
                    <Button
                        onClick={onClose}
                        variant="outline"
                        disabled={isSubmitting}
                        className="px-8"
                    >
                        ביטול
                    </Button>
                </div>
            </Card>
        </div>
    );
}
