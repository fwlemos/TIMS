import { useState, useMemo } from 'react'
import { clsx } from 'clsx'
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import type { OpportunityWithRelations } from '@/hooks/useOpportunities'
import type { PipelineStage } from '@/lib/database.types'

interface ListViewProps {
    opportunities: OpportunityWithRelations[]
    loading: boolean
    onRowClick: (opportunity: OpportunityWithRelations) => void
}

type SortKey = 'title' | 'contact' | 'company' | 'product' | 'stage' | 'lead_origin' | 'created_at'
type SortDirection = 'asc' | 'desc'

export function ListView({ opportunities, loading, onRowClick }: ListViewProps) {
    const [search, setSearch] = useState('')
    const [sortKey, setSortKey] = useState<SortKey>('created_at')
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
    const [currentPage, setCurrentPage] = useState(1)
    const pageSize = 15

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
        } else {
            setSortKey(key)
            setSortDirection('asc')
        }
    }

    const filteredAndSorted = useMemo(() => {
        let result = [...opportunities]

        // Filter by search
        if (search) {
            const searchLower = search.toLowerCase()
            result = result.filter(opp =>
                opp.title.toLowerCase().includes(searchLower) ||
                opp.contact?.name.toLowerCase().includes(searchLower) ||
                opp.company?.name.toLowerCase().includes(searchLower) ||
                opp.product?.name.toLowerCase().includes(searchLower)
            )
        }

        // Sort
        result.sort((a, b) => {
            let aVal: string | number | Date = ''
            let bVal: string | number | Date = ''

            switch (sortKey) {
                case 'title':
                    aVal = a.title.toLowerCase()
                    bVal = b.title.toLowerCase()
                    break
                case 'contact':
                    aVal = a.contact?.name.toLowerCase() || ''
                    bVal = b.contact?.name.toLowerCase() || ''
                    break
                case 'company':
                    aVal = a.company?.name.toLowerCase() || ''
                    bVal = b.company?.name.toLowerCase() || ''
                    break
                case 'product':
                    aVal = a.product?.name.toLowerCase() || ''
                    bVal = b.product?.name.toLowerCase() || ''
                    break
                case 'stage':
                    aVal = a.stage?.order_index || 0
                    bVal = b.stage?.order_index || 0
                    break
                case 'lead_origin':
                    aVal = a.lead_origin || ''
                    bVal = b.lead_origin || ''
                    break
                case 'created_at':
                    aVal = new Date(a.created_at).getTime()
                    bVal = new Date(b.created_at).getTime()
                    break
            }

            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
            return 0
        })

        return result
    }, [opportunities, search, sortKey, sortDirection])

    const totalPages = Math.ceil(filteredAndSorted.length / pageSize)
    const paginatedData = filteredAndSorted.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    )

    const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
        if (sortKey !== columnKey) {
            return <ArrowUpDown className="w-4 h-4 text-muted-foreground opacity-50" />
        }
        return sortDirection === 'asc'
            ? <ArrowUp className="w-4 h-4 text-primary" />
            : <ArrowDown className="w-4 h-4 text-primary" />
    }

    const getStageColor = (stage: PipelineStage | null | undefined) => {
        if (!stage) return 'bg-muted text-muted-foreground'

        const colors = [
            'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
            'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
            'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
            'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        ]
        return colors[stage.order_index] || colors[0]
    }

    if (loading) {
        return (
            <div className="card overflow-hidden">
                <div className="p-4 border-b border-border">
                    <div className="skeleton h-10 w-80" />
                </div>
                <div className="divide-y divide-border">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="p-4 flex gap-4">
                            <div className="skeleton h-4 flex-1" />
                            <div className="skeleton h-4 w-24" />
                            <div className="skeleton h-4 w-24" />
                            <div className="skeleton h-4 w-20" />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="card overflow-hidden">
            <div className="p-4 border-b border-border">
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value)
                            setCurrentPage(1)
                        }}
                        placeholder="Search opportunities..."
                        className="input pl-10"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="px-4 py-3 text-left">
                                <button onClick={() => handleSort('title')} className="flex items-center gap-1 text-sm font-medium hover:text-primary">
                                    Title <SortIcon columnKey="title" />
                                </button>
                            </th>
                            <th className="px-4 py-3 text-left">
                                <button onClick={() => handleSort('contact')} className="flex items-center gap-1 text-sm font-medium hover:text-primary">
                                    Contact <SortIcon columnKey="contact" />
                                </button>
                            </th>
                            <th className="px-4 py-3 text-left">
                                <button onClick={() => handleSort('company')} className="flex items-center gap-1 text-sm font-medium hover:text-primary">
                                    Company <SortIcon columnKey="company" />
                                </button>
                            </th>
                            <th className="px-4 py-3 text-left">
                                <button onClick={() => handleSort('stage')} className="flex items-center gap-1 text-sm font-medium hover:text-primary">
                                    Stage <SortIcon columnKey="stage" />
                                </button>
                            </th>
                            <th className="px-4 py-3 text-left">
                                <button onClick={() => handleSort('lead_origin')} className="flex items-center gap-1 text-sm font-medium hover:text-primary">
                                    Origin <SortIcon columnKey="lead_origin" />
                                </button>
                            </th>
                            <th className="px-4 py-3 text-left">
                                <button onClick={() => handleSort('created_at')} className="flex items-center gap-1 text-sm font-medium hover:text-primary">
                                    Created <SortIcon columnKey="created_at" />
                                </button>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {paginatedData.map((opp) => (
                            <tr key={opp.id} onClick={() => onRowClick(opp)} className="hover:bg-accent/50 cursor-pointer transition-colors">
                                <td className="px-4 py-3 font-medium">{opp.title}</td>
                                <td className="px-4 py-3 text-muted-foreground">{opp.contact?.name || '-'}</td>
                                <td className="px-4 py-3 text-muted-foreground">{opp.company?.name || '-'}</td>
                                <td className="px-4 py-3">
                                    <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', getStageColor(opp.stage))}>
                                        {opp.stage?.name || '-'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground capitalize">{opp.lead_origin?.replace('_', ' ') || '-'}</td>
                                <td className="px-4 py-3 text-muted-foreground">{new Date(opp.created_at).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {paginatedData.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                        {search ? 'No opportunities match your search.' : 'No opportunities found.'}
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredAndSorted.length)} of {filteredAndSorted.length}
                    </p>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="btn-ghost p-2 disabled:opacity-50">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm">Page {currentPage} of {totalPages}</span>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="btn-ghost p-2 disabled:opacity-50">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
