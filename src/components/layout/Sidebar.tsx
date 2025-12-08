import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { clsx } from 'clsx'
import {
    LayoutDashboard,
    Database,
    Kanban,
    Settings,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react'

interface NavItem {
    name: string
    href: string
    icon: React.ComponentType<{ className?: string }>
}

const mainNavigation: NavItem[] = [
    { name: 'dashboard', href: '/', icon: LayoutDashboard },
    { name: 'database', href: '/database', icon: Database },
    { name: 'crm', href: '/crm', icon: Kanban },
]

const bottomNavigation: NavItem[] = [
    { name: 'settings', href: '/settings', icon: Settings },
]

interface SidebarProps {
    collapsed: boolean
    onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
    const { t } = useTranslation()
    const location = useLocation()

    const renderNavItem = (item: NavItem) => {
        const isActive = location.pathname === item.href ||
            (item.href !== '/' && location.pathname.startsWith(item.href))

        return (
            <NavLink
                key={item.name}
                to={item.href}
                className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                    'transition-all duration-150 ease-out',
                    isActive
                        ? 'bg-[hsl(var(--sidebar-fg))] text-[hsl(var(--sidebar-bg))]'
                        : 'text-[hsl(var(--sidebar-fg))] opacity-70 hover:opacity-100 hover:bg-[hsl(var(--sidebar-fg))/0.1]',
                    collapsed && 'justify-center'
                )}
                title={collapsed ? item.name : undefined}
            >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{t(`nav.${item.name}`)}</span>}
            </NavLink>
        )
    }

    return (
        <aside
            className={clsx(
                'fixed left-0 top-0 z-40 h-screen bg-[hsl(var(--sidebar-bg))] text-[hsl(var(--sidebar-fg))] border-r border-[hsl(var(--sidebar-border))]',
                'flex flex-col transition-all duration-300 ease-out',
                collapsed ? 'w-[72px]' : 'w-[240px] shadow-2xl'
            )}
        >
            {/* Logo + Toggle at top */}
            <div className={clsx(
                'h-16 flex items-center justify-between border-b border-[hsl(var(--sidebar-border))]',
                collapsed ? 'px-3' : 'px-4'
            )}>
                <div className={clsx(
                    'flex items-center gap-1',
                    collapsed && 'justify-center w-full'
                )}>
                    <span className="text-orange-500 font-bold text-xl">T</span>
                    {!collapsed && (
                        <span className="font-semibold text-lg tracking-tight">IMS</span>
                    )}
                </div>

                {!collapsed && (
                    <button
                        onClick={onToggle}
                        className={clsx(
                            'p-1.5 rounded-lg text-[hsl(var(--sidebar-fg))] opacity-70',
                            'hover:opacity-100 hover:bg-[hsl(var(--sidebar-fg))/0.1]',
                            'transition-all duration-150 ease-out'
                        )}
                        title="Collapse sidebar"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                )}

                {collapsed && (
                    <button
                        onClick={onToggle}
                        className={clsx(
                            'absolute -right-3 top-5 p-1 rounded-full bg-background border border-border shadow-soft',
                            'text-muted-foreground hover:text-foreground',
                            'transition-all duration-150 ease-out'
                        )}
                        title="Expand sidebar"
                    >
                        <ChevronRight className="w-3 h-3" />
                    </button>
                )}
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-thin">
                {mainNavigation.map(renderNavItem)}
            </nav>

            {/* Bottom Navigation (Settings) */}
            <div className="py-3 px-3 border-t border-[hsl(var(--sidebar-border))]">
                {bottomNavigation.map(renderNavItem)}
            </div>
        </aside>
    )
}
