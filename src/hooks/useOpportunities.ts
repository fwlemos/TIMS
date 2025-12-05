import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Opportunity, PipelineStage, InsertTables, UpdateTables } from '@/lib/database.types'

export interface OpportunityWithRelations extends Opportunity {
    contact?: { id: string; name: string } | null
    company?: { id: string; name: string } | null
    product?: { id: string; name: string } | null
    stage?: PipelineStage | null
}

export function useOpportunities() {
    const [opportunities, setOpportunities] = useState<OpportunityWithRelations[]>([])
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

    const fetchOpportunities = useCallback(async () => {
        setLoading(true)
        setError(null)

        const [stagesData, opportunitiesResult] = await Promise.all([
            fetchStages(),
            supabase
                .from('opportunities')
                .select(`
          *,
          contact:contacts(id, name),
          company:companies(id, name),
          product:products(id, name),
          stage:pipeline_stages(*)
        `)
                .is('deleted_at', null)
                .order('created_at', { ascending: false })
        ])

        setStages(stagesData)

        if (opportunitiesResult.error) {
            setError(opportunitiesResult.error.message)
            setOpportunities([])
        } else {
            setOpportunities(opportunitiesResult.data || [])
        }
        setLoading(false)
    }, [fetchStages])

    useEffect(() => {
        fetchOpportunities()
    }, [fetchOpportunities])

    const createOpportunity = async (opportunity: InsertTables<'opportunities'>) => {
        // Get the Lead Backlog stage
        const leadBacklogStage = stages.find(s => s.order_index === 0)

        const { data, error } = await supabase
            .from('opportunities')
            .insert({
                ...opportunity,
                stage_id: opportunity.stage_id || leadBacklogStage?.id,
            })
            .select()
            .single()

        if (error) throw error

        // Log creation
        await supabase.from('opportunity_history').insert({
            opportunity_id: data.id,
            action: 'created',
            new_value: data.title,
        })

        await fetchOpportunities()
        return data
    }

    const updateOpportunity = async (id: string, updates: UpdateTables<'opportunities'>) => {
        const { data, error } = await supabase
            .from('opportunities')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        await fetchOpportunities()
        return data
    }

    const moveOpportunity = async (id: string, newStageId: string) => {
        const opportunity = opportunities.find(o => o.id === id)
        const oldStage = opportunity?.stage
        const newStage = stages.find(s => s.id === newStageId)

        const { data, error } = await supabase
            .from('opportunities')
            .update({ stage_id: newStageId })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        // Log stage change
        await supabase.from('opportunity_history').insert({
            opportunity_id: id,
            action: 'stage_changed',
            field_name: 'stage_id',
            old_value: oldStage?.name,
            new_value: newStage?.name,
        })

        await fetchOpportunities()
        return data
    }

    const deleteOpportunity = async (id: string) => {
        const { error } = await supabase
            .from('opportunities')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id)

        if (error) throw error
        await fetchOpportunities()
    }

    // Group opportunities by stage
    const opportunitiesByStage = stages.reduce((acc, stage) => {
        acc[stage.id] = opportunities.filter(o => o.stage_id === stage.id)
        return acc
    }, {} as Record<string, OpportunityWithRelations[]>)

    return {
        opportunities,
        stages,
        opportunitiesByStage,
        loading,
        error,
        refetch: fetchOpportunities,
        createOpportunity,
        updateOpportunity,
        moveOpportunity,
        deleteOpportunity,
    }
}
