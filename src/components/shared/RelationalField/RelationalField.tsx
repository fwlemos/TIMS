import { useState, useRef, useCallback, ReactNode, useEffect, useMemo } from 'react'
import { clsx } from 'clsx'
import { Plus, Pencil } from 'lucide-react'
import { RelationalDropdown } from './RelationalDropdown'
import { RelationalSelectedCard } from './RelationalSelectedCard'
import { RelationalNestedForm } from './RelationalNestedForm'
import { FloatingFormPanel } from './FloatingFormPanel'
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
    displayMode = 'card',
    onEdit,
    getRecordData,
    forceInlineNested = false,
}: ExtendedRelationalFieldProps) {
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [nestedFormOpen, setNestedFormOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [isSearching, setIsSearching] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)
    const [editingId, setEditingId] = useState<string | null>(null)

    const triggerRef = useRef<HTMLButtonElement>(null)
    const formTriggerRef = useRef<HTMLButtonElement>(null)
    const editTriggerRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
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
        setEditingId(null)
        setNestedFormOpen(true)
        setFormError(null)
    }, [])

    const handleNestedFormSubmit = useCallback(async (data: Record<string, unknown>) => {
        setIsSubmitting(true)
        setFormError(null)

        try {
            if (editingId && onEdit) {
                // Edit mode
                await onEdit(editingId, data)
                await onRefresh()
                setNestedFormOpen(false)
                setEditingId(null)
            } else {
                // Create mode
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
                    setFormError('Failed to create - no ID returned')
                }
            }
        } catch (err: unknown) {
            console.error(editingId ? 'Edit error:' : 'Create error:', err)
            const error = err as { message?: string; code?: string; hint?: string; details?: string }
            const errorMsg = error.message || (editingId ? 'Failed to update' : 'Failed to create')
            const hint = error.hint ? ` (${error.hint})` : ''
            const code = error.code ? ` [${error.code}]` : ''
            setFormError(`${errorMsg}${hint}${code}`)
        } finally {
            setIsSubmitting(false)
        }
    }, [editingId, onEdit, onCreate, onRefresh, onChange, mode, value])

    const handleNestedFormCancel = useCallback(() => {
        setNestedFormOpen(false)
        setFormError(null)
        setEditingId(null)
    }, [])

    const handleEditClick = useCallback((id: string) => {
        if (!getRecordData) return
        const recordData = getRecordData(id)
        if (!recordData) return

        setDropdownOpen(false)
        setEditingId(id)
        setNestedFormOpen(true)
        setFormError(null)
    }, [getRecordData])

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
                displayMode === 'pill' ? (
                    <div className="flex flex-wrap gap-2 mb-2">
                        {selectedIds.map(id => {
                            const record = getRecordDisplay(id)
                            if (!record) return null
                            return (
                                <span
                                    key={id}
                                    className="inline-flex items-center gap-1.5 bg-background border rounded px-2 py-1 text-sm font-medium group"
                                >
                                    {record.primaryText}
                                    {!disabled && canEdit && getRecordData && (
                                        <button
                                            ref={(el) => { if (el) editTriggerRefs.current.set(id, el) }}
                                            type="button"
                                            onClick={() => handleEditClick(id)}
                                            className="text-muted-foreground hover:text-foreground transition-colors"
                                            title="Edit"
                                        >
                                            <span className="sr-only">Edit</span>
                                            <Pencil className="w-3 h-3" />
                                        </button>
                                    )}
                                    {!disabled && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemove(id)}
                                            className="text-muted-foreground hover:text-destructive transition-colors"
                                            title="Remove"
                                        >
                                            <span className="sr-only">Remove</span>
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </span>
                            )
                        })}
                    </div>
                ) : (
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
                                    onEdit={canEdit && getRecordData ? () => handleEditClick(id) : undefined}
                                    canEdit={canEdit && !!getRecordData}
                                    editButtonRef={(el) => { if (el) editTriggerRefs.current.set(id, el) }}
                                />
                            )
                        })}
                    </div>
                )
            )}

            {/* Add Button (Trigger) */}
            {/* Show if single mode and nothing selected, OR if multi mode (always allowed to add more) */}
            {((mode === 'single' && selectedIds.length === 0) || mode === 'multi') && (
                <div className="relative">
                    <button
                        ref={(el) => {
                            if (el) {
                                (triggerRef as React.MutableRefObject<HTMLButtonElement>).current = el
                                    ; (formTriggerRef as React.MutableRefObject<HTMLButtonElement>).current = el
                            }
                        }}
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

            {/* Form: Either Floating Panel or Inline Nested */}
            {forceInlineNested ? (
                // Inline Nested Form (when inside a floating panel already)
                nestedFormOpen && (
                    <RelationalNestedForm
                        entityLabel={entityLabel}
                        formSchema={nestedFormSchema}
                        onSubmit={handleNestedFormSubmit}
                        onCancel={handleNestedFormCancel}
                        isSubmitting={isSubmitting}
                        error={formError}
                        nestedFieldsConfig={nestedFieldsConfig}
                        currentDepth={currentDepth}
                        maxNestingDepth={maxNestingDepth}
                        initialData={editingId && getRecordData ? getRecordData(editingId) : undefined}
                        isEditing={!!editingId}
                        forceInlineNested={true}
                    />
                )
            ) : (
                // Floating Form Panel (default behavior)
                <FloatingFormPanel
                    isOpen={nestedFormOpen}
                    onClose={handleNestedFormCancel}
                    triggerRef={editingId ? { current: editTriggerRefs.current.get(editingId) || null } : formTriggerRef}
                    title={editingId ? `Edit ${entityLabel}` : `New ${entityLabel}`}
                >
                    <RelationalNestedForm
                        entityLabel={entityLabel}
                        formSchema={nestedFormSchema}
                        onSubmit={handleNestedFormSubmit}
                        onCancel={handleNestedFormCancel}
                        isSubmitting={isSubmitting}
                        error={formError}
                        nestedFieldsConfig={nestedFieldsConfig}
                        currentDepth={currentDepth}
                        maxNestingDepth={maxNestingDepth}
                        initialData={editingId && getRecordData ? getRecordData(editingId) : undefined}
                        isEditing={!!editingId}
                        hideHeader
                        hideWrapper
                        forceInlineNested={true}
                    />
                </FloatingFormPanel>
            )}
        </div>
    )
}
