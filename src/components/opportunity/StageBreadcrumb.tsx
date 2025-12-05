import { clsx } from 'clsx'
import { Check } from 'lucide-react'
import type { PipelineStage } from '@/lib/database.types'

interface StageBreadcrumbProps {
    stages: PipelineStage[]
    currentStageId: string | null
    onStageClick?: (stageId: string) => void
    disabled?: boolean
}

export function StageBreadcrumb({
    stages,
    currentStageId,
    onStageClick,
    disabled = false
}: StageBreadcrumbProps) {
    // Find the index of the current stage
    const currentIndex = stages.findIndex(s => s.id === currentStageId)

    const handleStageClick = (stage: PipelineStage, index: number) => {
        if (disabled || !onStageClick) return

        // Can only click on current stage or previous stages (to go back)
        // Can also click on the immediately next stage to advance
        if (index <= currentIndex + 1) {
            onStageClick(stage.id)
        }
    }

    return (
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {stages.map((stage, index) => {
                const isCompleted = index < currentIndex
                const isCurrent = stage.id === currentStageId
                const isFuture = index > currentIndex
                const isClickable = !disabled && onStageClick && index <= currentIndex + 1

                // Special handling for Lost stage - show differently
                const isLostStage = stage.name.toLowerCase().includes('lost')
                const isWonStage = stage.name.toLowerCase().includes('won')
                const isTerminalStage = isLostStage || isWonStage

                // Don't show Lost in the breadcrumb progression
                if (isLostStage) return null

                return (
                    <div key={stage.id} className="flex items-center">
                        {/* Stage button */}
                        <button
                            onClick={() => handleStageClick(stage, index)}
                            disabled={!isClickable}
                            className={clsx(
                                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                                'border-2 min-w-[120px] justify-center',
                                {
                                    // Completed stages
                                    'bg-success/10 border-success text-success': isCompleted && !isTerminalStage,
                                    // Current stage
                                    'bg-primary/10 border-primary text-primary shadow-md': isCurrent && !isTerminalStage,
                                    // Won stage (current)
                                    'bg-success/20 border-success text-success shadow-md': isCurrent && isWonStage,
                                    // Future stages
                                    'bg-muted/30 border-muted-foreground/20 text-muted-foreground': isFuture,
                                    // Clickable states
                                    'cursor-pointer hover:shadow-soft': isClickable,
                                    'cursor-not-allowed opacity-60': !isClickable && isFuture,
                                }
                            )}
                            style={isCurrent && !isTerminalStage ? {
                                borderColor: stage.color || undefined,
                                color: stage.color || undefined,
                                backgroundColor: stage.color ? `${stage.color}15` : undefined,
                            } : isCompleted ? {
                                borderColor: stage.color || undefined,
                            } : undefined}
                        >
                            {isCompleted && (
                                <Check className="w-4 h-4 flex-shrink-0" />
                            )}
                            <span className="truncate">{stage.name}</span>
                        </button>

                        {/* Connector arrow (except for last item) */}
                        {index < stages.filter(s => !s.name.toLowerCase().includes('lost')).length - 1 && (
                            <div
                                className={clsx(
                                    'w-6 h-0.5 mx-1',
                                    isCompleted ? 'bg-success' : 'bg-muted-foreground/20'
                                )}
                            />
                        )}
                    </div>
                )
            })}
        </div>
    )
}
