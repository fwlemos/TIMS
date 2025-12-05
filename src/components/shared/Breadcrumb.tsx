import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { clsx } from 'clsx'

interface BreadcrumbItem {
    label: string
    href?: string
}

interface BreadcrumbProps {
    items?: BreadcrumbItem[]
    className?: string
}

// Auto-generate breadcrumbs from current path
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
    const segments = pathname.split('/').filter(Boolean)

    if (segments.length === 0) {
        return [{ label: 'Dashboard' }]
    }

    const breadcrumbs: BreadcrumbItem[] = [
        { label: 'Dashboard', href: '/' }
    ]

    let currentPath = ''
    segments.forEach((segment, index) => {
        currentPath += `/${segment}`
        const isLast = index === segments.length - 1

        // Format segment to readable label
        const label = segment
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')

        breadcrumbs.push({
            label,
            href: isLast ? undefined : currentPath,
        })
    })

    return breadcrumbs
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
    const location = useLocation()
    const breadcrumbs = items || generateBreadcrumbs(location.pathname)

    if (breadcrumbs.length <= 1) {
        return null
    }

    return (
        <nav
            aria-label="Breadcrumb"
            className={clsx('flex items-center gap-1 text-sm', className)}
        >
            {breadcrumbs.map((item, index) => {
                const isFirst = index === 0
                const isLast = index === breadcrumbs.length - 1

                return (
                    <div key={index} className="flex items-center gap-1">
                        {!isFirst && (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}

                        {item.href ? (
                            <Link
                                to={item.href}
                                className={clsx(
                                    'flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors',
                                    isFirst && 'text-muted-foreground'
                                )}
                            >
                                {isFirst && <Home className="w-4 h-4" />}
                                <span>{item.label}</span>
                            </Link>
                        ) : (
                            <span
                                className={clsx(
                                    'flex items-center gap-1',
                                    isLast ? 'text-foreground font-medium' : 'text-muted-foreground'
                                )}
                            >
                                {isFirst && <Home className="w-4 h-4" />}
                                <span>{item.label}</span>
                            </span>
                        )}
                    </div>
                )
            })}
        </nav>
    )
}
