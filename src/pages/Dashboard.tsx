export default function Dashboard() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold">Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                    Welcome to TIMS
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Contacts', value: '—', change: '' },
                    { label: 'Active Companies', value: '—', change: '' },
                    { label: 'Open Opportunities', value: '—', change: '' },
                    { label: 'Pipeline Value', value: '—', change: '' },
                ].map((stat) => (
                    <div key={stat.label} className="card p-5">
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="text-2xl font-semibold mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Placeholder content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card p-6">
                    <h2 className="font-semibold mb-4">Recent Activity</h2>
                    <p className="text-muted-foreground text-sm">Activity feed will appear here.</p>
                </div>

                <div className="card p-6">
                    <h2 className="font-semibold mb-4">Upcoming Tasks</h2>
                    <p className="text-muted-foreground text-sm">Tasks will appear here.</p>
                </div>
            </div>
        </div>
    )
}
