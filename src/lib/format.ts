/**
 * Brazilian formatting utilities
 */

/**
 * Format currency in Brazilian Real (R$ 1.234,56)
 */
export function formatCurrency(value: number | null | undefined, currency: string = 'BRL'): string {
    if (value === null || value === undefined) return '-'

    // Handle specific locale/currency combinations if needed
    // Defaulting to pt-BR locale but using the provided currency code
    return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: currency,
    })
}
