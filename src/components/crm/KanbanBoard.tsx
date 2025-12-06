import { useState } from 'react'
import {
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
    closestCenter,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { KanbanColumn } from './KanbanColumn'
import { OpportunityCard } from './OpportunityCard'
import type { OpportunityWithRelations } from '@/hooks/useOpportunities'
import type { Tables } from '@/lib/database.types'

interface KanbanBoardProps {
    stages: Tables<'pipeline_stages'>[]
    opportunitiesByStage: Record<string, OpportunityWithRelations[]>
    opportunities: OpportunityWithRelations[]
    loading: boolean
    onCardClick: (opportunity: OpportunityWithRelations) => void
    onMoveOpportunity: (opportunityId: string, newStageId: string) => Promise<void>
    setOpportunities: React.Dispatch<React.SetStateAction<OpportunityWithRelations[]>>
}

export function KanbanBoard({
    stages,
    opportunitiesByStage,
    opportunities,
    loading,
    onCardClick,
    onMoveOpportunity,
    setOpportunities
}: KanbanBoardProps) {
    const [activeOpportunity, setActiveOpportunity] = useState<OpportunityWithRelations | null>(null)

    // Distance-based activation - must move 10px to start drag, allowing clicks
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 10,
            },
        })
    )

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event
        const opportunity = opportunities.find(o => o.id === active.id)
        setActiveOpportunity(opportunity || null)
    }

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event
        if (!over) return

        const activeId = active.id as string
        const overId = over.id as string

        // Find which stage the active and over items belong to
        const activeOpp = opportunities.find(o => o.id === activeId)
        if (!activeOpp) return

        // Check if over is a stage (column) or another opportunity
        const isOverAStage = stages.some(s => s.id === overId)
        const overOpp = opportunities.find(o => o.id === overId)

        if (isOverAStage) {
            // Moving to a different column (empty drop zone)
            if (activeOpp.stage_id !== overId) {
                const newStage = stages.find(s => s.id === overId)
                setOpportunities(prev => prev.map(o =>
                    o.id === activeId ? { ...o, stage_id: overId, stage: newStage || null } : o
                ))
            }
        } else if (overOpp) {
            // Moving over another opportunity
            const activeIndex = opportunities.findIndex(o => o.id === activeId)
            const overIndex = opportunities.findIndex(o => o.id === overId)

            // If in different columns, move to that column first
            if (activeOpp.stage_id !== overOpp.stage_id) {
                const newStage = stages.find(s => s.id === overOpp.stage_id)
                setOpportunities(prev => {
                    const updated = prev.map(o =>
                        o.id === activeId ? { ...o, stage_id: overOpp.stage_id, stage: newStage || null } : o
                    )
                    // Now reorder within the new column
                    return arrayMove(updated, activeIndex, overIndex)
                })
            } else if (activeIndex !== overIndex) {
                // Same column, just reorder
                setOpportunities(prev => arrayMove(prev, activeIndex, overIndex))
            }
        }
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveOpportunity(null)

        if (!over) return

        const activeId = active.id as string
        const overId = over.id as string

        const activeOpp = opportunities.find(o => o.id === activeId)
        if (!activeOpp) return

        // Determine the final stage
        const isOverAStage = stages.some(s => s.id === overId)
        let finalStageId: string

        if (isOverAStage) {
            finalStageId = overId
        } else {
            const overOpp = opportunities.find(o => o.id === overId)
            finalStageId = overOpp?.stage_id || activeOpp.stage_id || ''
        }

        // If stage changed, persist to database
        // Note: The visual update already happened in handleDragOver
        if (finalStageId && activeOpp.stage_id !== finalStageId) {
            try {
                await onMoveOpportunity(activeId, finalStageId)
            } catch (error) {
                console.error('Failed to move opportunity:', error)
                // The hook will revert the optimistic update on error
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
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
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

            <DragOverlay dropAnimation={{
                duration: 200,
                easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
            }}>
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
