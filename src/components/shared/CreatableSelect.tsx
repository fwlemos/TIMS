import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { clsx } from 'clsx'
import { ChevronDown, Search, Plus, X, Check, Loader2 } from 'lucide-react'

export interface SelectOption {
    value: string
    label: string
}

interface CreatableSelectProps {
    options: SelectOption[]
    value: string | null
    onChange: (value: string | null) => void
    placeholder?: string
    emptyLabel?: string
    searchPlaceholder?: string
    createLabel?: string
    onCreate?: (name: string) => Promise<string | null>
    disabled?: boolean
    className?: string
}

export function CreatableSelect({
    options,
    value,
    onChange,
    placeholder = 'Select...',
    emptyLabel = 'None',
    searchPlaceholder = 'Search...',
    createLabel = 'Create new',
    onCreate,
    disabled = false,
    className,
}: CreatableSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const [createName, setCreateName] = useState('')
    const [createLoading, setCreateLoading] = useState(false)
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })

    const containerRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const createInputRef = useRef<HTMLInputElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Calculate dropdown position
    const updatePosition = useCallback(() => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect()
            setDropdownPosition({
                top: rect.bottom + 4,
                left: rect.left,
                width: rect.width,
            })
        }
    }, [])

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node
            if (
                containerRef.current && !containerRef.current.contains(target) &&
                dropdownRef.current && !dropdownRef.current.contains(target)
            ) {
                setIsOpen(false)
                setSearch('')
                setIsCreating(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Update position when opening or on scroll/resize
    useEffect(() => {
        if (isOpen) {
            updatePosition()
            window.addEventListener('scroll', updatePosition, true)
            window.addEventListener('resize', updatePosition)
            return () => {
                window.removeEventListener('scroll', updatePosition, true)
                window.removeEventListener('resize', updatePosition)
            }
        }
    }, [isOpen, updatePosition])

    // Focus search input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isOpen])

    // Focus create input when creating
    useEffect(() => {
        if (isCreating && createInputRef.current) {
            createInputRef.current.focus()
        }
    }, [isCreating])

    const filteredOptions = options.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase())
    )

    const selectedOption = options.find((opt) => opt.value === value)

    const handleSelect = useCallback((optValue: string | null) => {
        onChange(optValue)
        setIsOpen(false)
        setSearch('')
    }, [onChange])

    const handleCreate = async () => {
        if (!onCreate || !createName.trim()) return

        setCreateLoading(true)
        try {
            const newId = await onCreate(createName.trim())
            if (newId) {
                onChange(newId)
                setIsOpen(false)
                setSearch('')
                setIsCreating(false)
                setCreateName('')
            }
        } catch (err) {
            console.error('Failed to create:', err)
        } finally {
            setCreateLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            if (isCreating) {
                setIsCreating(false)
                setCreateName('')
            } else {
                setIsOpen(false)
                setSearch('')
            }
        } else if (e.key === 'Enter' && isCreating) {
            e.preventDefault()
            handleCreate()
        }
    }

    const handleOpen = () => {
        if (!disabled) {
            updatePosition()
            setIsOpen(!isOpen)
        }
    }

    const dropdown = isOpen ? (
        <div
            ref={dropdownRef}
            style={{
                position: 'fixed',
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width,
                zIndex: 9999,
            }}
            className="bg-card border border-border rounded-lg shadow-soft-lg overflow-hidden animate-fade-in"
            onKeyDown={handleKeyDown}
        >
            {/* Search */}
            <div className="p-2 border-b border-border">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="input pl-9 h-9 text-sm"
                    />
                </div>
            </div>

            {/* Options */}
            <div className="max-h-[200px] overflow-y-auto scrollbar-thin">
                {/* Empty option */}
                <button
                    type="button"
                    onClick={() => handleSelect(null)}
                    className={clsx(
                        'w-full px-3 py-2 text-left text-sm flex items-center gap-2',
                        'hover:bg-accent transition-colors',
                        value === null && 'bg-accent'
                    )}
                >
                    {value === null && <Check className="w-4 h-4 text-primary" />}
                    <span className={clsx(value === null ? 'font-medium' : 'text-muted-foreground')}>
                        {emptyLabel}
                    </span>
                </button>

                {/* Filtered options */}
                {filteredOptions.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => handleSelect(option.value)}
                        className={clsx(
                            'w-full px-3 py-2 text-left text-sm flex items-center gap-2',
                            'hover:bg-accent transition-colors',
                            value === option.value && 'bg-accent'
                        )}
                    >
                        {value === option.value && <Check className="w-4 h-4 text-primary" />}
                        <span className={value === option.value ? 'font-medium' : ''}>
                            {option.label}
                        </span>
                    </button>
                ))}

                {/* No results */}
                {filteredOptions.length === 0 && search && (
                    <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                        No results for "{search}"
                    </div>
                )}
            </div>

            {/* Create new */}
            {onCreate && (
                <div className="border-t border-border">
                    {!isCreating ? (
                        <button
                            type="button"
                            onClick={() => {
                                setIsCreating(true)
                                setCreateName(search)
                            }}
                            className="w-full px-3 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-accent transition-colors text-primary"
                        >
                            <Plus className="w-4 h-4" />
                            <span>{createLabel}</span>
                            {search && <span className="text-muted-foreground">"{search}"</span>}
                        </button>
                    ) : (
                        <div className="p-3 space-y-3">
                            <div className="flex items-center gap-2">
                                <input
                                    ref={createInputRef}
                                    type="text"
                                    value={createName}
                                    onChange={(e) => setCreateName(e.target.value)}
                                    placeholder="Enter name..."
                                    className="input h-9 text-sm flex-1"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCreating(false)
                                        setCreateName('')
                                    }}
                                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={handleCreate}
                                disabled={!createName.trim() || createLoading}
                                className="btn-primary w-full h-9 text-sm"
                            >
                                {createLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4" />
                                        Create & Select
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    ) : null

    return (
        <div ref={containerRef} className={clsx('relative', className)}>
            {/* Trigger */}
            <button
                ref={triggerRef}
                type="button"
                onClick={handleOpen}
                disabled={disabled}
                className={clsx(
                    'input flex items-center justify-between gap-2 text-left',
                    disabled && 'opacity-50 cursor-not-allowed',
                    isOpen && 'ring-2 ring-ring ring-offset-2'
                )}
            >
                <span className={selectedOption ? '' : 'text-muted-foreground'}>
                    {selectedOption?.label || placeholder}
                </span>
                <ChevronDown className={clsx(
                    'w-4 h-4 text-muted-foreground transition-transform',
                    isOpen && 'rotate-180'
                )} />
            </button>

            {/* Render dropdown in portal to escape modal overflow */}
            {createPortal(dropdown, document.body)}
        </div>
    )
}
