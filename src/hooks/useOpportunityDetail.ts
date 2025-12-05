import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Opportunity, PipelineStage, UpdateTables } from '@/lib/database.types'

export interface OpportunityDetailWithRelations extends Opportunity {
    contact?: {
        id: string
        name: string
        email?: string | null
        phone?: string | null
    } | null
    company?: {
        id: string
        name: string
        address?: string | null
        phone?: string | null
    } | null
    product?: {
        id: string
        name: string
        ncm?: string | null
        manufacturer_id?: string | null
    } | null
    stage?: PipelineStage | null
}

export function useOpportunityDetail(opportunityId: string | undefined) {
    const [opportunity, setOpportunity] = useState<OpportunityDetailWithRelations | null>(null)
    const [stages, setStages] = useState<PipelineStage[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchStages = useCallback(async () => {
        const { data, error } = await supabase
            .from('pipeline_stages')
            .select('*')
            .order('order_index')

        if (error) {
            console.error('Error fetching stages:', error)
            return []
        }
        return data || []
    }, [])

    const fetchOpportunity = useCallback(async () => {
        if (!opportunityId) {
            setOpportunity(null)
            setLoading(false)
            return
        }

        setLoading(true)
        setError(null)

        const [stagesData, opportunityResult] = await Promise.all([
            fetchStages(),
            supabase
                .from('opportunities')
                .select(`
                    *,
                    contact:contacts(id, name, email, phone),
                    company:companies(id, name, address, phone),
                    product:products(id, name, ncm, manufacturer_id),
                    stage:pipeline_stages(*)
                `)
                .eq('id', opportunityId)
                .is('deleted_at', null)
                .single()
        ])

        setStages(stagesData)

        if (opportunityResult.error) {
            setError(opportunityResult.error.message)
            setOpportunity(null)
        } else {
            setOpportunity(opportunityResult.data)
        }
        setLoading(false)
    }, [opportunityId, fetchStages])

    useEffect(() => {
        fetchOpportunity()
    }, [fetchOpportunity])

    const updateOpportunity = async (data: UpdateTables<'opportunities'>) => {
        if (!opportunityId || !opportunity) return

        // Optimistic update
        setOpportunity(prev => prev ? { ...prev, ...data } : prev)

        const { error } = await supabase
            .from('opportunities')
            .update({
                ...data,
                updated_at: new Date().toISOString()
            })
            .eq('id', opportunityId)

        if (error) {
            console.error('Error updating opportunity:', error)
            // Revert on error
            fetchOpportunity()
            throw error
        }
    }

    const updateStage = async (newStageId: string) => {
        if (!opportunityId || !opportunity) return

        const newStage = stages.find(s => s.id === newStageId)

        // Optimistic update
        setOpportunity(prev => prev ? {
            ...prev,
            stage_id: newStageId,
            stage: newStage || null
        } : prev)

        const { error } = await supabase
            .from('opportunities')
            .update({
                stage_id: newStageId,
                updated_at: new Date().toISOString()
            })
            .eq('id', opportunityId)

        if (error) {
            console.error('Error updating stage:', error)
            // Revert on error
            fetchOpportunity()
            throw error
        }
    }

    return {
        opportunity,
        stages,
        loading,
        error,
        refetch: fetchOpportunity,
        updateOpportunity,
        updateStage,
    }
}
