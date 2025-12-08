import type { Opportunity } from '@/lib/database.types'
import { LEAD_ORIGIN_OPTIONS } from '@/constants/options'

export interface StageField {
    name: string
    label: string
    type: 'display' | 'select' | 'text' | 'number' | 'date' | 'textarea' | 'file' | 'contact' | 'products'
    required?: boolean
    options?: { value: string; label: string }[]
    getValue: (opportunity: Opportunity) => string | null | undefined
    placeholder?: string
}

export interface StageFieldsConfig {
    stageKey: string
    fields: StageField[]
    placeholder?: string
}

export const STAGE_FIELDS: StageFieldsConfig[] = [
    {
        stageKey: 'lead_backlog',
        fields: [
            {
                name: 'contact',
                label: 'Contact',
                type: 'contact', // Specialized type, falls back to display in simple views
                required: true,
                getValue: (opp) => (opp as Record<string, unknown>).contact_id as string | null,
            },
            {
                name: 'product',
                label: 'Product',
                type: 'products', // Specialized type
                required: true,
                getValue: (opp) => {
                    const oppWithProducts = opp as Opportunity & { products?: Array<{ id: string }> }
                    return oppWithProducts.products?.map(p => p.id).join(',') || (opp as Record<string, unknown>).product_id as string | null
                },
            },
            {
                name: 'lead_origin',
                label: 'Lead Origin',
                type: 'select',
                required: true,
                options: LEAD_ORIGIN_OPTIONS,
                getValue: (opp) => opp.lead_origin,
                placeholder: 'Select lead origin...',
            },
        ],
    },
    {
        stageKey: 'qualification',
        fields: [
            {
                name: 'type_of_sale',
                label: 'Type of Sale',
                type: 'select',
                options: [
                    { value: 'Direct Importation', label: 'Direct Importation' },
                    { value: 'Nationalized', label: 'Nationalized' },
                    { value: 'Commissioned', label: 'Commissioned' },
                ],
                getValue: (opp) => opp.type_of_sale,
                placeholder: 'Select type...',
            },
        ],
    },
    {
        stageKey: 'quotation',
        fields: [
            {
                name: 'net_price',
                label: 'Net Price',
                type: 'number',
                getValue: (opp) => opp.net_price?.toString(),
                placeholder: '0.00',
            },
            {
                name: 'sales_price',
                label: 'Sales Price',
                type: 'number',
                getValue: (opp) => opp.sales_price?.toString(),
                placeholder: '0.00',
            },
        ],
    },
    {
        stageKey: 'closing',
        fields: [
            {
                name: 'expected_close_date',
                label: 'Estimated Close Date',
                type: 'date',
                getValue: (opp) => opp.expected_close_date,
            },
        ],
    },
    {
        stageKey: 'won',
        fields: [
            {
                name: 'won_purchase_order_url',
                label: 'Purchase Order',
                type: 'file',
                getValue: (opp) => opp.won_purchase_order_url,
                placeholder: 'Upload Purchase Order',
            },
            {
                name: 'won_order_description',
                label: 'Order Agreement',
                type: 'textarea',
                getValue: (opp) => opp.won_order_description,
                placeholder: 'Describe the order agreement...',
            },
        ],
    },
]
