import { useState, useRef, useMemo, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import type { Company, InsertTables } from '@/lib/database.types'
import { DocumentsList } from '@/components/documents/DocumentsList'
import { supabase } from '@/lib/supabase'
import { useContacts } from '@/hooks/useContacts'
import { useProducts } from '@/hooks/useProducts'
import { RelationalField, FormField, NestedFieldsConfig, RelationalOption } from '@/components/shared/RelationalField'

const manufacturerSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, 'Name is required'),
    phone: z.string().optional(),
    tax_id: z.string().optional(),
    website: z.string().url('Invalid URL').optional().or(z.literal('')),
    manufacturer_exclusivity: z.boolean().default(false),
    manufacturer_contract_validity: z.string().optional(),
    manufacturer_contract_url: z.string().url('Invalid URL').optional().or(z.literal('')),
    manufacturer_exclusivity_letter_url: z.string().url('Invalid URL').optional().or(z.literal('')),
    observation: z.string().optional(),
    contact_ids: z.array(z.string()).optional(),
    product_ids: z.array(z.string()).optional(),
})

type ManufacturerFormData = z.infer<typeof manufacturerSchema>

// Extend the onSubmit type to include contact_ids and product_ids
type ManufacturerSubmitData = InsertTables<'companies'> & {
    contact_ids?: string[],
    product_ids?: string[]
}

interface ManufacturerFormProps {
    manufacturer?: Company | null
    onSubmit: (data: ManufacturerSubmitData) => Promise<void>
    onCancel: () => void
}

// Nested form schemas
const contactFormSchema: FormField[] = [
    { name: 'name', label: 'Contact Name', type: 'text', required: true, placeholder: 'Enter name...' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'phone', label: 'Phone', type: 'tel' },
    { name: 'observation', label: 'Observation', type: 'textarea' },
]

const productFormSchema: FormField[] = [
    { name: 'name', label: 'Product Name', type: 'text', required: true, placeholder: 'Enter product name...' },
    { name: 'ncm', label: 'NCM Code', type: 'text' },
    { name: 'description', label: 'Description', type: 'textarea' },
]

