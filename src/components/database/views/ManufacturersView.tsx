import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import { clsx } from 'clsx'
import { DataTable, Column } from '@/components/shared/DataTable'
import { Modal } from '@/components/shared/Modal'
import { FAB } from '@/components/shared/FAB'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ManufacturerForm } from '@/components/database/ManufacturerForm'
import { useCompanies } from '@/hooks/useCompanies'
import { supabase } from '@/lib/supabase'
import type { Manufacturer } from '@/lib/database.types'

export function ManufacturersView() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [modalOpen, setModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<Manufacturer | null>(null)
    const [deleteItem, setDeleteItem] = useState<{ id: string } | null>(null)

    const {
        companies: manufacturers,
        loading,
        createCompany: createManufacturer,
        updateCompany: updateManufacturer,
        deleteCompany: deleteManufacturer,
        isContractExpired,
        isContractExpiringSoon
    } = useCompanies({ type: 'manufacturer' })

    const handleRowClick = (item: Manufacturer) => {
        navigate(`/database/manufacturer/${item.id}`)
    }

    const handleAdd = () => {
        setEditingItem(null)
        setModalOpen(true)
    }

    const handleDeleteClick = (item: Manufacturer, e: React.MouseEvent) => {
        e.stopPropagation()
        setDeleteItem({ id: item.id })
    }

    const handleConfirmDelete = async () => {
        if (deleteItem) {
            await deleteManufacturer(deleteItem.id)
            setDeleteItem(null)
        }
    }

    const handleCloseModal = () => {
        setModalOpen(false)
        setEditingItem(null)
    }

    const handleSubmit = async (data: any) => {
        if (editingItem) {
            const { contact_ids, product_ids, ...manufacturerData } = data
            await updateManufacturer(editingItem.id, manufacturerData)

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
        } else {
            const { contact_ids, product_ids, ...manufacturerData } = data
            const newManufacturer = await createManufacturer(manufacturerData)

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
        }
        handleCloseModal()
    }

    const columns: Column<Manufacturer>[] = [
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
                const isExpired = isContractExpired(item)
                const isExpiring = isContractExpiringSoon(item)

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
                    onClick={(e) => handleDeleteClick(item, e)}
                    className="p-2 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                    title={t('common.delete')}
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )
        },
    ]

    return (
        <>
            <DataTable
                data={manufacturers as Manufacturer[]}
                columns={columns}
                keyField="id"
                onRowClick={handleRowClick}
                loading={loading}
                searchPlaceholder={t('database.searchManufacturers')}
                emptyMessage={t('database.noManufacturers')}
            />

            <FAB
                onClick={handleAdd}
                label={t('database.addManufacturer')}
            />

            <Modal
                isOpen={modalOpen}
                onClose={handleCloseModal}
                title={editingItem ? 'Edit Manufacturer' : 'New Manufacturer'}
                size="lg"
            >
                <ManufacturerForm
                    manufacturer={editingItem}
                    onSubmit={handleSubmit}
                    onCancel={handleCloseModal}
                />
            </Modal>

            <ConfirmDialog
                isOpen={!!deleteItem}
                onClose={() => setDeleteItem(null)}
                onConfirm={handleConfirmDelete}
                title="Delete Manufacturer"
                message="Are you sure you want to delete this manufacturer? This action cannot be undone."
                confirmLabel="Delete"
                variant="danger"
            />
        </>
    )
}
