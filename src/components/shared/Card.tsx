import { ReactNode } from 'react'
import { clsx } from 'clsx'

interface CardProps {
    children: ReactNode
    className?: string
    variant?: 'default' | 'soft' | 'outline'
    padding?: 'none' | 'sm' | 'md' | 'lg'
    hover?: boolean
    onClick?: () => void
}

const variantClasses = {
    default: 'bg-card text-card-foreground border border-border shadow-soft',
    soft: 'bg-card text-card-foreground border-0 shadow-soft-md',
    outline: 'bg-transparent border border-border',
}

const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
}

export function Card({
    children,
    className,
    variant = 'default',
    padding = 'md',
    hover = false,
    onClick,
}: CardProps) {
    const Component = onClick ? 'button' : 'div'

    return (
        <Component
            onClick={onClick}
            className={clsx(
                'rounded-xl',
                variantClasses[variant],
                paddingClasses[padding],
                hover && 'transition-all duration-150 hover:shadow-soft-lg hover:border-primary/20',
                onClick && 'cursor-pointer text-left w-full',
                className
            )}
        >
            {children}
        </Component>
    )
}

interface CardHeaderProps {
    children: ReactNode
    className?: string
}

export function CardHeader({ children, className }: CardHeaderProps) {
    return (
        <div className={clsx('flex items-center justify-between mb-4', className)}>
            {children}
        </div>
    )
}

interface CardTitleProps {
    children: ReactNode
    className?: string
}

export function CardTitle({ children, className }: CardTitleProps) {
    return (
        <h3 className={clsx('font-semibold text-lg', className)}>
            {children}
        </h3>
    )
}

interface CardDescriptionProps {
    children: ReactNode
    className?: string
}

export function CardDescription({ children, className }: CardDescriptionProps) {
    return (
        <p className={clsx('text-sm text-muted-foreground', className)}>
            {children}
        </p>
    )
}

interface CardContentProps {
    children: ReactNode
    className?: string
}

export function CardContent({ children, className }: CardContentProps) {
    return <div className={className}>{children}</div>
}

interface CardFooterProps {
    children: ReactNode
    className?: string
}

export function CardFooter({ children, className }: CardFooterProps) {
    return (
        <div className={clsx('flex items-center gap-3 mt-4 pt-4 border-t border-border', className)}>
            {children}
        </div>
    )
}
