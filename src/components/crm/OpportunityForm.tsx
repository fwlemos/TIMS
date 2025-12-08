import { useState, useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, User, Package, Building2 } from 'lucide-react'
import { RelationalField, NestedFieldsConfig, FormField, RelationalOption } from '@/components/shared/RelationalField'
import { useContacts } from '@/hooks/useContacts'
import { useCompanies } from '@/hooks/useCompanies'
import { useProducts } from '@/hooks/useProducts'
import { useUsers } from '@/hooks/useUsers'

import { LEAD_ORIGIN_VALUES, LEAD_ORIGIN_OPTIONS } from '@/constants/options'
import { logger } from '@/utils/logger'
import { manufacturerFormSchema, companyFormSchema, contactFormSchema, productFormSchema } from '@/constants/schemas'
import type { InsertTables } from '@/lib/database.types'
import type { OpportunityWithRelations } from '@/hooks/useOpportunities'

type LeadOrigin = typeof LEAD_ORIGIN_VALUES[number]

const opportunitySchema = z.object({
    title: z.string().optional(),
    lead_origin: z.enum(LEAD_ORIGIN_VALUES, { required_error: 'Lead origin is required' }),
    assigned_to: z.string().optional(),
})

type OpportunityFormData = z.infer<typeof opportunitySchema>

interface OpportunityFormProps {
    opportunity?: OpportunityWithRelations | null
    onSubmit: (data: InsertTables<'opportunities'>) => Promise<void>
    onCancel: () => void
}

// Nested form schemas


