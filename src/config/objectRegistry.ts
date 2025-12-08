import { z } from 'zod';

export type ObjectFieldType = 'text' | 'number' | 'email' | 'url' | 'tel' | 'textarea' | 'date' | 'select' | 'boolean' | 'json' | 'relational';

export interface RelationalFieldConfig {
    entityType: string; // e.g., 'company', 'manufacturer'
    entityLabel: string;
    displayFields: string[];
    searchFields: string[];
}

export interface ObjectField {
    name: string;
    label: string;
    type: ObjectFieldType;
    required?: boolean;
    placeholder?: string;
    options?: { label: string; value: string }[]; // For select
    readonly?: boolean;
    relationalConfig?: RelationalFieldConfig; // For relational fields
}

export interface ObjectConfig {
    label: string;
    table: string; // Supabase table name
    fields: ObjectField[];
    schema: z.ZodObject<any>;
}

export const objectRegistry: Record<string, ObjectConfig> = {
    company: {
        label: 'Company',
        table: 'companies',
        fields: [
            { name: 'name', label: 'Company Name', type: 'text', required: true, placeholder: 'Acme Corp' },
            { name: 'tax_id', label: 'Tax ID (CNPJ)', type: 'text', placeholder: '00.000.000/0000-00' },
            { name: 'email', label: 'Email', type: 'email', placeholder: 'contact@company.com' },
            { name: 'phone', label: 'Phone', type: 'tel', placeholder: '+55 11 99999-9999' },
            { name: 'website', label: 'Website', type: 'url', placeholder: 'https://example.com' },
            { name: 'address', label: 'Address', type: 'text', placeholder: 'Full address' },
            { name: 'observation', label: 'Notes', type: 'textarea', placeholder: 'Additional notes...' },
        ],
        schema: z.object({
            name: z.string().min(1, 'Name is required'),
            tax_id: z.string().optional().nullable(),
            email: z.string().email('Invalid email').optional().nullable().or(z.literal('')),
            phone: z.string().optional().nullable(),
            website: z.string().url('Invalid URL').optional().nullable().or(z.literal('')),
            address: z.string().optional().nullable(),
            observation: z.string().optional().nullable(),
        })
    },
    contact: {
        label: 'Contact',
        table: 'contacts',
        fields: [
            { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'John Doe' },
            { name: 'email', label: 'Email', type: 'email', placeholder: 'john@example.com' },
            { name: 'phone', label: 'Phone', type: 'tel', placeholder: '+55 11 99999-9999' },
            { name: 'job_title', label: 'Job Title', type: 'text', placeholder: 'Manager' },
            {
                name: 'company_id',
                label: 'Company',
                type: 'relational',
                relationalConfig: {
                    entityType: 'company',
                    entityLabel: 'Company',
                    displayFields: ['name'],
                    searchFields: ['name'],
                }
            },
            { name: 'observation', label: 'Notes', type: 'textarea', placeholder: 'Additional notes...' },
        ],
        schema: z.object({
            name: z.string().min(1, 'Name is required'),
            email: z.string().email('Invalid email').optional().nullable().or(z.literal('')),
            phone: z.string().optional().nullable(),
            job_title: z.string().optional().nullable(),
            company_id: z.string().uuid().optional().nullable(),
            observation: z.string().optional().nullable(),
        })
    },
    product: {
        label: 'Product',
        table: 'products',
        fields: [
            { name: 'name', label: 'Product Name', type: 'text', required: true, placeholder: 'Widget X' },
            { name: 'sku', label: 'SKU', type: 'text', placeholder: 'WID-001' },
            { name: 'ncm', label: 'NCM', type: 'text', placeholder: '0000.00.00' },
            {
                name: 'manufacturer_id',
                label: 'Manufacturer',
                type: 'relational',
                relationalConfig: {
                    entityType: 'manufacturer',
                    entityLabel: 'Manufacturer',
                    displayFields: ['name'],
                    searchFields: ['name'],
                }
            },
            { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Product details...' },
            { name: 'catalog_url', label: 'Catalog URL', type: 'url', placeholder: 'https://...' },
        ],
        schema: z.object({
            name: z.string().min(1, 'Name is required'),
            sku: z.string().optional().nullable(),
            ncm: z.string().optional().nullable(),
            manufacturer_id: z.string().uuid().optional().nullable(),
            description: z.string().optional().nullable(),
            catalog_url: z.string().url('Invalid URL').optional().nullable().or(z.literal('')),
        })
    },
    manufacturer: {
        label: 'Manufacturer',
        table: 'companies', // Manufacturers are stored in companies table
        fields: [
            { name: 'name', label: 'Manufacturer Name', type: 'text', required: true, placeholder: 'Factory Inc.' },
            { name: 'manufacturer_primary_ncm', label: 'Primary NCM', type: 'text' },
            { name: 'manufacturer_catalog_url', label: 'Catalog URL', type: 'url' },
            { name: 'manufacturer_contract_validity', label: 'Contract Validity', type: 'text', placeholder: 'e.g. 2026-12-31' },
            { name: 'observation', label: 'Notes', type: 'textarea' },
        ],
        // Note: For manufacturer, we might want to enforce 'type'='manufacturer' on save?
        // But the form just updates fields.
        schema: z.object({
            name: z.string().min(1, 'Name is required'),
            manufacturer_primary_ncm: z.string().optional().nullable(),
            manufacturer_catalog_url: z.string().url('Invalid URL').optional().nullable().or(z.literal('')),
            manufacturer_contract_validity: z.string().optional().nullable(),
            observation: z.string().optional().nullable(),
        })
    }
};

export const getObjectConfig = (type: string | undefined): ObjectConfig | null => {
    if (!type) return null;
    const key = type.toLowerCase();
    if (key === 'client') return objectRegistry.contact;
    if (key === 'company') return objectRegistry.company;
    if (key === 'contact') return objectRegistry.contact;
    if (key === 'product') return objectRegistry.product;
    if (key === 'manufacturer') return objectRegistry.manufacturer;

    // Fallback if direct match exists
    return objectRegistry[key] || null;
};
