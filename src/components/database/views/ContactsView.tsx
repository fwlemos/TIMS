import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import { DataTable, Column } from '@/components/shared/DataTable'
import { Modal } from '@/components/shared/Modal'
import { FAB } from '@/components/shared/FAB'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ContactForm } from '@/components/database/ContactForm'
import { useContacts } from '@/hooks/useContacts'
import type { Contact } from '@/lib/database.types'

export function ContactsView() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [modalOpen, setModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<Contact | null>(null)
    const [deleteItem, setDeleteItem] = useState<{ id: string } | null>(null)

    const {
        contacts,
        loading,
        createContact,
        updateContact,
        deleteContact
    } = useContacts()

    const handleRowClick = (item: Contact) => {
        navigate(`/database/contact/${item.id}`)
    }

    const handleAdd = () => {
        setEditingItem(null)
        setModalOpen(true)
    }

    const handleEdit = (item: Contact, e: React.MouseEvent) => {
        e.stopPropagation()
        setEditingItem(item)
        setModalOpen(true)
    }

    const handleDeleteClick = (item: Contact, e: React.MouseEvent) => {
        e.stopPropagation()
        setDeleteItem({ id: item.id })
    }

    const handleConfirmDelete = async () => {
        if (deleteItem) {
            await deleteContact(deleteItem.id)
            setDeleteItem(null)
        }
    }

    const handleCloseModal = () => {
        setModalOpen(false)
        setEditingItem(null)
    }

    const handleSubmit = async (data: Parameters<typeof createContact>[0]) => {
        if (editingItem) {
            await updateContact(editingItem.id, data)
        } else {
            await createContact(data)
        }
        handleCloseModal()
    }

    const columns: Column<Contact & { company?: { name: string } | null }>[] = [
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
                data={contacts as (Contact & { company?: { name: string } | null })[]}
                columns={columns}
                keyField="id"
                onRowClick={handleRowClick}
                loading={loading}
                searchPlaceholder={t('database.searchContacts')}
                emptyMessage={t('database.noContacts')}
            />

            <FAB
                onClick={handleAdd}
                label={t('database.addContact')}
            />

            <Modal
                isOpen={modalOpen}
                onClose={handleCloseModal}
                title={editingItem ? 'Edit Contact' : 'New Contact'}
                size="lg"
            >
                <ContactForm
                    contact={editingItem}
                    onSubmit={handleSubmit}
                    onCancel={handleCloseModal}
                />
            </Modal>

            <ConfirmDialog
                isOpen={!!deleteItem}
                onClose={() => setDeleteItem(null)}
                onConfirm={handleConfirmDelete}
                title="Delete Contact"
                message="Are you sure you want to delete this contact? This action cannot be undone."
                confirmLabel="Delete"
                variant="danger"
            />
        </>
    )
}