export function OpportunityForm({ opportunity, onSubmit }: OpportunityFormProps) {
    const { contacts, createContact, updateContact, refetch: refetchContacts } = useContacts()
    const { companies, createCompany, updateCompany, refetch: refetchCompanies } = useCompanies()
    const { products, createProduct, updateProduct, refetch: refetchProducts } = useProducts()
    const { companies: manufacturers, createCompany: createManufacturer, updateCompany: updateManufacturer, refetch: refetchManufacturers } = useCompanies({ type: 'manufacturer' })
    const { users, currentUser, loading: usersLoading } = useUsers()

    // Selected IDs state
    const [selectedContactId, setSelectedContactId] = useState<string | null>(
        opportunity?.contact_id || null
    )
    // Multi-product support
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
        opportunity?.products?.map(p => p.id) || (opportunity?.product_id ? [opportunity.product_id] : [])
    )

    // Validation error states for required fields not in the form schema
    const [contactError, setContactError] = useState<string | null>(null)
    const [productError, setProductError] = useState<string | null>(null)

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
            lead_origin: opportunity?.lead_origin || undefined,
            assigned_to: opportunity?.assigned_to || currentUser?.id || undefined,
        },
    })


    const handleFormSubmit = async (data: OpportunityFormData) => {
        // Validate required fields not in the form schema
        let hasErrors = false

        if (!selectedContactId) {
            setContactError('Contact is required')
            hasErrors = true
        } else {
            setContactError(null)
        }

        if (selectedProductIds.length === 0) {
            setProductError('At least one product is required')
            hasErrors = true
        } else {
            setProductError(null)
        }

        if (hasErrors) return

        try {
            // Generate title from contact/products if not provided
            const contact = contacts.find(c => c.id === selectedContactId)
            const firstProduct = products.find(p => p.id === selectedProductIds[0])
            const generatedTitle = data.title ||
                [contact?.name, firstProduct?.name].filter(Boolean).join(' - ') ||
                'New Opportunity'

            // Pass first product as legacy product_id, full list in metadata for now
            // The CRM page will handle adding products to junction table after creation
            await onSubmit({
                title: generatedTitle,
                contact_id: selectedContactId,
                company_id: contact?.company_id || null,
                product_id: selectedProductIds[0] || null, // Legacy field
                lead_origin: data.lead_origin,
                assigned_to: data.assigned_to || null,
                // Store additional product IDs in metadata for the parent to handle
                metadata: selectedProductIds.length > 1 ? { additional_product_ids: selectedProductIds.slice(1) } : undefined,
            })
        } catch (error) {
            logger.error('OpportunityForm submit error:', { error })
            throw error
        }
    }

    // Convert entities to RelationalOptions
    const contactOptions = useMemo(() =>
        contacts
            .filter(c => c.name.toLowerCase().includes(contactSearch.toLowerCase()))
            .map(c => {
                // Type assertion for nested company data
                const contactWithCompany = c as typeof c & { company?: { name: string } | null }
                const companyName = contactWithCompany.company?.name
                return {
                    id: c.id,
                    primaryText: c.name,
                    secondaryText: (
                        <div className="flex flex-col gap-0.5">
                            {c.email && <span className="truncate">{c.email}</span>}
                            {companyName && (
                                <span className="flex items-center gap-1.5 opacity-90">
                                    <Building2 className="w-3 h-3" />
                                    <span className="truncate">{companyName}</span>
                                </span>
                            )}
                        </div>
                    ),
                }
            }),
        [contacts, contactSearch]
    )

    const productOptions = useMemo(() =>
        products
            .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
            .map(p => {
                // Type assertion for nested manufacturer data
                const productWithManufacturer = p as typeof p & { manufacturer?: { name: string } | null }
                return {
                    id: p.id,
                    primaryText: p.name,
                    secondaryText: productWithManufacturer.manufacturer?.name || 'No Manufacturer',
                }
            }),
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
        if (!contact) return undefined

        const contactWithCompany = contact as typeof contact & { company?: { name: string } | null }
        const companyName = contactWithCompany.company?.name

        return {
            id: contact.id,
            primaryText: contact.name,
            secondaryText: (
                <div className="flex flex-col gap-0.5">
                    {contact.email && <span className="truncate">{contact.email}</span>}
                    {companyName && (
                        <span className="flex items-center gap-1.5 opacity-90">
                            <Building2 className="w-3 h-3" />
                            <span className="truncate">{companyName}</span>
                        </span>
                    )}
                </div>
            )
        }
    }, [contacts])

    const getProductDisplay = useCallback((id: string): RelationalOption | undefined => {
        const product = products.find(p => p.id === id)
        if (!product) return undefined

        const productWithManufacturer = product as typeof product & { manufacturer?: { name: string } | null }

        return {
            id: product.id,
            primaryText: product.name,
            secondaryText: productWithManufacturer.manufacturer?.name || 'No Manufacturer'
        }
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

    // Edit handlers
    const handleEditContact = useCallback(async (id: string, data: Record<string, unknown>): Promise<void> => {
        await updateContact(id, {
            name: data.name as string,
            email: (data.email as string) || null,
            phone: (data.phone as string) || null,
            company_id: (data.company_id as string) || null,
            observation: (data.observation as string) || null,
        })
    }, [updateContact])

    const handleEditProduct = useCallback(async (id: string, data: Record<string, unknown>): Promise<void> => {
        await updateProduct(id, {
            name: data.name as string,
            manufacturer_id: (data.manufacturer_id as string) || null,
            description: (data.technical_description as string) || null,
            ncm: (data.ncm as string) || null,
        })
    }, [updateProduct])

    const handleEditCompany = useCallback(async (id: string, data: Record<string, unknown>): Promise<void> => {
        await updateCompany(id, {
            name: data.name as string,
            tax_id: (data.tax_id as string) || null,
            address: (data.address as string) || null,
            phone: (data.phone as string) || null,
            website: (data.website as string) || null,
        })
    }, [updateCompany])

    const handleEditManufacturer = useCallback(async (id: string, data: Record<string, unknown>): Promise<void> => {
        await updateManufacturer(id, {
            name: data.name as string,
            tax_id: (data.tax_id as string) || null,
            address: (data.address as string) || null,
            phone: (data.phone as string) || null,
            website: (data.website as string) || null,
        })
    }, [updateManufacturer])

    // Record data getters
    const getContactRecordData = useCallback((id: string): Record<string, unknown> | undefined => {
        const contact = contacts.find(c => c.id === id)
        if (!contact) return undefined
        return {
            name: contact.name,
            email: contact.email || '',
            phone: contact.phone || '',
            company_id: contact.company_id || '',
            observation: contact.observation || '',
        }
    }, [contacts])

    const getProductRecordData = useCallback((id: string): Record<string, unknown> | undefined => {
        const product = products.find(p => p.id === id)
        if (!product) return undefined
        return {
            name: product.name,
            manufacturer_id: product.manufacturer_id || '',
            technical_description: product.description || '',
            ncm: product.ncm || '',
        }
    }, [products])

    const getCompanyRecordData = useCallback((id: string): Record<string, unknown> | undefined => {
        const company = companies.find(c => c.id === id)
        if (!company) return undefined
        return {
            name: company.name,
            tax_id: company.tax_id || '',
            address: company.address || '',
            phone: company.phone || '',
            website: company.website || '',
        }
    }, [companies])

    const getManufacturerRecordData = useCallback((id: string): Record<string, unknown> | undefined => {
        const manufacturer = manufacturers.find(m => m.id === id)
        if (!manufacturer) return undefined
        return {
            name: manufacturer.name,
            tax_id: manufacturer.tax_id || '',
            address: manufacturer.address || '',
            phone: manufacturer.phone || '',
            website: manufacturer.website || '',
        }
    }, [manufacturers])

    // Nested fields configuration for passing to RelationalField
    const nestedFieldsConfig: NestedFieldsConfig = useMemo(() => ({
        company: {
            options: companyOptions,
            onSearch: setCompanySearch,
            onCreate: handleCreateCompany,
            onRefresh: refetchCompanies,
            getRecordDisplay: getCompanyDisplay,
            canEdit: true,
            onEdit: handleEditCompany,
            getRecordData: getCompanyRecordData,
        },
        manufacturer: {
            options: manufacturerOptions,
            onSearch: setManufacturerSearch,
            onCreate: handleCreateManufacturer,
            onRefresh: refetchManufacturers,
            getRecordDisplay: getManufacturerDisplay,
            canEdit: true,
            onEdit: handleEditManufacturer,
            getRecordData: getManufacturerRecordData,
        },
    }), [
        companyOptions, handleCreateCompany, refetchCompanies, getCompanyDisplay, handleEditCompany, getCompanyRecordData,
        manufacturerOptions, handleCreateManufacturer, refetchManufacturers, getManufacturerDisplay, handleEditManufacturer, getManufacturerRecordData
    ])

    const onFormError = (errors: Record<string, unknown>) => {
        logger.error('Form validation errors:', { errors })
    }

    return (
        <form onSubmit={handleSubmit(handleFormSubmit, onFormError)} className="space-y-6">
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

            {/* Responsible */}
            <div>
                <label className="block text-sm font-medium mb-1.5">
                    Responsible <span className="text-destructive">*</span>
                </label>
                <select
                    {...register('assigned_to')}
                    className="input"
                    disabled={usersLoading}
                >
                    <option value="">Select responsible...</option>
                    {users.map((user) => (
                        <option key={user.id} value={user.id}>
                            {user.name} {currentUser?.id === user.id ? '(You)' : ''}
                        </option>
                    ))}
                </select>
                {errors.assigned_to && (
                    <p className="text-destructive text-sm mt-1">{errors.assigned_to.message}</p>
                )}
            </div>

            {/* Contact - RelationalField with nested Company */}
            <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    Contact <span className="text-destructive">*</span>
                </label>
                <RelationalField
                    entityType="contact"
                    entityLabel="Contact"
                    displayFields={['name', 'email']}
                    searchFields={['name', 'email', 'phone']}
                    nestedFormSchema={contactFormSchema}
                    value={selectedContactId}
                    onChange={(val) => {
                        setSelectedContactId(val as string | null)
                        if (val) setContactError(null)
                    }}
                    options={contactOptions}
                    onSearch={setContactSearch}
                    onCreate={handleCreateContact}
                    onRefresh={refetchContacts}
                    getRecordDisplay={getContactDisplay}
                    canCreate
                    canEdit
                    onEdit={handleEditContact}
                    getRecordData={getContactRecordData}
                    nestedFieldsConfig={nestedFieldsConfig}
                />
                {contactError && (
                    <p className="text-destructive text-sm mt-1">{contactError}</p>
                )}
            </div>

            {/* Product - RelationalField with nested Manufacturer (Multi-select) */}
            <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    Products <span className="text-destructive">*</span>
                </label>
                <RelationalField
                    entityType="product"
                    entityLabel="Product"
                    displayFields={['name']}
                    searchFields={['name']}
                    nestedFormSchema={productFormSchema}
                    mode="multi"
                    value={selectedProductIds}
                    onChange={(val) => {
                        const ids = Array.isArray(val) ? val : (val ? [val] : [])
                        setSelectedProductIds(ids)
                        if (ids.length > 0) setProductError(null)
                    }}
                    options={productOptions}
                    onSearch={setProductSearch}
                    onCreate={handleCreateProduct}
                    onRefresh={refetchProducts}
                    getRecordDisplay={getProductDisplay}
                    canCreate
                    canEdit
                    onEdit={handleEditProduct}
                    getRecordData={getProductRecordData}
                    nestedFieldsConfig={nestedFieldsConfig}
                />
                {productError && (
                    <p className="text-destructive text-sm mt-1">{productError}</p>
                )}
            </div>

            {/* Lead Origin */}
            <div>
                <label className="block text-sm font-medium mb-1.5">
                    Lead Origin <span className="text-destructive">*</span>
                </label>
                <select {...register('lead_origin')} className="input">
                    <option value="">Select origin...</option>
                    {LEAD_ORIGIN_OPTIONS.map((origin) => (
                        <option key={origin.value} value={origin.value}>
                            {origin.label}
                        </option>
                    ))}
                </select>
                {errors.lead_origin && (
                    <p className="text-destructive text-sm mt-1">{errors.lead_origin.message}</p>
                )}
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
