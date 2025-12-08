import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import { DataTable, Column } from '@/components/shared/DataTable'
import { Modal } from '@/components/shared/Modal'
import { FAB } from '@/components/shared/FAB'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { CompanyForm } from '@/components/database/CompanyForm'
import { useCompanies } from '@/hooks/useCompanies'
import { supabase } from '@/lib/supabase'
import type { Company } from '@/lib/database.types'

export function CompaniesView() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [modalOpen, setModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<Company | null>(null)
    const [deleteItem, setDeleteItem] = useState<{ id: string } | null>(null)

    const {
        companies,
        loading,
        createCompany,
        updateCompany,
        deleteCompany
    } = useCompanies({ type: 'company' })

    const handleRowClick = (item: Company) => {
        navigate(`/database/company/${item.id}`)
    }

    const handleAdd = () => {
        setEditingItem(null)
        setModalOpen(true)
    }

    const handleDeleteClick = (item: Company, e: React.MouseEvent) => {
        e.stopPropagation()
        setDeleteItem({ id: item.id })
    }

    const handleConfirmDelete = async () => {
        if (deleteItem) {
            await deleteCompany(deleteItem.id)
            setDeleteItem(null)
        }
    }

    const handleCloseModal = () => {
        setModalOpen(false)
        setEditingItem(null)
    }

    const handleSubmit = async (data: any) => {
        if (editingItem) {
            const { contact_ids, ...companyData } = data
            await updateCompany(editingItem.id, companyData)

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
            }
        } else {
            const { contact_ids, ...companyData } = data
            const newCompany = await createCompany(companyData)

            if (newCompany && contact_ids && contact_ids.length > 0) {
                await supabase
                    .from('contacts')
                    .update({ company_id: newCompany.id })
                    .in('id', contact_ids)
            }
        }
        handleCloseModal()
    }

    const columns: Column<Company>[] = [
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
                data={companies}
                columns={columns}
                keyField="id"
                onRowClick={handleRowClick}
                loading={loading}
                searchPlaceholder={t('database.searchCompanies')}
                emptyMessage={t('database.noCompanies')}
            />

            <FAB
                onClick={handleAdd}
                label={t('database.addCompany')}
            />

            <Modal
                isOpen={modalOpen}
                onClose={handleCloseModal}
                title={editingItem ? 'Edit Company' : 'New Company'}
                size="lg"
            >
                <CompanyForm
                    company={editingItem}
                    onSubmit={handleSubmit}
                    onCancel={handleCloseModal}
                />
            </Modal>

            <ConfirmDialog
                isOpen={!!deleteItem}
                onClose={() => setDeleteItem(null)}
                onConfirm={handleConfirmDelete}
                title="Delete Company"
                message="Are you sure you want to delete this company? This action cannot be undone."
                confirmLabel="Delete"
                variant="danger"
            />
        </>
    )
}