export function ManufacturerForm({ manufacturer, onSubmit, onCancel }: ManufacturerFormProps) {
    // Generate a temporary ID for new manufacturers to link documents before saving
    const tempId = useRef(crypto.randomUUID())
    const entityId = manufacturer?.id || tempId.current

    // Hooks
    const { contacts, createContact, refetch: refetchContacts } = useContacts()
    const { products, createProduct, refetch: refetchProducts } = useProducts()

    // State for local filtering
    const [contactSearch, setContactSearch] = useState('')
    const [productSearch, setProductSearch] = useState('')

    // Compute initial selected IDs
    const initialContactIds = useMemo(() => {
        if (!manufacturer) return []
        return contacts
            .filter(c => c.company_id === manufacturer.id)
            .map(c => c.id)
    }, [manufacturer, contacts])

    const initialProductIds = useMemo(() => {
        if (!manufacturer) return []
        return products
            .filter(p => p.manufacturer_id === manufacturer.id)
            .map(p => p.id)
    }, [manufacturer, products])

    const [selectedContactIds, setSelectedContactIds] = useState<string[]>(initialContactIds)
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>(initialProductIds)

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ManufacturerFormData>({
        resolver: zodResolver(manufacturerSchema),
        defaultValues: {
            name: manufacturer?.name || '',
            phone: manufacturer?.phone || '',
            tax_id: manufacturer?.tax_id || '',
            website: manufacturer?.website || '',
            manufacturer_exclusivity: manufacturer?.manufacturer_exclusivity || false,
            manufacturer_contract_validity: manufacturer?.manufacturer_contract_validity?.slice(0, 10) || '',
            manufacturer_contract_url: manufacturer?.manufacturer_contract_url || '',
            manufacturer_exclusivity_letter_url: manufacturer?.manufacturer_exclusivity_letter_url || '',
            observation: manufacturer?.observation || '',
            id: entityId,
            contact_ids: initialContactIds,
            product_ids: initialProductIds,
        },
    })

    const handleFormSubmit = async (data: ManufacturerFormData) => {
        await onSubmit({
            ...data,
            type: 'manufacturer',
            phone: data.phone || null,
            tax_id: data.tax_id || null,
            website: data.website || null,
            manufacturer_contract_validity: data.manufacturer_contract_validity || null,
            manufacturer_contract_url: data.manufacturer_contract_url || null,
            manufacturer_exclusivity_letter_url: data.manufacturer_exclusivity_letter_url || null,
            observation: data.observation || null,
            id: entityId,
            contact_ids: selectedContactIds,
            product_ids: selectedProductIds,
        })
    }

    // Options configuration
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

    const productOptions = useMemo(() =>
        products
            .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
            .map(p => ({
                id: p.id,
                primaryText: p.name,
                secondaryText: p.ncm || undefined,
            })),
        [products, productSearch]
    )

    // Handlers
    const handleCreateContact = useCallback(async (data: Record<string, unknown>): Promise<string | null> => {
        const result = await createContact({
            name: data.name as string,
            email: (data.email as string) || null,
            phone: (data.phone as string) || null,
            observation: (data.observation as string) || null,
        })
        return result?.id || null
    }, [createContact])

    const handleCreateProduct = useCallback(async (data: Record<string, unknown>): Promise<string | null> => {
        const result = await createProduct({
            name: data.name as string,
            ncm: (data.ncm as string) || null,
            description: (data.description as string) || null,
        })
        return result?.id || null
    }, [createProduct])

    // Display helpers
    const getContactDisplay = useCallback((id: string): RelationalOption | undefined => {
        const contact = contacts.find(c => c.id === id)
        return contact ? { id: contact.id, primaryText: contact.name, secondaryText: contact.email || undefined } : undefined
    }, [contacts])

    const getProductDisplay = useCallback((id: string): RelationalOption | undefined => {
        const product = products.find(p => p.id === id)
        return product ? { id: product.id, primaryText: product.name, secondaryText: product.ncm || undefined } : undefined
    }, [products])

    // Nested config
    const nestedFieldsConfig: NestedFieldsConfig = useMemo(() => ({
        contact: {
            options: contactOptions,
            onSearch: setContactSearch,
            onCreate: handleCreateContact,
            onRefresh: refetchContacts,
            getRecordDisplay: getContactDisplay,
        },
        product: {
            options: productOptions,
            onSearch: setProductSearch,
            onCreate: handleCreateProduct,
            onRefresh: refetchProducts,
            getRecordDisplay: getProductDisplay,
        }
    }), [contactOptions, handleCreateContact, refetchContacts, getContactDisplay,
        productOptions, handleCreateProduct, refetchProducts, getProductDisplay])

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-1.5">
                    Manufacturer Name <span className="text-destructive">*</span>
                </label>
                <input
                    {...register('name')}
                    className="input"
                    placeholder="Manufacturer name"
                />
                {errors.name && (
                    <p className="text-destructive text-sm mt-1">{errors.name.message}</p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1.5">Tax ID</label>
                    <input
                        {...register('tax_id')}
                        className="input"
                        placeholder="Tax ID"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1.5">Phone</label>
                    <input
                        {...register('phone')}
                        className="input"
                        placeholder="+1 555 000-0000"
                    />
                </div>
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

            <div className="grid grid-cols-1 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1.5">Contract Validity</label>
                    <input
                        {...register('manufacturer_contract_validity')}
                        type="date"
                        className="input"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3">
                <input
                    {...register('manufacturer_exclusivity')}
                    type="checkbox"
                    id="manufacturer_exclusivity"
                    className="w-4 h-4 rounded border-input"
                />
                <label htmlFor="manufacturer_exclusivity" className="text-sm font-medium">
                    Has exclusivity agreement
                </label>
            </div>

            {/* Relations */}
            <div className="grid grid-cols-1 gap-4">
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
                            if (Array.isArray(val)) setSelectedContactIds(val)
                            else if (val === null) setSelectedContactIds([])
                            else setSelectedContactIds([val])
                        }}
                        options={contactOptions}
                        onSearch={setContactSearch}
                        onCreate={handleCreateContact}
                        onRefresh={refetchContacts}
                        getRecordDisplay={getContactDisplay}
                        canCreate
                        mode="multi"
                        nestedFieldsConfig={nestedFieldsConfig}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1.5">Products</label>
                    <RelationalField
                        entityType="product"
                        entityLabel="Product"
                        displayFields={['name']}
                        searchFields={['name', 'ncm']}
                        nestedFormSchema={productFormSchema}
                        value={selectedProductIds}
                        onChange={(val) => {
                            if (Array.isArray(val)) setSelectedProductIds(val)
                            else if (val === null) setSelectedProductIds([])
                            else setSelectedProductIds([val])
                        }}
                        options={productOptions}
                        onSearch={setProductSearch}
                        onCreate={handleCreateProduct}
                        onRefresh={refetchProducts}
                        getRecordDisplay={getProductDisplay}
                        canCreate
                        mode="multi"
                        nestedFieldsConfig={nestedFieldsConfig}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1.5">Notes</label>
                <textarea
                    {...register('observation')}
                    className="input min-h-[80px] resize-y"
                    placeholder="Additional notes..."
                />
            </div>
            <div className="pt-4 border-t">
                {/* Note: Using 'companies' as entityType for all company records including manufacturers */}
                <DocumentsList entityId={entityId} entityType="companies" />
            </div>

            <div className="flex gap-3 justify-end pt-4">
                <button
                    type="button"
                    onClick={async () => {
                        if (!manufacturer) {
                            // Clean up uploaded documents if cancelling creation
                            const { data: docs } = await supabase
                                .from('documents')
                                .select('file_url')
                                .eq('entity_id', entityId)
                                .eq('entity_type', 'companies')

                            if (docs && docs.length > 0) {
                                const fileUrls = docs.map(d => d.file_url)
                                await supabase.storage.from('documents').remove(fileUrls)
                                await supabase.from('documents').delete().eq('entity_id', entityId)
                            }
                        }
                        onCancel()
                    }}
                    className="btn-outline"
                >
                    Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="btn-primary">
                    {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : manufacturer ? (
                        'Save Changes'
                    ) : (
                        'Create Manufacturer'
                    )}
                </button>
            </div>
        </form >
    )
}
