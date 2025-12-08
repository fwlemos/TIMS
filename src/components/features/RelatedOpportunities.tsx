import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, DollarSign, Calendar, ArrowUpRight, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OpportunityMini {
    id: string;
    title: string;
    stage_id: string;
    sales_price: number | null;
    expected_close_date: string | null;
    currency: string | null;
    pipeline_stages?: {
        name: string;
        color: string | null;
    } | null;
}

export function OpportunityMiniCard({ opportunity }: { opportunity: OpportunityMini }) {
    const navigate = useNavigate();
    const stageColor = opportunity.pipeline_stages?.color || '#cbd5e1'; // slate-300 default

    return (
        <div
            onClick={() => navigate(`/opportunities/${opportunity.id}`)}
            className="p-3 bg-card border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
        >
            <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-sm line-clamp-1 group-hover:text-primary pr-2">{opportunity.title}</h4>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-3">
                <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium border"
                    style={{
                        backgroundColor: `${stageColor}20`,
                        borderColor: `${stageColor}40`,
                        color: stageColor
                    }}
                >
                    {opportunity.pipeline_stages?.name || 'Unknown Stage'}
                </span>

                {opportunity.expected_close_date && (
                    <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(opportunity.expected_close_date).toLocaleDateString()}
                    </span>
                )}
            </div>

            <div className="font-semibold text-sm flex items-center">
                <DollarSign className="w-3 h-3 text-muted-foreground mr-0.5" />
                {opportunity.sales_price?.toLocaleString() || '0'}
                <span className="text-xs text-muted-foreground ml-1">{opportunity.currency || 'BRL'}</span>
            </div>
        </div>
    );
}

import { Plus } from 'lucide-react';
import { Button } from '@/components/shared/Button';

interface RelatedOpportunitiesProps {
    objectType: string | undefined;
    objectId: string | undefined;
    onCreateOpportunity?: () => void;
}

export function RelatedOpportunities({ objectType, objectId, onCreateOpportunity }: RelatedOpportunitiesProps) {
    const [opportunities, setOpportunities] = useState<OpportunityMini[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOpps = async () => {
            if (!objectType || !objectId) {
                setLoading(false);
                return;
            }

            let query = supabase
                .from('opportunities')
                .select('id, title, stage_id, sales_price, expected_close_date, currency, pipeline_stages(name, color)');

            const type = objectType.toLowerCase();
            if (type === 'company' || type === 'manufacturer') {
                // Manufacturers are just companies
                query = query.eq('company_id', objectId);
            } else if (type === 'contact' || type === 'client') {
                query = query.eq('contact_id', objectId);
            } else if (type === 'product') {
                query = query.eq('product_id', objectId);
            } else {
                // Unknown type or no relation logic defined
                setLoading(false);
                return;
            }

            const { data, error } = await query;
            if (data) {
                // Cast because join returns array or object depending on relation, here it's singular foreign key relation so it returns object
                setOpportunities(data as unknown as OpportunityMini[]);
            }
            setLoading(false);
        };
        fetchOpps();
    }, [objectType, objectId]);

    if (loading) return <div className="flex justify-center p-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>;

    if (opportunities.length === 0) {
        return (
            <div className="bg-card rounded-lg border shadow-sm h-full flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="font-semibold">Related Opportunities</h3>
                    {onCreateOpportunity && (
                        <Button size="sm" variant="ghost" onClick={onCreateOpportunity} className="h-7 px-2">
                            <Plus className="w-3.5 h-3.5" />
                        </Button>
                    )}
                </div>
                <div className="flex-1 p-8 flex items-center justify-center text-sm text-muted-foreground text-center">
                    No related opportunities found.
                </div>
            </div>
        );
    }

    return (
        <div className="bg-card rounded-lg border shadow-sm h-full flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Related Opportunities</h3>
                    <span className="text-xs bg-muted px-2 py-1 rounded-full">{opportunities.length}</span>
                </div>
                {onCreateOpportunity && (
                    <Button size="sm" variant="ghost" onClick={onCreateOpportunity} className="h-7 px-2">
                        <Plus className="w-3.5 h-3.5" />
                    </Button>
                )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {opportunities.map(opp => (
                    <OpportunityMiniCard key={opp.id} opportunity={opp} />
                ))}
            </div>
        </div>
    );
}
