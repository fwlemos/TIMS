import { clsx } from 'clsx'

interface SkeletonProps {
    className?: string
    variant?: 'text' | 'circular' | 'rectangular'
    width?: string | number
    height?: string | number
    lines?: number
}

export function Skeleton({
    className,
    variant = 'rectangular',
    width,
    height,
    lines = 1,
}: SkeletonProps) {
    const baseClass = 'animate-pulse-soft bg-muted'

    const variantClasses = {
        text: 'rounded h-4',
        circular: 'rounded-full',
        rectangular: 'rounded-lg',
    }

    const style = {
        width: width,
        height: height,
    }

    if (lines > 1) {
        return (
            <div className="space-y-2">
                {Array.from({ length: lines }).map((_, i) => (
                    <div
                        key={i}
                        className={clsx(baseClass, variantClasses.text, className)}
                        style={{
                            ...style,
                            width: i === lines - 1 ? '60%' : width, // Last line shorter
                        }}
                    />
                ))}
            </div>
        )
    }

    return (
        <div
            className={clsx(baseClass, variantClasses[variant], className)}
            style={style}
        />
    )
}

// Common skeleton patterns
export function SkeletonCard() {
    return (
        <div className="card p-4 space-y-4">
            <div className="flex items-center gap-3">
                <Skeleton variant="circular" width={40} height={40} />
                <div className="flex-1">
                    <Skeleton width="60%" height={16} className="mb-2" />
                    <Skeleton width="40%" height={12} />
                </div>
            </div>
            <Skeleton lines={3} />
        </div>
    )
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
    return (
        <div className="card overflow-hidden">
            {/* Header */}
            <div className="flex gap-4 p-4 bg-muted/50 border-b border-border">
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={i} width={`${100 / columns}%`} height={16} />
                ))}
            </div>

            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div
                    key={rowIndex}
                    className="flex gap-4 p-4 border-b border-border last:border-0"
                >
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <Skeleton key={colIndex} width={`${100 / columns}%`} height={16} />
                    ))}
                </div>
            ))}
        </div>
    )
}

export function SkeletonKanban({ columns = 4 }: { columns?: number }) {
    return (
        <div className="flex gap-4 overflow-x-auto pb-4">
            {Array.from({ length: columns }).map((_, i) => (
                <div key={i} className="min-w-[300px] max-w-[300px]">
                    <Skeleton width={120} height={20} className="mb-3" />
                    <div className="bg-muted/30 rounded-xl p-2 space-y-3">
                        <Skeleton height={100} />
                        <Skeleton height={100} />
                        <Skeleton height={100} />
                    </div>
                </div>
            ))}
        </div>
    )
}
