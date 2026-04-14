'use client';

import React, { useState, useEffect } from 'react';
import { StatusBadge } from '@/components/ui/status-badge';
import { TabNavigation } from '@/components/ui/tab-navigation';
import { firestoreService } from '@/lib/firebase/firestore-service';
import { seedLeadStatuses, seedTaskStatuses } from '@/lib/firebase/seed-data';
import type { LeadStatus, TaskStatus } from '@/types/statuses';

export default function StatusesPage() {
    const [activeTab, setActiveTab] = useState<'lead' | 'task'>('lead');
    const [leadStatuses, setLeadStatuses] = useState<LeadStatus[]>([]);
    const [taskStatuses, setTaskStatuses] = useState<TaskStatus[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingStatus, setEditingStatus] = useState<Partial<LeadStatus | TaskStatus> | null>(null);

    useEffect(() => {
        loadStatuses();
    }, []);

    const loadStatuses = async () => {
        setIsLoading(true);
        try {
            const [leads, tasks] = await Promise.all([
                firestoreService.getLeadStatuses(),
                firestoreService.getTaskStatuses(),
            ]);
            setLeadStatuses(leads as LeadStatus[]);
            setTaskStatuses(tasks as TaskStatus[]);
        } catch (error) {
            console.error('Error loading statuses:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInitializeData = async () => {
        if (confirm('האם אתה בטוח שברצונך לאתחל את הסטטוסים? פעולה זו תוסיף סטטוסים ברירת מחדל.')) {
            try {
                await Promise.all([seedLeadStatuses(), seedTaskStatuses()]);
                await loadStatuses();
                alert('✅ הסטטוסים אותחלו בהצלחה!');
            } catch (error) {
                console.error('Error seeding statuses:', error);
                alert('❌ שגיאה באתחול הסטטוסים');
            }
        }
    };

    const handleEdit = (status: LeadStatus | TaskStatus) => {
        setEditingStatus(status);
        setIsEditing(true);
    };

    const handleAdd = () => {
        if (activeTab === 'lead') {
            setEditingStatus({
                name: '',
                nameHe: '',
                color: '#3B82F6',
                icon: '📌',
                orderIndex: leadStatuses.length + 1,
                isActive: true,
                isSystem: false,
            });
        } else {
            setEditingStatus({
                name: '',
                nameHe: '',
                color: '#3B82F6',
                icon: '📌',
                isFinal: false,
            });
        }
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!editingStatus || !editingStatus.name) return;

        try {
            if ('id' in editingStatus && editingStatus.id) {
                // Update existing
                if (activeTab === 'lead') {
                    await firestoreService.updateLeadStatus(editingStatus.id, editingStatus);
                } else {
                    await firestoreService.updateTaskStatus(editingStatus.id, editingStatus);
                }
            } else {
                // Add new - name is guaranteed to exist from the check above
                const dataWithName = editingStatus as (Partial<LeadStatus | TaskStatus> & { name: string });
                if (activeTab === 'lead') {
                    await firestoreService.addLeadStatus(dataWithName);
                } else {
                    await firestoreService.addTaskStatus(dataWithName);
                }
            }
            await loadStatuses();
            setIsEditing(false);
            setEditingStatus(null);
        } catch (error) {
            console.error('Error saving status:', error);
            alert('❌ שגיאה בשמירת הסטטוס');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('האם אתה בטוח שברצונך למחוק סטטוס זה?')) {
            try {
                if (activeTab === 'lead') {
                    await firestoreService.deleteLeadStatus(id);
                } else {
                    await firestoreService.deleteTaskStatus(id);
                }
                await loadStatuses();
            } catch (error) {
                console.error('Error deleting status:', error);
                alert('❌ שגיאה במחיקת הסטטוס');
            }
        }
    };

    const currentStatuses = activeTab === 'lead' ? leadStatuses : taskStatuses;
    const hasNoStatuses = leadStatuses.length === 0 && taskStatuses.length === 0;

    return (
        <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">🏷️ ניהול סטטוסים</h1>
                            <p className="text-gray-600 mt-2">נהל סטטוסים ללידים ומשימות</p>
                        </div>
                        <div className="flex gap-3">
                            {hasNoStatuses ? <button
                                    onClick={handleInitializeData}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    🌱 אתחל נתוני ברירת מחדל
                                </button> : null}
                            <button
                                onClick={handleAdd}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                ➕ הוסף סטטוס חדש
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-6">
                    <TabNavigation
                        tabs={[
                            { id: 'lead', label: 'Lead Statuses', labelHe: 'סטטוסי לידים', icon: '👥', badge: leadStatuses.length },
                            { id: 'task', label: 'Task Statuses', labelHe: 'סטטוסי משימות', icon: '✅', badge: taskStatuses.length },
                        ]}
                        activeTab={activeTab}
                        onTabChange={(tab) => setActiveTab(tab as 'lead' | 'task')}
                        variant="pills"
                    />
                </div>

                {/* Statuses Table */}
                {isLoading ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <div className="text-4xl mb-4">⏳</div>
                        <div className="text-gray-600">טוען סטטוסים...</div>
                    </div>
                ) : currentStatuses.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <div className="text-6xl mb-4">📭</div>
                        <div className="text-xl font-semibold text-gray-900 mb-2">אין סטטוסים</div>
                        <div className="text-gray-600 mb-6">התחל על ידי אתחול נתוני ברירת מחדל או הוספת סטטוס חדש</div>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">תצוגה</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">שם</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">אייקון</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">צבע</th>
                                    {activeTab === 'task' && (
                                        <>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">SLA (שעות)</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">סופי</th>
                                        </>
                                    )}
                                    {activeTab === 'lead' && (
                                        <>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">סדר</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">מערכת</th>
                                        </>
                                    )}
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">פעולות</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {currentStatuses.map((status) => (
                                    <tr key={status.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <StatusBadge status={status} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-medium text-gray-900">{status.nameHe}</div>
                                                <div className="text-sm text-gray-500">{status.name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-2xl">{status.icon}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-6 h-6 rounded border border-gray-300"
                                                    style={{ backgroundColor: status.color }}
                                                />
                                                <span className="text-sm font-mono text-gray-600">{status.color}</span>
                                            </div>
                                        </td>
                                        {activeTab === 'task' && (
                                            <>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-900">
                                                        {(status as TaskStatus).slaHours || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {(status as TaskStatus).isFinal ? (
                                                        <span className="text-green-600">✅</span>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                            </>
                                        )}
                                        {activeTab === 'lead' && (
                                            <>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-900">
                                                        {(status as LeadStatus).orderIndex}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {(status as LeadStatus).isSystem ? (
                                                        <span className="text-blue-600">🔒</span>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                            </>
                                        )}
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(status)}
                                                    className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                >
                                                    ✏️ ערוך
                                                </button>
                                                {activeTab === 'lead' && !(status as LeadStatus).isSystem && (
                                                    <button
                                                        onClick={() => handleDelete(status.id)}
                                                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    >
                                                        🗑️ מחק
                                                    </button>
                                                )}
                                                {activeTab === 'task' && (
                                                    <button
                                                        onClick={() => handleDelete(status.id)}
                                                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    >
                                                        🗑️ מחק
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Edit Modal */}
                {isEditing && editingStatus ? <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-2xl w-full p-6">
                            <h2 className="text-2xl font-bold mb-6">
                                {'id' in editingStatus ? 'ערוך סטטוס' : 'הוסף סטטוס חדש'}
                            </h2>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            שם באנגלית
                                        </label>
                                        <input
                                            type="text"
                                            value={editingStatus.name || ''}
                                            onChange={(e) =>
                                                setEditingStatus({ ...editingStatus, name: e.target.value })
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            שם בעברית
                                        </label>
                                        <input
                                            type="text"
                                            value={editingStatus.nameHe || ''}
                                            onChange={(e) =>
                                                setEditingStatus({ ...editingStatus, nameHe: e.target.value })
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">אייקון</label>
                                        <input
                                            type="text"
                                            value={editingStatus.icon || ''}
                                            onChange={(e) =>
                                                setEditingStatus({ ...editingStatus, icon: e.target.value })
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-2xl text-center"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">צבע</label>
                                        <input
                                            type="color"
                                            value={editingStatus.color || '#3B82F6'}
                                            onChange={(e) =>
                                                setEditingStatus({ ...editingStatus, color: e.target.value })
                                            }
                                            className="w-full h-10 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                </div>

                                {activeTab === 'task' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                SLA (שעות)
                                            </label>
                                            <input
                                                type="number"
                                                value={(editingStatus as Partial<TaskStatus>).slaHours || ''}
                                                onChange={(e) =>
                                                    setEditingStatus({
                                                        ...editingStatus,
                                                        slaHours: parseInt(e.target.value) || undefined,
                                                    })
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                סטטוס סופי
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={(editingStatus as Partial<TaskStatus>).isFinal || false}
                                                    onChange={(e) =>
                                                        setEditingStatus({
                                                            ...editingStatus,
                                                            isFinal: e.target.checked,
                                                        })
                                                    }
                                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded"
                                                />
                                                <span className="text-sm text-gray-700">משימה הושלמה</span>
                                            </label>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'lead' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            מיקום בסדר
                                        </label>
                                        <input
                                            type="number"
                                            value={(editingStatus as Partial<LeadStatus>).orderIndex || ''}
                                            onChange={(e) =>
                                                setEditingStatus({
                                                    ...editingStatus,
                                                    orderIndex: parseInt(e.target.value) || 1,
                                                })
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 justify-end mt-6 pt-6 border-t">
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setEditingStatus(null);
                                    }}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                >
                                    ביטול
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                                >
                                    💾 שמור
                                </button>
                            </div>
                        </div>
                    </div> : null}
            </div>
        </div>
    );
}
