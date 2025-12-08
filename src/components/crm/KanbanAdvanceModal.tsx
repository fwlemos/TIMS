import { useState, useEffect } from 'react'
import { X, AlertCircle, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import type { Opportunity, PipelineStage } from '@/lib/database.types'

interface MissingField {
    name: string
    label: string
    type: 'text' | 'select' | 'number' | 'date' | 'textarea'
    options?: { value: string; label: string }[]
    placeholder?: string
}

interface KanbanAdvanceModalProps {
    isOpen: boolean
    onClose: () => void
    onAdvance: (fieldValues: Record<string, unknown>) => Promise<void>
    opportunity: Opportunity | null
    fromStage: PipelineStage | null
    toStage: PipelineStage | null
    missingFields: MissingField[]
}

export function KanbanAdvanceModal({
    isOpen,
    onClose,
    onAdvance,
    opportunity,
    fromStage,
    toStage,
    missingFields,
}: KanbanAdvanceModalProps) {
    const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setFieldValues({})
            setErrors({})
            setIsSubmitting(false)
        }
    }, [isOpen])

    if (!isOpen || !opportunity || !fromStage || !toStage) return null

    const handleFieldChange = (fieldName: string, value: string) => {
        setFieldValues(prev => ({ ...prev, [fieldName]: value }))
        // Clear error when field is edited
        if (errors[fieldName]) {
            setErrors(prev => {
                const next = { ...prev }
                delete next[fieldName]
                return next
            })
        }
    }

    const validateFields = (): boolean => {
        const newErrors: Record<string, string> = {}

        for (const field of missingFields) {
            const value = fieldValues[field.name]
            if (!value || value.trim() === '') {
                newErrors[field.name] = `${field.label} is required`
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async () => {
        if (!validateFields()) return

        setIsSubmitting(true)
        try {
            // Convert values to appropriate types
            const processedValues: Record<string, unknown> = {}
            for (const field of missingFields) {
                const value = fieldValues[field.name]
                if (field.type === 'number') {
                    processedValues[field.name] = value ? parseFloat(value) : null
                } else {
                    processedValues[field.name] = value || null
                }
            }

            await onAdvance(processedValues)
            onClose()
        } catch (error) {
            console.error('Failed to advance stage:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-card rounded-xl shadow-2xl w-full max-w-md border border-border mx-4">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-warning" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">Complete Required Fields</h2>
                            <p className="text-sm text-muted-foreground">
                                Fill in the missing fields to advance to <span className="font-medium">{toStage.name}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                        disabled={isSubmitting}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4">
                    <div className="mb-4 p-3 rounded-lg bg-muted/50">
                        <p className="text-sm">
                            <span className="font-medium">{opportunity.title}</span>
                            <span className="text-muted-foreground"> • Moving from </span>
                            <span className="font-medium">{fromStage.name}</span>
                            <span className="text-muted-foreground"> to </span>
                            <span className="font-medium">{toStage.name}</span>
                        </p>
                    </div>

                    <div className="space-y-4">
                        {missingFields.map(field => (
                            <div key={field.name}>
                                <label className="block text-sm font-medium mb-1.5">
                                    {field.label}
                                    <span className="text-destructive ml-0.5">*</span>
                                </label>

                                {field.type === 'select' && (
                                    <select
                                        value={fieldValues[field.name] || ''}
                                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                        className={clsx(
                                            'input w-full',
                                            errors[field.name] && 'border-destructive focus:ring-destructive'
                                        )}
                                    >
                                        <option value="">{field.placeholder || 'Select...'}</option>
                                        {field.options?.map(opt => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                )}

                                {field.type === 'text' && (
                                    <input
                                        type="text"
                                        value={fieldValues[field.name] || ''}
                                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                        placeholder={field.placeholder}
                                        className={clsx(
                                            'input w-full',
                                            errors[field.name] && 'border-destructive focus:ring-destructive'
                                        )}
                                    />
                                )}

                                {field.type === 'number' && (
                                    <input
                                        type="number"
                                        value={fieldValues[field.name] || ''}
                                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                        placeholder={field.placeholder}
                                        step="0.01"
                                        className={clsx(
                                            'input w-full',
                                            errors[field.name] && 'border-destructive focus:ring-destructive'
                                        )}
                                    />
                                )}

                                {field.type === 'date' && (
                                    <input
                                        type="date"
                                        value={fieldValues[field.name] || ''}
                                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                        className={clsx(
                                            'input w-full',
                                            errors[field.name] && 'border-destructive focus:ring-destructive'
                                        )}
                                    />
                                )}

                                {field.type === 'textarea' && (
                                    <textarea
                                        value={fieldValues[field.name] || ''}
                                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                        placeholder={field.placeholder}
                                        rows={3}
                                        className={clsx(
                                            'input w-full resize-none',
                                            errors[field.name] && 'border-destructive focus:ring-destructive'
                                        )}
                                    />
                                )}

                                {errors[field.name] && (
                                    <p className="text-xs text-destructive mt-1">{errors[field.name]}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="btn-outline"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="btn-primary flex items-center gap-2"
                    >
                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        Save & Advance
                    </button>
                </div>
            </div>
        </div>
    )
}
