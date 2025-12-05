import { useState } from 'react'
import { clsx } from 'clsx'
import {
    Users,
    Plus,
    Trash2,
    Check,
    X,
    Shield,
    Eye,
    PlusCircle,
    Pencil,
    Download,
    Loader2,
    AlertCircle
} from 'lucide-react'
import { Modal } from '@/components/shared/Modal'
import { useAdminPermissions } from '@/hooks/useAdminPermissions'
import type { ResourceType } from '@/lib/database.types'

const PERMISSION_ICONS = {
    can_view: Eye,
    can_add: PlusCircle,
    can_edit: Pencil,
    can_delete: Trash2,
    can_download: Download,
}

const PERMISSION_LABELS = {
    can_view: 'View',
    can_add: 'Add',
    can_edit: 'Edit',
    can_delete: 'Delete',
    can_download: 'Download',
}

const RESOURCE_LABELS: Record<ResourceType, string> = {
    contacts: 'Contacts',
    companies: 'Companies',
    manufacturers: 'Manufacturers',
    products: 'Products',
    opportunities: 'Opportunities',
    documents: 'Documents',
    settings: 'Settings',
    users: 'User Management',
}

export function AdminPermissions() {
    const {
        users,
        loading,
        error,
        updatePermission,
        setAllPermissions,
        addUserById,
        removeUser,
        RESOURCE_TYPES,
    } = useAdminPermissions()

    const [showAddModal, setShowAddModal] = useState(false)
    const [newUserId, setNewUserId] = useState('')
    const [addError, setAddError] = useState<string | null>(null)
    const [addLoading, setAddLoading] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

    const handleAddUser = async () => {
        if (!newUserId.trim()) {
            setAddError('Please enter a user ID')
            return
        }

        setAddLoading(true)
        setAddError(null)

        try {
            await addUserById(newUserId.trim())
            setShowAddModal(false)
            setNewUserId('')
        } catch (err) {
            setAddError(err instanceof Error ? err.message : 'Failed to add user')
        } finally {
            setAddLoading(false)
        }
    }

    const handleDeleteUser = async (userId: string) => {
        try {
            await removeUser(userId)
            setDeleteConfirm(null)
        } catch (err) {
            console.error('Failed to remove user:', err)
        }
    }

    const handleTogglePermission = async (
        userId: string,
        resource: ResourceType,
        permission: keyof typeof PERMISSION_LABELS,
        currentValue: boolean | null
    ) => {
        try {
            await updatePermission(userId, resource, {
                [permission]: !currentValue,
            })
        } catch (err) {
            console.error('Failed to update permission:', err)
        }
    }

    const handleToggleAll = async (
        userId: string,
        resource: ResourceType,
        enable: boolean
    ) => {
        try {
            await setAllPermissions(userId, resource, enable)
        } catch (err) {
            console.error('Failed to update permissions:', err)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="card p-6 text-center">
                <AlertCircle className="w-8 h-8 mx-auto text-destructive mb-2" />
                <p className="text-destructive">{error}</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6 text-primary" />
                    <div>
                        <h2 className="text-lg font-semibold">User Permissions</h2>
                        <p className="text-sm text-muted-foreground">
                            Manage access levels for each user
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary"
                >
                    <Plus className="w-4 h-4" />
                    Add User
                </button>
            </div>

            {/* Users List */}
            {users.length === 0 ? (
                <div className="card p-8 text-center">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">No users configured</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Add users to manage their permissions
                    </p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn-primary mx-auto"
                    >
                        <Plus className="w-4 h-4" />
                        Add First User
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {users.map((user) => (
                        <div key={user.id} className="card overflow-hidden">
                            {/* User Header */}
                            <div className="flex items-center justify-between p-4 bg-muted/30 border-b border-border">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium">
                                        {user.email[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium">{user.email}</p>
                                        <p className="text-xs text-muted-foreground font-mono">
                                            {user.id}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setDeleteConfirm(user.id)}
                                    className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                    title="Remove user"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Permissions Grid */}
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                                                Resource
                                            </th>
                                            {Object.entries(PERMISSION_LABELS).map(([key, label]) => {
                                                const Icon = PERMISSION_ICONS[key as keyof typeof PERMISSION_ICONS]
                                                return (
                                                    <th
                                                        key={key}
                                                        className="px-3 py-3 text-center text-sm font-medium text-muted-foreground"
                                                    >
                                                        <div className="flex flex-col items-center gap-1">
                                                            <Icon className="w-4 h-4" />
                                                            <span className="text-xs">{label}</span>
                                                        </div>
                                                    </th>
                                                )
                                            })}
                                            <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                                                All
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {RESOURCE_TYPES.map((resource) => {
                                            const perms = user.permissions[resource]
                                            const allEnabled = perms &&
                                                perms.can_view &&
                                                perms.can_add &&
                                                perms.can_edit &&
                                                perms.can_delete &&
                                                perms.can_download

                                            return (
                                                <tr
                                                    key={resource}
                                                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                                                >
                                                    <td className="px-4 py-3 text-sm font-medium">
                                                        {RESOURCE_LABELS[resource]}
                                                    </td>
                                                    {Object.keys(PERMISSION_LABELS).map((key) => {
                                                        const permKey = key as keyof typeof PERMISSION_LABELS
                                                        const value = perms?.[permKey] ?? false

                                                        return (
                                                            <td key={key} className="px-3 py-3 text-center">
                                                                <button
                                                                    onClick={() =>
                                                                        handleTogglePermission(
                                                                            user.id,
                                                                            resource,
                                                                            permKey,
                                                                            value
                                                                        )
                                                                    }
                                                                    className={clsx(
                                                                        'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                                                                        value
                                                                            ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                                                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                                                    )}
                                                                >
                                                                    {value ? (
                                                                        <Check className="w-4 h-4" />
                                                                    ) : (
                                                                        <X className="w-4 h-4" />
                                                                    )}
                                                                </button>
                                                            </td>
                                                        )
                                                    })}
                                                    <td className="px-4 py-3 text-center">
                                                        <button
                                                            onClick={() =>
                                                                handleToggleAll(user.id, resource, !allEnabled)
                                                            }
                                                            className={clsx(
                                                                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                                                                allEnabled
                                                                    ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                                                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                                            )}
                                                        >
                                                            {allEnabled ? 'All' : 'None'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add User Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => {
                    setShowAddModal(false)
                    setNewUserId('')
                    setAddError(null)
                }}
                title="Add User"
                size="sm"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5">
                            User ID (UUID)
                        </label>
                        <input
                            type="text"
                            value={newUserId}
                            onChange={(e) => setNewUserId(e.target.value)}
                            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                            className="input font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground mt-1.5">
                            Enter the Supabase Auth user ID. The user must have already signed up.
                        </p>
                    </div>

                    {addError && (
                        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {addError}
                        </div>
                    )}

                    <div className="flex gap-3 justify-end pt-2">
                        <button
                            onClick={() => {
                                setShowAddModal(false)
                                setNewUserId('')
                                setAddError(null)
                            }}
                            className="btn-outline"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddUser}
                            disabled={addLoading}
                            className="btn-primary"
                        >
                            {addLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                'Add User'
                            )}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="Remove User"
                size="sm"
            >
                <div className="space-y-4">
                    <p className="text-muted-foreground">
                        Are you sure you want to remove this user's permissions? This action
                        cannot be undone.
                    </p>
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={() => setDeleteConfirm(null)}
                            className="btn-outline"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => deleteConfirm && handleDeleteUser(deleteConfirm)}
                            className="btn-primary bg-destructive hover:bg-destructive/90"
                        >
                            Remove User
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
