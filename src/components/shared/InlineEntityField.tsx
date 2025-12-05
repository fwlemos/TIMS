import { useState, ReactNode, createContext, useContext } from 'react'
import { clsx } from 'clsx'
import { X, Plus, Search, ChevronLeft } from 'lucide-react'

// Context for managing nested form stack
interface FormStackContext {
    pushForm: (form: NestedForm) => void
    popForm: () => void
    depth: number
}

interface NestedForm {
    id: string
    title: string
    icon?: ReactNode
    content: ReactNode
}

const FormStackContext = createContext<FormStackContext | null>(null)

export function useFormStack() {
    const context = useContext(FormStackContext)
    if (!context) {
        throw new Error('useFormStack must be used within FormStackProvider')
    }
    return context
}

interface FormStackProviderProps {
    children: ReactNode
}

export function FormStackProvider({ children }: FormStackProviderProps) {
    const [formStack, setFormStack] = useState<NestedForm[]>([])

    const pushForm = (form: NestedForm) => {
        setFormStack(prev => [...prev, form])
    }

    const popForm = () => {
        setFormStack(prev => prev.slice(0, -1))
    }

    return (
        <FormStackContext.Provider value={{ pushForm, popForm, depth: formStack.length }}>
            <div className="relative">
                {/* Main content */}
                <div className={clsx(formStack.length > 0 && 'hidden')}>
                    {children}
                </div>

                {/* Nested forms */}
                {formStack.map((form, index) => (
                    <div
                        key={form.id}
                        className={clsx(
                            'animate-fade-in',
                            index < formStack.length - 1 && 'hidden'
                        )}
                    >
                        {/* Back button / breadcrumb */}
                        <button
                            type="button"
                            onClick={popForm}
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Back
                        </button>

                        {/* Nested form container */}
                        <div className="card p-4 border-primary/20">
                            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
                                {form.icon}
                                <h3 className="font-semibold">{form.title}</h3>
                            </div>
                            {form.content}
                        </div>
                    </div>
                ))}
            </div>
        </FormStackContext.Provider>
    )
}

// Inline field with add/select capability
interface InlineEntityFieldProps {
    label: string
    required?: boolean
    entityName: string
    entityIcon?: ReactNode
    options: { value: string; label: string; sublabel?: string }[]
    selectedIds: string[]
    onSelect: (id: string) => void
    onRemove: (id: string) => void
    getItemDetails?: (id: string) => { id: string; name: string; sublabel?: string } | undefined
    createFormContent: (onCreate: (id: string) => void) => ReactNode
}

export function InlineEntityField({
    label,
    required,
    entityName,
    entityIcon,
    options,
    selectedIds,
    onSelect,
    onRemove,
    getItemDetails,
    createFormContent,
}: InlineEntityFieldProps) {
    const { pushForm, popForm } = useFormStack()
    const [isSearching, setIsSearching] = useState(false)
    const [search, setSearch] = useState('')

    const selectedItems = selectedIds.map(id => {
        if (getItemDetails) {
            return getItemDetails(id)
        }
        const opt = options.find(o => o.value === id)
        return opt ? { id: opt.value, name: opt.label, sublabel: opt.sublabel } : { id, name: 'Unknown' }
    }).filter(Boolean)

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(search.toLowerCase()) &&
        !selectedIds.includes(opt.value)
    )

    const handleCreate = () => {
        pushForm({
            id: `create-${entityName}-${Date.now()}`,
            title: entityName,
            icon: entityIcon,
            content: createFormContent((newId) => {
                onSelect(newId)
                popForm()
            }),
        })
        setIsSearching(false)
        setSearch('')
    }

    const handleSelectItem = (id: string) => {
        onSelect(id)
        setIsSearching(false)
        setSearch('')
    }

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium">
                {label} {required && <span className="text-destructive">*</span>}
            </label>

            {/* Selected items */}
            {selectedItems.map((item) => item && (
                <div key={item.id} className="card p-3 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{item.name}</p>
                        {item.sublabel && (
                            <p className="text-xs text-muted-foreground">{item.sublabel}</p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => onRemove(item.id)}
                        className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}

            {/* Add button / Search dropdown */}
            {!isSearching ? (
                <button
                    type="button"
                    onClick={() => setIsSearching(true)}
                    className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add {entityName}
                </button>
            ) : (
                <div className="card p-3 space-y-3 border-primary/30">
                    {/* Search input */}
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={`Search ${entityName}s...`}
                                className="input pl-9 h-9 text-sm"
                                autoFocus
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleCreate}
                            className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4" />
                            Add {entityName}
                        </button>
                    </div>

                    {/* Options list */}
                    <div className="max-h-[180px] overflow-y-auto -mx-3 scrollbar-thin">
                        {filteredOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleSelectItem(option.value)}
                                className="w-full px-3 py-2.5 text-left hover:bg-accent transition-colors"
                            >
                                <p className="text-sm font-medium">{option.label}</p>
                                {option.sublabel && (
                                    <p className="text-xs text-muted-foreground">{option.sublabel}</p>
                                )}
                            </button>
                        ))}

                        {filteredOptions.length === 0 && (
                            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                                No {entityName}s found
                            </div>
                        )}
                    </div>

                    {/* Cancel */}
                    <button
                        type="button"
                        onClick={() => {
                            setIsSearching(false)
                            setSearch('')
                        }}
                        className="text-sm text-muted-foreground hover:text-foreground"
                    >
                        Cancel
                    </button>
                </div>
            )}
        </div>
    )
}

// Inline create form wrapper for nested entities
interface InlineCreateFormProps {
    children: ReactNode
    onSubmit: () => void
    submitLabel: string
    isSubmitting?: boolean
}

export function InlineCreateForm({ children, onSubmit, submitLabel, isSubmitting }: InlineCreateFormProps) {
    return (
        <div className="space-y-4">
            {children}
            <button
                type="button"
                onClick={onSubmit}
                disabled={isSubmitting}
                className="btn-primary w-full"
            >
                {submitLabel}
            </button>
        </div>
    )
}
