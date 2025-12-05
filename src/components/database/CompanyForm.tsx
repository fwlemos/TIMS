import { useState, useMemo, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { useContacts } from '@/hooks/useContacts'
import { RelationalField, FormField, NestedFieldsConfig, RelationalOption } from '@/components/shared/RelationalField'
import type { Company, InsertTables } from '@/lib/database.types'

const companySchema = z.object({
    name: z.string().min(1, 'Name is required'),
    tax_id: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    website: z.string().url('Invalid URL').optional().or(z.literal('')),
    observation: z.string().optional(),
    contact_ids: z.array(z.string()).optional(),
})

type CompanyFormData = z.infer<typeof companySchema>

// Extend the onSubmit type to include contact_ids
type CompanySubmitData = InsertTables<'companies'> & { contact_ids?: string[] }

interface CompanyFormProps {
    company?: Company | null
    onSubmit: (data: CompanySubmitData) => Promise<void>
    onCancel: () => void
}

const contactFormSchema: FormField[] = [
    { name: 'name', label: 'Contact Name', type: 'text', required: true, placeholder: 'Enter name...' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'phone', label: 'Phone', type: 'tel' },
    { name: 'observation', label: 'Observation', type: 'textarea' },
]

export function CompanyForm({ company, onSubmit, onCancel }: CompanyFormProps) {
    const { contacts, createContact, refetch } = useContacts()
    const [contactSearch, setContactSearch] = useState('')
    // Load existing contacts for this company if editing, or empty if creating
    // Note: contacts list from hook contains all contacts. We need to filter for initial value?
    // If editing, 'company' prop has ID. But 'contacts' list in hook might not automatically link?
    // We can find contacts where contact.company_id === company.id.
    // However, for correct initial state in react-hook-form, we should calculate this.

    // We can't easily set defaultValues for contact_ids synchronously if contacts depends on async fetch,
    // but contacts from useContacts are likely already loaded if Database page loaded them.
    // Let's compute initialContactIds.
    const initialContactIds = useMemo(() => {
        if (!company) return []
        return contacts
            .filter(c => c.company_id === company.id)
            .map(c => c.id)
    }, [company, contacts])

    const [selectedContactIds, setSelectedContactIds] = useState<string[]>(initialContactIds)

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<CompanyFormData>({
        resolver: zodResolver(companySchema),
        defaultValues: {
            name: company?.name || '',
            tax_id: company?.tax_id || '',
            address: company?.address || '',
            phone: company?.phone || '',
            website: company?.website || '',
            observation: company?.observation || '',
            contact_ids: initialContactIds,
        },
    })

    const handleFormSubmit = async (data: CompanyFormData) => {
        await onSubmit({
            ...data,
            tax_id: data.tax_id || null,
            address: data.address || null,
            phone: data.phone || null,
            website: data.website || null,
            observation: data.observation || null,
            contact_ids: selectedContactIds,
        })
    }

    const contactOptions = useMemo(() =>
        contacts
            .filter(c => c.name.toLowerCase().includes(contactSearch.toLowerCase()))
            .map(c => ({
                id: c.id,
                primaryText: c.name,
                secondaryText: c.email || undefined,
            })),
        [contacts, contactSearch]
    )

    const handleCreateContact = useCallback(async (data: Record<string, unknown>): Promise<string | null> => {
        // If creating a contact inline from CompanyForm, we can't link it to THIS company yet (if new).
        // If editing, we could pass company_id: company.id.
        // But for simplicity, create it unlinked, and rely on the multi-select value to link it on submit.
        const result = await createContact({
            name: data.name as string,
            email: (data.email as string) || null,
            phone: (data.phone as string) || null,
            observation: (data.observation as string) || null,
            // company_id: company?.id // Optional: link immediately if editing
        })
        return result?.id || null
    }, [createContact])

    const getContactDisplay = useCallback((id: string): RelationalOption | undefined => {
        const contact = contacts.find(c => c.id === id)
        return contact ? {
            id: contact.id,
            primaryText: contact.name,
            secondaryText: contact.email || undefined
        } : undefined
    }, [contacts])

    const nestedFieldsConfig: NestedFieldsConfig = useMemo(() => ({
        contact: {
            options: contactOptions,
            onSearch: setContactSearch,
            onCreate: handleCreateContact,
            onRefresh: refetch,
            getRecordDisplay: getContactDisplay,
        },
    }), [contactOptions, handleCreateContact, refetch, getContactDisplay])

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-1.5">
                    Company Name <span className="text-destructive">*</span>
                </label>
                <input
                    {...register('name')}
                    className="input"
                    placeholder="Company name"
                />
                {errors.name && (
                    <p className="text-destructive text-sm mt-1">{errors.name.message}</p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1.5">Tax ID (CNPJ)</label>
                    <input
                        {...register('tax_id')}
                        className="input"
                        placeholder="00.000.000/0001-00"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1.5">Phone</label>
                    <input
                        {...register('phone')}
                        className="input"
                        placeholder="+55 11 3000-0000"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1.5">Address</label>
                <input
                    {...register('address')}
                    className="input"
                    placeholder="Full address"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1.5">Website</label>
                <input
                    {...register('website')}
                    type="url"
                    className="input"
                    placeholder="https://example.com"
                />
                {errors.website && (
                    <p className="text-destructive text-sm mt-1">{errors.website.message}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium mb-1.5">Contacts</label>
                <RelationalField
                    entityType="contact"
                    entityLabel="Contact"
                    displayFields={['name', 'email']}
                    searchFields={['name', 'email']}
                    nestedFormSchema={contactFormSchema}
                    value={selectedContactIds}
                    onChange={(val) => {
                        // Handle multi-select value (string[])
                        if (Array.isArray(val)) {
                            setSelectedContactIds(val)
                        } else if (val === null) {
                            setSelectedContactIds([])
                        } else {
                            // Should not happen in multi mode usually, but if single ID passed
                            setSelectedContactIds([val])
                        }
                    }}
                    options={contactOptions}
                    onSearch={setContactSearch}
                    onCreate={handleCreateContact}
                    onRefresh={refetch}
                    getRecordDisplay={getContactDisplay}
                    canCreate
                    mode="multi"
                    nestedFieldsConfig={nestedFieldsConfig}
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1.5">Notes</label>
                <textarea
                    {...register('observation')}
                    className="input min-h-[80px] resize-y"
                    placeholder="Additional notes..."
                />
            </div>

            <div className="flex gap-3 justify-end pt-4">
                <button type="button" onClick={onCancel} className="btn-outline">
                    Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="btn-primary">
                    {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : company ? (
                        'Save Changes'
                    ) : (
                        'Create Company'
                    )}
                </button>
            </div>
        </form>
    )
}
