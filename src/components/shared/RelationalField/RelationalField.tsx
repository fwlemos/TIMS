import { useState, useRef, useCallback, ReactNode, useEffect, useMemo } from 'react'
import { clsx } from 'clsx'
import { Plus } from 'lucide-react'
import { RelationalDropdown } from './RelationalDropdown'
import { RelationalSelectedCard } from './RelationalSelectedCard'
import { RelationalNestedForm } from './RelationalNestedForm'
import type { RelationalFieldProps, RelationalOption, NestedFieldsConfig } from './types'

const DEFAULT_MAX_DEPTH = 3
const SEARCH_DEBOUNCE_MS = 300

interface ExtendedRelationalFieldProps extends RelationalFieldProps {
    entityIcon?: ReactNode
    nestedFieldsConfig?: NestedFieldsConfig
}

export function RelationalField({
    entityLabel,
    nestedFormSchema,
    maxNestingDepth = DEFAULT_MAX_DEPTH,
    currentDepth = 0,
    value,
    onChange,
    options,
    onSearch,
    onCreate,
    onRefresh,
    getRecordDisplay,
    canCreate = true,
    canEdit = false,
    placeholder,
    required = false,
    disabled = false,
    nestedFieldsConfig,
    mode = 'single',
}: ExtendedRelationalFieldProps) {
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [nestedFormOpen, setNestedFormOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [isSearching, setIsSearching] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [createError, setCreateError] = useState<string | null>(null)

    const triggerRef = useRef<HTMLButtonElement>(null)
    const searchTimeoutRef = useRef<NodeJS.Timeout>()

    // Normalize value to array for multi-mode consistent handling
    const selectedIds = useMemo(() => {
        if (value === null) return []
        if (Array.isArray(value)) return value
        return [value]
    }, [value])

    // Debounced search
    const handleSearchChange = useCallback((query: string) => {
        setSearchQuery(query)
        setIsSearching(true)

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current)
        }

        searchTimeoutRef.current = setTimeout(() => {
            onSearch(query)
            setIsSearching(false)
        }, SEARCH_DEBOUNCE_MS)
    }, [onSearch])

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current)
            }
        }
    }, [])

    const handleSelect = useCallback((option: RelationalOption) => {
        if (mode === 'multi') {
            const currentIds = Array.isArray(value) ? value : (value ? [value] : [])
            if (!currentIds.includes(option.id)) {
                onChange([...currentIds, option.id])
            }
            // Keep dropdown open for multi-select?
            // Or close it. Usually strict multi-select closes. 
            // Let's close it for now.
            setDropdownOpen(false)
            setSearchQuery('')
        } else {
            onChange(option.id)
            setDropdownOpen(false)
            setSearchQuery('')
        }
    }, [onChange, mode, value])

    const handleRemove = useCallback((idToRemove?: string) => {
        if (mode === 'multi' && idToRemove) {
            const currentIds = Array.isArray(value) ? value : (value ? [value] : [])
            onChange(currentIds.filter(id => id !== idToRemove))
        } else {
            onChange(null)
        }
    }, [onChange, mode, value])

    const handleCreateNew = useCallback(() => {
        setDropdownOpen(false)
        setNestedFormOpen(true)
        setCreateError(null)
    }, [])

    const handleNestedFormSubmit = useCallback(async (data: Record<string, unknown>) => {
        setIsCreating(true)
        setCreateError(null)

        try {
            const newId = await onCreate(data)
            if (newId) {
                await onRefresh()

                if (mode === 'multi') {
                    const currentIds = Array.isArray(value) ? value : (value ? [value] : [])
                    onChange([...currentIds, newId])
                } else {
                    onChange(newId)
                }

                setNestedFormOpen(false)
            } else {
                setCreateError('Failed to create - no ID returned')
            }
        } catch (err: unknown) {
            console.error('Create error:', err)
            // Handle Supabase errors which have code, message, details, hint
            const error = err as { message?: string; code?: string; hint?: string; details?: string }
            const errorMsg = error.message || 'Failed to create'
            const hint = error.hint ? ` (${error.hint})` : ''
            const code = error.code ? ` [${error.code}]` : ''
            setCreateError(`${errorMsg}${hint}${code}`)
        } finally {
            setIsCreating(false)
        }
    }, [onCreate, onRefresh, onChange, mode, value])

    const handleNestedFormCancel = useCallback(() => {
        setNestedFormOpen(false)
        setCreateError(null)
    }, [])

    const handleEdit = useCallback((id?: string) => {
        console.log('Edit:', id)
    }, [])

    // Check if we can nest further
    const canNestDeeper = currentDepth < maxNestingDepth

    // Filter API options to exclude already selected ones (optional but good UX)
    const filteredOptions = useMemo(() => {
        return options.filter(opt => !selectedIds.includes(opt.id))
    }, [options, selectedIds])

    return (
        <div className="space-y-2">
            {/* Selected Items List */}
            {selectedIds.length > 0 && (
                <div className={clsx('flex flex-col gap-2', mode === 'multi' && 'mb-2')}>
                    {selectedIds.map(id => {
                        const record = getRecordDisplay(id)
                        if (!record) return null
                        return (
                            <RelationalSelectedCard
                                key={id}
                                record={record}
                                entityLabel={entityLabel}
                                onRemove={() => handleRemove(id)}
                                onEdit={canEdit ? () => handleEdit(id) : undefined}
                                canEdit={canEdit}
                            />
                        )
                    })}
                </div>
            )}

            {/* Add Button (Trigger) */}
            {/* Show if single mode and nothing selected, OR if multi mode (always allowed to add more) */}
            {((mode === 'single' && selectedIds.length === 0) || mode === 'multi') && !nestedFormOpen && (
                <div className="relative">
                    <button
                        ref={triggerRef}
                        type="button"
                        onClick={() => !disabled && setDropdownOpen(true)}
                        disabled={disabled}
                        className={clsx(
                            'w-full flex items-center gap-2 px-3 py-2.5 text-sm',
                            'border-2 border-dashed border-border rounded-lg',
                            'text-muted-foreground',
                            'transition-colors',
                            !disabled && 'hover:border-primary/50 hover:text-primary hover:bg-accent/50',
                            disabled && 'opacity-50 cursor-not-allowed'
                        )}
                        aria-haspopup="listbox"
                        aria-expanded={dropdownOpen}
                    >
                        <Plus className="w-4 h-4" />
                        {placeholder || `Add ${entityLabel}`}
                        {required && selectedIds.length === 0 && <span className="text-destructive">*</span>}
                    </button>

                    <RelationalDropdown
                        isOpen={dropdownOpen}
                        onClose={() => setDropdownOpen(false)}
                        searchQuery={searchQuery}
                        onSearchChange={handleSearchChange}
                        options={filteredOptions}
                        onSelect={handleSelect}
                        onCreateNew={handleCreateNew}
                        entityLabel={entityLabel}
                        isLoading={isSearching}
                        canCreate={canCreate && canNestDeeper}
                        triggerRef={triggerRef}
                    />
                </div>
            )}

            {/* Nested Form */}
            {nestedFormOpen && (
                <RelationalNestedForm
                    entityLabel={entityLabel}
                    formSchema={nestedFormSchema}
                    onSubmit={handleNestedFormSubmit}
                    onCancel={handleNestedFormCancel}
                    isSubmitting={isCreating}
                    error={createError}
                    nestedFieldsConfig={nestedFieldsConfig}
                    currentDepth={currentDepth}
                    maxNestingDepth={maxNestingDepth}
                />
            )}
        </div>
    )
}
