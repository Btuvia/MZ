"use client";

import { ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft } from "lucide-react";
import { Button } from "@/components/ui/base";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems?: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    hasMore?: boolean;
    loading?: boolean;
    showPageSizeSelector?: boolean;
    pageSizeOptions?: number[];
}

export function Pagination({
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    onPageChange,
    onPageSizeChange,
    hasMore = false,
    loading = false,
    showPageSizeSelector = true,
    pageSizeOptions = [10, 25, 50, 100]
}: PaginationProps) {
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems || currentPage * pageSize);

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisiblePages = 5;
        
        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            }
        }
        
        return pages;
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4" dir="rtl">
            {/* Items info */}
            <div className="text-sm text-slate-500">
                {totalItems !== undefined ? (
                    <span>
                        מציג <span className="font-bold text-slate-700">{startItem}</span>-
                        <span className="font-bold text-slate-700">{endItem}</span> מתוך{" "}
                        <span className="font-bold text-slate-700">{totalItems.toLocaleString('he-IL')}</span>
                    </span>
                ) : (
                    <span>עמוד {currentPage}</span>
                )}
            </div>

            {/* Page controls */}
            <div className="flex items-center gap-2">
                {/* First page */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1 || loading}
                    className="p-2"
                    title="לעמוד הראשון"
                >
                    <ChevronsRight size={16} />
                </Button>

                {/* Previous page */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="p-2"
                    title="הקודם"
                >
                    <ChevronRight size={16} />
                </Button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                    {getPageNumbers().map((page, index) => (
                        page === '...' ? (
                            <span key={`ellipsis-${index}`} className="px-2 text-slate-400">...</span>
                        ) : (
                            <Button
                                key={page}
                                variant={currentPage === page ? "primary" : "outline"}
                                size="sm"
                                onClick={() => onPageChange(page as number)}
                                disabled={loading}
                                className={`min-w-[36px] ${
                                    currentPage === page
                                        ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                        : ""
                                }`}
                            >
                                {page}
                            </Button>
                        )
                    ))}
                </div>

                {/* Next page */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={(!hasMore && currentPage >= totalPages) || loading}
                    className="p-2"
                    title="הבא"
                >
                    <ChevronLeft size={16} />
                </Button>

                {/* Last page */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage >= totalPages || loading}
                    className="p-2"
                    title="לעמוד האחרון"
                >
                    <ChevronsLeft size={16} />
                </Button>
            </div>

            {/* Page size selector */}
            {showPageSizeSelector && onPageSizeChange && (
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">פריטים בעמוד:</span>
                    <select
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(Number(e.target.value))}
                        disabled={loading}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    >
                        {pageSizeOptions.map((size) => (
                            <option key={size} value={size}>
                                {size}
                            </option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
}

// Hook for easy pagination state management
import { useState, useCallback } from "react";
import { DocumentSnapshot, QueryDocumentSnapshot } from "firebase/firestore";

interface UsePaginationOptions {
    initialPageSize?: number;
}

interface UsePaginationReturn {
    currentPage: number;
    pageSize: number;
    lastDoc: DocumentSnapshot | null;
    docHistory: (QueryDocumentSnapshot | null)[];
    setPage: (page: number) => void;
    setPageSize: (size: number) => void;
    setLastDoc: (doc: QueryDocumentSnapshot | null) => void;
    reset: () => void;
    goToNextPage: (lastDoc: QueryDocumentSnapshot | null) => void;
    goToPrevPage: () => void;
}

export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
    const { initialPageSize = 25 } = options;
    
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSizeState] = useState(initialPageSize);
    const [lastDoc, setLastDocState] = useState<DocumentSnapshot | null>(null);
    const [docHistory, setDocHistory] = useState<(QueryDocumentSnapshot | null)[]>([null]);

    const setPage = useCallback((page: number) => {
        setCurrentPage(page);
    }, []);

    const setPageSize = useCallback((size: number) => {
        setPageSizeState(size);
        setCurrentPage(1);
        setLastDocState(null);
        setDocHistory([null]);
    }, []);

    const setLastDoc = useCallback((doc: QueryDocumentSnapshot | null) => {
        setLastDocState(doc);
    }, []);

    const goToNextPage = useCallback((newLastDoc: QueryDocumentSnapshot | null) => {
        setDocHistory(prev => [...prev, newLastDoc]);
        setLastDocState(newLastDoc);
        setCurrentPage(prev => prev + 1);
    }, []);

    const goToPrevPage = useCallback(() => {
        if (currentPage > 1) {
            setDocHistory(prev => prev.slice(0, -1));
            const prevDoc = docHistory[docHistory.length - 2] || null;
            setLastDocState(prevDoc);
            setCurrentPage(prev => prev - 1);
        }
    }, [currentPage, docHistory]);

    const reset = useCallback(() => {
        setCurrentPage(1);
        setLastDocState(null);
        setDocHistory([null]);
    }, []);

    return {
        currentPage,
        pageSize,
        lastDoc,
        docHistory,
        setPage,
        setPageSize,
        setLastDoc,
        reset,
        goToNextPage,
        goToPrevPage
    };
}

export default Pagination;
