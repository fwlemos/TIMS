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

    const fetchOpportunities = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true)
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
        const stageId = opportunity.stage_id || leadBacklogStage?.id

        const { data, error } = await supabase
            .from('opportunities')
            .insert({
                ...opportunity,
                stage_id: stageId,
            })
            .select(`
                *,
                contact:contacts(id, name),
                company:companies(id, name),
                product:products(id, name),
                stage:pipeline_stages(*)
            `)
            .single()

        if (error) throw error

        // Optimistic update: Add new opportunity to state
        setOpportunities(prev => [data, ...prev])

        // Log creation in background (don't await)
        supabase.from('opportunity_history').insert({
            opportunity_id: data.id,
            action: 'created',
            new_value: data.title,
        })

        return data
    }

    const updateOpportunity = async (id: string, updates: UpdateTables<'opportunities'>) => {
        // Optimistic update: Update in local state immediately
        setOpportunities(prev => prev.map(o =>
            o.id === id ? { ...o, ...updates } : o
        ))

        const { data, error } = await supabase
            .from('opportunities')
            .update(updates)
            .eq('id', id)
            .select(`
                *,
                contact:contacts(id, name),
                company:companies(id, name),
                product:products(id, name),
                stage:pipeline_stages(*)
            `)
            .single()

        if (error) {
            // Revert on error - refetch without loading indicator
            await fetchOpportunities(false)
            throw error
        }

        // Update with full data from server
        setOpportunities(prev => prev.map(o => o.id === id ? data : o))
        return data
    }

    const moveOpportunity = async (id: string, newStageId: string) => {
        const opportunity = opportunities.find(o => o.id === id)
        if (!opportunity) return null

        const oldStageId = opportunity.stage_id
        const newStage = stages.find(s => s.id === newStageId)

        // Optimistic update: Move opportunity in local state immediately
        setOpportunities(prev => prev.map(o =>
            o.id === id ? { ...o, stage_id: newStageId, stage: newStage || null } : o
        ))

        const { data, error } = await supabase
            .from('opportunities')
            .update({ stage_id: newStageId })
            .eq('id', id)
            .select()
            .single()

        if (error) {
            // Revert optimistic update on error
            const oldStage = stages.find(s => s.id === oldStageId)
            setOpportunities(prev => prev.map(o =>
                o.id === id ? { ...o, stage_id: oldStageId, stage: oldStage || null } : o
            ))
            throw error
        }

        // Log stage change in background (don't await)
        const oldStageName = stages.find(s => s.id === oldStageId)?.name
        supabase.from('opportunity_history').insert({
            opportunity_id: id,
            action: 'stage_changed',
            field_name: 'stage_id',
            old_value: oldStageName,
            new_value: newStage?.name,
        })

        return data
    }

    const deleteOpportunity = async (id: string) => {
        // Optimistic update: Remove from local state immediately
        const deletedOpp = opportunities.find(o => o.id === id)
        setOpportunities(prev => prev.filter(o => o.id !== id))

        const { error } = await supabase
            .from('opportunities')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id)

        if (error) {
            // Revert on error
            if (deletedOpp) {
                setOpportunities(prev => [...prev, deletedOpp])
            }
            throw error
        }
    }

    // Reorder opportunities within a stage (for sortable)
    const reorderOpportunities = (activeId: string, overId: string) => {
        setOpportunities(prev => {
            const activeIndex = prev.findIndex(o => o.id === activeId)
            const overIndex = prev.findIndex(o => o.id === overId)

            if (activeIndex === -1 || overIndex === -1) return prev

            const newArray = [...prev]
            const [removed] = newArray.splice(activeIndex, 1)
            newArray.splice(overIndex, 0, removed)
            return newArray
        })
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
        setOpportunities, // Expose for drag-over reordering
        refetch: fetchOpportunities,
        createOpportunity,
        updateOpportunity,
        moveOpportunity,
        deleteOpportunity,
        reorderOpportunities,
    }
}

