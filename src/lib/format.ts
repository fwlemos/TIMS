/**
 * Brazilian formatting utilities
 */

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
