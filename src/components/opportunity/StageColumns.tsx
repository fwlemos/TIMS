import { clsx } from 'clsx'
import { Check, Lock, AlertCircle, Upload, FileText, Loader2 } from 'lucide-react'
import { useState, useCallback } from 'react'
import type { PipelineStage, Opportunity } from '@/lib/database.types'

interface StageField {
    name: string
    label: string
    type: 'display' | 'select' | 'text' | 'number' | 'date' | 'textarea' | 'file'
    required?: boolean
    options?: { value: string; label: string }[]
    getValue: (opportunity: Opportunity) => string | null | undefined
    placeholder?: string
}

interface StageFieldsConfig {
    stageKey: string
    fields: StageField[]
    placeholder?: string
}

// Stage fields configuration
const STAGE_FIELDS: StageFieldsConfig[] = [
    {
        stageKey: 'lead_backlog',
        fields: [
            {
                name: 'contact',
                label: 'Contact',
                type: 'display',
                required: true,
                getValue: (opp) => (opp as Record<string, unknown>).contact_id as string | null,
            },
            {
                name: 'product',
                label: 'Product',
                type: 'display',
                required: true,
                getValue: (opp) => (opp as Record<string, unknown>).product_id as string | null,
            },
            {
                name: 'lead_origin',
                label: 'Lead Origin',
                type: 'display',
                required: true,
                getValue: (opp) => opp.lead_origin,
            },
        ],
    },
    {
        stageKey: 'qualification',
        fields: [
            {
                name: 'type_of_sale',
                label: 'Type of Sale',
                type: 'select',
                options: [
                    { value: 'Direct Importation', label: 'Direct Importation' },
                    { value: 'Nationalized', label: 'Nationalized' },
                    { value: 'Commissioned', label: 'Commissioned' },
                ],
                getValue: (opp) => opp.type_of_sale,
                placeholder: 'Select type...',
            },
        ],
    },
    {
        stageKey: 'quotation',
        fields: [
            {
                name: 'net_price',
                label: 'Net Price',
                type: 'number',
                getValue: (opp) => opp.net_price?.toString(),
                placeholder: '0.00',
            },
            {
                name: 'sales_price',
                label: 'Sales Price',
                type: 'number',
                getValue: (opp) => opp.sales_price?.toString(),
                placeholder: '0.00',
            },
        ],
    },
    {
        stageKey: 'closing',
        fields: [
            {
                name: 'expected_close_date',
                label: 'Estimated Close Date',
                type: 'date',
                getValue: (opp) => opp.expected_close_date,
            },
        ],
    },
    {
        stageKey: 'won',
        fields: [
            {
                name: 'won_purchase_order_url',
                label: 'Purchase Order',
                type: 'file',
                getValue: (opp) => opp.won_purchase_order_url,
                placeholder: 'Upload Purchase Order',
            },
            {
                name: 'won_order_description',
                label: 'Order Agreement',
                type: 'textarea',
                getValue: (opp) => opp.won_order_description,
                placeholder: 'Describe the order agreement...',
            },
        ],
    },
]

interface StageColumnsProps {
    opportunity: Opportunity & {
        contact?: { id: string; name: string } | null
        company?: { id: string; name: string } | null
        product?: { id: string; name: string } | null
        products?: Array<{ id: string; name: string }>
    }
    stages: PipelineStage[]
    currentStageId: string | null
    onFieldChange?: (fieldName: string, value: unknown) => Promise<void>
    onStageAdvance?: (newStageId: string) => Promise<{ success: boolean; errors?: string[] }>
    disabled?: boolean
    savingField?: string | null
    savedField?: string | null
}

