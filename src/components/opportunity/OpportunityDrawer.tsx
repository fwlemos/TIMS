import { useEffect, useRef } from 'react'
import { X, Calendar, Building2, User, Package, MapPin, Tag, ExternalLink, XCircle } from 'lucide-react'
import { clsx } from 'clsx'
import { Link } from 'react-router-dom'
import type { OpportunityWithRelations } from '@/hooks/useOpportunities'
import { useUsers } from '@/hooks/useUsers'

interface OpportunityDrawerProps {
    opportunity: OpportunityWithRelations | null
    isOpen: boolean
    onClose: () => void
    onMarkAsLost?: () => void
}

const LEAD_ORIGIN_LABELS: Record<string, string> = {
    website: 'Website',
    social_media: 'Social Media',
    email: 'Email',
    phone_call: 'Phone Call',
    events: 'Events',
    manufacturer: 'Manufacturer',
    referral: 'Referral',
    other: 'Other',
}

export function OpportunityDrawer({ opportunity, isOpen, onClose, onMarkAsLost }: OpportunityDrawerProps) {
    const drawerRef = useRef<HTMLDivElement>(null)
    const { users } = useUsers()

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose()
            }
        }
        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [isOpen, onClose])

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (drawerRef.current && !drawerRef.current.contains(e.target as Node) && isOpen) {
                onClose()
            }
        }
        // Delay to prevent immediate close on open click
        const timeout = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside)
        }, 100)
        return () => {
            clearTimeout(timeout)
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen, onClose])

    // Calculate days since creation
    const getDaysOpen = () => {
        if (!opportunity) return 0
        const created = new Date(opportunity.created_at)
        const now = new Date()
        const diffTime = Math.abs(now.getTime() - created.getTime())
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    if (!opportunity) return null

    return (
        <>
            {/* Backdrop overlay */}
            <div
                className={clsx(
                    'fixed inset-0 bg-black/50 z-40 transition-opacity duration-300',
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                )}
            />

            {/* Drawer panel */}
            <div
                ref={drawerRef}
                className={clsx(
                    'fixed top-0 right-0 h-full w-[420px] max-w-[90vw] bg-card z-50',
                    'shadow-xl border-l border-border',
                    'transform transition-transform duration-300 ease-out',
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="flex-1 min-w-0 mr-4">
                        <h2 className="text-lg font-semibold truncate">{opportunity.title}</h2>
                        <div className="flex items-center gap-2 mt-1">
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
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {getDaysOpen()} days open
                            </span>
                        </div>
                    </div>
                    {/* Responsible User Badge */}
                    <div className="mr-4 flex flex-col items-end hidden sm:flex">
                        <span className="text-xs text-muted-foreground">Responsible</span>
                        <div className="flex items-center gap-1.5 text-sm font-medium">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>
                                {opportunity.assigned_to
                                    ? (users.find(u => u.id === opportunity.assigned_to)?.name || 'Assigned')
                                    : 'Unassigned'}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                        aria-label="Close drawer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-6 overflow-y-auto h-[calc(100%-140px)]">
                    {/* Contact */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="w-4 h-4" />
                            <span>Contact</span>
                        </div>
                        <div className="pl-6">
                            {opportunity.contact ? (
                                <p className="font-medium">{opportunity.contact.name}</p>
                            ) : (
                                <p className="text-muted-foreground italic">No contact assigned</p>
                            )}
                        </div>
                    </div>

                    {/* Company */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Building2 className="w-4 h-4" />
                            <span>Company</span>
                        </div>
                        <div className="pl-6">
                            {opportunity.company ? (
                                <p className="font-medium">{opportunity.company.name}</p>
                            ) : (
                                <p className="text-muted-foreground italic">No company assigned</p>
                            )}
                        </div>
                    </div>

                    {/* Product */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Package className="w-4 h-4" />
                            <span>Product</span>
                        </div>
                        <div className="pl-6">
                            {opportunity.product ? (
                                <p className="font-medium">{opportunity.product.name}</p>
                            ) : (
                                <p className="text-muted-foreground italic">No product assigned</p>
                            )}
                        </div>
                    </div>

                    {/* Lead Origin */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Tag className="w-4 h-4" />
                            <span>Lead Origin</span>
                        </div>
                        <div className="pl-6">
                            {opportunity.lead_origin ? (
                                <p className="font-medium">{LEAD_ORIGIN_LABELS[opportunity.lead_origin] || opportunity.lead_origin}</p>
                            ) : (
                                <p className="text-muted-foreground italic">Not specified</p>
                            )}
                        </div>
                    </div>

                    {/* Office */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span>Office</span>
                        </div>
                        <div className="pl-6">
                            {opportunity.office ? (
                                <p className="font-medium">{opportunity.office}</p>
                            ) : (
                                <p className="text-muted-foreground italic">Not specified</p>
                            )}
                        </div>
                    </div>

                    {/* Pricing Info (if available) */}
                    {(opportunity.sales_price || opportunity.net_price) && (
                        <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                            <h4 className="text-sm font-medium text-muted-foreground">Pricing</h4>
                            {opportunity.sales_price && (
                                <div className="flex justify-between">
                                    <span className="text-sm">Sales Price</span>
                                    <span className="font-semibold">
                                        {new Intl.NumberFormat('pt-BR', {
                                            style: 'currency',
                                            currency: opportunity.currency || 'BRL',
                                        }).format(opportunity.sales_price)}
                                    </span>
                                </div>
                            )}
                            {opportunity.net_price && (
                                <div className="flex justify-between">
                                    <span className="text-sm">Net Price</span>
                                    <span className="text-muted-foreground">
                                        {new Intl.NumberFormat('pt-BR', {
                                            style: 'currency',
                                            currency: opportunity.currency || 'BRL',
                                        }).format(opportunity.net_price)}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer with action buttons */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card space-y-2">
                    <Link
                        to={`/crm/opportunities/${opportunity.id}`}
                        className="btn-primary w-full flex items-center justify-center gap-2"
                        onClick={onClose}
                    >
                        <ExternalLink className="w-4 h-4" />
                        View Full Details
                    </Link>
                    {onMarkAsLost && (
                        <button
                            onClick={onMarkAsLost}
                            className="btn-outline w-full flex items-center justify-center gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                        >
                            <XCircle className="w-4 h-4" />
                            Mark as Lost
                        </button>
                    )}
                </div>
            </div>
        </>
    )
}
