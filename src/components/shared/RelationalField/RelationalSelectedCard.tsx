import { ReactNode } from 'react'
import { X, Pencil } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { RelationalOption } from './types'

interface RelationalSelectedCardProps {
    record: RelationalOption
    entityLabel: string
    entityIcon?: ReactNode
    onRemove: () => void
    onEdit?: () => void
    canEdit?: boolean
    editButtonRef?: (el: HTMLButtonElement | null) => void
    href?: string
}

export function RelationalSelectedCard({
    record,
    entityLabel,
    entityIcon,
    onRemove,
    onEdit,
    canEdit = false,
    editButtonRef,
    href,
}: RelationalSelectedCardProps) {
    const Content = (
        <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{record.primaryText}</div>
            {record.secondaryText && (
                <div className="text-xs text-muted-foreground">{record.secondaryText}</div>
            )}
        </div>
    )

    return (
        <div className="card p-3 flex items-center gap-3 group relative">
            {/* Clickable Area (if href) */}
            {href && (
                <Link
                    to={href}
                    className="absolute inset-0 z-0 rounded-lg hover:bg-muted/50 transition-colors"
                >
                    <span className="sr-only">View {entityLabel}</span>
                </Link>
            )}

            {/* Icon */}
            {entityIcon && (
                <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center pointer-events-none">
                    {entityIcon}
                </div>
            )}

            {/* Content (Z-indexed to be above link if needed, but actually link cover is fine for card unless we want text selection)*/
                /* Better UX: Make the whole card clickable EXCEPT buttons. */
            }
            <div className="relative z-10 flex-1 min-w-0 bg-transparent pointer-events-none">
                <div className="text-sm font-medium truncate">{record.primaryText}</div>
                {record.secondaryText && (
                    <div className="text-xs text-muted-foreground">{record.secondaryText}</div>
                )}
            </div>

            {/* Actions (Z-indexed higher to be clickable) */}
            <div className="relative z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {canEdit && onEdit && (
                    <button
                        ref={editButtonRef}
                        type="button"
                        onClick={onEdit}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
                        title={`Edit ${entityLabel}`}
                    >
                        <Pencil className="w-3.5 h-3.5" />
                    </button>
                )}
                <button
                    type="button"
                    onClick={onRemove}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                    title="Remove"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    )
}
