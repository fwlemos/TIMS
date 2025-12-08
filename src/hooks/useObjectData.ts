import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getObjectConfig } from '@/config/objectRegistry';
import { useToast } from '@/components/shared/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';

export function useObjectData(type: string | undefined, id: string | undefined) {
    const { user } = useAuth();
    const [data, setData] = useState<Record<string, unknown> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const config = getObjectConfig(type);

    const fetchData = useCallback(async () => {
        if (!config || !id) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from(config.table)
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setData(data);
        } catch (err: any) {
            logger.error('Error fetching object:', { error: err });
            setError(err.message);
            toast('Failed to load data. ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [config, id, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const update = async (updates: Record<string, unknown>) => {
        if (!config || !id || !type) return { error: 'Invalid configuration' };
        try {
            // 1. Update the object
            const { error: updateError } = await supabase
                .from(config.table)
                .update(updates)
                .eq('id', id);

            if (updateError) throw updateError;

            // 2. Log activity
            if (user) {
                const { error: logError } = await supabase
                    .from('activity_logs')
                    .insert({
                        object_type: type,
                        object_id: id,
                        action: 'updated',
                        changed_fields: updates,
                        performed_by: user.id
                    });

                if (logError) logger.error('Error logging activity:', { error: logError });
            }

            // 3. Refresh data
            await fetchData();
            return { error: null };
        } catch (err: any) {
            logger.error('Error updating object:', { error: err });
            return { error: err };
        }
    };

    return { data, loading, error, refetch: fetchData, update };
}
