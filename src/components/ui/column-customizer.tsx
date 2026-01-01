"use client";

import { useState } from 'react';
import { ColumnDefinition } from '@/lib/task-constants';
import { Card, Button } from './base';
import { X, Check, Columns, GripVertical } from 'lucide-react';

interface ColumnCustomizerProps {
    availableColumns: ColumnDefinition[];
    selectedColumns: string[];
    onChange: (columns: string[]) => void;
    onClose: () => void;
}

export function ColumnCustomizer({
    availableColumns,
    selectedColumns,
    onChange,
    onClose
}: ColumnCustomizerProps) {
    const [localSelected, setLocalSelected] = useState<string[]>(selectedColumns);

    const toggleColumn = (columnId: string) => {
        if (localSelected.includes(columnId)) {
            setLocalSelected(localSelected.filter(id => id !== columnId));
        } else {
            setLocalSelected([...localSelected, columnId]);
        }
    };

    const handleSave = () => {
        onChange(localSelected);
        onClose();
    };

    const handleReset = () => {
        const defaultColumns = availableColumns
            .filter(col => col.defaultVisible)
            .map(col => col.id);
        setLocalSelected(defaultColumns);
    };

    const selectedCount = localSelected.length;
    const totalCount = availableColumns.length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" dir="rtl">
            <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                {/* Header */}
                <div className="bg-white border-b border-slate-200 p-6 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                            <Columns size={28} className="text-indigo-600" />
                            התאמת עמודות
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            בחר אילו עמודות להציג בתצוגת הטבלה
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={24} className="text-slate-400" />
                    </button>
                </div>

                {/* Stats */}
                <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-3 shrink-0">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-indigo-900 font-bold">
                            {selectedCount} מתוך {totalCount} עמודות נבחרו
                        </span>
                        <button
                            onClick={handleReset}
                            className="text-indigo-600 hover:text-indigo-700 font-bold transition-colors"
                        >
                            איפוס לברירת מחדל
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {availableColumns.map((column) => {
                            const isSelected = localSelected.includes(column.id);
                            const isDefault = column.defaultVisible;

                            return (
                                <button
                                    key={column.id}
                                    onClick={() => toggleColumn(column.id)}
                                    className={`p-4 rounded-xl border-2 text-right flex items-center gap-3 transition-all
                    ${isSelected
                                            ? 'bg-indigo-50 border-indigo-300 shadow-sm'
                                            : 'bg-white border-slate-200 hover:border-slate-300'
                                        }
                  `}
                                >
                                    {/* Drag Handle (visual only for now) */}
                                    <div className="text-slate-300">
                                        <GripVertical size={20} />
                                    </div>

                                    {/* Checkbox */}
                                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all
                    ${isSelected
                                            ? 'bg-indigo-600 border-indigo-600'
                                            : 'bg-white border-slate-300'
                                        }
                  `}>
                                        {isSelected && <Check size={16} className="text-white" strokeWidth={3} />}
                                    </div>

                                    {/* Column Info */}
                                    <div className="flex-1 text-right">
                                        <div className="font-bold text-slate-900 flex items-center gap-2">
                                            {column.labelHe}
                                            {isDefault && (
                                                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                                    ברירת מחדל
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5">
                                            {column.label}
                                            {column.sortable && ' • ניתן למיון'}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Info Box */}
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <div className="flex gap-3">
                            <div className="text-blue-600 shrink-0">ℹ️</div>
                            <div className="text-sm text-blue-900">
                                <p className="font-bold mb-1">טיפ:</p>
                                <p>
                                    בחר רק את העמודות החשובות לך כדי לשפר את קריאות הטבלה.
                                    תמיד ניתן לשנות את הבחירה מאוחר יותר.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-white border-t border-slate-200 p-6 flex gap-3 shrink-0">
                    <Button
                        onClick={handleSave}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        שמור שינויים
                    </Button>
                    <Button
                        onClick={onClose}
                        variant="outline"
                        className="px-8"
                    >
                        ביטול
                    </Button>
                </div>
            </Card>
        </div>
    );
}
