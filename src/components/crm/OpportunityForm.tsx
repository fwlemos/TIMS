import { useState, useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, User, Package } from 'lucide-react'
import { RelationalField, NestedFieldsConfig, FormField, RelationalOption } from '@/components/shared/RelationalField'
import { useContacts } from '@/hooks/useContacts'
import { useCompanies } from '@/hooks/useCompanies'
import { useProducts } from '@/hooks/useProducts'

import type { InsertTables } from '@/lib/database.types'
import type { OpportunityWithRelations } from '@/hooks/useOpportunities'

const LEAD_ORIGIN_VALUES = ['website', 'social_media', 'email', 'phone_call', 'events', 'manufacturer', 'referral', 'other'] as const
type LeadOrigin = typeof LEAD_ORIGIN_VALUES[number]

const LEAD_ORIGINS: { value: LeadOrigin; label: string }[] = [
    { value: 'website', label: 'Website' },
    { value: 'social_media', label: 'Social Media' },
    { value: 'email', label: 'Email' },
    { value: 'phone_call', label: 'Phone Call' },
    { value: 'events', label: 'Events' },
    { value: 'manufacturer', label: 'Manufacturer' },
    { value: 'referral', label: 'Referral' },
    { value: 'other', label: 'Other' },
]

const opportunitySchema = z.object({
    title: z.string().optional(),
    lead_origin: z.enum(LEAD_ORIGIN_VALUES).optional().nullable(),
})

type OpportunityFormData = z.infer<typeof opportunitySchema>

interface OpportunityFormProps {
    opportunity?: OpportunityWithRelations | null
    onSubmit: (data: InsertTables<'opportunities'>) => Promise<void>
    onCancel: () => void
}

// Nested form schemas
const manufacturerFormSchema: FormField[] = [
    { name: 'name', label: 'Manufacturer Name', type: 'text', required: true, placeholder: 'Enter manufacturer name...' },
    { name: 'tax_id', label: 'Tax ID (CNPJ/EIN)', type: 'text', placeholder: 'Enter Tax ID' },
    { name: 'address', label: 'Address', type: 'text', placeholder: 'Enter full address' },
    { name: 'phone', label: 'Phone', type: 'tel', placeholder: '(00) 00000-0000' },
    { name: 'website', label: 'Website', type: 'url', placeholder: 'https://example.com' },
    { name: 'manufacturer_contract_validity', label: 'Contract Validity', type: 'date' },
    { name: 'manufacturer_exclusivity', label: 'Exclusivity Agreement', type: 'checkbox' },
    { name: 'observation', label: 'Observation', type: 'textarea', placeholder: 'Additional notes...' },
]

const companyFormSchema: FormField[] = [
    { name: 'name', label: 'Company Name', type: 'text', required: true, placeholder: 'Enter company name...' },
    { name: 'tax_id', label: 'Tax ID (CNPJ/EIN)', type: 'text', placeholder: 'Enter Tax ID' },
    { name: 'address', label: 'Address', type: 'text', placeholder: 'Enter full address' },
    { name: 'phone', label: 'Phone', type: 'tel', placeholder: '(00) 00000-0000' },
    { name: 'website', label: 'Website', type: 'url', placeholder: 'https://example.com' },
    { name: 'observation', label: 'Observation', type: 'textarea', placeholder: 'Additional notes...' },
]

// Contact form with nested Company field
const contactFormSchema: FormField[] = [
    { name: 'name', label: 'Contact Name', type: 'text', required: true, placeholder: 'Enter name...' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'email@example.com' },
    { name: 'phone', label: 'Phone', type: 'tel', placeholder: '(00) 00000-0000' },
    { name: 'observation', label: 'Observation', type: 'textarea', placeholder: 'Additional notes...' },
    {
        name: 'company_id',
        label: 'Company',
        type: 'relational',
        relationalConfig: {
            entityType: 'company',
            entityLabel: 'Company',
            displayFields: ['name'],
            searchFields: ['name'],
            nestedFormSchema: companyFormSchema,
        }
    },
]

