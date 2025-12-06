import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { clsx } from 'clsx'
import { Users, Building2, Package, Factory, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { DataTable, Column } from '@/components/shared/DataTable'
import { Modal } from '@/components/shared/Modal'
import { FAB } from '@/components/shared/FAB'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ContactForm } from '@/components/database/ContactForm'
import { CompanyForm } from '@/components/database/CompanyForm'
import { ProductForm } from '@/components/database/ProductForm'
import { ManufacturerForm } from '@/components/database/ManufacturerForm'
import { useContacts } from '@/hooks/useContacts'
import { useCompanies } from '@/hooks/useCompanies'
import { useProducts } from '@/hooks/useProducts'

import type { Contact, Company, Product, Manufacturer } from '@/lib/database.types'

type TabType = 'contacts' | 'companies' | 'products' | 'manufacturers'

const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'companies', label: 'Companies', icon: Building2 },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'manufacturers', label: 'Manufacturers', icon: Factory },
]

export default function Database() {
    const { t } = useTranslation()
    const [activeTab, setActiveTab] = useState<TabType>('contacts')
    const [modalOpen, setModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<Contact | Company | Product | Manufacturer | null>(null)
    const [deleteItem, setDeleteItem] = useState<{ id: string; type: TabType } | null>(null)
    const [deleteLoading, setDeleteLoading] = useState(false)

    const contacts = useContacts()
    const companies = useCompanies()
    const products = useProducts()
    const {
        companies: manufacturerList,
        loading: manufacturersLoading,
        createCompany: createManufacturer,
        updateCompany: updateManufacturer,
        deleteCompany: deleteManufacturer,
        isContractExpired,
        isContractExpiringSoon
    } = useCompanies({ type: 'manufacturer' })

    const manufacturers = {
        manufacturers: manufacturerList,
        loading: manufacturersLoading,
        createManufacturer,
        updateManufacturer,
        deleteManufacturer,
        isContractExpired,
        isContractExpiringSoon
    }

    const handleRowClick = (item: Contact | Company | Product | Manufacturer) => {
        setEditingItem(item)
        setModalOpen(true)
    }

    const handleAdd = () => {
        setEditingItem(null)
        setModalOpen(true)
    }

    const handleCloseModal = () => {
        setModalOpen(false)
        setEditingItem(null)
    }

    const handleCreateContact = async (data: Parameters<typeof contacts.createContact>[0]) => {
        await contacts.createContact(data)
        handleCloseModal()
    }

    const handleUpdateContact = async (data: Parameters<typeof contacts.updateContact>[1]) => {
        if (editingItem) {
            await contacts.updateContact(editingItem.id, data)
            handleCloseModal()
        }
    }

    const handleCreateCompany = async (data: any) => {
        const { contact_ids, ...companyData } = data
        const newCompany = await companies.createCompany(companyData)

        if (newCompany && contact_ids && contact_ids.length > 0) {
            await supabase
                .from('contacts')
                .update({ company_id: newCompany.id })
                .in('id', contact_ids)
        }
        handleCloseModal()
    }

    const handleUpdateCompany = async (data: any) => {
        if (editingItem) {
            const { contact_ids, ...companyData } = data
            await companies.updateCompany(editingItem.id, companyData)

            if (contact_ids) {
                // Unlink removed contacts
                await supabase
                    .from('contacts')
                    .update({ company_id: null })
                    .eq('company_id', editingItem.id)
                    .not('id', 'in', `(${contact_ids.join(',')})`)

                // Link added contacts
                if (contact_ids.length > 0) {
                    await supabase
                        .from('contacts')
                        .update({ company_id: editingItem.id })
                        .in('id', contact_ids)
                }
            } else {
                // If contact_ids explicit undefined/null, maybe do nothing?
                // Current form sends contact_ids always when submitting.
            }
            handleCloseModal()
        }
    }

    const handleCreateProduct = async (data: Parameters<typeof products.createProduct>[0]) => {
        await products.createProduct(data)
        handleCloseModal()
    }

    const handleUpdateProduct = async (data: Parameters<typeof products.updateProduct>[1]) => {
        if (editingItem) {
            await products.updateProduct(editingItem.id, data)
            handleCloseModal()
        }
    }

    const handleCreateManufacturer = async (data: any) => {
        const { contact_ids, product_ids, ...manufacturerData } = data
        const newManufacturer = await manufacturers.createManufacturer(manufacturerData)

        if (newManufacturer) {
            if (contact_ids && contact_ids.length > 0) {
                await supabase
                    .from('contacts')
                    .update({ company_id: newManufacturer.id })
                    .in('id', contact_ids)
            }
            if (product_ids && product_ids.length > 0) {
                await supabase
                    .from('products')
                    .update({ manufacturer_id: newManufacturer.id })
                    .in('id', product_ids)
            }
        }
        handleCloseModal()
    }

    const handleUpdateManufacturer = async (data: any) => {
        if (editingItem) {
            const { contact_ids, product_ids, ...manufacturerData } = data
            await manufacturers.updateManufacturer(editingItem.id, manufacturerData)

            if (contact_ids) {
                if (contact_ids.length > 0) {
                    await supabase
                        .from('contacts')
                        .update({ company_id: editingItem.id })
                        .in('id', contact_ids)

                    await supabase
                        .from('contacts')
                        .update({ company_id: null })
                        .eq('company_id', editingItem.id)
                        .not('id', 'in', `(${contact_ids.join(',')})`)
                } else {
                    await supabase
                        .from('contacts')
                        .update({ company_id: null })
                        .eq('company_id', editingItem.id)
                }
            }

            if (product_ids) {
                if (product_ids.length > 0) {
                    await supabase
                        .from('products')
                        .update({ manufacturer_id: editingItem.id })
                        .in('id', product_ids)

                    await supabase
                        .from('products')
                        .update({ manufacturer_id: null })
                        .eq('manufacturer_id', editingItem.id)
                        .not('id', 'in', `(${product_ids.join(',')})`)
                } else {
                    await supabase
                        .from('products')
                        .update({ manufacturer_id: null })
                        .eq('manufacturer_id', editingItem.id)
                }
            }
            handleCloseModal()
        }
    }

    const handleDelete = async () => {
        if (!deleteItem) return

        setDeleteLoading(true)
        try {
            switch (deleteItem.type) {
                case 'contacts':
                    await contacts.deleteContact(deleteItem.id)
                    break
                case 'companies':
                    await companies.deleteCompany(deleteItem.id)
                    break
                case 'products':
                    await products.deleteProduct(deleteItem.id)
                    break
                case 'manufacturers':
                    await manufacturers.deleteManufacturer(deleteItem.id)
                    break
            }
        } finally {
            setDeleteLoading(false)
            setDeleteItem(null)
        }
    }

    // Column definitions
    const contactColumns: Column<Contact & { company?: { name: string } | null }>[] = [
        { key: 'name', header: 'Name', sortable: true },
        {
            key: 'company',
            header: 'Company',
            render: (item) => item.company?.name || '-'
        },
        { key: 'email', header: 'Email', sortable: true },
        { key: 'phone', header: 'Phone' },
        {
            key: 'actions',
            header: '',
            className: 'w-12',
            render: (item) => (
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        setDeleteItem({ id: item.id, type: 'contacts' })
                    }}
                    className="p-2 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                    title={t('common.delete')}
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )
        },
    ]

    const companyColumns: Column<Company>[] = [
        { key: 'name', header: 'Name', sortable: true },
        { key: 'tax_id', header: 'Tax ID' },
        { key: 'phone', header: 'Phone' },
        { key: 'website', header: 'Website' },
        {
            key: 'actions',
            header: '',
            className: 'w-12',
            render: (item) => (
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        setDeleteItem({ id: item.id, type: 'companies' })
                    }}
                    className="p-2 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                    title={t('common.delete')}
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )
        },
    ]

    const productColumns: Column<Product & { manufacturer?: { name: string } | null }>[] = [
        { key: 'name', header: 'Name', sortable: true },
        {
            key: 'manufacturer',
            header: 'Manufacturer',
            render: (item) => item.manufacturer?.name || '-'
        },
        { key: 'ncm', header: 'NCM' },
        {
            key: 'actions',
            header: '',
            className: 'w-12',
            render: (item) => (
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        setDeleteItem({ id: item.id, type: 'products' })
                    }}
                    className="p-2 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                    title={t('common.delete')}
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )
        },
    ]

    const manufacturerColumns: Column<Manufacturer>[] = [
        { key: 'name', header: 'Name', sortable: true },
        {
            key: 'manufacturer_exclusivity',
            header: 'Exclusivity',
            render: (item) => (
                <span className={clsx(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    item.manufacturer_exclusivity
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-muted text-muted-foreground'
                )}>
                    {item.manufacturer_exclusivity ? 'Yes' : 'No'}
                </span>
            )
        },
        {
            key: 'manufacturer_contract_validity',
            header: 'Contract Valid Until',
            render: (item) => {
                if (!item.manufacturer_contract_validity) return '-'
                const date = new Date(item.manufacturer_contract_validity)
                const isExpired = manufacturers.isContractExpired(item)
                const isExpiring = manufacturers.isContractExpiringSoon(item)

                return (
                    <span className={clsx(
                        isExpired && 'text-destructive',
                        isExpiring && !isExpired && 'text-yellow-600 dark:text-yellow-400'
                    )}>
                        {date.toLocaleDateString()}
                        {isExpired && ' (Expired)'}
                        {isExpiring && !isExpired && ' (Expiring soon)'}
                    </span>
                )
            }
        },
        { key: 'phone', header: 'Phone' },
        {
            key: 'actions',
            header: '',
            className: 'w-12',
            render: (item) => (
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        setDeleteItem({ id: item.id, type: 'manufacturers' })
                    }}
                    className="p-2 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                    title={t('common.delete')}
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )
        },
    ]

    const getModalTitle = () => {
        const entity = activeTab.slice(0, -1)
        const capitalizedEntity = entity.charAt(0).toUpperCase() + entity.slice(1)
        return editingItem ? `Edit ${capitalizedEntity}` : `New ${capitalizedEntity}`
    }

    const renderForm = () => {
        switch (activeTab) {
            case 'contacts':
                return (
                    <ContactForm
                        contact={editingItem as Contact | null}
                        onSubmit={editingItem ? handleUpdateContact : handleCreateContact}
                        onCancel={handleCloseModal}
                    />
                )
            case 'companies':
                return (
                    <CompanyForm
                        company={editingItem as Company | null}
                        onSubmit={editingItem ? handleUpdateCompany : handleCreateCompany}
                        onCancel={handleCloseModal}
                    />
                )
            case 'products':
                return (
                    <ProductForm
                        product={editingItem as Product | null}
                        onSubmit={editingItem ? handleUpdateProduct : handleCreateProduct}
                        onCancel={handleCloseModal}
                    />
                )
            case 'manufacturers':
                return (
                    <ManufacturerForm
                        manufacturer={editingItem as Manufacturer | null}
                        onSubmit={editingItem ? handleUpdateManufacturer : handleCreateManufacturer}
                        onCancel={handleCloseModal}
                    />
                )
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold">{t('database.title')}</h1>
                <p className="text-muted-foreground mt-1">
                    {t('database.description')}
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={clsx(
                            'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium',
                            'transition-all duration-150',
                            activeTab === tab.id
                                ? 'bg-background text-foreground shadow-soft'
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {t(`database.${tab.id}`)}
                    </button>
                ))}
            </div>

            {/* Content */}
            {activeTab === 'contacts' && (
                <DataTable
                    data={contacts.contacts as (Contact & { company?: { name: string } | null })[]}
                    columns={contactColumns}
                    keyField="id"
                    onRowClick={handleRowClick}
                    loading={contacts.loading}
                    searchPlaceholder={t('database.searchContacts')}
                    emptyMessage={t('database.noContacts')}
                />
            )}

            {activeTab === 'companies' && (
                <DataTable
                    data={companies.companies}
                    columns={companyColumns}
                    keyField="id"
                    onRowClick={handleRowClick}
                    loading={companies.loading}
                    searchPlaceholder={t('database.searchCompanies')}
                    emptyMessage={t('database.noCompanies')}
                />
            )}

            {activeTab === 'products' && (
                <DataTable
                    data={products.products as (Product & { manufacturer?: { name: string } | null })[]}
                    columns={productColumns}
                    keyField="id"
                    onRowClick={handleRowClick}
                    loading={products.loading}
                    searchPlaceholder={t('database.searchProducts')}
                    emptyMessage={t('database.noProducts')}
                />
            )}

            {activeTab === 'manufacturers' && (
                <DataTable
                    data={manufacturers.manufacturers}
                    columns={manufacturerColumns}
                    keyField="id"
                    onRowClick={handleRowClick}
                    loading={manufacturers.loading}
                    searchPlaceholder={t('database.searchManufacturers')}
                    emptyMessage={t('database.noManufacturers')}
                />
            )}

            {/* FAB */}
            <FAB
                onClick={handleAdd}
                label={t(`database.add${activeTab === 'companies' ? 'Company' :
                    activeTab === 'contacts' ? 'Contact' :
                        activeTab === 'products' ? 'Product' : 'Manufacturer'}`)}
            />

            {/* Modal for Add/Edit */}
            <Modal
                isOpen={modalOpen}
                onClose={handleCloseModal}
                title={getModalTitle()}
                size="lg"
            >
                {renderForm()}
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={!!deleteItem}
                onClose={() => setDeleteItem(null)}
                onConfirm={handleDelete}
                title="Delete Item"
                message="Are you sure you want to delete this item? This action cannot be undone."
                confirmLabel="Delete"
                variant="danger"
                loading={deleteLoading}
            />
        </div>
    )
}
