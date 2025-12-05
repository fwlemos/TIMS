import { useState, useMemo, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { useCompanies } from '@/hooks/useCompanies'
import { useDocuments } from '@/hooks/useDocuments'
import { RelationalField, FormField, NestedFieldsConfig, RelationalOption } from '@/components/shared/RelationalField'
import { DocumentsList } from '@/components/documents/DocumentsList'
import { supabase } from '@/lib/supabase'
import type { Product, InsertTables } from '@/lib/database.types'

const productSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    manufacturer_id: z.string().uuid().optional().nullable(),
    description: z.string().optional(),
    ncm: z.string().optional(),
    catalog_url: z.string().url('Invalid URL').optional().or(z.literal('')),
})

type ProductFormData = z.infer<typeof productSchema>

interface ProductFormProps {
    product?: Product | null
    onSubmit: (data: InsertTables<'products'>) => Promise<void>
    onCancel: () => void
}

const manufacturerFormSchema: FormField[] = [
    { name: 'name', label: 'Manufacturer Name', type: 'text', required: true, placeholder: 'Enter manufacturer name...' },
    { name: 'tax_id', label: 'Tax ID', type: 'text' },
    { name: 'phone', label: 'Phone', type: 'tel' },
    { name: 'website', label: 'Website', type: 'url' },
    { name: 'manufacturer_contract_validity', label: 'Contract Validity', type: 'date' },
    { name: 'manufacturer_exclusivity', label: 'Exclusivity Agreement', type: 'checkbox' },
    { name: 'observation', label: 'Observation', type: 'textarea' },
]

export function ProductForm({ product, onSubmit, onCancel }: ProductFormProps) {
    const { companies: manufacturers, createCompany: createManufacturer, refetch: refetchManufacturers } = useCompanies({ type: 'manufacturer' })
    const [manufacturerSearch, setManufacturerSearch] = useState('')
    const [selectedManufacturerId, setSelectedManufacturerId] = useState<string | null>(product?.manufacturer_id || null)

    // Pre-generate ID for new products to allow document uploads before save
    const [entityId] = useState(() => product?.id || crypto.randomUUID())
    const isEditing = !!product

    // For cleanup on cancel
    const { documents } = useDocuments(entityId, 'products')

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ProductFormData>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: product?.name || '',
            manufacturer_id: product?.manufacturer_id || null,
            description: product?.description || '',
            ncm: product?.ncm || '',
            catalog_url: product?.catalog_url || '',
        },
    })

    const handleFormSubmit = async (data: ProductFormData) => {
        // Use the pre-generated ID for new products
        const productData: InsertTables<'products'> & { id?: string } = {
            id: isEditing ? undefined : entityId,
            ...data,
            manufacturer_id: selectedManufacturerId,
            description: data.description || null,
            ncm: data.ncm || null,
            catalog_url: data.catalog_url || null,
        }

        await onSubmit(productData as InsertTables<'products'>)
    }

    const handleCancel = async () => {
        // If new product with documents, clean them up
        if (!isEditing && documents.length > 0) {
            try {
                // Fetch and delete orphaned documents
                const { data: docs } = await supabase
                    .from('documents')
                    .select('id, file_url')
                    .eq('entity_id', entityId)
                    .eq('entity_type', 'products')

                if (docs && docs.length > 0) {
                    // Delete from storage
                    await supabase.storage
                        .from('documents')
                        .remove(docs.map(d => d.file_url))

                    // Delete from DB
                    await supabase
                        .from('documents')
                        .delete()
                        .eq('entity_id', entityId)
                        .eq('entity_type', 'products')
                }
            } catch (error) {
                console.error('Error cleaning up documents:', error)
            }
        }
        onCancel()
    }

    const manufacturerOptions = useMemo(() =>
        manufacturers
            .filter(m => m.name.toLowerCase().includes(manufacturerSearch.toLowerCase()))
            .map(m => ({
                id: m.id,
                primaryText: m.name,
                secondaryText: m.tax_id || undefined,
            })),
        [manufacturers, manufacturerSearch]
    )

    const handleCreateManufacturer = useCallback(async (data: Record<string, unknown>): Promise<string | null> => {
        const result = await createManufacturer({
            name: data.name as string,
            type: 'manufacturer',
            tax_id: (data.tax_id as string) || null,
            phone: (data.phone as string) || null,
            website: (data.website as string) || null,
            manufacturer_contract_validity: (data.manufacturer_contract_validity as string) || null,
            manufacturer_exclusivity: !!data.manufacturer_exclusivity,
            observation: (data.observation as string) || null,
        })
        return result?.id || null
    }, [createManufacturer])

    const getManufacturerDisplay = useCallback((id: string): RelationalOption | undefined => {
        const manufacturer = manufacturers.find(m => m.id === id)
        return manufacturer ? {
            id: manufacturer.id,
            primaryText: manufacturer.name,
            secondaryText: manufacturer.tax_id || undefined
        } : undefined
    }, [manufacturers])

    const nestedFieldsConfig: NestedFieldsConfig = useMemo(() => ({
        manufacturer: {
            options: manufacturerOptions,
            onSearch: setManufacturerSearch,
            onCreate: handleCreateManufacturer,
            onRefresh: refetchManufacturers,
            getRecordDisplay: getManufacturerDisplay,
        },
    }), [manufacturerOptions, handleCreateManufacturer, refetchManufacturers, getManufacturerDisplay])

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-1.5">
                    Product Name <span className="text-destructive">*</span>
                </label>
                <input
                    {...register('name')}
                    className="input"
                    placeholder="Product name"
                />
                {errors.name && (
                    <p className="text-destructive text-sm mt-1">{errors.name.message}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium mb-1.5">Manufacturer</label>
                <RelationalField
                    entityType="manufacturer"
                    entityLabel="Manufacturer"
                    displayFields={['name']}
                    searchFields={['name', 'tax_id']}
                    nestedFormSchema={manufacturerFormSchema}
                    value={selectedManufacturerId}
                    onChange={(val) => setSelectedManufacturerId(val as string | null)}
                    options={manufacturerOptions}
                    onSearch={setManufacturerSearch}
                    onCreate={handleCreateManufacturer}
                    onRefresh={refetchManufacturers}
                    getRecordDisplay={getManufacturerDisplay}
                    canCreate
                    nestedFieldsConfig={nestedFieldsConfig}
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1.5">NCM Code</label>
                <input
                    {...register('ncm')}
                    className="input"
                    placeholder="0000.00.00"
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1.5">Description</label>
                <textarea
                    {...register('description')}
                    className="input min-h-[60px] resize-y"
                    placeholder="Product description..."
                />
            </div>

            {/* Documents Section */}
            <div className="pt-4 border-t border-border">
                <DocumentsList entityId={entityId} entityType="products" />
            </div>

            <div className="flex gap-3 justify-end pt-4">
                <button type="button" onClick={handleCancel} className="btn-outline">
                    Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="btn-primary">
                    {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : product ? (
                        'Save Changes'
                    ) : (
                        'Create Product'
                    )}
                </button>
            </div>
        </form>
    )
}
