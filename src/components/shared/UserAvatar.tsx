import { clsx } from 'clsx'

interface UserAvatarProps {
    name?: string | null
    email?: string | null
    imageUrl?: string | null
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

/**
 * Get initials from a name or email
 */
function getInitials(name?: string | null, email?: string | null): string {
    if (name) {
        const words = name.trim().split(/\s+/)
        if (words.length >= 2) {
            return (words[0][0] + words[words.length - 1][0]).toUpperCase()
        }
        return name.substring(0, 2).toUpperCase()
    }
    if (email) {
        const localPart = email.split('@')[0]
        // Remove numbers and special chars, take first 2 chars
        const clean = localPart.replace(/[^a-zA-Z]/g, '')
        return clean.substring(0, 2).toUpperCase() || '??'
    }
    return '??'
}

/**
 * Generate a consistent color based on string input
 */
function getAvatarColor(identifier: string): string {
    const colors = [
        'bg-blue-500',
        'bg-green-500',
        'bg-purple-500',
        'bg-orange-500',
        'bg-pink-500',
        'bg-teal-500',
        'bg-indigo-500',
        'bg-rose-500',
        'bg-cyan-500',
        'bg-amber-500',
    ]

    let hash = 0
    for (let i = 0; i < identifier.length; i++) {
        hash = identifier.charCodeAt(i) + ((hash << 5) - hash)
    }

    return colors[Math.abs(hash) % colors.length]
}

const sizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
}

export function UserAvatar({ name, email, imageUrl, size = 'md', className }: UserAvatarProps) {
    const initials = getInitials(name, email)
    const identifier = name || email || 'unknown'
    const bgColor = getAvatarColor(identifier)

    if (imageUrl) {
        return (
            <img
                src={imageUrl}
                alt={name || email || 'User avatar'}
                className={clsx(
                    'rounded-full object-cover ring-2 ring-background',
                    sizeClasses[size],
                    className
                )}
            />
        )
    }

    return (
        <div
            className={clsx(
                'rounded-full flex items-center justify-center font-semibold text-white ring-2 ring-background',
                sizeClasses[size],
                bgColor,
                className
            )}
            title={name || email || 'Unknown user'}
        >
            {initials}
        </div>
    )
}
