import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Calendar, XCircle, Loader2, User, Building2, Package, Check } from 'lucide-react'
import { useState, useCallback, useMemo } from 'react'
import { useOpportunityDetail } from '@/hooks/useOpportunityDetail'
import { StageBreadcrumb } from '@/components/opportunity/StageBreadcrumb'
import { LostReasonModal } from '@/components/crm/LostReasonModal'
import { RelationalField, FormField, NestedFieldsConfig, RelationalOption } from '@/components/shared/RelationalField'
import { useContacts } from '@/hooks/useContacts'
import { useCompanies } from '@/hooks/useCompanies'
import { useProducts } from '@/hooks/useProducts'

const LEAD_ORIGIN_OPTIONS = [
    { value: 'website', label: 'Website' },
    { value: 'social_media', label: 'Social Media' },
    { value: 'email', label: 'Email' },
    { value: 'phone_call', label: 'Phone Call' },
    { value: 'events', label: 'Events' },
    { value: 'manufacturer', label: 'Manufacturer' },
    { value: 'referral', label: 'Referral' },
    { value: 'other', label: 'Other' },
]

const OFFICE_OPTIONS = [
    { value: 'brazil', label: 'Brazil' },
    { value: 'usa', label: 'USA' },
]

// Form schemas for nested entity creation (same as OpportunityForm)
const manufacturerFormSchema: FormField[] = [
    { name: 'name', label: 'Manufacturer Name', type: 'text', required: true, placeholder: 'Enter manufacturer name...' },
    { name: 'tax_id', label: 'Tax ID (CNPJ/EIN)', type: 'text', placeholder: 'Enter Tax ID' },
    { name: 'address', label: 'Address', type: 'text', placeholder: 'Enter full address' },
    { name: 'phone', label: 'Phone', type: 'tel', placeholder: '(00) 00000-0000' },
    { name: 'website', label: 'Website', type: 'url', placeholder: 'https://example.com' },
]

const companyFormSchema: FormField[] = [
    { name: 'name', label: 'Company Name', type: 'text', required: true, placeholder: 'Enter company name...' },
    { name: 'tax_id', label: 'Tax ID (CNPJ/EIN)', type: 'text', placeholder: 'Enter Tax ID' },
    { name: 'address', label: 'Address', type: 'text', placeholder: 'Enter full address' },
    { name: 'phone', label: 'Phone', type: 'tel', placeholder: '(00) 00000-0000' },
    { name: 'website', label: 'Website', type: 'url', placeholder: 'https://example.com' },
]

