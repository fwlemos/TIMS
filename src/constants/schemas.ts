import { FormField } from '@/components/shared/RelationalField/types'

export const manufacturerFormSchema: FormField[] = [
    { name: 'name', label: 'Manufacturer Name', type: 'text', required: true, placeholder: 'Enter manufacturer name...' },
    { name: 'tax_id', label: 'Tax ID (CNPJ/EIN)', type: 'text', placeholder: 'Enter Tax ID' },
    { name: 'address', label: 'Address', type: 'text', placeholder: 'Enter full address' },
    { name: 'phone', label: 'Phone', type: 'tel', placeholder: '(00) 00000-0000' },
    { name: 'website', label: 'Website', type: 'url', placeholder: 'https://example.com' },
]

export const companyFormSchema: FormField[] = [
    { name: 'name', label: 'Company Name', type: 'text', required: true, placeholder: 'Enter company name...' },
    { name: 'tax_id', label: 'Tax ID (CNPJ/EIN)', type: 'text', placeholder: 'Enter Tax ID' },
    { name: 'address', label: 'Address', type: 'text', placeholder: 'Enter full address' },
    { name: 'phone', label: 'Phone', type: 'tel', placeholder: '(00) 00000-0000' },
    { name: 'website', label: 'Website', type: 'url', placeholder: 'https://example.com' },
]

export const contactFormSchema: FormField[] = [
    { name: 'name', label: 'Contact Name', type: 'text', required: true, placeholder: 'Enter name...' },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'email@example.com' },
    { name: 'phone', label: 'Phone', type: 'tel', placeholder: '(00) 00000-0000' },
    {
        name: 'company_id',
        label: 'Company',
        type: 'relational',
        relationalConfig: {
            entityType: 'company',
            entityLabel: 'Company',
            displayFields: ['name'],
            searchFields: ['name'],
            nestedFormSchema: companyFormSchema,
        }
    },
]

export const productFormSchema: FormField[] = [
    { name: 'name', label: 'Product Name', type: 'text', required: true, placeholder: 'Enter product name...' },
    { name: 'technical_description', label: 'Technical Description', type: 'textarea', placeholder: 'Enter technical details...' },
    { name: 'ncm', label: 'NCM Code', type: 'text', placeholder: '0000.00.00' },
    {
        name: 'manufacturer_id',
        label: 'Manufacturer',
        type: 'relational',
        required: true,
        relationalConfig: {
            entityType: 'manufacturer',
            entityLabel: 'Manufacturer',
            displayFields: ['name'],
            searchFields: ['name'],
            nestedFormSchema: manufacturerFormSchema,
        }
    },
]
