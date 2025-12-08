import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { TimelineEntry, ActivityLog } from './TimelineEntry';
import { Loader2 } from 'lucide-react';

interface ActivityTimelineProps {
    objectType: string | undefined;
    objectId: string | undefined;
}

export function ActivityTimeline({ objectType, objectId }: ActivityTimelineProps) {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            if (!objectType || !objectId) {
                setLoading(false);
                return;
            }

            setLoading(true);
            const { data, error } = await supabase
                .from('activity_logs')
                .select('*')
                .eq('object_type', objectType)
                .eq('object_id', objectId)
                .order('performed_at', { ascending: false });

            if (!error && data) {
                setLogs(data);
            }
            setLoading(false);
        };

        fetchLogs();

        // Realtime subscription
        const channel = supabase
            .channel(`activity_logs:${objectType}:${objectId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'activity_logs',
                    filter: `object_id=eq.${objectId}` // filter by ID is usually enough if IDs are unique uuids
                },
                (payload) => {
                    setLogs((current) => [payload.new as ActivityLog, ...current]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };

    }, [objectType, objectId]);

    if (loading) return <div className="flex justify-center p-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>;

    if (logs.length === 0) {
        return (
            <div className="bg-card rounded-lg border shadow-sm h-full flex flex-col">
                <div className="p-4 border-b">
                    <h3 className="font-semibold">Activity Timeline</h3>
                </div>
                <div className="flex-1 p-8 flex items-center justify-center text-sm text-muted-foreground">
                    No activity recorded.
                </div>
            </div>
        );
    }

    return (
        <div className="bg-card rounded-lg border shadow-sm h-full flex flex-col">
            <div className="p-4 border-b">
                <h3 className="font-semibold">Activity Timeline</h3>
            </div>
            <div className="flex-1 overflow-y-auto px-4">
                {logs.map(log => (
                    <TimelineEntry key={log.id} entry={log} />
                ))}
            </div>
        </div>
    );
}
