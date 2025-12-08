import { useState, useMemo } from 'react'
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
import { KanbanAdvanceModal } from './KanbanAdvanceModal'
import type { OpportunityWithRelations } from '@/hooks/useOpportunities'
import type { Tables, Opportunity } from '@/lib/database.types'
import { logger } from '@/utils/logger'

// Stage fields configuration for validation
interface StageField {
    name: string
    label: string
    type: 'text' | 'select' | 'number' | 'date' | 'textarea'
    required?: boolean
    options?: { value: string; label: string }[]
    placeholder?: string
}

const STAGE_REQUIRED_FIELDS: Record<string, StageField[]> = {
    'lead_backlog': [
        { name: 'contact_id', label: 'Contact', type: 'text', required: true },
        {
            name: 'lead_origin', label: 'Lead Origin', type: 'select', required: true, options: [
                { value: 'website', label: 'Website' },
                { value: 'referral', label: 'Referral' },
                { value: 'events', label: 'Events' },
                { value: 'social_media', label: 'Social Media' },
                { value: 'other', label: 'Other' },
            ]
        },
    ],
    'qualification': [
        {
            name: 'type_of_sale', label: 'Type of Sale', type: 'select', required: true, options: [
                { value: 'Direct Importation', label: 'Direct Importation' },
                { value: 'Nationalized', label: 'Nationalized' },
                { value: 'Commissioned', label: 'Commissioned' },
            ], placeholder: 'Select type...'
        },
    ],
    'quotation': [],
    'closing': [],
    'won': [],
}

interface PendingAdvancement {
    opportunityId: string
    opportunity: OpportunityWithRelations
    fromStageId: string
    toStageId: string
    fromStage: Tables<'pipeline_stages'>
    toStage: Tables<'pipeline_stages'>
    missingFields: StageField[]
}

interface KanbanBoardProps {
    stages: Tables<'pipeline_stages'>[]
    opportunitiesByStage: Record<string, OpportunityWithRelations[]>
    opportunities: OpportunityWithRelations[]
    loading: boolean
    onCardClick: (opportunity: OpportunityWithRelations) => void
    onMoveOpportunity: (opportunityId: string, newStageId: string) => Promise<void>
    onUpdateOpportunity?: (opportunityId: string, updates: Partial<Opportunity>) => Promise<void>
    setOpportunities: React.Dispatch<React.SetStateAction<OpportunityWithRelations[]>>
}

