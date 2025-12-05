import { ReactNode } from 'react'
import { X, Pencil } from 'lucide-react'
import type { RelationalOption } from './types'

interface RelationalSelectedCardProps {
    record: RelationalOption
    entityLabel: string
    entityIcon?: ReactNode
    onRemove: () => void
    onEdit?: () => void
    canEdit?: boolean
}

export function RelationalSelectedCard({
    record,
    entityLabel,
    entityIcon,
    onRemove,
    onEdit,
    canEdit = false,
}: RelationalSelectedCardProps) {
    return (
        <div className="card p-3 flex items-center gap-3 group">
            {/* Icon */}
            {entityIcon && (
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    {entityIcon}
                </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{record.primaryText}</p>
                {record.secondaryText && (
                    <p className="text-xs text-muted-foreground truncate">{record.secondaryText}</p>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {canEdit && onEdit && (
                    <button
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
