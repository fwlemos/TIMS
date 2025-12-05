import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { clsx } from 'clsx'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function AppShell() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('sidebarCollapsed') === 'true'
        }
        return false
    })
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    // Persist sidebar state
    useEffect(() => {
        localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed))
    }, [sidebarCollapsed])

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false)
    }, [location.pathname])

    // Initialize theme from localStorage
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme')
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark')
        } else if (savedTheme === 'light') {
            document.documentElement.classList.remove('dark')
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark')
        }
    }, [])

    return (
        <div className="min-h-screen bg-background">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block">
                <Sidebar
                    collapsed={sidebarCollapsed}
                    onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                />
            </div>

            {/* Mobile Sidebar Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <div
                className={clsx(
                    'fixed inset-y-0 left-0 z-40 lg:hidden transition-transform duration-300 ease-out',
                    mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <Sidebar
                    collapsed={false}
                    onToggle={() => setMobileMenuOpen(false)}
                />
            </div>

            {/* Main Content */}
            <div
                className={clsx(
                    'transition-all duration-300 ease-out',
                    'lg:ml-[240px]',
                    sidebarCollapsed && 'lg:ml-[72px]'
                )}
            >
                <Header
                    showMenuButton
                    onMenuClick={() => setMobileMenuOpen(true)}
                />

                <main className="p-4 lg:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
