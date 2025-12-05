import { clsx } from 'clsx'
import { Plus } from 'lucide-react'

interface FABProps {
    onClick: () => void
    label?: string
    className?: string
}

export function FAB({ onClick, label = 'Add new', className }: FABProps) {
    return (
        <button
            onClick={onClick}
            className={clsx(
                'fixed bottom-6 right-6 z-30',
                'flex items-center gap-2 px-4 py-3 rounded-full',
                'bg-primary text-primary-foreground shadow-soft-lg',
                'hover:shadow-xl hover:scale-105 active:scale-100',
                'transition-all duration-200 ease-out',
                className
            )}
            title={label}
        >
            <Plus className="w-5 h-5" />
            <span className="font-medium hidden sm:inline">{label}</span>
        </button>
    )
}
