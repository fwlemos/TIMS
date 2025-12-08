import { ReactNode } from 'react'
import { useCurrentUserPermissions } from '@/hooks/useCurrentUserPermissions'
import type { ResourceType } from '@/lib/database.types'

interface PermissionGuardProps {
    resource: ResourceType
    action: 'can_view' | 'can_add' | 'can_edit' | 'can_delete' | 'can_download'
    children: ReactNode
    fallback?: ReactNode
}

export function PermissionGuard({ resource, action, children, fallback = null }: PermissionGuardProps) {
    const { can, loading } = useCurrentUserPermissions()

    if (loading) {
        // While loading, we typically don't show the protected content?
        // Or we show a spinner? For guards, usually we hide.
        // If content is critical, maybe a small spinner, but usually guards are for buttons/tabs.
        return null // Hide while checking
    }

    if (!can(resource, action)) {
        return <>{fallback}</>
    }

    return <>{children}</>
}