// Product form with nested Manufacturer field
const productFormSchema: FormField[] = [
    { name: 'name', label: 'Product Name', type: 'text', required: true, placeholder: 'Enter product name...' },
    { name: 'technical_description', label: 'Technical Description', type: 'textarea', placeholder: 'Enter technical details...' },
    { name: 'ncm', label: 'NCM Code', type: 'text', placeholder: '0000.00.00' },
    {
        name: 'manufacturer_id',
        label: 'Manufacturer',
        type: 'relational',
        relationalConfig: {
            entityType: 'manufacturer',
            entityLabel: 'Manufacturer',
            displayFields: ['name'],
            searchFields: ['name'],
            nestedFormSchema: manufacturerFormSchema,
        }
    },
]

export function OpportunityForm({ opportunity, onSubmit }: OpportunityFormProps) {
    const { contacts, createContact, refetch: refetchContacts } = useContacts()
    const { companies, createCompany, refetch: refetchCompanies } = useCompanies()
    const { products, createProduct, refetch: refetchProducts } = useProducts()
    const { companies: manufacturers, createCompany: createManufacturer, refetch: refetchManufacturers } = useCompanies({ type: 'manufacturer' })

    // Selected IDs state
    const [selectedContactId, setSelectedContactId] = useState<string | null>(
        opportunity?.contact_id || null
    )
    const [selectedProductId, setSelectedProductId] = useState<string | null>(
        opportunity?.product_id || null
    )

    // Search states
    const [contactSearch, setContactSearch] = useState('')
    const [productSearch, setProductSearch] = useState('')
    const [companySearch, setCompanySearch] = useState('')
    const [manufacturerSearch, setManufacturerSearch] = useState('')

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<OpportunityFormData>({
        resolver: zodResolver(opportunitySchema),
        defaultValues: {
            title: opportunity?.title || '',
            lead_origin: opportunity?.lead_origin || null,
        },
    })

    const handleFormSubmit = async (data: OpportunityFormData) => {
        // Generate title from contact/product if not provided
        const contact = contacts.find(c => c.id === selectedContactId)
        const product = products.find(p => p.id === selectedProductId)
        const generatedTitle = data.title ||
            [contact?.name, product?.name].filter(Boolean).join(' - ') ||
            'New Opportunity'

        await onSubmit({
            title: generatedTitle,
            contact_id: selectedContactId,
            company_id: contact?.company_id || null, // Use company from contact
            product_id: selectedProductId,
            lead_origin: data.lead_origin || null,
        })
    }

    // Convert entities to RelationalOptions
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
            })),
        [products, productSearch]
    )

    const companyOptions = useMemo(() =>
        companies
            .filter(c => c.name.toLowerCase().includes(companySearch.toLowerCase()))
            .map(c => ({
                id: c.id,
                primaryText: c.name,
            })),
        [companies, companySearch]
    )

    const manufacturerOptions = useMemo(() =>
        manufacturers
            .filter(m => m.name.toLowerCase().includes(manufacturerSearch.toLowerCase()))
            .map(m => ({
                id: m.id,
                primaryText: m.name,
            })),
        [manufacturers, manufacturerSearch]
    )

    // Get display functions
    const getContactDisplay = useCallback((id: string): RelationalOption | undefined => {
        const contact = contacts.find(c => c.id === id)
        return contact ? { id: contact.id, primaryText: contact.name, secondaryText: contact.email || undefined } : undefined
    }, [contacts])

    const getProductDisplay = useCallback((id: string): RelationalOption | undefined => {
        const product = products.find(p => p.id === id)
        return product ? { id: product.id, primaryText: product.name } : undefined
    }, [products])

    const getCompanyDisplay = useCallback((id: string): RelationalOption | undefined => {
        const company = companies.find(c => c.id === id)
        return company ? { id: company.id, primaryText: company.name } : undefined
    }, [companies])

    const getManufacturerDisplay = useCallback((id: string): RelationalOption | undefined => {
        const manufacturer = manufacturers.find(m => m.id === id)
        return manufacturer ? { id: manufacturer.id, primaryText: manufacturer.name } : undefined
    }, [manufacturers])

    // Create handlers
    const handleCreateContact = useCallback(async (data: Record<string, unknown>): Promise<string | null> => {
        const result = await createContact({
            name: data.name as string,
            email: (data.email as string) || undefined,
            phone: (data.phone as string) || undefined,
            company_id: (data.company_id as string) || null,
        })
        return result?.id || null
    }, [createContact])

    const handleCreateProduct = useCallback(async (data: Record<string, unknown>): Promise<string | null> => {
        const result = await createProduct({
            name: data.name as string,
            manufacturer_id: (data.manufacturer_id as string) || null,
        })
        return result?.id || null
    }, [createProduct])

    const handleCreateCompany = useCallback(async (data: Record<string, unknown>): Promise<string | null> => {
        const result = await createCompany({ name: data.name as string })
        return result?.id || null
    }, [createCompany])

    const handleCreateManufacturer = useCallback(async (data: Record<string, unknown>): Promise<string | null> => {
        const result = await createManufacturer({
            name: data.name as string,
            type: 'manufacturer',
            // Map optional fields
            tax_id: (data.tax_id as string) || null,
            address: (data.address as string) || null,
            phone: (data.phone as string) || null,
            website: (data.website as string) || null,
            manufacturer_contract_validity: (data.manufacturer_contract_validity as string) || null,
            manufacturer_exclusivity: !!data.manufacturer_exclusivity,
            observation: (data.observation as string) || null,
        })
        return result?.id || null
    }, [createManufacturer])

    // Nested fields configuration for passing to RelationalField
    const nestedFieldsConfig: NestedFieldsConfig = useMemo(() => ({
        company: {
            options: companyOptions,
            onSearch: setCompanySearch,
            onCreate: handleCreateCompany,
            onRefresh: refetchCompanies,
            getRecordDisplay: getCompanyDisplay,
        },
        manufacturer: {
            options: manufacturerOptions,
            onSearch: setManufacturerSearch,
            onCreate: handleCreateManufacturer,
            onRefresh: refetchManufacturers,
            getRecordDisplay: getManufacturerDisplay,
        },
    }), [
        companyOptions, handleCreateCompany, refetchCompanies, getCompanyDisplay,
        manufacturerOptions, handleCreateManufacturer, refetchManufacturers, getManufacturerDisplay
    ])

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Title (Optional) */}
            <div>
                <label className="block text-sm font-medium mb-1.5">
                    Title <span className="text-muted-foreground text-xs">(optional)</span>
                </label>
                <input
                    {...register('title')}
                    className="input"
                    placeholder="Auto-generated from contact/product if empty"
                />
                {errors.title && (
                    <p className="text-destructive text-sm mt-1">{errors.title.message}</p>
                )}
            </div>

            {/* Contact - RelationalField with nested Company */}
            <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    Contact
                </label>
                <RelationalField
                    entityType="contact"
                    entityLabel="Contact"
                    displayFields={['name', 'email']}
                    searchFields={['name', 'email', 'phone']}
                    nestedFormSchema={contactFormSchema}
                    value={selectedContactId}
                    onChange={setSelectedContactId}
                    options={contactOptions}
                    onSearch={setContactSearch}
                    onCreate={handleCreateContact}
                    onRefresh={refetchContacts}
                    getRecordDisplay={getContactDisplay}
                    canCreate
                    nestedFieldsConfig={nestedFieldsConfig}
                />
            </div>

            {/* Product - RelationalField with nested Manufacturer */}
            <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    Product
                </label>
                <RelationalField
                    entityType="product"
                    entityLabel="Product"
                    displayFields={['name']}
                    searchFields={['name']}
                    nestedFormSchema={productFormSchema}
                    value={selectedProductId}
                    onChange={setSelectedProductId}
                    options={productOptions}
                    onSearch={setProductSearch}
                    onCreate={handleCreateProduct}
                    onRefresh={refetchProducts}
                    getRecordDisplay={getProductDisplay}
                    canCreate
                    nestedFieldsConfig={nestedFieldsConfig}
                />
            </div>

            {/* Lead Origin */}
            <div>
                <label className="block text-sm font-medium mb-1.5">Lead Origin</label>
                <select {...register('lead_origin')} className="input">
                    <option value="">Select origin...</option>
                    {LEAD_ORIGINS.map((origin) => (
                        <option key={origin.value} value={origin.value}>
                            {origin.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Submit */}
            <div className="sticky bottom-0 bg-card pt-4 pb-2 -mb-2 border-t border-border mt-6">
                <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                    {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : opportunity ? (
                        'Save Changes'
                    ) : (
                        'Create Opportunity'
                    )}
                </button>
            </div>
        </form>
    )
}
