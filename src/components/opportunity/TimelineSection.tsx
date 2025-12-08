import { useState, useEffect } from 'react'
import { useOpportunityTimeline, TimelineEvent } from '@/hooks/useOpportunityTimeline'
import { useUsers } from '@/hooks/useUsers'
import {
    History,
    MessageSquare,
    Phone,
    Mail,
    Calendar,
    FileText,
    ArrowRight,
    CheckCircle2,
    User as UserIcon,
    AlertCircle,
    LayoutList
} from 'lucide-react'
import { clsx } from 'clsx'

interface TimelineSectionProps {
    opportunityId: string
    refreshTrigger?: number
}

export function TimelineSection({ opportunityId, refreshTrigger = 0 }: TimelineSectionProps) {
    const { events, loading, refetch } = useOpportunityTimeline(opportunityId)
    const { users } = useUsers()
    const [filter, setFilter] = useState<'all' | 'history' | 'activity'>('all')

    useEffect(() => {
        refetch()
    }, [refreshTrigger, refetch])

    const filteredEvents = events.filter(e => {
        if (filter === 'all') return true
        return e.type === filter
    })

    const getUserName = (userId: string | null) => {
        if (!userId) return 'System'
        const user = users.find(u => u.id === userId)
        return user ? (user.name || user.email || 'Unknown User') : 'Unknown User'
    }

    const getUserInitials = (userId: string | null) => {
        if (!userId) return 'SY'
        const name = getUserName(userId)
        return name.substring(0, 2).toUpperCase()
    }

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getEventIcon = (event: TimelineEvent) => {
        if (event.type === 'activity') {
            switch (event.activityType) {
                case 'call': return <Phone className="w-4 h-4 text-blue-500" />
                case 'email': return <Mail className="w-4 h-4 text-yellow-500" />
                case 'meeting': return <Calendar className="w-4 h-4 text-purple-500" />
                case 'follow_up': return <CheckCircle2 className="w-4 h-4 text-green-500" />
                default: return <MessageSquare className="w-4 h-4 text-gray-500" />
            }
        } else {
            // History
            if (event.action === 'created') return <AlertCircle className="w-4 h-4 text-green-500" />
            if (event.action === 'stage_changed') return <LayoutList className="w-4 h-4 text-orange-500" />
            if (event.fieldName) return <FileText className="w-4 h-4 text-blue-400" />
            return <History className="w-4 h-4 text-gray-400" />
        }
    }

    const renderEventContent = (event: TimelineEvent) => {
        if (event.type === 'activity') {
            return (
                <div className="flex flex-col gap-1">
                    <span className="font-medium text-sm capitalize">
                        {event.activityType?.replace('_', ' ')}
                    </span>
                    {event.description && (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {event.description}
                        </p>
                    )}
                </div>
            )
        } else {
            // History
            if (event.action === 'stage_changed') {
                return (
                    <div className="flex flex-col gap-1">
                        <span className="font-medium text-sm">Stage Changed</span>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{event.oldValue || 'None'}</span>
                            <ArrowRight className="w-3 h-3" />
                            <span className="font-medium text-foreground">{event.newValue}</span>
                        </div>
                    </div>
                )
            }
            if (event.fieldName) {
                return (
                    <div className="flex flex-col gap-1">
                        <span className="font-medium text-sm">Updated {event.fieldName}</span>
                        <div className="text-sm text-muted-foreground">
                            <span className="line-through opacity-70 mr-2">{event.oldValue}</span>
                            <span>{event.newValue}</span>
                        </div>
                    </div>
                )
            }
            if (event.action === 'created') {
                return <span className="font-medium text-sm">Opportunity Created</span>
            }
            return <span className="text-sm">{event.action}</span>
        }
    }

    if (loading && events.length === 0) {
        return <div className="p-4 text-center text-muted-foreground">Loading timeline...</div>
    }

    return (
        <div className="bg-card rounded-xl border border-border flex flex-col h-[600px]">
            <div className="p-4 border-b border-border flex flex-col gap-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Timeline
                </h3>
                <div className="flex bg-muted rounded-lg p-1 w-full">
                    <button
                        onClick={() => setFilter('all')}
                        className={clsx(
                            'flex-1 px-2 py-1 text-xs font-medium rounded-md transition-colors text-center',
                            filter === 'all' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('history')}
                        className={clsx(
                            'flex-1 px-2 py-1 text-xs font-medium rounded-md transition-colors text-center',
                            filter === 'history' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        History
                    </button>
                    <button
                        onClick={() => setFilter('activity')}
                        className={clsx(
                            'flex-1 px-2 py-1 text-xs font-medium rounded-md transition-colors text-center',
                            filter === 'activity' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        Activities
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {filteredEvents.length === 0 ? (
                    <div className="text-center text-muted-foreground py-10">
                        No events found
                    </div>
                ) : (
                    filteredEvents.map((event) => (
                        <div key={event.id} className="relative flex gap-4">
                            {/* Connector Line */}
                            <div className="absolute left-[19px] top-8 bottom-[-24px] w-px bg-border last:hidden" />

                            {/* Avatar/Icon */}
                            <div className="relative z-10 flex-shrink-0">
                                <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center overflow-hidden">
                                    {/* If system action, show icon, otherwise user avatar if available? 
                                        Actually, let's show user avatar with a small badge for the action type
                                     */}
                                    <span className="text-xs font-medium">{getUserInitials(event.userId)}</span>
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background border border-border flex items-center justify-center shadow-sm">
                                    {getEventIcon(event)}
                                </div>
                            </div>

                            <div className="flex-1 pt-1">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-muted-foreground">
                                        {getUserName(event.userId)}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatTime(event.timestamp)}
                                    </span>
                                </div>
                                <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                                    {renderEventContent(event)}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
