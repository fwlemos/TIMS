import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react'
import { clsx } from 'clsx'
import { Search, Loader2 } from 'lucide-react'
import type { RelationalOption } from './types'

interface RelationalDropdownProps {
    isOpen: boolean
    onClose: () => void
    searchQuery: string
    onSearchChange: (query: string) => void
    options: RelationalOption[]
    onSelect: (option: RelationalOption) => void
    onCreateNew: () => void
    entityLabel: string
    isLoading?: boolean
    canCreate?: boolean
    triggerRef: React.RefObject<HTMLElement>
}

export function RelationalDropdown({
    isOpen,
    onClose,
    searchQuery,
    onSearchChange,
    options,
    onSelect,
    onCreateNew,
    entityLabel,
    isLoading = false,
    canCreate = true,
    triggerRef,
}: RelationalDropdownProps) {
    const [highlightedIndex, setHighlightedIndex] = useState(-1)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const listRef = useRef<HTMLDivElement>(null)

    // Focus input when dropdown opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus()
            setHighlightedIndex(-1)
        }
    }, [isOpen])

    // Close on click outside
    useEffect(() => {
        if (!isOpen) return

        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node
            if (
                dropdownRef.current && !dropdownRef.current.contains(target) &&
                triggerRef.current && !triggerRef.current.contains(target)
            ) {
                onClose()
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen, onClose, triggerRef])

    // Keyboard navigation
    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
        const totalItems = options.length + (canCreate ? 1 : 0) // +1 for "Create New" option

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                setHighlightedIndex(prev =>
                    prev < totalItems - 1 ? prev + 1 : 0
                )
                break
            case 'ArrowUp':
                e.preventDefault()
                setHighlightedIndex(prev =>
                    prev > 0 ? prev - 1 : totalItems - 1
                )
                break
            case 'Enter':
                e.preventDefault()
                if (highlightedIndex === -1 && canCreate) {
                    onCreateNew()
                } else if (highlightedIndex >= 0 && highlightedIndex < options.length) {
                    onSelect(options[highlightedIndex])
                } else if (highlightedIndex === options.length && canCreate) {
                    onCreateNew()
                }
                break
            case 'Escape':
                e.preventDefault()
                onClose()
                break
        }
    }, [options, highlightedIndex, canCreate, onSelect, onCreateNew, onClose])

    // Scroll highlighted item into view
    useEffect(() => {
        if (highlightedIndex >= 0 && listRef.current) {
            const items = listRef.current.querySelectorAll('[data-option-index]')
            const item = items[highlightedIndex] as HTMLElement
            if (item) {
                item.scrollIntoView({ block: 'nearest' })
            }
        }
    }, [highlightedIndex])

    if (!isOpen) return null

    return (
        <div
            ref={dropdownRef}
            className={clsx(
                'absolute left-0 right-0 top-full mt-1 z-50',
                'bg-card border border-border rounded-lg shadow-soft-lg',
                'animate-fade-in overflow-hidden'
            )}
            role="listbox"
            aria-label={`Select ${entityLabel}`}
        >
            {/* Search Input */}
            <div className="p-3 border-b border-border">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={`Search ${entityLabel.toLowerCase()}s...`}
                        className="input pl-9 h-9 text-sm"
                        role="combobox"
                        aria-expanded={isOpen}
                        aria-haspopup="listbox"
                        aria-autocomplete="list"
                    />
                    {isLoading && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                    )}
                </div>
            </div>

            {/* Results List */}
            <div ref={listRef} className="max-h-[220px] overflow-y-auto scrollbar-thin">
                {options.length > 0 ? (
                    options.map((option, index) => (
                        <button
                            key={option.id}
                            type="button"
                            data-option-index={index}
                            onClick={() => onSelect(option)}
                            className={clsx(
                                'w-full px-4 py-2.5 text-left transition-colors',
                                highlightedIndex === index
                                    ? 'bg-accent'
                                    : 'hover:bg-accent/50'
                            )}
                            role="option"
                            aria-selected={highlightedIndex === index}
                        >
                            <div className="text-sm font-medium">{option.primaryText}</div>
                            {option.secondaryText && (
                                <div className="text-xs text-muted-foreground">{option.secondaryText}</div>
                            )}
                        </button>
                    ))
                ) : !isLoading ? (
                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                        No {entityLabel.toLowerCase()}s found
                    </div>
                ) : null}
            </div>

            {/* Create New Button */}
            {canCreate && (
                <div className="border-t border-border p-2">
                    <button
                        type="button"
                        data-option-index={options.length}
                        onClick={onCreateNew}
                        className={clsx(
                            'w-full px-3 py-2 text-left text-sm font-medium text-primary',
                            'rounded-md transition-colors',
                            highlightedIndex === options.length
                                ? 'bg-primary/10'
                                : 'hover:bg-accent'
                        )}
                        role="option"
                        aria-selected={highlightedIndex === options.length}
                    >
                        + Add {entityLabel}
                    </button>
                </div>
            )}
        </div>
    )
}
