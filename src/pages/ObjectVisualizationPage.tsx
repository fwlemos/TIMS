import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ObjectLayout } from '../components/layout/ObjectLayout';
import { Button } from '../components/shared/Button';
import { useObjectData } from '../hooks/useObjectData';
import { ObjectForm } from '../components/features/ObjectForm';
import { ActivityTimeline } from '../components/features/ActivityTimeline';
import { RelatedOpportunities } from '../components/features/RelatedOpportunities';
import { Loader2, Copy, Trash2 } from 'lucide-react';
import { SlidePanel } from '../components/shared/SlidePanel';
import { OpportunityForm } from '../components/crm/OpportunityForm';
import { useOpportunities } from '../hooks/useOpportunities';
import { useToast } from '../components/shared/Toast';
import { supabase } from '@/lib/supabase';
import { getObjectConfig } from '@/config/objectRegistry';
import { logger } from '@/utils/logger';

export default function ObjectVisualizationPage() {
    const { objectType, id } = useParams<{ objectType: string; id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    const { data, loading, error, update } = useObjectData(objectType, id);
    const { createOpportunity } = useOpportunities(); // Use hook for creation logic

    // Actions state
    const [showCreatePanel, setShowCreatePanel] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDuplicating, setIsDuplicating] = useState(false);

    // Handlers
    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this record? This action cannot be undone.')) return;

        setIsDeleting(true);
        const config = getObjectConfig(objectType);
        if (!config || !id) return;

        try {
            const { error } = await supabase
                .from(config.table)
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;

            toast('Record deleted successfully', 'success');
            navigate('/database');
        } catch (err: any) {
            toast('Error deleting record: ' + err.message, 'error');
            setIsDeleting(false);
        }
    };

    const handleDuplicate = async () => {
        if (!data || !objectType) return;
        setIsDuplicating(true);
        const config = getObjectConfig(objectType);
        if (!config) return;

        try {
            // Prepare duplicate data
            const { id: _, created_at, updated_at, deleted_at, ...rest } = data;
            const duplicateData = {
                ...rest,
                name: `${data.name} (Copy)`,
            };

            const { data: newData, error } = await supabase
                .from(config.table)
                .insert(duplicateData)
                .select()
                .single();

            if (error) throw error;

            toast('Record duplicated successfully', 'success');
            navigate(`/database/${objectType}/${newData.id}`);
            // Force reload or state update logic here if needed, but navigate should handle it
        } catch (err: any) {
            toast('Error duplicating record: ' + err.message, 'error');
            setIsDuplicating(false);
        }
    };

    const handleCreateOpportunity = async (formData: any) => {
        try {
            await createOpportunity(formData);
            setShowCreatePanel(false);
            toast('Opportunity created successfully', 'success');
            // Ideally assume RelatedOpportunities refreshes on mount or we trigger a refresh.
            // Since we don't have a shared context for refresh here yet, 
            // we rely on the fact that creating an opp is a backend change 
            // preventing automatic UI update if RelatedOpportunities doesn't listen to RT changes involving new opps.
            // However, RelatedOpportunities component fetches on mount. 
            // We can force a re-mount key or just leave it for now (user can refresh).
        } catch (error: any) {
            logger.error('Error creating opportunity:', { error });
            toast('Failed to create opportunity: ' + (error.message || 'Unknown error'), 'error');
        }
    };

    const timeline = (
        <ActivityTimeline objectType={objectType} objectId={id} />
    );

    const opportunities = (
        <RelatedOpportunities
            objectType={objectType}
            objectId={id}
            onCreateOpportunity={() => setShowCreatePanel(true)}
        />
    );

    const header = (
        <div className="flex items-center justify-between py-4 px-6 bg-card border-b">
            <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground capitalize cursor-pointer hover:underline" onClick={() => navigate('/database')}>
                    Database
                </span>
                <span className="text-muted-foreground">/</span>
                <span className="text-muted-foreground capitalize">{objectType}</span>
                <span className="text-muted-foreground">/</span>
                <span className="font-semibold">{(data?.name as string) || id?.substring(0, 8)}</span>
            </div>
            <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={handleDuplicate} loading={isDuplicating} leftIcon={<Copy className="w-4 h-4" />}>Duplicate</Button>
                <Button variant="destructive" size="sm" onClick={handleDelete} loading={isDeleting} leftIcon={<Trash2 className="w-4 h-4" />}>Delete</Button>
            </div>
        </div>
    );

    if (loading) {
        return <div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <p className="text-destructive font-medium">Error loading object: {error}</p>
                <Button onClick={() => navigate(-1)}>Go Back</Button>
            </div>
        );
    }

    return (
        <>
            <ObjectLayout
                timeline={timeline}
                form={<ObjectForm type={objectType || ''} data={data} onSave={update} />}
                opportunities={opportunities}
                header={header}
            />

            <SlidePanel
                isOpen={showCreatePanel}
                onClose={() => setShowCreatePanel(false)}
                title="New Opportunity"
            >
                {/* Pre-fill logic can be added here by creating a default Opportunity object based on current objectType/data */}
                <OpportunityForm
                    opportunity={null} // or partial object
                    onSubmit={handleCreateOpportunity}
                    onCancel={() => setShowCreatePanel(false)}
                />
            </SlidePanel>
        </>
    );
}
