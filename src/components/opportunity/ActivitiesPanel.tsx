import { useState } from 'react'
import { useOpportunityActivities } from '@/hooks/useOpportunityActivities'
import { Calendar as CalendarIcon, Phone, Mail, MessageSquare, Clock, Plus } from 'lucide-react'
import { clsx } from 'clsx'

interface ActivitiesPanelProps {
    opportunityId: string
    onActivityAdded?: () => void
}

type ActivityType = 'follow_up' | 'call' | 'email' | 'meeting'

export function ActivitiesPanel({ opportunityId, onActivityAdded }: ActivitiesPanelProps) {
    const { createActivity, loading } = useOpportunityActivities(opportunityId)
    const [isExpanded, setIsExpanded] = useState(false)
    const [selectedType, setSelectedType] = useState<ActivityType>('follow_up')
    const [description, setDescription] = useState('')
    const [date, setDate] = useState('') // Native date-time input uses string

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!description.trim()) return

        const activityDate = date ? new Date(date).toISOString() : new Date().toISOString()

        const result = await createActivity({
            activity_type: selectedType,
            description,
            activity_date: activityDate
        })

        if (result) {
            setDescription('')
            setDate('')
            setIsExpanded(false)
            onActivityAdded?.()
        }
    }

    const typeOptions: { value: ActivityType; label: string; icon: React.ReactNode }[] = [
        { value: 'follow_up', label: 'Follow Up', icon: <Clock className="w-4 h-4" /> },
        { value: 'call', label: 'Call', icon: <Phone className="w-4 h-4" /> },
        { value: 'email', label: 'Email', icon: <Mail className="w-4 h-4" /> },
        { value: 'meeting', label: 'Meeting', icon: <CalendarIcon className="w-4 h-4" /> },
    ]

    return (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
            {!isExpanded ? (
                <button
                    onClick={() => setIsExpanded(true)}
                    className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                >
                    <span className="flex items-center gap-2 font-medium">
                        <Plus className="w-4 h-4" />
                        Log Activity
                    </span>
                    <div className="flex gap-2">
                        {typeOptions.map(opt => (
                            <div key={opt.value} className="p-1.5 rounded-full bg-muted border border-border text-muted-foreground" title={opt.label}>
                                {opt.icon}
                            </div>
                        ))}
                    </div>
                </button>
            ) : (
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-sm">Log Activity</h3>
                        <button
                            type="button"
                            onClick={() => setIsExpanded(false)}
                            className="text-xs text-muted-foreground hover:text-foreground"
                        >
                            Cancel
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Type Selection */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Type</label>
                            <div className="flex gap-1 bg-muted p-1 rounded-lg">
                                {typeOptions.map(option => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setSelectedType(option.value)}
                                        className={clsx(
                                            'flex-1 flex items-center justify-center p-2 rounded-md transition-all',
                                            selectedType === option.value
                                                ? 'bg-background shadow-sm text-foreground'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                                        )}
                                        title={option.label}
                                    >
                                        {option.icon}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Date Picker */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Date & Time</label>
                            <input
                                type="datetime-local"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe the activity..."
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
                            required
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
                        >
                            {loading ? 'Saving...' : 'Log Activity'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    )
}
