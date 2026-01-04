'use client';

import dynamic from 'next/dynamic';
import { ComponentType, ReactNode } from 'react';
import { LogoLoader } from '@/components/LogoLoader';

/**
 * Loading fallback component for lazy-loaded modules
 */
function LoadingFallback() {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto" />
                <p className="mt-4 text-slate-500">טוען...</p>
            </div>
        </div>
    );
}

/**
 * Skeleton loader for cards/items
 */
export function CardSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-4" />
                    <div className="h-3 bg-slate-200 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-slate-200 rounded w-2/3" />
                </div>
            ))}
        </div>
    );
}

/**
 * Skeleton loader for tables
 */
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
    return (
        <div className="bg-white rounded-xl overflow-hidden">
            {/* Header */}
            <div className="border-b border-slate-200 p-4 flex gap-4">
                {Array.from({ length: cols }).map((_, i) => (
                    <div key={i} className="h-4 bg-slate-200 rounded flex-1 animate-pulse" />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIdx) => (
                <div key={rowIdx} className="border-b border-slate-100 p-4 flex gap-4">
                    {Array.from({ length: cols }).map((_, colIdx) => (
                        <div 
                            key={colIdx} 
                            className="h-3 bg-slate-100 rounded flex-1 animate-pulse" 
                            style={{ animationDelay: `${(rowIdx * cols + colIdx) * 50}ms` }}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}

/**
 * Skeleton loader for stats cards
 */
export function StatsSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-10 w-10 bg-slate-200 rounded-lg" />
                        <div className="h-3 w-16 bg-slate-200 rounded" />
                    </div>
                    <div className="h-8 bg-slate-200 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-slate-200 rounded w-3/4" />
                </div>
            ))}
        </div>
    );
}

/**
 * Skeleton for dashboard page
 */
export function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <StatsSkeleton count={4} />
            <div className="grid gap-6 lg:grid-cols-2">
                <TableSkeleton rows={5} cols={3} />
                <CardSkeleton count={3} />
            </div>
        </div>
    );
}

/**
 * Create a lazily loaded component with Next.js dynamic import
 * 
 * @param importFn - Dynamic import function
 * @param options - Configuration options
 */
export function lazyLoad<T extends ComponentType<unknown>>(
    importFn: () => Promise<{ default: T }>,
    options?: {
        loading?: ReactNode;
        ssr?: boolean;
    }
) {
    return dynamic(importFn, {
        loading: () => <>{options?.loading ?? <LoadingFallback />}</>,
        ssr: options?.ssr ?? true,
    });
}

// ============================================
// PRE-CONFIGURED LAZY COMPONENTS
// ============================================

/**
 * Lazy load heavy chart components
 */
export const LazyChart = dynamic(
    () => import('@/components/ui/base').then(mod => mod.Card),
    { loading: () => <CardSkeleton count={1} />, ssr: true }
);

/**
 * Lazy load modal components
 */
export const LazySmartTaskModal = dynamic(
    () => import('@/components/SmartTaskModal').then(mod => mod.SmartTaskModal),
    { ssr: false }
);

/**
 * Lazy load import modal
 */
export const LazyImportLeadsModal = dynamic(
    () => import('@/components/leads/ImportLeadsModal'),
    { ssr: false }
);
