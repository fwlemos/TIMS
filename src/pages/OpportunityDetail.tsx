
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Calendar, XCircle, Loader2, User, Building2, Check, Package, ChevronsUpDown, UserCircle, Factory } from 'lucide-react'
import { useState, useCallback, useMemo, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useOpportunityDetail } from '@/hooks/useOpportunityDetail'
import { StageBreadcrumb, StageAccordion, TimelineSection, ActivitiesPanel, FilesSection } from '@/components/opportunity'
import type { StageAccordionHandle } from '@/components/opportunity'
import { OpportunitySummary } from '@/components/opportunity/OpportunitySummary'
import { LostReasonModal } from '@/components/crm/LostReasonModal'
import { MarkAsWonModal } from '@/components/crm/MarkAsWonModal'
import { RelationalField, FormField, NestedFieldsConfig, RelationalOption } from '@/components/shared/RelationalField'
import { useContacts } from '@/hooks/useContacts'
import { useCompanies } from '@/hooks/useCompanies'
import { useProducts } from '@/hooks/useProducts'
import { useUsers } from '@/hooks/useUsers'

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
        required: true,
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

    const [showLostModal, setShowLostModal] = useState(false)
    const [showWonModal, setShowWonModal] = useState(false)
    const [savingField, setSavingField] = useState<string | null>(null)
    const [savedField, setSavedField] = useState<string | null>(null)
    const [timelineRefreshTrigger, setTimelineRefreshTrigger] = useState(0)

    // Ref for stage accordion expand/collapse control
    const stageAccordionRef = useRef<StageAccordionHandle>(null)
    const [allStagesExpanded, setAllStagesExpanded] = useState(false)

    // Layout State: Active Tab (Stages vs Summary) 
    const [activeTab, setActiveTab] = useState<'stages' | 'summary'>('stages')

    // Automatically set default tab on load when opportunity is ready
    const [initialTabSet, setInitialTabSet] = useState(false)

    if (opportunity && !initialTabSet) {
        const isTerminal = opportunity.stage?.name.toLowerCase().includes('lost') ||
            opportunity.stage?.name.toLowerCase().includes('won')
        setActiveTab(isTerminal ? 'summary' : 'stages')
        setInitialTabSet(true)
    }

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

    const handleResponsibleChange = useCallback(async (userId: string | null) => {
        setSavingField('responsible')
        try {
            await updateOpportunity({ assigned_to: userId })
            setSavedField('responsible')
            setTimeout(() => setSavedField(null), 1500)
        } catch (err) {
            console.error('Error updating responsible:', err)
        } finally {
            setSavingField(null)
        }
    }, [updateOpportunity])

    const handleMarkAsLost = async (reason: string) => {
        if (!opportunity) return
        const lostStage = stages.find(s => s.name.toLowerCase().includes('lost'))
        if (lostStage) {
            await updateOpportunity({
                stage_id: lostStage.id,
                lost_reason: reason,
            })
            // Log to history
            const { error: historyError } = await supabase
                .from('opportunity_history')
                .insert({
                    opportunity_id: opportunityId,
                    action: 'stage_change',
                    field_name: 'stage',
                    old_value: opportunity.stage?.name,
                    new_value: lostStage.name,
                    user_id: (await supabase.auth.getUser()).data.user?.id
                })
            if (historyError) console.error('Failed to log lost history:', historyError)
        }
        setShowLostModal(false)
        setTimelineRefreshTrigger(prev => prev + 1)
        setActiveTab('summary')
    }

    const handleMarkAsWon = async (data: { description?: string, fileUrl?: string }) => {
        if (!opportunity) return
        const wonStage = stages.find(s => s.name.toLowerCase().includes('won'))
        if (wonStage) {
            await updateOpportunity({
                stage_id: wonStage.id,
                won_order_description: data.description,
                won_purchase_order_url: data.fileUrl
            })
            // Log to history
            const { error: historyError } = await supabase
                .from('opportunity_history')
                .insert({
                    opportunity_id: opportunityId,
                    action: 'stage_change',
                    field_name: 'stage',
                    old_value: opportunity.stage?.name,
                    new_value: wonStage.name,
                    user_id: (await supabase.auth.getUser()).data.user?.id
                })
            if (historyError) console.error('Failed to log won history:', historyError)
        }
        setShowWonModal(false)
        setTimelineRefreshTrigger(prev => prev + 1)
        setActiveTab('summary')
    }

    const handleStageChange = async (newStageId: string) => {
        const targetStage = stages.find(s => s.id === newStageId)
        if (!targetStage) return

        if (targetStage.name.toLowerCase().includes('lost')) {
            setShowLostModal(true)
            return
        }

        if (targetStage.name.toLowerCase().includes('won')) {
            setShowWonModal(true)
            return
        }

        await updateStage(newStageId)
    }

    // Validate stage advancement - check required fields for current stage
    const validateStageAdvance = useCallback((currentStageId: string, targetStageId: string): { valid: boolean; errors?: string[] } => {
        const currentStage = stages.find(s => s.id === currentStageId)
        const targetIndex = stages.findIndex(s => s.id === targetStageId)
        const currentIndex = stages.findIndex(s => s.id === currentStageId)

        // Allow moving backward without validation
        if (targetIndex < currentIndex) {
            return { valid: true }
        }

        // Prevent skipping stages
        if (targetIndex > currentIndex + 1) {
            return { valid: false, errors: ['You cannot skip stages. Please advance sequentially.'] }
        }

        const errors: string[] = []

        // Get the current stage key
        const stageKey = currentStage?.name.toLowerCase().replace(/\s+/g, '_')

        // Lead Backlog requirements
        if (stageKey === 'lead_backlog') {
            if (!opportunity?.contact_id) {
                errors.push('Contact is required')
            }
            if (!opportunity?.product_id && (!opportunity?.products || opportunity.products.length === 0)) {
                errors.push('Product is required')
            }
            if (!opportunity?.lead_origin) {
                errors.push('Lead Origin is required')
            }
        }

        // Won stage requirements
        if (targetStageId && stages.find(s => s.id === targetStageId)?.name.toLowerCase().includes('won')) {
            if (!opportunity?.won_purchase_order_url && !opportunity?.won_order_description) {
                errors.push('Purchase Order document OR Order Agreement description is required')
            }
        }

        return {
            valid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined
        }
    }, [stages, opportunity])

    // Convert entities to RelationalOptions with enhanced display
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

    // Get display functions with enhanced info
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
            secondaryText: productWithManufacturer.manufacturer?.name || 'No Manufacturer'
        }
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

    // Edit handlers
    const handleEditContact = useCallback(async (id: string, data: Record<string, unknown>): Promise<void> => {
        await updateContactRecord(id, {
            name: data.name as string,
            email: (data.email as string) || null,
            phone: (data.phone as string) || null,
            company_id: (data.company_id as string) || null,
        })
    }, [updateContactRecord])

    const handleEditProduct = useCallback(async (id: string, data: Record<string, unknown>): Promise<void> => {
        await updateProductRecord(id, {
            name: data.name as string,
            manufacturer_id: (data.manufacturer_id as string) || null,
        })
    }, [updateProductRecord])

    // Record data getters for edit forms
    const getContactRecordData = useCallback((id: string): Record<string, unknown> | undefined => {
        const contact = contacts.find(c => c.id === id)
        if (!contact) return undefined
        const contactWithCompany = contact as typeof contact & { company?: { name: string } | null }
        return {
            name: contact.name,
            email: contact.email || '',
            phone: contact.phone || '',
            company_id: contactWithCompany.company_id || '',
        }
    }, [contacts])

    const getProductRecordData = useCallback((id: string): Record<string, unknown> | undefined => {
        const product = products.find(p => p.id === id)
        if (!product) return undefined
        return {
            name: product.name,
            manufacturer_id: product.manufacturer_id || '',
        }
    }, [products])

    // Edit handlers for nested entities (Company and Manufacturer)
    const handleEditCompany = useCallback(async (id: string, data: Record<string, unknown>): Promise<void> => {
        await updateCompanyRecord(id, {
            name: data.name as string,
            tax_id: (data.tax_id as string) || null,
            address: (data.address as string) || null,
            phone: (data.phone as string) || null,
            website: (data.website as string) || null,
        })
    }, [updateCompanyRecord])

    const handleEditManufacturer = useCallback(async (id: string, data: Record<string, unknown>): Promise<void> => {
        await updateManufacturerRecord(id, {
            name: data.name as string,
            tax_id: (data.tax_id as string) || null,
            address: (data.address as string) || null,
            phone: (data.phone as string) || null,
            website: (data.website as string) || null,
        })
    }, [updateManufacturerRecord])

    // Record data getters for nested entities
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

    // Nested fields configuration
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
        <div className="h-full flex flex-col gap-6 overflow-hidden">
            {/* Header - Unified Row */}
            <div className="flex items-center justify-between gap-6 p-4 bg-card border border-border rounded-xl shadow-sm flex-shrink-0">
                {/* Left Section: Back Button + Title Block */}
                <div className="flex items-center gap-4 flex-shrink-0 min-w-[280px]">
                    <button
                        onClick={() => navigate('/crm')}
                        className="p-2 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
                        aria-label="Back to CRM"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="min-w-0">
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
                                className="text-xl font-semibold bg-transparent border-b border-transparent hover:border-muted-foreground/30 focus:border-primary focus:outline-none transition-colors w-full"
                                disabled={isTerminal}
                            />
                            <FieldIndicator field="title" />
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                            {/* Stage pill removed as it is redundant with Breadcrumb */}
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {getDaysOpen()} days open
                            </span>
                            <span className="flex items-center gap-1">
                                <User className="w-3.5 h-3.5" />
                                {opportunity.assigned_to ? 'Assigned' : 'Unassigned'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Center Section: Breadcrumb */}
                <div className="flex-1 overflow-x-auto flex justify-center px-2 no-scrollbar">
                    <StageBreadcrumb
                        stages={stages}
                        currentStageId={opportunity.stage_id}
                        onStageClick={handleStageChange}
                        validateStageAdvance={validateStageAdvance}
                        disabled={isTerminal}
                    />
                </div>

                {/* Right Section: Actions */}
                <div className="flex items-center gap-3 flex-shrink-0">
                    {!isTerminal && (
                        <button
                            onClick={() => setShowLostModal(true)}
                            className="btn-outline flex items-center gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 whitespace-nowrap"
                        >
                            <XCircle className="w-4 h-4" />
                            Mark as Lost
                        </button>
                    )}
                    {isLost && (
                        <span className="px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-sm font-medium whitespace-nowrap">
                            Lost: {opportunity.lost_reason || 'No reason specified'}
                        </span>
                    )}
                    {isWon && (
                        <span className="px-3 py-1.5 rounded-lg bg-success/10 text-success text-sm font-medium whitespace-nowrap">
                            Won
                        </span>
                    )}
                </div>
            </div>

            {/* Main Content - 3 Column Layout */}
            <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 overflow-hidden">

                {/* 1. LEFT COLUMN: History (Timeline) - Span 3 */}
                <div className="col-span-3 flex flex-col gap-6 overflow-y-auto min-h-0 pr-1">
                    <div className="space-y-6">
                        <TimelineSection
                            opportunityId={opportunity.id}
                            refreshTrigger={timelineRefreshTrigger}
                        />
                    </div>
                </div>

                {/* 2. CENTER COLUMN: Stage Fields & Summary - Span 6 */}
                <div className="col-span-6 flex flex-col gap-4 overflow-y-auto min-h-0 px-1">

                    {/* Tabs Switcher */}
                    <div className="flex p-1 bg-muted rounded-lg w-full">
                        <button
                            onClick={() => setActiveTab('stages')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'stages'
                                ? 'bg-background shadow text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Calendar className="w-4 h-4" />
                            Stage Fields
                        </button>
                        <button
                            onClick={() => setActiveTab('summary')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'summary'
                                ? 'bg-background shadow text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Check className="w-4 h-4" />
                            Summary
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto">
                        {activeTab === 'stages' ? (
                            <div className="space-y-6">
                                {/* Stage Accordion */}
                                <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-semibold">Stage Fields</h2>
                                        <button onClick={() => stageAccordionRef.current?.toggleAll()} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted">
                                            <ChevronsUpDown className="w-3.5 h-3.5" /> {allStagesExpanded ? 'Collapse All' : 'Expand All'}
                                        </button>
                                    </div>
                                    <StageAccordion
                                        ref={stageAccordionRef}
                                        opportunity={opportunity}
                                        stages={stages}
                                        currentStageId={opportunity.stage_id}
                                        onFieldChange={handleFieldChange}
                                        disabled={isTerminal}
                                        savingField={savingField}
                                        savedField={savedField}
                                        onExpandChange={(allExpanded) => setAllStagesExpanded(allExpanded)}
                                    />
                                </div>

                                <ActivitiesPanel
                                    opportunityId={opportunity.id}
                                    onActivityAdded={() => setTimelineRefreshTrigger(prev => prev + 1)}
                                />
                            </div>
                        ) : (
                            // Summary Tab
                            <div className="bg-card rounded-xl border border-border p-6 shadow-sm min-h-full">
                                <h2 className="text-lg font-semibold mb-6">Opportunity Summary</h2>
                                <OpportunitySummary opportunity={opportunity} />
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. RIGHT COLUMN: Related Entities & Files - Span 3 */}
                <div className="col-span-3 flex flex-col gap-6 overflow-y-auto min-h-0 pl-1 pb-4">
                    {/* Related Entities */}
                    <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">Related Entities</h3>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium mb-1.5 flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" /> Contact</label>
                                <RelationalField entityType="contact" entityLabel="Contact" displayFields={['name', 'email']} searchFields={['name', 'email', 'phone']} nestedFormSchema={contactFormSchema} value={opportunity.contact_id} onChange={handleContactChange} options={contactOptions} onSearch={setContactSearch} onCreate={handleCreateContact} onRefresh={refetchContacts} getRecordDisplay={getContactDisplay} nestedFieldsConfig={nestedFieldsConfig} disabled={isTerminal} canCreate canEdit onEdit={handleEditContact} getRecordData={getContactRecordData} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5 flex items-center gap-2"><Building2 className="w-4 h-4 text-muted-foreground" /> Company <span className="text-xs font-normal text-muted-foreground ml-auto">(From Contact)</span></label>
                                <div className="input w-full bg-muted/50 text-muted-foreground flex items-center min-h-[42px]">{opportunity.contact?.company?.name || 'No company associated'}</div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5 flex items-center gap-2"><Package className="w-4 h-4 text-muted-foreground" /> Products</label>
                                <RelationalField entityType="product" entityLabel="Products" displayFields={['name', 'ncm']} searchFields={['name', 'ncm']} nestedFormSchema={productFormSchema} value={selectedProductIds} onChange={handleProductsChange} options={productOptions} onSearch={setProductSearch} onCreate={handleCreateProduct} onRefresh={refetchProducts} getRecordDisplay={getProductDisplay} nestedFieldsConfig={nestedFieldsConfig} disabled={isTerminal} canCreate mode="multi" displayMode="pill" canEdit onEdit={handleEditProduct} getRecordData={getProductRecordData} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5 flex items-center gap-2"><Factory className="w-4 h-4 text-muted-foreground" /> Manufacturers <span className="text-xs font-normal text-muted-foreground ml-auto">(From Products)</span></label>
                                <div className="bg-muted/50 rounded-lg p-3 min-h-[42px] border border-input text-sm">
                                    {opportunity.products && opportunity.products.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {Array.from(new Set(opportunity.products.flatMap(p => p.manufacturer?.name).filter(Boolean))).map((name, i) => (
                                                <span key={i} className="bg-background border rounded px-1.5 py-0.5 text-xs font-medium">{name}</span>
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
                                </label>
                                <select
                                    value={opportunity.assigned_to || ''}
                                    onChange={(e) => handleResponsibleChange(e.target.value || null)}
                                    className="input w-full"
                                    disabled={isTerminal}
                                >
                                    <option value="">Unassigned</option>
                                    {users.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.name || user.email?.split('@')[0] || 'Unknown User'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Files Section */}
                    <FilesSection opportunityId={opportunity.id} />
                </div>
            </div>

            {/* Modals */}
            <LostReasonModal isOpen={showLostModal} onClose={() => setShowLostModal(false)} onConfirm={handleMarkAsLost} opportunityTitle={opportunity.title} />
            <MarkAsWonModal isOpen={showWonModal} onClose={() => setShowWonModal(false)} onConfirm={handleMarkAsWon} opportunityTitle={opportunity.title} />
        </div>
    )
}
