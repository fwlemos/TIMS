import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { OpportunityActivity, InsertTables, UpdateTables } from '@/lib/database.types'

export function useOpportunityActivities(opportunityId: string | undefined) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const createActivity = useCallback(async (
        activity: Omit<InsertTables<'opportunity_activities'>, 'opportunity_id' | 'created_at' | 'updated_at'>
    ) => {
        if (!opportunityId) return null

        try {
            setLoading(true)
            setError(null)

            const { data, error } = await supabase
                .from('opportunity_activities')
                .insert({
                    ...activity,
                    opportunity_id: opportunityId,
                })
                .select()
                .single()

            if (error) throw error

            return data
        } catch (err) {
            console.error('Error creating activity:', err)
            setError(err instanceof Error ? err.message : 'Failed to create activity')
            return null
        } finally {
            setLoading(false)
        }
    }, [opportunityId])

    const updateActivity = useCallback(async (
        activityId: string,
        updates: Omit<UpdateTables<'opportunity_activities'>, 'id' | 'opportunity_id' | 'created_at' | 'updated_at'>
    ) => {
        try {
            setLoading(true)
            setError(null)

            const { data, error } = await supabase
                .from('opportunity_activities')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', activityId)
                .select()
                .single()

            if (error) throw error

            return data
        } catch (err) {
            console.error('Error updating activity:', err)
            setError(err instanceof Error ? err.message : 'Failed to update activity')
            return null
        } finally {
            setLoading(false)
        }
    }, [])

    const deleteActivity = useCallback(async (activityId: string) => {
        try {
            setLoading(true)
            setError(null)

            // Soft delete or hard delete? Schema has deleted_at, so soft delete.
            const { error } = await supabase
                .from('opportunity_activities')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', activityId)

            if (error) throw error

            return true
        } catch (err) {
            console.error('Error deleting activity:', err)
            setError(err instanceof Error ? err.message : 'Failed to delete activity')
            return false
        } finally {
            setLoading(false)
        }
    }, [])

    return {
        createActivity,
        updateActivity,
        deleteActivity,
        loading,
        error
    }
}
