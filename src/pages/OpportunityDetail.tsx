import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Calendar, XCircle, Loader2, User, Check } from 'lucide-react'
import { useState, useCallback } from 'react'
import { useOpportunityDetail } from '@/hooks/useOpportunityDetail'
import { StageBreadcrumb } from '@/components/opportunity/StageBreadcrumb'
import { LostReasonModal } from '@/components/crm/LostReasonModal'

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

export default function OpportunityDetail() {
    const { opportunityId } = useParams<{ opportunityId: string }>()
    const navigate = useNavigate()
    const { opportunity, stages, loading, error, updateOpportunity, updateStage } = useOpportunityDetail(opportunityId)

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
                <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6">
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

                        {/* Contact (read-only - change via Related Entities) */}
                        <div>
                            <label className="text-sm text-muted-foreground block mb-1">Contact</label>
                            <p className="font-medium py-2">{opportunity.contact?.name || '-'}</p>
                        </div>

                        {/* Company (read-only - change via Related Entities) */}
                        <div>
                            <label className="text-sm text-muted-foreground block mb-1">Company</label>
                            <p className="font-medium py-2">{opportunity.company?.name || '-'}</p>
                        </div>

                        {/* Product (read-only - change via Related Entities) */}
                        <div>
                            <label className="text-sm text-muted-foreground block mb-1">Product</label>
                            <p className="font-medium py-2">{opportunity.product?.name || '-'}</p>
                        </div>

                        {/* Responsible - placeholder for user dropdown */}
                        <div>
                            <label className="text-sm text-muted-foreground block mb-1">Responsible</label>
                            <p className="font-medium py-2 text-muted-foreground italic">
                                {opportunity.assigned_to ? 'Assigned user' : 'No one assigned'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right column - Related entities */}
                <div className="bg-card rounded-xl border border-border p-6">
                    <h2 className="text-lg font-semibold mb-4">Related Entities</h2>

                    {/* Contact */}
                    {opportunity.contact && (
                        <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                            <h3 className="text-sm font-medium mb-1">Contact</h3>
                            <p className="font-medium">{opportunity.contact.name}</p>
                            {opportunity.contact.email && (
                                <p className="text-sm text-muted-foreground">{opportunity.contact.email}</p>
                            )}
                            {opportunity.contact.phone && (
                                <p className="text-sm text-muted-foreground">{opportunity.contact.phone}</p>
                            )}
                        </div>
                    )}

                    {/* Company */}
                    {opportunity.company && (
                        <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                            <h3 className="text-sm font-medium mb-1">Company</h3>
                            <p className="font-medium">{opportunity.company.name}</p>
                            {opportunity.company.address && (
                                <p className="text-sm text-muted-foreground">{opportunity.company.address}</p>
                            )}
                        </div>
                    )}

                    {/* Product */}
                    {opportunity.product && (
                        <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                            <h3 className="text-sm font-medium mb-1">Product</h3>
                            <p className="font-medium">{opportunity.product.name}</p>
                            {opportunity.product.ncm && (
                                <p className="text-sm text-muted-foreground">NCM: {opportunity.product.ncm}</p>
                            )}
                        </div>
                    )}

                    {/* Metadata */}
                    <div className="mt-6 pt-4 border-t border-border">
                        <h3 className="text-sm font-medium mb-2">Information</h3>
                        <div className="text-sm text-muted-foreground space-y-1">
                            <p>Created: {new Date(opportunity.created_at).toLocaleDateString('pt-BR')}</p>
                            <p>Updated: {new Date(opportunity.updated_at).toLocaleDateString('pt-BR')}</p>
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
