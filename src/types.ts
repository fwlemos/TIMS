import type { Opportunity, PipelineStage } from '@/lib/database.types'

export type Stage = PipelineStage

export interface OpportunityWithRelations extends Opportunity {
    contact?: {
        id: string
        name: string
        email?: string | null
        phone?: string | null
        company?: {
            id: string
            name: string
        } | null
    } | null
    company?: {
        id: string
        name: string
        address?: string | null
        phone?: string | null
    } | null
    // Legacy single product (deprecated)
    product?: {
        id: string
        name: string
        ncm?: string | null
        manufacturer?: {
            id: string
            name: string
        } | null
    } | null
    // New: multiple products via junction table
    products?: Array<{
        id: string
        name: string
        ncm?: string | null
        manufacturer?: {
            id: string
            name: string
        } | null
    }>
    stage?: PipelineStage | null
}
