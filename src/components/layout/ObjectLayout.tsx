import React, { ReactNode } from 'react';
import { clsx } from 'clsx';

interface ObjectLayoutProps {
    timeline: ReactNode;
    form: ReactNode;
    opportunities: ReactNode;
    header?: ReactNode;
    className?: string;
}

export function ObjectLayout({ timeline, form, opportunities, header, className }: ObjectLayoutProps) {
    return (
        <div className={clsx("flex flex-col h-[calc(100vh-140px)] gap-4", className)}>
            {header && <div className="w-full shrink-0">{header}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full min-h-0">
                {/* Timeline - Left Column */}
                {/* Mobile: Bottom (Order 3), Desktop: Left (Order 1) */}
                <div className="order-3 lg:order-1 lg:col-span-1 overflow-y-auto pr-2 border-t lg:border-t-0 lg:border-r border-border pt-4 lg:pt-0">
                    <div className="h-full">
                        {timeline}
                    </div>
                </div>

                {/* Form - Center Column */}
                {/* Mobile: Top (Order 1), Desktop: Center (Order 2) */}
                <div className="order-1 lg:order-2 lg:col-span-2 overflow-y-auto px-2">
                    <div className="h-full">
                        {form}
                    </div>
                </div>

                {/* Opportunities - Right Column */}
                {/* Mobile: Middle (Order 2), Desktop: Right (Order 3) */}
                <div className="order-2 lg:order-3 lg:col-span-1 overflow-y-auto pl-2 border-t lg:border-t-0 lg:border-l border-border pt-4 lg:pt-0">
                    <div className="h-full">
                        {opportunities}
                    </div>
                </div>
            </div>
        </div>
    );
}