export function KanbanBoard({
    stages,
    opportunitiesByStage,
    opportunities,
    loading,
    onCardClick,
    onMoveOpportunity,
    onUpdateOpportunity,
    setOpportunities
}: KanbanBoardProps) {
    const [activeOpportunity, setActiveOpportunity] = useState<OpportunityWithRelations | null>(null)
    const [pendingAdvancement, setPendingAdvancement] = useState<PendingAdvancement | null>(null)
    const [originalStageId, setOriginalStageId] = useState<string | null>(null)

    // Distance-based activation - must move 10px to start drag, allowing clicks
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 10,
            },
        })
    )

    // Get stage key for field lookup
    const getStageKey = (stage: Tables<'pipeline_stages'>): string => {
        return stage.name.toLowerCase().replace(/\s+/g, '_')
    }

    // Get stage index
    const getStageIndex = (stageId: string): number => {
        return stages.findIndex(s => s.id === stageId)
    }

    // Validate stage advancement - returns missing required fields
    const validateStageAdvance = (opportunity: OpportunityWithRelations, fromStageId: string, toStageId: string): StageField[] => {
        const fromIndex = getStageIndex(fromStageId)
        const toIndex = getStageIndex(toStageId)

        // Allow moving backward without validation
        if (toIndex <= fromIndex) return []

        // Only allow advancing one stage at a time
        if (toIndex > fromIndex + 1) return []

        // Get required fields for current stage
        const fromStage = stages.find(s => s.id === fromStageId)
        if (!fromStage) return []

        const stageKey = getStageKey(fromStage)
        const requiredFields = STAGE_REQUIRED_FIELDS[stageKey] || []

        // Check which required fields are missing
        const missingFields: StageField[] = []
        for (const field of requiredFields) {
            if (!field.required) continue

            const value = (opportunity as unknown as Record<string, unknown>)[field.name]
            if (value === null || value === undefined || value === '') {
                missingFields.push(field)
            }
        }

        return missingFields
    }

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event
        const opportunity = opportunities.find(o => o.id === active.id)
        setActiveOpportunity(opportunity || null)
        setOriginalStageId(opportunity?.stage_id || null)
    }

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event
        if (!over) return

        const activeId = active.id as string
        const overId = over.id as string

        const activeOpp = opportunities.find(o => o.id === activeId)
        if (!activeOpp) return

        const isOverAStage = stages.some(s => s.id === overId)
        const overOpp = opportunities.find(o => o.id === overId)

        if (isOverAStage) {
            if (activeOpp.stage_id !== overId) {
                const fromIndex = getStageIndex(activeOpp.stage_id || '')
                const toIndex = getStageIndex(overId)

                // Prevent skipping stages forward
                if (toIndex > fromIndex + 1) return

                const newStage = stages.find(s => s.id === overId)
                setOpportunities(prev => prev.map(o =>
                    o.id === activeId ? { ...o, stage_id: overId, stage: newStage || null } : o
                ))
            }
        } else if (overOpp) {
            const activeIndex = opportunities.findIndex(o => o.id === activeId)
            const overIndex = opportunities.findIndex(o => o.id === overId)

            if (activeOpp.stage_id !== overOpp.stage_id) {
                const fromIndex = getStageIndex(activeOpp.stage_id || '')
                const toIndex = getStageIndex(overOpp.stage_id || '')

                // Prevent skipping stages forward
                if (toIndex > fromIndex + 1) return

                const newStage = stages.find(s => s.id === overOpp.stage_id)
                setOpportunities(prev => {
                    const updated = prev.map(o =>
                        o.id === activeId ? { ...o, stage_id: overOpp.stage_id, stage: newStage || null } : o
                    )
                    return arrayMove(updated, activeIndex, overIndex)
                })
            } else if (activeIndex !== overIndex) {
                setOpportunities(prev => arrayMove(prev, activeIndex, overIndex))
            }
        }
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveOpportunity(null)

        if (!over) {
            // Revert to original position if dropped outside
            if (originalStageId) {
                const activeId = active.id as string
                const originalStage = stages.find(s => s.id === originalStageId)
                setOpportunities(prev => prev.map(o =>
                    o.id === activeId ? { ...o, stage_id: originalStageId, stage: originalStage || null } : o
                ))
            }
            setOriginalStageId(null)
            return
        }

        const activeId = active.id as string
        const overId = over.id as string

        const activeOpp = opportunities.find(o => o.id === activeId)
        if (!activeOpp || !originalStageId) {
            setOriginalStageId(null)
            return
        }

        // Determine the final stage
        const isOverAStage = stages.some(s => s.id === overId)
        let finalStageId: string

        if (isOverAStage) {
            finalStageId = overId
        } else {
            const overOpp = opportunities.find(o => o.id === overId)
            finalStageId = overOpp?.stage_id || originalStageId
        }

        // If stage changed, validate and persist
        if (finalStageId && originalStageId !== finalStageId) {
            const fromIndex = getStageIndex(originalStageId)
            const toIndex = getStageIndex(finalStageId)

            // Allow backward movement without validation
            if (toIndex <= fromIndex) {
                try {
                    await onMoveOpportunity(activeId, finalStageId)
                } catch (error) {
                    logger.error('Failed to move opportunity:', { error })
                    // Revert
                    const originalStage = stages.find(s => s.id === originalStageId)
                    setOpportunities(prev => prev.map(o =>
                        o.id === activeId ? { ...o, stage_id: originalStageId, stage: originalStage || null } : o
                    ))
                }
            } else {
                // Moving forward - validate required fields
                const missingFields = validateStageAdvance(activeOpp, originalStageId, finalStageId)

                if (missingFields.length > 0) {
                    // Show modal for missing fields
                    const fromStage = stages.find(s => s.id === originalStageId)!
                    const toStage = stages.find(s => s.id === finalStageId)!

                    setPendingAdvancement({
                        opportunityId: activeId,
                        opportunity: activeOpp,
                        fromStageId: originalStageId,
                        toStageId: finalStageId,
                        fromStage,
                        toStage,
                        missingFields,
                    })

                    // Revert visual change while modal is open
                    const originalStage = stages.find(s => s.id === originalStageId)
                    setOpportunities(prev => prev.map(o =>
                        o.id === activeId ? { ...o, stage_id: originalStageId, stage: originalStage || null } : o
                    ))
                } else {
                    // All fields filled, advance stage
                    try {
                        await onMoveOpportunity(activeId, finalStageId)
                    } catch (error) {
                        logger.error('Failed to move opportunity:', { error })
                        const originalStage = stages.find(s => s.id === originalStageId)
                        setOpportunities(prev => prev.map(o =>
                            o.id === activeId ? { ...o, stage_id: originalStageId, stage: originalStage || null } : o
                        ))
                    }
                }
            }
        }

        setOriginalStageId(null)
    }

    const handleModalClose = () => {
        setPendingAdvancement(null)
    }

    const handleModalAdvance = async (fieldValues: Record<string, unknown>) => {
        if (!pendingAdvancement || !onUpdateOpportunity) return

        try {
            // Update opportunity with new field values
            await onUpdateOpportunity(pendingAdvancement.opportunityId, fieldValues)

            // Move to new stage
            await onMoveOpportunity(pendingAdvancement.opportunityId, pendingAdvancement.toStageId)

            // Update local state with new stage
            const newStage = stages.find(s => s.id === pendingAdvancement.toStageId)
            setOpportunities(prev => prev.map(o =>
                o.id === pendingAdvancement.opportunityId ? { ...o, ...fieldValues, stage_id: pendingAdvancement.toStageId, stage: newStage || null } : o
            ))
        } catch (error) {
            logger.error('Failed to advance opportunity:', { error })
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
        <>
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

            {/* Advance Modal for missing required fields */}
            <KanbanAdvanceModal
                isOpen={pendingAdvancement !== null}
                onClose={handleModalClose}
                onAdvance={handleModalAdvance}
                opportunity={pendingAdvancement?.opportunity || null}
                fromStage={pendingAdvancement?.fromStage || null}
                toStage={pendingAdvancement?.toStage || null}
                missingFields={pendingAdvancement?.missingFields.map(f => ({
                    name: f.name,
                    label: f.label,
                    type: f.type,
                    options: f.options,
                    placeholder: f.placeholder,
                })) || []}
            />
        </>
    )
}
