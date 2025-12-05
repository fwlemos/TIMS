import { useState } from 'react'
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners,
} from '@dnd-kit/core'
import { KanbanColumn } from './KanbanColumn'
import { OpportunityCard } from './OpportunityCard'
import { useOpportunities, OpportunityWithRelations } from '@/hooks/useOpportunities'

interface KanbanBoardProps {
    onCardClick: (opportunity: OpportunityWithRelations) => void
}

export function KanbanBoard({ onCardClick }: KanbanBoardProps) {
    const { stages, opportunitiesByStage, moveOpportunity, loading } = useOpportunities()
    const [activeOpportunity, setActiveOpportunity] = useState<OpportunityWithRelations | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    )

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event
        const opportunity = Object.values(opportunitiesByStage)
            .flat()
            .find(o => o.id === active.id)
        setActiveOpportunity(opportunity || null)
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveOpportunity(null)

        if (!over) return

        const opportunityId = active.id as string
        const newStageId = over.id as string

        // Check if dropped on a different stage
        const currentOpportunity = Object.values(opportunitiesByStage)
            .flat()
            .find(o => o.id === opportunityId)

        if (currentOpportunity?.stage_id !== newStageId) {
            try {
                await moveOpportunity(opportunityId, newStageId)
            } catch (error) {
                console.error('Failed to move opportunity:', error)
            }
        }
    }

    if (loading) {
        return (
            <div className="flex gap-4 overflow-x-auto pb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="min-w-[300px] max-w-[300px]">
                        <div className="skeleton h-6 w-24 mb-3" />
                        <div className="bg-muted/30 rounded-xl p-2 space-y-3">
                            <div className="skeleton h-32 rounded-xl" />
                            <div className="skeleton h-32 rounded-xl" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin h-[calc(100vh-220px)] items-stretch">
                {stages.map((stage) => (
                    <KanbanColumn
                        key={stage.id}
                        stage={stage}
                        opportunities={opportunitiesByStage[stage.id] || []}
                        onCardClick={onCardClick}
                    />
                ))}
            </div>

            <DragOverlay>
                {activeOpportunity && (
                    <OpportunityCard
                        opportunity={activeOpportunity}
                        onClick={() => { }}
                        isDragging
                    />
                )}
            </DragOverlay>
        </DndContext>
    )
}
