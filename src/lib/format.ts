/**
 * Brazilian formatting utilities
 * Uses DD/MM/YYYY dates and 1.234,56 numbers
 */

/**
 * Format a number in Brazilian format (1.234,56)
 */
export function formatNumber(value: number | null | undefined, decimals = 2): string {
    if (value === null || value === undefined) return '-'
    return value.toLocaleString('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    })
}

/**
 * Format currency in Brazilian Real (R$ 1.234,56)
 */
export function formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined) return '-'
    return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    })
}

/**
 * Format a date in Brazilian format (DD/MM/YYYY)
 */
export function formatDate(date: string | Date | null | undefined): string {
    if (!date) return '-'
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('pt-BR')
}

/**
 * Format a date with time in Brazilian format (DD/MM/YYYY HH:MM)
 */
export function formatDateTime(date: string | Date | null | undefined): string {
    if (!date) return '-'
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

/**
 * Parse a Brazilian formatted number string (1.234,56) to number
 */
export function parseBrazilianNumber(value: string): number {
    return parseFloat(value.replace(/\./g, '').replace(',', '.'))
}
