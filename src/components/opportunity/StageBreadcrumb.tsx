import { clsx } from 'clsx'
import { Check, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import type { PipelineStage } from '@/lib/database.types'

interface StageBreadcrumbProps {
    stages: PipelineStage[]
    currentStageId: string | null
    onStageClick?: (stageId: string) => void
    disabled?: boolean
    /** Optional validation function called before advancing to a new stage */
    validateStageAdvance?: (currentStageId: string, targetStageId: string) => { valid: boolean; errors?: string[] }
}

export function StageBreadcrumb({
    stages,
    currentStageId,
    onStageClick,
    disabled = false,
    validateStageAdvance
}: StageBreadcrumbProps) {
    const [validationErrors, setValidationErrors] = useState<string[]>([])

    // Find the index of the current stage
    const currentIndex = stages.findIndex(s => s.id === currentStageId)

    const handleStageClick = (stage: PipelineStage, index: number) => {
        if (disabled || !onStageClick) return

        // Clear previous errors
        setValidationErrors([])

        // Can only click on current stage or previous stages (to go back)
        // Can also click on the immediately next stage to advance
        const isGoingBack = index < currentIndex
        const isAdvancingOne = index === currentIndex + 1
        const isSkippingStages = index > currentIndex + 1

        // Prevent skipping stages (4.15)
        if (isSkippingStages) {
            setValidationErrors(['Cannot skip stages. Advance one stage at a time.'])
            return
        }

        // Allow moving backward without validation (4.16)
        if (isGoingBack) {
            onStageClick(stage.id)
            return
        }

        // Validate before advancing forward (4.13)
        if (isAdvancingOne && validateStageAdvance && currentStageId) {
            const result = validateStageAdvance(currentStageId, stage.id)
            if (!result.valid) {
                setValidationErrors(result.errors || ['Cannot advance to this stage'])
                return
            }
        }

        onStageClick(stage.id)
    }

    return (
        <div className="space-y-2">
            {/* Validation errors display (4.14) */}
            {validationErrors.length > 0 && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <div className="flex items-start gap-2 text-destructive text-sm">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-medium">Cannot advance stage</p>
                            <ul className="mt-1 space-y-0.5 text-xs">
                                {validationErrors.map((err, i) => (
                                    <li key={i}>• {err}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hide">
                {stages.map((stage, index) => {
                    const isCompleted = index < currentIndex
                    const isCurrent = stage.id === currentStageId
                    const isFuture = index > currentIndex
                    const isNextStage = index === currentIndex + 1
                    const isClickable = !disabled && onStageClick && (index <= currentIndex + 1)

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
                                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                                    'border-2 min-w-fit justify-center whitespace-nowrap',
                                    {
                                        // Completed stages
                                        'bg-success/10 border-success text-success': isCompleted && !isTerminalStage,
                                        // Current stage
                                        'bg-primary/10 border-primary text-primary shadow-md': isCurrent && !isTerminalStage,
                                        // Won stage (current)
                                        'bg-success/20 border-success text-success shadow-md': isCurrent && isWonStage,
                                        // Next stage (can advance)
                                        'bg-muted/50 border-primary/30 text-muted-foreground hover:border-primary hover:text-primary': isFuture && isNextStage && !disabled,
                                        // Future stages (can't click)
                                        'bg-muted/30 border-muted-foreground/20 text-muted-foreground': isFuture && !isNextStage,
                                        // Clickable states
                                        'cursor-pointer hover:shadow-soft': isClickable,
                                        'cursor-not-allowed opacity-60': !isClickable && isFuture && !isNextStage,
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
        </div>
    )
}
