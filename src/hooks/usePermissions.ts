import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { ResourceType, UserPermission } from '@/lib/database.types'

interface Permissions {
    canView: boolean
    canAdd: boolean
    canEdit: boolean
    canDelete: boolean
    canDownload: boolean
}

const DEFAULT_PERMISSIONS: Permissions = {
    canView: false,
    canAdd: false,
    canEdit: false,
    canDelete: false,
    canDownload: false,
}

export function usePermissions() {
    const { user } = useAuth()
    const [permissions, setPermissions] = useState<Record<ResourceType, Permissions>>({} as Record<ResourceType, Permissions>)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) {
            setPermissions({} as Record<ResourceType, Permissions>)
            setLoading(false)
            return
        }

        async function fetchPermissions() {
            const { data, error } = await supabase
                .from('user_permissions')
                .select('*')
                .eq('user_id', user!.id)

            if (error) {
                console.error('Error fetching permissions:', error)
                setLoading(false)
                return
            }

            const permMap: Record<ResourceType, Permissions> = {} as Record<ResourceType, Permissions>

            data?.forEach((perm: UserPermission) => {
                permMap[perm.resource] = {
                    canView: perm.can_view ?? false,
                    canAdd: perm.can_add ?? false,
                    canEdit: perm.can_edit ?? false,
                    canDelete: perm.can_delete ?? false,
                    canDownload: perm.can_download ?? false,
                }
            })

            setPermissions(permMap)
            setLoading(false)
        }

        fetchPermissions()
    }, [user])

    const hasPermission = useCallback(
        (resource: ResourceType, action: keyof Permissions): boolean => {
            // In development, grant all permissions for easier testing
            if (import.meta.env.DEV) return true

            const resourcePerms = permissions[resource]
            if (!resourcePerms) return false
            return resourcePerms[action]
        },
        [permissions]
    )

    const getPermissions = useCallback(
        (resource: ResourceType): Permissions => {
            // In development, grant all permissions for easier testing
            if (import.meta.env.DEV) {
                return {
                    canView: true,
                    canAdd: true,
                    canEdit: true,
                    canDelete: true,
                    canDownload: true,
                }
            }
            return permissions[resource] || DEFAULT_PERMISSIONS
        },
        [permissions]
    )

    return {
        permissions,
        loading,
        hasPermission,
        getPermissions,
    }
}
