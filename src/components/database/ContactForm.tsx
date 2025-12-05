import { useState, useMemo, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { useCompanies } from '@/hooks/useCompanies'
import { useDocuments } from '@/hooks/useDocuments'
import { RelationalField, FormField, NestedFieldsConfig, RelationalOption } from '@/components/shared/RelationalField'
import { DocumentsList } from '@/components/documents/DocumentsList'
import { supabase } from '@/lib/supabase'
import type { Contact, InsertTables } from '@/lib/database.types'

const contactSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    phone: z.string().optional(),
    company_id: z.string().uuid().optional().nullable(),
    observation: z.string().optional(),
})

type ContactFormData = z.infer<typeof contactSchema>

interface ContactFormProps {
    contact?: Contact | null
    onSubmit: (data: InsertTables<'contacts'>) => Promise<void>
    onCancel: () => void
}

const companyFormSchema: FormField[] = [
    { name: 'name', label: 'Company Name', type: 'text', required: true, placeholder: 'Enter company name...' },
    { name: 'tax_id', label: 'Tax ID', type: 'text' },
    { name: 'phone', label: 'Phone', type: 'tel' },
    { name: 'website', label: 'Website', type: 'url' },
    { name: 'observation', label: 'Observation', type: 'textarea' },
]

export function ContactForm({ contact, onSubmit, onCancel }: ContactFormProps) {
    const { companies, createCompany, refetch } = useCompanies()
    const [companySearch, setCompanySearch] = useState('')
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(contact?.company_id || null)

    // Pre-generate ID for new contacts to allow document uploads before save
    const [entityId] = useState(() => contact?.id || crypto.randomUUID())
    const isEditing = !!contact

    // For cleanup on cancel
    const { documents } = useDocuments(entityId, 'contacts')

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ContactFormData>({
        resolver: zodResolver(contactSchema),
        defaultValues: {
            name: contact?.name || '',
            email: contact?.email || '',
            phone: contact?.phone || '',
            company_id: contact?.company_id || null,
            observation: contact?.observation || '',
        },
    })

    const handleFormSubmit = async (data: ContactFormData) => {
        const contactData: InsertTables<'contacts'> & { id?: string } = {
            id: isEditing ? undefined : entityId,
            ...data,
            phone: data.phone || null,
            company_id: selectedCompanyId,
            observation: data.observation || null,
        }
        await onSubmit(contactData as InsertTables<'contacts'>)
    }

    const handleCancel = async () => {
        // If new contact with documents, clean them up
        if (!isEditing && documents.length > 0) {
            try {
                const { data: docs } = await supabase
                    .from('documents')
                    .select('id, file_url')
                    .eq('entity_id', entityId)
                    .eq('entity_type', 'contacts')

                if (docs && docs.length > 0) {
                    await supabase.storage
                        .from('documents')
                        .remove(docs.map(d => d.file_url))

                    await supabase
                        .from('documents')
                        .delete()
                        .eq('entity_id', entityId)
                        .eq('entity_type', 'contacts')
                }
            } catch (error) {
                console.error('Error cleaning up documents:', error)
            }
        }
        onCancel()
    }

    const companyOptions = useMemo(() =>
        companies
            .filter(c => c.name.toLowerCase().includes(companySearch.toLowerCase()))
            .map(c => ({
                id: c.id,
                primaryText: c.name,
                secondaryText: c.tax_id || undefined,
            })),
        [companies, companySearch]
    )

    const handleCreateCompany = useCallback(async (data: Record<string, unknown>): Promise<string | null> => {
        const result = await createCompany({
            name: data.name as string,
            tax_id: (data.tax_id as string) || null,
            phone: (data.phone as string) || null,
            website: (data.website as string) || null,
            observation: (data.observation as string) || null,
        })
        return result?.id || null
    }, [createCompany])

    const getCompanyDisplay = useCallback((id: string): RelationalOption | undefined => {
        const company = companies.find(c => c.id === id)
        return company ? {
            id: company.id,
            primaryText: company.name,
            secondaryText: company.tax_id || undefined
        } : undefined
    }, [companies])

    const nestedFieldsConfig: NestedFieldsConfig = useMemo(() => ({
        company: {
            options: companyOptions,
            onSearch: setCompanySearch,
            onCreate: handleCreateCompany,
            onRefresh: refetch,
            getRecordDisplay: getCompanyDisplay,
        },
    }), [companyOptions, handleCreateCompany, refetch, getCompanyDisplay])

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-1.5">
                    Name <span className="text-destructive">*</span>
                </label>
                <input
                    {...register('name')}
                    className="input"
                    placeholder="Contact name"
                />
                {errors.name && (
                    <p className="text-destructive text-sm mt-1">{errors.name.message}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <input
                    {...register('email')}
                    type="email"
                    className="input"
                    placeholder="email@example.com"
                />
                {errors.email && (
                    <p className="text-destructive text-sm mt-1">{errors.email.message}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium mb-1.5">Phone</label>
                <input
                    {...register('phone')}
                    className="input"
                    placeholder="+55 11 99999-9999"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1.5">Company</label>
                <RelationalField
                    entityType="company"
                    entityLabel="Company"
                    displayFields={['name']}
                    searchFields={['name', 'tax_id']}
                    nestedFormSchema={companyFormSchema}
                    value={selectedCompanyId}
                    onChange={(val) => setSelectedCompanyId(val as string | null)}
                    options={companyOptions}
                    onSearch={setCompanySearch}
                    onCreate={handleCreateCompany}
                    onRefresh={refetch}
                    getRecordDisplay={getCompanyDisplay}
                    canCreate
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

            {/* Documents Section */}
            <div className="pt-4 border-t border-border">
                <DocumentsList entityId={entityId} entityType="contacts" />
            </div>

            <div className="flex gap-3 justify-end pt-4">
                <button type="button" onClick={handleCancel} className="btn-outline">
                    Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="btn-primary">
                    {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : contact ? (
                        'Save Changes'
                    ) : (
                        'Create Contact'
                    )}
                </button>
            </div>
        </form>
    )
}
