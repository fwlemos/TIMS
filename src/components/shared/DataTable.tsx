import { useState } from 'react'
import { clsx } from 'clsx'
import {
    ChevronUp,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Search,
} from 'lucide-react'

export interface Column<T> {
    key: keyof T | string
    header: string
    sortable?: boolean
    render?: (item: T) => React.ReactNode
    className?: string
}

interface DataTableProps<T> {
    data: T[]
    columns: Column<T>[]
    keyField: keyof T
    onRowClick?: (item: T) => void
    searchable?: boolean
    searchPlaceholder?: string
    emptyMessage?: string
    loading?: boolean
    pageSize?: number
}

export function DataTable<T extends Record<string, unknown>>({
    data,
    columns,
    keyField,
    onRowClick,
    searchable = true,
    searchPlaceholder = 'Search...',
    emptyMessage = 'No data found',
    loading = false,
    pageSize = 10,
}: DataTableProps<T>) {
    const [searchQuery, setSearchQuery] = useState('')
    const [sortKey, setSortKey] = useState<string | null>(null)
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
    const [currentPage, setCurrentPage] = useState(1)

    // Filter data based on search query
    const filteredData = data.filter((item) => {
        if (!searchQuery) return true
        const query = searchQuery.toLowerCase()
        return columns.some((col) => {
            const value = item[col.key as keyof T]
            return String(value || '').toLowerCase().includes(query)
        })
    })

    // Sort data
    const sortedData = [...filteredData].sort((a, b) => {
        if (!sortKey) return 0
        const aVal = a[sortKey as keyof T]
        const bVal = b[sortKey as keyof T]

        if (aVal === bVal) return 0
        if (aVal === null || aVal === undefined) return 1
        if (bVal === null || bVal === undefined) return -1

        const comparison = String(aVal).localeCompare(String(bVal))
        return sortDirection === 'asc' ? comparison : -comparison
    })

    // Paginate
    const totalPages = Math.ceil(sortedData.length / pageSize)
    const paginatedData = sortedData.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    )

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortKey(key)
            setSortDirection('asc')
        }
    }

    return (
        <div className="space-y-4">
            {/* Search */}
            {searchable && (
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value)
                            setCurrentPage(1)
                        }}
                        placeholder={searchPlaceholder}
                        className="input pl-10"
                    />
                </div>
            )}

            {/* Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/50">
                                {columns.map((col) => (
                                    <th
                                        key={String(col.key)}
                                        className={clsx(
                                            'px-4 py-3 text-left text-sm font-medium text-muted-foreground',
                                            col.sortable && 'cursor-pointer select-none hover:text-foreground',
                                            col.className
                                        )}
                                        onClick={() => col.sortable && handleSort(String(col.key))}
                                    >
                                        <div className="flex items-center gap-1">
                                            {col.header}
                                            {col.sortable && sortKey === col.key && (
                                                sortDirection === 'asc' ? (
                                                    <ChevronUp className="w-4 h-4" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4" />
                                                )
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                // Loading skeleton
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="border-b border-border last:border-0">
                                        {columns.map((col) => (
                                            <td key={String(col.key)} className="px-4 py-3">
                                                <div className="skeleton h-5 w-24" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={columns.length}
                                        className="px-4 py-12 text-center text-muted-foreground"
                                    >
                                        {emptyMessage}
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((item) => (
                                    <tr
                                        key={String(item[keyField])}
                                        onClick={() => onRowClick?.(item)}
                                        className={clsx(
                                            'border-b border-border last:border-0',
                                            'transition-colors',
                                            onRowClick && 'cursor-pointer hover:bg-accent/50'
                                        )}
                                    >
                                        {columns.map((col) => (
                                            <td
                                                key={String(col.key)}
                                                className={clsx('px-4 py-3 text-sm', col.className)}
                                            >
                                                {col.render
                                                    ? col.render(item)
                                                    : String(item[col.key as keyof T] ?? '-')}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                        <p className="text-sm text-muted-foreground">
                            Showing {(currentPage - 1) * pageSize + 1} to{' '}
                            {Math.min(currentPage * pageSize, sortedData.length)} of{' '}
                            {sortedData.length} results
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg hover:bg-accent disabled:opacity-50 disabled:pointer-events-none transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="px-3 py-1 text-sm">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg hover:bg-accent disabled:opacity-50 disabled:pointer-events-none transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
