import { useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { User, Building2, Package, Factory, UserCircle, Loader2, Check } from 'lucide-react'
import { RelationalField, NestedFieldsConfig, RelationalOption } from '@/components/shared/RelationalField'
import { useContacts } from '@/hooks/useContacts'
import { useCompanies } from '@/hooks/useCompanies'
import { useProducts } from '@/hooks/useProducts'
import { useUsers } from '@/hooks/useUsers'
import { contactFormSchema, companyFormSchema, productFormSchema } from '@/constants/schemas'
import { logger } from '@/utils/logger'
import type { OpportunityWithRelations } from '../../../types'

interface OpportunityRelatedProps {
    opportunity: OpportunityWithRelations
    isTerminal: boolean
    updateContact: (contactId: string | null) => Promise<any>
    updateCompany: (companyId: string | null) => Promise<any>
    addProduct: (productId: string) => Promise<any>
    removeProduct: (productId: string) => Promise<any>
    updateOpportunity: (updates: Partial<any>) => Promise<any>
}

export function OpportunityRelated({
    opportunity,
    isTerminal,
    updateContact,
    updateCompany,
    addProduct,
    removeProduct,
    updateOpportunity
}: OpportunityRelatedProps) {
    // Entity hooks
    const { contacts, createContact, updateContact: updateContactRecord, refetch: refetchContacts } = useContacts()
    const { companies, createCompany, updateCompany: updateCompanyRecord, refetch: refetchCompanies } = useCompanies()
    const { products, createProduct, updateProduct: updateProductRecord, refetch: refetchProducts } = useProducts()
    const { companies: manufacturers, createCompany: createManufacturer, updateCompany: updateManufacturerRecord, refetch: refetchManufacturers } = useCompanies({ type: 'manufacturer' })
    const { users } = useUsers()

    // Search states
    const [contactSearch, setContactSearch] = useState('')
    const [companySearch, setCompanySearch] = useState('')
    const [productSearch, setProductSearch] = useState('')
    const [manufacturerSearch, setManufacturerSearch] = useState('')

    // Saving states
    const [savingField, setSavingField] = useState<string | null>(null)
    const [savedField, setSavedField] = useState<string | null>(null)

    // Helper for async updates with feedback
    const handleUpdate = async (field: string, action: () => Promise<any>) => {
        setSavingField(field)
        try {
            await action()
            setSavedField(field)
            setTimeout(() => setSavedField(null), 1500)
        } catch (err) {
            logger.error(`Error updating ${field}:`, { error: err })
        } finally {
            setSavingField(null)
        }
    }

    // Opportunity Link Handlers
    const handleContactChange = useCallback((value: string | string[] | null) => {
        const contactId = Array.isArray(value) ? value[0] : value
        handleUpdate('contact', () => updateContact(contactId || null))
    }, [updateContact])

    const handleCompanyChange = useCallback((value: string | string[] | null) => {
        // This is not typically manually changed if linked to contact, but IF we want to allow it:
        // Actually the current OpportunityDetail "Company" display is read-only from contact?
        // Checking original code: It has a disabled input showing opportunity.contact?.company?.name
        // So this handler might not be needed for direct company assignment if the logic is strict.
        // BUT the RelationalField logic in original code was: 
        // label: Company (From Contact) -> Input is valid.
        // So we keep the helper but maybe not expose a RelationalField for it if it's purely derived.
        // Wait, looking at lines 767-775: It's just a display div. "No company associated".
        // So NO RelationalField for Company directly on Opportunity.
    }, [])

    const handleProductsChange = useCallback(async (value: string | string[] | null) => {
        const newProductIds = Array.isArray(value) ? value : (value ? [value] : [])
        const currentProductIds = opportunity.products?.map(p => p.id) || []

        setSavingField('products')
        try {
            // Find products to add
            for (const id of newProductIds) {
                if (!currentProductIds.includes(id)) {
                    await addProduct(id)
                }
            }
            // Find products to remove
            for (const id of currentProductIds) {
                if (!newProductIds.includes(id)) {
                    await removeProduct(id)
                }
            }
            setSavedField('products')
            setTimeout(() => setSavedField(null), 1500)
        } catch (err) {
            logger.error('Error updating products:', { error: err })
        } finally {
            setSavingField(null)
        }
    }, [opportunity, addProduct, removeProduct])

    const handleResponsibleChange = useCallback((userId: string | null) => {
        handleUpdate('responsible', () => updateOpportunity({ assigned_to: userId }))
    }, [updateOpportunity])

    // Options Memos
    const contactOptions = useMemo(() =>
        contacts
            .filter(c => c.name.toLowerCase().includes(contactSearch.toLowerCase()))
            .map(c => {
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

    const companyOptions = useMemo(() =>
        companies
            .filter(c => c.name.toLowerCase().includes(companySearch.toLowerCase()))
            .map(c => {
                const companyWithDetails = c as typeof c & { phone?: string; address?: string }
                return {
                    id: c.id,
                    primaryText: c.name,
                    secondaryText: companyWithDetails.phone || companyWithDetails.address || undefined,
                }
            }),
        [companies, companySearch]
    )

    const productOptions = useMemo(() =>
        products
            .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
            .map(p => {
                const productWithManufacturer = p as typeof p & { manufacturer?: { name: string } | null }
                return {
                    id: p.id,
                    primaryText: p.name,
                    secondaryText: productWithManufacturer.manufacturer?.name || 'No Manufacturer',
                }
            }),
        [products, productSearch]
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

    // Display getters
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
            ),
            href: `/database/contact/${contact.id}`
        }
    }, [contacts])

    const getCompanyDisplay = useCallback((id: string): RelationalOption | undefined => {
        const company = companies.find(c => c.id === id)
        if (!company) return undefined
        const companyWithDetails = company as typeof company & { phone?: string; address?: string }
        return {
            id: company.id,
            primaryText: company.name,
            secondaryText: companyWithDetails.phone || companyWithDetails.address || undefined
        }
    }, [companies])

    const getProductDisplay = useCallback((id: string): RelationalOption | undefined => {
        const product = products.find(p => p.id === id)
        if (!product) return undefined
        const productWithManufacturer = product as typeof product & { manufacturer?: { name: string } | null }
        return {
            id: product.id,
            primaryText: product.name,
            secondaryText: productWithManufacturer.manufacturer?.name || 'No Manufacturer',
            href: `/database/product/${product.id}`
        }
    }, [products])

    const getManufacturerDisplay = useCallback((id: string): RelationalOption | undefined => {
        const manufacturer = manufacturers.find(m => m.id === id)
        return manufacturer ? { id: manufacturer.id, primaryText: manufacturer.name } : undefined
    }, [manufacturers])

    // Creation Handlers - Simplified wrappers
    const handleCreateContact = async (data: Record<string, unknown>) => (await createContact(data as any))?.id || null
    const handleCreateCompany = async (data: Record<string, unknown>) => (await createCompany({ name: data.name as string }))?.id || null
    const handleCreateProduct = async (data: Record<string, unknown>) => (await createProduct(data as any))?.id || null
    const handleCreateManufacturer = async (data: Record<string, unknown>) => (await createManufacturer({ name: data.name as string, type: 'manufacturer' }))?.id || null

    // Edit Handlers
    const handleEditContact = async (id: string, data: Record<string, unknown>) => updateContactRecord(id, data as any)
    const handleEditCompany = async (id: string, data: Record<string, unknown>) => updateCompanyRecord(id, data as any)
    const handleEditProduct = async (id: string, data: Record<string, unknown>) => updateProductRecord(id, data as any)
    const handleEditManufacturer = async (id: string, data: Record<string, unknown>) => updateManufacturerRecord(id, data as any)

    // Record Data Getters
    const getContactRecordData = useCallback((id: string) => {
        const c = contacts.find(c => c.id === id)
        return c ? { name: c.name, email: c.email, phone: c.phone, company_id: (c as any).company_id } : undefined
    }, [contacts])

    const getCompanyRecordData = useCallback((id: string) => {
        const c = companies.find(c => c.id === id)
        return c ? { name: c.name, tax_id: c.tax_id, address: c.address, phone: c.phone, website: c.website } : undefined
    }, [companies])

    const getProductRecordData = useCallback((id: string) => {
        const p = products.find(p => p.id === id)
        return p ? { name: p.name, manufacturer_id: p.manufacturer_id } : undefined
    }, [products])

    const getManufacturerRecordData = useCallback((id: string) => {
        const m = manufacturers.find(m => m.id === id)
        return m ? { name: m.name, tax_id: m.tax_id, address: m.address, phone: m.phone, website: m.website } : undefined
    }, [manufacturers])


    // Nested Config
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
        companyOptions, refetchCompanies, getCompanyDisplay, handleEditCompany, getCompanyRecordData,
        manufacturerOptions, refetchManufacturers, getManufacturerDisplay, handleEditManufacturer, getManufacturerRecordData
    ])

    const selectedProductIds = opportunity.products?.map(p => p.id) || []

    return (
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">Related Entities</h3>
            <div className="space-y-5">
                {/* Contact */}
                <div>
                    <label className="block text-sm font-medium mb-1.5 flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" /> Contact
                        {savingField === 'contact' && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground ml-2" />}
                        {savedField === 'contact' && <Check className="w-3 h-3 text-success ml-2" />}
                    </label>
                    <RelationalField
                        entityType="contact"
                        entityLabel="Contact"
                        displayFields={['name', 'email']}
                        searchFields={['name', 'email', 'phone']}
                        nestedFormSchema={contactFormSchema}
                        value={opportunity.contact_id}
                        onChange={handleContactChange}
                        options={contactOptions}
                        onSearch={setContactSearch}
                        onCreate={handleCreateContact}
                        onRefresh={refetchContacts}
                        getRecordDisplay={getContactDisplay}
                        nestedFieldsConfig={nestedFieldsConfig}
                        disabled={isTerminal}
                        canCreate
                        canEdit
                        onEdit={handleEditContact}
                        getRecordData={getContactRecordData}
                    />
                </div>

                {/* Derived Company */}
                <div>
                    <label className="block text-sm font-medium mb-1.5 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" /> Company <span className="text-xs font-normal text-muted-foreground">(From Contact)</span>
                    </label>
                    {opportunity.contact?.company?.id ? (
                        <Link
                            to={`/database/company/${opportunity.contact.company.id}`}
                            className="input w-full bg-muted/50 text-muted-foreground flex items-center min-h-[42px] hover:text-primary hover:border-primary/50 transition-colors"
                        >
                            {opportunity.contact.company.name}
                        </Link>
                    ) : (
                        <div className="input w-full bg-muted/50 text-muted-foreground flex items-center min-h-[42px]">
                            {opportunity.contact?.company?.name || 'No company associated'}
                        </div>
                    )}
                </div>

                {/* Products */}
                <div>
                    <label className="block text-sm font-medium mb-1.5 flex items-center gap-2">
                        <Package className="w-4 h-4 text-muted-foreground" /> Products
                        {savingField === 'products' && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground ml-2" />}
                        {savedField === 'products' && <Check className="w-3 h-3 text-success ml-2" />}
                    </label>
                    <RelationalField
                        entityType="product"
                        entityLabel="Products"
                        displayFields={['name', 'ncm']}
                        searchFields={['name', 'ncm']}
                        nestedFormSchema={productFormSchema}
                        value={selectedProductIds}
                        onChange={handleProductsChange}
                        options={productOptions}
                        onSearch={setProductSearch}
                        onCreate={handleCreateProduct}
                        onRefresh={refetchProducts}
                        getRecordDisplay={getProductDisplay}
                        nestedFieldsConfig={nestedFieldsConfig}
                        disabled={isTerminal}
                        canCreate
                        mode="multi"
                        displayMode="pill"
                        canEdit
                        onEdit={handleEditProduct}
                        getRecordData={getProductRecordData}
                    />
                </div>

                {/* Derived Manufacturers */}
                <div>
                    <label className="block text-sm font-medium mb-1.5 flex items-center gap-2">
                        <Factory className="w-4 h-4 text-muted-foreground" /> Manufacturers <span className="text-xs font-normal text-muted-foreground ml-auto">(From Products)</span>
                    </label>
                    <div className="bg-muted/50 rounded-lg p-3 min-h-[42px] border border-input text-sm">
                        {opportunity.products && opportunity.products.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {Array.from(new Set(opportunity.products.flatMap(p =>
                                    p.manufacturer ? JSON.stringify({ id: p.manufacturer.id, name: p.manufacturer.name }) : []
                                ))).map(json => JSON.parse(json)).map((m, i) => (
                                    <Link
                                        key={i}
                                        to={`/database/manufacturer/${m.id}`}
                                        className="bg-background border rounded px-1.5 py-0.5 text-xs font-medium hover:text-primary hover:border-primary/50 transition-colors"
                                    >
                                        {m.name}
                                    </Link>
                                ))}
                                {opportunity.products.every(p => !p.manufacturer) && <span className="text-muted-foreground italic">No manufacturers found</span>}
                            </div>
                        ) : (<span className="text-muted-foreground italic">No products selected</span>)}
                    </div>
                </div>

                {/* Responsible */}
                <div>
                    <label className="block text-sm font-medium mb-1.5 flex items-center gap-2">
                        <UserCircle className="w-4 h-4 text-muted-foreground" />
                        Responsible
                        {savingField === 'responsible' && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground ml-2" />}
                        {savedField === 'responsible' && <Check className="w-3 h-3 text-success ml-2" />}
                    </label>
                    <select
                        value={opportunity.assigned_to || ''}
                        onChange={(e) => handleResponsibleChange(e.target.value || null)}
                        disabled={isTerminal}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <option value="">Unassigned</option>
                        {users.map(user => (
                            <option key={user.id} value={user.id}>
                                {user.name} ({user.email})
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    )
}
