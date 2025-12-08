import { ReactNode, useState } from 'react'
import { clsx } from 'clsx'
import { X, ChevronLeft, Loader2 } from 'lucide-react'
import { RelationalField } from './RelationalField'
import type { FormField, NestedFieldsConfig } from './types'

interface RelationalNestedFormProps {
    entityLabel: string
    entityIcon?: ReactNode
    formSchema: FormField[]
    onSubmit: (data: Record<string, unknown>) => Promise<void>
    onCancel: () => void
    isSubmitting?: boolean
    error?: string | null
    // Configuration for nested relational fields
    nestedFieldsConfig?: NestedFieldsConfig
    currentDepth?: number
    maxNestingDepth?: number
    // Edit mode support
    initialData?: Record<string, unknown>
    isEditing?: boolean
}

export function RelationalNestedForm({
    entityLabel,
    entityIcon,
    formSchema,
    onSubmit,
    onCancel,
    isSubmitting = false,
    error = null,
    nestedFieldsConfig,
    currentDepth = 0,
    maxNestingDepth = 3,
    initialData,
    isEditing = false,
}: RelationalNestedFormProps) {
    const [formData, setFormData] = useState<Record<string, unknown>>(initialData || {})
    const [errors, setErrors] = useState<Record<string, string>>({})

    const handleFieldChange = (name: string, value: unknown) => {
        setFormData(prev => ({ ...prev, [name]: value }))
        // Clear field error when user types
        if (errors[name]) {
            setErrors(prev => {
                const next = { ...prev }
                delete next[name]
                return next
            })
        }
    }

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {}

        formSchema.forEach(field => {
            if (field.required) {
                const value = formData[field.name]
                if (value === undefined || value === null || value === '') {
                    newErrors[field.name] = `${field.label} is required`
                }
            }
        })

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async () => {
        if (!validate()) return
        await onSubmit(formData)
    }

    const canNestDeeper = currentDepth < maxNestingDepth

    const renderField = (field: FormField) => {
        const value = formData[field.name]
        const fieldError = errors[field.name]

        // Handle relational fields with actual RelationalField components
        if (field.type === 'relational' && field.relationalConfig && nestedFieldsConfig && canNestDeeper) {
            const config = field.relationalConfig
            const fieldConfig = nestedFieldsConfig[config.entityType]

            if (fieldConfig) {
                return (
                    <div key={field.name}>
                        <label className="block text-sm font-medium mb-1">
                            {field.label}
                            {field.required && <span className="text-destructive ml-0.5">*</span>}
                        </label>
                        <RelationalField
                            entityType={config.entityType}
                            entityLabel={config.entityLabel}
                            displayFields={config.displayFields}
                            searchFields={config.searchFields}
                            nestedFormSchema={config.nestedFormSchema}
                            maxNestingDepth={maxNestingDepth}
                            currentDepth={currentDepth + 1}
                            value={(value as string) || null}
                            onChange={(v) => handleFieldChange(field.name, v)}
                            options={fieldConfig.options}
                            onSearch={fieldConfig.onSearch}
                            onCreate={fieldConfig.onCreate}
                            onRefresh={fieldConfig.onRefresh}
                            getRecordDisplay={fieldConfig.getRecordDisplay}
                            canCreate={true}
                            nestedFieldsConfig={nestedFieldsConfig}
                        />
                        {fieldError && (
                            <p className="text-destructive text-xs mt-1">{fieldError}</p>
                        )}
                    </div>
                )
            }
        }

        // Standard field types
        switch (field.type) {
            case 'text':
            case 'email':
            case 'tel':
            case 'url':
                return (
                    <div key={field.name}>
                        <label className="block text-sm font-medium mb-1">
                            {field.label}
                            {field.required && <span className="text-destructive ml-0.5">*</span>}
                        </label>
                        <input
                            type={field.type}
                            value={(value as string) || ''}
                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                            placeholder={field.placeholder}
                            className={clsx('input', fieldError && 'border-destructive')}
                        />
                        {fieldError && (
                            <p className="text-destructive text-xs mt-1">{fieldError}</p>
                        )}
                    </div>
                )

            case 'textarea':
                return (
                    <div key={field.name}>
                        <label className="block text-sm font-medium mb-1">
                            {field.label}
                            {field.required && <span className="text-destructive ml-0.5">*</span>}
                        </label>
                        <textarea
                            value={(value as string) || ''}
                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                            placeholder={field.placeholder}
                            className={clsx('input min-h-[80px]', fieldError && 'border-destructive')}
                            rows={3}
                        />
                        {fieldError && (
                            <p className="text-destructive text-xs mt-1">{fieldError}</p>
                        )}
                    </div>
                )

            case 'date':
                return (
                    <div key={field.name}>
                        <label className="block text-sm font-medium mb-1">
                            {field.label}
                            {field.required && <span className="text-destructive ml-0.5">*</span>}
                        </label>
                        <input
                            type="date"
                            value={(value as string) || ''}
                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                            className={clsx('input', fieldError && 'border-destructive')}
                        />
                        {fieldError && (
                            <p className="text-destructive text-xs mt-1">{fieldError}</p>
                        )}
                    </div>
                )

            case 'checkbox':
                return (
                    <div key={field.name} className="flex items-center gap-2 mt-6 mb-2">
                        <input
                            type="checkbox"
                            id={field.name}
                            checked={!!value}
                            onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor={field.name} className="text-sm font-medium select-none cursor-pointer">
                            {field.label}
                            {field.required && <span className="text-destructive ml-0.5">*</span>}
                        </label>
                        {fieldError && (
                            <p className="text-destructive text-xs mt-1 block">{fieldError}</p>
                        )}
                    </div>
                )

            case 'select':
                return (
                    <div key={field.name}>
                        <label className="block text-sm font-medium mb-1">
                            {field.label}
                            {field.required && <span className="text-destructive ml-0.5">*</span>}
                        </label>
                        <select
                            value={(value as string) || ''}
                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                            className={clsx('input', fieldError && 'border-destructive')}
                        >
                            <option value="">Select {field.label.toLowerCase()}...</option>
                            {field.options?.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        {fieldError && (
                            <p className="text-destructive text-xs mt-1">{fieldError}</p>
                        )}
                    </div>
                )

            case 'relational':
                // Fallback for relational fields without config
                return (
                    <div key={field.name}>
                        <label className="block text-sm font-medium mb-1">
                            {field.label}
                            {field.required && <span className="text-destructive ml-0.5">*</span>}
                        </label>
                        <p className="text-xs text-muted-foreground p-2 bg-muted rounded">
                            {canNestDeeper
                                ? `Nested ${field.relationalConfig?.entityLabel || field.label} field (configuration missing)`
                                : `Maximum nesting depth reached`
                            }
                        </p>
                    </div>
                )

            default:
                return null
        }
    }

    return (
        <div className="relative pl-4 border-l-3 border-primary/30 bg-accent/30 rounded-r-lg py-4 pr-4 my-3 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="p-1 hover:bg-accent rounded transition-colors"
                        title="Cancel"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    {entityIcon && (
                        <div className="w-6 h-6 flex items-center justify-center text-primary">
                            {entityIcon}
                        </div>
                    )}
                    <h4 className="font-medium text-sm">{isEditing ? 'Edit' : 'New'} {entityLabel}</h4>
                </div>
                <button
                    type="button"
                    onClick={onCancel}
                    className="p-1 hover:bg-accent rounded transition-colors"
                    title="Cancel"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
                {formSchema.map(renderField)}
            </div>

            {/* Error Message */}
            {error && (
                <div className="mt-3 p-2 bg-destructive/10 border border-destructive/30 rounded-md">
                    <p className="text-sm text-destructive">{error}</p>
                </div>
            )}

            {/* Submit Button */}
            <div className="mt-4">
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="btn-primary w-full"
                >
                    {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        isEditing ? `Save ${entityLabel}` : `Add ${entityLabel}`
                    )}
                </button>
            </div>
        </div>
    )
}
