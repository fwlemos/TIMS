import { UseFormSetError, FieldValues, Path } from 'react-hook-form'

interface PostgrestError {
    code: string
    details: string
    hint: string
    message: string
}

function isPostgrestError(error: unknown): error is PostgrestError {
    return (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        'message' in error
    )
}

/**
 * Parses a Supabase/PostgreSQL error and returns structured error info.
 * Returns either { field: string, message: string } for field errors,
 * or a string for global errors.
 */
export function parseSupabaseError(error: unknown): { field: string, message: string } | string {
    console.error('Supabase Error:', error)

    if (!isPostgrestError(error)) {
        return error instanceof Error ? error.message : 'An unexpected error occurred'
    }

    // Unique Constraint Violation
    if (error.code === '23505') {
        const details = error.details || ''
        const message = error.message || ''

        // Strategy 1: Match "Key (column_name)=(value) already exists" in details
        const match = details.match(/Key \(([^)]+)\)=/)
        if (match && match[1]) {
            const columnName = match[1]
            return {
                field: columnName,
                message: `There's already a registered record with this ${columnName.replace(/_/g, ' ')}`
            }
        }

        // Strategy 2: Match constraint name in message
        if (message.includes('_name_unique')) {
            return { field: 'name', message: 'There is already a registered record with this name' }
        }
        if (message.includes('_tax_id_unique')) {
            return { field: 'tax_id', message: 'There is already a registered record with this Tax ID' }
        }
        if (message.includes('_email_unique')) {
            return { field: 'email', message: 'There is already a registered record with this email' }
        }
        if (message.includes('_ncm_unique')) {
            return { field: 'ncm', message: 'There is already a registered record with this NCM code' }
        }

        return 'A record with these details already exists.'
    }

    return error.message
}

/**
 * Handles Supabase/PostgreSQL errors and maps them to form fields where possible.
 * Returns a string if the error should be displayed as a global toast, or null if handled on a field.
 */
export function handleSupabaseError<T extends FieldValues>(
    error: unknown,
    setError?: UseFormSetError<T>
): string | null {
    const parsed = parseSupabaseError(error)

    if (typeof parsed === 'string') {
        return parsed
    }

    if (setError) {
        setError(parsed.field as Path<T>, {
            type: 'manual',
            message: parsed.message,
        })
        return null
    }

    return parsed.message
}
