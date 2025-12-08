import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getObjectConfig, ObjectField } from '@/config/objectRegistry';
import { Button } from '@/components/shared/Button';
import { RelationalField, RelationalOption, FormField as RelationalFormField } from '@/components/shared/RelationalField';
import { useCompanies } from '@/hooks/useCompanies';
import { Edit2, Save, Building2, Factory } from 'lucide-react';

interface ObjectFormProps {
    type: string | undefined;
    data: any;
    onSave: (data: any) => Promise<any>;
}

// Minimal form schemas for relational field creation (if enabled)
const companyFormSchema: RelationalFormField[] = [
    { name: 'name', label: 'Company Name', type: 'text', required: true, placeholder: 'Enter company name...' },
    { name: 'phone', label: 'Phone', type: 'tel', placeholder: '(00) 00000-0000' },
];

const manufacturerFormSchema: RelationalFormField[] = [
    { name: 'name', label: 'Manufacturer Name', type: 'text', required: true, placeholder: 'Enter manufacturer name...' },
];

export function ObjectForm({ type, data, onSave }: ObjectFormProps) {
    const config = getObjectConfig(type);
    const [isEditing, setIsEditing] = useState(false);

    // Hooks for relational fields
    const { companies, createCompany, refetch: refetchCompanies } = useCompanies({ type: 'company' });
    const { companies: manufacturers, createCompany: createManufacturer, refetch: refetchManufacturers } = useCompanies({ type: 'manufacturer' });

    // Search states
    const [companySearch, setCompanySearch] = useState('');
    const [manufacturerSearch, setManufacturerSearch] = useState('');

    // Safety check for invalid config
    if (!type || !config) return <div className="p-4 text-destructive">Invalid object type: {type}</div>;

    const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(config.schema),
        defaultValues: data || {}
    });

    useEffect(() => {
        if (data) {
            reset(data);
        }
    }, [data, reset]);

    const onSubmit = async (formData: any) => {
        const result = await onSave(formData);
        if (!result?.error) {
            setIsEditing(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        reset(data);
    };

    // Relational field options
    const companyOptions = useMemo(() =>
        companies
            .filter(c => c.name.toLowerCase().includes(companySearch.toLowerCase()))
            .map(c => ({
                id: c.id,
                primaryText: c.name,
                secondaryText: c.phone || c.address || undefined,
            })),
        [companies, companySearch]
    );

    const manufacturerOptions = useMemo(() =>
        manufacturers
            .filter(m => m.name.toLowerCase().includes(manufacturerSearch.toLowerCase()))
            .map(m => ({
                id: m.id,
                primaryText: m.name,
            })),
        [manufacturers, manufacturerSearch]
    );

    // Get display functions
    const getCompanyDisplay = useCallback((id: string): RelationalOption | undefined => {
        const company = companies.find(c => c.id === id);
        return company ? { id: company.id, primaryText: company.name, secondaryText: company.phone || undefined } : undefined;
    }, [companies]);

    const getManufacturerDisplay = useCallback((id: string): RelationalOption | undefined => {
        const manufacturer = manufacturers.find(m => m.id === id);
        return manufacturer ? { id: manufacturer.id, primaryText: manufacturer.name } : undefined;
    }, [manufacturers]);

    // Create handlers
    const handleCreateCompany = useCallback(async (formData: Record<string, unknown>): Promise<string | null> => {
        const result = await createCompany({ name: formData.name as string, phone: formData.phone as string || null });
        return result?.id || null;
    }, [createCompany]);

    const handleCreateManufacturer = useCallback(async (formData: Record<string, unknown>): Promise<string | null> => {
        const result = await createManufacturer({ name: formData.name as string, type: 'manufacturer' });
        return result?.id || null;
    }, [createManufacturer]);

    // Render a relational field
    const renderRelationalField = (field: ObjectField, value: string | null, onChange: (val: string | string[] | null) => void) => {
        const entityType = field.relationalConfig?.entityType;

        if (entityType === 'company') {
            return (
                <RelationalField
                    entityType="company"
                    entityLabel="Company"
                    displayFields={['name']}
                    searchFields={['name']}
                    nestedFormSchema={companyFormSchema}
                    value={value}
                    onChange={onChange}
                    options={companyOptions}
                    onSearch={setCompanySearch}
                    onCreate={handleCreateCompany}
                    onRefresh={refetchCompanies}
                    getRecordDisplay={getCompanyDisplay}
                    disabled={!isEditing}
                    canCreate={isEditing}
                />
            );
        }

        if (entityType === 'manufacturer') {
            return (
                <RelationalField
                    entityType="manufacturer"
                    entityLabel="Manufacturer"
                    displayFields={['name']}
                    searchFields={['name']}
                    nestedFormSchema={manufacturerFormSchema}
                    value={value}
                    onChange={onChange}
                    options={manufacturerOptions}
                    onSearch={setManufacturerSearch}
                    onCreate={handleCreateManufacturer}
                    onRefresh={refetchManufacturers}
                    getRecordDisplay={getManufacturerDisplay}
                    disabled={!isEditing}
                    canCreate={isEditing}
                />
            );
        }

        // Fallback for unknown relational types
        return <div className="p-2.5 bg-muted/20 rounded text-sm text-muted-foreground">Unknown relational type: {entityType}</div>;
    };

    // Get icon for relational field
    const getRelationalIcon = (entityType: string | undefined) => {
        if (entityType === 'company') return <Building2 className="w-4 h-4 text-muted-foreground" />;
        if (entityType === 'manufacturer') return <Factory className="w-4 h-4 text-muted-foreground" />;
        return null;
    };

    return (
        <div className="bg-card rounded-lg border shadow-sm p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold capitalize">{config.label} Details</h2>
                    {data?.updated_at && <p className="text-xs text-muted-foreground mt-1">Last updated: {new Date(data.updated_at).toLocaleString()}</p>}
                </div>
                {!isEditing ? (
                    <Button variant="outline" onClick={() => setIsEditing(true)} leftIcon={<Edit2 className="w-4 h-4" />}>
                        Edit
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={handleCancel} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit(onSubmit)} loading={isSubmitting} leftIcon={<Save className="w-4 h-4" />}>
                            Save
                        </Button>
                    </div>
                )}
            </div>

            <form className="space-y-4 flex-1 overflow-y-auto pr-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {config.fields.map(field => {
                        const isFullWidth = field.type === 'textarea';
                        const isRelational = field.type === 'relational';
                        return (
                            <div key={field.name} className={isFullWidth ? "col-span-1 md:col-span-2" : "col-span-1"}>
                                <label className="block text-sm font-medium mb-1.5 flex items-center gap-2">
                                    {isRelational && getRelationalIcon(field.relationalConfig?.entityType)}
                                    {field.label} {field.required && <span className="text-destructive">*</span>}
                                </label>
                                <Controller
                                    control={control}
                                    name={field.name}
                                    render={({ field: { value, onChange } }) => {
                                        // Relational Field
                                        if (isRelational) {
                                            return renderRelationalField(field, value, (val) => onChange(Array.isArray(val) ? val[0] : val));
                                        }

                                        // View Mode for non-relational
                                        if (!isEditing) {
                                            return (
                                                <div className="p-2.5 bg-muted/20 rounded min-h-[42px] flex items-center text-sm">
                                                    {value ? (
                                                        <span className="whitespace-pre-wrap">{value}</span>
                                                    ) : (
                                                        <span className="text-muted-foreground italic text-xs">Empty</span>
                                                    )}
                                                </div>
                                            );
                                        }

                                        // Edit Mode
                                        if (field.type === 'textarea') {
                                            return (
                                                <textarea
                                                    className="input min-h-[100px] resize-y w-full"
                                                    value={value || ''}
                                                    onChange={onChange}
                                                    placeholder={field.placeholder}
                                                />
                                            );
                                        }

                                        return (
                                            <input
                                                className="input w-full"
                                                type={field.type === 'number' ? 'number' : 'text'}
                                                value={value || ''}
                                                onChange={onChange}
                                                placeholder={field.placeholder}
                                            />
                                        );
                                    }}
                                />
                                {errors[field.name] && (
                                    <p className="text-destructive text-sm mt-1">{errors[field.name]?.message as string}</p>
                                )}
                            </div>
                        )
                    })}
                </div>
            </form>
        </div>
    );
}
