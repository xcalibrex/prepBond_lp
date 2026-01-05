import React from 'react';
import { DS } from '../design-system';

/**
 * Skeleton Loader Component Library
 * A scalable collection of skeleton components for consistent loading states
 */

// ==================== BASE BUILDING BLOCKS ====================

interface SkeletonProps {
    className?: string;
    children?: React.ReactNode;
    style?: React.CSSProperties;
}

/**
 * Base Skeleton - Animated shimmer element
 */
export const Skeleton: React.FC<SkeletonProps> = ({ className = '', children, style }) => (
    <div
        className={`bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-white/5 dark:via-white/10 dark:to-white/5 bg-[length:200%_100%] animate-shimmer rounded-lg ${className}`}
        style={style}
    >
        {children}
    </div>
);

/**
 * Circle Skeleton - For avatars and icons
 */
export const SkeletonCircle: React.FC<{ size?: string; className?: string }> = ({
    size = 'w-10 h-10',
    className = ''
}) => (
    <Skeleton className={`${size} rounded-full shrink-0 ${className}`} />
);

/**
 * Rectangle Skeleton - For generic rectangular areas
 */
export const SkeletonRectangle: React.FC<{
    width?: string;
    height?: string;
    className?: string;
    rounded?: string;
}> = ({
    width = 'w-full',
    height = 'h-4',
    className = '',
    rounded = 'rounded-lg'
}) => (
        <Skeleton className={`${width} ${height} ${rounded} ${className}`} />
    );

/**
 * Text Skeleton - For text placeholders with multiple lines
 */
