import { useDroppable } from '@dnd-kit/core'
import {
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { clsx } from 'clsx'
import { SortableOpportunityCard } from './SortableOpportunityCard'
import type { PipelineStage } from '@/lib/database.types'
import type { OpportunityWithRelations } from '@/hooks/useOpportunities'

interface KanbanColumnProps {
    stage: PipelineStage
    opportunities: OpportunityWithRelations[]
    onCardClick: (opportunity: OpportunityWithRelations) => void
}

export function KanbanColumn({ stage, opportunities, onCardClick }: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: stage.id,
    })

    // Count and total value
    const totalValue = opportunities.reduce((sum, opp) => sum + (opp.sales_price || 0), 0)
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            notation: 'compact',
        }).format(value)
    }

    return (
        <div className="flex flex-col min-w-[300px] max-w-[300px] h-full">
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: stage.color || '#6b7280' }}
                    />
                    <h3 className="font-medium text-sm">{stage.name}</h3>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {opportunities.length}
                    </span>
                </div>
                {totalValue > 0 && (
                    <span className="text-xs text-muted-foreground">
                        {formatCurrency(totalValue)}
                    </span>
                )}
            </div>

            {/* Cards Container */}
            <div
                ref={setNodeRef}
                className={clsx(
                    'flex-1 p-2 rounded-xl min-h-[200px] space-y-3',
                    'bg-muted/30 border-2 border-dashed border-transparent',
                    'transition-colors duration-200',
                    isOver && 'border-primary/50 bg-primary/5'
                )}
            >
                <SortableContext
                    items={opportunities.map(o => o.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {opportunities.map((opportunity) => (
                        <SortableOpportunityCard
                            key={opportunity.id}
                            opportunity={opportunity}
                            onClick={() => onCardClick(opportunity)}
                        />
                    ))}
                </SortableContext>

                {opportunities.length === 0 && (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                        No opportunities
                    </div>
                )}
            </div>
        </div>
    )
}
