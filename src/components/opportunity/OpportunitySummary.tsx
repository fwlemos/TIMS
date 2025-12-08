
import { User, Building2, Package, Check, XCircle, Factory, MapPin, Globe, Phone, Mail } from 'lucide-react'
import type { OpportunityWithRelations } from '@/hooks/useOpportunities'
import { formatCurrency } from '@/lib/format'

interface OpportunitySummaryProps {
    opportunity: OpportunityWithRelations
}

export function OpportunitySummary({ opportunity }: OpportunitySummaryProps) {
    const isLost = opportunity.stage?.name.toLowerCase().includes('lost')
    const isWon = opportunity.stage?.name.toLowerCase().includes('won')

    return (
        <div className="space-y-6">
            {/* Status Banner */}
            {isWon && (
                <div className="bg-success/10 border border-success/20 rounded-xl p-4 flex items-start gap-3">
                    <Check className="w-5 h-5 text-success mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-success">Opportunity Won</h4>
                        {opportunity.won_order_description && (
                            <p className="text-sm text-success/80 mt-1">{opportunity.won_order_description}</p>
                        )}
                        {opportunity.won_purchase_order_url && (
                            <a
                                href={opportunity.won_purchase_order_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm text-success hover:underline mt-1 block"
                            >
                                View Purchase Order
                            </a>
                        )}
                    </div>
                </div>
            )}

            {isLost && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-destructive mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-destructive">Opportunity Lost</h4>
                        <p className="text-sm text-destructive/80 mt-1">
                            Reason: {opportunity.lost_reason || 'No reason provided'}
                        </p>
                    </div>
                </div>
            )}

            {/* General Info - Stacked Rows */}
            <div className="space-y-4">
                <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                    <h3 className="font-medium text-muted-foreground text-sm uppercase tracking-wider mb-2">General Info</h3>

                    <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-muted-foreground">Type of Sale</span>
                        <span className="font-medium text-sm">{opportunity.type_of_sale || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-muted-foreground">Lead Origin</span>
                        <span className="font-medium text-sm capitalize">{opportunity.lead_origin?.replace('_', ' ') || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-muted-foreground">Office</span>
                        <span className="font-medium text-sm capitalize">{opportunity.office || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-muted-foreground">Quote Number</span>
                        <span className="font-medium text-sm">{opportunity.quote_number || '-'}</span>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                    <h3 className="font-medium text-muted-foreground text-sm uppercase tracking-wider mb-2">Financials</h3>

                    <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-muted-foreground">Net Price</span>
                        <span className="font-medium text-sm">{formatCurrency(opportunity.net_price || 0, opportunity.currency || 'BRL')}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-muted-foreground">Sales Price</span>
                        <span className="font-medium text-sm">{formatCurrency(opportunity.sales_price || 0, opportunity.currency || 'BRL')}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-muted-foreground">Currency</span>
                        <span className="font-medium text-sm">{opportunity.currency || 'BRL'}</span>
                    </div>
                </div>
            </div>

        </div>
    )
}
