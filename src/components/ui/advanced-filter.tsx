'use client';

import React, { useState } from 'react';

export interface FilterConfig {
    id: string;
    label: string;
    labelHe?: string;
    type: 'text' | 'select' | 'date' | 'daterange' | 'multiselect';
    options?: Array<{ value: string; label: string; labelHe?: string }>;
    placeholder?: string;
    placeholderHe?: string;
}

export interface SavedFilter {
    id: string;
    name: string;
    config: Record<string, any>;
}

export interface AdvancedFilterProps {
    filters: FilterConfig[];
    onFilterChange: (filters: Record<string, any>) => void;
    savedFilters?: SavedFilter[];
    onSaveFilter?: (name: string, config: Record<string, any>) => void;
    onLoadFilter?: (filterId: string) => void;
    className?: string;
}

export function AdvancedFilter({
    filters,
    onFilterChange,
    savedFilters = [],
    onSaveFilter,
    onLoadFilter,
    className = '',
}: AdvancedFilterProps) {
    const [filterValues, setFilterValues] = useState<Record<string, any>>({});
    const [isExpanded, setIsExpanded] = useState(false);
    const [saveFilterName, setSaveFilterName] = useState('');
    const [showSaveDialog, setShowSaveDialog] = useState(false);

    const handleFilterChange = (filterId: string, value: any) => {
        const newFilters = { ...filterValues, [filterId]: value };
        setFilterValues(newFilters);
        onFilterChange(newFilters);
    };

    const handleClearAll = () => {
        setFilterValues({});
        onFilterChange({});
    };

    const handleSaveFilter = () => {
        if (saveFilterName && onSaveFilter) {
            onSaveFilter(saveFilterName, filterValues);
            setSaveFilterName('');
            setShowSaveDialog(false);
        }
    };

    const renderFilter = (filter: FilterConfig) => {
        const displayLabel = filter.labelHe || filter.label;
        const displayPlaceholder = filter.placeholderHe || filter.placeholder || displayLabel;

        switch (filter.type) {
            case 'text':
                return (
                    <input
                        type="text"
                        value={filterValues[filter.id] || ''}
                        onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                        placeholder={displayPlaceholder}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                );

            case 'select':
                return (
                    <select
                        value={filterValues[filter.id] || ''}
                        onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">{displayPlaceholder}</option>
                        {filter.options?.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.labelHe || option.label}
                            </option>
                        ))}
                    </select>
                );

            case 'date':
                return (
                    <input
                        type="date"
                        value={filterValues[filter.id] || ''}
                        onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                );

            case 'daterange':
                return (
                    <div className="flex gap-2">
                        <input
                            type="date"
                            value={filterValues[`${filter.id}_from`] || ''}
                            onChange={(e) => handleFilterChange(`${filter.id}_from`, e.target.value)}
                            placeholder="מתאריך"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <input
                            type="date"
                            value={filterValues[`${filter.id}_to`] || ''}
                            onChange={(e) => handleFilterChange(`${filter.id}_to`, e.target.value)}
                            placeholder="עד תאריך"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                );

            case 'multiselect':
                const selectedValues = filterValues[filter.id] || [];
                return (
                    <div className="space-y-2">
                        {filter.options?.map((option) => (
                            <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedValues.includes(option.value)}
                                    onChange={(e) => {
                                        const newValues = e.target.checked
                                            ? [...selectedValues, option.value]
                                            : selectedValues.filter((v: string) => v !== option.value);
                                        handleFilterChange(filter.id, newValues);
                                    }}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">{option.labelHe || option.label}</span>
                            </label>
                        ))}
                    </div>
                );

            default:
                return null;
        }
    };

    const activeFilterCount = Object.keys(filterValues).filter(key => filterValues[key]).length;

    return (
        <div className={`bg-white rounded-lg border border-gray-200 ${className}`} dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-2 text-lg font-semibold text-gray-900"
                >
                    <span>🔍</span>
                    <span>סינון מתקדם</span>
                    {activeFilterCount > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold rounded-full bg-blue-600 text-white">
                            {activeFilterCount}
                        </span>
                    )}
                    <span className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                </button>

                <div className="flex gap-2">
                    {activeFilterCount > 0 && (
                        <button
                            onClick={handleClearAll}
                            className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            נקה הכל
                        </button>
                    )}
                    {onSaveFilter && activeFilterCount > 0 && (
                        <button
                            onClick={() => setShowSaveDialog(true)}
                            className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                            💾 שמור סינון
                        </button>
                    )}
                </div>
            </div>

            {/* Saved Filters */}
            {savedFilters.length > 0 && (
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="text-sm font-medium text-gray-700 mb-2">סינונים שמורים:</div>
                    <div className="flex flex-wrap gap-2">
                        {savedFilters.map((saved) => (
                            <button
                                key={saved.id}
                                onClick={() => onLoadFilter?.(saved.id)}
                                className="px-3 py-1.5 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                📌 {saved.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Filter Fields */}
            {isExpanded && (
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filters.map((filter) => (
                        <div key={filter.id} className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700">
                                {filter.labelHe || filter.label}
                            </label>
                            {renderFilter(filter)}
                        </div>
                    ))}
                </div>
            )}

            {/* Save Filter Dialog */}
            {showSaveDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">שמור סינון</h3>
                        <input
                            type="text"
                            value={saveFilterName}
                            onChange={(e) => setSaveFilterName(e.target.value)}
                            placeholder="שם הסינון"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
                        />
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setShowSaveDialog(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                ביטול
                            </button>
                            <button
                                onClick={handleSaveFilter}
                                disabled={!saveFilterName}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                שמור
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
