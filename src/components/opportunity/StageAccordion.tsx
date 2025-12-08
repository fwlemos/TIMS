import { useState, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react'
import { clsx } from 'clsx'
import { ChevronDown, Check, Clock, Loader2, AlertCircle, Upload, FileText } from 'lucide-react'
import type { PipelineStage, Opportunity } from '@/lib/database.types'

import { STAGE_FIELDS, StageField, StageFieldsConfig } from '@/constants/pipelines'

interface StageAccordionProps {
    opportunity: Opportunity & {
        contact?: { id: string; name: string } | null
        company?: { id: string; name: string } | null
        product?: { id: string; name: string } | null
        products?: Array<{ id: string; name: string; manufacturer?: { name: string } | null }>
    }
    stages: PipelineStage[]
    currentStageId: string | null
    onFieldChange?: (fieldName: string, value: unknown) => Promise<void>
    disabled?: boolean
    savingField?: string | null
    savedField?: string | null
    onExpandChange?: (allExpanded: boolean, expandedCount: number) => void
    // Contact selection
    contacts?: Array<{ id: string; name: string; email?: string | null; company?: { name: string } | null }>
    onContactChange?: (contactId: string | null) => Promise<void>
    // Products selection
    availableProducts?: Array<{ id: string; name: string; manufacturer?: { name: string } | null }>
    onProductsChange?: (productIds: string[]) => Promise<void>
}

export interface StageAccordionHandle {
    toggleAll: () => void
    allExpanded: boolean
}

export const StageAccordion = forwardRef<StageAccordionHandle, StageAccordionProps>(function StageAccordion({
    opportunity,
    stages,
    currentStageId,
    onFieldChange,
    disabled = false,
    savingField,
    savedField,
    onExpandChange,
    contacts = [],
    onContactChange,
    availableProducts = [],
    onProductsChange,
}, ref) {
    // Track which sections are expanded (current stage is expanded by default)
    const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
        return new Set(currentStageId ? [currentStageId] : [])
    })

    // Get current stage index
    const currentStageIndex = stages.findIndex(s => s.id === currentStageId)

    // Keep stages in pipeline order (just filter out Lost)
    const orderedStages = useMemo(() => {
        return stages.filter(s => !s.name.toLowerCase().includes('lost'))
    }, [stages])

    // Get stage key for matching config
    const getStageKey = (stage: PipelineStage): string => {
        return stage.name.toLowerCase().replace(/\s+/g, '_')
    }

    // Get fields config for a stage
    const getStageFieldsConfig = (stage: PipelineStage): StageFieldsConfig | undefined => {
        const key = getStageKey(stage)
        return STAGE_FIELDS.find(sf => sf.stageKey === key)
    }

    // Check stage status relative to current
    const getStageStatus = (stage: PipelineStage): 'current' | 'completed' | 'upcoming' => {
        const stageIndex = stages.findIndex(s => s.id === stage.id)
        if (stageIndex < currentStageIndex) return 'completed'
        if (stageIndex === currentStageIndex) return 'current'
        return 'upcoming'
    }

    // Toggle section expansion
    const toggleSection = (stageId: string) => {
        setExpandedSections(prev => {
            const next = new Set(prev)
            if (next.has(stageId)) {
                next.delete(stageId)
            } else {
                next.add(stageId)
            }
            return next
        })
    }

    // Expand/collapse all
    const allExpanded = orderedStages.every(s => expandedSections.has(s.id))

    const toggleAll = () => {
        if (allExpanded) {
            setExpandedSections(new Set())
        } else {
            setExpandedSections(new Set(orderedStages.map(s => s.id)))
        }
    }

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
        toggleAll,
        allExpanded,
    }), [allExpanded, orderedStages])

    // Notify parent of expand state changes
    useMemo(() => {
        onExpandChange?.(allExpanded, expandedSections.size)
    }, [allExpanded, expandedSections.size, onExpandChange])

    // Get display value for a field
    const getFieldDisplayValue = useCallback((field: StageField): string => {
        const value = field.getValue(opportunity)
        if (!value) return '—'

        if (field.name === 'contact' && opportunity.contact) {
            return opportunity.contact.name
        }
        if (field.name === 'product') {
            if (opportunity.products && opportunity.products.length > 0) {
                return opportunity.products.map(p => p.name).join(', ')
            }
            if (opportunity.product) {
                return opportunity.product.name
            }
        }
        if (field.name === 'lead_origin') {
            return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        }

        return String(value)
    }, [opportunity])

    // Check if all required fields in a stage are filled
    const isStageComplete = useCallback((stage: PipelineStage): boolean => {
        const config = getStageFieldsConfig(stage)
        if (!config) return true

        return config.fields
            .filter(f => f.required)
            .every(f => {
                const value = f.getValue(opportunity)
                return value !== null && value !== undefined && value !== ''
            })
    }, [opportunity])

    // Field indicator for save status
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
        <div className="space-y-3">
            {orderedStages.map(stage => {
                const isExpanded = expandedSections.has(stage.id)
                const status = getStageStatus(stage)
                const config = getStageFieldsConfig(stage)
                const stageComplete = isStageComplete(stage)

                return (
                    <div
                        key={stage.id}
                        className={clsx(
                            'rounded-xl border overflow-hidden transition-all duration-200',
                            status === 'current' && 'border-primary shadow-md',
                            status === 'completed' && 'border-success/40 bg-success/5',
                            status === 'upcoming' && 'border-border'
                        )}
                    >
                        {/* Accordion Header */}
                        <button
                            onClick={() => toggleSection(stage.id)}
                            className={clsx(
                                'w-full px-4 py-3 flex items-center gap-3 text-left transition-colors',
                                status === 'current' && 'bg-primary/5',
                                status === 'completed' && 'bg-success/5',
                                'hover:bg-muted/50'
                            )}
                        >
                            {/* Status indicator */}
                            <div
                                className={clsx(
                                    'w-3 h-3 rounded-full flex-shrink-0',
                                    status === 'current' && 'bg-primary',
                                    status === 'completed' && 'bg-success',
                                    status === 'upcoming' && 'bg-muted-foreground/30'
                                )}
                                style={status === 'current' ? { backgroundColor: stage.color || undefined } : undefined}
                            />

                            {/* Stage name */}
                            <span className={clsx(
                                'font-medium flex-grow',
                                status === 'current' && 'text-foreground',
                                status === 'completed' && 'text-muted-foreground',
                                status === 'upcoming' && 'text-muted-foreground'
                            )}>
                                {stage.name}
                            </span>

                            {/* Status badge */}
                            {status === 'completed' && (
                                <span className="flex items-center gap-1 text-xs text-success bg-success/10 px-2 py-0.5 rounded-full">
                                    <Check className="w-3 h-3" />
                                    Completed
                                </span>
                            )}
                            {status === 'upcoming' && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                    <Clock className="w-3 h-3" />
                                    Upcoming
                                </span>
                            )}
                            {status === 'current' && !stageComplete && (
                                <span className="flex items-center gap-1 text-xs text-warning bg-warning/10 px-2 py-0.5 rounded-full">
                                    <AlertCircle className="w-3 h-3" />
                                    In Progress
                                </span>
                            )}
                            {status === 'current' && stageComplete && (
                                <span className="flex items-center gap-1 text-xs text-success bg-success/10 px-2 py-0.5 rounded-full">
                                    <Check className="w-3 h-3" />
                                    Ready
                                </span>
                            )}

                            {/* Chevron */}
                            <ChevronDown
                                className={clsx(
                                    'w-5 h-5 text-muted-foreground transition-transform duration-200',
                                    isExpanded && 'rotate-180'
                                )}
                            />
                        </button>

                        {/* Accordion Content */}
                        <div
                            className={clsx(
                                'overflow-hidden transition-all duration-200',
                                isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                            )}
                        >
                            <div className="px-4 pb-4 pt-2 border-t border-border/50">
                                {!config?.fields.length ? (
                                    <p className="text-sm text-muted-foreground italic py-2">
                                        No fields configured for this stage
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {config.fields.map(field => (
                                            <div key={field.name}>
                                                <label className="text-xs flex items-center gap-1.5 mb-1.5 text-muted-foreground">
                                                    {field.label}
                                                    {field.required && <span className="text-destructive">*</span>}
                                                    <FieldIndicator field={field.name} />
                                                </label>

                                                {field.type === 'display' && (
                                                    <p className={clsx(
                                                        'text-sm font-medium',
                                                        !field.getValue(opportunity) && 'text-muted-foreground italic'
                                                    )}>
                                                        {getFieldDisplayValue(field)}
                                                    </p>
                                                )}

                                                {field.type === 'select' && (
                                                    <select
                                                        value={field.getValue(opportunity) || ''}
                                                        disabled={disabled}
                                                        onChange={(e) => {
                                                            if (onFieldChange) {
                                                                onFieldChange(field.name, e.target.value || null)
                                                            }
                                                        }}
                                                        className="input w-full text-sm"
                                                    >
                                                        <option value="">{field.placeholder || 'Select...'}</option>
                                                        {field.options?.map(opt => (
                                                            <option key={opt.value} value={opt.value}>
                                                                {opt.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}

                                                {field.type === 'contact' && (
                                                    <select
                                                        value={opportunity.contact_id || ''}
                                                        disabled={disabled}
                                                        onChange={(e) => {
                                                            if (onContactChange) {
                                                                onContactChange(e.target.value || null)
                                                            }
                                                        }}
                                                        className="input w-full text-sm"
                                                    >
                                                        <option value="">{field.placeholder || 'Select contact...'}</option>
                                                        {contacts.map(contact => (
                                                            <option key={contact.id} value={contact.id}>
                                                                {contact.name}{contact.company ? ` (${contact.company.name})` : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}

                                                {field.type === 'products' && (
                                                    <div className="space-y-2 max-h-[200px] overflow-y-auto border border-input rounded-lg p-2">
                                                        {availableProducts.length === 0 ? (
                                                            <p className="text-sm text-muted-foreground italic p-2">No products available</p>
                                                        ) : (
                                                            availableProducts.map(product => {
                                                                const isSelected = opportunity.products?.some(p => p.id === product.id) || false
                                                                return (
                                                                    <label
                                                                        key={product.id}
                                                                        className={clsx(
                                                                            'flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors',
                                                                            isSelected ? 'bg-primary/10' : 'hover:bg-muted'
                                                                        )}
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={isSelected}
                                                                            disabled={disabled}
                                                                            onChange={(e) => {
                                                                                if (onProductsChange) {
                                                                                    const currentIds = opportunity.products?.map(p => p.id) || []
                                                                                    if (e.target.checked) {
                                                                                        onProductsChange([...currentIds, product.id])
                                                                                    } else {
                                                                                        onProductsChange(currentIds.filter(id => id !== product.id))
                                                                                    }
                                                                                }
                                                                            }}
                                                                            className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
                                                                        />
                                                                        <div className="flex-1 min-w-0">
                                                                            <span className="text-sm font-medium block truncate">{product.name}</span>
                                                                            {product.manufacturer && (
                                                                                <span className="text-xs text-muted-foreground truncate block">{product.manufacturer.name}</span>
                                                                            )}
                                                                        </div>
                                                                    </label>
                                                                )
                                                            })
                                                        )}
                                                    </div>
                                                )}

                                                {field.type === 'number' && (
                                                    <input
                                                        type="number"
                                                        defaultValue={field.getValue(opportunity) || ''}
                                                        placeholder={field.placeholder}
                                                        disabled={disabled}
                                                        step="0.01"
                                                        onBlur={(e) => {
                                                            if (onFieldChange && e.target.value !== field.getValue(opportunity)) {
                                                                onFieldChange(field.name, e.target.value ? parseFloat(e.target.value) : null)
                                                            }
                                                        }}
                                                        className="input w-full text-sm"
                                                    />
                                                )}

                                                {field.type === 'date' && (
                                                    <input
                                                        type="date"
                                                        defaultValue={field.getValue(opportunity) || ''}
                                                        disabled={disabled}
                                                        onBlur={(e) => {
                                                            if (onFieldChange && e.target.value !== field.getValue(opportunity)) {
                                                                onFieldChange(field.name, e.target.value || null)
                                                            }
                                                        }}
                                                        className="input w-full text-sm"
                                                    />
                                                )}

                                                {field.type === 'text' && (
                                                    <input
                                                        type="text"
                                                        defaultValue={field.getValue(opportunity) || ''}
                                                        placeholder={field.placeholder}
                                                        disabled={disabled}
                                                        onBlur={(e) => {
                                                            if (onFieldChange && e.target.value !== field.getValue(opportunity)) {
                                                                onFieldChange(field.name, e.target.value || null)
                                                            }
                                                        }}
                                                        className="input w-full text-sm"
                                                    />
                                                )}

                                                {field.type === 'textarea' && (
                                                    <textarea
                                                        defaultValue={field.getValue(opportunity) || ''}
                                                        placeholder={field.placeholder}
                                                        disabled={disabled}
                                                        rows={3}
                                                        onBlur={(e) => {
                                                            if (onFieldChange && e.target.value !== field.getValue(opportunity)) {
                                                                onFieldChange(field.name, e.target.value || null)
                                                            }
                                                        }}
                                                        className="input w-full text-sm resize-none"
                                                    />
                                                )}

                                                {field.type === 'file' && (
                                                    <div className="border rounded-lg p-3 text-center border-dashed border-border hover:border-primary/50 cursor-pointer">
                                                        {field.getValue(opportunity) ? (
                                                            <div className="flex items-center gap-2 justify-center text-sm">
                                                                <FileText className="w-4 h-4 text-primary" />
                                                                <span className="truncate">File uploaded</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center gap-1">
                                                                <Upload className="w-5 h-5 text-muted-foreground" />
                                                                <span className="text-xs text-muted-foreground">
                                                                    {field.placeholder || 'Upload file'}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
})
