'use client';

import React, { useState, useEffect } from 'react';
import { firestoreService } from '@/lib/firebase/firestore-service';
import { seedLeadSources } from '@/lib/firebase/seed-data';
import type { LeadSource } from '@/types/statuses';

export default function LeadSourcesPage() {
    const [sources, setSources] = useState<LeadSource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingSource, setEditingSource] = useState<Partial<LeadSource> | null>(null);

    useEffect(() => {
        loadSources();
    }, []);

    const loadSources = async () => {
        setIsLoading(true);
        try {
            const data = await firestoreService.getLeadSources();
            setSources(data as LeadSource[]);
        } catch (error) {
            console.error('Error loading sources:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInitializeData = async () => {
        if (confirm('האם אתה בטוח שברצונך לאתחל את מקורות הלידים? פעולה זו תוסיף מקורות ברירת מחדל.')) {
            try {
                await seedLeadSources();
                await loadSources();
                alert('✅ מקורות הלידים אותחלו בהצלחה!');
            } catch (error) {
                console.error('Error seeding sources:', error);
                alert('❌ שגיאה באתחול מקורות הלידים');
            }
        }
    };

    const handleEdit = (source: LeadSource) => {
        setEditingSource(source);
        setIsEditing(true);
    };

    const handleAdd = () => {
        setEditingSource({
            name: '',
            nameHe: '',
            description: '',
            icon: '📌',
            color: '#3B82F6',
            isActive: true,
        });
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!editingSource || !editingSource.name) return;

        try {
            if ('id' in editingSource && editingSource.id) {
                // Update existing
                await firestoreService.updateLeadSource(editingSource.id, editingSource);
            } else {
                // Add new - name is guaranteed to exist from the check above
                const dataWithName = editingSource as (Partial<LeadSource> & { name: string });
                await firestoreService.addLeadSource(dataWithName);
            }
            await loadSources();
            setIsEditing(false);
            setEditingSource(null);
        } catch (error) {
            console.error('Error saving source:', error);
            alert('❌ שגיאה בשמירת מקור הליד');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('האם אתה בטוח שברצונך למחוק מקור ליד זה?')) {
            try {
                await firestoreService.deleteLeadSource(id);
                await loadSources();
            } catch (error) {
                console.error('Error deleting source:', error);
                alert('❌ שגיאה במחיקת מקור הליד');
            }
        }
    };

    const handleToggleActive = async (source: LeadSource) => {
        try {
            await firestoreService.updateLeadSource(source.id, {
                isActive: !source.isActive,
            });
            await loadSources();
        } catch (error) {
            console.error('Error toggling source:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">📊 ניהול מקורות לידים</h1>
                            <p className="text-gray-600 mt-2">נהל את מקורות הלידים במערכת</p>
                        </div>
                        <div className="flex gap-3">
                            {sources.length === 0 && (
                                <button
                                    onClick={handleInitializeData}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    🌱 אתחל נתוני ברירת מחדל
                                </button>
                            )}
                            <button
                                onClick={handleAdd}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                ➕ הוסף מקור חדש
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sources Table */}
                {isLoading ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <div className="text-4xl mb-4">⏳</div>
                        <div className="text-gray-600">טוען מקורות לידים...</div>
                    </div>
                ) : sources.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <div className="text-6xl mb-4">📭</div>
                        <div className="text-xl font-semibold text-gray-900 mb-2">אין מקורות לידים</div>
                        <div className="text-gray-600 mb-6">התחל על ידי אתחול נתוני ברירת מחדל או הוספת מקור חדש</div>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">אייקון</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">שם</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">תיאור</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">קוד מעקב</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">סטטוס</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">פעולות</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {sources.map((source) => (
                                    <tr key={source.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <span className="text-2xl">{source.icon}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: source.color }}
                                                />
                                                <span className="font-medium text-gray-900">{source.nameHe}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{source.description}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 text-xs font-mono bg-gray-100 rounded">
                                                {source.trackingCode}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleToggleActive(source)}
                                                className={`inline-flex items-center whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium ${source.isActive
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                    }`}
                                            >
                                                {source.isActive ? '✅ פעיל' : '⏸️ לא פעיל'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(source)}
                                                    className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                >
                                                    ✏️ ערוך
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(source.id)}
                                                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                                                >
                                                    🗑️ מחק
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Edit Modal */}
                {isEditing && editingSource ? <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-2xl w-full p-6">
                            <h2 className="text-2xl font-bold mb-6">
                                {'id' in editingSource ? 'ערוך מקור ליד' : 'הוסף מקור ליד חדש'}
                            </h2>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            שם באנגלית
                                        </label>
                                        <input
                                            type="text"
                                            value={editingSource.name || ''}
                                            onChange={(e) =>
                                                setEditingSource({ ...editingSource, name: e.target.value })
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
                                            value={editingSource.nameHe || ''}
                                            onChange={(e) =>
                                                setEditingSource({ ...editingSource, nameHe: e.target.value })
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">תיאור</label>
                                    <input
                                        type="text"
                                        value={editingSource.description || ''}
                                        onChange={(e) =>
                                            setEditingSource({ ...editingSource, description: e.target.value })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">אייקון</label>
                                        <input
                                            type="text"
                                            value={editingSource.icon || ''}
                                            onChange={(e) =>
                                                setEditingSource({ ...editingSource, icon: e.target.value })
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-2xl text-center"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">צבע</label>
                                        <input
                                            type="color"
                                            value={editingSource.color || '#3B82F6'}
                                            onChange={(e) =>
                                                setEditingSource({ ...editingSource, color: e.target.value })
                                            }
                                            className="w-full h-10 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            קוד מעקב
                                        </label>
                                        <input
                                            type="text"
                                            value={editingSource.trackingCode || ''}
                                            onChange={(e) =>
                                                setEditingSource({ ...editingSource, trackingCode: e.target.value })
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end mt-6 pt-6 border-t">
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setEditingSource(null);
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
