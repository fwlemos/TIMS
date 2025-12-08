import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { UserPermission, ResourceType } from '@/lib/database.types'

export const RESOURCE_TYPES: ResourceType[] = [
    'contacts',
    'companies',
    'manufacturers',
    'products',
    'opportunities',
    'documents',
    'settings',
    'users',
]

// Default to no permissions if not loaded
const NO_PERM = {
    can_view: false,
    can_add: false,
    can_edit: false,
    can_delete: false,
    can_download: false
}

export function useCurrentUserPermissions() {
    const [permissions, setPermissions] = useState<Record<ResourceType, UserPermission | null>>({} as any)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true

        async function fetchPermissions() {
            setLoading(true)
            try {
                // Get current user first
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    if (mounted) setLoading(false)
                    return
                }

                // Fetch permissions from DB
                // RLS ensures we only get our own rows
                const { data, error: fetchError } = await supabase
                    .from('user_permissions')
                    .select('*')

                if (fetchError) throw fetchError

                if (mounted && data) {
                    const permMap = {} as Record<ResourceType, UserPermission>

                    data.forEach(p => {
                        permMap[p.resource as ResourceType] = p
                    })

                    setPermissions(permMap)
                }

            } catch (err) {
                console.error('Failed to fetch user permissions:', err)
                if (mounted) setError(err instanceof Error ? err.message : 'Unknown error')
            } finally {
                if (mounted) setLoading(false)
            }
        }

        fetchPermissions()

        return () => { mounted = false }
    }, [])

    const can = (resource: ResourceType, action: keyof Omit<UserPermission, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'resource' | 'metadata'>) => {
        // If loading, optimistic deny (safest)
        if (loading) return false

        const perm = permissions[resource]
        if (!perm) return false

        return !!perm[action]
    }

    return {
        permissions,
        loading,
        error,
        can
    }
}