export const SkeletonText: React.FC<{
    lines?: number;
    className?: string;
    lastLineWidth?: string;
}> = ({
    lines = 3,
    className = '',
    lastLineWidth = 'w-3/4'
}) => (
        <div className={`space-y-2 ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={`h-3 ${i === lines - 1 ? lastLineWidth : 'w-full'}`}
                />
            ))}
        </div>
    );

// ==================== COMPOSITE SKELETONS ====================

/**
 * StatCard Skeleton - Dashboard & Admin metric cards
 */
export const StatCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`bg-white dark:bg-dark-nav ${DS.radius.card} p-6 flex flex-col justify-between h-[220px] border border-gray-100 dark:border-white/5 ${className}`}>
        <div>
            <Skeleton className="h-2 w-24 mb-3" />
            <Skeleton className="h-10 w-20" />
        </div>
        <div className="mt-auto pt-4 border-t border-gray-50 dark:border-white/5">
            <Skeleton className="h-3 w-32" />
        </div>
    </div>
);

/**
 * StatCard Grid Skeleton - 3 stat cards in a row
 */
export const StatCardGridSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: count }).map((_, i) => (
            <StatCardSkeleton key={i} />
        ))}
    </div>
);

/**
 * Chart Skeleton - Area/Line chart placeholder
 */
export const ChartSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`bg-white dark:bg-dark-nav ${DS.radius.card} p-6 border border-gray-100 dark:border-white/5 ${className}`}>
        <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-4 w-32" />
            <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-8 w-16 rounded-full" />
                ))}
            </div>
        </div>
        <div className="h-80 flex items-end gap-2 px-4">
            {/* Simulated bar chart / area chart lines */}
            {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton
                    key={i}
                    className="flex-1 rounded-t-lg"
                    style={{ height: `${30 + Math.random() * 50}%` } as React.CSSProperties}
                />
            ))}
        </div>
    </div>
);

/**
 * Radar Chart Skeleton - Spider graph placeholder
 */
export const RadarChartSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`h-[300px] w-full bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 flex items-center justify-center ${className}`}>
        <div className="relative w-48 h-48">
            {/* Concentric circles */}
            {[1, 2, 3].map(i => (
                <Skeleton
                    key={i}
                    className={`absolute rounded-full border-2 border-gray-200 dark:border-white/10 bg-transparent`}
                    style={{
                        width: `${i * 33}%`,
                        height: `${i * 33}%`,
                        top: `${50 - (i * 33) / 2}%`,
                        left: `${50 - (i * 33) / 2}%`,
                    } as React.CSSProperties}
                />
            ))}
            {/* Center point */}
            <SkeletonCircle size="w-4 h-4" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
    </div>
);

/**
 * Table Skeleton - For data tables
 */
export const TableSkeleton: React.FC<{
    rows?: number;
    columns?: number;
    className?: string;
}> = ({
    rows = 5,
    columns = 4,
    className = ''
}) => (
        <div className={`bg-white dark:bg-dark-nav ${DS.radius.card} border border-gray-100 dark:border-white/5 overflow-hidden ${className}`}>
            {/* Header */}
            <div className="flex gap-4 px-8 py-5 bg-gray-50/50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/5">
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={i} className="h-3 flex-1 max-w-[120px]" />
                ))}
            </div>
            {/* Rows */}
            <div className="divide-y divide-gray-50 dark:divide-white/5">
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <div key={rowIndex} className="flex items-center gap-4 px-8 py-5">
                        {columns > 0 && (
                            <div className="flex items-center gap-3 flex-1">
                                <SkeletonCircle />
                                <div className="space-y-1.5 flex-1">
                                    <Skeleton className="h-3 w-32" />
                                    <Skeleton className="h-2.5 w-40" />
                                </div>
                            </div>
                        )}
                        {Array.from({ length: columns - 1 }).map((_, colIndex) => (
                            <Skeleton key={colIndex} className="h-3 flex-1 max-w-[80px]" />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );

/**
 * Module Card Skeleton - Training module cards
 */
export const ModuleCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`bg-white dark:bg-transparent border border-gray-100 dark:border-white/20 rounded-[24px] p-5 min-h-[160px] flex flex-col justify-between ${className}`}>
        <div>
            <div className="flex justify-between items-start mb-3">
                <Skeleton className="h-4 w-16 rounded-md" />
                <Skeleton className="h-4 w-10" />
            </div>
            <Skeleton className="h-4 w-3/4 mb-2" />
            <SkeletonText lines={2} className="mt-2" />
        </div>
        <div className="flex items-center justify-between pt-4 mt-auto border-t border-gray-100 dark:border-white/5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-12" />
        </div>
    </div>
);

/**
 * Module Card Grid Skeleton - Grid of module cards
 */
export const ModuleCardGridSkeleton: React.FC<{ count?: number; className?: string }> = ({
    count = 6,
    className = ''
}) => (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
            <ModuleCardSkeleton key={i} />
        ))}
    </div>
);

/**
 * Calendar Skeleton - Calendar grid placeholder
 */
export const CalendarSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`bg-white dark:bg-dark-nav ${DS.radius.card} p-6 border border-gray-100 dark:border-white/5 ${className}`}>
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2 text-center mb-3">
            {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-2 w-6 mx-auto" />
            ))}
        </div>
        {/* Date grid */}
        <div className="grid grid-cols-7 gap-y-3 gap-x-1">
            {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="flex justify-center">
                    <SkeletonCircle size="w-8 h-8" />
                </div>
            ))}
        </div>
    </div>
);

/**
 * Task List Skeleton - Roadmap/timeline items
 */
export const TaskListSkeleton: React.FC<{ count?: number; className?: string }> = ({
    count = 4,
    className = ''
}) => (
    <div className={`bg-white dark:bg-dark-nav ${DS.radius.card} p-6 border border-gray-100 dark:border-white/5 ${className}`}>
        <div className="space-y-5">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <SkeletonCircle size="w-2.5 h-2.5" />
                        {i < count - 1 && <div className="w-0.5 h-full bg-gray-100 dark:bg-white/5 mt-1" />}
                    </div>
                    <div className="flex-1 pb-4">
                        <div className="flex justify-between">
                            <div className="space-y-1.5">
                                <Skeleton className="h-3.5 w-36" />
                                <Skeleton className="h-2.5 w-28" />
                            </div>
                            <div className="text-right space-y-1">
                                <Skeleton className="h-3 w-12" />
                                <Skeleton className="h-2 w-10" />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

/**
 * Activity Feed Skeleton - Recent activity list
 */
export const ActivityFeedSkeleton: React.FC<{ count?: number; className?: string }> = ({
    count = 4,
    className = ''
}) => (
    <div className={`bg-white dark:bg-dark-nav ${DS.radius.card} p-8 border border-gray-100 dark:border-white/5 ${className}`}>
        <Skeleton className="h-5 w-32 mb-6" />
        <div className="space-y-6">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                    <SkeletonCircle />
                    <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-3/4" />
                        <Skeleton className="h-2.5 w-20" />
                    </div>
                    <Skeleton className="h-3 w-16" />
                </div>
            ))}
        </div>
    </div>
);

/**
 * Metric Card Skeleton - Admin dashboard metric cards
 */
export const MetricCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`bg-white dark:bg-dark-nav ${DS.radius.card} p-6 border border-gray-100 dark:border-white/5 h-[180px] flex flex-col justify-between ${className}`}>
        <div className="flex justify-between items-start">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <Skeleton className="h-2.5 w-20" />
        </div>
        <div className="mt-4">
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-2.5 w-28" />
        </div>
    </div>
);

/**
 * Metric Card Grid Skeleton
 */
export const MetricCardGridSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: count }).map((_, i) => (
            <MetricCardSkeleton key={i} />
        ))}
    </div>
);

/**
 * System Health Skeleton
 */
export const SystemHealthSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`bg-white dark:bg-dark-nav ${DS.radius.card} p-8 border border-gray-100 dark:border-white/5 ${className}`}>
        <Skeleton className="h-5 w-28 mb-6" />
        <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3.5 w-16" />
                </div>
            ))}
        </div>
    </div>
);

/**
 * History Card Skeleton - Mobile history cards
 */
export const HistoryCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`bg-white dark:bg-dark-nav p-5 rounded-[24px] border border-gray-100 dark:border-white/5 ${className}`}>
        <div className="flex justify-between items-start mb-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-5 w-40 mb-3" />
        <div className="flex items-center gap-2 mt-3">
            <Skeleton className="h-7 w-12" />
            <div className="h-px flex-1 bg-gray-100 dark:bg-white/5" />
            <Skeleton className="h-3 w-20" />
        </div>
    </div>
);

/**
 * Insight Card Skeleton - Analytics insight/recommendation cards
 */
export const InsightCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`bg-[#F8F9FD] dark:bg-dark-nav border border-transparent dark:border-white/5 rounded-[24px] p-6 md:p-8 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="h-5 w-24" />
        </div>
        <SkeletonText lines={3} className="mb-4" />
        <div className="h-px bg-gray-200 dark:bg-white/10 w-full my-4" />
        <SkeletonText lines={2} />
    </div>
);

/**
 * Kanban Column Skeleton - Training level columns
 */
export const KanbanColumnSkeleton: React.FC<{ cardCount?: number; className?: string }> = ({
    cardCount = 3,
    className = ''
}) => (
    <div className={`w-[320px] flex flex-col h-full bg-[#F8F9FD] dark:bg-dark-nav rounded-[24px] p-4 border border-gray-100 dark:border-white/5 ${className}`}>
        <div className="pb-5 px-1 shrink-0">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Skeleton className="w-8 h-8 rounded-lg" />
                    <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-3 w-14" />
            </div>
            <Skeleton className="h-2.5 w-32" />
        </div>
        <div className="flex-1 space-y-4">
            {Array.from({ length: cardCount }).map((_, i) => (
                <ModuleCardSkeleton key={i} />
            ))}
        </div>
    </div>
);
