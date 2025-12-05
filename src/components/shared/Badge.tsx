import { clsx } from 'clsx'

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline'

interface BadgeProps {
    children: React.ReactNode
    variant?: BadgeVariant
    className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
    default: 'bg-muted text-muted-foreground',
    primary: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    destructive: 'bg-destructive/10 text-destructive',
    outline: 'border border-border bg-transparent',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
    return (
        <span
            className={clsx(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                'transition-colors duration-150',
                variantClasses[variant],
                className
            )}
        >
            {children}
        </span>
    )
}