export function StageColumns({
    opportunity,
    stages,
    currentStageId,
    onFieldChange,
    disabled = false,
    savingField,
    savedField,
}: StageColumnsProps) {
    const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({})

    // Get current stage index
    const currentStageIndex = stages.findIndex(s => s.id === currentStageId)

    // Match stage by key (normalized name)
    const getStageKey = (stage: PipelineStage): string => {
        return stage.name.toLowerCase().replace(/\s+/g, '_')
    }

    // Get fields config for a stage
    const getStageFieldsConfig = (stage: PipelineStage): StageFieldsConfig | undefined => {
        const key = getStageKey(stage)
        return STAGE_FIELDS.find(sf => sf.stageKey === key)
    }

    // Check if stage is complete (before current)
    const isStageComplete = (stageIndex: number) => stageIndex < currentStageIndex

    // Check if stage is current
    const isStageCurrent = (stageIndex: number) => stageIndex === currentStageIndex

    // Check if stage is future
    const isStageFuture = (stageIndex: number) => stageIndex > currentStageIndex

    // Get display value for a field
    const getFieldDisplayValue = useCallback((field: StageField): string => {
        const value = field.getValue(opportunity)
        if (!value) return '—'

        // Handle relational fields
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
            // Format lead origin
            return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        }

        return String(value)
    }, [opportunity])

    // Clear validation errors for a stage
    const clearStageErrors = (stageId: string) => {
        setValidationErrors(prev => {
            const next = { ...prev }
            delete next[stageId]
            return next
        })
    }

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
        <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">Stage Fields</h2>

            {/* Horizontal scrollable container */}
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
                {stages
                    .filter(stage => !stage.name.toLowerCase().includes('lost'))
                    .map((stage, index) => {
                        const isComplete = isStageComplete(index)
                        const isCurrent = isStageCurrent(index)
                        const isFuture = isStageFuture(index)
                        const config = getStageFieldsConfig(stage)
                        const stageErrors = validationErrors[stage.id] || []

                        return (
                            <div
                                key={stage.id}
                                className={clsx(
                                    'flex-shrink-0 w-64 rounded-xl border p-4 transition-all',
                                    isCurrent && 'border-primary bg-primary/5 shadow-md',
                                    isComplete && 'border-success/50 bg-success/5',
                                    isFuture && 'border-border bg-muted/30 opacity-60'
                                )}
                            >
                                {/* Stage header */}
                                <div className="flex items-center gap-2 mb-4">
                                    <div
                                        className={clsx(
                                            'w-3 h-3 rounded-full',
                                            isComplete && 'bg-success',
                                            isCurrent && 'bg-primary',
                                            isFuture && 'bg-muted-foreground/30'
                                        )}
                                        style={!isComplete && !isFuture ? { backgroundColor: stage.color || undefined } : undefined}
                                    />
                                    <h3 className={clsx(
                                        'font-medium text-sm',
                                        isFuture && 'text-muted-foreground'
                                    )}>
                                        {stage.name}
                                    </h3>
                                    {isComplete && (
                                        <Check className="w-4 h-4 text-success ml-auto" />
                                    )}
                                    {isFuture && (
                                        <Lock className="w-4 h-4 text-muted-foreground ml-auto" />
                                    )}
                                </div>

                                {/* Validation errors */}
                                {stageErrors.length > 0 && (
                                    <div className="mb-3 p-2 rounded-lg bg-destructive/10 border border-destructive/20">
                                        <div className="flex items-start gap-2 text-destructive text-xs">
                                            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                            <ul className="space-y-0.5">
                                                {stageErrors.map((err, i) => (
                                                    <li key={i}>{err}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                {/* Stage fields */}
                                <div className="space-y-3">
                                    {config?.placeholder ? (
                                        <p className="text-sm text-muted-foreground italic">
                                            {config.placeholder}
                                        </p>
                                    ) : config?.fields.length === 0 ? (
                                        <p className="text-sm text-muted-foreground italic">
                                            No fields configured
                                        </p>
                                    ) : (
                                        config?.fields.map(field => (
                                            <div key={field.name}>
                                                <label className={clsx(
                                                    'text-xs flex items-center gap-1.5 mb-1',
                                                    isFuture ? 'text-muted-foreground/60' : 'text-muted-foreground'
                                                )}>
                                                    {field.label}
                                                    {field.required && <span className="text-destructive">*</span>}
                                                    <FieldIndicator field={field.name} />
                                                </label>

                                                {field.type === 'display' && (
                                                    <p className={clsx(
                                                        'text-sm font-medium truncate',
                                                        isFuture && 'text-muted-foreground/60',
                                                        !field.getValue(opportunity) && 'text-muted-foreground italic'
                                                    )}>
                                                        {getFieldDisplayValue(field)}
                                                    </p>
                                                )}

                                                {field.type === 'select' && (
                                                    <select
                                                        value={field.getValue(opportunity) || ''}
                                                        disabled={disabled || isFuture}
                                                        onChange={(e) => {
                                                            if (onFieldChange) {
                                                                onFieldChange(field.name, e.target.value || null)
                                                                clearStageErrors(stage.id)
                                                            }
                                                        }}
                                                        className={clsx(
                                                            'input w-full text-sm appearance-none bg-background',
                                                            isFuture && 'opacity-50 cursor-not-allowed'
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

                                                {field.type === 'number' && (
                                                    <input
                                                        type="number"
                                                        defaultValue={field.getValue(opportunity) || ''}
                                                        placeholder={field.placeholder}
                                                        disabled={disabled || isFuture}
                                                        step="0.01"
                                                        onBlur={(e) => {
                                                            if (onFieldChange && e.target.value !== field.getValue(opportunity)) {
                                                                onFieldChange(field.name, e.target.value ? parseFloat(e.target.value) : null)
                                                                clearStageErrors(stage.id)
                                                            }
                                                        }}
                                                        className={clsx(
                                                            'input w-full text-sm',
                                                            isFuture && 'opacity-50 cursor-not-allowed'
                                                        )}
                                                    />
                                                )}

                                                {field.type === 'date' && (
                                                    <input
                                                        type="date"
                                                        defaultValue={field.getValue(opportunity) || ''}
                                                        disabled={disabled || isFuture}
                                                        onBlur={(e) => {
                                                            if (onFieldChange && e.target.value !== field.getValue(opportunity)) {
                                                                onFieldChange(field.name, e.target.value || null)
                                                                clearStageErrors(stage.id)
                                                            }
                                                        }}
                                                        className={clsx(
                                                            'input w-full text-sm',
                                                            isFuture && 'opacity-50 cursor-not-allowed'
                                                        )}
                                                    />
                                                )}

                                                {field.type === 'text' && (
                                                    <input
                                                        type="text"
                                                        defaultValue={field.getValue(opportunity) || ''}
                                                        placeholder={field.placeholder}
                                                        disabled={disabled || isFuture}
                                                        onBlur={(e) => {
                                                            if (onFieldChange && e.target.value !== field.getValue(opportunity)) {
                                                                onFieldChange(field.name, e.target.value || null)
                                                                clearStageErrors(stage.id)
                                                            }
                                                        }}
                                                        className={clsx(
                                                            'input w-full text-sm',
                                                            isFuture && 'opacity-50 cursor-not-allowed'
                                                        )}
                                                    />
                                                )}

                                                {field.type === 'textarea' && (
                                                    <textarea
                                                        defaultValue={field.getValue(opportunity) || ''}
                                                        placeholder={field.placeholder}
                                                        disabled={disabled || isFuture}
                                                        rows={3}
                                                        onBlur={(e) => {
                                                            if (onFieldChange && e.target.value !== field.getValue(opportunity)) {
                                                                onFieldChange(field.name, e.target.value || null)
                                                                clearStageErrors(stage.id)
                                                            }
                                                        }}
                                                        className={clsx(
                                                            'input w-full text-sm resize-none',
                                                            isFuture && 'opacity-50 cursor-not-allowed'
                                                        )}
                                                    />
                                                )}

                                                {field.type === 'file' && (
                                                    <div className={clsx(
                                                        'border rounded-lg p-3 text-center',
                                                        isFuture ? 'border-dashed border-muted-foreground/20 bg-muted/20' : 'border-dashed border-border hover:border-primary/50 cursor-pointer'
                                                    )}>
                                                        {field.getValue(opportunity) ? (
                                                            <div className="flex items-center gap-2 justify-center text-sm">
                                                                <FileText className="w-4 h-4 text-primary" />
                                                                <span className="truncate">File uploaded</span>
                                                            </div>
                                                        ) : (
                                                            <div className={clsx(
                                                                'flex flex-col items-center gap-1',
                                                                isFuture && 'opacity-50'
                                                            )}>
                                                                <Upload className="w-5 h-5 text-muted-foreground" />
                                                                <span className="text-xs text-muted-foreground">
                                                                    {field.placeholder || 'Upload file'}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )
                    })}
            </div>

            {/* Helper text */}
            <p className="text-xs text-muted-foreground mt-2">
                Use the stage breadcrumb above to advance through stages. Required fields must be filled before advancing.
            </p>
        </div>
    )
}
