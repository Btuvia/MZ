'use client';

import React, { useState } from 'react';

export interface TransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    entityType: 'lead' | 'task';
    entityId: string;
    entityName: string;
    currentOwnerId: string;
    currentOwnerName: string;
    availableUsers: Array<{ id: string; name: string; role: string }>;
    onTransfer: (toUserId: string, reason: string, notes: string) => Promise<void>;
}

export function TransferModal({
    isOpen,
    onClose,
    entityType,
    entityName,
    currentOwnerName,
    availableUsers,
    onTransfer,
}: TransferModalProps) {
    const [selectedUserId, setSelectedUserId] = useState('');
    const [transferReason, setTransferReason] = useState('');
    const [transferNotes, setTransferNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const entityTypeHe = entityType === 'lead' ? 'ליד' : 'משימה';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserId || !transferReason) return;

        setIsSubmitting(true);
        try {
            await onTransfer(selectedUserId, transferReason, transferNotes);
            // Reset form
            setSelectedUserId('');
            setTransferReason('');
            setTransferNotes('');
            onClose();
        } catch (error) {
            console.error('Transfer failed:', error);
            alert('העברה נכשלה. אנא נסה שוב.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" dir="rtl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">
                        🔀 העבר {entityTypeHe}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Entity Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="text-sm text-blue-800">
                            <strong>{entityTypeHe}:</strong> {entityName}
                        </div>
                        <div className="text-sm text-blue-600 mt-1">
                            <strong>בעלים נוכחי:</strong> {currentOwnerName}
                        </div>
                    </div>

                    {/* Select User */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            העבר אל משתמש <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">בחר משתמש...</option>
                            {availableUsers.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.name} ({user.role})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Transfer Reason */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            סיבת ההעברה <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={transferReason}
                            onChange={(e) => setTransferReason(e.target.value)}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">בחר סיבה...</option>
                            <option value="workload">חלוקת עומס</option>
                            <option value="expertise">התמחות</option>
                            <option value="availability">זמינות</option>
                            <option value="client_request">בקשת לקוח</option>
                            <option value="territory">אזור גיאוגרפי</option>
                            <option value="other">אחר</option>
                        </select>
                    </div>

                    {/* Transfer Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            הערות נוספות
                        </label>
                        <textarea
                            value={transferNotes}
                            onChange={(e) => setTransferNotes(e.target.value)}
                            rows={4}
                            placeholder="הוסף הערות או הסבר נוסף..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        />
                    </div>

                    {/* Warning */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex gap-3">
                            <span className="text-yellow-600 text-xl">⚠️</span>
                            <div className="text-sm text-yellow-800">
                                <strong>שים לב:</strong> לאחר ההעברה, המשתמש החדש יהיה אחראי על {entityTypeHe} זה.
                                המשתמש החדש יקבל התראה על ההעברה.
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            ביטול
                        </button>
                        <button
                            type="submit"
                            disabled={!selectedUserId || !transferReason || isSubmitting}
                            className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="animate-spin">⏳</span>
                                    <span>מעביר...</span>
                                </>
                            ) : (
                                <>
                                    <span>🔀</span>
                                    <span>העבר {entityTypeHe}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
