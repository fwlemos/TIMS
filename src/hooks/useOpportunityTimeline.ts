import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { OpportunityHistory, OpportunityActivity } from '@/lib/database.types'

export type TimelineEventType = 'history' | 'activity'

export interface TimelineEvent {
    id: string
    type: TimelineEventType
    timestamp: string
    userId: string | null
    // History specific
    action?: string
    fieldName?: string | null
    oldValue?: string | null
    newValue?: string | null
    metadata?: Record<string, any> | null
    // Activity specific
    activityType?: OpportunityActivity['activity_type']
    description?: string | null
}

export function useOpportunityTimeline(opportunityId: string | undefined) {
    const [events, setEvents] = useState<TimelineEvent[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchTimeline = useCallback(async () => {
        if (!opportunityId) return

        try {
            setLoading(true)
            setError(null)

            // Fetch history
            const { data: historyData, error: historyError } = await supabase
                .from('opportunity_history')
                .select('*')
                .eq('opportunity_id', opportunityId)
                .order('created_at', { ascending: false })

            if (historyError) throw historyError

            // Fetch activities
            const { data: activitiesData, error: activitiesError } = await supabase
                .from('opportunity_activities')
                .select('*')
                .eq('opportunity_id', opportunityId)
                .order('activity_date', { ascending: false })

            if (activitiesError) throw activitiesError

            // Normalize and merge
            const normalizedHistory: TimelineEvent[] = (historyData || []).map(item => ({
                id: item.id,
                type: 'history',
                timestamp: item.created_at,
                userId: item.user_id,
                action: item.action,
                fieldName: item.field_name,
                oldValue: item.old_value,
                newValue: item.new_value,
                metadata: item.metadata as Record<string, any> | null,
            }))

            const normalizedActivities: TimelineEvent[] = (activitiesData || []).map(item => ({
                id: item.id,
                type: 'activity',
                timestamp: item.activity_date, // or created_at if activity_date is future/scheduled? Usually activity_date for display
                userId: item.created_by,
                activityType: item.activity_type,
                description: item.description,
            }))

            // Combine and sort by timestamp desc
            const allEvents = [...normalizedHistory, ...normalizedActivities].sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            )

            setEvents(allEvents)
        } catch (err) {
            console.error('Error fetching timeline:', err)
            setError(err instanceof Error ? err.message : 'Failed to load timeline')
        } finally {
            setLoading(false)
        }
    }, [opportunityId])

    useEffect(() => {
        fetchTimeline()
    }, [fetchTimeline])

    return {
        events,
        loading,
        error,
        refetch: fetchTimeline
    }
}
