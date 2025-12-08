import { ReactNode } from 'react'

// Types for the RelationalField component system

export interface FormField {
    name: string
    label: string
    type: 'text' | 'email' | 'tel' | 'url' | 'textarea' | 'date' | 'checkbox' | 'select' | 'relational'
    required?: boolean
    placeholder?: string
    options?: { value: string; label: string }[]
    // For relational fields
    relationalConfig?: RelationalFieldConfig
}

export interface RelationalFieldConfig {
    entityType: string
    entityLabel: string
    displayFields: string[]
    searchFields: string[]
    nestedFormSchema: FormField[]
    maxNestingDepth?: number
}

// Configuration for nested relational field hooks
export interface NestedFieldConfig {
    options: RelationalOption[]
    onSearch: (query: string) => void
    onCreate: (data: Record<string, unknown>) => Promise<string | null>
    onRefresh: () => void
    getRecordDisplay: (id: string) => RelationalOption | undefined
}

// Map of entity type to its field configuration
export type NestedFieldsConfig = Record<string, NestedFieldConfig>

export interface RelationalFieldProps {
    // Entity configuration
    entityType: string
    entityLabel: string

    // Display configuration
    displayFields: string[]
    searchFields: string[]

    // Form configuration
    nestedFormSchema: FormField[]
    maxNestingDepth?: number
    currentDepth?: number

    // Value & callbacks
    // Value & callbacks
    value: string | string[] | null
    onChange: (recordId: string | string[] | null) => void
    mode?: 'single' | 'multi'

    // Data fetching
    options: RelationalOption[]
    onSearch: (query: string) => void
    onCreate: (data: Record<string, unknown>) => Promise<string | null>
    onRefresh: () => void

    // Display
    getRecordDisplay: (id: string) => RelationalOption | undefined

    // Permissions
    canCreate?: boolean
    canEdit?: boolean

    // Optional
    placeholder?: string
    required?: boolean
    disabled?: boolean

    // Display style for selected items
    displayMode?: 'card' | 'pill'

    // Edit support
    onEdit?: (id: string, data: Record<string, unknown>) => Promise<void>
    getRecordData?: (id: string) => Record<string, unknown> | undefined
}

export interface RelationalOption {
    id: string
    primaryText: string
    secondaryText?: string | ReactNode
    data?: Record<string, unknown>
}

export interface NestedFormState {
    isOpen: boolean
    formData: Record<string, unknown>
    errors: Record<string, string>
    isSubmitting: boolean
}

export interface DropdownState {
    isOpen: boolean
    searchQuery: string
    highlightedIndex: number
}
