import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { clsx } from 'clsx'
import { Search, User, Building2, Package, Loader2, X } from 'lucide-react'
import { useGlobalSearch } from '@/hooks/useGlobalSearch'

export function GlobalSearch() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const {
        query,
        setQuery,
        results,
        isSearching,
        hasSearched,
        totalResults,
        clearSearch,
    } = useGlobalSearch()

    const [isOpen, setIsOpen] = useState(false)
    const [highlightedIndex, setHighlightedIndex] = useState(-1)
    const inputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Build flat list of all results for keyboard navigation
    const flatResults = [
        ...results.contacts.map(c => ({ type: 'contact' as const, id: c.id, item: c })),
        ...results.companies.map(c => ({ type: 'company' as const, id: c.id, item: c })),
        ...results.products.map(p => ({ type: 'product' as const, id: p.id, item: p })),
    ]

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Open dropdown when typing
    useEffect(() => {
        if (query.length >= 2) {
            setIsOpen(true)
            setHighlightedIndex(-1)
        }
    }, [query])

    const handleNavigate = useCallback((type: string, _id: string) => {
        // Navigate to the appropriate entity - for now, go to Database with pre-selected tab
        // In a full implementation, this would go to a detail view
        switch (type) {
            case 'contact':
                navigate('/database?tab=contacts')
                break
            case 'company':
                navigate('/database?tab=companies')
                break
            case 'product':
                navigate('/database?tab=products')
                break
        }
        clearSearch()
        setIsOpen(false)
    }, [navigate, clearSearch])

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (!isOpen) return

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                setHighlightedIndex(prev =>
                    prev < flatResults.length - 1 ? prev + 1 : prev
                )
                break
            case 'ArrowUp':
                e.preventDefault()
                setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1)
                break
            case 'Enter':
                e.preventDefault()
                if (highlightedIndex >= 0 && flatResults[highlightedIndex]) {
                    const result = flatResults[highlightedIndex]
                    handleNavigate(result.type, result.id)
                }
                break
            case 'Escape':
                setIsOpen(false)
                inputRef.current?.blur()
                break
        }
    }, [isOpen, highlightedIndex, flatResults, handleNavigate])

    const renderResultSection = (
        title: string,
        icon: React.ReactNode,
        items: { id: string; name: string; secondary?: string }[],
        type: 'contact' | 'company' | 'product',
        startIndex: number
    ) => {
        if (items.length === 0) return null

        return (
            <div className="py-2">
                <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-2">
                    {icon}
                    {title}
                </div>
                {items.map((item, idx) => {
                    const globalIndex = startIndex + idx
                    return (
                        <button
                            key={item.id}
                            onClick={() => handleNavigate(type, item.id)}
                            className={clsx(
                                'w-full px-3 py-2 text-left text-sm flex items-center gap-3',
                                'transition-colors',
                                highlightedIndex === globalIndex
                                    ? 'bg-accent'
                                    : 'hover:bg-accent/50'
                            )}
                        >
                            <span className="font-medium truncate">{item.name}</span>
                            {item.secondary && (
                                <span className="text-muted-foreground text-xs truncate">
                                    {item.secondary}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>
        )
    }

    const contactItems = results.contacts.map(c => ({
        id: c.id,
        name: c.name,
        secondary: c.company?.name || c.email || undefined,
    }))

    const companyItems = results.companies.map(c => ({
        id: c.id,
        name: c.name,
        secondary: c.tax_id || undefined,
    }))

    const productItems = results.products.map(p => ({
        id: p.id,
        name: p.name,
        secondary: p.manufacturer?.name || p.ncm || undefined,
    }))

    return (
        <div ref={containerRef} className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query.length >= 2 && setIsOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder={t('search.placeholder')}
                className="input pl-10 pr-10 h-10 w-full"
            />
            {query && (
                <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded"
                >
                    <X className="w-4 h-4 text-muted-foreground" />
                </button>
            )}

            {/* Dropdown */}
            {isOpen && (query.length >= 2) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-soft-lg z-50 overflow-hidden max-h-80 overflow-y-auto">
                    {isSearching ? (
                        <div className="flex items-center justify-center py-8 text-muted-foreground">
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            {t('search.searching')}
                        </div>
                    ) : hasSearched && totalResults === 0 ? (
                        <div className="py-8 text-center text-muted-foreground text-sm">
                            {t('search.noResults')} "{query}"
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {renderResultSection(
                                t('database.contacts'),
                                <User className="w-3.5 h-3.5" />,
                                contactItems,
                                'contact',
                                0
                            )}
                            {renderResultSection(
                                t('database.companies'),
                                <Building2 className="w-3.5 h-3.5" />,
                                companyItems,
                                'company',
                                results.contacts.length
                            )}
                            {renderResultSection(
                                t('database.products'),
                                <Package className="w-3.5 h-3.5" />,
                                productItems,
                                'product',
                                results.contacts.length + results.companies.length
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
