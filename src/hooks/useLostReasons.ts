import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type LostReason = Database['public']['Tables']['lost_reasons']['Row']
type InsertLostReason = Database['public']['Tables']['lost_reasons']['Insert']

export function useLostReasons() {
    const [reasons, setReasons] = useState<LostReason[]>([])
    const [loading, setLoading] = useState(true)

    const fetchReasons = useCallback(async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('lost_reasons')
                .select('*')
                .eq('is_active', true)
                .order('reason')

            if (error) throw error
            setReasons(data || [])
        } catch (error) {
            console.error('Error fetching lost reasons:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchReasons()
    }, [fetchReasons])

    const createReason = async (reason: InsertLostReason) => {
        const { data, error } = await supabase
            .from('lost_reasons')
            .insert(reason)
            .select()
            .single()

        if (error) throw error
        setReasons(prev => [...prev, data])
        return data
    }

    return {
        reasons,
        loading,
        fetchReasons,
        createReason
    }
}
