import { clsx } from 'clsx'
import { Building2, User, Package } from 'lucide-react'
import type { OpportunityWithRelations } from '@/hooks/useOpportunities'

interface OpportunityCardProps {
    opportunity: OpportunityWithRelations
    onClick: () => void
    isDragging?: boolean
}

export function OpportunityCard({ opportunity, onClick, isDragging }: OpportunityCardProps) {
    const formatCurrency = (value: number | null, currency = 'BRL') => {
        if (!value) return null
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency,
        }).format(value)
    }

    return (
        <div
            onClick={onClick}
            className={clsx(
                'bg-card rounded-xl p-4 shadow-soft cursor-pointer',
                'border border-border hover:border-primary/30',
                'transition-all duration-150',
                isDragging && 'shadow-soft-lg rotate-2 opacity-90'
            )}
        >
            {/* Title */}
            <h4 className="font-medium text-sm mb-3 line-clamp-2">
                {opportunity.title}
            </h4>

            {/* Meta info */}
            <div className="space-y-2 text-xs text-muted-foreground">
                {opportunity.contact && (
                    <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5" />
                        <span className="truncate">{opportunity.contact.name}</span>
                    </div>
                )}

                {opportunity.company && (
                    <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5" />
                        <span className="truncate">{opportunity.company.name}</span>
                    </div>
                )}

                {opportunity.product && (
                    <div className="flex items-center gap-2">
                        <Package className="w-3.5 h-3.5" />
                        <span className="truncate">{opportunity.product.name}</span>
                    </div>
                )}
            </div>

            {/* Price */}
            {opportunity.sales_price && (
                <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(opportunity.sales_price, opportunity.currency || 'BRL')}
                    </p>
                </div>
            )}

            {/* Office Badge */}
            <div className="mt-3 flex items-center justify-between">
                <span className={clsx(
                    'px-2 py-0.5 rounded text-[10px] font-medium uppercase',
                    opportunity.office === 'TIA'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                )}>
                    {opportunity.office || 'TIA'}
                </span>
            </div>
        </div>
    )
}
