import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import { Moon, Sun, User, LogOut, ChevronDown, Menu } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { GlobalSearch } from '@/components/shared/GlobalSearch'

interface HeaderProps {
    onMenuClick?: () => void
    showMenuButton?: boolean
}

export function Header({ onMenuClick, showMenuButton }: HeaderProps) {
    const [showUserMenu, setShowUserMenu] = useState(false)
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            return document.documentElement.classList.contains('dark')
        }
        return false
    })

    const userMenuRef = useRef<HTMLDivElement>(null)
    const { user, signOut } = useAuth()
    const navigate = useNavigate()

    // Close user menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const toggleTheme = () => {
        const newIsDark = !isDark
        setIsDark(newIsDark)
        document.documentElement.classList.toggle('dark', newIsDark)
        localStorage.setItem('theme', newIsDark ? 'dark' : 'light')
    }

    const handleSignOut = async () => {
        await signOut()
        navigate('/login')
    }

    // Get user initials for avatar
    const userInitials = user?.email
        ?.split('@')[0]
        .split('.')
        .map((n) => n[0]?.toUpperCase())
        .join('')
        .slice(0, 2) || 'U'

    return (
        <header className="h-16 bg-[hsl(var(--header-bg))] text-[hsl(var(--header-fg))] border-b border-[hsl(var(--header-border))] flex items-center justify-between px-4 lg:px-6">
            {/* Left side - Menu button (mobile) + Search */}
            <div className="flex items-center gap-4 flex-1">
                {showMenuButton && (
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2 rounded-lg hover:bg-[hsl(var(--header-fg))/0.1] transition-colors"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                )}

                {/* Global Search */}
                <GlobalSearch />
            </div>

            {/* Right side - Theme toggle + User menu */}
            <div className="flex items-center gap-2">
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2.5 rounded-lg hover:bg-[hsl(var(--header-fg))/0.1] transition-colors"
                    title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                    {isDark ? (
                        <Sun className="w-5 h-5" />
                    ) : (
                        <Moon className="w-5 h-5" />
                    )}
                </button>

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className={clsx(
                            'flex items-center gap-2 p-1.5 pr-3 rounded-lg transition-colors',
                            'hover:bg-[hsl(var(--header-fg))/0.1]',
                            showUserMenu && 'bg-[hsl(var(--header-fg))/0.1]'
                        )}
                    >
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                            {userInitials}
                        </div>
                        <ChevronDown className={clsx(
                            'w-4 h-4 transition-transform duration-200',
                            'text-[hsl(var(--header-fg))] opacity-70',
                            showUserMenu && 'rotate-180'
                        )} />
                    </button>

                    {/* Dropdown */}
                    {showUserMenu && (
                        <div className="absolute right-0 top-full mt-2 w-56 py-1 bg-[hsl(var(--header-bg))] text-[hsl(var(--header-fg))] border border-[hsl(var(--header-border))] rounded-xl shadow-soft-lg animate-fade-in z-50">
                            <div className="px-4 py-3 border-b border-[hsl(var(--header-border))]">
                                <p className="text-sm font-medium truncate">{user?.email}</p>
                                <p className="text-xs opacity-70">Tennessine</p>
                            </div>

                            <div className="py-1">
                                <button
                                    onClick={() => {
                                        setShowUserMenu(false)
                                        navigate('/settings')
                                    }}
                                    className="flex items-center gap-3 w-full px-4 py-2 text-sm hover:bg-[hsl(var(--header-fg))/0.1] transition-colors"
                                >
                                    <User className="w-4 h-4" />
                                    Settings
                                </button>
                                <button
                                    onClick={handleSignOut}
                                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
