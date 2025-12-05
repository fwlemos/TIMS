import { useState, useEffect } from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { clsx } from 'clsx'

type Theme = 'light' | 'dark' | 'system'

export function ThemeToggle() {
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('theme') as Theme | null
            return stored || 'system'
        }
        return 'system'
    })

    useEffect(() => {
        const root = document.documentElement

        const applyTheme = (newTheme: Theme) => {
            if (newTheme === 'system') {
                const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
                root.classList.toggle('dark', systemDark)
            } else {
                root.classList.toggle('dark', newTheme === 'dark')
            }
        }

        applyTheme(theme)
        localStorage.setItem('theme', theme)

        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        const handleChange = () => {
            if (theme === 'system') {
                applyTheme('system')
            }
        }

        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
    }, [theme])

    const cycleTheme = () => {
        setTheme((prev) => {
            if (prev === 'light') return 'dark'
            if (prev === 'dark') return 'system'
            return 'light'
        })
    }

    const getIcon = () => {
        if (theme === 'light') return Sun
        if (theme === 'dark') return Moon
        return Monitor
    }

    const Icon = getIcon()

    return (
        <button
            onClick={cycleTheme}
            className={clsx(
                'p-2.5 rounded-lg transition-colors',
                'hover:bg-accent text-muted-foreground hover:text-foreground'
            )}
            title={`Theme: ${theme}`}
        >
            <Icon className="w-5 h-5" />
        </button>
    )
}
