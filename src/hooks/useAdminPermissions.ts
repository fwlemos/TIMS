import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { UserPermission, ResourceType } from '@/lib/database.types'

interface UserWithPermissions {
    id: string
    email: string
    created_at: string
    permissions: Record<ResourceType, UserPermission | null>
}

const RESOURCE_TYPES: ResourceType[] = [
    'contacts',
    'companies',
    'manufacturers',
    'products',
    'opportunities',
    'documents',
    'settings',
    'users',
]

export function useAdminPermissions() {
    const [users, setUsers] = useState<UserWithPermissions[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchUsers = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            // Fetch all users from auth.users via a server function or edge function
            // For now, we'll fetch users who have any permissions set
            const { data: permissions, error: permError } = await supabase
                .from('user_permissions')
                .select('*')
                .order('user_id')

            if (permError) throw permError

            // Group permissions by user_id
            const userMap = new Map<string, Record<ResourceType, UserPermission | null>>()

            permissions?.forEach((perm) => {
                if (!userMap.has(perm.user_id)) {
                    userMap.set(perm.user_id, {} as Record<ResourceType, UserPermission | null>)
                }
                userMap.get(perm.user_id)![perm.resource as ResourceType] = perm
            })

            // Convert to array
            const usersWithPerms: UserWithPermissions[] = Array.from(userMap.entries()).map(
                ([userId, perms]) => ({
                    id: userId,
                    email: `User ${userId.slice(0, 8)}...`, // Placeholder, will need to fetch from auth
                    created_at: new Date().toISOString(),
                    permissions: perms,
                })
            )

            setUsers(usersWithPerms)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch users')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchUsers()
    }, [fetchUsers])

    const updatePermission = async (
        userId: string,
        resource: ResourceType,
        permission: Partial<Pick<UserPermission, 'can_view' | 'can_add' | 'can_edit' | 'can_delete' | 'can_download'>>
    ) => {
        // Check if permission exists
        const existing = users.find((u) => u.id === userId)?.permissions[resource]

        if (existing) {
            // Update existing permission
            const { error } = await supabase
                .from('user_permissions')
                .update(permission)
                .eq('id', existing.id)

            if (error) throw error
        } else {
            // Create new permission
            const { error } = await supabase.from('user_permissions').insert({
                user_id: userId,
                resource,
                ...permission,
            })

            if (error) throw error
        }

        await fetchUsers()
    }

    const setAllPermissions = async (
        userId: string,
        resource: ResourceType,
        enabled: boolean
    ) => {
        await updatePermission(userId, resource, {
            can_view: enabled,
            can_add: enabled,
            can_edit: enabled,
            can_delete: enabled,
            can_download: enabled,
        })
    }



    const addUserById = async (userId: string) => {
        // Create initial permissions (all false) for the user
        const inserts = RESOURCE_TYPES.map((resource) => ({
            user_id: userId,
            resource,
            can_view: false,
            can_add: false,
            can_edit: false,
            can_delete: false,
            can_download: false,
        }))

        const { error } = await supabase.from('user_permissions').insert(inserts)
        if (error) throw error

        await fetchUsers()
    }

    const removeUser = async (userId: string) => {
        const { error } = await supabase
            .from('user_permissions')
            .delete()
            .eq('user_id', userId)

        if (error) throw error
        await fetchUsers()
    }

    return {
        users,
        loading,
        error,
        refetch: fetchUsers,
        updatePermission,
        setAllPermissions,
        addUserById,
        removeUser,
        RESOURCE_TYPES,
    }
}
