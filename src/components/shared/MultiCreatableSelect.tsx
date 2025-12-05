import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { clsx } from 'clsx'
import { Search, Plus, X, Loader2, MoreHorizontal } from 'lucide-react'

export interface SelectOption {
    value: string
    label: string
    sublabel?: string
}

interface SelectedItem {
    id: string
    name: string
    email?: string
    phone?: string
}

interface MultiCreatableSelectProps {
    options: SelectOption[]
    value: string[]
    onChange: (value: string[]) => void
    searchPlaceholder?: string
    addLabel?: string
    createLabel?: string
    entityName?: string
    onCreate?: (data: { name: string; email?: string; phone?: string }) => Promise<string | null>
    renderSelected?: (item: SelectedItem) => React.ReactNode
    getItemDetails?: (id: string) => SelectedItem | undefined
    disabled?: boolean
    className?: string
}

export function MultiCreatableSelect({
    options,
    value,
    onChange,
    searchPlaceholder = 'Search...',
    addLabel = 'Add',
    createLabel = 'Create new',
    entityName = 'item',
    onCreate,
    getItemDetails,
    disabled = false,
    className,
}: MultiCreatableSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const [createLoading, setCreateLoading] = useState(false)
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })

    const [createName, setCreateName] = useState('')
    const [createEmail, setCreateEmail] = useState('')
    const [createPhone, setCreatePhone] = useState('')

    const containerRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const createInputRef = useRef<HTMLInputElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const updatePosition = useCallback(() => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect()
            setDropdownPosition({
                top: rect.bottom + 4,
                left: rect.left,
                width: Math.max(rect.width, 320),
            })
        }
    }, [])

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

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isOpen])

    useEffect(() => {
        if (isCreating && createInputRef.current) {
            createInputRef.current.focus()
        }
    }, [isCreating])

    const filteredOptions = options.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase()) && !value.includes(opt.value)
    )

    const selectedItems = value.map(id => {
        if (getItemDetails) {
            return getItemDetails(id)
        }
        const opt = options.find(o => o.value === id)
        return opt ? { id: opt.value, name: opt.label } : { id, name: 'Unknown' }
    }).filter((item): item is SelectedItem => item !== undefined)

    const handleSelect = useCallback((optValue: string) => {
        onChange([...value, optValue])
        setSearch('')
        setIsOpen(false)
    }, [onChange, value])

    const handleRemove = useCallback((id: string) => {
        onChange(value.filter(v => v !== id))
    }, [onChange, value])

    const handleCreate = async () => {
        if (!onCreate || !createName.trim()) return

        setCreateLoading(true)
        try {
            const newId = await onCreate({
                name: createName.trim(),
                email: createEmail.trim() || undefined,
                phone: createPhone.trim() || undefined,
            })
            if (newId) {
                onChange([...value, newId])
                setIsOpen(false)
                setIsCreating(false)
                setCreateName('')
                setCreateEmail('')
                setCreatePhone('')
            }
        } catch (err) {
            console.error('Failed to create:', err)
        } finally {
            setCreateLoading(false)
        }
    }

    const handleOpen = () => {
        if (!disabled) {
            updatePosition()
            setIsOpen(!isOpen)
        }
    }

    const dropdown = isOpen && (
        <div
            ref={dropdownRef}
            style={{
                position: 'fixed',
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width,
                zIndex: 9999,
            }}
            className="bg-card border border-border rounded-xl shadow-soft-lg overflow-hidden animate-fade-in"
        >
            {!isCreating ? (
                <>
                    <div className="p-3 border-b border-border">
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
                        {onCreate && (
                            <button
                                type="button"
                                onClick={() => {
                                    setIsCreating(true)
                                    setCreateName(search)
                                }}
                                className="mt-2 w-full text-left text-sm text-primary hover:bg-accent px-3 py-2 rounded-lg flex items-center gap-2 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                {createLabel} {entityName}
                            </button>
                        )}
                    </div>

                    <div className="max-h-[200px] overflow-y-auto scrollbar-thin">
                        {filteredOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleSelect(option.value)}
                                className="w-full px-4 py-3 text-left hover:bg-accent transition-colors"
                            >
                                <p className="text-sm font-medium">{option.label}</p>
                                {option.sublabel && (
                                    <p className="text-xs text-muted-foreground">{option.sublabel}</p>
                                )}
                            </button>
                        ))}
                        {filteredOptions.length === 0 && (
                            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                                {search ? `No ${entityName}s found` : `No more ${entityName}s to add`}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-medium">New {entityName}</h3>
                        <button
                            type="button"
                            onClick={() => {
                                setIsCreating(false)
                                setCreateName('')
                                setCreateEmail('')
                                setCreatePhone('')
                            }}
                            className="p-1 hover:bg-accent rounded transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium mb-1">{entityName} name *</label>
                            <input
                                ref={createInputRef}
                                type="text"
                                value={createName}
                                onChange={(e) => setCreateName(e.target.value)}
                                placeholder="Enter name..."
                                className="input h-9 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Email</label>
                            <input
                                type="email"
                                value={createEmail}
                                onChange={(e) => setCreateEmail(e.target.value)}
                                placeholder="email@example.com"
                                className="input h-9 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Phone</label>
                            <input
                                type="tel"
                                value={createPhone}
                                onChange={(e) => setCreatePhone(e.target.value)}
                                placeholder="(00) 00000-0000"
                                className="input h-9 text-sm"
                            />
                        </div>
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
                                Add {entityName}
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    )

    return (
        <div ref={containerRef} className={clsx('space-y-3', className)}>
            {selectedItems.length > 0 && (
                <div className="space-y-2">
                    {selectedItems.map((item) => (
                        <div key={item.id} className="card p-3 flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <p className="font-medium">{item.name}</p>
                                {item.email && (
                                    <p className="text-sm text-muted-foreground truncate">{item.email}</p>
                                )}
                                {item.phone && (
                                    <p className="text-sm text-muted-foreground">{item.phone}</p>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => handleRemove(item.id)}
                                className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
                            >
                                <MoreHorizontal className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <button
                ref={triggerRef}
                type="button"
                onClick={handleOpen}
                disabled={disabled}
                className={clsx(
                    'flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors',
                    disabled && 'opacity-50 cursor-not-allowed'
                )}
            >
                <Plus className="w-4 h-4" />
                {addLabel} {entityName}
            </button>

            {createPortal(dropdown, document.body)}
        </div>
    )
}
