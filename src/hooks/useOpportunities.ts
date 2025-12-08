
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Opportunity, PipelineStage, InsertTables, UpdateTables } from '@/lib/database.types'
import { logger } from '@/utils/logger'

export interface OpportunityWithRelations extends Opportunity {
    contact?: {
        id: string
        name: string
        email?: string | null
        phone?: string | null
        company?: { id: string; name: string } | null
    } | null
    company?: {
        id: string
        name: string
        phone?: string | null
        address?: string | null
        website?: string | null
    } | null
    product?: { id: string; name: string } | null  // Legacy single product
    products?: Array<{
        id: string
        name: string
        ncm?: string | null
        manufacturer?: {
            id: string
            name: string
        } | null
    }>
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
            logger.error('Error fetching stages:', { error })
            return []
        }
        return data || []
    }, [])

    // Helper to transform raw Supabase response to OpportunityWithRelations
    const transformOpportunity = (raw: any): OpportunityWithRelations => {
        // Safe access with types or optionals
        const rawProducts = raw.opportunity_products as Array<{ product: { id: string; name: string; ncm?: string | null; manufacturer?: { id: string; name: string } | null } | null }> | null | undefined

        const products = rawProducts?.map(op => ({
            id: op.product?.id,
            name: op.product?.name,
            ncm: op.product?.ncm,
            manufacturer: op.product?.manufacturer
        })).filter((p): p is NonNullable<typeof p> & { id: string; name: string } => !!p.id && !!p.name) || []

        const contact = raw.contact ? {
            ...raw.contact,
            company: raw.contact.company
        } : null

        return {
            ...raw,
            contact,
            products,
            opportunity_products: undefined // Cleanup raw relation
        }
    }

    const fetchOpportunities = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true)
        setError(null)

        try {
            const [stagesData, opportunitiesResult] = await Promise.all([
                fetchStages(),
                supabase
                    .from('opportunities')
                    .select(`
                        *,
                        contact:contacts(
                            id, 
                            name, 
                            email, 
                            phone,
                            company:companies(id, name)
                        ),
                        company:companies(
                            id, 
                            name,
                            phone,
                            address,
                            website
                        ),
                        product:products(id, name),
                        opportunity_products(
                            product:products(
                                id, 
                                name, 
                                ncm, 
                                manufacturer:companies(id, name)
                            )
                        ),
                        stage:pipeline_stages(*)
                    `)
                    .is('deleted_at', null)
                    .order('created_at', { ascending: false })
            ])

            setStages(stagesData)

            if (opportunitiesResult.error) {
                throw opportunitiesResult.error
            }

            const transformed = (opportunitiesResult.data || []).map(transformOpportunity)
            setOpportunities(transformed)
        } catch (err: any) {
            logger.error('Error fetching opportunities:', { error: err })
            setError(err.message)
            setOpportunities([])
        } finally {
            setLoading(false)
        }
    }, [fetchStages])

    useEffect(() => {
        fetchOpportunities()
    }, [fetchOpportunities])

    const createOpportunity = async (opportunity: InsertTables<'opportunities'>) => {
        // Get the Lead Backlog stage
        const leadBacklogStage = stages.find(s => s.order_index === 0)
        const stageId = opportunity.stage_id || leadBacklogStage?.id

        // Extract additional product IDs from metadata (if multi-product creation)
        const metadata = opportunity.metadata as { additional_product_ids?: string[] } | null | undefined
        const additionalProductIds = metadata?.additional_product_ids || []

        const { data, error } = await supabase
            .from('opportunities')
            .insert({
                ...opportunity,
                stage_id: stageId,
                // Clear the additional_product_ids from metadata since we'll handle it separately
                metadata: metadata ? { ...metadata, additional_product_ids: undefined } : undefined,
            })
            .select(`
                *,
                contact:contacts(id, name, email, phone, company:companies(id, name)),
                company:companies(id, name, phone, address, website),
                product:products(id, name),
                opportunity_products(
                    product:products(id, name, ncm, manufacturer:companies(id, name))
                ),
                stage:pipeline_stages(*)
            `)
            .single()

        if (error) throw error

        // Insert all products into the junction table
        const allProductIds = [opportunity.product_id, ...additionalProductIds].filter(Boolean) as string[]
        if (allProductIds.length > 0) {
            const productInserts = allProductIds.map(productId => ({
                opportunity_id: data.id,
                product_id: productId,
            }))

            await supabase
                .from('opportunity_products')
                .insert(productInserts)
                .throwOnError()
        }

        // We need to fetch full object to be safe and consistent
        const { data: fullData, error: fetchError } = await supabase
            .from('opportunities')
            .select(`
                *,
                contact:contacts(id, name, email, phone, company:companies(id, name)),
                company:companies(id, name, phone, address, website),
                product:products(id, name),
                opportunity_products(
                    product:products(id, name, ncm, manufacturer:companies(id, name))
                ),
                stage:pipeline_stages(*)
            `)
            .eq('id', data.id)
            .single()

        if (fetchError) throw fetchError

        const transformed = transformOpportunity(fullData)
        setOpportunities(prev => [transformed, ...prev])

        // Log creation
        supabase.from('opportunity_history').insert({
            opportunity_id: data.id,
            action: 'created',
            new_value: data.title,
        })

        return transformed
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
                contact:contacts(id, name, email, phone, company:companies(id, name)),
                company:companies(id, name, phone, address, website),
                product:products(id, name),
                opportunity_products(
                    product:products(id, name, ncm, manufacturer:companies(id, name))
                ),
                stage:pipeline_stages(*)
            `)
            .single()

        if (error) {
            // Revert on error - refetch without loading indicator
            await fetchOpportunities(false)
            throw error
        }

        const transformed = transformOpportunity(data)
        setOpportunities(prev => prev.map(o => o.id === id ? transformed : o))
        return transformed
    }

    const moveOpportunity = async (id: string, newStageId: string) => {
        const opportunity = opportunities.find(o => o.id === id)
        if (!opportunity) return null

        const oldStageId = opportunity.stage_id
        const newStage = stages.find(s => s.id === newStageId)

        // Optimistic update
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
            const oldStage = stages.find(s => s.id === oldStageId)
            setOpportunities(prev => prev.map(o =>
                o.id === id ? { ...o, stage_id: oldStageId, stage: oldStage || null } : o
            ))
            throw error
        }

        // Log stage change
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
        const deletedOpp = opportunities.find(o => o.id === id)
        setOpportunities(prev => prev.filter(o => o.id !== id))

        const { error } = await supabase
            .from('opportunities')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id)

        if (error) {
            if (deletedOpp) {
                setOpportunities(prev => [...prev, deletedOpp])
            }
            throw error
        }
    }

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

    const opportunitiesByStage = stages.reduce((acc, stage) => {
        acc[stage.id] = opportunities.filter(o => o.stage_id === stage.id)
        return acc
    }, {} as Record<string, OpportunityWithRelations[]>)

    // Add function to refresh a single opportunity (useful for detail view)
    const refreshOpportunity = async (id: string) => {
        const { data, error } = await supabase
            .from('opportunities')
            .select(`
                *,
                contact:contacts(id, name, email, phone, company:companies(id, name)),
                company:companies(id, name, phone, address, website),
                product:products(id, name),
                opportunity_products(
                    product:products(id, name, ncm, manufacturer:companies(id, name))
                ),
                stage:pipeline_stages(*)
            `)
            .eq('id', id)
            .single()

        if (!error && data) {
            const transformed = transformOpportunity(data)
            setOpportunities(prev => {
                const index = prev.findIndex(o => o.id === id)
                if (index >= 0) {
                    const newArr = [...prev]
                    newArr[index] = transformed
                    return newArr
                }
                return [...prev, transformed]
            })
            return transformed
        }
        return null
    }

    return {
        opportunities,
        stages,
        opportunitiesByStage,
        loading,
        error,
        setOpportunities,
        refetch: fetchOpportunities,
        refreshOpportunity,
        createOpportunity,
        updateOpportunity,
        moveOpportunity,
        deleteOpportunity,
        reorderOpportunities,
    }
}
