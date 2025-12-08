import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, FileEdit } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface ActivityLog {
    id: string;
    object_type: string;
    object_id: string;
    action: string;
    changed_fields: any;
    performed_by: string | null;
    performed_at: string;
}

export function TimelineEntry({ entry }: { entry: ActivityLog }) {
    const [expanded, setExpanded] = useState(false);

    const getIcon = () => {
        if (entry.action === 'created') return <Plus className="w-4 h-4 text-green-500" />;
        if (entry.action === 'deleted') return <Trash2 className="w-4 h-4 text-red-500" />;
        return <FileEdit className="w-4 h-4 text-blue-500" />;
    };

    const hasChanges = entry.changed_fields && typeof entry.changed_fields === 'object' && Object.keys(entry.changed_fields).length > 0;

    return (
        <div className="flex gap-3 py-4 border-b last:border-0 border-border/50">
            <div className="mt-1 flex-shrink-0 bg-muted/20 p-1.5 rounded-full h-fit">{getIcon()}</div>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                    <p className="text-sm font-medium capitalize">
                        {entry.action === 'updated' ? 'Updated' : entry.action}
                    </p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0" title={new Date(entry.performed_at).toLocaleString()}>
                        {formatDistanceToNow(new Date(entry.performed_at), { addSuffix: true })}
                    </span>
                </div>
                <p className="text-xs text-muted-foreground">
                    by {entry.performed_by ? 'User' : 'System'}
                </p>

                {hasChanges && (
                    <div className="mt-2">
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="text-xs text-primary flex items-center gap-1 hover:underline focus:outline-none"
                        >
                            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            {expanded ? 'Hide details' : 'Show details'}
                        </button>

                        {expanded && (
                            <div className="mt-2 bg-muted/30 p-2 rounded text-xs font-mono overflow-x-auto">
                                {Object.entries(entry.changed_fields).map(([key, val]) => (
                                    <div key={key} className="grid grid-cols-[1fr,2fr] gap-2 border-b border-border/30 last:border-0 py-1">
                                        <span className="text-muted-foreground">{key}:</span>
                                        <span className="truncate">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
