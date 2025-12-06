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
    // Legacy single product (deprecated, kept for backward compatibility)
    product?: {
        id: string
        name: string
        ncm?: string | null
        manufacturer_id?: string | null
    } | null
    // New: multiple products via junction table
    products?: Array<{
        id: string
        name: string
        ncm?: string | null
        manufacturer_id?: string | null
    }>
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

        // Fetch stages, opportunity with relations, and products from junction table
        const [stagesData, opportunityResult, productsResult] = await Promise.all([
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
                .single(),
            // Fetch products via junction table
            supabase
                .from('opportunity_products')
                .select(`
                    product:products(id, name, ncm, manufacturer_id)
                `)
                .eq('opportunity_id', opportunityId)
        ])

        setStages(stagesData)

        if (opportunityResult.error) {
            setError(opportunityResult.error.message)
            setOpportunity(null)
        } else {
            // Extract products from junction table results
            const products = productsResult.data
                ?.map(row => row.product)
                .filter((p): p is NonNullable<typeof p> => p !== null) || []

            setOpportunity({
                ...opportunityResult.data,
                products,
            })
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

    // Update contact with optimistic update (no full refetch)
    const updateContact = async (contactId: string | null) => {
        if (!opportunityId || !opportunity) return

        // Optimistic update first
        if (contactId === null) {
            // Removing contact
            setOpportunity(prev => prev ? { ...prev, contact_id: null, contact: null } : prev)
        } else {
            // Fetch the contact data for optimistic update
            const { data: contactData } = await supabase
                .from('contacts')
                .select('id, name, email, phone')
                .eq('id', contactId)
                .single()

            setOpportunity(prev => prev ? {
                ...prev,
                contact_id: contactId,
                contact: contactData || null
            } : prev)
        }

        // Then persist to database
        const { error } = await supabase
            .from('opportunities')
            .update({
                contact_id: contactId,
                updated_at: new Date().toISOString()
            })
            .eq('id', opportunityId)

        if (error) {
            console.error('Error updating contact:', error)
            // Revert on error by refetching
            fetchOpportunity()
            throw error
        }
    }

    // Update company with optimistic update (no full refetch)
    const updateCompany = async (companyId: string | null) => {
        if (!opportunityId || !opportunity) return

        // Optimistic update first
        if (companyId === null) {
            // Removing company
            setOpportunity(prev => prev ? { ...prev, company_id: null, company: null } : prev)
        } else {
            // Fetch the company data for optimistic update
            const { data: companyData } = await supabase
                .from('companies')
                .select('id, name, address, phone')
                .eq('id', companyId)
                .single()

            setOpportunity(prev => prev ? {
                ...prev,
                company_id: companyId,
                company: companyData || null
            } : prev)
        }

        // Then persist to database
        const { error } = await supabase
            .from('opportunities')
            .update({
                company_id: companyId,
                updated_at: new Date().toISOString()
            })
            .eq('id', opportunityId)

        if (error) {
            console.error('Error updating company:', error)
            // Revert on error by refetching
            fetchOpportunity()
            throw error
        }
    }

    // Add a product to the opportunity (via junction table) with optimistic update
    const addProduct = async (productId: string) => {
        if (!opportunityId) return

        // First, fetch the product data for optimistic update
        const { data: productData } = await supabase
            .from('products')
            .select('id, name, ncm, manufacturer_id')
            .eq('id', productId)
            .single()

        // Optimistic update
        if (productData) {
            setOpportunity(prev => prev ? {
                ...prev,
                products: [...(prev.products || []), productData]
            } : prev)
        }

        const { error } = await supabase
            .from('opportunity_products')
            .insert({
                opportunity_id: opportunityId,
                product_id: productId,
            })

        if (error) {
            // Unique constraint violation means it's already added
            if (error.code === '23505') {
                console.warn('Product already added to opportunity')
                return
            }
            console.error('Error adding product:', error)
            // Revert optimistic update on error
            setOpportunity(prev => prev ? {
                ...prev,
                products: prev.products?.filter(p => p.id !== productId) || []
            } : prev)
            throw error
        }
    }

    // Remove a product from the opportunity (via junction table)
    const removeProduct = async (productId: string) => {
        if (!opportunityId) return

        const { error } = await supabase
            .from('opportunity_products')
            .delete()
            .eq('opportunity_id', opportunityId)
            .eq('product_id', productId)

        if (error) {
            console.error('Error removing product:', error)
            throw error
        }

        // Optimistic update
        setOpportunity(prev => prev ? {
            ...prev,
            products: prev.products?.filter(p => p.id !== productId) || []
        } : prev)
    }

    // Convenience method to get product IDs
    const getProductIds = useCallback(() => {
        return opportunity?.products?.map(p => p.id) || []
    }, [opportunity?.products])

    return {
        opportunity,
        stages,
        loading,
        error,
        refetch: fetchOpportunity,
        updateOpportunity,
        updateStage,
        updateContact,
        updateCompany,
        addProduct,
        removeProduct,
        getProductIds,
    }
}
