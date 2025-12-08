import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthState {
    user: User | null
    session: Session | null
    loading: boolean
}

interface AuthContextType extends AuthState {
    signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>
    signInWithGoogle: () => Promise<{ error: AuthError | null }>
    signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Domain restriction - only allow specific emails
const ALLOWED_DOMAIN = import.meta.env.VITE_ALLOWED_DOMAIN || 'tennessine.com.br'

function isAllowedEmail(email: string): boolean {
    // Only allow bypass if explicitly enabled via environment variable
    if (import.meta.env.VITE_ALLOW_ANY_EMAIL === 'true') {
        return true
    }
    return email.endsWith(`@${ALLOWED_DOMAIN}`)
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>({
        user: null,
        session: null,
        loading: true,
    })

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setState({
                user: session?.user ?? null,
                session,
                loading: false,
            })
        })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                setState({
                    user: session?.user ?? null,
                    session,
                    loading: false,
                })
            }
        )

        return () => subscription.unsubscribe()
    }, [])

    useEffect(() => {
        if (import.meta.env.VITE_ALLOW_ANY_EMAIL === 'true') {
            console.warn(
                '%c SECURITY WARNING: Domain restriction is DISABLED via VITE_ALLOW_ANY_EMAIL. \nThis should NEVER be enabled in production.',
                'background: #ff0000; color: #ffffff; font-size: 14px; padding: 4px; border-radius: 4px;'
            )
        }
    }, [])

    const signInWithEmail = async (email: string, password: string) => {
        if (!isAllowedEmail(email)) {
            return {
                error: {
                    message: `Only @${ALLOWED_DOMAIN} emails are allowed`,
                    status: 403,
                } as AuthError,
            }
        }

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        return { error }
    }

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                queryParams: {
                    hd: ALLOWED_DOMAIN, // Restrict to domain in Google OAuth
                },
            },
        })
        return { error }
    }

    const signUp = async (email: string, password: string) => {
        if (!isAllowedEmail(email)) {
            return {
                error: {
                    message: `Only @${ALLOWED_DOMAIN} emails are allowed`,
                    status: 403,
                } as AuthError,
            }
        }

        const { error } = await supabase.auth.signUp({
            email,
            password,
        })
        return { error }
    }

    const signOut = async () => {
        await supabase.auth.signOut()
    }

    return (
        <AuthContext.Provider
            value={{
                ...state,
                signInWithEmail,
                signInWithGoogle,
                signUp,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
