import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export interface User {
    id: string
    email?: string
    name?: string
}

export function useUsers() {
    const { user } = useAuth()
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // In the future, this would fetch from a profiles table
        // For now, we just expose the current user
        if (user) {
            setUsers([{
                id: user.id,
                email: user.email,
                name: user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown User'
            }])
        } else {
            setUsers([])
        }
        setLoading(false)
    }, [user])

    return {
        users,
        loading,
        currentUser: user
    }
}
