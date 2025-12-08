import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, User, XCircle, Loader2, Check } from 'lucide-react'
import { StageBreadcrumb } from '@/components/opportunity'
import type { OpportunityWithRelations, Stage } from '../../../types'

interface OpportunityHeaderProps {
    opportunity: OpportunityWithRelations
    stages: Stage[]
    savingField: string | null
    savedField: string | null
    onFieldChange: (fieldName: string, value: unknown) => Promise<void>
    onStageChange: (stageId: string) => Promise<void>
    validateStageAdvance: (current: string, target: string) => { valid: boolean; errors?: string[] }
    onMarkAsLost: () => void
    isTerminal: boolean
    isLost: boolean
    isWon: boolean
}

export function OpportunityHeader({
    opportunity,
    stages,
    savingField,
    savedField,
    onFieldChange,
    onStageChange,
    validateStageAdvance,
    onMarkAsLost,
    isTerminal,
    isLost,
    isWon
}: OpportunityHeaderProps) {
    const navigate = useNavigate()

    const getDaysOpen = () => {
        if (!opportunity) return 0
        const created = new Date(opportunity.created_at)
        const now = new Date()
        const diffTime = Math.abs(now.getTime() - created.getTime())
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    const FieldIndicator = ({ field }: { field: string }) => {
        if (savingField === field) {
            return <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
        }
        if (savedField === field) {
            return <Check className="w-3 h-3 text-success" />
        }
        return null
    }

    return (
        <div className="flex items-center justify-between gap-6 p-4 bg-card border border-border rounded-xl shadow-sm flex-shrink-0">
            {/* Left Section: Back Button + Title Block */}
            <div className="flex items-center gap-4 flex-shrink-0 min-w-[280px]">
                <button
                    onClick={() => navigate('/crm')}
                    className="p-2 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
                    aria-label="Back to CRM"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="min-w-0">
                    {/* Editable title */}
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            defaultValue={opportunity.title}
                            onBlur={(e) => {
                                if (e.target.value !== opportunity.title) {
                                    onFieldChange('title', e.target.value)
                                }
                            }}
                            className="text-xl font-semibold bg-transparent border-b border-transparent hover:border-muted-foreground/30 focus:border-primary focus:outline-none transition-colors w-full"
                            disabled={isTerminal}
                        />
                        <FieldIndicator field="title" />
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {getDaysOpen()} days open
                        </span>
                        <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {opportunity.assigned_to ? 'Assigned' : 'Unassigned'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Center Section: Breadcrumb */}
            <div className="flex-1 overflow-x-auto flex justify-center px-2 no-scrollbar">
                <StageBreadcrumb
                    stages={stages}
                    currentStageId={opportunity.stage_id}
                    onStageClick={onStageChange}
                    validateStageAdvance={validateStageAdvance}
                    disabled={isTerminal}
                />
            </div>

            {/* Right Section: Actions */}
            <div className="flex items-center gap-3 flex-shrink-0">
                {!isTerminal && (
                    <button
                        onClick={onMarkAsLost}
                        className="btn-outline flex items-center gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 whitespace-nowrap"
                    >
                        <XCircle className="w-4 h-4" />
                        Mark as Lost
                    </button>
                )}
                {isLost && (
                    <span className="px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-sm font-medium whitespace-nowrap">
                        Lost: {opportunity.lost_reason || 'No reason specified'}
                    </span>
                )}
                {isWon && (
                    <span className="px-3 py-1.5 rounded-lg bg-success/10 text-success text-sm font-medium whitespace-nowrap">
                        Won
                    </span>
                )}
            </div>
        </div>
    )
}
