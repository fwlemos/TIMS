import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { logger } from '@/utils/logger'
import type { OpportunityWithRelations, Stage } from '../types'

interface UseOpportunityActionsProps {
    opportunityId: string
    opportunity: OpportunityWithRelations | null
    stages: Stage[]
    updateOpportunity: (updates: Partial<any>) => Promise<any>
    updateStage: (stageId: string) => Promise<any>
    onRefreshTimeline: () => void
}

export function useOpportunityActions({
    opportunityId,
    opportunity,
    stages,
    updateOpportunity,
    updateStage,
    onRefreshTimeline
}: UseOpportunityActionsProps) {
    const [savingField, setSavingField] = useState<string | null>(null)
    const [savedField, setSavedField] = useState<string | null>(null)
    const [showLostModal, setShowLostModal] = useState(false)
    const [showWonModal, setShowWonModal] = useState(false)

    // Generic field update handler with visual feedback
    const handleFieldChange = useCallback(async (fieldName: string, value: unknown) => {
        if (!opportunity) return

        setSavingField(fieldName)
        try {
            await updateOpportunity({ [fieldName]: value })
            setSavedField(fieldName)
            setTimeout(() => setSavedField(null), 1500)
        } catch (err) {
            logger.error(`Error saving ${fieldName}:`, { error: err })
        } finally {
            setSavingField(null)
        }
    }, [opportunity, updateOpportunity])

    // Validate stage advancement
    const validateStageAdvance = useCallback((currentStageId: string, targetStageId: string): { valid: boolean; errors?: string[] } => {
        const currentStage = stages.find(s => s.id === currentStageId)
        const targetIndex = stages.findIndex(s => s.id === targetStageId)
        const currentIndex = stages.findIndex(s => s.id === currentStageId)

        // Allow moving backward without validation
        if (targetIndex < currentIndex) {
            return { valid: true }
        }

        // Prevent skipping stages
        if (targetIndex > currentIndex + 1) {
            return { valid: false, errors: ['You cannot skip stages. Please advance sequentially.'] }
        }

        const errors: string[] = []

        // Get the current stage key
        const stageKey = currentStage?.name.toLowerCase().replace(/\s+/g, '_')

        // Lead Backlog requirements
        if (stageKey === 'lead_backlog') {
            if (!opportunity?.contact_id) {
                errors.push('Contact is required')
            }
            if (!opportunity?.product_id && (!opportunity?.products || opportunity.products.length === 0)) {
                errors.push('Product is required')
            }
            if (!opportunity?.lead_origin) {
                errors.push('Lead Origin is required')
            }
        }

        // Won stage requirements
        if (targetStageId && stages.find(s => s.id === targetStageId)?.name.toLowerCase().includes('won')) {
            if (!opportunity?.won_purchase_order_url && !opportunity?.won_order_description) {
                errors.push('Purchase Order document OR Order Agreement description is required')
            }
        }

        return {
            valid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined
        }
    }, [stages, opportunity])

    const handleMarkAsLost = async (reason: string) => {
        if (!opportunity) return
        const lostStage = stages.find(s => s.name.toLowerCase().includes('lost'))
        if (lostStage) {
            await updateOpportunity({
                stage_id: lostStage.id,
                lost_reason: reason,
            })
            // Log to history
            const { error: historyError } = await supabase
                .from('opportunity_history')
                .insert({
                    opportunity_id: opportunityId,
                    action: 'stage_change',
                    field_name: 'stage',
                    old_value: opportunity.stage?.name,
                    new_value: lostStage.name,
                    user_id: (await supabase.auth.getUser()).data.user?.id
                })
            if (historyError) logger.error('Failed to log lost history:', { error: historyError })
        }
        setShowLostModal(false)
        onRefreshTimeline()
    }

    const handleMarkAsWon = async (data: { description?: string, fileUrl?: string }) => {
        if (!opportunity) return
        const wonStage = stages.find(s => s.name.toLowerCase().includes('won'))
        if (wonStage) {
            await updateOpportunity({
                stage_id: wonStage.id,
                won_order_description: data.description,
                won_purchase_order_url: data.fileUrl
            })
            // Log to history
            const { error: historyError } = await supabase
                .from('opportunity_history')
                .insert({
                    opportunity_id: opportunityId,
                    action: 'stage_change',
                    field_name: 'stage',
                    old_value: opportunity.stage?.name,
                    new_value: wonStage.name,
                    user_id: (await supabase.auth.getUser()).data.user?.id
                })
            if (historyError) logger.error('Failed to log won history:', { error: historyError })
        }
        setShowWonModal(false)
        onRefreshTimeline()
    }

    const handleStageChange = async (newStageId: string) => {
        const targetStage = stages.find(s => s.id === newStageId)
        if (!targetStage) return

        if (targetStage.name.toLowerCase().includes('lost')) {
            setShowLostModal(true)
            return
        }

        if (targetStage.name.toLowerCase().includes('won')) {
            setShowWonModal(true)
            return
        }

        await updateStage(newStageId)
    }

    return {
        savingField,
        savedField,
        setSavingField, // Exposed for external use if needed (e.g. specific entity updates)
        setSavedField,
        showLostModal,
        setShowLostModal,
        showWonModal,
        setShowWonModal,
        handleFieldChange,
        validateStageAdvance,
        handleMarkAsLost,
        handleMarkAsWon,
        handleStageChange
    }
}