const contactFormSchema: FormField[] = [
    { name: 'name', label: 'Contact Name', type: 'text', required: true, placeholder: 'Enter name...' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'email@example.com' },
    { name: 'phone', label: 'Phone', type: 'tel', placeholder: '(00) 00000-0000' },
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

export default function OpportunityDetail() {
    const { opportunityId } = useParams<{ opportunityId: string }>()
    const navigate = useNavigate()
    const {
        opportunity,
        stages,
        loading,
        error,
        updateOpportunity,
        updateStage,
        updateContact,
        updateCompany,
        addProduct,
        removeProduct,
    } = useOpportunityDetail(opportunityId)

    // Entity hooks for RelationalFields
    const { contacts, createContact, refetch: refetchContacts } = useContacts()
    const { companies, createCompany, refetch: refetchCompanies } = useCompanies()
    const { products, createProduct, refetch: refetchProducts } = useProducts()
    const { companies: manufacturers, createCompany: createManufacturer, refetch: refetchManufacturers } = useCompanies({ type: 'manufacturer' })

    // Search states
    const [contactSearch, setContactSearch] = useState('')
    const [companySearch, setCompanySearch] = useState('')
    const [productSearch, setProductSearch] = useState('')
    const [manufacturerSearch, setManufacturerSearch] = useState('')

    const [showLostModal, setShowLostModal] = useState(false)
    const [savingField, setSavingField] = useState<string | null>(null)
    const [savedField, setSavedField] = useState<string | null>(null)

    // Calculate days since creation
    const getDaysOpen = () => {
        if (!opportunity) return 0
        const created = new Date(opportunity.created_at)
        const now = new Date()
        const diffTime = Math.abs(now.getTime() - created.getTime())
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    // Generic field update handler with visual feedback
    const handleFieldChange = useCallback(async (fieldName: string, value: unknown) => {
        if (!opportunity) return

        setSavingField(fieldName)
        try {
            await updateOpportunity({ [fieldName]: value })
            setSavedField(fieldName)
            setTimeout(() => setSavedField(null), 1500)
        } catch (err) {
            console.error(`Error saving ${fieldName}:`, err)
        } finally {
            setSavingField(null)
        }
    }, [opportunity, updateOpportunity])

    // Entity update handlers with auto-save
    const handleContactChange = useCallback(async (value: string | string[] | null) => {
        const contactId = Array.isArray(value) ? value[0] : value
        setSavingField('contact')
        try {
            await updateContact(contactId || null)
            setSavedField('contact')
            setTimeout(() => setSavedField(null), 1500)
        } catch (err) {
            console.error('Error updating contact:', err)
        } finally {
            setSavingField(null)
        }
    }, [updateContact])

    const handleCompanyChange = useCallback(async (value: string | string[] | null) => {
        const companyId = Array.isArray(value) ? value[0] : value
        setSavingField('company')
        try {
            await updateCompany(companyId || null)
            setSavedField('company')
            setTimeout(() => setSavedField(null), 1500)
        } catch (err) {
            console.error('Error updating company:', err)
        } finally {
            setSavingField(null)
        }
    }, [updateCompany])

    const handleProductsChange = useCallback(async (value: string | string[] | null) => {
        if (!opportunity) return

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
            console.error('Error updating products:', err)
        } finally {
            setSavingField(null)
        }
    }, [opportunity, addProduct, removeProduct])

    const handleMarkAsLost = async (reason: string) => {
        const lostStage = stages.find(s => s.name.toLowerCase().includes('lost'))
        if (lostStage) {
            await updateOpportunity({
                stage_id: lostStage.id,
                lost_reason: reason,
            })
        }
        setShowLostModal(false)
    }

    const handleStageChange = async (newStageId: string) => {
        await updateStage(newStageId)
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

    const companyOptions = useMemo(() =>
        companies
            .filter(c => c.name.toLowerCase().includes(companySearch.toLowerCase()))
            .map(c => ({
                id: c.id,
                primaryText: c.name,
            })),
        [companies, companySearch]
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

    const getCompanyDisplay = useCallback((id: string): RelationalOption | undefined => {
        const company = companies.find(c => c.id === id)
        return company ? { id: company.id, primaryText: company.name } : undefined
    }, [companies])

    const getProductDisplay = useCallback((id: string): RelationalOption | undefined => {
        const product = products.find(p => p.id === id)
        return product ? { id: product.id, primaryText: product.name } : undefined
    }, [products])

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

    const handleCreateCompany = useCallback(async (data: Record<string, unknown>): Promise<string | null> => {
        const result = await createCompany({ name: data.name as string })
        return result?.id || null
    }, [createCompany])

    const handleCreateProduct = useCallback(async (data: Record<string, unknown>): Promise<string | null> => {
        const result = await createProduct({
            name: data.name as string,
            manufacturer_id: (data.manufacturer_id as string) || null,
        })
        return result?.id || null
    }, [createProduct])

    const handleCreateManufacturer = useCallback(async (data: Record<string, unknown>): Promise<string | null> => {
        const result = await createManufacturer({
            name: data.name as string,
            type: 'manufacturer',
        })
        return result?.id || null
    }, [createManufacturer])

    // Nested fields configuration
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

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    // Error state
    if (error || !opportunity) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <p className="text-destructive">
                    {error || 'Opportunity not found'}
                </p>
                <Link to="/crm" className="btn-primary">
                    Back to CRM
                </Link>
            </div>
        )
    }

    // Check if opportunity is in a terminal state
    const isLost = opportunity.stage?.name.toLowerCase().includes('lost')
    const isWon = opportunity.stage?.name.toLowerCase().includes('won')
    const isTerminal = isLost || isWon

    // Get selected product IDs
    const selectedProductIds = opportunity.products?.map(p => p.id) || []

    // Helper to show saving/saved indicator
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
        <div className="h-full flex flex-col gap-6 overflow-y-auto">
            {/* Header */}
            <div className="flex flex-col gap-4">
                {/* Back button and title row */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/crm')}
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                            aria-label="Back to CRM"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            {/* Editable title */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    defaultValue={opportunity.title}
                                    onBlur={(e) => {
                                        if (e.target.value !== opportunity.title) {
                                            handleFieldChange('title', e.target.value)
                                        }
                                    }}
                                    className="text-2xl font-semibold bg-transparent border-b border-transparent hover:border-muted-foreground/30 focus:border-primary focus:outline-none transition-colors"
                                    disabled={isTerminal}
                                />
                                <FieldIndicator field="title" />
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                {opportunity.stage && (
                                    <span
                                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                                        style={{
                                            backgroundColor: `${opportunity.stage.color}20`,
                                            color: opportunity.stage.color || '#6b7280',
                                        }}
                                    >
                                        {opportunity.stage.name}
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {getDaysOpen()} days open
                                </span>
                                <span className="flex items-center gap-1">
                                    <User className="w-4 h-4" />
                                    {opportunity.assigned_to ? 'Assigned' : 'Unassigned'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        {!isTerminal && (
                            <button
                                onClick={() => setShowLostModal(true)}
                                className="btn-outline flex items-center gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                            >
                                <XCircle className="w-4 h-4" />
                                Mark as Lost
                            </button>
                        )}
                        {isLost && (
                            <span className="px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-sm font-medium">
                                Lost: {opportunity.lost_reason || 'No reason specified'}
                            </span>
                        )}
                        {isWon && (
                            <span className="px-3 py-1.5 rounded-lg bg-success/10 text-success text-sm font-medium">
                                Won
                            </span>
                        )}
                    </div>
                </div>

                {/* Stage Breadcrumb */}
                <div className="bg-card rounded-xl p-4 border border-border">
                    <StageBreadcrumb
                        stages={stages}
                        currentStageId={opportunity.stage_id}
                        onStageClick={handleStageChange}
                        disabled={isTerminal}
                    />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                {/* Left column - Editable Fields */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Related Entities - Editable Cards */}
                    <div className="bg-card rounded-xl border border-border p-6">
                        <h2 className="text-lg font-semibold mb-4">Related Entities</h2>

                        <div className="space-y-4">
                            {/* Contact - Editable */}
                            <div>
                                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                                    <User className="w-4 h-4 text-muted-foreground" />
                                    Contact
                                    <FieldIndicator field="contact" />
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
                                />
                            </div>

                            {/* Company - Editable */}
                            <div>
                                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-muted-foreground" />
                                    Company
                                    <FieldIndicator field="company" />
                                </label>
                                <RelationalField
                                    entityType="company"
                                    entityLabel="Company"
                                    displayFields={['name']}
                                    searchFields={['name']}
                                    nestedFormSchema={companyFormSchema}
                                    value={opportunity.company_id}
                                    onChange={handleCompanyChange}
                                    options={companyOptions}
                                    onSearch={setCompanySearch}
                                    onCreate={handleCreateCompany}
                                    onRefresh={refetchCompanies}
                                    getRecordDisplay={getCompanyDisplay}
                                    disabled={isTerminal}
                                    canCreate
                                />
                            </div>

                            {/* Products - Multi-select */}
                            <div>
                                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                                    <Package className="w-4 h-4 text-muted-foreground" />
                                    Products
                                    <FieldIndicator field="products" />
                                </label>
                                <RelationalField
                                    entityType="product"
                                    entityLabel="Product"
                                    displayFields={['name']}
                                    searchFields={['name']}
                                    nestedFormSchema={productFormSchema}
                                    mode="multi"
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
                                />
                            </div>
                        </div>
                    </div>

                    {/* Opportunity Details */}
                    <div className="bg-card rounded-xl border border-border p-6">
                        <h2 className="text-lg font-semibold mb-4">Opportunity Details</h2>

                        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                            {/* Lead Origin */}
                            <div>
                                <label className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                                    Lead Origin
                                    <FieldIndicator field="lead_origin" />
                                </label>
                                <select
                                    defaultValue={opportunity.lead_origin || ''}
                                    onChange={(e) => handleFieldChange('lead_origin', e.target.value || null)}
                                    className="input w-full"
                                    disabled={isTerminal}
                                >
                                    <option value="">Select...</option>
                                    {LEAD_ORIGIN_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Office */}
                            <div>
                                <label className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                                    Office
                                    <FieldIndicator field="office" />
                                </label>
                                <select
                                    defaultValue={opportunity.office || ''}
                                    onChange={(e) => handleFieldChange('office', e.target.value || null)}
                                    className="input w-full"
                                    disabled={isTerminal}
                                >
                                    <option value="">Select...</option>
                                    {OFFICE_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Quote Number */}
                            <div>
                                <label className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                                    Quote Number
                                    <FieldIndicator field="quote_number" />
                                </label>
                                <input
                                    type="text"
                                    defaultValue={opportunity.quote_number || ''}
                                    onBlur={(e) => {
                                        const newValue = e.target.value || null
                                        if (newValue !== opportunity.quote_number) {
                                            handleFieldChange('quote_number', newValue)
                                        }
                                    }}
                                    className="input w-full"
                                    placeholder="Enter quote number"
                                    disabled={isTerminal}
                                />
                            </div>

                            {/* Currency */}
                            <div>
                                <label className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                                    Currency
                                    <FieldIndicator field="currency" />
                                </label>
                                <select
                                    defaultValue={opportunity.currency || 'BRL'}
                                    onChange={(e) => handleFieldChange('currency', e.target.value)}
                                    className="input w-full"
                                    disabled={isTerminal}
                                >
                                    <option value="BRL">BRL</option>
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                </select>
                            </div>

                            {/* Net Price */}
                            <div>
                                <label className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                                    Net Price
                                    <FieldIndicator field="net_price" />
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    defaultValue={opportunity.net_price || ''}
                                    onBlur={(e) => {
                                        const newValue = e.target.value ? parseFloat(e.target.value) : null
                                        if (newValue !== opportunity.net_price) {
                                            handleFieldChange('net_price', newValue)
                                        }
                                    }}
                                    className="input w-full"
                                    placeholder="0.00"
                                    disabled={isTerminal}
                                />
                            </div>

                            {/* Sales Price */}
                            <div>
                                <label className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                                    Sales Price
                                    <FieldIndicator field="sales_price" />
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    defaultValue={opportunity.sales_price || ''}
                                    onBlur={(e) => {
                                        const newValue = e.target.value ? parseFloat(e.target.value) : null
                                        if (newValue !== opportunity.sales_price) {
                                            handleFieldChange('sales_price', newValue)
                                        }
                                    }}
                                    className="input w-full"
                                    placeholder="0.00"
                                    disabled={isTerminal}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right column - Info sidebar */}
                <div className="bg-card rounded-xl border border-border p-6">
                    <h2 className="text-lg font-semibold mb-4">Information</h2>

                    <div className="space-y-4">
                        {/* Responsible - placeholder for user dropdown */}
                        <div>
                            <label className="text-sm text-muted-foreground block mb-1">Responsible</label>
                            <p className="font-medium py-2 text-muted-foreground italic">
                                {opportunity.assigned_to ? 'Assigned user' : 'No one assigned'}
                            </p>
                        </div>

                        {/* Metadata */}
                        <div className="pt-4 border-t border-border">
                            <div className="text-sm text-muted-foreground space-y-1">
                                <p>Created: {new Date(opportunity.created_at).toLocaleDateString('pt-BR')}</p>
                                <p>Updated: {new Date(opportunity.updated_at).toLocaleDateString('pt-BR')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lost Reason Modal */}
            <LostReasonModal
                isOpen={showLostModal}
                onClose={() => setShowLostModal(false)}
                onConfirm={handleMarkAsLost}
                opportunityTitle={opportunity.title}
            />
        </div>
    )
}
